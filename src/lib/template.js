
'use strict';

(function (_hyperscript) {
	function compileTemplate(template) {
		return template.replace(
			/(?:^|\n)([^@]*)@?/gm,
			'\ncall __ht_template_result.push(`$1`)\n')
	}

	function renderTemplate(template, ctx) {
		var buf = []
		_hyperscript(template, 
			Object.assign({ __ht_template_result: buf }, ctx))
		return buf.join('')
	}

	_hyperscript.addCommand('render', function (parser, runtime, tokens) {
		if (!tokens.matchToken('render')) return
		var template = parser.requireElement('targetExpression', tokens)
		var templateArgs = {}
		if (tokens.matchToken('with')) {
			templateArgs = parser.parseElement('namedArgumentList', tokens)
		}
		return {
			args: [template, templateArgs],
			op: function (ctx, template, templateArgs) {
				ctx.result = renderTemplate(compileTemplate(template.innerHTML), templateArgs)
				return runtime.findNext(this, ctx)
			}
		}
	})
})(_hyperscript)
