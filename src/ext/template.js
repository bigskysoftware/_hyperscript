import { Command, Expression } from '../parsetree/base.js';
import _hyperscript from "../_hyperscript.js";

function escapeHTML(html) {
	return String(html)
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/\x22/g, "&quot;")
		.replace(/\x27/g, "&#039;");
}

class TemplateTextCommand extends Command {
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
				var exprTokens = _hyperscript.internals.tokenizer.tokenize(exprStr);
				var exprParser = _hyperscript.internals.createParser(exprTokens);
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
                return ctx.meta.runtime.findNext(this, ctx);
            });
        }

        ctx.meta.__ht_template_result.push(
            vals.map((val, i) => stringify(val, this.parts[i])).join('')
        );
        return ctx.meta.runtime.findNext(this, ctx);
	}
}

class RenderCommand extends Command {
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
		return new RenderCommand(template_, templateArgs);
	}

	resolve(ctx, { template, templateArgs }) {
		if (!(template instanceof Element)) throw new Error(this.template_.sourceFor() + " is not an element");

		var buf = [];
		const renderCtx = ctx.meta.runtime.makeContext(ctx.me, null, ctx.me, null);
		renderCtx.locals = Object.assign({}, ctx.locals, templateArgs);
		renderCtx.meta.__ht_template_result = buf;

		var tokens = _hyperscript.internals.tokenizer.tokenize(template.innerHTML, "lines");
		var parser = _hyperscript.internals.createParser(tokens);
		var commandList;
		try {
			commandList = parser.parseElement("commandList");
			parser.ensureTerminated(commandList);
		} catch (e) {
			console.error("hyperscript template parse error:", e.message || e);
			ctx.result = "";
			return ctx.meta.runtime.findNext(this, ctx);
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
			return ctx.meta.runtime.findNext(this, ctx);
		}

		renderCtx.meta.resolve = resolve;
		renderCtx.meta.reject = reject;
		return promise.then(() => {
			ctx.result = buf.join("");
			return ctx.meta.runtime.findNext(this, ctx);
		});
	}
}

class EscapeExpression extends Expression {
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

		// hidden! for use in templates
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

/**
 * @param {import('../dist/_hyperscript').Hyperscript} _hyperscript
 */
export default function templatePlugin(_hyperscript) {
	_hyperscript.addCommand(RenderCommand.keyword, RenderCommand.parse.bind(RenderCommand));
	_hyperscript.addLeafExpression(EscapeExpression.grammarName, EscapeExpression.parse.bind(EscapeExpression));
	_hyperscript.addCommand("TEMPLATE_LINE", TemplateTextCommand.parse.bind(TemplateTextCommand));
}

// Auto-register when imported
if (typeof self !== 'undefined' && self._hyperscript) {
	self._hyperscript.use(templatePlugin);
}
