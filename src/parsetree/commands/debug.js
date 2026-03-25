/**
 * Debug command parse tree elements
 */

import { Command } from '../base.js';

/**
 * BreakpointCommand - Pause execution in browser DevTools
 *
 * Parses: breakpoint
 * Executes: Triggers the JS debugger statement. Install hdb for a full debugger UI.
 */
export class BreakpointCommand extends Command {
    static keyword = "breakpoint";

    static parse(parser) {
        if (!parser.matchToken("breakpoint")) return;
        return new BreakpointCommand();
    }

    resolve(ctx) {
        debugger;
        return ctx.meta.runtime.findNext(this, ctx);
    }
}
