import { execSync } from "child_process";
import markdownItAttrs from "markdown-it-attrs";
import markdownItAnchor from "markdown-it-anchor";
import markdownItDeflist from "markdown-it-deflist";
import markdownItToc from "markdown-it-table-of-contents";
import MarkdownIt from "markdown-it";
import syntaxHighlight from "@11ty/eleventy-plugin-syntaxhighlight";
import { addWidgets } from "./_build/widgets.mjs";

export default function(config) {
    config.addPassthroughCopy("css");
    config.addPassthroughCopy("fonts");
    config.addPassthroughCopy("img");
    config.addPassthroughCopy("js");
    config.addPassthroughCopy("llms.txt");
    config.addPassthroughCopy("llms-full.txt");

    config.addCollection('cookbook', coll => coll.getFilteredByGlob('cookbook/*'))
    config.addCollection('patterns', coll => {
        var order = { beginner: 0, intermediate: 1, advanced: 2 };
        return coll.getFilteredByGlob('patterns/*').sort((a, b) => {
            var da = order[a.data.difficulty] ?? 1;
            var db = order[b.data.difficulty] ?? 1;
            if (da !== db) return da - db;
            return a.fileSlug.localeCompare(b.fileSlug);
        });
    })

    // Register custom hyperscript language with Prism (used by syntax highlight plugin)
    config.addPlugin(syntaxHighlight, {
        init: function({ Prism }) {
            Prism.languages.hyperscript = {
                'comment': /\-\-.*/,
                'punctuation': /[(){}[\],:;\?&]/,
                'url': {
                    pattern: /(fetch\s)[^`"'\s][^\s]*/,
                    lookbehind: true,
                    greedy: true,
                },
                'attribute': {
                    pattern: /@[a-zA-Z\-\_]+/,
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
                    pattern: /\+|\s-\s|\/|\*|\\|->|<\s|>|<=|>===|==|=|!==|!=|=|\.\.|([^\d\s]|^)\.|\%|\||!|\$|'s/,
                    lookbehind: true,
                },
                'builtin': /\b(?:I|me|my|it|its|result|event|target|detail|body|you|your|yourself|String|Number|Int|Float|Date|Array|HTML|Fragment|JSON|Object|Values)\b/,
                'function': /[A-Za-z0-9]+(?=\()/,
                'boolean': /\b(?:true|false|null)\b/,
                'string': {
                    pattern: /"[^\n"]*"|'[^\n']*'/,
                    greedy: true,
                },
                'number': {
                    pattern: /(\d+\.?|\d*\.\d+)(s|ms)?/,
                    greedy: true,
                },
                'template-string': {
                    pattern: /`[^\n`]*`/,
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
                            },
                        },
                        'string': /[\s\S]+/,
                    }
                }
            };

            // Also register for HTML markup attribute highlighting
            if (Prism.languages.markup) {
                Prism.languages.markup.tag.addAttribute('_', 'hyperscript');
            }
        }
    });

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
    var defaultTableOpen = md.renderer.rules.table_open || function(tokens, idx, options, env, self) {
        return self.renderToken(tokens, idx, options);
    };
    var defaultTableClose = md.renderer.rules.table_close || function(tokens, idx, options, env, self) {
        return self.renderToken(tokens, idx, options);
    };
    md.renderer.rules.table_open = function(tokens, idx, options, env, self) {
        return '<div class="table-wrap">' + defaultTableOpen(tokens, idx, options, env, self);
    };
    md.renderer.rules.table_close = function(tokens, idx, options, env, self) {
        return defaultTableClose(tokens, idx, options, env, self) + '</div>';
    };

    config.setLibrary("md", md)

    addWidgets(config);

    config.on("eleventy.after", () => {
        execSync("npx pagefind --site _site", { stdio: "inherit" });
    });
}
