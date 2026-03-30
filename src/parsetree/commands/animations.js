/**
 * Animation command parse tree elements
 * Commands for CSS transitions and animations (transition, settle)
 */

import { Command, Expression } from '../base.js';
import { config } from '../../core/config.js';

/**
 * Extract the style property name and optional target from a parsed expression.
 * Returns { name, target } or null if the expression doesn't contain a style ref.
 */
function _extractStyleProp(expr) {
    // bare *opacity
    if (expr.type === "styleRef") {
        return { name: expr.name, target: null };
    }
    // my *opacity, #el's *opacity
    if (expr.type === "possessive" && expr.attribute &&
        (expr.attribute.type === "styleRef" || expr.attribute.type === "computedStyleRef")) {
        return { name: expr.attribute.name, target: expr.root };
    }
    // *opacity of #el
    if (expr.type === "ofExpression" && expr._urRoot &&
        (expr._urRoot.type === "styleRef" || expr._urRoot.type === "computedStyleRef")) {
        return { name: expr._urRoot.name, target: expr.root };
    }
    return null;
}

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
 * SettleCommand - Wait for transitions to settle
 *
 * Parses: settle [on <element>]
 * Executes: Waits for CSS transitions to complete
 */
export class SettleCommand extends Command {
    static keyword = "settle";

    constructor(onExpr) {
        super();
        this.onExpr = onExpr;
        this.args = { on: onExpr };
    }

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

    resolve(context, { on }) {
        context.meta.runtime.nullCheck(on, this.onExpr);
        var cmd = this;
        var elements = (on instanceof Element) ? [on] : Array.from(on);
        return Promise.all(elements.map(_settleOne)).then(function () {
            return context.meta.runtime.findNext(cmd, context);
        });
    }
}

function _settleOne(elt) {
    return new Promise(function (resolve) {
        var resolved = false;
        var transitionStarted = false;
        elt.addEventListener("transitionstart", function () {
            transitionStarted = true;
        }, { once: true });
        setTimeout(function () {
            if (!transitionStarted && !resolved) { resolved = true; resolve(); }
        }, 500);
        elt.addEventListener("transitionend", function () {
            if (!resolved) { resolved = true; resolve(); }
        }, { once: true });
    });
}

/**
 * TransitionCommand - CSS transitions
 *
 * Parses: transition [target's] *property [from value] to value [*prop2 ...] [over time | using transition]
 * Executes: Performs CSS transitions on elements
 */
export class TransitionCommand extends Command {
    static keyword = "transition";

    constructor(targetsExpr, to, properties, from, usingExpr, over) {
        super();
        this.to = to;
        this.targetsExpr = targetsExpr;
        this.properties = properties;
        this.from = from;
        this.usingExpr = usingExpr;
        this.over = over;
        this.args = { targets: targetsExpr, properties, from, to, using: usingExpr, over };
    }

    static parse(parser) {
        if (parser.matchToken("transition")) {
            var targetsExpr;
            var properties = [];
            var from = [];
            var to = [];

            // Parse the first property expression — could be bare *prop, my *prop,
            // #el's *prop, *prop of #el, etc. Normal expression parsing handles all forms.
            var firstExpr = parser.requireElement("expression");
            var firstProp = _extractStyleProp(firstExpr);
            if (firstProp) {
                targetsExpr = firstProp.target || parser.parseElement("implicitMeTarget");
                properties.push(new StyleRefValue(firstProp.name));
            } else {
                parser.raiseParseError("Expected a style reference (e.g. *opacity) for transition");
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

            // Parse additional properties (bare style refs only)
            var currentToken = parser.currentToken();
            while (
                !parser.commandBoundary(currentToken) &&
                currentToken.value !== "over" &&
                currentToken.value !== "using"
            ) {
                if (parser.currentToken().type === "STYLE_REF") {
                    var styleRef = parser.consumeToken();
                    properties.push(new StyleRefValue(styleRef.value.slice(1)));
                } else {
                    break;
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

    resolve(context, { targets, properties, from, to, using, over }) {
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
