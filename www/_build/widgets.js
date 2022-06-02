
module.exports = function (config) {
    config.addPairedShortcode('example', (content, caption) => {
        let rv = "<figure class='box info'>\n\n"
        if (caption) rv += `<figcaption>Example: ${caption}</figcaption>\n\n`
        else rv += `<figcaption>Example</figcaption>\n\n`
        rv += "  ~~~ html"
        rv += content
        rv += "~~~\n\n"
        rv += content
        rv += "</figure>"
        return rv
    })

    function syntax(syntax) {
        syntax = syntax
        .replace(/\[\[([\*\+\?])\]\]/g,
          "<sup>$1</sup>"
        )
        .replace(/\[\[([a-zA-Z0-9]+)\]\]/g,
            '<b class="syntaxvar"><var>$1</var></b>'
        )

        return `<code class="syntax">${syntax}</code>`
    }

    config.addShortcode("syntax", syntax)

    function syntaxify(line) {
    	return line
    		.replace(/`([^`]+)`/g, (match, p1) => syntax(p1))
    }

    config.addPairedShortcode("syntaxes", content => {
    	const buf = []
    	const lines = content.split('\n');
    	let dt = false;
    	for (const line of lines) {
	    	if (isJustWhitespace(line)) {
	    		buf.push(line);
	    	} else if (!indented(line)) {
	    		dt = true;
    			buf.push('\n<dt>' + syntaxify(line));
    		} else {
    			if (dt) buf.push('<dd>\n');
    			dt = false;
    			buf.push(dedent(line));
    		}
    	}
    	return `<div class="missing-card"><dl class="syntaxes">${buf.join('\n')}</dl></div>`;
    })
}

function isJustWhitespace(str) { return /^\s*$/.test(str) }
function dedent(str) { return str.replace(/^(\t|    )/, '') }
function indented(str) { return str.startsWith('    ') || str.startsWith('\t') }
