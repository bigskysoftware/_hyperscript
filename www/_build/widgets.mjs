// Eleventy passes its configured markdown-it instance (with Prism syntax
// highlighting applied via the @11ty/eleventy-plugin-syntaxhighlight) so
// that fenced code blocks inside callouts get highlighted the same as
// blocks in the surrounding markdown.
export function addWidgets(config, md) {
    let exampleId = 0

    // {% note "Optional Title" %} ... {% endnote %}
    // Variants: {% note %}, {% tip %}, {% warning %}
    function makeCallout(kind) {
        return (content, title) => {
            const body = md.render(content.trim());
            const heading = title
                ? `<p class="callout-title">${md.renderInline(title)}</p>`
                : '';
            return `<aside class="callout callout-${kind}">${heading}${body}</aside>`;
        };
    }
    config.addPairedShortcode('note', makeCallout('note'));
    config.addPairedShortcode('tip', makeCallout('tip'));
    config.addPairedShortcode('warning', makeCallout('warning'));

    config.addPairedShortcode('example', (content, caption) => {
        let trimmed = content.trim()
        let scopeClass = `_ex${exampleId++}`

        // Extract <style> blocks: keep CSS for output scoping, strip from code display
        let styles = ''
        let codeContent = trimmed.replace(/<style>([\s\S]*?)<\/style>/g, (_, css) => {
            styles += css
            return ''
        }).trim()

        // Full content (with styles) for the playground snippet
        let escaped = trimmed
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\n/g, '&#10;')

        // Scope styles using CSS nesting, hoisting @keyframes to top level
        let scopedStyleTag = ''
        if (styles) {
            let topLevel = '', nested = '', i = 0
            while (i < styles.length) {
                let m = styles.slice(i).match(/^@keyframes\s+[\w-]+\s*\{/)
                if (m) {
                    let start = i
                    i += m[0].length
                    let depth = 1
                    while (i < styles.length && depth > 0) {
                        if (styles[i] === '{') depth++
                        else if (styles[i] === '}') depth--
                        i++
                    }
                    topLevel += styles.slice(start, i) + '\n'
                } else {
                    nested += styles[i]
                    i++
                }
            }
            scopedStyleTag = `<style>${topLevel.replace(/\n/g, ' ')}.${scopeClass} { ${nested.replace(/\n/g, ' ')} }</style>`
        }

        // Scoped version for reset (single line to survive markdown)
        let scopedContent = codeContent + (scopedStyleTag ? '\n' + scopedStyleTag : '')
        let escapedScoped = scopedContent
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\n/g, '&#10;')

        let rv = "<figure class='example-card'>\n"
        if (caption) rv += `<figcaption class="window-title allcaps">Example: ${caption}</figcaption>\n`
        else rv += `<figcaption class="window-title allcaps">Example</figcaption>\n`
        rv += `<div class="example-body">\n`
        rv += `<div class="example-code">\n\n`
        rv += "~~~ html\n"
        rv += codeContent
        rv += "\n~~~\n\n"
        rv += `</div>\n`
        rv += `<div class="example-output ${scopeClass}" data-original="${escapedScoped}">\n`
        rv += codeContent
        if (scopedStyleTag) rv += '\n' + scopedStyleTag + '\n'
        rv += `</div>\n`
        rv += `</div>\n`
        rv += `<div class="example-actions">\n`
        rv += `<button class="example-action-btn"`
        rv += ` onclick="var elt=this.closest('figure').querySelector('.example-output');elt.innerHTML=elt.dataset.original;_hyperscript.process(elt)">Reset</button>\n`
        rv += `<a href="/playground/" class="example-action-btn" data-snippet="${escaped}"`
        rv += ` _="on mousedown call localStorage.setItem('playground-snippet', my @data-snippet)">`
        rv += `Try It!</a>\n`
        rv += `</div>\n`
        rv += "</figure>"
        return rv
    })

    function syntax(syntax) {
        syntax = syntax
        .replace(/\[\[([\*\+\?])\]\]/g,
          "<sup>$1</sup>"
        )
        .replace(/\[\[([a-zA-Z0-9 ]+)\]\]/g,
            '<b class="chip syntaxvar"><var>$1</var></b>'
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
    	return `<div class="box"><dl class="syntaxes">${buf.join('\n')}</dl></div>`;
    })
}

function isJustWhitespace(str) { return /^\s*$/.test(str) }
function dedent(str) { return str.replace(/^(\t|    )/, '') }
function indented(str) { return str.startsWith('    ') || str.startsWith('\t') }
