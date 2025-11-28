/**
 * JS Feature - Inline JavaScript code with exposed functions
 *
 * Parses: js ... end
 * Executes: Evaluates JavaScript and exposes defined functions to global scope
 */
export class JsFeature {
    /**
     * Parse js feature
     * @param {Parser} parser
     * @returns {JsFeature | undefined}
     */
    static parse(parser) {
        if (!parser.matchToken("js")) return;
        var jsBody = parser.requireElement("jsBody");

        var jsSource =
            jsBody.jsSource +
            "\nreturn { " +
            jsBody.exposedFunctionNames
                .map(function (name) {
                    return name + ":" + name;
                })
                .join(",") +
            " } ";
        var func = new Function(jsSource);

        return {
            jsSource: jsSource,
            function: func,
            exposedFunctionNames: jsBody.exposedFunctionNames,
            install: function (target, source, args, runtime) {
                Object.assign(runtime.globalScope, func());
            },
        };
    }
}
