/**
 * Event-related command parse tree elements
 * Commands for event handling and waiting (wait, trigger, send)
 */

/**
 * Helper function to parse event argument list
 */
function parseEventArgs(helper) {
    var args = [];
    // handle argument list (look ahead 3)
    if (
        helper.token(0).value === "(" &&
        (helper.token(1).value === ")" || helper.token(2).value === "," || helper.token(2).value === ")")
    ) {
        helper.matchOpToken("(");
        do {
            args.push(helper.requireTokenType("IDENTIFIER"));
        } while (helper.matchOpToken(","));
        helper.requireOpToken(")");
    }
    return args;
}

/**
 * WaitCommand - Wait for time or event
 *
 * Parses: wait [a tick] | wait <time> | wait for [a] <event> [or <event>...] [from <target>]
 * Executes: Waits for specified time or events
 */
export class WaitCommand {
    /**
     * Parse wait command
     * @param {ParserHelper} helper
     * @returns {WaitCommand | undefined}
     */
    static parse(helper) {
        if (!helper.matchToken("wait")) return;
        var command;

        // wait on event
        if (helper.matchToken("for")) {
            helper.matchToken("a"); // optional "a"
            var events = [];
            do {
                var lookahead = helper.token(0);
                if (lookahead.type === 'NUMBER' || lookahead.type === 'L_PAREN') {
                    events.push({
                        time: helper.requireElement('expression').evaluate() // TODO: do we want to allow async here?
                    })
                } else {
                    events.push({
                        name: helper.requireElement("dotOrColonPath", "Expected event name").evaluate(),
                        args: parseEventArgs(helper),
                    });
                }
            } while (helper.matchToken("or"));

            if (helper.matchToken("from")) {
                var on = helper.requireElement("expression");
            }

            // wait on event
            command = {
                event: events,
                on: on,
                args: [on],
                op: function (context, on) {
                    var target = on ? on : context.me;
                    if (!(target instanceof EventTarget))
                        throw new Error("Not a valid event target: " + this.on.sourceFor());
                    return new Promise((resolve) => {
                        var resolved = false;
                        for (const eventInfo of events) {
                            var listener = (event) => {
                                context.result = event;
                                if (eventInfo.args) {
                                    for (const arg of eventInfo.args) {
                                        context.locals[arg.value] =
                                            event[arg.value] || (event.detail ? event.detail[arg.value] : null);
                                    }
                                }
                                if (!resolved) {
                                    resolved = true;
                                    resolve(context.meta.runtime.findNext(this, context));
                                }
                            };
                            if (eventInfo.name){
                                target.addEventListener(eventInfo.name, listener, {once: true});
                            } else if (eventInfo.time != null) {
                                setTimeout(listener, eventInfo.time, eventInfo.time)
                            }
                        }
                    });
                },
            };
            return command;
        } else {
            var time;
            if (helper.matchToken("a")) {
                helper.requireToken("tick");
                time = 0;
            } else {
                time = helper.requireElement("expression");
            }

            command = {
                type: "waitCmd",
                time: time,
                args: [time],
                op: function (context, timeValue) {
                    return new Promise((resolve) => {
                        setTimeout(() => {
                            resolve(context.meta.runtime.findNext(this, context));
                        }, timeValue);
                    });
                },
                execute: function (context) {
                    return context.meta.runtime.unifiedExec(this, context);
                },
            };
            return command;
        }
    }
}

/**
 * Helper function to parse send/trigger commands
 */
function parseSendCmd(cmdType, helper) {
    var eventName = helper.requireElement("eventName");

    var details = helper.parseElement("namedArgumentList");
    if ((cmdType === "send" && helper.matchToken("to")) ||
        (cmdType === "trigger" && helper.matchToken("on"))) {
        var toExpr = helper.requireElement("expression");
    } else {
        var toExpr = helper.requireElement("implicitMeTarget");
    }

    var sendCmd = {
        eventName: eventName,
        details: details,
        to: toExpr,
        args: [toExpr, eventName, details],
        op: function (context, to, eventName, details) {
            context.meta.runtime.nullCheck(to, toExpr);
            context.meta.runtime.implicitLoop(to, function (target) {
                context.meta.runtime.triggerEvent(target, eventName, details, context.me);
            });
            return context.meta.runtime.findNext(sendCmd, context);
        },
    };
    return sendCmd;
}

/**
 * TriggerCommand - Trigger event on target
 *
 * Parses: trigger <event> [on <target>]
 * Executes: Triggers event on target (or implicit me)
 */
export class TriggerCommand {
    /**
     * Parse trigger command
     * @param {ParserHelper} helper
     * @returns {TriggerCommand | undefined}
     */
    static parse(helper) {
        if (helper.matchToken("trigger")) {
            return parseSendCmd("trigger", helper);
        }
    }
}

/**
 * SendCommand - Send event to target
 *
 * Parses: send <event> [to <target>]
 * Executes: Sends event to target (or implicit me)
 */
export class SendCommand {
    /**
     * Parse send command
     * @param {ParserHelper} helper
     * @returns {SendCommand | undefined}
     */
    static parse(helper) {
        if (helper.matchToken("send")) {
            return parseSendCmd("send", helper);
        }
    }
}
