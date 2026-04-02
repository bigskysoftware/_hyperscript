/**
 * Install Feature - Install a defined behavior onto an element
 *
 * Parses: install <behavior-path> [(args...)]
 * Executes: Applies the named behavior to the current element
 */

import { Feature } from '../base.js';

export class InstallFeature extends Feature {
    static keyword = "install";

    constructor(behaviorPath, behaviorNamespace, args) {
        super();
        this.behaviorPath = behaviorPath;
        this.behaviorNamespace = behaviorNamespace;
        this.behaviorArgs = args;
    }

    install(target, source, installArgs, runtime) {
        var ctx = runtime.makeContext(target, this, target, null);
        var behaviorArgs = this.behaviorArgs ? this.behaviorArgs.evaluate(ctx) : null;

        var behavior = runtime.globalScope;
        for (var i = 0; i < this.behaviorNamespace.length; i++) {
            behavior = behavior[this.behaviorNamespace[i]];
            if (typeof behavior !== "object" && typeof behavior !== "function")
                throw new Error("No such behavior defined as " + this.behaviorPath);
        }

        if (!(behavior instanceof Function))
            throw new Error(this.behaviorPath + " is not a behavior");

        behavior(target, source, behaviorArgs);
    }

    static parse(parser) {
        if (!parser.matchToken("install")) return;
        var behaviorPath = parser.requireElement("dotOrColonPath").evalStatically();
        var behaviorNamespace = behaviorPath.split(".");
        var args = parser.parseElement("namedArgumentList");

        return new InstallFeature(behaviorPath, behaviorNamespace, args);
    }
}
