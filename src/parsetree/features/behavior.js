/**
 * Behavior Feature - Define reusable behaviors
 *
 * Parses: behavior <path>[(params...)] <hyperscript> end
 * Executes: Registers a behavior that can be installed on elements
 */

import { Feature } from '../base.js';

export class BehaviorFeature extends Feature {
    static keyword = "behavior";

    constructor(path, nameSpace, name, formalParams, hs) {
        super();
        this.path = path;
        this.nameSpace = nameSpace;
        this.name = name;
        this.formalParams = formalParams;
        this.hs = hs;
    }

    install(target, source, args, runtime) {
        const path = this.path;
        const nameSpace = this.nameSpace;
        const name = this.name;
        const formalParams = this.formalParams;
        const hs = this.hs;

        runtime.assignToNamespace(
            null,
            nameSpace,
            name,
            function (target, source, innerArgs) {
                var internalData = runtime.getInternalData(target);
                var scopeName = path + "Scope";
                var elementScope = internalData[scopeName] || (internalData[scopeName] = {});
                for (var i = 0; i < formalParams.length; i++) {
                    elementScope[formalParams[i]] = innerArgs[formalParams[i]];
                }
                hs.apply(target, source, null, runtime);
            }
        );
    }

    static parse(parser) {
        if (!parser.matchToken("behavior")) return;
        var path = parser.requireElement("dotOrColonPath").evalStatically();
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

        return new BehaviorFeature(path, nameSpace, name, formalParams, hs);
    }
}
