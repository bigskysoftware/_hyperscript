
(prismHyperscript => {
	if (typeof module === 'object' 
		&& module.exports) module.exports = prismHyperscript;
	else if ('Prism' in this) prismHyperscript(Prism)	
})(Prism => {

	Prism.languages.hyperscript = {};
	Object.assign(Prism.languages.hyperscript, {
		'comment': /\-\-.*/,
		'punctuation': /[(){}[\],:;\?&]/,
		'url': {
			pattern: /(fetch\s)[^`"'\s][^\s]*/, // `
			lookbehind: true,
			greedy: true,
		},
		'attribute': {
			pattern: /@[a-zA-Z\-\_]+/,
		},
		'attribute-ref': {
			pattern: /\[@[a-zA-Z\-\_]="[^\n"]*"|'[^\n']*'\]/,    //"
			alias: 'selector',
		},
		'class-ref': {
			pattern: /\s\.[\-\w\d_\$]+/,
			alias: 'selector',
			greedy: true
		},
		'id-ref': {
			pattern: /#[\-\w\d_\$]+/,
			alias: 'selector',
			greedy: true
		},
		'selector': {
			pattern: /<[^\s].*\/>/,
			greedy: true,
		},
		'keyword': {
			pattern: /\b(?:on|def|js|worker|eventsource|socket|init|behavior|install|catch|add|async|call|get|hide|measure|if|else|js|log|put|remove|repeat\sforever|repeat\sfor|repeat\sin|repeat\swhile|repeat\suntil\sevent|repeat until|repeat|return|send|settle|set|show|take|throw|toggle\sbetween|toggle|transition|trigger|wait for|wait|fetch|tell|go|make an|make a|make|then|end|while|until|for|in|from|to|with|over|into|before|after|at end of|at start of|is an|is a|is not|is|am|as|and|or|no|closest|the|of|first|last|random|local|element|global|on|seconds|milliseconds|(\s)s|(\s)ms)\b/g,
			lookbehind: true,
			inside: {
				'hs-start': {
					pattern: /\b(?:on|def|js|worker|eventsource|socket|init|behavior|install|catch|add|async|call|get|hide|measure|if|else|js|log|put|remove|repeat\sforever|repeat\sfor|repeat\sin|repeat\swhile|repeat\suntil\sevent|repeat\suntil|repeat|return|send|set|settle|show|take|throw|toggle\sbetween|toggle|transition|trigger|wait for|wait|fetch|tell|go|make|end|for)\b/g,
					alias: 'bold',
				}
			}
		},
		'operator': {
			pattern: /\+|\s-\s|\/|\*|\\|->|<\s|>|<=|>===|==|=|!==|!=|=|\.\.|([^\d\s]|^)\.|\%|\||!|\$|'s/, // '
			lookbehind: true,
		},
		'builtin': /\b(?:I|me|my|it|its|result|event|target|detail|body|you|your|yourself|String|Number|Int|Float|Date|Array|HTML|Fragment|JSON|Object|Values)\b/,
		'function': /[A-Za-z0-9]+(?=\()/,
		'boolean': /\b(?:true|false|null)\b/,
		'string': {
			pattern: /"[^\n"]*"|'[^\n']*'/, // "
			greedy: true,
		},
		'number': {
			pattern: /(\d+\.?|\d*\.\d+)(s|ms)?/,
			greedy: true,
		},
		'template-string': {
			pattern: /`[^\n`]*`/, // ` //
			greedy: true,
			inside: {
				'template-punctuation': {
					pattern: /^`|`$/,
					alias: 'string'
				},
				'interpolation': {
					pattern: /((?:^|[^\\])(?:\\{2})*)\${(?:[^{}]|{(?:[^{}]|{[^}]*})*})+}/,
					lookbehind: true,
					inside: {
						'interpolation-punctuation': {
							pattern: /^\${|}$/,
							alias: 'punctuation'
						},
						rest: Prism.languages.hyperscript
					},
				},
				'string': /[\s\S]+/,
			}
		}
	})

	if (Prism.languages.markup) {
		Prism.languages.insertBefore('markup', 'cdata', {
			'script-type-text-hyperscript': {
				pattern: /(<script\s+type="text\/hyperscript"[^>]*>)[^<]*(?=<\/script>)/i,
				lookbehind: true,
				greedy: true,
				inside: {
					'language-hyperscript': {
						pattern: /[\s\S]+/,
						inside: Prism.languages.hyperscript
					}
				}
			}
		})
		Prism.languages.markup.tag.addAttribute('_', 'hyperscript')
	}
})
