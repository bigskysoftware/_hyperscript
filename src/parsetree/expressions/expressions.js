/**
 * Basic expression parse tree elements
 */

import { Expression } from '../base.js';

/**
 * ParenthesizedExpression - Wraps an expression in parentheses
 *
 * Parses: (expression)
 * Returns: the inner expression
 */
export class ParenthesizedExpression extends Expression {
    static grammarName = "parenthesized";
    static expressionType = "leaf";

    constructor(expr) {
        super();
        this.expr = expr;
        this.args = { value: expr };
    }

    static parse(parser) {
        if (parser.matchOpToken("(")) {
            var follows = parser.clearFollows();
            try {
                var expr = parser.requireElement("expression");
            } finally {
                parser.restoreFollows(follows);
            }
            parser.requireOpToken(")");
            return new ParenthesizedExpression(expr);
        }
    }

    resolve(context, { value }) {
        return value;
    }
}

/**
 * BlockLiteral - Represents lambda-style block expressions
 *
 * Parses: \x -> expr or \x, y -> expr
 * Returns: function that evaluates the expression with bound arguments
 */
export class BlockLiteral extends Expression {
    static grammarName = "blockLiteral";
    static expressionType = "leaf";

    constructor(params, expr) {
        super();
        this.params = params;
        this.expr = expr;
    }

    static parse(parser) {
        if (!parser.matchOpToken("\\")) return;
        var params = [];
        var arg1 = parser.matchTokenType("IDENTIFIER");
        if (arg1) {
            params.push(arg1);
            while (parser.matchOpToken(",")) {
                params.push(parser.requireTokenType("IDENTIFIER"));
            }
        }
        // TODO compound op token
        parser.requireOpToken("-");
        parser.requireOpToken(">");
        var expr = parser.requireElement("expression");
        return new BlockLiteral(params, expr);
    }

    resolve(ctx) {
        var params = this.params;
        var expr = this.expr;
        return function () {
            //TODO - push scope
            for (var i = 0; i < params.length; i++) {
                ctx.locals[params[i].value] = arguments[i];
            }
            return expr.evaluate(ctx); //OK
        };
    }
}

/**
 * NegativeNumber - Represents unary minus operator
 *
 * Parses: -expression
 * Returns: negated numeric value
 */
export class NegativeNumber extends Expression {
    static grammarName = "negativeNumber";

    constructor(root) {
        super();
        this.root = root;
        this.args = { value: root };
    }

    static parse(parser) {
        if (parser.matchOpToken("-")) {
            var root = parser.requireElement("negativeNumber");
            return new NegativeNumber(root);
        } else {
            return parser.requireElement("primaryExpression");
        }
    }

    resolve(context, { value }) {
        return -1 * value;
    }
}

/**
 * LogicalNot - Represents logical NOT operator
 *
 * Parses: not expression
 * Returns: boolean negation
 */
export class LogicalNot extends Expression {
    static grammarName = "logicalNot";
    static expressionType = "unary";

    constructor(root) {
        super();
        this.root = root;
        this.args = { value: root };
    }

    static parse(parser) {
        if (!parser.matchToken("not")) return;
        var root = parser.requireElement("unaryExpression");
        return new LogicalNot(root);
    }

    resolve(context, { value: val }) {
        return !val;
    }
}

/**
 * SymbolRef - Represents variable/symbol references
 *
 * Parses: identifier | global identifier | local identifier | :identifier | $identifier
 * Returns: resolved symbol value
 */
export class SymbolRef extends Expression {
    static grammarName = "symbol";
    static assignable = true;

    constructor(token, scope, name, targetExpr) {
        super();
        this.token = token;
        this.scope = scope;
        this.name = name;
        this.targetExpr = targetExpr || null;
    }

    static parse(parser) {
        var scope = "default";
        if (parser.matchToken("global")) {
            scope = "global";
        } else if (parser.matchToken("element")) {
            scope = "element";
            // optional possessive
            if (parser.matchOpToken("'")) {
                parser.requireToken("s");
            }
        } else if (parser.matchToken("dom")) {
            scope = "inherited";
        } else if (parser.matchToken("local")) {
            scope = "local";
        }

        // TODO better look ahead here
        let eltPrefix = parser.matchOpToken(":");
        let caretPrefix = !eltPrefix && parser.matchOpToken("^");
        let identifier = parser.matchTokenType("IDENTIFIER");
        if (identifier && identifier.value) {
            var name = identifier.value;
            if (eltPrefix) {
                name = ":" + name;
            } else if (caretPrefix) {
                name = "^" + name;
            }
            if (scope === "default") {
                if (name.startsWith("$")) {
                    scope = "global";
                } else if (name.startsWith(":")) {
                    scope = "element";
                } else if (name.startsWith("^")) {
                    scope = "inherited";
                }
            }
            var targetExpr = null;
            if (scope === "inherited" && parser.matchToken("on")) {
                parser.pushFollow("to");
                parser.pushFollow("into");
                parser.pushFollow("before");
                parser.pushFollow("after");
                parser.pushFollow("then");
                try {
                    targetExpr = parser.requireElement("expression");
                } finally {
                    parser.popFollow();
                    parser.popFollow();
                    parser.popFollow();
                    parser.popFollow();
                    parser.popFollow();
                }
            }
            return new SymbolRef(identifier, scope, name, targetExpr);
        }
    }

    resolve(context) {
        return context.meta.runtime.resolveSymbol(this.name, context, this.scope,
            this.targetExpr ? this.targetExpr.evaluate(context) : null);
    }

    get lhs() { return {}; }

    set(ctx, lhs, value) {
        ctx.meta.runtime.setSymbol(this.name, ctx, this.scope, value,
            this.targetExpr ? this.targetExpr.evaluate(ctx) : null);
    }
}

/**
 * BeepExpression - Debug operator that logs expression values
 *
 * Parses: beep! expression
 * Returns: expression value (after logging to console)
 */
export class BeepExpression extends Expression {
    static grammarName = "beepExpression";
    static expressionType = "unary";

    constructor(expression) {
        super();
        this.expression = expression;
        this.expression['booped'] = true;
        this.args = { value: expression };
    }

    static parse(parser) {
        if (!parser.matchToken("beep!")) return;
        var expression = parser.parseElement("unaryExpression");
        if (expression) {
            return new BeepExpression(expression);
        }
    }

    resolve(ctx, { value }) {
        ctx.meta.runtime.beepValueToConsole(ctx.me, this.expression, value);
        return value;
    }
}

/**
 * PropertyAccess - Represents dot notation property access
 *
 * Parses: expression.property
 * Returns: property value from the root expression
 */
export class PropertyAccess extends Expression {
    static grammarName = "propertyAccess";
    static expressionType = "indirect";
    static assignable = true;

    constructor(root, prop) {
        super();
        this.root = root;
        this.prop = prop;
        this.args = { root };
    }

    static parse(parser, root) {
        if (!parser.matchOpToken(".")) return;
        var prop = parser.requireTokenType("IDENTIFIER");
        var propertyAccess = new PropertyAccess(root, prop);
        return parser.parseElement("indirectExpression", propertyAccess);
    }

    resolve(context, { root: rootVal }) {
        var value = context.meta.runtime.resolveProperty(rootVal, this.prop.value);
        return value;
    }

    get lhs() { return { root: this.root }; }

    set(ctx, lhs, value) {
        ctx.meta.runtime.nullCheck(lhs.root, this.root);
        var runtime = ctx.meta.runtime;
        runtime.implicitLoop(lhs.root, elt => {
            runtime.setProperty(elt, this.prop.value, value);
        });
    }
}

/**
 * OfExpression - Represents reversed property access (property of object)
 *
 * Parses: property of expression
 * Returns: property value from the expression
 */
export class OfExpression extends Expression {
    static grammarName = "ofExpression";
    static expressionType = "indirect";
    static assignable = true;

    constructor(prop, newRoot, attribute, expression, args, urRoot) {
        super();
        this.prop = prop; // token
        this.root = newRoot;
        this.attribute = attribute;
        this.expression = expression;
        this.args = args;
        this._urRoot = urRoot; // store the urRoot for op function
    }

    static parse(parser, root) {
        if (!parser.matchToken("of")) return;
        var newRoot = parser.requireElement("unaryExpression");
        // find the urroot
        var childOfUrRoot = null;
        var urRoot = root;
        while (urRoot.root) {
            childOfUrRoot = urRoot;
            urRoot = urRoot.root;
        }
        if (urRoot.type !== "symbol" && urRoot.type !== "attributeRef" && urRoot.type !== "styleRef" && urRoot.type !== "computedStyleRef") {
            parser.raiseParseError("Cannot take a property of a non-symbol: " + urRoot.type);
        }
        var attribute = urRoot.type === "attributeRef";
        var style = urRoot.type === "styleRef" || urRoot.type === "computedStyleRef";
        var attributeElt = (attribute || style) ? urRoot : null;
        var prop = urRoot.name;

        var propertyAccess = new OfExpression(
            urRoot.token,  // can be undefined for attributeRef
            newRoot,
            attributeElt,
            root,
            { root: newRoot },
            urRoot
        );

        if (urRoot.type === "attributeRef") {
            propertyAccess.attribute = urRoot;
        }
        if (childOfUrRoot) {
            childOfUrRoot.root = propertyAccess;
            childOfUrRoot.args = { root: propertyAccess };
        } else {
            root = propertyAccess;
        }

        return parser.parseElement("indirectExpression", root);
    }

    resolve(context, { root: rootVal }) {
        var urRoot = this._urRoot;
        var prop = urRoot.name;
        var attribute = urRoot.type === "attributeRef";
        var style = urRoot.type === "styleRef" || urRoot.type === "computedStyleRef";

        if (attribute) {
            return context.meta.runtime.resolveAttribute(rootVal, prop);
        } else if (style) {
            if (urRoot.type === "computedStyleRef") {
                return context.meta.runtime.resolveComputedStyle(rootVal, prop);
            } else {
                return context.meta.runtime.resolveStyle(rootVal, prop);
            }
        } else {
            return context.meta.runtime.resolveProperty(rootVal, prop);
        }
    }

    get lhs() { return { root: this.root }; }

    set(ctx, lhs, value) {
        ctx.meta.runtime.nullCheck(lhs.root, this.root);
        var urRoot = this._urRoot;
        var prop = urRoot.name;
        if (urRoot.type === "attributeRef") {
            ctx.meta.runtime.implicitLoop(lhs.root, elt => {
                value == null ? elt.removeAttribute(prop) : elt.setAttribute(prop, value);
            });
        } else if (urRoot.type === "styleRef") {
            ctx.meta.runtime.implicitLoop(lhs.root, elt => { elt.style[prop] = value; });
        } else {
            var runtime = ctx.meta.runtime;
            runtime.implicitLoop(lhs.root, elt => {
                runtime.setProperty(elt, prop, value);
            });
        }
    }
}

/**
 * PossessiveExpression - Represents possessive property access
 *
 * Parses: expression's property | my property | its property
 * Returns: property value
 */
export class PossessiveExpression extends Expression {
    static grammarName = "possessive";
    static expressionType = "indirect";
    static assignable = true;

    constructor(root, attribute, prop) {
        super();
        this.root = root;
        this.attribute = attribute;
        this.prop = prop;
        this.args = { root };
    }

    static parse(parser, root) {
        var apostrophe = parser.matchOpToken("'");
        if (
            apostrophe ||
            (root.type === "symbol" &&
                (root.name === "my" || root.name === "its" || root.name === "your") &&
                (parser.currentToken().type === "IDENTIFIER" || parser.currentToken().type === "ATTRIBUTE_REF" || parser.currentToken().type === "STYLE_REF"))
        ) {
            if (apostrophe) {
                parser.requireToken("s");
            }

            var attribute, style, prop;
            attribute = parser.parseElement("attributeRef");
            if (attribute == null) {
                style = parser.parseElement("styleRef");
                if (style == null) {
                    prop = parser.requireTokenType("IDENTIFIER");
                }
            }
            var propertyAccess = new PossessiveExpression(root, attribute || style, prop);
            return parser.parseElement("indirectExpression", propertyAccess);
        }
    }

    resolve(context, { root: rootVal }) {
        var value;
        if (this.attribute) {
            if (this.attribute.type === 'computedStyleRef') {
                value = context.meta.runtime.resolveComputedStyle(rootVal, this.attribute['name']);
            } else if (this.attribute.type === 'styleRef') {
                value = context.meta.runtime.resolveStyle(rootVal, this.attribute['name']);
            } else {
                value = context.meta.runtime.resolveAttribute(rootVal, this.attribute.name);
            }
        } else {
            value = context.meta.runtime.resolveProperty(rootVal, this.prop.value);
        }
        return value;
    }

    get lhs() { return { root: this.root }; }

    set(ctx, lhs, value) {
        ctx.meta.runtime.nullCheck(lhs.root, this.root);
        if (this.attribute) {
            var name = this.attribute.name;
            if (this.attribute.type === 'styleRef') {
                ctx.meta.runtime.implicitLoop(lhs.root, elt => { elt.style[name] = value; });
            } else {
                ctx.meta.runtime.implicitLoop(lhs.root, elt => {
                    value == null ? elt.removeAttribute(name) : elt.setAttribute(name, value);
                });
            }
        } else {
            var runtime = ctx.meta.runtime;
            var prop = this.prop.value;
            runtime.implicitLoop(lhs.root, elt => {
                runtime.setProperty(elt, prop, value);
            });
        }
    }
}

/**
 * InExpression - Represents containment check
 *
 * Parses: expression in target
 * Returns: filtered elements or boolean
 */
export class InExpression extends Expression {
    static grammarName = "inExpression";
    static expressionType = "indirect";

    constructor(root, target) {
        super();
        this.root = root;
        this.target = target;
        this.args = { root, target };
    }

    static parse(parser, root) {
        if (!parser.matchToken("in")) return;
        var target = parser.requireElement("unaryExpression");
        var inExpression = new InExpression(root, target);
        return parser.parseElement("indirectExpression", inExpression);
    }

    resolve(context, { root: rootVal, target }) {
        if (rootVal == null) return [];
        var returnArr = [];
        if (rootVal.css) {
            context.meta.runtime.implicitLoop(target, function (targetElt) {
                var results = targetElt.querySelectorAll(rootVal.css);
                for (var i = 0; i < results.length; i++) {
                    returnArr.push(results[i]);
                }
            });
        } else if (rootVal instanceof Element) {
            var within = false;
            context.meta.runtime.implicitLoop(target, function (targetElt) {
                if (targetElt.contains(rootVal)) {
                    within = true;
                }
            });
            if(within) {
                return rootVal;
            }
        } else {
            context.meta.runtime.implicitLoop(rootVal, function (rootElt) {
                context.meta.runtime.implicitLoop(target, function (targetElt) {
                    if (rootElt === targetElt) {
                        returnArr.push(rootElt);
                    }
                });
            });
        }
        return returnArr;
    }
}

/**
 * AsExpression - Type conversion expression
 *
 * Parses: expression as Type [| Type]*
 * Returns: converted value
 */
export class AsExpression extends Expression {
    static grammarName = "asExpression";
    static expressionType = "indirect";

    constructor(root, conversion) {
        super();
        this.root = root;
        this.conversion = conversion;
        this.args = { root };
    }

    static parse(parser, root) {
        if (!parser.matchToken("as")) return;
        parser.matchToken("a") || parser.matchToken("an");
        var conversion = parser.requireElement("dotOrColonPath").evalStatically();
        var asExpr = new AsExpression(root, conversion);
        while (parser.matchOpToken("|")) {
            conversion = parser.requireElement("dotOrColonPath").evalStatically();
            asExpr = new AsExpression(asExpr, conversion);
        }
        return parser.parseElement("indirectExpression", asExpr);
    }

    resolve(context, { root: rootVal }) {
        return context.meta.runtime.convertValue(rootVal, this.conversion);
    }
}

/**
 * FunctionCall - Represents function call expressions
 *
 * Parses: function(args) or object.method(args)
 * Returns: function result
 */
export class FunctionCall extends Expression {
    static grammarName = "functionCall";
    static expressionType = "indirect";

    constructor(root, argExpressions, args, isMethodCall) {
        super();
        this.root = root;
        this.argExpressions = argExpressions;
        this.args = args;
        this._isMethodCall = isMethodCall;
        this._parseRoot = root; // Store original root from parse time (before mutations)
    }

    static parse(parser, root) {
        if (!parser.matchOpToken("(")) return;
        var args = [];
        if (!parser.matchOpToken(")")) {
            do {
                args.push(parser.requireElement("expression"));
            } while (parser.matchOpToken(","));
            parser.requireOpToken(")");
        }

        var functionCall;
        if (root.root) {
            functionCall = new FunctionCall(root, args, { target: root.root, argVals: args }, true);
        } else {
            functionCall = new FunctionCall(root, args, { target: root, argVals: args }, false);
        }
        return parser.parseElement("indirectExpression", functionCall);
    }

    resolve(context, { target, argVals }) {
        if (this._isMethodCall) {
            context.meta.runtime.nullCheck(target, this._parseRoot.root);
            var func = target[this._parseRoot.prop.value];
            context.meta.runtime.nullCheck(func, this._parseRoot);
            if (func.hyperfunc) {
                argVals.push(context);
            }
            return func.apply(target, argVals);
        } else {
            context.meta.runtime.nullCheck(target, this._parseRoot);
            if (target.hyperfunc) {
                argVals.push(context);
            }
            return target(...argVals);
        }
    }
}

/**
 * AttributeRefAccess - Attribute reference on an expression
 *
 * Parses: expression@attribute
 * Returns: attribute value
 */
export class AttributeRefAccess extends Expression {
    static grammarName = "attributeRefAccess";
    static expressionType = "indirect";
    static assignable = true;

    constructor(root, attribute) {
        super();
        this.root = root;
        this.attribute = attribute;
        this.args = { root };
    }

    static parse(parser, root) {
        var attribute = parser.parseElement("attributeRef");
        if (!attribute) return;
        return new AttributeRefAccess(root, attribute);
    }

    resolve(_ctx, { root: rootVal }) {
        var value = _ctx.meta.runtime.resolveAttribute(rootVal, this.attribute.name);
        return value;
    }

    get lhs() { return { root: this.root }; }

    set(ctx, lhs, value) {
        ctx.meta.runtime.nullCheck(lhs.root, this.root);
        ctx.meta.runtime.implicitLoop(lhs.root, elt => {
            value == null ? elt.removeAttribute(this.attribute.name) : elt.setAttribute(this.attribute.name, value);
        });
    }
}

/**
 * ArrayIndex - Array/object indexing and slicing
 *
 * Parses: array[index] | array[start..end] | array[..end] | array[start..]
 * Returns: indexed value or slice
 */
export class ArrayIndex extends Expression {
    static grammarName = "arrayIndex";
    static expressionType = "indirect";
    static assignable = true;

    constructor(root, firstIndex, secondIndex, andBefore, andAfter) {
        super();
        this.root = root;
        this.prop = firstIndex;
        this.firstIndex = firstIndex;
        this.secondIndex = secondIndex;
        this.andBefore = andBefore;
        this.andAfter = andAfter;
        this.args = { root, firstIndex, secondIndex };
    }

    static parse(parser, root) {
        if (!parser.matchOpToken("[")) return;
        var andBefore = false;
        var andAfter = false;
        var firstIndex = null;
        var secondIndex = null;

        if (parser.matchOpToken("..")) {
            andBefore = true;
            firstIndex = parser.requireElement("expression");
        } else {
            firstIndex = parser.requireElement("expression");

            if (parser.matchOpToken("..")) {
                andAfter = true;
                var current = parser.currentToken();
                if (current.type !== "R_BRACKET") {
                    secondIndex = parser.parseElement("expression");
                }
            }
        }
        parser.requireOpToken("]");

        var arrayIndex = new ArrayIndex(root, firstIndex, secondIndex, andBefore, andAfter);
        return parser.parseElement("indirectExpression", arrayIndex);
    }

    resolve(_ctx, { root, firstIndex, secondIndex }) {
        if (root == null) {
            return null;
        }
        if (this.andBefore) {
            if (firstIndex < 0) {
                firstIndex = root.length + firstIndex;
            }
            return root.slice(0, firstIndex + 1); // returns all items from beginning to firstIndex (inclusive)
        } else if (this.andAfter) {
            if (secondIndex != null) {
                if (secondIndex < 0) {
                    secondIndex = root.length + secondIndex;
                }
                return root.slice(firstIndex, secondIndex + 1); // returns all items from firstIndex to secondIndex (inclusive)
            } else {
                return root.slice(firstIndex); // returns from firstIndex to end of array
            }
        } else {
            return root[firstIndex];
        }
    }

    get lhs() { return { root: this.root, index: this.firstIndex }; }

    set(ctx, lhs, value) {
        ctx.meta.runtime.nullCheck(lhs.root, this.root);
        lhs.root[lhs.index] = value;
    }
}

/**
 * MathOperator - Binary math operations
 *
 * Parses: expr + expr | expr - expr | expr * expr | expr / expr | expr mod expr
 * Returns: computed result
 * Note: Enforces same operator throughout chain (must parenthesize mixed operators)
 */
export class MathOperator extends Expression {
    static grammarName = "mathOperator";

    constructor(lhs, operator, rhs) {
        super();
        this.lhs = lhs;
        this.rhs = rhs;
        this.operator = operator;
        this.args = { lhs, rhs };
    }

    static parse(parser) {
        var expr = parser.parseElement("unaryExpression");
        var mathOp, initialMathOp = null;
        mathOp = parser.matchAnyOpToken("+", "-", "*", "/") || parser.matchToken('mod');
        while (mathOp) {
            initialMathOp = initialMathOp || mathOp;
            var operator = mathOp.value;
            if (initialMathOp.value !== operator) {
                parser.raiseParseError("You must parenthesize math operations with different operators");
            }
            var rhs = parser.parseElement("unaryExpression");
            expr = new MathOperator(expr, operator, rhs);
            mathOp = parser.matchAnyOpToken("+", "-", "*", "/") || parser.matchToken('mod');
        }
        return expr;
    }

    resolve(context, { lhs: lhsVal, rhs: rhsVal }) {
        if (this.operator === "+") {
            return lhsVal + rhsVal;
        } else if (this.operator === "-") {
            return lhsVal - rhsVal;
        } else if (this.operator === "*") {
            return lhsVal * rhsVal;
        } else if (this.operator === "/") {
            return lhsVal / rhsVal;
        } else if (this.operator === "mod") {
            return lhsVal % rhsVal;
        }
    }
}

/**
 * ComparisonOperator - Comparison operations
 *
 * Parses: expr == expr | expr < expr | expr is empty | expr matches pattern | etc.
 * Returns: boolean result
 * Supports: ==, !=, ===, !==, <, >, <=, >=, is, am, match, contain, include, start with, end with, between, exist, empty
 */
export class ComparisonOperator extends Expression {
    static grammarName = "comparisonOperator";

    constructor(lhs, operator, rhs, typeName, nullOk, ignoringCase, rhs2) {
        super();
        this.operator = operator;
        this.typeName = typeName;
        this.nullOk = nullOk;
        this.ignoringCase = ignoringCase;
        this.lhs = lhs;
        this.rhs = rhs;
        this.rhs2 = rhs2;
        this.args = { lhs, rhs, rhs2 };
    }

    sloppyContains(src, container, value) {
        if (container['contains']) {
            return container.contains(value);
        } else if (container['includes']) {
            return container.includes(value);
        } else {
            throw new Error("The value of " + src.sourceFor() + " does not have a contains or includes method on it");
        }
    }

    sloppyMatches(src, target, toMatch) {
        if (target['match']) {
            return !!target.match(toMatch);
        } else if (target['matches']) {
            return target.matches(toMatch);
        } else {
            throw new Error("The value of " + src.sourceFor() + " does not have a match or matches method on it");
        }
    }

    static parse(parser) {
        var expr = parser.parseElement("mathOperator");
        var comparisonToken = parser.matchAnyOpToken("<", ">", "<=", ">=", "==", "===", "!=", "!==");
        var operator = comparisonToken ? comparisonToken.value : null;
        var hasRightValue = true;
        var typeCheck = false;

        if (operator == null) {
            if (parser.matchToken("is") || parser.matchToken("am")) {
                if (parser.matchToken("not")) {
                    if (parser.matchToken("in")) {
                        operator = "not in";
                    } else if (parser.matchToken("a") || parser.matchToken("an")) {
                        operator = "not a";
                        typeCheck = true;
                    } else if (parser.matchToken("empty")) {
                        operator = "not empty";
                        hasRightValue = false;
                    } else if (parser.matchToken("between")) {
                        operator = "not between";
                    } else {
                        if (parser.matchToken("really")) {
                            operator = "!==";
                        } else {
                            operator = "!=";
                        }
                        if (parser.matchToken("equal")) {
                            parser.matchToken("to");
                        }
                    }
                } else if (parser.matchToken("in")) {
                    operator = "in";
                } else if (parser.matchToken("a") || parser.matchToken("an")) {
                    operator = "a";
                    typeCheck = true;
                } else if (parser.matchToken("empty")) {
                    operator = "empty";
                    hasRightValue = false;
                } else if (parser.matchToken("between")) {
                    operator = "between";
                } else if (parser.matchToken("less")) {
                    parser.requireToken("than");
                    if (parser.matchToken("or")) {
                        parser.requireToken("equal");
                        parser.requireToken("to");
                        operator = "<=";
                    } else {
                        operator = "<";
                    }
                } else if (parser.matchToken("greater")) {
                    parser.requireToken("than");
                    if (parser.matchToken("or")) {
                        parser.requireToken("equal");
                        parser.requireToken("to");
                        operator = ">=";
                    } else {
                        operator = ">";
                    }
                } else {
                    if (parser.matchToken("really")) {
                        operator = "===";
                    } else {
                        operator = "==";
                    }
                    if (parser.matchToken("equal")) {
                        parser.matchToken("to");
                    }
                }
            } else if (parser.matchToken("equals")) {
                operator = "==";
            } else if (parser.matchToken("really")) {
                parser.requireToken("equals")
                operator = "===";
            } else if (parser.matchToken("exist") || parser.matchToken("exists")) {
                operator = "exist";
                hasRightValue = false;
            } else if (parser.matchToken("matches") || parser.matchToken("match")) {
                operator = "match";
            } else if (parser.matchToken("contains") || parser.matchToken("contain")) {
                operator = "contain";
            } else if (parser.matchToken("includes") || parser.matchToken("include")) {
                operator = "include";
            } else if (parser.matchToken("starts")) {
                parser.requireToken("with");
                operator = "start with";
            } else if (parser.matchToken("ends")) {
                parser.requireToken("with");
                operator = "end with";
            } else if (parser.matchToken("do") || parser.matchToken("does")) {
                parser.requireToken("not");
                if (parser.matchToken("matches") || parser.matchToken("match")) {
                    operator = "not match";
                } else if (parser.matchToken("contains") || parser.matchToken("contain")) {
                    operator = "not contain";
                } else if (parser.matchToken("exist")) {
                    operator = "not exist";
                    hasRightValue = false;
                } else if (parser.matchToken("include")) {
                    operator = "not include";
                } else if (parser.matchToken("start")) {
                    parser.requireToken("with");
                    operator = "not start with";
                } else if (parser.matchToken("end")) {
                    parser.requireToken("with");
                    operator = "not end with";
                } else {
                    parser.raiseParseError("Expected matches, contains, starts with, or ends with");
                }
            }
        }

        if (operator) {
            var typeName, nullOk, rhs;
            if (typeCheck) {
                typeName = parser.requireTokenType("IDENTIFIER");
                nullOk = !parser.matchOpToken("!");
            } else if (hasRightValue) {
                rhs = parser.requireElement("mathOperator");
                if (operator === "match" || operator === "not match") {
                    rhs = rhs.css ? rhs.css : rhs;
                }
            }
            var rhs2 = null;
            if (operator === "between" || operator === "not between") {
                parser.requireToken("and");
                rhs2 = parser.requireElement("mathOperator");
            }
            var ignoringCase = false;
            if (parser.matchToken("ignoring")) {
                parser.requireToken("case");
                ignoringCase = true;
            }
            var lhs = expr;
            expr = new ComparisonOperator(lhs, operator, rhs, typeName, nullOk, ignoringCase, rhs2);
        }
        return expr;
    }

    resolve(context, { lhs: lhsVal, rhs: rhsVal, rhs2: rhs2Val }) {
        const operator = this.operator;
        const lhs = this.lhs;
        const rhs = this.rhs;
        const typeName = this.typeName;
        const nullOk = this.nullOk;

        if (this.ignoringCase) {
            if (typeof lhsVal === "string") lhsVal = lhsVal.toLowerCase();
            if (typeof rhsVal === "string") rhsVal = rhsVal.toLowerCase();
        }

        if (operator === "==") {
            return lhsVal == rhsVal;
        } else if (operator === "!=") {
            return lhsVal != rhsVal;
        }
        if (operator === "===") {
            return lhsVal === rhsVal;
        } else if (operator === "!==") {
            return lhsVal !== rhsVal;
        }
        if (operator === "match") {
            return lhsVal != null && this.sloppyMatches(lhs, lhsVal, rhsVal);
        }
        if (operator === "not match") {
            return lhsVal == null || !this.sloppyMatches(lhs, lhsVal, rhsVal);
        }
        if (operator === "in") {
            return rhsVal != null && this.sloppyContains(rhs, rhsVal, lhsVal);
        }
        if (operator === "not in") {
            return rhsVal == null || !this.sloppyContains(rhs, rhsVal, lhsVal);
        }
        if (operator === "contain") {
            return lhsVal != null && this.sloppyContains(lhs, lhsVal, rhsVal);
        }
        if (operator === "not contain") {
            return lhsVal == null || !this.sloppyContains(lhs, lhsVal, rhsVal);
        }
        if (operator === "include") {
            return lhsVal != null && this.sloppyContains(lhs, lhsVal, rhsVal);
        }
        if (operator === "not include") {
            return lhsVal == null || !this.sloppyContains(lhs, lhsVal, rhsVal);
        }
        if (operator === "start with") {
            return lhsVal != null && String(lhsVal).startsWith(rhsVal);
        }
        if (operator === "not start with") {
            return lhsVal == null || !String(lhsVal).startsWith(rhsVal);
        }
        if (operator === "end with") {
            return lhsVal != null && String(lhsVal).endsWith(rhsVal);
        }
        if (operator === "not end with") {
            return lhsVal == null || !String(lhsVal).endsWith(rhsVal);
        }
        if (operator === "between") {
            return lhsVal >= rhsVal && lhsVal <= rhs2Val;
        }
        if (operator === "not between") {
            return lhsVal < rhsVal || lhsVal > rhs2Val;
        }
        if (operator === "<") {
            return lhsVal < rhsVal;
        } else if (operator === ">") {
            return lhsVal > rhsVal;
        } else if (operator === "<=") {
            return lhsVal <= rhsVal;
        } else if (operator === ">=") {
            return lhsVal >= rhsVal;
        } else if (operator === "empty") {
            return context.meta.runtime.isEmpty(lhsVal);
        } else if (operator === "not empty") {
            return !context.meta.runtime.isEmpty(lhsVal);
        } else if (operator === "exist") {
            return context.meta.runtime.doesExist(lhsVal);
        } else if (operator === "not exist") {
            return !context.meta.runtime.doesExist(lhsVal);
        } else if (operator === "a") {
            return context.meta.runtime.typeCheck(lhsVal, typeName.value, nullOk);
        } else if (operator === "not a") {
            return !context.meta.runtime.typeCheck(lhsVal, typeName.value, nullOk);
        } else {
            throw new Error("Unknown comparison : " + operator);
        }
    }
}

/**
 * LogicalOperator - Logical and/or operations
 *
 * Parses: expr and expr | expr or expr
 * Returns: boolean result
 * Note: Enforces same operator throughout chain (must parenthesize mixed operators)
 */
export class LogicalOperator extends Expression {
    static grammarName = "logicalOperator";
    static expressionType = "top";

    constructor(lhs, operator, rhs) {
        super();
        this.operator = operator;
        this.lhs = lhs;
        this.rhs = rhs;
        this.args = { lhs, rhs };
    }

    static parse(parser) {
        var expr = parser.parseElement("comparisonOperator");
        var logicalOp, initialLogicalOp = null;
        logicalOp = parser.matchToken("and") || parser.matchToken("or");
        while (logicalOp) {
            initialLogicalOp = initialLogicalOp || logicalOp;
            if (initialLogicalOp.value !== logicalOp.value) {
                parser.raiseParseError("You must parenthesize logical operations with different operators");
            }
            var rhs = parser.requireElement("comparisonOperator");
            const operator = logicalOp.value;
            expr = new LogicalOperator(expr, operator, rhs);
            logicalOp = parser.matchToken("and") || parser.matchToken("or");
        }
        return expr;
    }

    resolve(context, { lhs: lhsVal, rhs: rhsVal }) {
        if (this.operator === "and") {
            return lhsVal && rhsVal;
        } else {
            return lhsVal || rhsVal;
        }
    }

    evaluate(context) {
        return context.meta.runtime.unifiedEval(this, context, this.operator === "or");
    }
}


/**
 * DotOrColonPath - Path with dots or colons
 *
 * Parses: identifier.identifier.identifier OR identifier:identifier:identifier
 * Returns: joined path string
 */
class DotOrColonPathNode extends Expression {
    constructor(path, separator) {
        super();
        this.type = "dotOrColonPath";
        this.path = path;
        this.separator = separator;
    }

    evalStatically() {
        return this.path.join(this.separator ? this.separator : "");
    }

    resolve() {
        return this.evalStatically();
    }
}

/**
 * CollectionOp - Centralized parser for collection postfix expressions.
 *
 * Handles: where, sorted by, mapped to, split by, joined by
 *
 * All collection keywords live in one list. When parsing the operand of any
 * collection op, the OTHER keywords are pushed as follows so they act as
 * boundaries. This is the single place to update when adding new collection ops.
 */
const COLLECTION_KEYWORDS = ["where", "sorted", "mapped", "split", "joined"];

function _parseCollectionOperand(parser, keyword) {
    var follows = COLLECTION_KEYWORDS.filter(k => k !== keyword);
    follows.forEach(f => parser.pushFollow(f));
    try {
        return parser.requireElement("expression");
    } finally {
        follows.forEach(() => parser.popFollow());
    }
}

export class CollectionOp extends Expression {
    static grammarName = "collectionOp";
    static expressionType = "indirect";

    static parse(parser, root) {
        if (parser.matchToken("where")) {
            var condition = _parseCollectionOperand(parser, "where");
            root = new WhereExpression(root, condition);
        } else if (parser.matchToken("sorted")) {
            parser.requireToken("by");
            var key = _parseCollectionOperand(parser, "sorted");
            var descending = parser.matchToken("descending");
            root = new SortedByExpression(root, key, !!descending);
        } else if (parser.matchToken("mapped")) {
            parser.requireToken("to");
            var projection = _parseCollectionOperand(parser, "mapped");
            root = new MappedToExpression(root, projection);
        } else if (parser.matchToken("split")) {
            parser.requireToken("by");
            var delimiter = _parseCollectionOperand(parser, "split");
            root = new SplitByExpression(root, delimiter);
        } else if (parser.matchToken("joined")) {
            parser.requireToken("by");
            var delimiter = _parseCollectionOperand(parser, "joined");
            root = new JoinedByExpression(root, delimiter);
        } else {
            return;
        }
        return parser.parseElement("indirectExpression", root);
    }
}

/** Filter a collection: <collection> where <condition using it/its> */
class WhereExpression extends Expression {
    constructor(root, condition) {
        super();
        this.root = root;
        this.condition = condition;
        this.args = { root };
    }

    resolve(context, { root: collection }) {
        var saved = context.result;
        var result = [];
        var items = Array.from(collection);
        for (var i = 0; i < items.length; i++) {
            context.result = items[i];
            if (this.condition.evaluate(context)) {
                result.push(items[i]);
            }
        }
        context.result = saved;
        return result;
    }
}

/** Sort a collection: <collection> sorted by <expr> [descending] */
class SortedByExpression extends Expression {
    constructor(root, key, descending) {
        super();
        this.root = root;
        this.key = key;
        this.descending = descending;
        this.args = { root };
    }

    resolve(context, { root: collection }) {
        var saved = context.result;
        var items = Array.from(collection);
        var keys = [];
        for (var i = 0; i < items.length; i++) {
            context.result = items[i];
            keys.push(this.key.evaluate(context));
        }
        context.result = saved;
        var indices = items.map(function (_, i) { return i; });
        var dir = this.descending ? -1 : 1;
        indices.sort(function (a, b) {
            var ka = keys[a], kb = keys[b];
            if (ka == kb) return 0;
            return (ka < kb ? -1 : 1) * dir;
        });
        return indices.map(function (i) { return items[i]; });
    }
}

/** Map a collection: <collection> mapped to <expr> */
class MappedToExpression extends Expression {
    constructor(root, projection) {
        super();
        this.root = root;
        this.projection = projection;
        this.args = { root };
    }

    resolve(context, { root: collection }) {
        var saved = context.result;
        var items = Array.from(collection);
        var result = [];
        for (var i = 0; i < items.length; i++) {
            context.result = items[i];
            result.push(this.projection.evaluate(context));
        }
        context.result = saved;
        return result;
    }
}

/** Split a string: <expr> split by <expr> */
class SplitByExpression extends Expression {
    constructor(root, delimiter) {
        super();
        this.args = { root, delimiter };
    }

    resolve(context, { root, delimiter }) {
        return String(root).split(delimiter);
    }
}

/** Join an array: <expr> joined by <expr> */
class JoinedByExpression extends Expression {
    constructor(root, delimiter) {
        super();
        this.args = { root, delimiter };
    }

    resolve(context, { root, delimiter }) {
        return Array.from(root).join(delimiter);
    }
}

export class DotOrColonPath extends Expression {
    static grammarName = "dotOrColonPath";

    static parse(parser) {
        var root = parser.matchTokenType("IDENTIFIER");
        if (root) {
            var path = [root.value];

            var separator = parser.matchOpToken(".") || parser.matchOpToken(":");
            if (separator) {
                do {
                    path.push(parser.requireTokenType("IDENTIFIER", "NUMBER").value);
                } while (parser.matchOpToken(separator.value));
            }

            return new DotOrColonPathNode(path, separator ? separator.value : null);
        }
    }
}