
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

    config.addShortcode("syntax", syntax => {
        syntax = syntax.replace(/``([a-zA-Z0-9\| ]*)``([\*\+]?)/g, (match, p1, p2) => {
            const vars = p1.split("|")
            let rv = '<b>' + vars.map(v => `<var>${v}</var>`).join('|') + '</b>'
            if (p2) rv += `<sup>${p2}</sup>`
            return rv
        })
        return `<code class="syntax">${syntax}</code>`
    })
}
