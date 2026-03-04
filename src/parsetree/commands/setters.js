/**
 * Setter command parse tree elements
 * Commands that modify values (set, default, increment, decrement, put)
 */

import { Command, Expression } from '../base.js';

/**
 * IncrementOperation - Calculates incremented value
 */
class IncrementOperation extends Expression {
    constructor(target, amountExpr) {
        super();
        this.type = "implicitIncrementOp";
        this.target = target;
        this.amountExpr = amountExpr;
        this.args = [target, amountExpr];
    }

    resolve(context, targetValue, amount) {
        targetValue = targetValue ? parseFloat(targetValue) : 0;
        amount = this.amountExpr ? parseFloat(amount) : 1;
        var newValue = targetValue + amount;
        context.result = newValue;
        return newValue;
    }
}

/**
 * DecrementOperation - Calculates decremented value
 */
class DecrementOperation extends Expression {
    constructor(target, amountExpr) {
        super();
        this.type = "implicitDecrementOp";
        this.target = target;
        this.amountExpr = amountExpr;
        this.args = [target, amountExpr];
    }

    resolve(context, targetValue, amount) {
        targetValue = targetValue ? parseFloat(targetValue) : 0;
        amount = this.amountExpr ? parseFloat(amount) : 1;
        var newValue = targetValue - amount;
        context.result = newValue;
        return newValue;
    }
}

/**
 * Helper function for put command - put content into element or symbol
 */
function putInto(context, root, prop, valueToPut) {
    if (root == null) {     // symbol, no element
        var value = context.meta.runtime.resolveSymbol(prop, context);
    } else {                // there is an element
        var value = root;
    }
    // Either the symbol or element is null AND the value is an element or document (Was going in when both were non null)
    if ((root == null || prop == null) && (value instanceof Element || value instanceof Document)) {
        while (value.firstChild) value.removeChild(value.firstChild);
        value.append(context.meta.runtime.convertValue(valueToPut, "Fragment"));
        context.meta.runtime.processNode(value);
    } else {
        if (root == null) {
            context.meta.runtime.setSymbol(prop, context, null, valueToPut);
        } else {
            // Our non-null case for both
            root[prop] = valueToPut
        }
    }
}

/**
 * BaseSetterCommand - Base class for all setter commands
 * Contains common resolve() logic for setting values into targets
 */
class BaseSetterCommand extends Command {
    constructor(target, value, rootElt, prop, attribute) {
        super();
        this.target = target;
        this.value = value;
        this.rootElt = rootElt;
        this.prop = prop;
        this.attribute = attribute;

        // Derive flags from target type
        this.symbolWrite = target.type === "symbol";
        this.arrayWrite = target.type === "arrayIndex";

        this.args = [rootElt, prop, value];
    }

    resolve(context, root, prop, valueToSet) {
        if (this.symbolWrite) {
            context.meta.runtime.setSymbol(this.target.name, context, this.target.scope, valueToSet);
        } else {
            context.meta.runtime.nullCheck(root, this.rootElt);
            if (this.arrayWrite) {
                root[prop] = valueToSet;
            } else {
                const attribute = this.attribute;
                context.meta.runtime.implicitLoop(root, function (elt) {
                    if (attribute) {
                        if (attribute.type === "attributeRef") {
                            if (valueToSet == null) {
                                elt.removeAttribute(attribute.name);
                            } else {
                                elt.setAttribute(attribute.name, valueToSet);
                            }
                        } else {
                            elt.style[attribute.name] = valueToSet;
                        }
                    } else {
                        elt[prop] = valueToSet;
                    }
                });
            }
        }
        return context.meta.runtime.findNext(this, context);
    }

    /**
     * Create a setter command for a target and value
     * @param {Parser} parser
     * @param {*} target - Target expression to set
     * @param {*} value - Value expression to assign
     * @param {*} CommandClass - The command class to instantiate (defaults to BaseSetterCommand)
     * @returns Setter command instance
     */
    static makeSetter(parser, target, value, CommandClass = BaseSetterCommand) {
        var symbolWrite = target.type === "symbol";
        var attributeWrite = target.type === "attributeRef";
        var styleWrite = target.type === "styleRef";
        var arrayWrite = target.type === "arrayIndex";
        var refWrite = target.type === "idRef" || target.type === "queryRef" || target.type === "classRef";

        if (!(attributeWrite || styleWrite || symbolWrite || refWrite) && target.root == null) {
            parser.raiseParseError("Can only put directly into symbols, not references");
        }

        var rootElt = null;
        var prop = null;
        var attribute = null;

        if (symbolWrite) {
            // rootElt is null
        } else if (attributeWrite || styleWrite) {
            rootElt = parser.requireElement("implicitMeTarget");
            attribute = target;
        } else if(arrayWrite) {
            prop = target.firstIndex;
            rootElt = target.root;
        } else {
            prop = target.prop ? target.prop.value : null;
            attribute = target.attribute;
            rootElt = target.root;
        }

        return new CommandClass(target, value, rootElt, prop, attribute);
    }
}

/**
 * SetCommand - Set variable or property
 *
 * Parses: set {obj} on target  OR  set target to value
 * Executes: Assigns value to target
 */
export class SetCommand extends BaseSetterCommand {
    static keyword = "set";

    constructor(target, value, rootElt, prop, attribute, objectLiteral = null) {
        super(target, value, rootElt, prop, attribute);
        this.objectLiteral = objectLiteral;
        if (objectLiteral) {
            this.args = [objectLiteral, target];
        }
    }

    /**
     * Parse set command
     * @param {Parser} parser
     * @returns {SetCommand | undefined}
     */
    static parse(parser) {
        if (!parser.matchToken("set")) return;

        // set {obj} on target form
        if (parser.currentToken().type === "L_BRACE") {
            var obj = parser.requireElement("objectLiteral");
            parser.requireToken("on");
            var target = parser.requireElement("expression");

            var command = new SetCommand(target, null, null, null, null, obj);
            return command;
        }

        // set target to value form
        try {
            parser.pushFollow("to");
            var target = parser.requireElement("assignableExpression");
        } finally {
            parser.popFollow();
        }
        parser.requireToken("to");
        var value = parser.requireElement("expression");
        return BaseSetterCommand.makeSetter(parser, target, value, SetCommand);
    }

    resolve(context, root, prop, valueToSet) {
        // Object literal form uses different signature
        if (this.objectLiteral) {
            var obj = root; // first arg is actually the object literal
            var target = prop; // second arg is actually the target
            Object.assign(target, obj);
            return context.meta.runtime.findNext(this, context);
        } else {
            // Normal setter form
            return super.resolve(context, root, prop, valueToSet);
        }
    }
}

/**
 * DefaultCommand - Set default value if undefined
 *
 * Parses: default target to value
 * Executes: Sets target to value only if target is falsy
 */
export class DefaultCommand extends Command {
    static keyword = "default";

    constructor(target, value, setter) {
        super();
        this.target = target;
        this.value = value;
        this.setter = setter;
        this.args = [target];
    }

    /**
     * Parse default command
     * @param {Parser} parser
     * @returns {DefaultCommand | undefined}
     */
    static parse(parser) {
        if (!parser.matchToken("default")) return;
        try {
            parser.pushFollow("to");
            var target = parser.requireElement("assignableExpression");
        } finally {
            parser.popFollow();
        }
        parser.requireToken("to");

        var value = parser.requireElement("expression");

        var setter = BaseSetterCommand.makeSetter(parser, target, value, SetCommand);
        var defaultCmd = new DefaultCommand(target, value, setter);
        setter.parent = defaultCmd;
        return defaultCmd;
    }

    resolve(context, targetValue) {
        if (targetValue) {
            return context.meta.runtime.findNext(this, context);
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
export class IncrementCommand extends BaseSetterCommand { // <- May be issue in here?
    static keyword = "increment";

    /**
     * Parse increment command
     * @param {Parser} parser
     * @returns {IncrementCommand | undefined}
     */
    static parse(parser) {
        if (!parser.matchToken("increment")) return;
        var amountExpr;

        // This is optional.  Defaults to "result"
        var target = parser.parseElement("assignableExpression");

        // This is optional. Defaults to 1.
        if (parser.matchToken("by")) {
            amountExpr = parser.requireElement("expression");
        }

        var implicitIncrementOp = new IncrementOperation(target, amountExpr);

        return BaseSetterCommand.makeSetter(parser, target, implicitIncrementOp, IncrementCommand);
    }
}

/**
 * DecrementCommand - Decrement numeric value
 *
 * Parses: decrement target [by amount]
 * Executes: Subtracts amount (default 1) from target
 */
export class DecrementCommand extends BaseSetterCommand {
    static keyword = "decrement";

    /**
     * Parse decrement command
     * @param {Parser} parser
     * @returns {DecrementCommand | undefined}
     */
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

        // This is optional. Defaults to 1.
        if (parser.matchToken("by")) {
            amountExpr = parser.requireElement("expression");
        }

        var implicitDecrementOp = new DecrementOperation(target, amountExpr);

        return BaseSetterCommand.makeSetter(parser, target, implicitDecrementOp, DecrementCommand);
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

        this.args = [rootExpr, this.prop, value];
    }

    /**
     * Parse put command
     * @param {Parser} parser
     * @returns {PutCommand | undefined}
     */
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

    resolve(context, root, prop, valueToPut) {
        if (this.symbolWrite) {
            putInto(context, root, prop, valueToPut);
        } else {
            context.meta.runtime.nullCheck(root, this.rootExpr);
            if (this.operation === "into") {
                if (this.attributeWrite) {
                    context.meta.runtime.implicitLoop(root, function (elt) {
                        elt.setAttribute(prop, valueToPut);
                    });
                } else if (this.styleWrite) {
                    context.meta.runtime.implicitLoop(root, function (elt) {
                        elt.style[prop] = valueToPut;
                    });
                } else if (this.arrayIndex) {
                    root[prop] = valueToPut;
                } else {
                    context.meta.runtime.implicitLoop(root, function (elt) {
                        putInto(context, elt, prop, valueToPut);
                    });
                }
            } else {
                var op =
                    this.operation === "before"
                        ? Element.prototype.before
                        : this.operation === "after"
                        ? Element.prototype.after
                        : this.operation === "start"
                        ? Element.prototype.prepend
                        : this.operation === "end"
                        ? Element.prototype.append
                        : Element.prototype.append;

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
        return context.meta.runtime.findNext(this, context);
    }
}
