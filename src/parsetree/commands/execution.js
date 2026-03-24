/**
 * Code execution command parse tree elements
 * Commands for executing code (js, async, call, get)
 */

import { Command } from '../base.js';
import { varargConstructor } from '../../core/runtime/runtime.js';

/**
 * JsBody - Parse JavaScript body for js feature/command
 *
 * Parses JavaScript code until 'end' keyword, extracting function names
 */
export class JsBody {
    static grammarName = "jsBody";

    constructor(jsSource, exposedFunctionNames) {
        this.type = "jsBody";
        this.jsSource = jsSource;
        this.exposedFunctionNames = exposedFunctionNames;
    }

    /**
     * Parse JavaScript body
     * @param {Parser} parser
     * @returns {JsBody}
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

        return new JsBody(
            parser.source.substring(jsSourceStart, jsSourceEnd),
            funcNames
        );
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

    resolve(context) {
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
 * CallCommand - Call function
 *
 * Parses: call <functionCall>
 * Executes: Calls function (must be a function invocation)
 */
export class CallCommand extends Command {
    static keyword = "call";

    constructor(expr) {
        super();
        this.expr = expr;
        this.args = [expr];
    }

    /**
     * Parse call command
     * @param {Parser} parser
     * @returns {CallCommand | undefined}
     */
    static parse(parser) {
        if (!parser.matchToken("call")) return;
        var expr = parser.requireElement("expression");
        if (expr && expr.type !== "functionCall") {
            parser.raiseParseError("Must be a function invocation");
        }
        return new CallCommand(expr);
    }

    resolve(context, result) {
        context.result = result;
        return context.meta.runtime.findNext(this, context);
    }
}

/**
 * GetCommand - Get value (similar to call but no restriction)
 *
 * Parses: get <expression>
 * Executes: Evaluates expression and stores result
 */
export class GetCommand extends Command {
    static keyword = "get";

    constructor(expr) {
        super();
        this.expr = expr;
        this.args = [expr];
    }

    /**
     * Parse get command
     * @param {Parser} parser
     * @returns {GetCommand | undefined}
     */
    static parse(parser) {
        if (!parser.matchToken("get")) return;
        var expr = parser.requireElement("expression");
        return new GetCommand(expr);
    }

    resolve(context, result) {
        context.result = result;
        return context.meta.runtime.findNext(this, context);
    }
}
