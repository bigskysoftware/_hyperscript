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
    /**
     * Parse a parenthesized expression
     * @param {Parser} parser
     * @returns {any | undefined}
     */
    static parse(parser) {
        if (parser.matchOpToken("(")) {
            var follows = parser.clearFollows();
            try {
                var expr = parser.requireElement("expression");
            } finally {
                parser.restoreFollows(follows);
            }
            parser.requireOpToken(")");
            return expr;
        }
    }
}

/**
 * BlockLiteral - Represents lambda-style block expressions
 *
 * Parses: \x -> expr or \x, y -> expr
 * Returns: function that evaluates the expression with bound arguments
 */
export class BlockLiteral extends Expression {
    constructor(params, expr) {
        super();
        this.type = "blockLiteral";
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
    constructor(root) {
        super();
        this.type = "negativeNumber";
        this.root = root;
        this.args = [root];
    }

    /**
     * Parse a negative number
     * @param {Parser} parser
     * @returns {NegativeNumber | any}
     */
    static parse(parser) {
        if (parser.matchOpToken("-")) {
            var root = parser.requireElement("negativeNumber");
            return new NegativeNumber(root);
        } else {
            return parser.requireElement("primaryExpression");
        }
    }

    /**
     * Op function for negation
     */
    resolve(context, value) {
        return -1 * value;
    }

    /**
     * Evaluate negated value
     * @param {Context} context
     * @returns {number}
     */
}

/**
 * LogicalNot - Represents logical NOT operator
 *
 * Parses: not expression
 * Returns: boolean negation
 */
export class LogicalNot extends Expression {
    constructor(root) {
        super();
        this.type = "logicalNot";
        this.root = root;
        this.args = [root];
    }

    /**
     * Parse a logical not expression
     * @param {Parser} parser
     * @returns {LogicalNot | undefined}
     */
    static parse(parser) {
        if (!parser.matchToken("not")) return;
        var root = parser.requireElement("unaryExpression");
        return new LogicalNot(root);
    }

    /**
     * Op function for logical not
     */
    resolve(context, val) {
        return !val;
    }

    /**
     * Evaluate logical not
     * @param {Context} context
     * @returns {boolean}
     */
}

/**
 * SymbolRef - Represents variable/symbol references
 *
 * Parses: identifier | global identifier | local identifier | :identifier | $identifier
 * Returns: resolved symbol value
 */
export class SymbolRef extends Expression {
    constructor(token, scope, name) {
        super();
        this.type = "symbol"
        this.token = token;
        this.scope = scope;
        this.name = name;
    }

    /**
     * Parse a symbol reference
     * @param {Parser} parser
     * @returns {SymbolRef | undefined}
     */
    static parse(parser) {
        var scope = "default";
        if (parser.matchToken("global")) {
            scope = "global";
        } else if (parser.matchToken("element") || parser.matchToken("module")) {
            scope = "element";
            // optional possessive
            if (parser.matchOpToken("'")) {
                parser.requireToken("s");
            }
        } else if (parser.matchToken("local")) {
            scope = "local";
        }

        // TODO better look ahead here
        let eltPrefix = parser.matchOpToken(":");
        let identifier = parser.matchTokenType("IDENTIFIER");
        if (identifier && identifier.value) {
            var name = identifier.value;
            if (eltPrefix) {
                name = ":" + name;
            }
            if (scope === "default") {
                if (name.indexOf("$") === 0) {
                    scope = "global";
                }
                if (name.indexOf(":") === 0) {
                    scope = "element";
                }
            }
            return new SymbolRef(identifier, scope, name);
        }
    }

    resolve(context) {
        return context.meta.runtime.resolveSymbol(this.name, context, this.scope);
    }
}

/**
 * BeepExpression - Debug operator that logs expression values
 *
 * Parses: beep! expression
 * Returns: expression value (after logging to console)
 */
export class BeepExpression extends Expression {
    constructor(expression) {
        super();
        this.type = "beepExpression";
        this.expression = expression;
        this.expression['booped'] = true;
        this.args = [expression];
    }

    static parse(parser) {
        if (!parser.matchToken("beep!")) return;
        var expression = parser.parseElement("unaryExpression");
        if (expression) {
            return new BeepExpression(expression);
        }
    }

    resolve(ctx, value) {
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
    constructor(root, prop) {
        super();
        this.type = "propertyAccess";
        this.root = root;
        this.prop = prop;
        this.args = [root];
    }

    /**
     * Parse a property access expression
     * @param {Parser} parser
     * @param {any} root - The root expression
     * @returns {any | undefined}
     */
    static parse(parser, root) {
        if (!parser.matchOpToken(".")) return;
        var prop = parser.requireTokenType("IDENTIFIER");
        var propertyAccess = new PropertyAccess(root, prop);
        return parser.kernel.parseElement("indirectExpression", parser, propertyAccess);
    }

    /**
     * Op function for property access
     */
    resolve(context, rootVal) {
        var value = context.meta.runtime.resolveProperty(rootVal, this.prop.value);
        return value;
    }

    /**
     * Evaluate property access
     * @param {Context} context
     * @returns {any}
     */
}

/**
 * OfExpression - Represents reversed property access (property of object)
 *
 * Parses: property of expression
 * Returns: property value from the expression
 */
export class OfExpression extends Expression {
    constructor(prop, newRoot, attribute, expression, args, urRoot) {
        super();
        this.type = "ofExpression";
        this.prop = prop; // token
        this.root = newRoot;
        this.attribute = attribute;
        this.expression = expression;
        this.args = args;
        this._urRoot = urRoot; // store the urRoot for op function
    }

    /**
     * Parse an of expression
     * @param {Parser} parser
     * @param {any} root - The property expression
     * @returns {any | undefined}
     */
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
            [newRoot],
            urRoot
        );

        if (urRoot.type === "attributeRef") {
            propertyAccess.attribute = urRoot;
        }
        if (childOfUrRoot) {
            childOfUrRoot.root = propertyAccess;
            childOfUrRoot.args = [propertyAccess];
        } else {
            root = propertyAccess;
        }

        return parser.kernel.parseElement("indirectExpression", parser, root);
    }

    /**
     * Op function for of expression
     */
    resolve(context, rootVal) {
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

    /**
     * Evaluate of expression
     * @param {Context} context
     * @returns {any}
     */
}

/**
 * PossessiveExpression - Represents possessive property access
 *
 * Parses: expression's property | my property | its property
 * Returns: property value
 */
export class PossessiveExpression extends Expression {
    constructor(root, attribute, prop) {
        super();
        this.type = "possessive";
        this.root = root;
        this.attribute = attribute;
        this.prop = prop;
        this.args = [root];
    }

    /**
     * Parse a possessive expression
     * @param {Parser} parser
     * @param {any} root
     * @returns {any | undefined}
     */
    static parse(parser, root) {
        if (parser.possessivesDisabled) {
            return;
        }
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
            return parser.kernel.parseElement("indirectExpression", parser, propertyAccess);
        }
    }

    /**
     * Op function for possessive
     */
    resolve(context, rootVal) {
        if (this.attribute) {
            var value
            if (this.attribute.type === 'computedStyleRef') {
                value = context.meta.runtime.resolveComputedStyle(rootVal, this.attribute['name']);
            } else if (this.attribute.type === 'styleRef') {
                value = context.meta.runtime.resolveStyle(rootVal, this.attribute['name']);
            } else {
                value = context.meta.runtime.resolveAttribute(rootVal, this.attribute.name);
            }
        } else {
            var value = context.meta.runtime.resolveProperty(rootVal, this.prop.value);
        }
        return value;
    }

    /**
     * Evaluate possessive expression
     * @param {Context} context
     * @returns {any}
     */
}

/**
 * InExpression - Represents containment check
 *
 * Parses: expression in target
 * Returns: filtered elements or boolean
 */
export class InExpression extends Expression {
    constructor(root, target) {
        super();
        this.type = "inExpression";
        this.root = root;
        this.target = target;
        this.args = [root, target];
    }

    /**
     * Parse an in expression
     * @param {Parser} parser
     * @param {any} root
     * @returns {InExpression | undefined}
     */
    static parse(parser, root) {
        if (!parser.matchToken("in")) return;
        var target = parser.requireElement("unaryExpression");
        var inExpression = new InExpression(root, target);
        return parser.kernel.parseElement("indirectExpression", parser, inExpression);
    }

    /**
     * Op function for in expression
     */
    resolve(context, rootVal, target) {
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

    /**
     * Evaluate in expression
     * @param {Context} context
     * @returns {any}
     */
}

/**
 * AsExpression - Type conversion expression
 *
 * Parses: expression as Type
 * Returns: converted value
 */
export class AsExpression extends Expression {
    constructor(root, conversion) {
        super();
        this.type = "asExpression";
        this.root = root;
        this.conversion = conversion;
        this.args = [root];
    }

    /**
     * Parse an as expression
     * @param {Parser} parser
     * @param {any} root
     * @returns {AsExpression | undefined}
     */
    static parse(parser, root) {
        if (!parser.matchToken("as")) return;
        parser.matchToken("a") || parser.matchToken("an");
        var conversion = parser.requireElement("dotOrColonPath").evaluate(); // OK No promise
        var asExpression = new AsExpression(root, conversion);
        return parser.kernel.parseElement("indirectExpression", parser, asExpression);
    }

    /**
     * Op function for as expression
     */
    resolve(context, rootVal) {
        return context.meta.runtime.convertValue(rootVal, this.conversion);
    }

    /**
     * Evaluate as expression
     * @param {Context} context
     * @returns {any}
     */
}

/**
 * FunctionCall - Represents function call expressions
 *
 * Parses: function(args) or object.method(args)
 * Returns: function result
 */
export class FunctionCall extends Expression {
    constructor(root, argExpressions, args, isMethodCall) {
        super();
        this.type = "functionCall";
        this.root = root;
        this.argExressions = argExpressions;
        this.args = args;
        this._isMethodCall = isMethodCall;
        this._parseRoot = root; // Store original root from parse time (before mutations)
    }

    /**
     * Parse a function call
     * @param {Parser} parser
     * @param {any} root
     * @returns {FunctionCall | undefined}
     */
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
            functionCall = new FunctionCall(root, args, [root.root, args], true);
        } else {
            functionCall = new FunctionCall(root, args, [root, args], false);
        }
        return parser.kernel.parseElement("indirectExpression", parser, functionCall);
    }

    /**
     * Op function for function call
     */
    resolve(context, firstArg, argVals) {
        if (this._isMethodCall) {
            var rootRoot = firstArg;
            context.meta.runtime.nullCheck(rootRoot, this._parseRoot.root);
            var func = rootRoot[this._parseRoot.prop.value];
            context.meta.runtime.nullCheck(func, this._parseRoot);
            if (func.hyperfunc) {
                argVals.push(context);
            }
            return func.apply(rootRoot, argVals);
        } else {
            var func = firstArg;
            context.meta.runtime.nullCheck(func, this._parseRoot);
            if (func.hyperfunc) {
                argVals.push(context);
            }
            return func.apply(null, argVals);
        }
    }

    /**
     * Evaluate function call
     * @param {Context} context
     * @returns {any}
     */
}

/**
 * AttributeRefAccess - Attribute reference on an expression
 *
 * Parses: expression@attribute
 * Returns: attribute value
 */
export class AttributeRefAccess extends Expression {
    constructor(root, attribute) {
        super();
        this.type = "attributeRefAccess";
        this.root = root;
        this.attribute = attribute;
        this.args = [root];
    }

    /**
     * Parse an attribute ref access
     * @param {Parser} parser
     * @param {any} root
     * @returns {AttributeRefAccess | undefined}
     */
    static parse(parser, root) {
        var attribute = parser.parseElement("attributeRef");
        if (!attribute) return;
        return new AttributeRefAccess(root, attribute);
    }

    /**
     * Op function for attribute ref access
     */
    resolve(_ctx, rootVal) {
        var value = _ctx.meta.runtime.resolveAttribute(rootVal, this.attribute.name);
        return value;
    }

    /**
     * Evaluate attribute ref access
     * @param {Context} context
     * @returns {any}
     */
}

/**
 * Helper function for contains/includes operations
 */
function sloppyContains(src, container, value) {
    if (container['contains']) {
        return container.contains(value);
    } else if (container['includes']) {
        return container.includes(value);
    } else {
        throw Error("The value of " + src.sourceFor() + " does not have a contains or includes method on it");
    }
}

/**
 * Helper function for match/matches operations
 */
function sloppyMatches(src, target, toMatch) {
    if (target['match']) {
        return !!target.match(toMatch);
    } else if (target['matches']) {
        return target.matches(toMatch);
    } else {
        throw Error("The value of " + src.sourceFor() + " does not have a match or matches method on it");
    }
}

/**
 * ArrayIndex - Array/object indexing and slicing
 *
 * Parses: array[index] | array[start..end] | array[..end] | array[start..]
 * Returns: indexed value or slice
 */
export class ArrayIndex extends Expression {
    constructor(root, firstIndex, secondIndex, andBefore, andAfter) {
        super();
        this.type = "arrayIndex";
        this.root = root;
        this.prop = firstIndex;
        this.firstIndex = firstIndex;
        this.secondIndex = secondIndex;
        this.andBefore = andBefore;
        this.andAfter = andAfter;
        this.args = [root, firstIndex, secondIndex];
    }

    /**
     * Parse an array index expression
     * @param {Parser} parser
     * @param {any} root
     * @returns {any | undefined}
     */
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
        return parser.kernel.parseElement("indirectExpression", parser, arrayIndex);
    }

    /**
     * Op function for array index
     */
    resolve(_ctx, root, firstIndex, secondIndex) {
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

    /**
     * Evaluate array index
     * @param {Context} context
     * @returns {any}
     */
}

/**
 * MathOperator - Binary math operations
 *
 * Parses: expr + expr | expr - expr | expr * expr | expr / expr | expr mod expr
 * Returns: computed result
 * Note: Enforces same operator throughout chain (must parenthesize mixed operators)
 */
export class MathOperator extends Expression {
    constructor(lhs, operator, rhs) {
        super();
        this.type = "mathOperator";
        this.lhs = lhs;
        this.rhs = rhs;
        this.operator = operator;
        this.args = [lhs, rhs];
    }

    /**
     * Parse math operator expression
     * @param {Parser} parser
     * @returns {any}
     */
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

    /**
     * Op function for math operations
     */
    resolve(context, lhsVal, rhsVal) {
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

    /**
     * Evaluate math operation
     * @param {Context} context
     * @returns {number}
     */
}

/**
 * ComparisonOperator - Comparison operations
 *
 * Parses: expr == expr | expr < expr | expr is empty | expr matches pattern | etc.
 * Returns: boolean result
 * Supports: ==, !=, ===, !==, <, >, <=, >=, is, am, match, contain, include, exist, empty
 */
export class ComparisonOperator extends Expression {
    constructor(lhs, operator, rhs, typeName, nullOk) {
        super();
        this.type = "comparisonOperator";
        this.operator = operator;
        this.typeName = typeName;
        this.nullOk = nullOk;
        this.lhs = lhs;
        this.rhs = rhs;
        this.args = [lhs, rhs];
    }

    /**
     * Parse comparison operator expression
     * @param {Parser} parser
     * @returns {any}
     */
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
            } else if (parser.matchToken("do") || parser.matchToken("does")) {
                parser.requireToken("not");
                if (parser.matchToken("matches") || parser.matchToken("match")) {
                    operator = "not match";
                } else if (parser.matchToken("contains") || parser.matchToken("contain")) {
                    operator = "not contain";
                } else if (parser.matchToken("exist") || parser.matchToken("exist")) {
                    operator = "not exist";
                    hasRightValue = false;
                } else if (parser.matchToken("include")) {
                    operator = "not include";
                } else {
                    parser.raiseParseError("Expected matches or contains");
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
            var lhs = expr;
            expr = new ComparisonOperator(lhs, operator, rhs, typeName, nullOk);
        }
        return expr;
    }

    /**
     * Op function for comparison operations
     */
    resolve(context, lhsVal, rhsVal) {
        const operator = this.operator;
        const lhs = this.lhs;
        const rhs = this.rhs;
        const typeName = this.typeName;
        const nullOk = this.nullOk;

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
            return lhsVal != null && sloppyMatches(lhs, lhsVal, rhsVal);
        }
        if (operator === "not match") {
            return lhsVal == null || !sloppyMatches(lhs, lhsVal, rhsVal);
        }
        if (operator === "in") {
            return rhsVal != null && sloppyContains(rhs, rhsVal, lhsVal);
        }
        if (operator === "not in") {
            return rhsVal == null || !sloppyContains(rhs, rhsVal, lhsVal);
        }
        if (operator === "contain") {
            return lhsVal != null && sloppyContains(lhs, lhsVal, rhsVal);
        }
        if (operator === "not contain") {
            return lhsVal == null || !sloppyContains(lhs, lhsVal, rhsVal);
        }
        if (operator === "include") {
            return lhsVal != null && sloppyContains(lhs, lhsVal, rhsVal);
        }
        if (operator === "not include") {
            return lhsVal == null || !sloppyContains(lhs, lhsVal, rhsVal);
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
            throw "Unknown comparison : " + operator;
        }
    }

    /**
     * Evaluate comparison
     * @param {Context} context
     * @returns {boolean}
     */
}

/**
 * LogicalOperator - Logical and/or operations
 *
 * Parses: expr and expr | expr or expr
 * Returns: boolean result
 * Note: Enforces same operator throughout chain (must parenthesize mixed operators)
 */
export class LogicalOperator extends Expression {
    constructor(lhs, operator, rhs) {
        super();
        this.type = "logicalOperator";
        this.operator = operator;
        this.lhs = lhs;
        this.rhs = rhs;
        this.args = [lhs, rhs];
    }

    /**
     * Parse logical operator expression
     * @param {Parser} parser
     * @returns {any}
     */
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

    /**
     * Op function for logical operations
     */
    resolve(context, lhsVal, rhsVal) {
        if (this.operator === "and") {
            return lhsVal && rhsVal;
        } else {
            return lhsVal || rhsVal;
        }
    }

    /**
     * Evaluate logical operation
     * @param {Context} context
     * @returns {boolean}
     */
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
/**
 * DotOrColonPathNode - Represents a dot or colon separated path
 */
class DotOrColonPathNode extends Expression {
    constructor(path, separator) {
        super();
        this.type = "dotOrColonPath";
        this.path = path;
        this.separator = separator;
    }

    // Called at both parse time (no context) and runtime, so cannot use the
    // default evaluate() which requires a context for unifiedEval.
    evaluate() {
        return this.path.join(this.separator ? this.separator : "");
    }

    resolve() {
        return this.path.join(this.separator ? this.separator : "");
    }
}

export class DotOrColonPath extends Expression {
    /**
     * Parse dot or colon separated path
     * @param {Parser} parser
     * @returns {DotOrColonPathNode | undefined}
     */
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