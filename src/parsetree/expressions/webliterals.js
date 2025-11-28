/**
 * Web-related literal parse tree elements
 * References to DOM elements and attributes
 */
import { ElementCollection, TemplatedQueryElementCollection } from '../../core/runtime.js';

/**
 * IdRef - Represents ID references (#foo or #${expr})
 *
 * Parses: #elementId | #${expression}
 * Returns: Element with matching ID
 */
export class IdRef {
    /**
     * Parse an ID reference
     * @param {Parser} parser
     * @returns {any | undefined}
     */
    static parse(parser) {
        const Tokenizer = parser.kernel.constructor.Tokenizer || window._hyperscript?.internals?.Tokenizer;
        var elementId = parser.matchTokenType("ID_REF");
        if (!elementId) return;
        if (!elementId.value) return;
        // TODO - unify these two expression types
        if (elementId.template) {
            var templateValue = elementId.value.substring(2);
            var innerTokens = Tokenizer.tokenize(templateValue);
            var innerExpression = parser.kernel.requireElement("expression", innerTokens);
            return {
                type: "idRefTemplate",
                args: [innerExpression],
                op: function (context, arg) {
                    return context.meta.runtime.getRootNode(context.me).getElementById(arg);
                },
                evaluate: function (context) {
                    return context.meta.runtime.unifiedEval(this, context);
                },
            };
        } else {
            const value = elementId.value.substring(1);
            return {
                type: "idRef",
                css: elementId.value,
                value: value,
                evaluate: function (context) {
                    return (
                        context.meta.runtime.getRootNode(context.me).getElementById(value)
                    );
                },
            };
        }
    }
}

/**
 * ClassRef - Represents class references (.foo or .${expr})
 *
 * Parses: .className | .${expression}
 * Returns: ElementCollection with matching class
 */
export class ClassRef {
    /**
     * Parse a class reference
     * @param {Parser} parser
     * @returns {any | undefined}
     */
    static parse(parser) {
        const Tokenizer = parser.kernel.constructor.Tokenizer || window._hyperscript?.internals?.Tokenizer;

        var classRef = parser.matchTokenType("CLASS_REF");

        if (!classRef) return;
        if (!classRef.value) return;

        // TODO - unify these two expression types
        if (classRef.template) {
            var templateValue = classRef.value.substring(2);
            var innerTokens = Tokenizer.tokenize(templateValue);
            var innerExpression = parser.kernel.requireElement("expression", innerTokens);
            return {
                type: "classRefTemplate",
                args: [innerExpression],
                op: function (context, arg) {
                    return new ElementCollection("." + arg, context.me, true)
                },
                evaluate: function (context) {
                    return context.meta.runtime.unifiedEval(this, context);
                },
            };
        } else {
            const css = classRef.value;
            const className = css.substr(1);
            return {
                type: "classRef",
                css: css,
                className: className,
                evaluate: function (context) {
                    return new ElementCollection(css, context.me, true)
                },
            };
        }
    }
}

/**
 * QueryRef - Represents query selector references (<selector/>)
 *
 * Parses: <div/> | <.foo/> | <#bar/>
 * Returns: ElementCollection matching query
 */
export class QueryRef {
    /**
     * Parse a query reference
     * @param {Parser} parser
     * @returns {any | undefined}
     */
    static parse(parser) {
        const Tokenizer = parser.kernel.constructor.Tokenizer || window._hyperscript?.internals?.Tokenizer;

        var queryStart = parser.matchOpToken("<");
        if (!queryStart) return;
        var queryTokens = parser.consumeUntil("/");
        parser.requireOpToken("/");
        parser.requireOpToken(">");
        var queryValue = queryTokens
            .map(function (t) {
                if (t.type === "STRING") {
                    return '"' + t.value + '"';
                } else {
                    return t.value;
                }
            })
            .join("");

        var template, innerTokens, args;
        if (/\$[^=]/.test(queryValue)) {
            template = true;
            innerTokens = Tokenizer.tokenize(queryValue, true);
            args = parser.kernel.parseStringTemplate(innerTokens);
        }

        return {
            type: "queryRef",
            css: queryValue,
            args: args,
            op: function (context, ...args) {
                if (template) {
                    return new TemplatedQueryElementCollection(queryValue, context.me, args)
                } else {
                    return new ElementCollection(queryValue, context.me)
                }
            },
            evaluate: function (context) {
                return context.meta.runtime.unifiedEval(this, context);
            },
        };
    }
}

/**
 * AttributeRef - Represents attribute references (@attr or [@attr="value"])
 *
 * Parses: @name | @name="value"
 * Returns: Attribute value or ElementCollection
 */
export class AttributeRef {
    /**
     * Parse an attribute reference
     * @param {Parser} parser
     * @returns {any | undefined}
     */
    static parse(parser) {
        var attributeRef = parser.matchTokenType("ATTRIBUTE_REF");
        if (!attributeRef) return;
        if (!attributeRef.value) return;
        var outerVal = attributeRef.value;
        if (outerVal.indexOf("[") === 0) {
            var innerValue = outerVal.substring(2, outerVal.length - 1);
        } else {
            var innerValue = outerVal.substring(1);
        }
        var css = "[" + innerValue + "]";
        var split = innerValue.split("=");
        var name = split[0];
        var value = split[1];
        if (value) {
            // strip quotes
            if (value.indexOf('"') === 0) {
                value = value.substring(1, value.length - 1);
            }
        }
        return {
            type: "attributeRef",
            name: name,
            css: css,
            value: value,
            op: function (context) {
                var target = context.you || context.me;
                if (target) {
                    return target.getAttribute(name);
                }
            },
            evaluate: function (context) {
                return context.meta.runtime.unifiedEval(this, context);
            },
        };
    }
}

/**
 * StyleRef - Represents style references (*prop or *computed-prop)
 *
 * Parses: *color | *computed-width
 * Returns: Style property value (regular or computed)
 */
export class StyleRef {
    /**
     * Parse a style reference
     * @param {Parser} parser
     * @returns {any | undefined}
     */
    static parse(parser) {
        var styleRef = parser.matchTokenType("STYLE_REF");
        if (!styleRef) return;
        if (!styleRef.value) return;
        var styleProp = styleRef.value.substr(1);
        if (styleProp.startsWith("computed-")) {
            styleProp = styleProp.substr("computed-".length);
            return {
                type: "computedStyleRef",
                name: styleProp,
                op: function (context) {
                    var target = context.you || context.me;
                    if (target) {
                        return context.meta.runtime.resolveComputedStyle(target, styleProp);
                    }
                },
                evaluate: function (context) {
                    return context.meta.runtime.unifiedEval(this, context);
                },
            };
        } else {
            return {
                type: "styleRef",
                name: styleProp,
                op: function (context) {
                    var target = context.you || context.me;
                    if (target) {
                        return context.meta.runtime.resolveStyle(target, styleProp);
                    }
                },
                evaluate: function (context) {
                    return context.meta.runtime.unifiedEval(this, context);
                },
            };
        }
    }
}

/**
 * StyleLiteral - Represents templated style strings
 *
 * Parses: { css-text-with-$variables }
 * Returns: Interpolated CSS string
 */
export class StyleLiteral {
    /**
     * Parse a style literal
     * @param {Parser} parser
     * @returns {any | undefined}
     */
    static parse(parser) {
        if (!parser.matchOpToken("{")) return;

        var stringParts = [""]
        var exprs = []

        while (parser.hasMore()) {
            if (parser.matchOpToken("\\")) {
                parser.consumeToken();
            } else if (parser.matchOpToken("}")) {
                break;
            } else if (parser.matchToken("$")) {
                var opencurly = parser.matchOpToken("{");
                var expr = parser.parseElement("expression");
                if (opencurly) parser.requireOpToken("}");

                exprs.push(expr)
                stringParts.push("")
            } else {
                var tok = parser.consumeToken();
                stringParts[stringParts.length-1] += parser.source.substring(tok.start, tok.end);
            }

            stringParts[stringParts.length-1] += parser.lastWhitespace();
        }

        return {
            type: "styleLiteral",
            args: [exprs],
            op: function (ctx, exprs) {
                var rv = "";

                stringParts.forEach(function (part, idx) {
                    rv += part;
                    if (idx in exprs) rv += exprs[idx];
                });

                return rv;
            },
            evaluate: function(ctx) {
                return ctx.meta.runtime.unifiedEval(this, ctx);
            }
        }
    }
}

