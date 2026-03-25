/**
 * Install Feature - Install a defined behavior onto an element
 *
 * Parses: install <behavior-path> [(args...)]
 * Executes: Applies the named behavior to the current element
 */

import { Feature } from '../base.js';
import { Expression } from '../base.js';

/**
 * BehaviorInstallOperation - Evaluates and installs a behavior
 */
class BehaviorInstallOperation extends Expression {
    constructor(args, behaviorPath, behaviorNamespace, target, source, runtime) {
        super();
        this.args = { behaviorArgs: args };
        this.behaviorPath = behaviorPath;
        this.behaviorNamespace = behaviorNamespace;
        this.installTarget = target;
        this.installSource = source;
        this.runtime = runtime;
    }

    resolve(ctx, { behaviorArgs }) {
        var behavior = this.runtime.globalScope;
        for (var i = 0; i < this.behaviorNamespace.length; i++) {
            behavior = behavior[this.behaviorNamespace[i]];
            if (typeof behavior !== "object" && typeof behavior !== "function")
                throw new Error("No such behavior defined as " + this.behaviorPath);
        }

        if (!(behavior instanceof Function))
            throw new Error(this.behaviorPath + " is not a behavior");

        behavior(this.installTarget, this.installSource, behaviorArgs);
    }
}

export class InstallFeature extends Feature {
    static keyword = "install";

    constructor(behaviorPath, behaviorNamespace, args) {
        super();
        this.behaviorPath = behaviorPath;
        this.behaviorNamespace = behaviorNamespace;
        this.args = args;
    }

    install(target, source, installArgs, runtime) {
        const operation = new BehaviorInstallOperation(
            this.args,
            this.behaviorPath,
            this.behaviorNamespace,
            target,
            source,
            runtime
        );
        runtime.unifiedEval(operation, runtime.makeContext(target, this, target, null));
    }

    static parse(parser) {
        if (!parser.matchToken("install")) return;
        var behaviorPath = parser.requireElement("dotOrColonPath").evaluate();
        var behaviorNamespace = behaviorPath.split(".");
        var args = parser.parseElement("namedArgumentList");

        return new InstallFeature(behaviorPath, behaviorNamespace, args);
    }
}
