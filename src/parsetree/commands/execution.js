/**
 * Code execution command parse tree elements
 * Commands for executing code (js, async, call, get)
 */

import { Runtime } from '../../core/runtime.js';
import { varargConstructor } from '../../core/helpers.js';

/**
 * JsBody - Parse JavaScript body for js feature/command
 *
 * Parses JavaScript code until 'end' keyword, extracting function names
 */
export class JsBody {
    /**
     * Parse JavaScript body
     * @param {ParserHelper} helper
     * @returns {Object}
     */
    static parse(helper) {
        var jsSourceStart = helper.currentToken().start;
        var jsLastToken = helper.currentToken();

        var funcNames = [];
        var funcName = "";
        var expectFunctionDeclaration = false;
        while (helper.hasMore()) {
            jsLastToken = helper.consumeToken();
            var peek = helper.token(0, true);
            if (peek.type === "IDENTIFIER" && peek.value === "end") {
                break;
            }
            if (expectFunctionDeclaration) {
                if (jsLastToken.type === "IDENTIFIER" || jsLastToken.type === "NUMBER") {
                    funcName += jsLastToken.value;
                } else {
                    if (funcName !== "") funcNames.push(funcName);
                    funcName = "";
                    expectFunctionDeclaration = false;
                }
            } else if (jsLastToken.type === "IDENTIFIER" && jsLastToken.value === "function") {
                expectFunctionDeclaration = true;
            }
        }
        var jsSourceEnd = jsLastToken.end + 1;

        return {
            type: "jsBody",
            exposedFunctionNames: funcNames,
            jsSource: helper.source.substring(jsSourceStart, jsSourceEnd),
        };
    }
}

/**
 * JsCommand - Execute JavaScript code
 *
 * Parses: js [(inputs...)] <jsBody> end
 * Executes: Runs JavaScript code with optional inputs from hyperscript context
 */
export class JsCommand {
    /**
     * Parse js command
     * @param {ParserHelper} helper
     * @returns {JsCommand | undefined}
     */
    static parse(helper) {
        if (!helper.matchToken("js")) return;
        // Parse inputs
        var inputs = [];
        if (helper.matchOpToken("(")) {
            if (helper.matchOpToken(")")) {
                // empty input list
            } else {
                do {
                    var inp = helper.requireTokenType("IDENTIFIER");
                    inputs.push(inp.value);
                } while (helper.matchOpToken(","));
                helper.requireOpToken(")");
            }
        }

        var jsBody = helper.requireElement("jsBody");
        helper.matchToken("end");

        var func = varargConstructor(Function, inputs.concat([jsBody.jsSource]));

        var command = {
            jsSource: jsBody.jsSource,
            function: func,
            inputs: inputs,
            op: function (context) {
                var args = [];
                inputs.forEach(function (input) {
                    args.push(context.meta.runtime.resolveSymbol(input, context, 'default'));
                });
                var result = func.apply(context.meta.runtime.globalScope, args);
                if (result && typeof result.then === "function") {
                    return new Promise(function (resolve) {
                        result.then(function (actualResult) {
                            context.result = actualResult;
                            resolve(context.meta.runtime.findNext(this, context));
                        });
                    });
                } else {
                    context.result = result;
                    return context.meta.runtime.findNext(this, context);
                }
            },
        };
        return command;
    }
}

/**
 * AsyncCommand - Execute command asynchronously
 *
 * Parses: async [do] <command[s]> [end]
 * Executes: Runs command(s) asynchronously via setTimeout
 */
export class AsyncCommand {
    /**
     * Parse async command
     * @param {ParserHelper} helper
     * @returns {AsyncCommand | undefined}
     */
    static parse(helper) {
        if (!helper.matchToken("async")) return;
        if (helper.matchToken("do")) {
            var body = helper.requireElement("commandList");

            // Append halt
            var end = body;
            while (end.next) end = end.next;
            end.next = Runtime.HALT;

            helper.requireToken("end");
        } else {
            var body = helper.requireElement("command");
        }
        var command = {
            body: body,
            op: function (context) {
                setTimeout(function () {
                    body.execute(context);
                });
                return context.meta.runtime.findNext(this, context);
            },
        };
        helper.setParent(body, command);
        return command;
    }
}

/**
 * Helper function to parse call/get commands
 */
function parseCallOrGet(helper) {
    var expr = helper.requireElement("expression");
    var callCmd = {
        expr: expr,
        args: [expr],
        op: function (context, result) {
            context.result = result;
            return context.meta.runtime.findNext(callCmd, context);
        },
    };
    return callCmd;
}

/**
 * CallCommand - Call function
 *
 * Parses: call <functionCall>
 * Executes: Calls function (must be a function invocation)
 */
export class CallCommand {
    /**
     * Parse call command
     * @param {ParserHelper} helper
     * @returns {CallCommand | undefined}
     */
    static parse(helper) {
        if (!helper.matchToken("call")) return;
        var call = parseCallOrGet(helper);
        if (call.expr && call.expr.type !== "functionCall") {
            helper.raiseParseError("Must be a function invocation");
        }
        return call;
    }
}

/**
 * GetCommand - Get value (similar to call but no restriction)
 *
 * Parses: get <expression>
 * Executes: Evaluates expression and stores result
 */
export class GetCommand {
    /**
     * Parse get command
     * @param {ParserHelper} helper
     * @returns {GetCommand | undefined}
     */
    static parse(helper) {
        if (helper.matchToken("get")) {
            return parseCallOrGet(helper);
        }
    }
}
