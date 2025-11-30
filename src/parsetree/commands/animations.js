/**
 * Animation command parse tree elements
 * Commands for CSS transitions and animations (transition, settle)
 */

import { Command, Expression } from '../base.js';
import { config } from '../../core/config.js';
import { PseudopossessiveIts } from '../expressions/pseudopossessive.js';

/**
 * StyleRefValue - Represents a style property name reference
 */
class StyleRefValue extends Expression {
    constructor(styleProp) {
        super();
        this.type = "styleRefValue";
        this.styleProp = styleProp;
    }

    evaluate(context) {
        return this.styleProp;
    }
}

/**
 * InitialLiteral - Represents the "initial" keyword for transitions
 */
class InitialLiteral extends Expression {
    constructor() {
        super();
        this.type = "initial_literal";
    }

    evaluate(context) {
        return "initial";
    }
}

/**
 * Helper function to parse pseudopossessive targets (the/its/my element's)
 */
function parsePseudopossessiveTarget(parser) {
    var targets;
    if (
        parser.matchToken("the") ||
        parser.matchToken("element") ||
        parser.matchToken("elements") ||
        parser.currentToken().type === "CLASS_REF" ||
        parser.currentToken().type === "ID_REF" ||
        (parser.currentToken().op && parser.currentToken().value === "<")
    ) {
        parser.possessivesDisabled = true;
        try {
            targets = parser.parseElement("expression");
        } finally {
            delete parser.possessivesDisabled;
        }
        // optional possessive
        if (parser.matchOpToken("'")) {
            parser.requireToken("s");
        }
    } else if (parser.currentToken().type === "IDENTIFIER" && parser.currentToken().value === "its") {
        var identifier = parser.matchToken("its");
        targets = new PseudopossessiveIts(identifier);
    } else {
        parser.matchToken("my") || parser.matchToken("me"); // consume optional 'my'
        targets = parser.parseElement("implicitMeTarget");
    }
    return targets;
}

/**
 * SettleCommand - Wait for transitions to settle
 *
 * Parses: settle [on <element>]
 * Executes: Waits for CSS transitions to complete
 */
export class SettleCommand extends Command {
    static keyword = "settle";

    constructor(onExpr) {
        super();
        this.type = "settleCmd";
        this.onExpr = onExpr;
        this.args = [onExpr];
    }

    /**
     * Parse settle command
     * @param {Parser} parser
     * @returns {SettleCommand | undefined}
     */
    static parse(parser) {
        if (parser.matchToken("settle")) {
            if (!parser.commandBoundary(parser.currentToken())) {
                var onExpr = parser.requireElement("expression");
            } else {
                var onExpr = parser.requireElement("implicitMeTarget");
            }

            return new SettleCommand(onExpr);
        }
    }

    op(context, on) {
        context.meta.runtime.nullCheck(on, this.onExpr);
        var resolve = null;
        var resolved = false;
        var transitionStarted = false;

        var promise = new Promise((r) => {
            resolve = r;
        });

        // listen for a transition begin
        on.addEventListener(
            "transitionstart",
            () => {
                transitionStarted = true;
            },
            { once: true }
        );

        // if no transition begins in 500ms, cancel
        setTimeout(() => {
            if (!transitionStarted && !resolved) {
                resolved = true;
                resolve(context.meta.runtime.findNext(this, context));
            }
        }, 500);

        // continue on a transition end
        on.addEventListener(
            "transitionend",
            () => {
                if (!resolved) {
                    resolved = true;
                    resolve(context.meta.runtime.findNext(this, context));
                }
            },
            { once: true }
        );
        return promise;
    }
}

/**
 * TransitionCommand - CSS transitions
 *
 * Parses: transition <element's> <property> [from <value>] to <value> [over <time>ms | using <transition>]
 * Executes: Performs CSS transitions on elements
 */
export class TransitionCommand extends Command {
    static keyword = "transition";

    constructor(targetsExpr, to, properties, from, usingExpr, over) {
        super();
        this.type = "transitionCommand";
        this.to = to;
        this.targetsExpr = targetsExpr;
        this.properties = properties;
        this.from = from;
        this.usingExpr = usingExpr;
        this.over = over;
        this.args = [targetsExpr, properties, from, to, usingExpr, over];
    }

    /**
     * Parse transition command
     * @param {Parser} parser
     * @returns {TransitionCommand | undefined}
     */
    static parse(parser) {
        if (parser.matchToken("transition")) {
            var targetsExpr = parsePseudopossessiveTarget(parser);

            var properties = [];
            var from = [];
            var to = [];
            var currentToken = parser.currentToken();
            while (
                !parser.commandBoundary(currentToken) &&
                currentToken.value !== "over" &&
                currentToken.value !== "using"
            ) {
                if (parser.currentToken().type === "STYLE_REF") {
                    let styleRef = parser.consumeToken();
                    let styleProp = styleRef.value.substr(1);
                    properties.push(new StyleRefValue(styleProp));
                } else {
                    properties.push(parser.requireElement("stringLike"));
                }

                if (parser.matchToken("from")) {
                    from.push(parser.requireElement("expression"));
                } else {
                    from.push(null);
                }
                parser.requireToken("to");
                if (parser.matchToken("initial")) {
                    to.push(new InitialLiteral());
                } else {
                    to.push(parser.requireElement("expression"));
                }
                currentToken = parser.currentToken();
            }
            if (parser.matchToken("over")) {
                var over = parser.requireElement("expression");
            } else if (parser.matchToken("using")) {
                var usingExpr = parser.requireElement("expression");
            }

            return new TransitionCommand(targetsExpr, to, properties, from, usingExpr, over);
        }
    }

    op(context, targets, properties, from, to, using, over) {
        context.meta.runtime.nullCheck(targets, this.targetsExpr);
        var promises = [];
        context.meta.runtime.implicitLoop(targets, (target) => {
            var promise = new Promise((resolve, reject) => {
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

                var transitionStarted = false;
                var resolved = false;

                target.addEventListener(
                    "transitionend",
                    () => {
                        if (!resolved) {
                            target.style.transition = initialTransition;
                            resolved = true;
                            resolve();
                        }
                    },
                    { once: true }
                );

                target.addEventListener(
                    "transitionstart",
                    () => {
                        transitionStarted = true;
                    },
                    { once: true }
                );

                // if no transition has started in 100ms, continue
                setTimeout(() => {
                    if (!resolved && !transitionStarted) {
                        target.style.transition = initialTransition;
                        resolved = true;
                        resolve();
                    }
                }, 100);

                setTimeout(() => {
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
                    }
                }, 0);
            });
            promises.push(promise);
        });
        return Promise.all(promises).then(() => {
            return context.meta.runtime.findNext(this, context);
        });
    }
}
