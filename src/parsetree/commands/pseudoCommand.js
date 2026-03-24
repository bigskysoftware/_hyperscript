import { Command } from '../base.js';

/**
 * PseudoCommand - Function call syntax that looks like a command
 *
 * Parses: <functionCall> [the|to|on|with|into|from|at|me <expression>]
 * Executes: Evaluates the function call and optional target expression
 */
export class PseudoCommand extends Command {
    constructor(variant, expr, realRoot, root) {
        super();
        this.variant = variant;
        this.expr = expr;
        this._root = root;
        this._realRoot = realRoot;
        if (variant === "target") {
            this.root = realRoot;
            this.argExressions = root.argExressions;
            this.args = [realRoot, root.argExressions];
        } else {
            this.args = [expr];
        }
    }

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
            return new PseudoCommand("target", expr, realRoot, root);
        } else {
            return new PseudoCommand("simple", expr, null, null);
        }
    }

    resolve(context, ...resolvedArgs) {
        if (this.variant === "target") {
            var rootRoot = resolvedArgs[0];
            var args = resolvedArgs[1];
            context.meta.runtime.nullCheck(rootRoot, this._realRoot);
            var func = rootRoot[this._root.root.name];
            context.meta.runtime.nullCheck(func, this._root);
            if (func.hyperfunc) {
                args.push(context);
            }
            context.result = func.apply(rootRoot, args);
        } else {
            context.result = resolvedArgs[0];
        }
        return context.meta.runtime.findNext(this, context);
    }
}
