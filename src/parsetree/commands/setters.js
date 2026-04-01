/**
 * Setter command parse tree elements
 * Commands that modify values (set, default, increment, decrement, put)
 */

import { Command } from '../base.js';

/**
 * SetCommand - Set variable or property
 *
 * Parses: set {obj} on target  OR  set target to value
 * Executes: Assigns value to target using target's lhs/set() contract
 */
export class SetCommand extends Command {
    static keyword = "set";

    constructor(target, valueExpr, objectLiteral = null) {
        super();
        this.target = target;
        this.objectLiteral = objectLiteral;

        if (objectLiteral) {
            this.args = { obj: objectLiteral, setTarget: target };
        } else {
            this.args = { ...target.lhs, value: valueExpr };
        }
    }

    static parse(parser) {
        if (!parser.matchToken("set")) return;

        // set {obj} on target form
        if (parser.currentToken().type === "L_BRACE") {
            var obj = parser.requireElement("objectLiteral");
            parser.requireToken("on");
            var target = parser.requireElement("expression");
            return new SetCommand(target, null, obj);
        }

        // set target to value form
        try {
            parser.pushFollow("to");
            var target = parser.requireElement("assignableExpression");
        } finally {
            parser.popFollow();
        }
        // Unwrap parenthesized expressions
        while (target.type === "parenthesized") target = target.expr;
        parser.requireToken("to");
        var value = parser.requireElement("expression");
        return new SetCommand(target, value);
    }

    resolve(context, args) {
        if (this.objectLiteral) {
            var { obj, setTarget } = args;
            Object.assign(setTarget, obj);
        } else {
            var { value, ...lhs } = args;
            this.target.set(context, lhs, value);
        }
        return this.findNext(context);
    }
}

/**
 * DefaultCommand - Set default value if undefined
 *
 * Parses: default target to value
 * Executes: Sets target to value only if target is null or undefined
 */
export class DefaultCommand extends Command {
    static keyword = "default";

    constructor(target, setter) {
        super();
        this.target = target;
        this.setter = setter;
        this.args = { targetValue: target };
    }

    static parse(parser) {
        if (!parser.matchToken("default")) return;
        try {
            parser.pushFollow("to");
            var target = parser.requireElement("assignableExpression");
        } finally {
            parser.popFollow();
        }
        // Unwrap parenthesized expressions
        while (target.type === "parenthesized") target = target.expr;
        parser.requireToken("to");

        var value = parser.requireElement("expression");

        var setter = new SetCommand(target, value);
        var defaultCmd = new DefaultCommand(target, setter);
        setter.parent = defaultCmd;
        return defaultCmd;
    }

    resolve(context, { targetValue }) {
        if (targetValue != null && targetValue !== "") {
            return this.findNext(context);
        } else {
            return this.setter;
        }
    }
}

/**
 * IncrementCommand - Increment numeric value
 *
 * Parses: increment target [by amount]
 * Executes: Adds amount (default 1) to target
 */
export class IncrementCommand extends Command {
    static keyword = "increment";

    constructor(target, amountExpr) {
        super();
        this.target = target;
        this.amountExpr = amountExpr;
        this.args = { targetValue: target, amount: amountExpr, ...target.lhs };
    }

    static parse(parser) {
        if (!parser.matchToken("increment")) return;
        var amountExpr;

        // This is optional.  Defaults to "result"
        var target = parser.parseElement("assignableExpression");
        // Unwrap parenthesized expressions
        while (target.type === "parenthesized") target = target.expr;

        // This is optional. Defaults to 1.
        if (parser.matchToken("by")) {
            amountExpr = parser.requireElement("expression");
        }

        return new IncrementCommand(target, amountExpr);
    }

    resolve(context, args) {
        var { targetValue, amount, ...lhs } = args;
        targetValue = targetValue ? parseFloat(targetValue) : 0;
        amount = this.amountExpr ? parseFloat(amount) : 1;
        var newValue = targetValue + amount;
        context.result = newValue;
        this.target.set(context, lhs, newValue);
        return this.findNext(context);
    }
}

/**
 * DecrementCommand - Decrement numeric value
 *
 * Parses: decrement target [by amount]
 * Executes: Subtracts amount (default 1) from target
 */
export class DecrementCommand extends Command {
    static keyword = "decrement";

    constructor(target, amountExpr) {
        super();
        this.target = target;
        this.amountExpr = amountExpr;
        this.args = { targetValue: target, amount: amountExpr, ...target.lhs };
    }

    static parse(parser) {
        if (!parser.matchToken("decrement")) return;
        var amountExpr;

        // This is optional.  Defaults to "result"
        try {
            parser.pushFollow("by");
            var target = parser.parseElement("assignableExpression");
        } finally {
            parser.popFollow();
        }
        // Unwrap parenthesized expressions
        while (target.type === "parenthesized") target = target.expr;

        // This is optional. Defaults to 1.
        if (parser.matchToken("by")) {
            amountExpr = parser.requireElement("expression");
        }

        return new DecrementCommand(target, amountExpr);
    }

    resolve(context, args) {
        var { targetValue, amount, ...lhs } = args;
        targetValue = targetValue ? parseFloat(targetValue) : 0;
        amount = this.amountExpr ? parseFloat(amount) : 1;
        var newValue = targetValue - amount;
        context.result = newValue;
        this.target.set(context, lhs, newValue);
        return this.findNext(context);
    }
}

/**
 * SwapCommand - Swap two values
 *
 * Parses: swap target1 with target2
 * Executes: Swaps the values of two assignable expressions
 */
export class SwapCommand extends Command {
    static keyword = "swap";

    constructor(target1, target2) {
        super();
        this.target1 = target1;
        this.target2 = target2;
        this.args = {
            value1: target1, value2: target2,
            root1: target1.lhs.root, index1: target1.lhs.index,
            root2: target2.lhs.root, index2: target2.lhs.index,
        };
    }

    static parse(parser) {
        if (!parser.matchToken("swap")) return;
        try {
            parser.pushFollow("with");
            var target1 = parser.requireElement("assignableExpression");
        } finally {
            parser.popFollow();
        }
        while (target1.type === "parenthesized") target1 = target1.expr;
        parser.requireToken("with");
        var target2 = parser.requireElement("assignableExpression");
        while (target2.type === "parenthesized") target2 = target2.expr;
        return new SwapCommand(target1, target2);
    }

    resolve(context, { value1, value2, root1, index1, root2, index2 }) {
        if (value1 instanceof Element && value2 instanceof Element) {
            // DOM swap needs placeholders to avoid position interference
            var placeholder = document.createComment('');
            value1.replaceWith(placeholder);
            value2.replaceWith(value1);
            placeholder.replaceWith(value2);
        } else {
            this.target1.set(context, { root: root1, index: index1 }, value2);
            this.target2.set(context, { root: root2, index: index2 }, value1);
        }
        return this.findNext(context);
    }
}

/**
 * PutCommand - Put value into/before/after target (web-specific)
 *
 * Parses: put expr into target | put expr before/after target | put expr at start/end of target
 * Executes: Inserts value into DOM or variable
 */
export class PutCommand extends Command {
    static keyword = "put";

    constructor(target, operation, value, rootExpr) {
        super();
        this.target = target;
        this.operation = operation;
        this.value = value;
        this.rootExpr = rootExpr;

        // Derive flags from target type
        this.symbolWrite = target.type === "symbol" && operation === "into";
        this.arrayIndex = target.type === "arrayIndex";
        this.attributeWrite = (target.type === "attributeRef" ||
                              (target.attribute && target.attribute.type === "attributeRef")) &&
                              operation === "into";
        this.styleWrite = (target.type === "styleRef" ||
                          (target.attribute && target.attribute.type === "styleRef")) &&
                          operation === "into";

        // Derive property/prop
        if (this.arrayIndex) {
            this.prop = target.prop;
        } else if (this.symbolWrite) {
            this.prop = target.name;
        } else if (target.type === "attributeRef" || target.type === "styleRef") {
            this.prop = target.name;
        } else if (target.attribute) {
            this.prop = target.attribute.name;
        } else if (target.prop) {
            this.prop = target.prop.value;
        } else {
            this.prop = null;
        }

        this.args = { root: rootExpr, prop: this.prop, value };
    }

    static parse(parser) {
        if (!parser.matchToken("put")) return;

        var value = parser.requireElement("expression");

        var operationToken = parser.matchAnyToken("into", "before", "after");

        if (operationToken == null && parser.matchToken("at")) {
            parser.matchToken("the"); // optional "the"
            operationToken = parser.matchAnyToken("start", "end");
            parser.requireToken("of");
        }

        if (operationToken == null) {
            parser.raiseParseError("Expected one of 'into', 'before', 'at start of', 'at end of', 'after'");
        }
        var target = parser.requireElement("expression");
        // Unwrap parenthesized expressions
        while (target.type === "parenthesized") target = target.expr;

        var operation = operationToken.value;

        // Determine rootExpr based on target type
        var rootExpr;
        if (target.type === "arrayIndex" && operation === "into") {
            rootExpr = target.root;
        } else if (target.prop && target.root && operation === "into") {
            rootExpr = target.root;
        } else if (target.type === "symbol" && operation === "into") {
            rootExpr = null;
        } else if (target.type === "attributeRef" && operation === "into") {
            rootExpr = parser.requireElement("implicitMeTarget");
        } else if (target.type === "styleRef" && operation === "into") {
            rootExpr = parser.requireElement("implicitMeTarget");
        } else if (target.attribute && operation === "into") {
            rootExpr = target.root;
        } else {
            rootExpr = target;
        }

        return new PutCommand(target, operation, value, rootExpr);
    }

    putInto(context, root, prop, valueToPut) {
        if (root == null) {
            var value = context.meta.runtime.resolveSymbol(prop, context);
        } else {
            var value = root;
        }
        if ((root == null || prop == null) && (value instanceof Element || value instanceof Document)) {
            while (value.firstChild) value.removeChild(value.firstChild);
            value.append(context.meta.runtime.convertValue(valueToPut, "Fragment"));
            context.meta.runtime.processNode(value);
        } else {
            if (root == null) {
                context.meta.runtime.setSymbol(prop, context, null, valueToPut);
            } else {
                root[prop] = valueToPut
            }
        }
    }

    resolve(context, { root, prop, value: valueToPut }) {
        if (this.symbolWrite) {
            this.putInto(context, root, prop, valueToPut);
        } else {
            context.meta.runtime.nullCheck(root, this.rootExpr);
            if (this.operation === "into") {
                if (this.attributeWrite) {
                    context.meta.runtime.implicitLoop(root, function (elt) {
                        if (valueToPut == null) {
                            elt.removeAttribute(prop);
                        } else {
                            elt.setAttribute(prop, valueToPut);
                        }
                    });
                } else if (this.styleWrite) {
                    context.meta.runtime.implicitLoop(root, function (elt) {
                        elt.style[prop] = valueToPut;
                    });
                } else if (this.arrayIndex) {
                    root[prop] = valueToPut;
                } else {
                    var cmd = this;
                    context.meta.runtime.implicitLoop(root, function (elt) {
                        cmd.putInto(context, elt, prop, valueToPut);
                    });
                }
            } else {
                var ops = { before: Element.prototype.before, after: Element.prototype.after,
                            start: Element.prototype.prepend, end: Element.prototype.append };
                var op = ops[this.operation] || Element.prototype.append;

                context.meta.runtime.implicitLoop(root, function (elt) {
                    op.call(
                        elt,
                        valueToPut instanceof Node
                            ? valueToPut
                            : context.meta.runtime.convertValue(valueToPut, "Fragment")
                    );
                    // process any new content
                    if (elt.parentElement) {
                        context.meta.runtime.processNode(elt.parentElement);
                    } else {
                        context.meta.runtime.processNode(elt);
                    }
                });
            }
        }
        return this.findNext(context);
    }
}
