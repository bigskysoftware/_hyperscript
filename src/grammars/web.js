// Web/DOM grammar for _hyperscript
import { Lexer } from '../core/lexer.js';
import { RegExpIterable, ElementCollection } from '../core/util.js';
import { parseJSON } from '../core/helpers.js';
import { config } from '../core/config.js';
import { StyleLiteral } from '../parsetree/expressions/webliterals.js';
import { ClosestExpr } from '../parsetree/expressions/positional.js';
import { PutCommand } from '../parsetree/commands/setters.js';

/**
 * @param {Parser} parser
 */
export default function hyperscriptWebGrammar(parser) {
        parser.addCommand("settle", function (helper) {
            if (helper.matchToken("settle")) {
                if (!helper.commandBoundary(helper.currentToken())) {
                    var onExpr = helper.requireElement("expression");
                } else {
                    var onExpr = helper.requireElement("implicitMeTarget");
                }

                var settleCommand = {
                    type: "settleCmd",
                    args: [onExpr],
                    op: function (context, on) {
                        context.meta.runtime.nullCheck(on, onExpr);
                        var resolve = null;
                        var resolved = false;
                        var transitionStarted = false;

                        var promise = new Promise(function (r) {
                            resolve = r;
                        });

                        // listen for a transition begin
                        on.addEventListener(
                            "transitionstart",
                            function () {
                                transitionStarted = true;
                            },
                            { once: true }
                        );

                        // if no transition begins in 500ms, cancel
                        setTimeout(function () {
                            if (!transitionStarted && !resolved) {
                                resolve(context.meta.runtime.findNext(settleCommand, context));
                            }
                        }, 500);

                        // continue on a transition emd
                        on.addEventListener(
                            "transitionend",
                            function () {
                                if (!resolved) {
                                    resolve(context.meta.runtime.findNext(settleCommand, context));
                                }
                            },
                            { once: true }
                        );
                        return promise;
                    },
                    execute: function (context) {
                        return context.meta.runtime.unifiedExec(this, context);
                    },
                };
                return settleCommand;
            }
        });

        parser.addCommand("add", function (helper) {
            if (helper.matchToken("add")) {
                var classRef = helper.parseElement("classRef");
                var attributeRef = null;
                var cssDeclaration = null;
                if (classRef == null) {
                    attributeRef = helper.parseElement("attributeRef");
                    if (attributeRef == null) {
                        cssDeclaration = helper.parseElement("styleLiteral");
                        if (cssDeclaration == null) {
                            helper.raiseParseError("Expected either a class reference or attribute expression");
                        }
                    }
                } else {
                    var classRefs = [classRef];
                    while ((classRef = helper.parseElement("classRef"))) {
                        classRefs.push(classRef);
                    }
                }

                if (helper.matchToken("to")) {
                    var toExpr = helper.requireElement("expression");
                } else {
                    var toExpr = helper.requireElement("implicitMeTarget");
                }

                if (helper.matchToken("when")) {
                    if (cssDeclaration) {
                        helper.raiseParseError("Only class and properties are supported with a when clause")
                    }
                    var when = helper.requireElement("expression");
                }

                if (classRefs) {
                    return {
                        classRefs: classRefs,
                        to: toExpr,
                        args: [toExpr, classRefs],
                        op: function (context, to, classRefs) {
                            context.meta.runtime.nullCheck(to, toExpr);
                            context.meta.runtime.forEach(classRefs, function (classRef) {
                                context.meta.runtime.implicitLoop(to, function (target) {
                                    if (when) {
                                        context.result = target;
                                        let whenResult = context.meta.runtime.evaluateNoPromise(when, context);
                                        if (whenResult) {
                                            if (target instanceof Element) target.classList.add(classRef.className);
                                        } else {
                                            if (target instanceof Element) target.classList.remove(classRef.className);
                                        }
                                        context.result = null;
                                    } else {
                                        if (target instanceof Element) target.classList.add(classRef.className);
                                    }
                                });
                            });
                            return context.meta.runtime.findNext(this, context);
                        },
                    };
                } else if (attributeRef) {
                    return {
                        type: "addCmd",
                        attributeRef: attributeRef,
                        to: toExpr,
                        args: [toExpr],
                        op: function (context, to, attrRef) {
                            context.meta.runtime.nullCheck(to, toExpr);
                            context.meta.runtime.implicitLoop(to, function (target) {
                                if (when) {
                                    context.result = target;
                                    let whenResult = context.meta.runtime.evaluateNoPromise(when, context);
                                    if (whenResult) {
                                        target.setAttribute(attributeRef.name, attributeRef.value);
                                    } else {
                                        target.removeAttribute(attributeRef.name);
                                    }
                                    context.result = null;
                                } else {
                                    target.setAttribute(attributeRef.name, attributeRef.value);
                                }
                            });
                            return context.meta.runtime.findNext(this, context);
                        },
                        execute: function (ctx) {
                            return context.meta.runtime.unifiedExec(this, ctx);
                        },
                    };
                } else {
                    return {
                        type: "addCmd",
                        cssDeclaration: cssDeclaration,
                        to: toExpr,
                        args: [toExpr, cssDeclaration],
                        op: function (context, to, css) {
                            context.meta.runtime.nullCheck(to, toExpr);
                            context.meta.runtime.implicitLoop(to, function (target) {
                                target.style.cssText += css;
                            });
                            return context.meta.runtime.findNext(this, context);
                        },
                        execute: function (ctx) {
                            return context.meta.runtime.unifiedExec(this, ctx);
                        },
                    };
                }
            }
        });

        parser.addGrammarElement("styleLiteral", StyleLiteral.parse);

        parser.addCommand("remove", function (helper) {
            if (helper.matchToken("remove")) {
                var classRef = helper.parseElement("classRef");
                var attributeRef = null;
                var elementExpr = null;
                if (classRef == null) {
                    attributeRef = helper.parseElement("attributeRef");
                    if (attributeRef == null) {
                        elementExpr = helper.parseElement("expression");
                        if (elementExpr == null) {
                            helper.raiseParseError(
                                "Expected either a class reference, attribute expression or value expression"
                            );
                        }
                    }
                } else {
                    var classRefs = [classRef];
                    while ((classRef = helper.parseElement("classRef"))) {
                        classRefs.push(classRef);
                    }
                }

                if (helper.matchToken("from")) {
                    var fromExpr = helper.requireElement("expression");
                } else {
                    if (elementExpr == null) {
                        var fromExpr = helper.requireElement("implicitMeTarget");
                    }
                }

                if (elementExpr) {
                    return {
                        elementExpr: elementExpr,
                        from: fromExpr,
                        args: [elementExpr, fromExpr],
                        op: function (context, element, from) {
                            context.meta.runtime.nullCheck(element, elementExpr);
                            context.meta.runtime.implicitLoop(element, function (target) {
                                if (target.parentElement && (from == null || from.contains(target))) {
                                    target.parentElement.removeChild(target);
                                }
                            });
                            return context.meta.runtime.findNext(this, context);
                        },
                    };
                } else {
                    return {
                        classRefs: classRefs,
                        attributeRef: attributeRef,
                        elementExpr: elementExpr,
                        from: fromExpr,
                        args: [classRefs, fromExpr],
                        op: function (context, classRefs, from) {
                            context.meta.runtime.nullCheck(from, fromExpr);
                            if (classRefs) {
                                context.meta.runtime.forEach(classRefs, function (classRef) {
                                    context.meta.runtime.implicitLoop(from, function (target) {
                                        target.classList.remove(classRef.className);
                                    });
                                });
                            } else {
                                context.meta.runtime.implicitLoop(from, function (target) {
                                    target.removeAttribute(attributeRef.name);
                                });
                            }
                            return context.meta.runtime.findNext(this, context);
                        },
                    };
                }
            }
        });

        parser.addCommand("toggle", function (helper) {
            if (helper.matchToken("toggle")) {
                helper.matchAnyToken("the", "my");
                if (helper.currentToken().type === "STYLE_REF") {
                    let styleRef = helper.consumeToken();
                    var name = styleRef.value.substr(1);
                    var visibility = true;
                    var hideShowStrategy = resolveHideShowStrategy(parser, helper, name);
                    if (helper.matchToken("of")) {
                        helper.pushFollow("with");
                        try {
                            var onExpr = helper.requireElement("expression");
                        } finally {
                            helper.popFollow();
                        }
                    } else {
                        var onExpr = helper.requireElement("implicitMeTarget");
                    }
                } else if (helper.matchToken("between")) {
                    var between = true;
                    var classRef = helper.parseElement("classRef");
                    helper.requireToken("and");
                    var classRef2 = helper.requireElement("classRef");
                } else {
                    var classRef = helper.parseElement("classRef");
                    var attributeRef = null;
                    if (classRef == null) {
                        attributeRef = helper.parseElement("attributeRef");
                        if (attributeRef == null) {
                            helper.raiseParseError("Expected either a class reference or attribute expression");
                        }
                    } else {
                        var classRefs = [classRef];
                        while ((classRef = helper.parseElement("classRef"))) {
                            classRefs.push(classRef);
                        }
                    }
                }

                if (visibility !== true) {
                    if (helper.matchToken("on")) {
                        var onExpr = helper.requireElement("expression");
                    } else {
                        var onExpr = helper.requireElement("implicitMeTarget");
                    }
                }

                if (helper.matchToken("for")) {
                    var time = helper.requireElement("expression");
                } else if (helper.matchToken("until")) {
                    var evt = helper.requireElement("dotOrColonPath", "Expected event name");
                    if (helper.matchToken("from")) {
                        var from = helper.requireElement("expression");
                    }
                }

                var toggleCmd = {
                    classRef: classRef,
                    classRef2: classRef2,
                    classRefs: classRefs,
                    attributeRef: attributeRef,
                    on: onExpr,
                    time: time,
                    evt: evt,
                    from: from,
                    toggle: function (context, on, classRef, classRef2, classRefs) {
                        context.meta.runtime.nullCheck(on, onExpr);
                        if (visibility) {
                            context.meta.runtime.implicitLoop(on, function (target) {
                                hideShowStrategy("toggle", target);
                            });
                        } else if (between) {
                            context.meta.runtime.implicitLoop(on, function (target) {
                                if (target.classList.contains(classRef.className)) {
                                    target.classList.remove(classRef.className);
                                    target.classList.add(classRef2.className);
                                } else {
                                    target.classList.add(classRef.className);
                                    target.classList.remove(classRef2.className);
                                }
                            });
                        } else if (classRefs) {
                            context.meta.runtime.forEach(classRefs, function (classRef) {
                                context.meta.runtime.implicitLoop(on, function (target) {
                                    target.classList.toggle(classRef.className);
                                });
                            });
                        } else {
                            context.meta.runtime.implicitLoop(on, function (target) {
                                if (target.hasAttribute(attributeRef.name)) {
                                    target.removeAttribute(attributeRef.name);
                                } else {
                                    target.setAttribute(attributeRef.name, attributeRef.value);
                                }
                            });
                        }
                    },
                    args: [onExpr, time, evt, from, classRef, classRef2, classRefs],
                    op: function (context, on, time, evt, from, classRef, classRef2, classRefs) {
                        if (time) {
                            return new Promise(function (resolve) {
                                toggleCmd.toggle(context, on, classRef, classRef2, classRefs);
                                setTimeout(function () {
                                    toggleCmd.toggle(context, on, classRef, classRef2, classRefs);
                                    resolve(context.meta.runtime.findNext(toggleCmd, context));
                                }, time);
                            });
                        } else if (evt) {
                            return new Promise(function (resolve) {
                                var target = from || context.me;
                                target.addEventListener(
                                    evt,
                                    function () {
                                        toggleCmd.toggle(context, on, classRef, classRef2, classRefs);
                                        resolve(context.meta.runtime.findNext(toggleCmd, context));
                                    },
                                    { once: true }
                                );
                                toggleCmd.toggle(context, on, classRef, classRef2, classRefs);
                            });
                        } else {
                            this.toggle(context, on, classRef, classRef2, classRefs);
                            return context.meta.runtime.findNext(toggleCmd, context);
                        }
                    },
                };
                return toggleCmd;
            }
        });

        var HIDE_SHOW_STRATEGIES = {
            display: function (op, element, arg) {
                if (arg) {
                    element.style.display = arg;
                } else if (op === "toggle") {
                    if (getComputedStyle(element).display === "none") {
                        HIDE_SHOW_STRATEGIES.display("show", element, arg);
                    } else {
                        HIDE_SHOW_STRATEGIES.display("hide", element, arg);
                    }
                } else if (op === "hide") {
                    const internalData = parser.runtime.getInternalData(element);
                    if (internalData.originalDisplay == null) {
                        internalData.originalDisplay = element.style.display;
                    }
                    element.style.display = "none";
                } else {
                    const internalData = parser.runtime.getInternalData(element);
                    if (internalData.originalDisplay && internalData.originalDisplay !== 'none') {
                        element.style.display = internalData.originalDisplay;
                    } else {
                        element.style.removeProperty('display');
                    }
                }
            },
            visibility: function (op, element, arg) {
                if (arg) {
                    element.style.visibility = arg;
                } else if (op === "toggle") {
                    if (getComputedStyle(element).visibility === "hidden") {
                        HIDE_SHOW_STRATEGIES.visibility("show", element, arg);
                    } else {
                        HIDE_SHOW_STRATEGIES.visibility("hide", element, arg);
                    }
                } else if (op === "hide") {
                    element.style.visibility = "hidden";
                } else {
                    element.style.visibility = "visible";
                }
            },
            opacity: function (op, element, arg) {
                if (arg) {
                    element.style.opacity = arg;
                } else if (op === "toggle") {
                    if (getComputedStyle(element).opacity === "0") {
                        HIDE_SHOW_STRATEGIES.opacity("show", element, arg);
                    } else {
                        HIDE_SHOW_STRATEGIES.opacity("hide", element, arg);
                    }
                } else if (op === "hide") {
                    element.style.opacity = "0";
                } else {
                    element.style.opacity = "1";
                }
            },
        };

        var parseShowHideTarget = function (helper) {
            var target;
            var currentTokenValue = helper.currentToken();
            if (currentTokenValue.value === "when" || currentTokenValue.value === "with" || helper.commandBoundary(currentTokenValue)) {
                target = helper.parseElement("implicitMeTarget");
            } else {
                target = helper.parseElement("expression");
            }
            return target;
        };

        var resolveHideShowStrategy = function (parser, helper, name) {
            var configDefault = config.defaultHideShowStrategy;
            var strategies = HIDE_SHOW_STRATEGIES;
            if (config.hideShowStrategies) {
                strategies = Object.assign(strategies, config.hideShowStrategies); // merge in user provided strategies
            }
            name = name || configDefault || "display";
            var value = strategies[name];
            if (value == null) {
                helper.raiseParseError("Unknown show/hide strategy : " + name);
            }
            return value;
        };

        parser.addCommand("hide", function (helper) {
            if (helper.matchToken("hide")) {
                var targetExpr = parseShowHideTarget(helper);

                var name = null;
                if (helper.matchToken("with")) {
                    name = helper.requireTokenType("IDENTIFIER", "STYLE_REF").value;
                    if (name.indexOf("*") === 0) {
                        name = name.substr(1);
                    }
                }
                var hideShowStrategy = resolveHideShowStrategy(parser, helper, name);

                return {
                    target: targetExpr,
                    args: [targetExpr],
                    op: function (ctx, target) {
                        ctx.meta.runtime.nullCheck(target, targetExpr);
                        ctx.meta.runtime.implicitLoop(target, function (elt) {
                            hideShowStrategy("hide", elt);
                        });
                        return ctx.meta.runtime.findNext(this, ctx);
                    },
                };
            }
        });

        parser.addCommand("show", function (helper) {
            if (helper.matchToken("show")) {
                var targetExpr = parseShowHideTarget(helper);

                var name = null;
                if (helper.matchToken("with")) {
                    name = helper.requireTokenType("IDENTIFIER", "STYLE_REF").value;
                    if (name.indexOf("*") === 0) {
                        name = name.substr(1);
                    }
                }
                var arg = null;
                if (helper.matchOpToken(":")) {
                    var tokenArr = helper.consumeUntilWhitespace();
                    helper.matchTokenType("WHITESPACE");
                    arg = tokenArr
                        .map(function (t) {
                            return t.value;
                        })
                        .join("");
                }

                if (helper.matchToken("when")) {
                    var when = helper.requireElement("expression");
                }

                var hideShowStrategy = resolveHideShowStrategy(parser, helper, name);

                return {
                    target: targetExpr,
                    when: when,
                    args: [targetExpr],
                    op: function (ctx, target) {
                        ctx.meta.runtime.nullCheck(target, targetExpr);
                        ctx.meta.runtime.implicitLoop(target, function (elt) {
                            if (when) {
                                ctx.result = elt;
                                let whenResult = ctx.meta.runtime.evaluateNoPromise(when, ctx);
                                if (whenResult) {
                                    hideShowStrategy("show", elt, arg);
                                } else {
                                    hideShowStrategy("hide", elt);
                                }
                                ctx.result = null;
                            } else {
                                hideShowStrategy("show", elt, arg);
                            }
                        });
                        return ctx.meta.runtime.findNext(this, ctx);
                    },
                };
            }
        });

        parser.addCommand("take", function (helper) {
            if (helper.matchToken("take")) {
                let classRef = null;
                let classRefs = [];
                while ((classRef = helper.parseElement("classRef"))) {
                    classRefs.push(classRef);
                }

                var attributeRef = null;
                var replacementValue = null;

                let weAreTakingClasses = classRefs.length > 0;
                if (!weAreTakingClasses) {
                    attributeRef = helper.parseElement("attributeRef");
                    if (attributeRef == null) {
                        helper.raiseParseError("Expected either a class reference or attribute expression");
                    }

                    if (helper.matchToken("with")) {
                        replacementValue = helper.requireElement("expression");
                    }
                }

                if (helper.matchToken("from")) {
                    var fromExpr = helper.requireElement("expression");
                }

                if (helper.matchToken("for")) {
                    var forExpr = helper.requireElement("expression");
                } else {
                    var forExpr = helper.requireElement("implicitMeTarget");
                }

                if (weAreTakingClasses) {
                    var takeCmd = {
                        classRefs: classRefs,
                        from: fromExpr,
                        forElt: forExpr,
                        args: [classRefs, fromExpr, forExpr],
                        op: function (context, classRefs, from, forElt) {
                            context.meta.runtime.nullCheck(forElt, forExpr);
                            context.meta.runtime.implicitLoop(classRefs, function(classRef){
                                var clazz = classRef.className;
                                if (from) {
                                    context.meta.runtime.implicitLoop(from, function (target) {
                                        target.classList.remove(clazz);
                                    });
                                } else {
                                    context.meta.runtime.implicitLoop(classRef, function (target) {
                                        target.classList.remove(clazz);
                                    });
                                }
                                context.meta.runtime.implicitLoop(forElt, function (target) {
                                    target.classList.add(clazz);
                                });
                            })
                            return context.meta.runtime.findNext(this, context);
                        },
                    };
                    return takeCmd;
                } else {
                    var takeCmd2 = {
                        attributeRef: attributeRef,
                        from: fromExpr,
                        forElt: forExpr,
                        args: [fromExpr, forExpr, replacementValue],
                        op: function (context, from, forElt, replacementValue) {
                            context.meta.runtime.nullCheck(from, fromExpr);
                            context.meta.runtime.nullCheck(forElt, forExpr);
                            context.meta.runtime.implicitLoop(from, function (target) {
                                if (!replacementValue) {
                                    target.removeAttribute(attributeRef.name);
                                } else {
                                    target.setAttribute(attributeRef.name, replacementValue)
                                }
                            });
                            context.meta.runtime.implicitLoop(forElt, function (target) {
                                target.setAttribute(attributeRef.name, attributeRef.value || "")
                            });
                            return context.meta.runtime.findNext(this, context);
                        },
                    };
                    return takeCmd2;
                }
            }
        });

        parser.addCommand("put", function (helper) {
            return PutCommand.parse(helper, parser);
        });

        function parsePseudopossessiveTarget(helper) {
            var targets;
            if (
                helper.matchToken("the") ||
                helper.matchToken("element") ||
                helper.matchToken("elements") ||
                helper.currentToken().type === "CLASS_REF" ||
                helper.currentToken().type === "ID_REF" ||
                (helper.currentToken().op && helper.currentToken().value === "<")
            ) {
                helper.possessivesDisabled = true;
                try {
                    targets = helper.parseElement("expression");
                } finally {
                    delete helper.possessivesDisabled;
                }
                // optional possessive
                if (helper.matchOpToken("'")) {
                    helper.requireToken("s");
                }
            } else if (helper.currentToken().type === "IDENTIFIER" && helper.currentToken().value === "its") {
                var identifier = helper.matchToken("its");
                targets = {
                    type: "pseudopossessiveIts",
                    token: identifier,
                    name: identifier.value,
                    evaluate: function (context) {
                        return context.meta.runtime.resolveSymbol("it", context);
                    },
                };
            } else {
                helper.matchToken("my") || helper.matchToken("me"); // consume optional 'my'
                targets = helper.parseElement("implicitMeTarget");
            }
            return targets;
        }

        parser.addCommand("transition", function (helper) {
            if (helper.matchToken("transition")) {
                var targetsExpr = parsePseudopossessiveTarget(helper);

                var properties = [];
                var from = [];
                var to = [];
                var currentToken = helper.currentToken();
                while (
                    !helper.commandBoundary(currentToken) &&
                    currentToken.value !== "over" &&
                    currentToken.value !== "using"
                ) {
                    if (helper.currentToken().type === "STYLE_REF") {
                        let styleRef = helper.consumeToken();
                        let styleProp = styleRef.value.substr(1);
                        properties.push({
                            type: "styleRefValue",
                            evaluate: function () {
                                return styleProp;
                            },
                        });
                    } else {
                        properties.push(helper.requireElement("stringLike"));
                    }

                    if (helper.matchToken("from")) {
                        from.push(helper.requireElement("expression"));
                    } else {
                        from.push(null);
                    }
                    helper.requireToken("to");
                    if (helper.matchToken("initial")) {
                        to.push({
                            type: "initial_literal",
                            evaluate : function(){
                                return "initial";
                            }
                        });
                    } else {
                        to.push(helper.requireElement("expression"));
                    }
                    currentToken = helper.currentToken();
                }
                if (helper.matchToken("over")) {
                    var over = helper.requireElement("expression");
                } else if (helper.matchToken("using")) {
                    var usingExpr = helper.requireElement("expression");
                }

                var transition = {
                    to: to,
                    args: [targetsExpr, properties, from, to, usingExpr, over],
                    op: function (context, targets, properties, from, to, using, over) {
                        context.meta.runtime.nullCheck(targets, targetsExpr);
                        var promises = [];
                        context.meta.runtime.implicitLoop(targets, function (target) {
                            var promise = new Promise(function (resolve, reject) {
                                var initialTransition = target.style.transition;
                                if (over) {
                                    target.style.transition = "all " + over + "ms ease-in";
                                } else if (using) {
                                    target.style.transition = using;
                                } else {
                                    target.style.transition = config.defaultTransition;
                                }
                                var internalData = context.meta.runtime.getInternalData(target);
                                var computedStyles = getComputedStyle(target);

                                var initialStyles = {};
                                for (var i = 0; i < computedStyles.length; i++) {
                                    var name = computedStyles[i];
                                    var initialValue = computedStyles[name];
                                    initialStyles[name] = initialValue;
                                }

                                // store initial values
                                if (!internalData.initialStyles) {
                                    internalData.initialStyles = initialStyles;
                                }

                                for (var i = 0; i < properties.length; i++) {
                                    var property = properties[i];
                                    var fromVal = from[i];
                                    if (fromVal === "computed" || fromVal == null) {
                                        target.style[property] = initialStyles[property];
                                    } else {
                                        target.style[property] = fromVal;
                                    }
                                }
                                //console.log("transition started", transition);

                                var transitionStarted = false;
                                var resolved = false;

                                target.addEventListener(
                                    "transitionend",
                                    function () {
                                        if (!resolved) {
                                            //console.log("transition ended", transition);
                                            target.style.transition = initialTransition;
                                            resolved = true;
                                            resolve();
                                        }
                                    },
                                    { once: true }
                                );

                                target.addEventListener(
                                    "transitionstart",
                                    function () {
                                        transitionStarted = true;
                                    },
                                    { once: true }
                                );

                                // it no transition has started in 100ms, continue
                                setTimeout(function () {
                                    if (!resolved && !transitionStarted) {
                                        //console.log("transition ended", transition);
                                        target.style.transition = initialTransition;
                                        resolved = true;
                                        resolve();
                                    }
                                }, 100);

                                setTimeout(function () {
                                    var autoProps = [];
                                    for (var i = 0; i < properties.length; i++) {
                                        var property = properties[i];
                                        var toVal = to[i];
                                        if (toVal === "initial") {
                                            var propertyValue = internalData.initialStyles[property];
                                            target.style[property] = propertyValue;
                                        } else {
                                            target.style[property] = toVal;
                                        }
                                        //console.log("set", property, "to", target.style[property], "on", target, "value passed in : ", toVal);
                                    }
                                }, 0);
                            });
                            promises.push(promise);
                        });
                        return Promise.all(promises).then(function () {
                            return context.meta.runtime.findNext(transition, context);
                        });
                    },
                };
                return transition;
            }
        });

        parser.addCommand("measure", function (helper) {
            if (!helper.matchToken("measure")) return;

            var targetExpr = parsePseudopossessiveTarget(helper);

            var propsToMeasure = [];
            if (!helper.commandBoundary(helper.currentToken()))
                do {
                    propsToMeasure.push(helper.matchTokenType("IDENTIFIER").value);
                } while (helper.matchOpToken(","));

            return {
                properties: propsToMeasure,
                args: [targetExpr],
                op: function (ctx, target) {
                    ctx.meta.runtime.nullCheck(target, targetExpr);
                    if (0 in target) target = target[0]; // not measuring multiple elts
                    var rect = target.getBoundingClientRect();
                    var scroll = {
                        top: target.scrollTop,
                        left: target.scrollLeft,
                        topMax: target.scrollTopMax,
                        leftMax: target.scrollLeftMax,
                        height: target.scrollHeight,
                        width: target.scrollWidth,
                    };

                    ctx.result = {
                        x: rect.x,
                        y: rect.y,
                        left: rect.left,
                        top: rect.top,
                        right: rect.right,
                        bottom: rect.bottom,
                        width: rect.width,
                        height: rect.height,
                        bounds: rect,

                        scrollLeft: scroll.left,
                        scrollTop: scroll.top,
                        scrollLeftMax: scroll.leftMax,
                        scrollTopMax: scroll.topMax,
                        scrollWidth: scroll.width,
                        scrollHeight: scroll.height,
                        scroll: scroll,
                    };

                    ctx.meta.runtime.forEach(propsToMeasure, function (prop) {
                        if (prop in ctx.result) ctx.locals[prop] = ctx.result[prop];
                        else throw "No such measurement as " + prop;
                    });

                    return ctx.meta.runtime.findNext(this, ctx);
                },
            };
        });

        parser.addLeafExpression("closestExpr", ClosestExpr.parse);

        parser.addCommand("go", function (helper) {
            if (helper.matchToken("go")) {
                if (helper.matchToken("back")) {
                    var back = true;
                } else {
                    helper.matchToken("to");
                    if (helper.matchToken("url")) {
                        var target = helper.requireElement("stringLike");
                        var url = true;
                        if (helper.matchToken("in")) {
                            helper.requireToken("new");
                            helper.requireToken("window");
                            var newWindow = true;
                        }
                    } else {
                        helper.matchToken("the"); // optional the
                        var verticalPosition = helper.matchAnyToken("top", "middle", "bottom");
                        var horizontalPosition = helper.matchAnyToken("left", "center", "right");
                        if (verticalPosition || horizontalPosition) {
                            helper.requireToken("of");
                        }
                        var target = helper.requireElement("unaryExpression");

                        var plusOrMinus = helper.matchAnyOpToken("+", "-");
                        if (plusOrMinus) {
                            helper.pushFollow("px");
                            try {
                                var offset = helper.requireElement("expression");
                            } finally {
                                helper.popFollow();
                            }
                        }
                        helper.matchToken("px"); // optional px

                        var smoothness = helper.matchAnyToken("smoothly", "instantly");

                        var scrollOptions = {
                            block: "start",
                            inline: "nearest"
                        };

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
                    args: [target, offset],
                    op: function (ctx, to, offset) {
                        if (back) {
                            window.history.back();
                        } else if (url) {
                            if (to) {
                                if (newWindow) {
                                    window.open(to);
                                } else {
                                    window.location.href = to;
                                }
                            }
                        } else {
                            context.meta.runtime.implicitLoop(to, function (target) {

                                if (target === window) {
                                    target = document.body;
                                }

                                if(plusOrMinus) {
                                    // a scroll w/ an offset of some sort
                                    let boundingRect = target.getBoundingClientRect();

                                    let scrollShim = document.createElement("div");

                                    let actualOffset = plusOrMinus.value === "+" ? offset : offset * -1;

                                    let offsetX = scrollOptions.inline == "start" || scrollOptions.inline == "end" ? actualOffset : 0;

                                    let offsetY = scrollOptions.block == "start" || scrollOptions.block == "end" ? actualOffset : 0;

                                    scrollShim.style.position = "absolute";
                                    scrollShim.style.top = (boundingRect.top + window.scrollY + offsetY) + "px";
                                    scrollShim.style.left = (boundingRect.left + window.scrollX + offsetX) + "px";
                                    scrollShim.style.height = boundingRect.height + "px";
                                    scrollShim.style.width = boundingRect.width + "px";
                                    scrollShim.style.zIndex = "" + Number.MIN_SAFE_INTEGER;
                                    scrollShim.style.opacity = "0";

                                    document.body.appendChild(scrollShim);
                                    setTimeout(function () {
                                        document.body.removeChild(scrollShim);
                                    }, 100);

                                    target = scrollShim;
                                }

                                target.scrollIntoView(scrollOptions);
                            });
                        }
                        return context.meta.runtime.findNext(goCmd, ctx);
                    },
                };
                return goCmd;
            }
        });

        config.conversions.dynamicResolvers.push(function (str, node) {
            if (!(str === "Values" || str.indexOf("Values:") === 0)) {
                return;
            }
            var conversion = str.split(":")[1];
            /** @type Object<string,string | string[]> */
            var result = {};

            var implicitLoop = parser.runtime.implicitLoop.bind(parser.runtime);

            implicitLoop(node, function (/** @type HTMLInputElement */ node) {
                // Try to get a value directly from this node
                var input = getInputInfo(node);

                if (input !== undefined) {
                    result[input.name] = input.value;
                    return;
                }

                // Otherwise, try to query all child elements of this node that *should* contain values.
                if (node.querySelectorAll != undefined) {
                    /** @type {NodeListOf<HTMLInputElement>} */
                    var children = node.querySelectorAll("input,select,textarea");
                    children.forEach(appendValue);
                }
            });

            if (conversion) {
                if (conversion === "JSON") {
                    return JSON.stringify(result);
                } else if (conversion === "Form") {
                    // TODO: does this work with multiple inputs of the same name?
                    return new URLSearchParams(/** @type {Record<string, string>} */ (result)).toString();
                } else {
                    throw "Unknown conversion: " + conversion;
                }
            } else {
                return result;
            }

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
                        value: node.value,
                    };

                    if (result.name == undefined || result.value == undefined) {
                        return undefined;
                    }

                    if (node.type == "radio" && node.checked == false) {
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

                        result.value = [];
                        for (var index = 0; index < selected.length; index++) {
                            result.value.push(selected[index].value);
                        }
                    }
                    return result;
                } catch (e) {
                    return undefined;
                }
            }
        });

        config.conversions["HTML"] = function (value) {
            var toHTML = /** @returns {string}*/ function (/** @type any*/ value) {
                if (value instanceof Array) {
                    return value
                        .map(function (item) {
                            return toHTML(item);
                        })
                        .join("");
                }

                if (value instanceof HTMLElement) {
                    return value.outerHTML;
                }

                if (value instanceof NodeList) {
                    var result = "";
                    for (var i = 0; i < value.length; i++) {
                        var node = value[i];
                        if (node instanceof HTMLElement) {
                            result += node.outerHTML;
                        }
                    }
                    return result;
                }

                if (value.toString) {
                    return value.toString();
                }

                return "";
            };

            return toHTML(value);
        };

        config.conversions["Fragment"] = function (val) {
            var frag = document.createDocumentFragment();
            parser.runtime.implicitLoop(val, function (val) {
                if (val instanceof Node) frag.append(val);
                else {
                    var temp = document.createElement("template");
                    temp.innerHTML = val;
                    frag.append(temp.content);
                }
            });
            return frag;
        };
}
