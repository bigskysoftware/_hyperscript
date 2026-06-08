/**
 * Debug command parse tree elements
 */

import { Command } from '../base.js';
import { config } from '../../core/config.js';

/**
 * BreakpointCommand - Pause execution for a debugger
 *
 * Parses: breakpoint
 * Executes: When config.debugMode is true, fires a cancelable
 *   `hyperscript:breakpoint` event with detail { command, ctx } on the
 *   owning element. If a listener calls preventDefault() the JS `debugger`
 *   statement is suppressed (allowing e.g. an in-page debugger panel to
 *   handle the pause). Otherwise the JS `debugger` statement runs,
 *   triggering the browser's DevTools if open (or a no-op if not).
 */
export class BreakpointCommand extends Command {
    static keyword = "breakpoint";

    static parse(parser) {
        if (!parser.matchToken("breakpoint")) return;
        return new BreakpointCommand();
    }

    resolve(ctx) {
        var handled = false;
        if (config.debugMode) {
            var runtime = ctx.meta.runtime;
            var target = ctx.meta.owner || ctx.me;
            // triggerEvent returns false if a listener called preventDefault()
            handled = !runtime.triggerEvent(target, "hyperscript:breakpoint", {
                command: this,
                ctx: ctx,
            });
        }
        if (!handled) {
            debugger;
        }
        return this.findNext(ctx);
    }
}
