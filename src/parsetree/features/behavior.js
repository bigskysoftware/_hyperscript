/**
 * Behavior Feature - Define reusable behaviors
 *
 * Parses: behavior <path>[(params...)] <hyperscript> end
 * Executes: Registers a behavior that can be installed on elements
 */

import { getOrInitObject } from '../../core/runtime.js';

export class BehaviorFeature {
    /**
     * Parse behavior feature
     * @param {Parser} parser
     * @returns {BehaviorFeature | undefined}
     */
    static parse(parser) {
        if (!parser.matchToken("behavior")) return;
        var path = parser.requireElement("dotOrColonPath").evaluate();
        var nameSpace = path.split(".");
        var name = nameSpace.pop();

        var formalParams = [];
        if (parser.matchOpToken("(") && !parser.matchOpToken(")")) {
            do {
                formalParams.push(parser.requireTokenType("IDENTIFIER").value);
            } while (parser.matchOpToken(","));
            parser.requireOpToken(")");
        }
        var hs = parser.requireElement("hyperscript");
        for (var i = 0; i < hs.features.length; i++) {
            var feature = hs.features[i];
            feature.behavior = path;
        }

        return {
            install: function (target, source, args, runtime) {
                runtime.assignToNamespace(
                    runtime.globalScope.document && runtime.globalScope.document.body,
                    nameSpace,
                    name,
                    function (target, source, innerArgs) {
                        var internalData = runtime.getInternalData(target);
                        var elementScope = getOrInitObject(internalData, path + "Scope");
                        for (var i = 0; i < formalParams.length; i++) {
                            elementScope[formalParams[i]] = innerArgs[formalParams[i]];
                        }
                        hs.apply(target, source, null, runtime);
                    }
                );
            },
        };
    }
}
