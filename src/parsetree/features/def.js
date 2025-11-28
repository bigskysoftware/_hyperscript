/**
 * Def Feature - Define functions
 *
 * Parses: def <name>[(params...)] <commands> [catch <error> <commands>] [finally <commands>] end
 * Executes: Defines a function that can be called from hyperscript
 */
export class DefFeature {
    /**
     * Parse def feature
     * @param {ParserHelper} helper
     * @param {LanguageKernel} parser
     * @returns {DefFeature | undefined}
     */
    static parse(helper, kernel) {
        if (!helper.matchToken("def")) return;
        var functionName = helper.requireElement("dotOrColonPath");
        var nameVal = functionName.evaluate(); // OK
        var nameSpace = nameVal.split(".");
        var funcName = nameSpace.pop();

        var args = [];
        if (helper.matchOpToken("(")) {
            if (helper.matchOpToken(")")) {
                // empty args list
            } else {
                do {
                    args.push(helper.requireTokenType("IDENTIFIER"));
                } while (helper.matchOpToken(","));
                helper.requireOpToken(")");
            }
        }

        var start = helper.requireElement("commandList");

        var errorSymbol, errorHandler;
        if (helper.matchToken("catch")) {
            errorSymbol = helper.requireTokenType("IDENTIFIER").value;
            errorHandler = helper.parseElement("commandList");
        }

        if (helper.matchToken("finally")) {
            var finallyHandler = helper.requireElement("commandList");
            kernel.ensureTerminated(finallyHandler);
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

        kernel.ensureTerminated(start);

        // terminate error handler if any
        if (errorHandler) {
            kernel.ensureTerminated(errorHandler);
        }

        helper.setParent(start, functionFeature);
        return functionFeature;
    }
}
