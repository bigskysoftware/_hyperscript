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

		_hyperscript.addCommand("render", function (helper) {
			if (!helper.matchToken("render")) return;
			var template_ = helper.requireElement("expression");
			var templateArgs = {};
			if (helper.matchToken("with")) {
				templateArgs = helper.parseElement("nakedNamedArgumentList");
			}
			return {
				args: [template_, templateArgs],
				op: function (ctx, template, templateArgs) {
					if (!(template instanceof Element)) throw new Error(template_.sourceFor() + " is not an element");
					const context = _hyperscript.internals.runtime.makeContext()
					context.locals = templateArgs;
					ctx.result = renderTemplate(compileTemplate(template.innerHTML), context);
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

		_hyperscript.addLeafExpression("escape", function (helper) {
			if (!helper.matchToken("escape")) return;
			var escapeType = helper.matchTokenType("IDENTIFIER").value;

			// hidden! for use in templates
			var unescaped = helper.matchToken("unescaped");

			var arg = helper.requireElement("expression");

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
if (typeof self !== 'undefined' && self._hyperscript) {
	self._hyperscript.use(templatePlugin);
}