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
     * @param {ParserHelper} helper
     * @param {Object} root - the root expression to apply postfix to
     * @returns {Object | undefined}
     */
    static parse(helper, root) {
        let stringPostfix = helper.tokens.matchAnyToken.apply(helper.tokens, STRING_POSTFIXES) || helper.matchOpToken("%");
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
     * @param {ParserHelper} helper
     * @param {Object} root - the root expression to apply time factor to
     * @returns {Object | undefined}
     */
    static parse(helper, root) {
        var timeFactor = null;
        if (helper.matchToken("s") || helper.matchToken("seconds")) {
            timeFactor = 1000;
        } else if (helper.matchToken("ms") || helper.matchToken("milliseconds")) {
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
     * @param {ParserHelper} helper
     * @param {Object} root - the root expression to type check
     * @returns {Object | undefined}
     */
    static parse(helper, root) {
        if (!helper.matchOpToken(":")) return;

        var typeName = helper.requireTokenType("IDENTIFIER");
        if (!typeName.value) return;
        var nullOk = !helper.matchOpToken("!");

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
