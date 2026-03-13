function compileTemplate(template) {
		return template.replace(/(?:^|\n)([^@]*)@?/gm, function (match, p1) {
			var templateStr = (" " + p1).replace(/([^\\])\$\{/g, "$1$${escape html ").substring(1);
			return "\ncall meta.__ht_template_result.push(`" + templateStr + "`)\n";
		});
	}

/**
 * @param {import('../dist/_hyperscript').Hyperscript} _hyperscript
 */
export default function templatePlugin(_hyperscript) {

		function renderTemplate(template, ctx) {
			var buf = [];
			const renderCtx = Object.assign({}, ctx);
			renderCtx.meta = Object.assign({ __ht_template_result: buf }, ctx.meta);
			_hyperscript.evaluate(template, renderCtx);
			return buf.join("");
		}

		_hyperscript.addCommand("render", function (parser) {
			if (!parser.matchToken("render")) return;
			var template_ = parser.requireElement("expression");
			var templateArgs = {};
			if (parser.matchToken("with")) {
				templateArgs = parser.parseElement("nakedNamedArgumentList");
			}
			return {
				args: [template_, templateArgs],
				op: function (ctx, template, templateArgs) {
					if (!(template instanceof Element)) throw new Error(template_.sourceFor() + " is not an element");
					const renderCtx = Object.assign({}, ctx);
					renderCtx.locals = Object.assign({}, ctx.locals, templateArgs);
					ctx.result = renderTemplate(compileTemplate(template.innerHTML), renderCtx);
					return ctx.meta.runtime.findNext(this, ctx);
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

		_hyperscript.addLeafExpression("escape", function (parser) {
			if (!parser.matchToken("escape")) return;
			var escapeType = parser.matchTokenType("IDENTIFIER").value;

			// hidden! for use in templates
			var unescaped = parser.matchToken("unescaped");

			var arg = parser.requireElement("expression");

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
					return ctx.meta.runtime.unifiedEval(this, ctx);
				},
			};
		});
}

// Auto-register when imported
console.log("registering against:", self._hyperscript === window._hyperscript);
console.log("COMMANDS before:", Object.keys(self._hyperscript.internals.parser.COMMANDS));

if (typeof self !== 'undefined' && self._hyperscript) {
	self._hyperscript.use(templatePlugin);
}
//console.log("template.js loaded, self._hyperscript exists:", typeof self !== 'undefined' && !!self._hyperscript);