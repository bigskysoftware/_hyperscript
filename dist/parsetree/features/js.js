/**
 * JS Feature - Inline JavaScript code with exposed functions
 *
 * Parses: js ... end
 * Executes: Evaluates JavaScript and exposes defined functions to global scope
 */

import { Feature } from '../base.js';

export class JsFeature extends Feature {
    constructor(jsSource, func, exposedFunctionNames) {
        super();
        this.jsSource = jsSource;
        this.function = func;
        this.exposedFunctionNames = exposedFunctionNames;
    }

    install(target, source, args, runtime) {
        Object.assign(runtime.globalScope, this.function());
    }

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

        return new JsFeature(jsSource, func, jsBody.exposedFunctionNames);
    }
}
