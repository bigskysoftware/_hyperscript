/**
 * Web-related literal parse tree elements
 * References to DOM elements and attributes
 */
import { ElementCollection, TemplatedQueryElementCollection } from '../../core/runtime.js';
import { Expression } from '../base.js';

/**
 * IdRefTemplateNode - Template ID reference
 */
class IdRefTemplateNode extends Expression {
    constructor(innerExpression) {
        super();
        this.type = "idRefTemplate";
        this.args = [innerExpression];
    }

    resolve(context, arg) {
        return context.meta.runtime.getRootNode(context.me).getElementById(arg);
    }
}

/**
 * IdRefNode - Static ID reference
 */
class IdRefNode extends Expression {
    constructor(css, value) {
        super();
        this.type = "idRef";
        this.css = css;
        this.value = value;
    }

    evaluate(context) {
        return context.meta.runtime.getRootNode(context.me).getElementById(this.value);
    }
}

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
     * @returns {IdRefTemplateNode | IdRefNode | undefined}
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
            var innerParser = new parser.constructor(parser.kernel, innerTokens);
            var innerExpression = parser.kernel.requireElement("expression", innerParser);
            return new IdRefTemplateNode(innerExpression);
        } else {
            const value = elementId.value.substring(1);
            return new IdRefNode(elementId.value, value);
        }
    }
}

/**
 * ClassRefTemplateNode - Template class reference
 */
class ClassRefTemplateNode extends Expression {
    constructor(innerExpression) {
        super();
        this.type = "classRefTemplate";
        this.args = [innerExpression];
    }

    resolve(context, arg) {
        return new ElementCollection("." + arg, context.me, true, context.meta.runtime);
    }
}

/**
 * ClassRefNode - Static class reference
 */
class ClassRefNode extends Expression {
    constructor(css, className) {
        super();
        this.type = "classRef";
        this.css = css;
        this.className = className;
    }

    evaluate(context) {
        return new ElementCollection(this.css, context.me, true, context.meta.runtime);
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
     * @returns {ClassRefTemplateNode | ClassRefNode | undefined}
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
            var innerParser = new parser.constructor(parser.kernel, innerTokens);
            var innerExpression = parser.kernel.requireElement("expression", innerParser);
            return new ClassRefTemplateNode(innerExpression);
        } else {
            const css = classRef.value;
            const className = css.substr(1);
            return new ClassRefNode(css, className);
        }
    }
}

/**
 * QueryRefNode - Query selector reference node
 */
class QueryRefNode extends Expression {
    constructor(css, args, template) {
        super();
        this.type = "queryRef";
        this.css = css;
        this.args = args;
        this.template = template;
    }

    resolve(context, ...args) {
        if (this.template) {
            return new TemplatedQueryElementCollection(this.css, context.me, args, context.meta.runtime);
        } else {
            return new ElementCollection(this.css, context.me, false, context.meta.runtime);
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
     * @returns {QueryRefNode | undefined}
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
            var innerParser = new parser.constructor(parser.kernel, innerTokens);
            args = parser.kernel.parseStringTemplate(innerParser);
        }

        return new QueryRefNode(queryValue, args, template);
    }
}

/**
 * AttributeRefNode - Attribute reference node
 */
class AttributeRefNode extends Expression {
    constructor(name, css, value) {
        super();
        this.type = "attributeRef";
        this.name = name;
        this.css = css;
        this.value = value;
    }

    resolve(context) {
        var target = context.you || context.me;
        if (target) {
            return target.getAttribute(this.name);
        }
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
     * @returns {AttributeRefNode | undefined}
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
        return new AttributeRefNode(name, css, value);
    }
}

/**
 * ComputedStyleRefNode - Computed style reference node
 */
class ComputedStyleRefNode extends Expression {
    constructor(name) {
        super();
        this.type = "computedStyleRef";
        this.name = name;
    }

    resolve(context) {
        var target = context.you || context.me;
        if (target) {
            return context.meta.runtime.resolveComputedStyle(target, this.name);
        }
    }
}

/**
 * StyleRefNode - Style reference node
 */
class StyleRefNode extends Expression {
    constructor(name) {
        super();
        this.type = "styleRef";
        this.name = name;
    }

    resolve(context) {
        var target = context.you || context.me;
        if (target) {
            return context.meta.runtime.resolveStyle(target, this.name);
        }
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
     * @returns {ComputedStyleRefNode | StyleRefNode | undefined}
     */
    static parse(parser) {
        var styleRef = parser.matchTokenType("STYLE_REF");
        if (!styleRef) return;
        if (!styleRef.value) return;
        var styleProp = styleRef.value.substr(1);
        if (styleProp.startsWith("computed-")) {
            styleProp = styleProp.substr("computed-".length);
            return new ComputedStyleRefNode(styleProp);
        } else {
            return new StyleRefNode(styleProp);
        }
    }
}

/**
 * StyleLiteralNode - Style literal node
 */
class StyleLiteralNode extends Expression {
    constructor(stringParts, exprs) {
        super();
        this.type = "styleLiteral";
        this.stringParts = stringParts;
        this.args = [exprs];
    }

    resolve(ctx, exprs) {
        var rv = "";
        const stringParts = this.stringParts;

        stringParts.forEach(function (part, idx) {
            rv += part;
            if (idx in exprs) rv += exprs[idx];
        });

        return rv;
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
     * @returns {StyleLiteralNode | undefined}
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

        return new StyleLiteralNode(stringParts, exprs);
    }
}

