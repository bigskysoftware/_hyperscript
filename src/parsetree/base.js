/**
 * Base classes for parse tree elements
 */

/**
 * ParseElement - Root base class for all parse tree elements
 *
 * Provides common functionality for all parse tree nodes including
 * expressions, commands, and features.
 */
export class ParseElement {
    errors = [];

    collectErrors(visited) {
        if (!visited) visited = new Set();
        if (visited.has(this)) return [];
        visited.add(this);
        var all = [...this.errors];
        for (var key of Object.keys(this)) {
            for (var item of [this[key]].flat()) {
                if (item instanceof ParseElement) {
                    all.push(...item.collectErrors(visited));
                }
            }
        }
        return all;
    }

    sourceFor() {
        return this.programSource.substring(this.startToken.start, this.endToken.end);
    }

    lineFor() {
        return this.programSource.split("\n")[this.startToken.line - 1];
    }

    static parseEventArgs(parser) {
        var args = [];
        // handle argument list (look ahead 3)
        if (
            parser.token(0).value === "(" &&
            (parser.token(1).value === ")" || parser.token(2).value === "," || parser.token(2).value === ")")
        ) {
            parser.matchOpToken("(");
            do {
                args.push(parser.requireTokenType("IDENTIFIER"));
            } while (parser.matchOpToken(","));
            parser.requireOpToken(")");
        }
        return args;
    }
}

/**
 * Expression - Base class for all expressions
 *
 * Delegates to Runtime.unifiedEval for evaluation.
 * Subclasses define resolve() and args for their logic.
 * Type is auto-derived from static grammarName.
 */
export class Expression extends ParseElement {
    constructor() {
        super();
        if (this.constructor.grammarName) {
            this.type = this.constructor.grammarName;
        }
    }

    evaluate(context) {
        return context.meta.runtime.unifiedEval(this, context);
    }

    evalStatically() {
        throw new Error("This expression cannot be evaluated statically: " + this.type);
    }
}

/**
 * Command - Base class for all commands
 *
 * Delegates to Runtime.unifiedExec for execution.
 * Subclasses define resolve() and args for their logic.
 * Type is auto-derived from static keyword + "Command".
 */
export class Command extends ParseElement {
    constructor() {
        super();
        if (this.constructor.keyword) {
            this.type = this.constructor.keyword + "Command";
        }
    }

    execute(context) {
        context.meta.command = this;
        return context.meta.runtime.unifiedExec(this, context);
    }

    findNext(context) {
        return context.meta.runtime.findNext(this, context);
    }

}

/**
 * Feature - Base class for all features
 *
 * Features define behavior that is installed on elements.
 * Subclasses implement install() method for their specific logic.
 * Type is auto-derived from static keyword + "Feature".
 */
export class Feature extends ParseElement {
    isFeature = true;

    constructor() {
        super();
        if (this.constructor.keyword) {
            this.type = this.constructor.keyword + "Feature";
        }
    }

    install(target, source, args, runtime) {
        // Subclasses override this method
    }

    /**
     * Parse optional catch/finally blocks after a command list.
     * Returns { errorHandler, errorSymbol, finallyHandler }
     */
    static parseErrorAndFinally(parser) {
        var errorSymbol, errorHandler, finallyHandler;
        if (parser.matchToken("catch")) {
            errorSymbol = parser.requireTokenType("IDENTIFIER").value;
            errorHandler = parser.requireElement("commandList");
            parser.ensureTerminated(errorHandler);
        }
        if (parser.matchToken("finally")) {
            finallyHandler = parser.requireElement("commandList");
            parser.ensureTerminated(finallyHandler);
        }
        return { errorHandler, errorSymbol, finallyHandler };
    }
}
