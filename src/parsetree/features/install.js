/**
 * Install Feature - Install a defined behavior onto an element
 *
 * Parses: install <behavior-path> [(args...)]
 * Executes: Applies the named behavior to the current element
 */
export class InstallFeature {
    /**
     * Parse install feature
     * @param {Parser} parser
     * @returns {InstallFeature | undefined}
     */
    static parse(parser) {
        if (!parser.matchToken("install")) return;
        var behaviorPath = parser.requireElement("dotOrColonPath").evaluate();
        var behaviorNamespace = behaviorPath.split(".");
        var args = parser.parseElement("namedArgumentList");

        var installFeature;
        return (installFeature = {
            install: function (target, source, installArgs, runtime) {
                runtime.unifiedEval(
                    {
                        args: [args],
                        op: function (ctx, args) {
                            var behavior = runtime.globalScope;
                            for (var i = 0; i < behaviorNamespace.length; i++) {
                                behavior = behavior[behaviorNamespace[i]];
                                if (typeof behavior !== "object" && typeof behavior !== "function")
                                    throw new Error("No such behavior defined as " + behaviorPath);
                            }

                            if (!(behavior instanceof Function))
                                throw new Error(behaviorPath + " is not a behavior");

                            behavior(target, source, args);
                        },
                    },
                    runtime.makeContext(target, installFeature, target, null)
                );
            },
        });
    }
}
