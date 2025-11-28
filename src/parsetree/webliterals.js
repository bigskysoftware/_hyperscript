/**
 * Web-related literal parse tree elements
 * References to DOM elements and attributes
 */
import { ElementCollection, TemplatedQueryElementCollection } from '../core/util.js';

/**
 * IdRef - Represents ID references (#foo or #${expr})
 *
 * Parses: #elementId | #${expression}
 * Returns: Element with matching ID
 */
export class IdRef {
    /**
     * Parse an ID reference
     * @param {ParserHelper} helper
     * @returns {any | undefined}
     */
    static parse(helper) {
        const Lexer = helper.parser.constructor.Lexer || window._hyperscript?.internals?.Lexer;
        var elementId = helper.matchTokenType("ID_REF");
        if (!elementId) return;
        if (!elementId.value) return;
        // TODO - unify these two expression types
        if (elementId.template) {
            var templateValue = elementId.value.substring(2);
            var innerTokens = Lexer.tokenize(templateValue);
            var innerExpression = helper.parser.requireElement("expression", innerTokens);
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
     * @param {ParserHelper} helper
     * @returns {any | undefined}
     */
    static parse(helper) {
        const Lexer = helper.parser.constructor.Lexer || window._hyperscript?.internals?.Lexer;

        var classRef = helper.matchTokenType("CLASS_REF");

        if (!classRef) return;
        if (!classRef.value) return;

        // TODO - unify these two expression types
        if (classRef.template) {
            var templateValue = classRef.value.substring(2);
            var innerTokens = Lexer.tokenize(templateValue);
            var innerExpression = helper.parser.requireElement("expression", innerTokens);
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
     * @param {ParserHelper} helper
     * @returns {any | undefined}
     */
    static parse(helper) {
        const Lexer = helper.parser.constructor.Lexer || window._hyperscript?.internals?.Lexer;

        var queryStart = helper.matchOpToken("<");
        if (!queryStart) return;
        var queryTokens = helper.consumeUntil("/");
        helper.requireOpToken("/");
        helper.requireOpToken(">");
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
            innerTokens = Lexer.tokenize(queryValue, true);
            args = helper.parser.parseStringTemplate(innerTokens);
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
     * @param {ParserHelper} helper
     * @returns {any | undefined}
     */
    static parse(helper) {
        var attributeRef = helper.matchTokenType("ATTRIBUTE_REF");
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