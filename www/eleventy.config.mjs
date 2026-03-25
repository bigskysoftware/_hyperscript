import markdownItAttrs from "markdown-it-attrs";
import markdownItAnchor from "markdown-it-anchor";
import markdownItDeflist from "markdown-it-deflist";
import markdownItToc from "markdown-it-table-of-contents";
import MarkdownIt from "markdown-it";
import { addWidgets } from "./_build/widgets.mjs";

export default function(config) {
    config.addPassthroughCopy("css");
    config.addPassthroughCopy("img");
    config.addPassthroughCopy("js");

    config.addCollection('cookbook', coll => coll.getFilteredByGlob('cookbook/*'))

    var md = new MarkdownIt({ html: true });
    md.use(markdownItAttrs);
    md.use(markdownItDeflist);
    md.use(markdownItAnchor, {
        permalink: markdownItAnchor.permalink.ariaHidden({
            symbol: "§",
            placement: 'before'
        })
    });
    md.use(markdownItToc, {
        "includeLevel": [2,3,4,5,6]
    });
    config.setLibrary("md", md)

    addWidgets(config);
}
