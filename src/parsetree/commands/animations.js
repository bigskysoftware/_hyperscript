/**
 * Animation command parse tree elements
 * Commands for CSS transitions and animations (transition, settle)
 */

import { ParseElement, Command, Expression } from '../base.js';
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
                parser.raiseError("Expected a style reference (e.g. *opacity) for transition");
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
            return this.findNext(context);
        });
    }
}

/**
 * AbortViewTransition - Inserted before return/halt/exit/break/continue that would
 * escape the view transition body. Resolves the update promise so the transition
 * doesn't hang, then skips the animation.
 */
class AbortViewTransition extends Command {
    constructor() {
        super();
        this.type = "abortViewTransition";
    }

    resolve(context) {
        var vt = context.meta.viewTransition;
        if (vt) {
            console.warn("hyperscript: view transition skipped due to early exit (return, halt, or break)");
            context.meta.viewTransition = null;
            vt.finished.catch(function () {}); // suppress expected AbortError
            vt.transition.skipTransition();
            vt.bodyDone();
        }
        return context.meta.runtime.findNext(this);
    }
}

var ESCAPE_TYPES = new Set(["returnCommand", "exitCommand", "haltCommand", "breakCommand", "continueCommand"]);
var LOOP_TYPES = new Set(["breakCommand", "continueCommand"]);

/**
 * Walk the body of a view transition and insert AbortViewTransition before any
 * command that would escape the transition body without reaching ViewTransitionEnd.
 * Walks all ParseElement properties to find nested commands (if branches, tell bodies, etc).
 * Sets inLoop=true when entering loop bodies so break/continue are left alone.
 */
function insertAborts(cmd, inLoop, visited) {
    if (!visited) visited = new Set();
    if (!cmd || visited.has(cmd)) return;
    visited.add(cmd);

    var childInLoop = inLoop || cmd.loop !== undefined;

    for (var key of Object.keys(cmd)) {
        if (key === 'parent') continue;
        var val = cmd[key];
        // splice an abort before any escape command
        if (val instanceof ParseElement && ESCAPE_TYPES.has(val.type)) {
            if (!LOOP_TYPES.has(val.type) || !inLoop) {
                var abort = new AbortViewTransition();
                abort.next = val;
                cmd[key] = abort;
                visited.add(abort);
            }
        }
        // recurse into children
        for (var item of [val].flat()) {
            if (item instanceof ParseElement) {
                insertAborts(item, childInLoop, visited);
            }
        }
    }
}

/**
 * ViewTransitionTick - Synthetic command prepended to the body of a view transition.
 * Yields to the browser so the before-snapshot can be captured before mutations begin.
 */
class ViewTransitionTick extends Command {
    constructor() {
        super();
        this.type = "viewTransitionTick";
    }

    resolve(context) {
        return new Promise(resolve => {
            setTimeout(() => resolve(context.meta.runtime.findNext(this)), 0);
        });
    }
}

/**
 * ViewTransitionEnd - Synthetic command appended to the body of a view transition.
 * Signals that DOM mutations are complete (triggering the after-snapshot),
 * then waits for the transition animation to finish before continuing.
 */
class ViewTransitionEnd extends Command {
    constructor() {
        super();
        this.type = "viewTransitionEnd";
    }

    resolve(context) {
        var vt = context.meta.viewTransition;
        if (!vt) return context.meta.runtime.findNext(this.parent, context);
        vt.bodyDone();
        return vt.finished.then(() => {
            context.meta.viewTransition = null;
            return context.meta.runtime.findNext(this.parent, context);
        });
    }
}

/**
 * ViewTransitionCommand - Wrap DOM mutations in a View Transition
 *
 * Parses: start view transition [<string>] <commands> end
 * Executes: Captures before-snapshot via startViewTransition(), runs body commands
 * to mutate the DOM, then ViewTransitionEnd signals completion and waits for
 * the transition animation to finish.
 * Falls back to running body directly if View Transitions API is not supported.
 */
export class ViewTransitionCommand extends Command {
    static keyword = "start";

    constructor(body, transitionType) {
        super();
        this.body = body;
        this.transitionType = transitionType;
        this.args = { type: transitionType };
    }

    static parse(parser) {
        if (!parser.matchToken("start")) return;
        parser.matchToken("a"); // optional "a"
        parser.requireToken("view");
        parser.requireToken("transition");
        parser.matchToken("using"); // optional "using"
        var typeToken = parser.matchTokenType("STRING");
        var transitionType = typeToken ? typeToken.value : null;
        var body = parser.requireElement("commandList");

        // prepend a tick so the browser can capture the before-snapshot
        var tick = new ViewTransitionTick();
        tick.next = body;

        // append ViewTransitionEnd at the end of the body chain
        var endCmd = new ViewTransitionEnd();
        var last = body;
        while (last.next) last = last.next;
        last.next = endCmd;

        if (parser.hasMore()) {
            parser.requireToken("end");
        }

        // insert AbortViewTransition before any return/halt/exit/break/continue
        // that would escape the body without reaching ViewTransitionEnd
        insertAborts(body, false);

        var cmd = new ViewTransitionCommand(tick, transitionType);
        parser.setParent(tick, cmd);
        parser.setParent(body, cmd);
        endCmd.parent = cmd;
        return cmd;
    }

    resolve(context, { type }) {
        if (!document.startViewTransition) {
            return this.body;
        }

        if (context.meta.viewTransition) {
            throw new Error("A view transition is already in progress");
        }

        var bodyDone;
        var bodyPromise = new Promise(function (r) { bodyDone = r; });

        var options = function () { return bodyPromise; };
        if (type) {
            options = { update: function () { return bodyPromise; }, types: [type] };
        }
        var transition = document.startViewTransition(options);

        context.meta.viewTransition = { bodyDone: bodyDone, finished: transition.finished, transition: transition };

        // tick → body → ViewTransitionEnd, all through normal control flow
        return this.body;
    }
}
