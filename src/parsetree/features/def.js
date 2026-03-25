/**
 * Def Feature - Define functions
 *
 * Parses: def <name>[(params...)] <commands> [catch <error> <commands>] [finally <commands>] end
 * Executes: Defines a function that can be called from hyperscript
 */

import { Feature } from '../base.js';

export class DefFeature extends Feature {
    static keyword = "def";

    constructor(funcName, nameSpace, nameVal, args, start, errorHandler, errorSymbol, finallyHandler) {
        super();
        this.displayName =
            funcName +
            "(" +
            args
                .map(function (arg) {
                    return arg.value;
                })
                .join(", ") +
            ")";
        this.name = funcName;
        this.args = args;
        this.start = start;
        this.errorHandler = errorHandler;
        this.errorSymbol = errorSymbol;
        this.finallyHandler = finallyHandler;
        this.nameSpace = nameSpace;
        this.nameVal = nameVal;
    }

    install(target, source, funcArgs, runtime) {
        const args = this.args;
        const start = this.start;
        const errorHandler = this.errorHandler;
        const errorSymbol = this.errorSymbol;
        const finallyHandler = this.finallyHandler;
        const nameVal = this.nameVal;
        const nameSpace = this.nameSpace;
        const funcName = this.name;
        const functionFeature = this;

        var func = function () {
            // null, worker
            var ctx = runtime.makeContext(source, functionFeature, target, null);

            // install error handler if any
            ctx.meta.errorHandler = errorHandler;
            ctx.meta.errorSymbol = errorSymbol;
            ctx.meta.finallyHandler = finallyHandler;

            for (var i = 0; i < args.length; i++) {
                var name = args[i];
                var argumentVal = arguments[i];
                if (name) {
                    ctx.locals[name.value] = argumentVal;
                }
            }
            ctx.meta.caller = arguments[args.length];
            if (ctx.meta.caller) {
                ctx.meta.callingCommand = ctx.meta.caller.meta.command;
            }
            var resolve,
                reject = null;
            var promise = new Promise(function (theResolve, theReject) {
                resolve = theResolve;
                reject = theReject;
            });
            start.execute(ctx);
            if (ctx.meta.returned) {
                return ctx.meta.returnValue;
            } else {
                ctx.meta.resolve = resolve;
                ctx.meta.reject = reject;
                return promise;
            }
        };
        func.hyperfunc = true;
        func.hypername = nameVal;
        runtime.assignToNamespace(target, nameSpace, funcName, func);
    }

    static parse(parser) {
        if (!parser.matchToken("def")) return;
        var functionName = parser.requireElement("dotOrColonPath");
        var nameVal = functionName.evaluate(); // OK
        var nameSpace = nameVal.split(".");
        var funcName = nameSpace.pop();

        var args = [];
        if (parser.matchOpToken("(")) {
            if (parser.matchOpToken(")")) {
                // empty args list
            } else {
                do {
                    args.push(parser.requireTokenType("IDENTIFIER"));
                } while (parser.matchOpToken(","));
                parser.requireOpToken(")");
            }
        }

        var start = parser.requireElement("commandList");

        var { errorHandler, errorSymbol, finallyHandler } = Feature.parseErrorAndFinally(parser);

        var functionFeature = new DefFeature(funcName, nameSpace, nameVal, args, start, errorHandler, errorSymbol, finallyHandler);

        parser.ensureTerminated(start);

        // terminate error handler if any
        if (errorHandler) {
            parser.ensureTerminated(errorHandler);
        }

        parser.setParent(start, functionFeature);
        return functionFeature;
    }
}
