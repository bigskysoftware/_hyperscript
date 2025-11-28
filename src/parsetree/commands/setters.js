/**
 * Setter command parse tree elements
 * Commands that modify values (set, default, increment, decrement, put)
 */

/**
 * Helper function for put command - put content into element or symbol
 */
function putInto(context, root, prop, valueToPut, parser) {
    if (root == null) {
        var value = context.meta.runtime.resolveSymbol(prop, context);
    } else {
        var value = root;
    }
    if (value instanceof Element || value instanceof HTMLDocument) {
        while (value.firstChild) value.removeChild(value.firstChild);
        value.append(parser.runtime.convertValue(valueToPut, "Fragment"));
        context.meta.runtime.processNode(value);
    } else {
        if (root == null) {
            context.meta.runtime.setSymbol(prop, context, null, valueToPut);
        } else {
            root[prop] = valueToPut
        }
    }
}

/**
 * Base class for setter commands that provides common makeSetter logic
 */
class SetterCommand {
    /**
     * Create a setter operation for a target
     * @param {*} helper - Parser helper
     * @param {*} target - Target expression to set
     * @param {*} value - Value expression to assign
     * @returns Setter command object
     */
    static makeSetter(helper, target, value) {
        var symbolWrite = target.type === "symbol";
        var attributeWrite = target.type === "attributeRef";
        var styleWrite = target.type === "styleRef";
        var arrayWrite = target.type === "arrayIndex";

        if (!(attributeWrite || styleWrite || symbolWrite) && target.root == null) {
            helper.raiseParseError("Can only put directly into symbols, not references");
        }

        var rootElt = null;
        var prop = null;
        if (symbolWrite) {
            // rootElt is null
        } else if (attributeWrite || styleWrite) {
            rootElt = helper.requireElement("implicitMeTarget");
            var attribute = target;
        } else if(arrayWrite) {
            prop = target.firstIndex;
            rootElt = target.root;
        } else {
            prop = target.prop ? target.prop.value : null;
            var attribute = target.attribute;
            rootElt = target.root;
        }

        /** @type {ASTNode} */
        var setCmd = {
            target: target,
            symbolWrite: symbolWrite,
            value: value,
            args: [rootElt, prop, value],
            op: function (context, root, prop, valueToSet) {
                if (symbolWrite) {
                    context.meta.runtime.setSymbol(target.name, context, target.scope, valueToSet);
                } else {
                    context.meta.runtime.nullCheck(root, rootElt);
                    if (arrayWrite) {
                        root[prop] = valueToSet;
                    } else {
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
            },
        };
        return setCmd;
    }
}

/**
 * SetCommand - Set variable or property
 *
 * Parses: set {obj} on target  OR  set target to value
 * Executes: Assigns value to target
 */
export class SetCommand extends SetterCommand {
    constructor(target, value, objectLiteral) {
        super();
        this.target = target;
        this.value = value;
        this.objectLiteral = objectLiteral;
        if (objectLiteral) {
            this.args = [objectLiteral, target];
        } else {
            // Will be set by makeSetter
        }
    }

    /**
     * Parse set command
     * @param {ParserHelper} helper
     * @returns {SetCommand | undefined}
     */
    static parse(helper) {
        if (!helper.matchToken("set")) return;

        // set {obj} on target form
        if (helper.currentToken().type === "L_BRACE") {
            var obj = helper.requireElement("objectLiteral");
            helper.requireToken("on");
            var target = helper.requireElement("expression");

            var command = new SetCommand(target, null, obj);
            command.op = function (ctx, obj, target) {
                Object.assign(target, obj);
                return ctx.meta.runtime.findNext(this, ctx);
            };
            return command;
        }

        // set target to value form
        try {
            helper.pushFollow("to");
            var target = helper.requireElement("assignableExpression");
        } finally {
            helper.popFollow();
        }
        helper.requireToken("to");
        var value = helper.requireElement("expression");
        return SetCommand.makeSetter(helper, target, value);
    }
}

/**
 * DefaultCommand - Set default value if undefined
 *
 * Parses: default target to value
 * Executes: Sets target to value only if target is falsy
 */
export class DefaultCommand extends SetterCommand {
    constructor(target, value, setter) {
        super();
        this.target = target;
        this.value = value;
        this.setter = setter;
        this.args = [target];
    }

    /**
     * Parse default command
     * @param {ParserHelper} helper
     * @returns {DefaultCommand | undefined}
     */
    static parse(helper) {
        if (!helper.matchToken("default")) return;
        var target = helper.requireElement("assignableExpression");
        helper.requireToken("to");

        var value = helper.requireElement("expression");

        var setter = SetCommand.makeSetter(helper, target, value);
        var defaultCmd = new DefaultCommand(target, value, setter);
        defaultCmd.op = function (context, target) {
            if (target) {
                return context.meta.runtime.findNext(this, context);
            } else {
                return setter;
            }
        };
        setter.parent = defaultCmd;
        return defaultCmd;
    }
}

/**
 * IncrementCommand - Increment numeric value
 *
 * Parses: increment target [by amount]
 * Executes: Adds amount (default 1) to target
 */
export class IncrementCommand extends SetterCommand {
    constructor(target, amountExpr) {
        super();
        this.target = target;
        this.amountExpr = amountExpr;
    }

    /**
     * Parse increment command
     * @param {ParserHelper} helper
     * @returns {IncrementCommand | undefined}
     */
    static parse(helper) {
        if (!helper.matchToken("increment")) return;
        var amountExpr;

        // This is optional.  Defaults to "result"
        var target = helper.parseElement("assignableExpression");

        // This is optional. Defaults to 1.
        if (helper.matchToken("by")) {
            amountExpr = helper.requireElement("expression");
        }

        var implicitIncrementOp = {
            type: "implicitIncrementOp",
            target: target,
            args: [target, amountExpr],
            op: function (context, targetValue, amount) {
                targetValue = targetValue ? parseFloat(targetValue) : 0;
                amount = amountExpr ? parseFloat(amount) : 1;
                var newValue = targetValue + amount;
                context.result = newValue;
                return newValue;
            },
            evaluate: function (context) {
                return context.meta.runtime.unifiedEval(this, context);
            }
        };

        return SetCommand.makeSetter(helper, target, implicitIncrementOp);
    }
}

/**
 * DecrementCommand - Decrement numeric value
 *
 * Parses: decrement target [by amount]
 * Executes: Subtracts amount (default 1) from target
 */
export class DecrementCommand extends SetterCommand {
    constructor(target, amountExpr) {
        super();
        this.target = target;
        this.amountExpr = amountExpr;
    }

    /**
     * Parse decrement command
     * @param {ParserHelper} helper
     * @returns {DecrementCommand | undefined}
     */
    static parse(helper) {
        if (!helper.matchToken("decrement")) return;
        var amountExpr;

        // This is optional.  Defaults to "result"
        var target = helper.parseElement("assignableExpression");

        // This is optional. Defaults to 1.
        if (helper.matchToken("by")) {
            amountExpr = helper.requireElement("expression");
        }

        var implicitDecrementOp = {
            type: "implicitDecrementOp",
            target: target,
            args: [target, amountExpr],
            op: function (context, targetValue, amount) {
                targetValue = targetValue ? parseFloat(targetValue) : 0;
                amount = amountExpr ? parseFloat(amount) : 1;
                var newValue = targetValue - amount;
                context.result = newValue;
                return newValue;
            },
            evaluate: function (context) {
                return context.meta.runtime.unifiedEval(this, context);
            }
        };

        return SetCommand.makeSetter(helper, target, implicitDecrementOp);
    }
}

/**
 * PutCommand - Put value into/before/after target (web-specific)
 *
 * Parses: put expr into target | put expr before/after target | put expr at start/end of target
 * Executes: Inserts value into DOM or variable
 */
export class PutCommand extends SetterCommand {
    constructor(value, target, operation) {
        super();
        this.value = value;
        this.target = target;
        this.operation = operation;
    }

    /**
     * Parse put command
     * @param {ParserHelper} helper
     * @returns {PutCommand | undefined}
     */
    static parse(helper, parser) {
        if (!helper.matchToken("put")) return;

        var value = helper.requireElement("expression");

        var operationToken = helper.matchAnyToken("into", "before", "after");

        if (operationToken == null && helper.matchToken("at")) {
            helper.matchToken("the"); // optional "the"
            operationToken = helper.matchAnyToken("start", "end");
            helper.requireToken("of");
        }

        if (operationToken == null) {
            helper.raiseParseError("Expected one of 'into', 'before', 'at start of', 'at end of', 'after'");
        }
        var target = helper.requireElement("expression");

        var operation = operationToken.value;

        var arrayIndex = false;
        var symbolWrite = false;
        var rootExpr = null;
        var prop = null;

        if (target.type === "arrayIndex" && operation === "into") {
            arrayIndex = true;
            prop = target.prop;
            rootExpr = target.root;
        }  else if (target.prop && target.root && operation === "into") {
            prop = target.prop.value;
            rootExpr = target.root;
        } else if (target.type === "symbol" && operation === "into") {
            symbolWrite = true;
            prop = target.name;
        } else if (target.type === "attributeRef" && operation === "into") {
            var attributeWrite = true;
            prop = target.name;
            rootExpr = helper.requireElement("implicitMeTarget");
        } else if (target.type === "styleRef" && operation === "into") {
            var styleWrite = true;
            prop = target.name;
            rootExpr = helper.requireElement("implicitMeTarget");
        } else if (target.attribute && operation === "into") {
            var attributeWrite = target.attribute.type === "attributeRef";
            var styleWrite = target.attribute.type === "styleRef";
            prop = target.attribute.name;
            rootExpr = target.root;
        } else {
            rootExpr = target;
        }

        var putCmd = {
            target: target,
            operation: operation,
            symbolWrite: symbolWrite,
            value: value,
            args: [rootExpr, prop, value],
            op: function (context, root, prop, valueToPut) {
                if (symbolWrite) {
                    putInto(context, root, prop, valueToPut, parser);
                } else {
                    context.meta.runtime.nullCheck(root, rootExpr);
                    if (operation === "into") {
                        if (attributeWrite) {
                            context.meta.runtime.implicitLoop(root, function (elt) {
                                elt.setAttribute(prop, valueToPut);
                            });
                        } else if (styleWrite) {
                            context.meta.runtime.implicitLoop(root, function (elt) {
                                elt.style[prop] = valueToPut;
                            });
                        } else if (arrayIndex) {
                            root[prop] = valueToPut;
                        } else {
                            context.meta.runtime.implicitLoop(root, function (elt) {
                                putInto(context, elt, prop, valueToPut, parser);
                            });
                        }
                    } else {
                        var op =
                            operation === "before"
                                ? Element.prototype.before
                                : operation === "after"
                                ? Element.prototype.after
                                : operation === "start"
                                ? Element.prototype.prepend
                                : operation === "end"
                                ? Element.prototype.append
                                : Element.prototype.append; // unreachable

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
            },
        };
        return putCmd;
    }
}
