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
 * String postfix expression (CSS units or %)
 */
export class StringPostfixExpression {
    /**
     * Parse string postfix expression
     * @param {Parser} parser
     * @param {Object} root - the root expression to apply postfix to
     * @returns {Object | undefined}
     */
    static parse(parser, root) {
        let stringPostfix = parser.tokens.matchAnyToken.apply(parser.tokens, STRING_POSTFIXES) || parser.matchOpToken("%");
        if (!stringPostfix) return;

        return {
            type: "stringPostfix",
            postfix: stringPostfix.value,
            args: [root],
            op: function (context, val) {
                return "" + val + stringPostfix.value;
            },
            evaluate: function (context) {
                return context.meta.runtime.unifiedEval(this, context);
            },
        };
    }
}

/**
 * Time expression (s/seconds or ms/milliseconds)
 */
export class TimeExpression {
    /**
     * Parse time expression
     * @param {Parser} parser
     * @param {Object} root - the root expression to apply time factor to
     * @returns {Object | undefined}
     */
    static parse(parser, root) {
        var timeFactor = null;
        if (parser.matchToken("s") || parser.matchToken("seconds")) {
            timeFactor = 1000;
        } else if (parser.matchToken("ms") || parser.matchToken("milliseconds")) {
            timeFactor = 1;
        }
        if (!timeFactor) return;

        return {
            type: "timeExpression",
            time: root,
            factor: timeFactor,
            args: [root],
            op: function (context, val) {
                return val * timeFactor;
            },
            evaluate: function (context) {
                return context.meta.runtime.unifiedEval(this, context);
            },
        };
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
     * @returns {Object | undefined}
     */
    static parse(parser, root) {
        if (!parser.matchOpToken(":")) return;

        var typeName = parser.requireTokenType("IDENTIFIER");
        if (!typeName.value) return;
        var nullOk = !parser.matchOpToken("!");

        return {
            type: "typeCheck",
            typeName: typeName,
            nullOk: nullOk,
            args: [root],
            op: function (context, val) {
                var passed = context.meta.runtime.typeCheck(val, this.typeName.value, nullOk);
                if (passed) {
                    return val;
                } else {
                    throw new Error("Typecheck failed!  Expected: " + typeName.value);
                }
            },
            evaluate: function (context) {
                return context.meta.runtime.unifiedEval(this, context);
            },
        };
    }
}
