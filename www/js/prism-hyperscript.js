
(Prism => {
	Prism.languages.hyperscript = {
		'comment': /\-\-.*/,
		'punctuation': /[(){}[\],:]/,
		'keyword': {
			pattern: /\b(?:on|def|js|worker|eventsource|socket|init|add|async|call|get|fetch|hide|measure|if|js|log|put|remove|repeat forever|repeat for|repeat in|repeat while|repeat until event|repeat until|repeat|return|send|settle|set|show|take|throw|toggle|transition|trigger|wait for|wait|tell|go|then|while|until|for|in|from|to|with|over)\b/g,
			inside: {
				'bold': /\b(?:on|def|js|worker|eventsource|socket|init|add|async|call|get|fetch|hide|measure|if|js|log|put|remove|repeat forever|repeat for|repeat in|repeat while|repeat until event|repeat until|repeat|return|send|set|settle|show|take|throw|toggle|transition|trigger|wait for|wait|tell|go)\b/g
			}
		},
		'operator': /\+|-|\/|\*|<\b|>|<=|>=|\b(?:is|am|as|and|or|no|closest|the|of|first|last|on|is\sa|is\san)\b/,
		'builtin': /\b(?:I|me|my|it|its|result|event|target|detail)\b/,
		'function': /[-A-Za-z0-9]+(?=\()/i,
		'class-ref': {
			pattern: /\s\.[-\w\d_\$]+\b/,
			alias: 'selector'
		},
		'id-ref': {
			pattern: /\s#[-\w\d_\$]\b/,
			alias: 'selector'
		},
		'selector': /<[^\s].*\/>/,
		'boolean': /\b(?:true|false|null)\b/,
		'string': {
			pattern: /("[^\n]*[^\\]?"|'[^\n]*[^\\]?')/,
			greedy: true,
		},
		'hs-template-literal': {
			pattern: /`[^\n`]*`/,
			greedy: true,
			inside: {
				'string': /`.*\$\{|`.*`|\}*\$\{|\}.*`/
			}
		}
	}
})(Prism)
