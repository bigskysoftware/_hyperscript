import { Command } from '../base.js';

/**
 * PseudoCommandWithTarget - Function call with explicit target
 */
class PseudoCommandWithTarget extends Command {
    constructor(realRoot, root) {
        super();
        this.type = "pseudoCommand";
        this.root = realRoot;
        this.argExressions = root.argExressions;
        this.args = [realRoot, root.argExressions];
        this._root = root;  // Keep reference for op
        this._realRoot = realRoot;  // Keep reference for op
    }

    resolve(context, rootRoot, args) {
        context.meta.runtime.nullCheck(rootRoot, this._realRoot);
        var func = rootRoot[this._root.root.name];
        context.meta.runtime.nullCheck(func, this._root);
        if (func.hyperfunc) {
            args.push(context);
        }
        context.result = func.apply(rootRoot, args);
        return context.meta.runtime.findNext(this, context);
    }
}

/**
 * PseudoCommandSimple - Function call without explicit target
 */
class PseudoCommandSimple extends Command {
    constructor(expr) {
        super();
        this.type = "pseudoCommand";
        this.expr = expr;
        this.args = [expr];
    }

    resolve(context, result) {
        context.result = result;
        return context.meta.runtime.findNext(this, context);
    }
}

/**
 * PseudoCommand - Function call syntax that looks like a command
 *
 * Parses: <functionCall> [the|to|on|with|into|from|at|me <expression>]
 * Example: increment(x) by 1
 *          show(modal) to me
 *          call(func) with args
 *
 * Executes: Evaluates the function call and optional target expression
 */
export class PseudoCommand {
    /**
     * Parse pseudo-command
     * @param {Parser} parser
     * @returns {PseudoCommandWithTarget | PseudoCommandSimple | undefined}
     */
    static parse(parser) {
        let lookAhead = parser.token(1);
        if (!(lookAhead && lookAhead.op && (lookAhead.value === '.' || lookAhead.value === "("))) {
            return null;
        }

        var expr = parser.requireElement("primaryExpression");

        var rootRoot = expr.root;
        var root = expr;
        while (rootRoot.root != null) {
            root = root.root;
            rootRoot = rootRoot.root;
        }

        if (expr.type !== "functionCall") {
            parser.raiseParseError("Pseudo-commands must be function calls");
        }

        if (root.type === "functionCall" && root.root.root == null) {
            if (parser.matchAnyToken("the", "to", "on", "with", "into", "from", "at")) {
                var realRoot = parser.requireElement("expression");
            } else if (parser.matchToken("me")) {
                var realRoot = parser.requireElement("implicitMeTarget");
            }
        }

        if (realRoot) {
            return new PseudoCommandWithTarget(realRoot, root);
        } else {
            return new PseudoCommandSimple(expr);
        }
    }
}
