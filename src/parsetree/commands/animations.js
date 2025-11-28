/**
 * Animation command parse tree elements
 * Commands for CSS transitions and animations (transition, settle)
 */

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
 * SettleCommand - Wait for transitions to settle
 *
 * Parses: settle [on <element>]
 * Executes: Waits for CSS transitions to complete
 */
export class SettleCommand {
    /**
     * Parse settle command
     * @param {ParserHelper} helper
     * @returns {SettleCommand | undefined}
     */
    static parse(helper) {
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
    }
}

/**
 * TransitionCommand - CSS transitions
 *
 * Parses: transition <element's> <property> [from <value>] to <value> [over <time>ms | using <transition>]
 * Executes: Performs CSS transitions on elements
 */
export class TransitionCommand {
    /**
     * Parse transition command
     * @param {ParserHelper} helper
     * @param {Object} config - Parser configuration with defaultTransition
     * @returns {TransitionCommand | undefined}
     */
    static parse(helper, config) {
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
    }
}
