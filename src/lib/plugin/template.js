import { matchToken, matchTokenType } from "../lexer/lexer";

function compileTemplate(template) {
	return template.replace(/(?:^|\n)([^@]*)@?/gm, function (match, p1) {
		var templateStr = (" " + p1).replace(/([^\\])\$\{/g, "$1$${escape html ").substring(1);
		return "\ncall __ht_template_result.push(`" + templateStr + "`)\n";
	});
}

/**
 * @param {HyperscriptObject} _hyperscript
 */
export default _hyperscript => {

	function renderTemplate(template, ctx) {
		var buf = [];
		_hyperscript.evaluate(template, Object.assign({ __ht_template_result: buf }, ctx));
		return buf.join("");
	}

	_hyperscript.addCommand("render", function (parser, runtime, tokens) {
		if (!matchToken(tokens, "render")) return;
		var template_ = parser.requireElement("expression", tokens);
		var templateArgs = {};
		if (matchToken(tokens, "with")) {
			templateArgs = parser.parseElement("namedArgumentList", tokens);
		}
		return {
			args: [template_, templateArgs],
			op: function (ctx, template, templateArgs) {
				if (!(template instanceof Element)) throw new Error(template_.sourceFor() + " is not an element");
				console.log(compileTemplate(template.innerHTML));
				ctx.result = renderTemplate(compileTemplate(template.innerHTML), templateArgs);
				return runtime.findNext(this, ctx);
			},
		};
	});

	function escapeHTML(html) {
		return String(html)
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/\x22/g, "&quot;")
			.replace(/\x27/g, "&#039;");
	}

	_hyperscript.addLeafExpression("escape", function (parser, runtime, tokens) {
		if (!matchToken(tokens, "escape")) return;
		var escapeType = matchTokenType(tokens, "IDENTIFIER").value;

		// hidden! for use in templates
		var unescaped = matchToken(tokens, "unescaped");

		var arg = parser.requireElement("expression", tokens);

		return {
			args: [arg],
			op: function (ctx, arg) {
				if (unescaped) return arg;
				if (arg === undefined) return "";
				switch (escapeType) {
					case "html":
						return escapeHTML(arg);
					default:
						throw new Error("Unknown escape: " + escapeType);
				}
			},
			evaluate: function (ctx) {
				return runtime.unifiedEval(this, ctx);
			},
		};
	});
}
