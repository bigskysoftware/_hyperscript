/**
 * DOM manipulation command parse tree elements
 * Web-specific commands for manipulating DOM classes, attributes, and visibility
 */

/**
 * Hide/Show strategies for toggling element visibility
 */
const HIDE_SHOW_STRATEGIES = {
    display: function (op, element, arg, kernel) {
        if (arg) {
            element.style.display = arg;
        } else if (op === "toggle") {
            if (getComputedStyle(element).display === "none") {
                HIDE_SHOW_STRATEGIES.display("show", element, arg, kernel);
            } else {
                HIDE_SHOW_STRATEGIES.display("hide", element, arg, kernel);
            }
        } else if (op === "hide") {
            const internalData = kernel.runtime.getInternalData(element);
            if (internalData.originalDisplay == null) {
                internalData.originalDisplay = element.style.display;
            }
            element.style.display = "none";
        } else {
            const internalData = kernel.runtime.getInternalData(element);
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

/**
 * Helper function to parse show/hide target
 */
function parseShowHideTarget(helper) {
    var target;
    var currentTokenValue = helper.currentToken();
    if (currentTokenValue.value === "when" || currentTokenValue.value === "with" || helper.commandBoundary(currentTokenValue)) {
        target = helper.parseElement("implicitMeTarget");
    } else {
        target = helper.parseElement("expression");
    }
    return target;
}

/**
 * Helper function to resolve hide/show strategy
 */
function resolveHideShowStrategy(kernel, helper, name, config) {
    var configDefault = config.defaultHideShowStrategy;
    var strategies = HIDE_SHOW_STRATEGIES;
    if (config.hideShowStrategies) {
        strategies = Object.assign({}, strategies, config.hideShowStrategies); // merge in user provided strategies
    }
    name = name || configDefault || "display";
    var value = strategies[name];
    if (value == null) {
        helper.raiseParseError("Unknown show/hide strategy : " + name);
    }
    return value;
}

/**
 * AddCommand - Add classes, attributes, or CSS to elements
 *
 * Parses: add .class to target | add @attr to target | add {css} to target
 * Executes: Adds classes/attributes/CSS to target elements
 */
export class AddCommand {
    static parse(helper) {
        if (!helper.matchToken("add")) return;

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
}

/**
 * RemoveCommand - Remove classes, attributes, or elements
 *
 * Parses: remove .class from target | remove @attr from target | remove element [from container]
 * Executes: Removes classes/attributes or removes element from DOM
 */
export class RemoveCommand {
    static parse(helper) {
        if (!helper.matchToken("remove")) return;

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
}

/**
 * ToggleCommand - Toggle classes, attributes, or visibility
 *
 * Parses: toggle .class on target | toggle @attr on target | toggle *visibility | toggle between .class1 and .class2
 * Executes: Toggles classes/attributes or visibility state
 */
export class ToggleCommand {
    static parse(helper, kernel, config) {
        if (!helper.matchToken("toggle")) return;

        helper.matchAnyToken("the", "my");
        if (helper.currentToken().type === "STYLE_REF") {
            let styleRef = helper.consumeToken();
            var name = styleRef.value.substr(1);
            var visibility = true;
            var hideShowStrategy = resolveHideShowStrategy(kernel, helper, name, config);
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
                        hideShowStrategy("toggle", target, null, kernel);
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
}

/**
 * HideCommand - Hide elements using various strategies
 *
 * Parses: hide target [with display|visibility|opacity]
 * Executes: Hides target element using specified strategy
 */
export class HideCommand {
    static parse(helper, kernel, config) {
        if (!helper.matchToken("hide")) return;

        var targetExpr = parseShowHideTarget(helper);

        var name = null;
        if (helper.matchToken("with")) {
            name = helper.requireTokenType("IDENTIFIER", "STYLE_REF").value;
            if (name.indexOf("*") === 0) {
                name = name.substr(1);
            }
        }
        var hideShowStrategy = resolveHideShowStrategy(kernel, helper, name, config);

        return {
            target: targetExpr,
            args: [targetExpr],
            op: function (ctx, target) {
                ctx.meta.runtime.nullCheck(target, targetExpr);
                ctx.meta.runtime.implicitLoop(target, function (elt) {
                    hideShowStrategy("hide", elt, null, kernel);
                });
                return ctx.meta.runtime.findNext(this, ctx);
            },
        };
    }
}

/**
 * ShowCommand - Show elements using various strategies
 *
 * Parses: show target [with display|visibility|opacity] [:value] [when condition]
 * Executes: Shows target element using specified strategy
 */
export class ShowCommand {
    static parse(helper, kernel, config) {
        if (!helper.matchToken("show")) return;

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

        var hideShowStrategy = resolveHideShowStrategy(kernel, helper, name, config);

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
                            hideShowStrategy("show", elt, arg, kernel);
                        } else {
                            hideShowStrategy("hide", elt, null, kernel);
                        }
                        ctx.result = null;
                    } else {
                        hideShowStrategy("show", elt, arg, kernel);
                    }
                });
                return ctx.meta.runtime.findNext(this, ctx);
            },
        };
    }
}

/**
 * Helper function to parse pseudopossessive targets (the/its/my element's)
 */
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

/**
 * TakeCommand - Take classes or attributes from elements
 *
 * Parses: take <classes|attribute> [from <elements>] [for <target>]
 * Executes: Removes classes/attributes from source and adds to target
 */
export class TakeCommand {
    /**
     * Parse take command
     * @param {ParserHelper} helper
     * @returns {TakeCommand | undefined}
     */
    static parse(helper) {
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
    }
}

/**
 * MeasureCommand - Measure element dimensions
 *
 * Parses: measure <element's> [property, ...]
 * Executes: Measures element bounds and scroll properties
 */
export class MeasureCommand {
    /**
     * Parse measure command
     * @param {ParserHelper} helper
     * @returns {MeasureCommand | undefined}
     */
    static parse(helper) {
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
    }
}
