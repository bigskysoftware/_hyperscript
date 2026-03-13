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
    // Common base for all parse tree elements
    // Can be extended with shared functionality in the future
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
