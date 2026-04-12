/**
 * Internal parse elements used by the kernel grammar
 */

import { ParseElement, Command, Feature } from './base.js';

/**
 * EmptyCommandListCommand - Placeholder for empty command lists
 */
export class EmptyCommandListCommand extends Command {
    constructor() {
        super();
        this.type = "emptyCommandListCommand";
    }

    resolve(context) {
        return this.findNext(context);
    }
}

/**
 * UnlessStatementModifier - Wraps a command with an "unless" conditional
 */
export class UnlessStatementModifier extends Command {
    constructor(root, conditional) {
        super();
        this.type = "unlessStatementModifier";
        this.root = root;
        this.args = { conditional };
    }

    resolve(context, { conditional }) {
        if (conditional) {
            return this.next;
        } else {
            return this.root;
        }
    }
}

/**
 * HyperscriptProgram - Root node for a parsed hyperscript document
 */
export class HyperscriptProgram extends ParseElement {
    constructor(features) {
        super();
        this.type = "hyperscript";
        this.features = features;
    }

    apply(target, source, args, runtime) {
        for (const feature of this.features) {
            feature.install(target, source, args, runtime);
        }
    }
}

/**
 * FailedFeature - Placeholder for a feature that failed to parse.
 * Allows the parser to continue and collect more errors.
 * Never executed - element won't apply() if errors exist.
 */
export class FailedFeature extends Feature {
    constructor(error, keyword) {
        super();
        this.type = "failedFeature";
        this.keyword = keyword;
        this.errors.push(error);
    }

    install() {}
}

/**
 * FailedCommand - Placeholder for a command that failed to parse.
 * Allows the parser to continue and collect more errors.
 * Never executed - element won't apply() if errors exist.
 */
export class FailedCommand extends Command {
    constructor(error, keyword) {
        super();
        this.type = "failedCommand";
        this.keyword = keyword;
        this.errors.push(error);
    }

    resolve() {}
}

/**
 * ImplicitReturn - Terminates command lists without explicit returns
 */
export class ImplicitReturn extends Command {
    constructor() {
        super();
        this.type = "implicitReturn";
    }

    resolve(context) {
        context.meta.returned = true;
        if (context.meta.resolve) {
            context.meta.resolve();
        }
        return context.meta.runtime.HALT;
    }
}
