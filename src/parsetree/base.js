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
 * Subclasses define op() and args for their logic.
 */
export class Expression extends ParseElement {
    /**
     * Evaluate this expression using Runtime.unifiedEval
     *
     * @param {Context} context - Execution context
     * @returns {*} - Result value or Promise
     */
    evaluate(context) {
        return context.meta.runtime.unifiedEval(this, context);
    }
}

/**
 * Command - Base class for all commands
 *
 * Delegates to Runtime.unifiedExec for execution.
 * Subclasses define op() and args for their logic.
 */
export class Command extends ParseElement {
    /**
     * Execute this command using Runtime.unifiedExec
     *
     * @param {Context} context - Execution context
     * @returns {*} - Next command or Promise
     */
    execute(context) {
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
                delete parser.possessivesDisabled;
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
 */
export class Feature extends ParseElement {
    /**
     * Install this feature on a target element
     *
     * @param {Element} target - Target element to install on
     * @param {Element} source - Source element where feature is defined
     * @param {*} args - Installation arguments
     * @param {Runtime} runtime - Runtime instance
     */
    install(target, source, args, runtime) {
        // Subclasses override this method
    }
}
