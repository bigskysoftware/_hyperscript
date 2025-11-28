/**
 * Control flow command parse tree elements
 * Commands for control flow (if, repeat, for, continue, break, tell)
 */

/**
 * IfCommand - Conditional execution
 *
 * Parses: if <expr> [then] <commands> [else|otherwise <commands>] [end]
 * Executes: Conditionally executes true or false branch based on expression
 */
export class IfCommand {
    /**
     * Parse if command
     * @param {ParserHelper} helper
     * @returns {IfCommand | undefined}
     */
    static parse(helper) {
        if (!helper.matchToken("if")) return;
        var expr = helper.requireElement("expression");
        helper.matchToken("then"); // optional 'then'
        var trueBranch = helper.parseElement("commandList");
        var nestedIfStmt = false;
        let elseToken = helper.matchToken("else") || helper.matchToken("otherwise");
        if (elseToken) {
            let elseIfIfToken = helper.peekToken("if");
            nestedIfStmt = elseIfIfToken != null && elseIfIfToken.line === elseToken.line;
            if (nestedIfStmt) {
                var falseBranch = helper.parseElement("command");
            } else {
                var falseBranch = helper.parseElement("commandList");
            }
        }
        if (helper.hasMore() && !nestedIfStmt) {
            helper.requireToken("end");
        }

        /** @type {ASTNode} */
        var ifCmd = {
            expr: expr,
            trueBranch: trueBranch,
            falseBranch: falseBranch,
            args: [expr],
            op: function (context, exprValue) {
                if (exprValue) {
                    return trueBranch;
                } else if (falseBranch) {
                    return falseBranch;
                } else {
                    return context.meta.runtime.findNext(this, context);
                }
            },
        };
        helper.setParent(trueBranch, ifCmd);
        helper.setParent(falseBranch, ifCmd);
        return ifCmd;
    }
}

/**
 * Helper function to parse repeat/for expressions
 */
function parseRepeatExpression(helper, startedWithForToken) {
    var innerStartToken = helper.currentToken();
    var identifier;
    if (helper.matchToken("for") || startedWithForToken) {
        var identifierToken = helper.requireTokenType("IDENTIFIER");
        identifier = identifierToken.value;
        helper.requireToken("in");
        var expression = helper.requireElement("expression");
    } else if (helper.matchToken("in")) {
        identifier = "it";
        var expression = helper.requireElement("expression");
    } else if (helper.matchToken("while")) {
        var whileExpr = helper.requireElement("expression");
    } else if (helper.matchToken("until")) {
        var isUntil = true;
        if (helper.matchToken("event")) {
            var evt = helper.requireElement("dotOrColonPath", "Expected event name");
            if (helper.matchToken("from")) {
                var on = helper.requireElement("expression");
            }
        } else {
            var whileExpr = helper.requireElement("expression");
        }
    } else {
        if (!helper.commandBoundary(helper.currentToken()) &&
            helper.currentToken().value !== 'forever') {
            var times = helper.requireElement("expression");
            helper.requireToken("times");
        } else {
            helper.matchToken("forever"); // consume optional forever
            var forever = true;
        }
    }

    if (helper.matchToken("index")) {
        var identifierToken = helper.requireTokenType("IDENTIFIER");
        var indexIdentifier = identifierToken.value;
    } else if (helper.matchToken("indexed")) {
        helper.requireToken("by");
        var identifierToken = helper.requireTokenType("IDENTIFIER");
        var indexIdentifier = identifierToken.value;
    }

    var loop = helper.parseElement("commandList");
    if (loop && evt) {
        // if this is an event based loop, wait a tick at the end of the loop so that
        // events have a chance to trigger in the loop condition o_O)))
        var last = loop;
        while (last.next) {
            last = last.next;
        }
        var waitATick = {
            type: "waitATick",
            op: function () {
                return new Promise(function (resolve) {
                    setTimeout(function () {
                        resolve(context.meta.runtime.findNext(waitATick));
                    }, 0);
                });
            },
        };
        last.next = waitATick;
    }
    if (helper.hasMore()) {
        helper.requireToken("end");
    }

    if (identifier == null) {
        identifier = "_implicit_repeat_" + innerStartToken.start;
        var slot = identifier;
    } else {
        var slot = identifier + "_" + innerStartToken.start;
    }

    var repeatCmd = {
        identifier: identifier,
        indexIdentifier: indexIdentifier,
        slot: slot,
        expression: expression,
        forever: forever,
        times: times,
        until: isUntil,
        event: evt,
        on: on,
        whileExpr: whileExpr,
        resolveNext: function () {
            return this;
        },
        loop: loop,
        args: [whileExpr, times],
        op: function (context, whileValue, times) {
            var iteratorInfo = context.meta.iterators[slot];
            var keepLooping = false;
            var loopVal = null;
            if (this.forever) {
                keepLooping = true;
            } else if (this.until) {
                if (evt) {
                    keepLooping = context.meta.iterators[slot].eventFired === false;
                } else {
                    keepLooping = whileValue !== true;
                }
            } else if (whileExpr) {
                keepLooping = whileValue;
            } else if (times) {
                keepLooping = iteratorInfo.index < times;
            } else {
                var nextValFromIterator = iteratorInfo.iterator.next();
                keepLooping = !nextValFromIterator.done;
                loopVal = nextValFromIterator.value;
            }

            if (keepLooping) {
                if (iteratorInfo.value) {
                    context.result = context.locals[identifier] = loopVal;
                } else {
                    context.result = iteratorInfo.index;
                }
                if (indexIdentifier) {
                    context.locals[indexIdentifier] = iteratorInfo.index;
                }
                iteratorInfo.index++;
                return loop;
            } else {
                context.meta.iterators[slot] = null;
                return context.meta.runtime.findNext(this.parent, context);
            }
        },
    };
    helper.setParent(loop, repeatCmd);
    var repeatInit = {
        name: "repeatInit",
        args: [expression, evt, on],
        op: function (context, value, event, on) {
            var iteratorInfo = {
                index: 0,
                value: value,
                eventFired: false,
            };
            context.meta.iterators[slot] = iteratorInfo;
            if (value) {
                if (value[Symbol.iterator]) {
                    iteratorInfo.iterator = value[Symbol.iterator]();
                } else {
                    iteratorInfo.iterator = Object.keys(value)[Symbol.iterator]();
                }
            }
            if (evt) {
                var target = on || context.me;
                target.addEventListener(
                    event,
                    function (e) {
                        context.meta.iterators[slot].eventFired = true;
                    },
                    { once: true }
                );
            }
            return repeatCmd; // continue to loop
        },
        execute: function (context) {
            return context.meta.runtime.unifiedExec(this, context);
        },
    };
    helper.setParent(repeatCmd, repeatInit);
    return repeatInit;
}

/**
 * RepeatCommand - Loop with various forms
 *
 * Parses: repeat [for x in expr] | [in expr] | [while expr] | [until expr|event] | [n times] | [forever]
 * Executes: Loops according to the specified condition
 */
export class RepeatCommand {
    /**
     * Parse repeat command
     * @param {ParserHelper} helper
     * @returns {RepeatCommand | undefined}
     */
    static parse(helper) {
        if (helper.matchToken("repeat")) {
            return parseRepeatExpression(helper, false);
        }
    }
}

/**
 * ForCommand - For loop (shares parser with repeat)
 *
 * Parses: for <identifier> in <expr> <commands> end
 * Executes: Iterates over expression values
 */
export class ForCommand {
    /**
     * Parse for command
     * @param {ParserHelper} helper
     * @returns {ForCommand | undefined}
     */
    static parse(helper) {
        if (helper.matchToken("for")) {
            return parseRepeatExpression(helper, true);
        }
    }
}

/**
 * ContinueCommand - Continue loop
 *
 * Parses: continue
 * Executes: Continues to next iteration of closest repeat loop
 */
export class ContinueCommand {
    /**
     * Parse continue command
     * @param {ParserHelper} helper
     * @returns {ContinueCommand | undefined}
     */
    static parse(helper) {
        if (!helper.matchToken("continue")) return;

        var command = {
            op: function (context) {
                // scan for the closest repeat statement
                for (var parent = this.parent ; true ; parent = parent.parent) {
                    if (parent == undefined) {
                        helper.raiseParseError("Command `continue` cannot be used outside of a `repeat` loop.")
                    }
                    if (parent.loop != undefined) {
                        return parent.resolveNext(context)
                    }
                }
            }
        };
        return command;
    }
}

/**
 * BreakCommand - Break loop
 *
 * Parses: break
 * Executes: Exits closest repeat loop
 */
export class BreakCommand {
    /**
     * Parse break command
     * @param {ParserHelper} helper
     * @returns {BreakCommand | undefined}
     */
    static parse(helper) {
        if (!helper.matchToken("break")) return;

        var command = {
            op: function (context) {
                // scan for the closest repeat statement
                for (var parent = this.parent ; true ; parent = parent.parent) {
                    if (parent == undefined) {
                        helper.raiseParseError("Command `continue` cannot be used outside of a `repeat` loop.")
                    }
                    if (parent.loop != undefined) {
                        return context.meta.runtime.findNext(parent.parent, context);
                    }
                }
            }
        };
        return command;
    }
}

/**
 * TellCommand - Send command to other element
 *
 * Parses: tell <expr> <commands> end
 * Executes: Executes commands with 'you' set to target element(s)
 */
export class TellCommand {
    /**
     * Parse tell command
     * @param {ParserHelper} helper
     * @returns {TellCommand | undefined}
     */
    static parse(helper) {
        var startToken = helper.currentToken();
        if (!helper.matchToken("tell")) return;
        var value = helper.requireElement("expression");
        var body = helper.requireElement("commandList");
        if (helper.hasMore() && !helper.featureStart(helper.currentToken())) {
            helper.requireToken("end");
        }
        var slot = "tell_" + startToken.start;
        var tellCmd = {
            value: value,
            body: body,
            args: [value],
            resolveNext: function (context) {
                var iterator = context.meta.iterators[slot];
                if (iterator.index < iterator.value.length) {
                    context.you = iterator.value[iterator.index++];
                    return body;
                } else {
                    // restore original me
                    context.you = iterator.originalYou;
                    if (this.next) {
                        return this.next;
                    } else {
                        return context.meta.runtime.findNext(this.parent, context);
                    }
                }
            },
            op: function (context, value) {
                if (value == null) {
                    value = [];
                } else if (!(Array.isArray(value) || value instanceof NodeList)) {
                    value = [value];
                }
                context.meta.iterators[slot] = {
                    originalYou: context.you,
                    index: 0,
                    value: value,
                };
                return this.resolveNext(context);
            },
        };
        helper.setParent(body, tellCmd);
        return tellCmd;
    }
}
