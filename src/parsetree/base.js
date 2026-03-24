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

    // TODO - this needs to get moved somewhere else
    static parsePseudopossessiveTarget(parser) {
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
                parser.possessivesDisabled = false;
            }
            if (parser.matchOpToken("'")) {
                parser.requireToken("s");
            }
        } else if (parser.currentToken().type === "IDENTIFIER" && parser.currentToken().value === "its") {
            targets = parser.parseElement("pseudopossessiveIts");
        } else {
            parser.matchToken("my") || parser.matchToken("me");
            targets = parser.parseElement("implicitMeTarget");
        }
        return targets;
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
}
