
module.exports = function (config) {
    config.addPairedShortcode('example', (content, caption) => {
        let rv = "<figure class='example'>\n\n"
        if (caption) rv += `<figcaption>Example: ${caption}</figcaption>\n\n`
        else rv += `<figcaption>Example</figcaption>\n\n`
        rv += "```html"
        rv += content
        rv += "```\n\n"
        rv += content
        rv += "</figure>"
        return rv
    })

    function syntax(syntax) {
        syntax = syntax.replace(/\[\[([a-zA-Z0-9\| ]*)\]\]([\*\+]?)/g, (match, p1, p2) => {
            const vars = p1.split("|")
            let rv = '<b>' + vars.map(v => `<var>${v}</var>`).join('|') + '</b>'
            if (p2) rv += `<sup>${p2}</sup>`
            return rv
        })
        return `<code class="syntax">${syntax}</code>`
    }

    config.addShortcode("syntax", syntax)

    config.addPairedShortcode("syntaxes", content => {
    	const buf = []
    	const lines = content.split('\n');
    	let dt = false;
    	for (const line of lines) {
	    	if (isJustWhitespace(line)) {
	    		buf.push(line);
	    	} else if (!indented(line)) {
	    		dt = true;
    			buf.push('\n<dt>' + syntax(line.slice(1, -1)));
    		} else {
    			if (dt) buf.push('<dd>\n');
    			dt = false;
    			buf.push(dedent(line));
    		}
    	}
    	return `<dl class="syntaxes">${buf.join('\n')}</dl>`;
    })
}

function isJustWhitespace(str) { return /^\s*$/.test(str) }
function dedent(str) { return str.replace(/^(\t|    )/, '') }
function indented(str) { return str.startsWith('    ') || str.startsWith('\t') }
