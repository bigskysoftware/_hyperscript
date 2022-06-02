
const markdownItAttrs = require("markdown-it-attrs");
const markdownItAnchor = require("markdown-it-anchor");
const markdownItDeflist = require("markdown-it-deflist");
module.exports = function(config) {
    config.addPassthroughCopy("css");
    config.addPassthroughCopy("img");
    config.addPassthroughCopy("js");
    config.addPassthroughCopy("test");

    config.addCollection('cookbook', coll => coll.getFilteredByGlob('cookbook/*'))

    var md = new (require("markdown-it"))({ html: true });
    md.use(markdownItAttrs);
    md.use(markdownItDeflist);
    md.use(markdownItAnchor, {
        permalink: markdownItAnchor.permalink.ariaHidden({
            symbol: "§",
            placement: 'before'
        })
    });
    md.use(require("markdown-it-table-of-contents"), {
    "includeLevel": [2,3,4,5,6]
    });
    config.setLibrary("md", md)

    require("./_build/widgets")(config);
}
