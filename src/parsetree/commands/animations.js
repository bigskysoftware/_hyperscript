/**
 * Animation command parse tree elements
 * Commands for CSS transitions and animations (transition, settle)
 */

import { ParseElement, Command, Expression } from '../base.js';
import { config } from '../../core/config.js';


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
 * Parses: transition <expr> [from value] to value [<expr> from/to ...] [over time | using transition]
 * Each <expr> is any writable style expression (*width, my *opacity,
 * #el's *height, *color of the next <div/>, the next <div/>'s *width, etc.)
 */
export class TransitionCommand extends Command {
    static keyword = "transition";

    constructor(propExprs, from, to, usingExpr, over) {
        super();
        this.propExprs = propExprs;
        this.from = from;
        this.to = to;
        this.usingExpr = usingExpr;
        this.over = over;
        this.args = { from, to, using: usingExpr, over };
    }

    static parse(parser) {
        if (!parser.matchToken("transition")) return;

        var propExprs = [];
        var from = [];
        var to = [];

        do {
            var follows = parser.pushFollows("from", "to");
            try {
                propExprs.push(parser.requireElement("expression"));
            } finally {
                parser.popFollows(follows);
            }

            from.push(parser.matchToken("from") ? parser.requireElement("expression") : null);
            parser.requireToken("to");
            to.push(parser.matchToken("initial") ? "initial" : parser.requireElement("expression"));
        } while (!parser.commandBoundary(parser.currentToken()) &&
                 parser.currentToken().value !== "over" &&
                 parser.currentToken().value !== "using")

        var over, usingExpr;
        if (parser.matchToken("over")) {
            over = parser.requireElement("expression");
        } else if (parser.matchToken("using")) {
            usingExpr = parser.requireElement("expression");
        }

        return new TransitionCommand(propExprs, from, to, usingExpr, over);
    }

    resolve(context, { from, to, using, over }) {
        var cmd = this;
        var runtime = context.meta.runtime;

        // Resolve target element (for style.transition).
        // For possessive/of forms the root is the target element.
        // For bare *prop, target is me.
        var target;
        if (this.propExprs[0].root) {
            target = this.propExprs[0].root.evaluate(context);
            runtime.nullCheck(target, this.propExprs[0].root);
        } else {
            target = context.me;
        }

        var promises = [];
        runtime.implicitLoop(target, function (target) {
            promises.push(new Promise(function (resolve) {
                var initialTransition = target.style.transition;
                if (over) {
                    target.style.transition = "all " + over + "ms ease-in";
                } else if (using) {
                    target.style.transition = using;
                } else {
                    target.style.transition = config.defaultTransition;
                }

                // Capture initial values on first run per element (for `to initial`).
                // Uses the expression index as key, stored on the element so
                // subsequent transitions restore the original value, not the current one.
                var internalData = runtime.getInternalData(target);
                if (!internalData.transitionInitials) internalData.transitionInitials = {};
                var initialValues = internalData.transitionInitials;
                for (var j = 0; j < cmd.propExprs.length; j++) {
                    if (!(j in initialValues)) {
                        initialValues[j] = cmd.propExprs[j].evaluate(context);
                    }
                }

                // Set from values
                for (var j = 0; j < cmd.propExprs.length; j++) {
                    if (from[j] != null) {
                        var lhs = {};
                        for (var key in cmd.propExprs[j].lhs) {
                            var e = cmd.propExprs[j].lhs[key];
                            lhs[key] = e && e.evaluate ? e.evaluate(context) : e;
                        }
                        cmd.propExprs[j].set(context, lhs, from[j]);
                    }
                }

                var transitionStarted = false;
                var resolved = false;
                target.addEventListener("transitionend", function () {
                    if (!resolved) { target.style.transition = initialTransition; resolved = true; resolve(); }
                }, { once: true });
                target.addEventListener("transitionstart", function () { transitionStarted = true; }, { once: true });
                setTimeout(function () {
                    if (!resolved && !transitionStarted) { target.style.transition = initialTransition; resolved = true; resolve(); }
                }, 100);

                // Set to values (in next microtask so transition triggers)
                setTimeout(function () {
                    for (var j = 0; j < cmd.propExprs.length; j++) {
                        var lhs = {};
                        for (var key in cmd.propExprs[j].lhs) {
                            var e = cmd.propExprs[j].lhs[key];
                            lhs[key] = e && e.evaluate ? e.evaluate(context) : e;
                        }
                        var val = to[j] === "initial" ? initialValues[j] : to[j];
                        cmd.propExprs[j].set(context, lhs, val);
                    }
                }, 0);
            }));
        });

        return Promise.all(promises).then(function () { return cmd.findNext(context); });
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
