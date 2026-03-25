import { Command, Expression } from '../parsetree/base.js';

let _hs; // module-level reference for renderTemplate

function compileTemplate(template) {
	return template.replace(/(?:^|\n)([^@]*)@?/gm, function (match, p1) {
		var templateStr = (" " + p1).replace(/([^\\])\$\{/g, "$1$${escape html ").substring(1);
		return "\ncall meta.__ht_template_result.push(`" + templateStr + "`)\n";
	});
}

function renderTemplate(template, ctx) {
	var buf = [];
	const renderCtx = Object.assign({}, ctx);
	renderCtx.meta = Object.assign({ __ht_template_result: buf }, ctx.meta);
	_hs.evaluate(template, renderCtx);
	return buf.join("");
}

function escapeHTML(html) {
	return String(html)
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/\x22/g, "&quot;")
		.replace(/\x27/g, "&#039;");
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
		const renderCtx = Object.assign({}, ctx);
		renderCtx.locals = Object.assign({}, ctx.locals, templateArgs);
		ctx.result = renderTemplate(compileTemplate(template.innerHTML), renderCtx);
		return ctx.meta.runtime.findNext(this, ctx);
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
	_hs = _hyperscript;
	_hyperscript.addCommand(RenderCommand.keyword, RenderCommand.parse.bind(RenderCommand));
	_hyperscript.addLeafExpression(EscapeExpression.grammarName, EscapeExpression.parse.bind(EscapeExpression));
}

// Auto-register when imported
if (typeof self !== 'undefined' && self._hyperscript) {
	self._hyperscript.use(templatePlugin);
}
