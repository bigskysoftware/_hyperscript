
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
}
