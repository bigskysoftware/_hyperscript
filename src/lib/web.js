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
                var on = parser.requireElement("implicitMeTarget");
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
            if (classRef == null) {
                attributeRef = parser.parseElement("attributeRef", tokens);
                if (attributeRef == null) {
                    parser.raiseParseError(tokens, "Expected either a class reference or attribute expression")
                }
            }

            if (tokens.matchToken("to")) {
                var to = parser.requireElement("target", tokens);
            } else {
                var to = parser.parseElement("implicitMeTarget");
            }

            if (classRef) {
                var addCmd = {
                    classRef: classRef,
                    attributeRef: attributeRef,
                    to: to,
                    args: [to],
                    op: function (context, to) {
                        runtime.forEach(to, function (target) {
                            target.classList.add(classRef.className());
                        })
                        return runtime.findNext(this, context);
                    }
                }
            } else {
                var addCmd = {
                    type: "addCmd",
                    classRef: classRef,
                    attributeRef: attributeRef,
                    to: to,
                    args: [to, attributeRef],
                    op: function (context, to, attrRef) {
                        runtime.forEach(to, function (target) {
                            target.setAttribute(attrRef.name, attrRef.value);
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
            }
            if (tokens.matchToken("from")) {
                var from = parser.requireElement("target", tokens);
            } else {
                var from = parser.requireElement("implicitMeTarget");
            }

            if (elementExpr) {
                var removeCmd = {
                    classRef: classRef,
                    attributeRef: attributeRef,
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
                    classRef: classRef,
                    attributeRef: attributeRef,
                    elementExpr: elementExpr,
                    from: from,
                    args: [from],
                    op: function (context, from) {
                        if (this.classRef) {
                            runtime.forEach(from, function (target) {
                                target.classList.remove(classRef.className());
                            })
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
            var classRef = parser.parseElement("classRef", tokens);
            var attributeRef = null;
            if (classRef == null) {
                attributeRef = parser.parseElement("attributeRef", tokens);
                if (attributeRef == null) {
                    parser.raiseParseError(tokens, "Expected either a class reference or attribute expression")
                }
            }

            if (tokens.matchToken("on")) {
                var on = parser.requireElement("target", tokens);
            } else {
                var on = parser.requireElement("implicitMeTarget");
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
                attributeRef: attributeRef,
                on: on,
                time: time,
                evt: evt,
                from: from,
                toggle: function (on, value) {
                    if (this.classRef) {
                        runtime.forEach(on, function (target) {
                            target.classList.toggle(classRef.className())
                        });
                    } else {
                        runtime.forEach(on, function (target) {
                            if (target.hasAttribute(attributeRef.name)) {
                                target.removeAttribute(attributeRef.name);
                            } else {
                                target.setAttribute(attributeRef.name, value)
                            }
                        });
                    }
                },
                args: [on, attributeRef ? attributeRef.value : null, time, evt, from],
                op: function (context, on, value, time, evt, from) {
                    if (time) {
                        return new Promise(function (resolve) {
                            toggleCmd.toggle(on, value);
                            setTimeout(function () {
                                toggleCmd.toggle(on, value);
                                resolve(runtime.findNext(toggleCmd, context));
                            }, time);
                        });
                    } else if (evt) {
                        return new Promise(function (resolve) {
                            var target = from || context.me;
                            target.addEventListener(evt, function () {
                                toggleCmd.toggle(on, value);
                                resolve(runtime.findNext(toggleCmd, context));
                            }, {once: true})
                            toggleCmd.toggle(on, value);
                        });
                    } else {
                        this.toggle(on, value);
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
            target = parser.parseElement("target", tokens);
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
            var classRef = tokens.requireTokenType(tokens, "CLASS_REF");

            if (tokens.matchToken("from")) {
                var from = parser.requireElement("target", tokens);
            } else {
                var from = parser.requireElement("implicitAllTarget")
            }

            if (tokens.matchToken("for")) {
                var forElt = parser.requireElement("target", tokens);
            } else {
                var forElt = parser.requireElement("implicitMeTarget")
            }

            var takeCmd = {
                classRef: classRef,
                from: from,
                forElt: forElt,
                args: [from, forElt],
                op: function (context, from, forElt) {
                    var clazz = this.classRef.value.substr(1)
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

    _hyperscript.addCommand("put", function(parser, runtime, tokens) {
        if (tokens.matchToken('put')) {
            var value = parser.requireElement("expression", tokens);

            var operationToken = tokens.matchToken("into") ||
                tokens.matchToken("before") ||
                tokens.matchToken("after");

            if (operationToken == null && tokens.matchToken("at")) {
                operationToken = tokens.matchToken("start") ||
                    tokens.matchToken("end");
                tokens.requireToken("of");
            }

            if (operationToken == null) {
                parser.raiseParseError(tokens, "Expected one of 'into', 'before', 'at start of', 'at end of', 'after'");
            }
            var target = parser.requireElement("target", tokens);

            var operation = operationToken.value;
            var symbolWrite = target.type === "symbol" && operation === "into";
            if (target.type !== "symbol" && operation === "into" && target.root == null) {
                parser.raiseParseError(tokens, "Can only put directly into symbols, not references")
            }

            var root = null;
            var prop = null;
            if (symbolWrite) {
                // root is null
            } else if (operation === "into") {
                prop = target.prop.value;
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
                        context[target.name] = valueToPut;
                    } else {
                        if (operation === "into") {
                            runtime.forEach(root, function (elt) {
                                elt[prop] = valueToPut;
                            })
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

    _hyperscript.addCommand("transition", function(parser, runtime, tokens) {
        if (tokens.matchToken("transition")) {
            if (tokens.matchToken('element') || tokens.matchToken('elements')) {
                var targets = parser.parseElement("expression", tokens);
            } else {
                var targets = parser.parseElement("implicitMeTarget");
            }
            var properties = [];
            var from = [];
            var to = [];
            while (tokens.hasMore() &&
            !parser.commandBoundary(tokens.currentToken()) &&
            tokens.currentToken().value !== "using") {
                properties.push(tokens.requireTokenType("IDENTIFIER").value);
                if (tokens.matchToken("from")) {
                    from.push(parser.requireElement("stringLike", tokens));
                } else {
                    from.push(null);
                }
                tokens.requireToken("to");
                to.push(parser.requireElement("stringLike" , tokens));
            }
            if (tokens.matchToken("using")) {
                var using = parser.requireElement("expression", tokens);
            }

            var transition = {
                to: to,
                args: [targets, from, to, using],
                op: function (context, targets, from, to, using) {
                    var promises = [];
                    runtime.forEach(targets, function(target){
                        var promise = new Promise(function (resolve, reject) {
                            var initialTransition = target.style.transition;
                            target.style.transition = using || _hyperscript.config.defaultTransition;
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

})()