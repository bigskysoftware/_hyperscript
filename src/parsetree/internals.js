/**
 * Internal parse elements used by the kernel grammar
 */

import { Command } from './base.js';

/**
 * EmptyCommandListCommand - Placeholder for empty command lists
 */
export class EmptyCommandListCommand extends Command {
    constructor() {
        super();
        this.type = "emptyCommandListCommand";
    }

    resolve(context) {
        return context.meta.runtime.findNext(this, context);
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
export class HyperscriptProgram {
    constructor(features) {
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
