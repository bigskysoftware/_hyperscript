import { Command, Expression } from '../base.js';
import { Tokenizer } from '../../core/tokenizer.js';

function escapeHTML(html) {
    return String(html)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\x22/g, "&quot;")
        .replace(/\x27/g, "&#039;");
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
                exprStr = trimmed.slice('unescaped '.length);
            }
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
            i = j;
        }

        return new TemplateTextCommand(parts, errors);
    }

    resolve(ctx) {
        var vals = this.parts.map(part => {
            if (part.type === 'literal') return part.value;
            return part.node.evaluate(ctx);
        });

        var stringify = (val, part) => {
            if (part.type === 'literal') return val;
            if (val === undefined || val === null) return '';
            if (part.escape) return escapeHTML(String(val));
            return String(val);
        };

        if (vals.some(v => v && v.then)) {
            return Promise.all(vals).then(resolved => {
                ctx.meta.__ht_template_result.push(
                    resolved.map((val, i) => stringify(val, this.parts[i])).join('')
                );
                return this.findNext(ctx);
            });
        }

        ctx.meta.__ht_template_result.push(
            vals.map((val, i) => stringify(val, this.parts[i])).join('')
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

        // Collect expression-level errors from template text commands
        var errors = [];
        var cmd = commandList;
        while (cmd) {
            if (cmd.errors && cmd.errors.length) errors.push(...cmd.errors);
            cmd = cmd.next;
        }
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
