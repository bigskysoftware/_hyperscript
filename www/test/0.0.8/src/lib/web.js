///=========================================================================
/// This module provides the core web functionality for hyperscript
///=========================================================================
(function(){

    function mergeObjects(obj1, obj2) {
        for (var key in obj2) {
            if (obj2.hasOwnProperty(key)) {
                obj1[key] = obj2[key];
            }
        }
        return obj1;
    }

    _hyperscript.addCommand("settle", function(parser, runtime, tokens) {
        if (tokens.matchToken("settle")) {

            if (!parser.commandBoundary(tokens.currentToken())) {
                var on = parser.requireElement("expression", tokens);
            } else {
                var on = parser.requireElement("implicitMeTarget", tokens);
            }

            var settleCommand = {
                type: "settleCmd",
                args: [on],
                op: function (context, on) {
                    var resolve = null;
                    var resolved = false;
                    var transitionStarted = false;

                    var promise = new Promise(function (r) {
                        resolve = r;
                    });

                    // listen for a transition begin
                    on.addEventListener('transitionstart', function () {
                        transitionStarted = true;
                    }, {once: true});

                    // if no transition begins in 500ms, cancel
                    setTimeout(function () {
                        if (!transitionStarted && !resolved) {
                            resolve(runtime.findNext(settleCommand, context));
                        }
                    }, 500);

                    // continue on a transition emd
                    on.addEventListener('transitionend', function () {
                        if (!resolved) {
                            resolve(runtime.findNext(settleCommand, context));
                        }
                    }, {once: true});
                    return promise;

                },
                execute: function (context) {
                    return runtime.unifiedExec(this, context);
                }
            };
            return settleCommand
        }
    })

    _hyperscript.addCommand("add", function(parser, runtime, tokens) {
        if (tokens.matchToken("add")) {
            var classRef = parser.parseElement("classRef", tokens);
            var attributeRef = null;
			var cssDeclaration = null;
            if (classRef == null) {
                attributeRef = parser.parseElement("attributeRef", tokens);
                if (attributeRef == null) {
					cssDeclaration = parser.parseElement("objectLiteral", tokens);
                    if (cssDeclaration == null) {
                    	parser.raiseParseError(tokens, "Expected either a class reference or attribute expression")
                    }
                }
            } else {
                var classRefs = [classRef];
                while (classRef = parser.parseElement("classRef", tokens)) {
                    classRefs.push(classRef);
                }
            }

            if (tokens.matchToken("to")) {
                var to = parser.requireElement("targetExpression", tokens);
            } else {
                var to = parser.parseElement("implicitMeTarget", tokens);
            }

            if (classRefs) {
                var addCmd = {
                    classRefs: classRefs,
                    to: to,
                    args: [to],
                    op: function (context, to) {
                        runtime.forEach(classRefs, function (classRef) {
                            runtime.forEach(to, function (target) {
                                target.classList.add(classRef.className());
                            })
                        });
                        return runtime.findNext(this, context);
                    }
                }
            } else if (attributeRef) {
                var addCmd = {
                    type: "addCmd",
                    attributeRef: attributeRef,
                    to: to,
                    args: [to],
                    op: function (context, to, attrRef) {
                        runtime.forEach(to, function (target) {
                            target.setAttribute(attributeRef.name, attributeRef.value);
                        })
                        return runtime.findNext(addCmd, context);
                    },
                    execute: function (ctx) {
                        return runtime.unifiedExec(this, ctx);
                    }
                };
            } else {
	            var addCmd = {
	                type: "addCmd",
					cssDeclaration: cssDeclaration,
	                to: to,
	                args: [to, cssDeclaration],
	                op: function (context, to, css) {
	                    runtime.forEach(to, function (target) {
	                        for (var key in css) {
	                        	if (css.hasOwnProperty(key)) {
	                        		target.style.setProperty(key, css[key]);
	                        	}
	                        }
	                    })
	                    return runtime.findNext(addCmd, context);
	                },
	                execute: function (ctx) {
	                    return runtime.unifiedExec(this, ctx);
	                }
	            };
	        }
            return addCmd
        }
    });

    _hyperscript.addCommand("remove", function(parser, runtime, tokens) {
        if (tokens.matchToken('remove')) {
            var classRef = parser.parseElement("classRef", tokens);
            var attributeRef = null;
            var elementExpr = null;
            if (classRef == null) {
                attributeRef = parser.parseElement("attributeRef", tokens);
                if (attributeRef == null) {
                    elementExpr = parser.parseElement("expression", tokens)
                    if (elementExpr == null) {
                        parser.raiseParseError(tokens, "Expected either a class reference, attribute expression or value expression");
                    }
                }
            } else {
                var classRefs = [classRef];
                while (classRef = parser.parseElement("classRef", tokens)) {
                    classRefs.push(classRef);
                }
            }

            if (tokens.matchToken("from")) {
                var from = parser.requireElement("targetExpression", tokens);
            } else {
                var from = parser.requireElement("implicitMeTarget", tokens);
            }

            if (elementExpr) {
                var removeCmd = {
                    elementExpr: elementExpr,
                    from: from,
                    args: [elementExpr],
                    op: function (context, element) {
                        runtime.forEach(element, function (target) {
                            target.parentElement.removeChild(target);
                        })
                        return runtime.findNext(this, context);
                    }
                };
            } else {
                var removeCmd = {
                    classRefs: classRefs,
                    attributeRef: attributeRef,
                    elementExpr: elementExpr,
                    from: from,
                    args: [from],
                    op: function (context, from) {
                        if (this.classRefs) {
                            runtime.forEach(classRefs, function (classRef) {
                                runtime.forEach(from, function (target) {
                                    target.classList.remove(classRef.className());
                                })
                            });
                        } else {
                            runtime.forEach(from, function (target) {
                                target.removeAttribute(attributeRef.name);
                            })
                        }
                        return runtime.findNext(this, context);
                    }
                };

            }
            return removeCmd
        }
    });

    _hyperscript.addCommand("toggle", function(parser, runtime, tokens) {
        if (tokens.matchToken('toggle')) {

            if (tokens.matchToken('between')) {
                var between = true;
                var classRef = parser.parseElement("classRef", tokens);
                tokens.requireToken("and");
                var classRef2 = parser.requireElement("classRef", tokens);
            } else {
                var classRef = parser.parseElement("classRef", tokens);
                var attributeRef = null;
                if (classRef == null) {
                    attributeRef = parser.parseElement("attributeRef", tokens);
                    if (attributeRef == null) {
                        parser.raiseParseError(tokens, "Expected either a class reference or attribute expression")
                    }
                } else {
                    var classRefs = [classRef];
                    while (classRef = parser.parseElement("classRef", tokens)) {
                        classRefs.push(classRef);
                    }
                }
            }

            if (tokens.matchToken("on")) {
                var on = parser.requireElement("targetExpression", tokens);
            } else {
                var on = parser.requireElement("implicitMeTarget", tokens);
            }

            if (tokens.matchToken("for")) {
                var time = parser.requireElement("timeExpression", tokens);
            } else if (tokens.matchToken("until")) {
                var evt = parser.requireElement("dotOrColonPath", tokens, "Expected event name");
                if (tokens.matchToken("from")) {
                    var from = parser.requireElement("expression", tokens);
                }
            }

            var toggleCmd = {
                classRef: classRef,
                classRef2: classRef2,
                classRefs: classRefs,
                attributeRef: attributeRef,
                on: on,
                time: time,
                evt: evt,
                from: from,
                toggle: function (on) {
                    if (between) {
                        runtime.forEach(on, function (target) {
                            if (target.classList.contains(classRef.className())) {
                                target.classList.remove(classRef.className());
                                target.classList.add(classRef2.className());
                            } else {
                                target.classList.add(classRef.className());
                                target.classList.remove(classRef2.className());
                            }
                        })
                    } else if (this.classRefs) {
                        runtime.forEach(this.classRefs, function (classRef) {
                            runtime.forEach(on, function (target) {
                                target.classList.toggle(classRef.className())
                            });
                        })
                    } else {
                        runtime.forEach(on, function (target) {
                            if (target.hasAttribute(attributeRef.name)) {
                                target.removeAttribute(attributeRef.name);
                            } else {
                                target.setAttribute(attributeRef.name, attributeRef.value)
                            }
                        });
                    }
                },
                args: [on, time, evt, from],
                op: function (context, on, time, evt, from) {
                    if (time) {
                        return new Promise(function (resolve) {
                            toggleCmd.toggle(on);
                            setTimeout(function () {
                                toggleCmd.toggle(on);
                                resolve(runtime.findNext(toggleCmd, context));
                            }, time);
                        });
                    } else if (evt) {
                        return new Promise(function (resolve) {
                            var target = from || context.me;
                            target.addEventListener(evt, function () {
                                toggleCmd.toggle(on);
                                resolve(runtime.findNext(toggleCmd, context));
                            }, {once: true})
                            toggleCmd.toggle(on);
                        });
                    } else {
                        this.toggle(on);
                        return runtime.findNext(toggleCmd, context);
                    }
                }
            };
            return toggleCmd
        }
    })

    var HIDE_SHOW_STRATEGIES = {
        "display": function (op, element, arg) {
            if(arg){
                element.style.display = arg;
            } else if (op === 'hide') {
                element.style.display = 'none';
            } else {
                element.style.display = 'block';
            }
        },
        "visibility": function (op, element, arg) {
            if(arg){
                element.style.visibility = arg;
            } else if (op === 'hide') {
                element.style.visibility = 'hidden';
            } else {
                element.style.visibility = 'visible';
            }
        },
        "opacity": function (op, element, arg) {
            if(arg){
                element.style.opacity = arg;
            } else if (op === 'hide') {
                element.style.opacity = '0';
            } else {
                element.style.opacity = '1';
            }
        }
    }

    var parseShowHideTarget = function (parser, runtime, tokens) {
        var target;
        var currentTokenValue = tokens.currentToken();
        if (currentTokenValue.value === "with" || parser.commandBoundary(currentTokenValue)) {
            target = parser.parseElement("implicitMeTarget", tokens);
        } else {
            target = parser.parseElement("targetExpression", tokens);
        }
        return target;
    }

    var resolveStrategy = function (parser, tokens, name) {
        var configDefault = _hyperscript.config.defaultHideShowStrategy;
        var strategies = HIDE_SHOW_STRATEGIES;
        if (_hyperscript.config.hideShowStrategies) {
            strategies = mergeObjects(strategies, _hyperscript.config.hideShowStrategies); // merge in user provided strategies
        }
        name = name || configDefault || "display";
        var value = strategies[name];
        if (value == null) {
            parser.raiseParseError(tokens, 'Unknown show/hide strategy : ' + name);
        }
        return value;
    }

    _hyperscript.addCommand("hide", function (parser, runtime, tokens) {
        if (tokens.matchToken("hide")) {
            var target = parseShowHideTarget(parser, runtime, tokens);

            var name = null;
            if (tokens.matchToken("with")) {
                name = tokens.requireTokenType("IDENTIFIER").value;
            }
            var hideShowStrategy = resolveStrategy(parser, tokens, name);

            return {
                target: target,
                args: [target],
                op: function (ctx, target) {
                    runtime.forEach(target, function (elt) {
                        hideShowStrategy('hide', elt);
                    });
                    return runtime.findNext(this, ctx);
                }
            }
        }
    });

    _hyperscript.addCommand("show", function (parser, runtime, tokens) {
        if (tokens.matchToken("show")) {
            var target = parseShowHideTarget(parser, runtime, tokens);

            var name = null;
            if (tokens.matchToken("with")) {
                name = tokens.requireTokenType("IDENTIFIER").value;
            }
            var arg = null;
            if (tokens.matchOpToken(":")) {
                var tokenArr = tokens.consumeUntilWhitespace();
                tokens.matchTokenType("WHITESPACE");
                arg = tokenArr.map(function (t) {
                    return t.value
                }).join("");
            }
            var hideShowStrategy = resolveStrategy(parser, tokens, name);

            return {
                target: target,
                args: [target],
                op: function (ctx, target) {
                    runtime.forEach(target, function (elt) {
                        hideShowStrategy('show', elt, arg);
                    });
                    return runtime.findNext(this, ctx);
                }
            }
        }
    });

    _hyperscript.addCommand("trigger", function(parser, runtime, tokens) {
        if (tokens.matchToken('trigger')) {
            var eventName = parser.requireElement("dotOrColonPath", tokens);
            var details = parser.parseElement("namedArgumentList", tokens);

            var triggerCmd = {
                eventName: eventName,
                details: details,
                args: [eventName, details],
                op: function (context, eventNameStr, details) {
                    runtime.triggerEvent(context.me, eventNameStr, details ? details : {});
                    return runtime.findNext(triggerCmd, context);
                }
            };
            return triggerCmd
        }
    })

    _hyperscript.addCommand("take", function(parser, runtime, tokens) {
        if (tokens.matchToken('take')) {
            var classRef = parser.parseElement("classRef", tokens);

            if (tokens.matchToken("from")) {
                var from = parser.requireElement("targetExpression", tokens);
            } else {
                var from = classRef;
            }

            if (tokens.matchToken("for")) {
                var forElt = parser.requireElement("targetExpression", tokens);
            } else {
                var forElt = parser.requireElement("implicitMeTarget", tokens)
            }

            var takeCmd = {
                classRef: classRef,
                from: from,
                forElt: forElt,
                args: [from, forElt],
                op: function (context, from, forElt) {
                    var clazz = this.classRef.css.substr(1)
                    runtime.forEach(from, function (target) {
                        target.classList.remove(clazz);
                    })
                    runtime.forEach(forElt, function (target) {
                        target.classList.add(clazz);
                    });
                    return runtime.findNext(this, context);
                }
            };
            return takeCmd
        }
    })

    function putInto(context, prop, valueToPut){
        if (prop) {
            var value = context[prop];
        } else {
            var value = context;
        }
        if (value instanceof Element || value instanceof HTMLDocument) {
            value.innerHTML = valueToPut;
        } else {
            if (prop) {
                context[prop] = valueToPut;
            } else {
                throw "Don't know how to put a value into " + typeof context;
            }
        }
    }

    _hyperscript.addCommand("put", function(parser, runtime, tokens) {
        if (tokens.matchToken('put')) {
            var value = parser.requireElement("expression", tokens);

            var operationToken = tokens.matchAnyToken("into", "before", "after");

            if (operationToken == null && tokens.matchToken("at")) {
                operationToken = tokens.matchAnyToken("start", "end");
                tokens.requireToken("of");
            }

            if (operationToken == null) {
                parser.raiseParseError(tokens, "Expected one of 'into', 'before', 'at start of', 'at end of', 'after'");
            }
            var target = parser.requireElement("targetExpression", tokens);

            var operation = operationToken.value;

            var symbolWrite = false;
            var root = null;
            var prop = null;
            if (target.type === "propertyAccess" && operation === "into") {
                prop = target.prop.value;
                root = target.root;
            } else if(target.type === "symbol" && operation === "into") {
                symbolWrite = true;
                prop = target.name;
            } else if(target.type === "attributeRef" && operation === "into") {
                var attributeWrite = true;
                prop = target.name;
                root = parser.requireElement('implicitMeTarget', tokens);
            } else if(target.type === "attributeRefAccess" && operation === "into") {
                var attributeWrite = true;
                prop = target.attribute.name;
                root = target.root;
            } else {
                root = target;
            }

            var putCmd = {
                target: target,
                operation: operation,
                symbolWrite: symbolWrite,
                value: value,
                args: [root, value],
                op: function (context, root, valueToPut) {
                    if (symbolWrite) {
                        putInto(context, prop, valueToPut);
                    } else {
                        if (operation === "into") {
                            if (attributeWrite) {
                                runtime.forEach(root, function (elt) {
                                    elt.setAttribute(prop, valueToPut);
                                });
                            } else {
                                runtime.forEach(root, function (elt) {
                                    putInto(elt, prop, valueToPut);
                                });
                            }
                        } else if (operation === "before") {
                            runtime.forEach(root, function (elt) {
                                elt.insertAdjacentHTML('beforebegin', valueToPut);
                            })
                        } else if (operation === "start") {
                            runtime.forEach(root, function (elt) {
                                elt.insertAdjacentHTML('afterbegin', valueToPut);
                            })
                        } else if (operation === "end") {
                            runtime.forEach(root, function (elt) {
                                elt.insertAdjacentHTML('beforeend', valueToPut);
                            })
                        } else if (operation === "after") {
                            runtime.forEach(root, function (elt) {
                                elt.insertAdjacentHTML('afterend', valueToPut);
                            })
                        }
                    }
                    return runtime.findNext(this, context);
                }
            };
            return putCmd
        }
    })

    function parsePseudopossessiveTarget(parser, runtime, tokens) {
    	if (tokens.matchToken('the') ||
            tokens.matchToken('element') ||
            tokens.matchToken('elements') ||
            tokens.currentToken().type === "CLASS_REF" ||
            tokens.currentToken().type === "ID_REF" ||
            (tokens.currentToken().op && tokens.currentToken().value === "<")) {

            parser.possessivesDisabled = true;
            try {
                var targets = parser.parseElement("expression", tokens);
            } finally {
                delete parser.possessivesDisabled;
            }
            // optional possessive
            if (tokens.matchOpToken("'")) {
                tokens.requireToken("s");
            }
        } else if (tokens.currentToken().type === "IDENTIFIER" && tokens.currentToken().value === 'its') {
            var identifier = tokens.matchToken('its');
            var targets =  {
                type: "pseudopossessiveIts",
                token: identifier,
                name: identifier.value,
                evaluate: function (context) {
                    return runtime.resolveSymbol("it", context);
                }
            };
        } else {
            tokens.matchToken('my') || tokens.matchToken('me'); // consume optional 'my'
            var targets = parser.parseElement("implicitMeTarget", tokens);
        }
		return targets;
    }

    _hyperscript.addCommand("transition", function(parser, runtime, tokens) {
        if (tokens.matchToken("transition")) {
        	var targets = parsePseudopossessiveTarget(parser, runtime, tokens);
            
            var properties = [];
            var from = [];
            var to = [];
            var currentToken = tokens.currentToken();
            while (!parser.commandBoundary(currentToken) &&
                     currentToken.value !== "over" &&
                     currentToken.value !== "using") {

                properties.push(parser.requireElement("stringLike", tokens));

                if (tokens.matchToken("from")) {
                    from.push(parser.requireElement("stringLike", tokens));
                } else {
                    from.push(null);
                }
                tokens.requireToken("to");
                to.push(parser.requireElement("stringLike", tokens));
                currentToken = tokens.currentToken();
            }
            if (tokens.matchToken("over")) {
                var over = parser.requireElement("timeExpression", tokens);
            } else if (tokens.matchToken("using")) {
                var using = parser.requireElement("expression", tokens);
            }

            var transition = {
                to: to,
                args: [targets, properties, from, to, using, over],
                op: function (context, targets, properties, from, to, using, over) {
                    var promises = [];
                    runtime.forEach(targets, function(target){
                        var promise = new Promise(function (resolve, reject) {
                            var initialTransition = target.style.transition;
                            if (over) {
                                target.style.transition = 'all ' + over + 'ms ease-in';
                            } else if (using) {
                                target.style.transition = using;
                            } else {
                                target.style.transition = _hyperscript.config.defaultTransition;
                            }
                            var internalData = runtime.getInternalData(target);
                            var computedStyles = getComputedStyle(target);

                            var initialStyles = {};
                            for (var i = 0; i < computedStyles.length; i++) {
                                var name = computedStyles[i];
                                var initialValue = computedStyles[name];
                                initialStyles[name] = initialValue;
                            }

                            // store intitial values
                            if (!internalData.initalStyles) {
                                internalData.initalStyles = initialStyles;
                            }

                            for (var i = 0; i < properties.length; i++) {
                                var property = properties[i];
                                var fromVal = from[i];
                                if (fromVal == 'computed' || fromVal == null) {
                                    target.style[property] = initialStyles[property];
                                } else {
                                    target.style[property] = fromVal;
                                }
                            }
                            // console.log("transition started", transition);
                            setTimeout(function () {
                                var autoProps = [];
                                for (var i = 0; i < properties.length; i++) {
                                    var property = properties[i];
                                    var toVal = to[i];
                                    if (toVal == 'initial') {
                                        var propertyValue = internalData.initalStyles[property];
                                        target.style[property] = propertyValue;
                                    } else {
                                        target.style[property] = toVal;
                                    }
                                    // console.log("set", property, "to", target.style[property], "on", target, "value passed in : ", toVal);
                                }
                                target.addEventListener('transitionend', function () {
                                    // console.log("transition ended", transition);
                                    target.style.transition = initialTransition;
                                    resolve();
                                }, {once:true})
                            }, 5);
                        });
                        promises.push(promise);
                    })
                    return Promise.all(promises).then(function(){
                        return runtime.findNext(transition, context);
                    })
                }
            };
            return transition
        }
    });

	_hyperscript.addCommand('measure', function (parser, runtime, tokens) {
		if (!tokens.matchToken('measure')) return;

        var target = parsePseudopossessiveTarget(parser, runtime, tokens);

		var propsToMeasure = [];
		if (!parser.commandBoundary(tokens.currentToken())) do {
			propsToMeasure.push(tokens.matchTokenType('IDENTIFIER').value);
		} while (tokens.matchOpToken(','));

		return {
			properties: propsToMeasure,
			args: [target],
			op: function (ctx, target) {
				if (0 in target) target = target[0]; // not measuring multiple elts
				var rect = target.getBoundingClientRect();
				var scroll = {
					top: target.scrollTop, left: target.scrollLeft,
					topMax: target.scrollTopMax, leftMax: target.scrollLeftMax,
					height: target.scrollHeight, width: target.scrollWidth,
				};
				
				ctx.result = {
					x: rect.x, y: rect.y,
					left: rect.left, top: rect.top,
					right: rect.right, bottom: rect.bottom,
					width: rect.width, height: rect.height,
					bounds: rect,
					
					scrollLeft: scroll.left, scrollTop: scroll.top,
					scrollLeftMax: scroll.leftMax, scrollTopMax: scroll.topMax,
					scrollWidth: scroll.width, scrollHeight: scroll.height,
					scroll: scroll
				};

				runtime.forEach(propsToMeasure, function(prop) {
					if (prop in ctx.result) ctx[prop] = ctx.result[prop];
					else throw "No such measurement as " + prop
				})

				return runtime.findNext(this, ctx);
			}
		}
	})

    _hyperscript.addLeafExpression('closestExpr', function (parser, runtime, tokens) {
        if (tokens.matchToken('closest')) {
            if (tokens.matchToken('parent')) {
                var parentSearch = true;
            }
            var expr = parser.parseElement("targetExpression", tokens);
            if (expr.css == null) {
                parser.raiseParseError(tokens, "Expected a CSS expression");
            }
            if (tokens.matchToken('to')) {
                var to = parser.parseElement("targetExpression", tokens);
            } else {
                var to = parser.parseElement("implicitMeTarget", tokens);
            }
            return {
                type: 'closestExpr',
                parentSearch: parentSearch,
                expr: expr,
                to: to,
                args: [to],
                op: function (ctx, to) {
                    if (to == null) {
                        return null;
                    } else {
                        if (parentSearch) {
                            return to.parentElement ? to.parentElement.closest(expr.css) : null;
                        } else {
                            return to.closest(expr.css);
                        }
                    }
                },
                evaluate: function (context) {
                    return runtime.unifiedEval(this, context);
                }
            }
        }
    });

    _hyperscript.addCommand('go', function (parser, runtime, tokens) {
        if (tokens.matchToken('go')) {
            if (tokens.matchToken('back')) {
                var back = true;
            } else {
                tokens.matchToken('to');
                if (tokens.matchToken('url')) {
                    var target = parser.requireElement("stringLike", tokens);
                    var url = true;
                    if (tokens.matchToken('in')) {
                        tokens.requireToken('new');
                        tokens.requireToken('window');
                        var newWindow = true;
                    }
                } else {
                    tokens.matchToken('the'); // optional the
                    var verticalPosition = tokens.matchAnyToken('top', 'bottom', 'middle');
                    var horizontalPosition = tokens.matchAnyToken('left', 'center', 'right');
                    if (verticalPosition || horizontalPosition) {
                        tokens.requireToken("of");
                    }
                    var target = parser.requireElement("expression", tokens);
                    var smoothness = tokens.matchAnyToken('smoothly', 'instantly');

                    var scrollOptions = {}
                    if (verticalPosition) {
                        if (verticalPosition.value === "top") {
                            scrollOptions.block = "start";
                        } else if (verticalPosition.value === "bottom") {
                            scrollOptions.block = "end";
                        } else if (verticalPosition.value === "middle") {
                            scrollOptions.block = "center";
                        }
                    }

                    if (horizontalPosition) {
                        if (horizontalPosition.value === "left") {
                            scrollOptions.inline = "start";
                        } else if (horizontalPosition.value === "center") {
                            scrollOptions.inline = "center";
                        } else if (horizontalPosition.value === "right") {
                            scrollOptions.inline = "end";
                        }
                    }

                    if (smoothness) {
                        if (smoothness.value === "smoothly") {
                            scrollOptions.behavior = "smooth";
                        } else if (smoothness.value === "instantly") {
                            scrollOptions.behavior = "instant";
                        }
                    }

                }
            }

            var goCmd = {
                target: target,
                args: [target],
                op: function (ctx, to) {
                    if(back){
                        window.history.back();
                    } else if (url) {
                        if (to) {
                            if (to.indexOf("#") === 0 && !newWindow) {
                                window.location.href = to;
                            } else {
                                window.open(to, newWindow ? "_blank" : null);
                            }
                        }
                    } else {
                        runtime.forEach(to, function (target) {
                            target.scrollIntoView(scrollOptions);
                        });
                    }
                    return runtime.findNext(goCmd)
                }
            };
            return goCmd;
        }
    });

    _hyperscript.config.conversions["Values"] = function(/** @type {Node | NodeList} */ node) {

        /** @type Object<string,string | string[]> */
        var result = {};

        var forEach = _hyperscript.internals.runtime.forEach;

        forEach(node, function(/** @type HTMLInputElement */ node) {

            // Try to get a value directly from this node
            var input = getInputInfo(node);

            if (input !== undefined) {
                result[input.name] = input.value;
                return;
            }

            // Otherwise, try to query all child elements of this node that *should* contain values.
            if (node.querySelectorAll != undefined) {
                var children = node.querySelectorAll("input,select,textarea");
                forEach(children, appendValue);
            }
        })

        return result;

        /**
         * @param {HTMLInputElement} node 
         */
        function appendValue(node) {

            var info = getInputInfo(node);

            if (info == undefined) {
                return;
            }

            // If there is no value already stored in this space.
            if (result[info.name] == undefined) {
                result[info.name] = info.value;
                return;
            }

            if (Array.isArray(result[info.name]) && Array.isArray(info.value)) {
                result[info.name] = [].concat(result[info.name], info.value);
                return;
            }
        }

        /**
         * @param {HTMLInputElement} node 
         * @returns {{name:string, value:string | string[]} | undefined}
         */
        function getInputInfo(node) {
            try {

                /** @type {{name: string, value: string | string[]}}*/
                var result = {
                    name: node.name,
                    value: node.value
                };

                if ((result.name == undefined) || (result.value == undefined)) {
                    return undefined;
                }

                if ((node.type == "radio") && (node.checked == false)) {
                   return undefined;
                }

                if (node.type == "checkbox") {
                    if (node.checked == false) {
                        result.value = undefined;
                    } else if (typeof result.value === "string") {
                        result.value = [result.value];
                    }
                }

                if (node.type == "select-multiple") {

                    /** @type {NodeListOf<HTMLSelectElement>} */
                    var selected = node.querySelectorAll("option[selected]");
                    
                    result.value = []
                    for (var index = 0 ; index < selected.length ; index++) {
                        result.value.push(selected[index].value)
                    }
                }
                return result;

            } catch (e) {
                return undefined;
            }
        }
    }

	_hyperscript.config.conversions["HTML"] = function(value) {

		var toHTML = /** @returns {string}*/ function(/** @type any*/ value) {

			if (value instanceof Array) {
				return value.map(function(item){return toHTML(item)}).join("")
			}

			if (value instanceof HTMLElement) {
				return value.outerHTML
			}

			if (value instanceof NodeList) {
				var result = ""
                for (var i = 0; i < value.length; i++) {
                    var node = value[i];
                    if (node instanceof HTMLElement) {
                        result += node.outerHTML;
                    }
                }
				return result
			}

			if (value.toString) {
				return value.toString()
			}
	
			return ""
		};

		return toHTML(value);
	}
})()
