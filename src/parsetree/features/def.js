/**
 * Def Feature - Define functions
 *
 * Parses: def <name>[(params...)] <commands> [catch <error> <commands>] [finally <commands>] end
 * Executes: Defines a function that can be called from hyperscript
 */
export class DefFeature {
    static keyword = "def";

    /**
     * Parse def feature
     * @param {Parser} parser
     * @returns {DefFeature | undefined}
     */
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

        var errorSymbol, errorHandler;
        if (parser.matchToken("catch")) {
            errorSymbol = parser.requireTokenType("IDENTIFIER").value;
            errorHandler = parser.parseElement("commandList");
        }

        if (parser.matchToken("finally")) {
            var finallyHandler = parser.requireElement("commandList");
            parser.ensureTerminated(finallyHandler);
        }

        var functionFeature = {
            displayName:
                funcName +
                "(" +
                args
                    .map(function (arg) {
                        return arg.value;
                    })
                    .join(", ") +
                ")",
            name: funcName,
            args: args,
            start: start,
            errorHandler: errorHandler,
            errorSymbol: errorSymbol,
            finallyHandler: finallyHandler,
            install: function (target, source, funcArgs, runtime) {
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
            },
        };

        parser.ensureTerminated(start);

        // terminate error handler if any
        if (errorHandler) {
            parser.ensureTerminated(errorHandler);
        }

        parser.setParent(start, functionFeature);
        return functionFeature;
    }
}
