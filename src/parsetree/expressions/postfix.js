/**
 * Postfix expression parse tree elements
 * Handles CSS units, time expressions, and type checking
 */

import { Expression } from '../base.js';

// CSS unit postfixes
// taken from https://drafts.csswg.org/css-values-4/#relative-length
//        and https://drafts.csswg.org/css-values-4/#absolute-length
//        (NB: we do not support `in` due to conflicts w/ the hyperscript grammar)
const STRING_POSTFIXES = [
    'em', 'ex', 'cap', 'ch', 'ic', 'rem', 'lh', 'rlh', 'vw', 'vh', 'vi', 'vb', 'vmin', 'vmax',
    'cm', 'mm', 'Q', 'pc', 'pt', 'px'
];

export class StringPostfixExpression extends Expression {
    static grammarName = "stringPostfixExpression";
    static expressionType = "postfix";

    constructor(root, postfix) {
        super();
        this.type = "stringPostfix";
        this.postfix = postfix;
        this.args = [root];
    }

    static parse(parser, root) {
        let stringPostfix = parser.tokens.matchAnyToken.apply(parser.tokens, STRING_POSTFIXES) || parser.matchOpToken("%");
        if (!stringPostfix) return;

        return new StringPostfixExpression(root, stringPostfix.value);
    }

    resolve(context, val) {
        return "" + val + this.postfix;
    }
}

export class TimeExpression extends Expression {
    static grammarName = "timeExpression";
    static expressionType = "postfix";

    constructor(root, timeFactor) {
        super();
        this.type = "timeExpression";
        this.time = root;
        this.factor = timeFactor;
        this.args = [root];
    }

    static parse(parser, root) {
        var timeFactor = null;
        if (parser.matchToken("s") || parser.matchToken("seconds")) {
            timeFactor = 1000;
        } else if (parser.matchToken("ms") || parser.matchToken("milliseconds")) {
            timeFactor = 1;
        }
        if (!timeFactor) return;

        return new TimeExpression(root, timeFactor);
    }

    resolve(context, val) {
        return val * this.factor;
    }
}

export class TypeCheckExpression extends Expression {
    static grammarName = "typeCheckExpression";
    static expressionType = "postfix";

    constructor(root, typeName, nullOk) {
        super();
        this.type = "typeCheck";
        this.typeName = typeName;
        this.nullOk = nullOk;
        this.args = [root];
    }

    static parse(parser, root) {
        if (!parser.matchOpToken(":")) return;

        var typeName = parser.requireTokenType("IDENTIFIER");
        if (!typeName.value) return;
        var nullOk = !parser.matchOpToken("!");

        return new TypeCheckExpression(root, typeName, nullOk);
    }

    resolve(context, val) {
        var passed = context.meta.runtime.typeCheck(val, this.typeName.value, this.nullOk);
        if (passed) {
            return val;
        } else {
            throw new Error("Typecheck failed!  Expected: " + this.typeName.value);
        }
    }
}
