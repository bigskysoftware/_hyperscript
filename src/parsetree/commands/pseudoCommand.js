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
     * @param {ParserHelper} helper
     * @returns {Object | undefined}
     */
    static parse(helper) {
        let lookAhead = helper.token(1);
        if (!(lookAhead && lookAhead.op && (lookAhead.value === '.' || lookAhead.value === "("))) {
            return null;
        }

        var expr = helper.requireElement("primaryExpression");

        var rootRoot = expr.root;
        var root = expr;
        while (rootRoot.root != null) {
            root = root.root;
            rootRoot = rootRoot.root;
        }

        if (expr.type !== "functionCall") {
            helper.raiseParseError("Pseudo-commands must be function calls");
        }

        if (root.type === "functionCall" && root.root.root == null) {
            if (helper.matchAnyToken("the", "to", "on", "with", "into", "from", "at")) {
                var realRoot = helper.requireElement("expression");
            } else if (helper.matchToken("me")) {
                var realRoot = helper.requireElement("implicitMeTarget");
            }
        }

        var pseudoCommand;
        if (realRoot) {
            pseudoCommand = {
                type: "pseudoCommand",
                root: realRoot,
                argExressions: root.argExressions,
                args: [realRoot, root.argExressions],
                op: function (context, rootRoot, args) {
                    context.meta.runtime.nullCheck(rootRoot, realRoot);
                    var func = rootRoot[root.root.name];
                    context.meta.runtime.nullCheck(func, root);
                    if (func.hyperfunc) {
                        args.push(context);
                    }
                    context.result = func.apply(rootRoot, args);
                    return context.meta.runtime.findNext(pseudoCommand, context);
                },
                execute: function (context) {
                    return context.meta.runtime.unifiedExec(this, context);
                },
            };
        } else {
            pseudoCommand = {
                type: "pseudoCommand",
                expr: expr,
                args: [expr],
                op: function (context, result) {
                    context.result = result;
                    return context.meta.runtime.findNext(pseudoCommand, context);
                },
                execute: function (context) {
                    return context.meta.runtime.unifiedExec(this, context);
                },
            };
        }

        return pseudoCommand;
    }
}
