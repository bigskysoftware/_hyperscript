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
            try {
                var exprTokens = new Tokenizer().tokenize(exprStr);
                var exprParser = parser.createChildParser(exprTokens);
                if (exprParser.matchToken("unescaped")) escape = false;
                var valueNode = exprParser.requireElement("expression");
                if (exprParser.matchToken("if")) {
                    var conditionNode = exprParser.requireElement("expression");
                    var elseNode = exprParser.matchToken("else") ? exprParser.requireElement("expression") : null;
                    parts.push({ type: 'conditional', valueNode, conditionNode, elseNode, escape });
                } else {
                    parts.push({ type: 'expr', node: valueNode, escape });
                }
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

    constructor(template_, templateArgs, insertHere, target) {
        super();
        this.template_ = template_;
        this.insertHere = insertHere;
        this.args = { template: template_, templateArgs, target };
    }

    static parse(parser) {
        if (!parser.matchToken("render")) return;
        var template_ = parser.requireElement("expression");
        var templateArgs = {};
        if (parser.matchToken("with")) {
            templateArgs = parser.parseElement("nakedNamedArgumentList");
        }
        var insertHere = !!parser.matchToken("here");
        var target = null;
        if (!insertHere && parser.matchToken("into")) {
            target = parser.requireElement("expression");
        }
        var cmd = new RenderCommand(template_, templateArgs, insertHere, target);
        cmd._parser = parser;
        return cmd;
    }

    resolve(ctx, { template, templateArgs, target }) {
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
            console.error("hyperscript template parse error:", e.parseError?.message || e.message || e);
            ctx.result = "";
            return runtime.findNext(this, ctx);
        }

        // Collect errors from the parsed template tree
        var errors = commandList.collectErrors();
        if (errors.length) {
            for (var err of errors) {
                console.error("hyperscript template error (line " + err.line + "): " + err.message +
                    (err.expr ? " in ${" + err.expr + "}" : ""));
            }
        }

        var resolve, reject;
        var promise = new Promise(function(res, rej) { resolve = res; reject = rej; });

        commandList.execute(renderCtx);

        var finish = (result) => {
            ctx.result = result;
            if (this.insertHere) ctx.me.innerHTML = result;
            if (target) target.innerHTML = result;
            return runtime.findNext(this, ctx);
        };

        if (renderCtx.meta.returned) {
            return finish(buf.join(""));
        }

        renderCtx.meta.resolve = resolve;
        renderCtx.meta.reject = reject;
        return promise.then(() => finish(buf.join("")));
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

