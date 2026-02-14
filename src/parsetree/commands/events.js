/**
 * Event-related command parse tree elements
 * Commands for event handling and waiting (wait, trigger, send)
 */

import { Command } from '../base.js';

/**
 * Helper function to parse event argument list
 */
function parseEventArgs(parser) {
    var args = [];
    // handle argument list (look ahead 3)
    if (
        parser.token(0).value === "(" &&
        (parser.token(1).value === ")" || parser.token(2).value === "," || parser.token(2).value === ")")
    ) {
        parser.matchOpToken("(");
        do {
            args.push(parser.requireTokenType("IDENTIFIER"));
        } while (parser.matchOpToken(","));
        parser.requireOpToken(")");
    }
    return args;
}

/**
 * WaitCommand - Wait for time or event
 *
 * Parses: wait [a tick] | wait <time> | wait for [a] <event> [or <event>...] [from <target>]
 * Executes: Waits for specified time or events
 */
/**
 * WaitCommandEvent - Wait for event(s)
 */
class WaitCommandEvent extends Command {
    constructor(events, on) {
        super();
        this.type = "waitCommand";
        this.event = events;
        this.on = on;
        this.args = [on];
    }

    op(context, on) {
        const events = this.event;
        var target = on ? on : context.me;
        if (!(target instanceof EventTarget))
            throw new Error("Not a valid event target: " + this.on.sourceFor());
        return new Promise((resolve) => {
            var resolved = false;
            for (const eventInfo of events) {
                var listener = (evt) => {
                    context.result = evt;
                    if (eventInfo.args) {
                        for (const arg of eventInfo.args) {
                            context.locals[arg.value] =
                                evt[arg.value] || (evt.detail ? evt.detail[arg.value] : null);
                        }
                    }
                    if (!resolved) {
                        resolved = true;
                        resolve(context.meta.runtime.findNext(this, context));
                    }
                };
                if (eventInfo.name){
                    target.addEventListener(eventInfo.name, listener, {once: true});
                } else  {
                    const timeValue = eventInfo.evaluate(context);
                    setTimeout(listener, timeValue, timeValue)
                }
            }
        });
    }
}

/**
 * WaitCommandTime - Wait for time duration
 */
class WaitCommandTime extends Command {
    constructor(time) {
        super();
        this.type = "waitCmd";
        this.time = time;
        this.args = [time];
    }

    op(context, timeValue) {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(context.meta.runtime.findNext(this, context));
            }, timeValue);
        });
    }
}

export class WaitCommand {
    static keyword = "wait";

    /**
     * Parse wait command
     * @param {Parser} parser
     * @returns {WaitCommandEvent | WaitCommandTime | undefined}
     */
    static parse(parser) {
        if (!parser.matchToken("wait")) return;

        // wait on event
        if (parser.matchToken("for")) {
            parser.matchToken("a"); // optional "a"
            var events = [];
            do {
                var lookahead = parser.token(0);
                if (lookahead.type === 'NUMBER' || lookahead.type === 'L_PAREN') {
                    events.push(parser.requireElement('expression')) // removed .evaluate(), i thought evaluate was based on the runtime and we don't have a runtime in the parsing phase yet

                } else {
                    events.push({
                        name: parser.requireElement("dotOrColonPath", "Expected event name").evaluate(),
                        args: parseEventArgs(parser),
                    });
                }
            } while (parser.matchToken("or"));

            if (parser.matchToken("from")) {
                var on = parser.requireElement("expression");
            }

            return new WaitCommandEvent(events, on);
        } else {
            var time;
            if (parser.matchToken("a")) {
                parser.requireToken("tick");
                time = 0;
            } else {
                time = parser.requireElement("expression");
            }

            return new WaitCommandTime(time);
        }
    }
}

/**
 * SendCommand - Send event to target
 *
 * Parses: send <event> [to <target>]
 * Executes: Sends event to target (or implicit me)
 */
export class SendCommand extends Command {
    static keyword = "send";

    constructor(eventName, details, toExpr) {
        super();
        this.type = "sendCommand";
        this.eventName = eventName;
        this.details = details;
        this.to = toExpr;
        this.args = [toExpr, eventName, details];
        this.toExpr = toExpr;
    }

    /**
     * Parse send command
     * @param {Parser} parser
     * @returns {SendCommand | undefined}
     */
    static parse(parser) {
        if (!parser.matchToken("send")) return;

        var eventName = parser.requireElement("eventName");
        var details = parser.parseElement("namedArgumentList");

        if (parser.matchToken("to")) {
            var toExpr = parser.requireElement("expression");
        } else {
            var toExpr = parser.requireElement("implicitMeTarget");
        }

        return new SendCommand(eventName, details, toExpr);
    }

    op(context, to, eventName, details) {
        context.meta.runtime.nullCheck(to, this.toExpr);
        context.meta.runtime.implicitLoop(to, function (target) {
            context.meta.runtime.triggerEvent(target, eventName, details, context.me);
        });
        return context.meta.runtime.findNext(this, context);
    }
}

/**
 * TriggerCommand - Trigger event on target
 *
 * Parses: trigger <event> [on <target>]
 * Executes: Triggers event on target (or implicit me)
 */
export class TriggerCommand extends SendCommand {
    static keyword = "trigger";

    /**
     * Parse trigger command
     * @param {Parser} parser
     * @returns {TriggerCommand | undefined}
     */
    static parse(parser) {
        if (!parser.matchToken("trigger")) return;

        var eventName = parser.requireElement("eventName");
        var details = parser.parseElement("namedArgumentList");

        if (parser.matchToken("on")) {
            var toExpr = parser.requireElement("expression");
        } else {
            var toExpr = parser.requireElement("implicitMeTarget");
        }

        return new TriggerCommand(eventName, details, toExpr);
    }
}

/**
 * EventName - Parse an event name
 *
 * Parses: "string" OR dotOrColonPath
 * Returns: evaluable event name
 */
/**
 * EventNameNode - Represents an event name from a string literal
 */
class EventNameNode {
    constructor(value) {
        this.value = value;
    }

    evaluate() {
        return this.value;
    }
}

export class EventName {
    /**
     * Parse event name (string literal or dot/colon path)
     * @param {Parser} parser
     * @returns {EventNameNode | DotOrColonPathNode | undefined}
     */
    static parse(parser) {
        var token;
        if ((token = parser.matchTokenType("STRING"))) {
            return new EventNameNode(token.value);
        }

        return parser.parseElement("dotOrColonPath");
    }
}
