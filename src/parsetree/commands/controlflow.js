/**
 * Control flow command parse tree elements
 * Commands for control flow (if, repeat, for, continue, break, tell)
 */

import { Command } from '../base.js';

/**
 * WaitATick - Wait for next event loop tick
 * Used in event-based loops to allow events to trigger
 */
class WaitATick extends Command {
    constructor() {
        super();
        this.type = "waitATick";
    }

    resolve(context) {
        return new Promise((resolve) => {
            setTimeout(() => resolve(context.meta.runtime.findNext(this)), 0);
        });
    }
}

/**
 * RepeatLoopCommand - The actual loop iteration logic
 */
class RepeatLoopCommand extends Command {
    constructor(config, loop, elseBranch) {
        super();
        this.identifier = config.identifier;
        this.indexIdentifier = config.indexIdentifier;
        this.slot = config.slot;
        this.expression = config.expression;
        this.forever = config.forever;
        this.times = config.times;
        this.until = config.until;
        this.event = config.event;
        this.on = config.on;
        this.whileExpr = config.whileExpr;
        this.bottomTested = config.bottomTested;
        this.loop = loop;
        this.elseBranch = elseBranch;
        this.args = { whileValue: config.whileExpr, times: config.times };
    }

    resolveNext() {
        return this;
    }

    resolve(context, { whileValue, times }) {
        var iteratorInfo = context.meta.iterators[this.slot];
        var keepLooping = false;
        var loopVal = null;

        if (this.bottomTested && iteratorInfo.index === 0) {
            keepLooping = true;
        } else if (this.forever) {
            keepLooping = true;
        } else if (this.until) {
            if (this.event) {
                keepLooping = context.meta.iterators[this.slot].eventFired === false;
            } else {
                keepLooping = whileValue !== true;
            }
        } else if (this.whileExpr) {
            keepLooping = whileValue;
        } else if (times) {
            keepLooping = iteratorInfo.index < times;
        } else if (iteratorInfo.iterator) {
            var nextValFromIterator = iteratorInfo.iterator.next();
            keepLooping = !nextValFromIterator.done;
            loopVal = nextValFromIterator.value;
        }

        if (keepLooping) {
            var currentIndex = iteratorInfo.index;
            if (iteratorInfo.value) {
                context.result = context.locals[this.identifier] = loopVal;
            } else {
                context.result = currentIndex;
            }
            if (this.indexIdentifier) {
                context.locals[this.indexIdentifier] = currentIndex;
            }

            // In template mode, emit a scope marker so processNode can
            // resolve loop variables on elements with _= attributes
            if (context.meta.__ht_template_result && iteratorInfo.value) {
                var scopes = context.meta.__ht_scopes || (context.meta.__ht_scopes = {});
                if (!scopes[this.slot]) {
                    scopes[this.slot] = {
                        identifier: this.identifier,
                        indexIdentifier: this.indexIdentifier,
                        source: iteratorInfo.value
                    };
                }
                context.meta.__ht_template_result.push(
                    '<!--hs-scope:' + this.slot + ':' + currentIndex + '-->'
                );
            }

            iteratorInfo.didIterate = true;
            iteratorInfo.index++;
            return this.loop;
        } else {
            var didIterate = iteratorInfo.didIterate;
            context.meta.iterators[this.slot] = null;
            if (!didIterate && this.elseBranch) {
                return this.elseBranch;
            }
            return context.meta.runtime.findNext(this.parent, context);
        }
    }
}

// (RepeatCommand defined below after parseRepeatExpression)

/**
 * IfCommand - Conditional execution
 *
 * Parses: if <expr> [then] <commands> [else|otherwise <commands>] [end]
 * Executes: Conditionally executes true or false branch based on expression
 */
export class IfCommand extends Command {
    static keyword = "if";

    constructor(expr, trueBranch, falseBranch) {
        super();
        this.expr = expr;
        this.trueBranch = trueBranch;
        this.falseBranch = falseBranch;
        this.args = { value: expr };
    }

    static parse(parser) {
        if (!parser.matchToken("if")) return;
        var expr = parser.requireElement("expression");
        parser.matchToken("then"); // optional 'then'
        var trueBranch = parser.parseElement("commandList");
        var nestedIfStmt = false;
        let elseToken = parser.matchToken("else") || parser.matchToken("otherwise");
        if (elseToken) {
            let elseIfIfToken = parser.peekToken("if");
            nestedIfStmt = elseIfIfToken != null && elseIfIfToken.line === elseToken.line;
            if (nestedIfStmt) {
                var falseBranch = parser.parseElement("command");
            } else {
                var falseBranch = parser.parseElement("commandList");
            }
        }
        if (parser.hasMore() && !nestedIfStmt) {
            parser.requireToken("end");
        }

        var ifCmd = new IfCommand(expr, trueBranch, falseBranch);
        parser.setParent(trueBranch, ifCmd);
        parser.setParent(falseBranch, ifCmd);
        return ifCmd;
    }

    resolve(context, { value: exprValue }) {
        if (exprValue) {
            return this.trueBranch;
        } else if (this.falseBranch) {
            return this.falseBranch;
        } else {
            return this.findNext(context);
        }
    }
}

// (parseRepeatExpression is now a static method on RepeatCommand)

/**
 * RepeatCommand - Loop with various forms
 *
 * Parses: repeat [for x in expr] | [in expr] | [while expr] | [until expr|event] | [n times] | [forever]
 * Executes: Initializes loop iterator then hands off to RepeatLoopCommand
 */
export class RepeatCommand extends Command {
    static keyword = ["repeat", "for"];

    constructor(expression, evt, on, slot, repeatLoopCommand) {
        super();
        this.expression = expression;
        this.evt = evt;
        this.on = on;
        this.slot = slot;
        this.repeatLoopCommand = repeatLoopCommand;
        this.args = { value: expression, event: evt, on };
    }

    static parseRepeatExpression(parser, startedWithForToken) {
        var innerStartToken = parser.currentToken();
        var identifier;
        if (parser.matchToken("for") || startedWithForToken) {
            var identifierToken = parser.requireTokenType("IDENTIFIER");
            identifier = identifierToken.value;
            parser.requireToken("in");
            var expression = parser.requireElement("expression");
            // Tag any `where` clause so the loop variable resolves inside it
            var walk = expression;
            while (walk) {
                if (walk.condition) walk.varName = identifier;
                walk = walk.root;
            }
        } else if (parser.matchToken("in")) {
            identifier = "it";
            var expression = parser.requireElement("expression");
        } else if (parser.matchToken("while")) {
            var whileExpr = parser.requireElement("expression");
        } else if (parser.matchToken("until")) {
            var isUntil = true;
            if (parser.matchToken("event")) {
                var evt = parser.requireElement("dotOrColonPath", "Expected event name");
                if (parser.matchToken("from")) {
                    var on = parser.requireElement("expression");
                }
            } else {
                var whileExpr = parser.requireElement("expression");
            }
        } else {
            if (!parser.commandBoundary(parser.currentToken()) &&
                parser.currentToken().value !== 'forever') {
                var times = parser.requireElement("expression");
                parser.requireToken("times");
            } else {
                parser.matchToken("forever"); // consume optional forever
                var forever = true;
            }
        }

        if (parser.matchToken("index")) {
            var identifierToken = parser.requireTokenType("IDENTIFIER");
            var indexIdentifier = identifierToken.value;
        } else if (parser.matchToken("indexed")) {
            parser.requireToken("by");
            var identifierToken = parser.requireTokenType("IDENTIFIER");
            var indexIdentifier = identifierToken.value;
        }

        var loop = parser.parseElement("commandList");
        if (loop && evt) {
            var last = loop;
            while (last.next) {
                last = last.next;
            }
            var waitATick = new WaitATick();
            last.next = waitATick;
        }

        // Bottom-tested loop: bare "repeat" body "until"/"while" condition "end"
        var bottomTested = false;
        if (forever && parser.hasMore()) {
            if (parser.matchToken("until")) {
                forever = false;
                isUntil = true;
                bottomTested = true;
                whileExpr = parser.requireElement("expression");
            } else if (parser.matchToken("while")) {
                forever = false;
                bottomTested = true;
                whileExpr = parser.requireElement("expression");
            }
        }

        var elseBranch = null;
        if (parser.matchToken("else")) {
            elseBranch = parser.parseElement("commandList");
        }

        if (parser.hasMore()) {
            parser.requireToken("end");
        }

        if (identifier == null) {
            identifier = "_implicit_repeat_" + innerStartToken.start;
            var slot = identifier;
        } else {
            var slot = identifier + "_" + innerStartToken.start;
        }

        const loopConfig = {
            identifier: identifier,
            indexIdentifier: indexIdentifier,
            slot: slot,
            expression: expression,
            forever: forever,
            times: times,
            until: isUntil,
            event: evt,
            on: on,
            whileExpr: whileExpr,
            bottomTested: bottomTested
        };

        const repeatLoopCommand = new RepeatLoopCommand(loopConfig, loop, elseBranch);
        const repeatCommand = new RepeatCommand(expression, evt, on, slot, repeatLoopCommand);

        parser.setParent(loop, repeatLoopCommand);
        if (elseBranch) {
            parser.setParent(elseBranch, repeatCommand);
        }
        parser.setParent(repeatLoopCommand, repeatCommand);

        return repeatCommand;
    }

    static parse(parser) {
        if (parser.matchToken("for")) {
            return RepeatCommand.parseRepeatExpression(parser, true);
        }
        if (parser.matchToken("repeat")) {
            return RepeatCommand.parseRepeatExpression(parser, false);
        }
    }

    resolve(context, { value, event, on }) {
        var iteratorInfo = {
            index: 0,
            value: value,
            eventFired: false,
        };
        context.meta.iterators[this.slot] = iteratorInfo;

        if (value) {
            if (value[Symbol.iterator]) {
                iteratorInfo.iterator = value[Symbol.iterator]();
            } else {
                iteratorInfo.iterator = Object.keys(value)[Symbol.iterator]();
            }
        } else if (this.repeatLoopCommand.elseBranch) {
            // Null/undefined collection with an else clause - use empty iterator so else triggers
            iteratorInfo.iterator = [][Symbol.iterator]();
        }

        if (this.evt) {
            var target = on || context.me;
            const slot = this.slot;
            target.addEventListener(
                event,
                function (e) {
                    context.meta.iterators[slot].eventFired = true;
                },
                { once: true }
            );
        }

        return this.repeatLoopCommand;
    }
}

/**
 * ContinueCommand - Continue loop
 *
 * Parses: continue
 * Executes: Continues to next iteration of closest repeat loop
 */
export class ContinueCommand extends Command {
    static keyword = "continue";

    static parse(parser) {
        if (!parser.matchToken("continue")) return;
        return new ContinueCommand();
    }

    resolve(context) {
        for (var parent = this.parent; parent; parent = parent.parent) {
            if (parent.loop != undefined) {
                return parent.resolveNext(context);
            }
        }
        throw new Error("Command `continue` cannot be used outside of a `repeat` loop.");
    }
}

/**
 * BreakCommand - Break loop
 *
 * Parses: break
 * Executes: Exits closest repeat loop
 */
export class BreakCommand extends Command {
    static keyword = "break";

    static parse(parser) {
        if (!parser.matchToken("break")) return;
        return new BreakCommand();
    }

    resolve(context) {
        for (var parent = this.parent; parent; parent = parent.parent) {
            if (parent.loop != undefined) {
                return context.meta.runtime.findNext(parent.parent, context);
            }
        }
        throw new Error("Command `break` cannot be used outside of a `repeat` loop.");
    }
}

/**
 * TellCommand - Send command to other element
 *
 * Parses: tell <expr> <commands> end
 * Executes: Executes commands with 'you' set to target element(s)
 */
export class TellCommand extends Command {
    static keyword = "tell";

    constructor(value, body, slot) {
        super();
        this.value = value;
        this.body = body;
        this.slot = slot;
        this.args = { value };
    }

    static parse(parser) {
        var startToken = parser.currentToken();
        if (!parser.matchToken("tell")) return;
        var value = parser.requireElement("expression");
        var body = parser.requireElement("commandList");
        if (parser.hasMore() && !parser.featureStart(parser.currentToken())) {
            parser.requireToken("end");
        }
        var slot = "tell_" + startToken.start;
        var tellCmd = new TellCommand(value, body, slot);
        parser.setParent(body, tellCmd);
        return tellCmd;
    }

    resolveNext(context) {
        var iterator = context.meta.iterators[this.slot];
        if (iterator.index < iterator.value.length) {
            context.you = iterator.value[iterator.index++];
            return this.body;
        } else {
            // restore original me
            context.you = iterator.originalYou;
            if (this.next) {
                return this.next;
            } else {
                return context.meta.runtime.findNext(this.parent, context);
            }
        }
    }

    resolve(context, { value }) {
        if (value == null) {
            value = [];
        } else if (!(Array.isArray(value) || value instanceof NodeList)) {
            value = [value];
        }
        context.meta.iterators[this.slot] = {
            originalYou: context.you,
            index: 0,
            value: value,
        };
        return this.resolveNext(context);
    }
}
