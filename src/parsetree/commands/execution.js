/**
 * Code execution command parse tree elements
 * Commands for executing code (js, async, call, get)
 */

import { Command } from '../base.js';
import { Runtime } from '../../core/runtime.js';
import { varargConstructor } from '../../core/runtime.js';

/**
 * JsBody - Parse JavaScript body for js feature/command
 *
 * Parses JavaScript code until 'end' keyword, extracting function names
 */
export class JsBody {
    /**
     * Parse JavaScript body
     * @param {Parser} parser
     * @returns {Object}
     */
    static parse(parser) {
        var jsSourceStart = parser.currentToken().start;
        var jsLastToken = parser.currentToken();

        var funcNames = [];
        var funcName = "";
        var expectFunctionDeclaration = false;
        while (parser.hasMore()) {
            jsLastToken = parser.consumeToken();
            var peek = parser.token(0, true);
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
            jsSource: parser.source.substring(jsSourceStart, jsSourceEnd),
        };
    }
}

/**
 * JsCommand - Execute JavaScript code
 *
 * Parses: js [(inputs...)] <jsBody> end
 * Executes: Runs JavaScript code with optional inputs from hyperscript context
 */
export class JsCommand extends Command {
    static keyword = "js";

    constructor(jsSource, func, inputs) {
        super();
        this.type = "jsCommand";
        this.jsSource = jsSource;
        this.function = func;
        this.inputs = inputs;
    }

    /**
     * Parse js command
     * @param {Parser} parser
     * @returns {JsCommand | undefined}
     */
    static parse(parser) {
        if (!parser.matchToken("js")) return;
        // Parse inputs
        var inputs = [];
        if (parser.matchOpToken("(")) {
            if (parser.matchOpToken(")")) {
                // empty input list
            } else {
                do {
                    var inp = parser.requireTokenType("IDENTIFIER");
                    inputs.push(inp.value);
                } while (parser.matchOpToken(","));
                parser.requireOpToken(")");
            }
        }

        var jsBody = parser.requireElement("jsBody");
        parser.matchToken("end");

        var func = varargConstructor(Function, inputs.concat([jsBody.jsSource]));

        return new JsCommand(jsBody.jsSource, func, inputs);
    }

    op(context) {
        var args = [];
        this.inputs.forEach((input) => {
            args.push(context.meta.runtime.resolveSymbol(input, context, 'default'));
        });
        var result = this.function.apply(context.meta.runtime.globalScope, args);
        if (result && typeof result.then === "function") {
            return new Promise((resolve) => {
                result.then((actualResult) => {
                    context.result = actualResult;
                    resolve(context.meta.runtime.findNext(this, context));
                });
            });
        } else {
            context.result = result;
            return context.meta.runtime.findNext(this, context);
        }
    }
}

/**
 * AsyncCommand - Execute command asynchronously
 *
 * Parses: async [do] <command[s]> [end]
 * Executes: Runs command(s) asynchronously via setTimeout
 */
export class AsyncCommand extends Command {
    static keyword = "async";

    constructor(body) {
        super();
        this.type = "asyncCommand";
        this.body = body;
    }

    /**
     * Parse async command
     * @param {Parser} parser
     * @returns {AsyncCommand | undefined}
     */
    static parse(parser) {
        if (!parser.matchToken("async")) return;
        if (parser.matchToken("do")) {
            var body = parser.requireElement("commandList");

            // Append halt
            var end = body;
            while (end.next) end = end.next;
            end.next = Runtime.HALT;

            parser.requireToken("end");
        } else {
            var body = parser.requireElement("command");
        }
        var command = new AsyncCommand(body);
        parser.setParent(body, command);
        return command;
    }

    op(context) {
        setTimeout(() => {
            this.body.execute(context);
        });
        return context.meta.runtime.findNext(this, context);
    }
}

/**
 * Helper function to parse call/get commands
 */
class CallOrGetCommandImpl extends Command {
    constructor(expr) {
        super();
        this.type = "callCommand";
        this.expr = expr;
        this.args = [expr];
    }

    op(context, result) {
        context.result = result;
        return context.meta.runtime.findNext(this, context);
    }
}

function parseCallOrGet(parser) {
    var expr = parser.requireElement("expression");
    return new CallOrGetCommandImpl(expr);
}

/**
 * CallCommand - Call function
 *
 * Parses: call <functionCall>
 * Executes: Calls function (must be a function invocation)
 */
export class CallCommand {
    static keyword = "call";

    /**
     * Parse call command
     * @param {Parser} parser
     * @returns {CallCommand | undefined}
     */
    static parse(parser) {
        if (!parser.matchToken("call")) return;
        var call = parseCallOrGet(parser);
        if (call.expr && call.expr.type !== "functionCall") {
            parser.raiseParseError("Must be a function invocation");
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
    static keyword = "get";

    /**
     * Parse get command
     * @param {Parser} parser
     * @returns {GetCommand | undefined}
     */
    static parse(parser) {
        if (parser.matchToken("get")) {
            return parseCallOrGet(parser);
        }
    }
}
