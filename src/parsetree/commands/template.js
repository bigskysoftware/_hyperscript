import { Command, Expression } from '../base.js';
import { Tokenizer } from '../../core/tokenizer.js';

function _stringifyTemplatePart(val, part) {
    if (part.type === 'literal') return val;
    if (val === undefined || val === null) return '';
    if (part.escape) return escapeHTML(String(val));
    return String(val);
}

function escapeHTML(html) {
    return String(html)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

/**
 * splitConditionalExpr - Find top-level 'if'/'else' keywords in an expression string
 *
 * Uses token-based scanning to correctly skip 'if'/'else' that appear inside
 * nested parens, brackets, or braces
 * Returns { valueStr, conditionStr, elseStr } or null if no top-level 'if' found.
 */
function splitConditionalExpr(exprStr) {
    var tokens = new Tokenizer().tokenize(exprStr);
    var depth = 0;
    var ifStart = -1, ifEnd = -1;
    var elseStart = -1, elseEnd = -1;

    while (tokens.hasMore()) {
        var tok = tokens.consumeToken();
        var v = tok.value;
        if (v === '(' || v === '[' || v === '{') depth++;
        else if (v === ')' || v === ']' || v === '}') depth--;
        else if (depth === 0 && tok.type === 'IDENTIFIER') {
            if (v === 'if' && ifStart === -1) { ifStart = tok.start; ifEnd = tok.end; }
            else if (v === 'else' && ifStart !== -1) { elseStart = tok.start; elseEnd = tok.end; break; }
        }
    }

    if (ifStart === -1) return null;

    var valueStr = exprStr.slice(0, ifStart).trim();
    var conditionStr = elseStart !== -1
        ? exprStr.slice(ifEnd, elseStart).trim()
        : exprStr.slice(ifEnd).trim();
    var elseStr = elseStart !== -1 ? exprStr.slice(elseEnd).trim() : null;

    if (!valueStr || !conditionStr) return null;

    return { valueStr, conditionStr, elseStr };
}

/**
 * collectTemplateErrors - Recursively walk a command list and gather parse errors
 */
function collectTemplateErrors(cmd, errors) {
    while (cmd) {
        if (cmd.errors && cmd.errors.length) errors.push(...cmd.errors);
        if (cmd.trueBranch) collectTemplateErrors(cmd.trueBranch, errors);
        if (cmd.falseBranch) collectTemplateErrors(cmd.falseBranch, errors);
        if (cmd.loop) collectTemplateErrors(cmd.loop, errors);
        if (cmd.repeatLoopCommand) collectTemplateErrors(cmd.repeatLoopCommand, errors);
        if (cmd.elseBranch) collectTemplateErrors(cmd.elseBranch, errors);
        cmd = cmd.next;
    }
}

/**
 * TemplateTextCommand - Handles template text lines with ${} interpolation
 *
 * Registered for the TEMPLATE_LINE token type. Parses ${expr} expressions
 * out of template content, with HTML escaping by default.
 * Use ${unescaped expr} to opt out of escaping.
 */
export class TemplateTextCommand extends Command {
    static keyword = "TEMPLATE_LINE";

    constructor(parts, errors) {
        super();
        this.parts = parts;
        this.errors = errors;
    }

    static parse(parser) {
        var tok = parser.currentToken();
        if (tok.type !== "TEMPLATE_LINE") return;
        parser.consumeToken();

        var parts = [];
        var errors = [];
        var raw = tok.content;
        var i = 0;

        while (i < raw.length) {
            var nextDollar = raw.indexOf('${', i);
            if (nextDollar === -1) {
                if (i < raw.length) parts.push({ type: 'literal', value: raw.slice(i) });
                break;
            }
            if (nextDollar > i) {
                parts.push({ type: 'literal', value: raw.slice(i, nextDollar) });
            }
            var depth = 1;
            var j = nextDollar + 2;
            while (j < raw.length && depth > 0) {
                if (raw[j] === '{') depth++;
                else if (raw[j] === '}') depth--;
                j++;
            }
            if (depth > 0) {
                errors.push({ line: tok.line, message: "Unterminated ${} expression", expr: raw.slice(nextDollar) });
                parts.push({ type: 'literal', value: '' });
                break;
            }
            var exprStr = raw.slice(nextDollar + 2, j - 1);
            var escape = true;
            var trimmed = exprStr.trimStart();
            if (trimmed.startsWith('unescaped ')) {
                escape = false;
                exprStr = trimmed.slice('unescaped '.length).trim();
            }

            // Parse conditional syntax: ${value if condition} or ${value if condition else elseValue}
            // Use token-based splitting to correctly handle expressions containing 'if' as part of an identifier
            var conditionalSplit = splitConditionalExpr(exprStr);
            if (conditionalSplit) {
                try {
                    var valueTokens = new Tokenizer().tokenize(conditionalSplit.valueStr);
                    var valueParser = parser.createChildParser(valueTokens);
                    var valueNode = valueParser.requireElement("expression");

                    var conditionTokens = new Tokenizer().tokenize(conditionalSplit.conditionStr);
                    var conditionParser = parser.createChildParser(conditionTokens);
                    var conditionNode = conditionParser.requireElement("expression");

                    var elseNode = null;
                    if (conditionalSplit.elseStr) {
                        var elseTokens = new Tokenizer().tokenize(conditionalSplit.elseStr);
                        var elseParser = parser.createChildParser(elseTokens);
                        elseNode = elseParser.requireElement("expression");
                    }

                    parts.push({
                        type: 'conditional',
                        valueNode,
                        conditionNode,
                        elseNode,
                        escape
                    });
                } catch (e) {
                    errors.push({
                        line: tok.line,
                        column: tok.column + nextDollar,
                        message: e.message || String(e),
                        expr: exprStr
                    });
                    parts.push({ type: 'literal', value: '' });
                }
            } else {
                try {
                    var exprTokens = new Tokenizer().tokenize(exprStr);
                    var exprParser = parser.createChildParser(exprTokens);
                    var node = exprParser.requireElement("expression");
                    parts.push({ type: 'expr', node, escape });
                } catch (e) {
                    errors.push({
                        line: tok.line,
                        column: tok.column + nextDollar,
                        message: e.message || String(e),
                        expr: exprStr
                    });
                    parts.push({ type: 'literal', value: '' });
                }
            }
            i = j;
        }

        return new TemplateTextCommand(parts, errors);
    }

    resolve(ctx) {
        var parts = this.parts;
        var vals = parts.map(part => {
            if (part.type === 'literal') return part.value;
            if (part.type === 'conditional') {
                var condition = part.conditionNode.evaluate(ctx);
                if (condition) {
                    return part.valueNode.evaluate(ctx);
                } else if (part.elseNode) {
                    return part.elseNode.evaluate(ctx);
                } else {
                    return undefined;
                }
            }
            return part.node.evaluate(ctx);
        });

        if (vals.some(v => v && v.then)) {
            return Promise.all(vals).then(resolved => {
                ctx.meta.__ht_template_result.push(
                    resolved.map((val, i) => _stringifyTemplatePart(val, parts[i])).join('')
                );
                return this.findNext(ctx);
            });
        }

        ctx.meta.__ht_template_result.push(
            vals.map((val, i) => _stringifyTemplatePart(val, parts[i])).join('')
        );
        return this.findNext(ctx);
    }
}

/**
 * RenderCommand - Render a template element
 *
 * Parses: render <expr> [with <namedArgs>]
 * Executes: Tokenizes template innerHTML in "lines" mode, parses and executes
 * the command list, collects output into result.
 */
export class RenderCommand extends Command {
    static keyword = "render";

    constructor(template_, templateArgs) {
        super();
        this.template_ = template_;
        this.args = { template: template_, templateArgs };
    }

    static parse(parser) {
        if (!parser.matchToken("render")) return;
        var template_ = parser.requireElement("expression");
        var templateArgs = {};
        if (parser.matchToken("with")) {
            templateArgs = parser.parseElement("nakedNamedArgumentList");
        }
        var cmd = new RenderCommand(template_, templateArgs);
        cmd._parser = parser;
        return cmd;
    }

    resolve(ctx, { template, templateArgs }) {
        if (!(template instanceof Element)) throw new Error(this.template_.sourceFor() + " is not an element");

        var buf = [];
        var runtime = ctx.meta.runtime;
        var renderCtx = runtime.makeContext(ctx.me, null, ctx.me, null);
        renderCtx.locals = Object.assign({}, ctx.locals, templateArgs);
        renderCtx.meta.__ht_template_result = buf;

        var tokens = new Tokenizer().tokenize(template.innerHTML, "lines");
        var parser = this._parser.createChildParser(tokens);
        var commandList;
        try {
            commandList = parser.parseElement("commandList");
            parser.ensureTerminated(commandList);
        } catch (e) {
            console.error("hyperscript template parse error:", e.message || e);
            ctx.result = "";
            return runtime.findNext(this, ctx);
        }

        // Collect expression-level errors from template text commands (recursive)
        var errors = [];
        collectTemplateErrors(commandList, errors);
        if (errors.length) {
            for (var err of errors) {
                console.error("hyperscript template error (line " + err.line + "): " + err.message +
                    (err.expr ? " in ${" + err.expr + "}" : ""));
            }
        }

        var resolve, reject;
        var promise = new Promise(function(res, rej) { resolve = res; reject = rej; });

        commandList.execute(renderCtx);

        if (renderCtx.meta.returned) {
            ctx.result = buf.join("");
            return runtime.findNext(this, ctx);
        }

        renderCtx.meta.resolve = resolve;
        renderCtx.meta.reject = reject;
        return promise.then(() => {
            ctx.result = buf.join("");
            return runtime.findNext(this, ctx);
        });
    }
}

/**
 * EscapeExpression - Explicit HTML escaping expression
 *
 * Parses: escape html <expr>
 * Returns: HTML-escaped string
 */
export class EscapeExpression extends Expression {
    static grammarName = "escape";
    static expressionType = "leaf";

    constructor(arg, unescaped, escapeType) {
        super();
        this.unescaped = unescaped;
        this.escapeType = escapeType;
        this.args = { value: arg };
    }

    static parse(parser) {
        if (!parser.matchToken("escape")) return;
        var escapeType = parser.matchTokenType("IDENTIFIER").value;
        var unescaped = parser.matchToken("unescaped");
        var arg = parser.requireElement("expression");
        return new EscapeExpression(arg, unescaped, escapeType);
    }

    resolve(ctx, { value }) {
        if (this.unescaped) return value;
        if (value === undefined) return "";
        switch (this.escapeType) {
            case "html":
                return escapeHTML(value);
            default:
                throw new Error("Unknown escape: " + this.escapeType);
        }
    }
}

