/**
 * Postfix expression parse tree elements
 * Handles CSS units, time expressions, and type checking
 */

// CSS unit postfixes
// taken from https://drafts.csswg.org/css-values-4/#relative-length
//        and https://drafts.csswg.org/css-values-4/#absolute-length
//        (NB: we do not support `in` due to conflicts w/ the hyperscript grammar)
const STRING_POSTFIXES = [
    'em', 'ex', 'cap', 'ch', 'ic', 'rem', 'lh', 'rlh', 'vw', 'vh', 'vi', 'vb', 'vmin', 'vmax',
    'cm', 'mm', 'Q', 'pc', 'pt', 'px'
];

/**
 * StringPostfixExpressionNode - String postfix expression node
 */
class StringPostfixExpressionNode {
    constructor(root, postfix) {
        this.type = "stringPostfix";
        this.postfix = postfix;
        this.args = [root];
    }

    op(context, val) {
        return "" + val + this.postfix;
    }

    evaluate(context) {
        return context.meta.runtime.unifiedEval(this, context);
    }
}

/**
 * String postfix expression (CSS units or %)
 */
export class StringPostfixExpression {
    /**
     * Parse string postfix expression
     * @param {Parser} parser
     * @param {Object} root - the root expression to apply postfix to
     * @returns {StringPostfixExpressionNode | undefined}
     */
    static parse(parser, root) {
        let stringPostfix = parser.tokens.matchAnyToken.apply(parser.tokens, STRING_POSTFIXES) || parser.matchOpToken("%");
        if (!stringPostfix) return;

        return new StringPostfixExpressionNode(root, stringPostfix.value);
    }
}

/**
 * Time expression (s/seconds or ms/milliseconds)
 */
/**
 * TimeExpressionNode - Time expression node
 */
class TimeExpressionNode {
    constructor(root, timeFactor) {
        this.type = "timeExpression";
        this.time = root;
        this.factor = timeFactor;
        this.args = [root];
    }

    op(context, val) {
        return val * this.factor;
    }

    evaluate(context) {
        return context.meta.runtime.unifiedEval(this, context);
    }
}

export class TimeExpression {
    /**
     * Parse time expression
     * @param {Parser} parser
     * @param {Object} root - the root expression to apply time factor to
     * @returns {TimeExpressionNode | undefined}
     */
    static parse(parser, root) {
        var timeFactor = null;
        if (parser.matchToken("s") || parser.matchToken("seconds")) {
            timeFactor = 1000;
        } else if (parser.matchToken("ms") || parser.matchToken("milliseconds")) {
            timeFactor = 1;
        }
        if (!timeFactor) return;

        return new TimeExpressionNode(root, timeFactor);
    }
}

/**
 * TypeCheckExpressionNode - Type check expression node
 */
class TypeCheckExpressionNode {
    constructor(root, typeName, nullOk) {
        this.type = "typeCheck";
        this.typeName = typeName;
        this.nullOk = nullOk;
        this.args = [root];
    }

    op(context, val) {
        var passed = context.meta.runtime.typeCheck(val, this.typeName.value, this.nullOk);
        if (passed) {
            return val;
        } else {
            throw new Error("Typecheck failed!  Expected: " + this.typeName.value);
        }
    }

    evaluate(context) {
        return context.meta.runtime.unifiedEval(this, context);
    }
}

/**
 * Type check expression (:type or :type!)
 */
export class TypeCheckExpression {
    /**
     * Parse type check expression
     * @param {Parser} parser
     * @param {Object} root - the root expression to type check
     * @returns {TypeCheckExpressionNode | undefined}
     */
    static parse(parser, root) {
        if (!parser.matchOpToken(":")) return;

        var typeName = parser.requireTokenType("IDENTIFIER");
        if (!typeName.value) return;
        var nullOk = !parser.matchOpToken("!");

        return new TypeCheckExpressionNode(root, typeName, nullOk);
    }
}
