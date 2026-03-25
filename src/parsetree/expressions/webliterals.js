/**
 * Web-related literal parse tree elements
 * References to DOM elements and attributes
 */
import { ElementCollection, TemplatedQueryElementCollection } from '../../core/runtime/collections.js';
import { Expression } from '../base.js';
import { Tokenizer } from '../../core/tokenizer.js';

/**
 * IdRef - Represents ID references (#foo or #${expr})
 *
 * Parses: #elementId | #${expression}
 * Returns: Element with matching ID
 */
export class IdRef extends Expression {
    static grammarName = "idRef";
    static expressionType = "leaf";

    constructor(variant, css, value, innerExpression) {
        super();
        this.variant = variant;
        this.type = variant === "template" ? "idRefTemplate" : "idRef";
        this.css = css;
        this.value = value;
        this.args = variant === "template" ? { expr: innerExpression } : null;
    }

    static parse(parser) {

        var elementId = parser.matchTokenType("ID_REF");
        if (!elementId) return;
        if (!elementId.value) return;
        if (elementId.template) {
            var templateValue = elementId.value.substring(2);
            var innerTokens = Tokenizer.tokenize(templateValue);
            var innerParser = parser.createChildParser(innerTokens);
            var innerExpression = innerParser.requireElement("expression");
            return new IdRef("template", null, null, innerExpression);
        } else {
            const value = elementId.value.substring(1);
            return new IdRef("static", elementId.value, value, null);
        }
    }

    resolve(context, { expr } = {}) {
        if (this.variant === "template") {
            return context.meta.runtime.getRootNode(context.me).getElementById(expr);
        } else {
            return context.meta.runtime.getRootNode(context.me).getElementById(this.value);
        }
    }
}

/**
 * ClassRef - Represents class references (.foo or .${expr})
 *
 * Parses: .className | .${expression}
 * Returns: ElementCollection with matching class
 */
export class ClassRef extends Expression {
    static grammarName = "classRef";
    static expressionType = "leaf";

    constructor(variant, css, className, innerExpression) {
        super();
        this.variant = variant;
        this.type = variant === "template" ? "classRefTemplate" : "classRef";
        this.css = css;
        this.className = className;
        this.args = variant === "template" ? { expr: innerExpression } : null;
    }

    static parse(parser) {

        var classRef = parser.matchTokenType("CLASS_REF");
        if (!classRef) return;
        if (!classRef.value) return;
        if (classRef.template) {
            var templateValue = classRef.value.substring(2);
            var innerTokens = Tokenizer.tokenize(templateValue);
            var innerParser = parser.createChildParser(innerTokens);
            var innerExpression = innerParser.requireElement("expression");
            return new ClassRef("template", null, null, innerExpression);
        } else {
            const css = classRef.value;
            const className = css.substr(1);
            return new ClassRef("static", css, className, null);
        }
    }

    resolve(context, { expr } = {}) {
        if (this.variant === "template") {
            return new ElementCollection("." + expr, context.me, true, context.meta.runtime);
        } else {
            return new ElementCollection(this.css, context.me, true, context.meta.runtime);
        }
    }
}

/**
 * QueryRef - Represents query selector references (<selector/>)
 *
 * Parses: <div/> | <.foo/> | <#bar/>
 * Returns: ElementCollection matching query
 */
export class QueryRef extends Expression {
    static grammarName = "queryRef";
    static expressionType = "leaf";

    constructor(css, args, template) {
        super();
        this.css = css;
        this.templateArgs = args;
        this.args = template ? { parts: args } : null;
        this.template = template;
    }

    static parse(parser) {


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
            var innerParser = parser.createChildParser(innerTokens);
            args = innerParser.parseStringTemplate();
        }

        return new QueryRef(queryValue, args, template);
    }

    resolve(context, { parts } = {}) {
        if (this.template) {
            return new TemplatedQueryElementCollection(this.css, context.me, parts, context.meta.runtime);
        } else {
            return new ElementCollection(this.css, context.me, false, context.meta.runtime);
        }
    }
}

/**
 * AttributeRef - Represents attribute references (@attr or [@attr="value"])
 *
 * Parses: @name | @name="value"
 * Returns: Attribute value or ElementCollection
 */
export class AttributeRef extends Expression {
    static grammarName = "attributeRef";
    static expressionType = "leaf";
    static assignable = true;

    constructor(name, css, value) {
        super();
        this.name = name;
        this.css = css;
        this.value = value;
    }

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
        return new AttributeRef(name, css, value);
    }

    resolve(context) {
        var target = context.you || context.me;
        if (target) {
            return target.getAttribute(this.name);
        }
    }
}

/**
 * StyleRef - Represents style references (*prop or *computed-prop)
 *
 * Parses: *color | *computed-width
 * Returns: Style property value (regular or computed)
 */
export class StyleRef extends Expression {
    static grammarName = "styleRef";
    static expressionType = "leaf";
    static assignable = true;

    constructor(variant, name) {
        super();
        this.variant = variant;
        this.type = variant === "computed" ? "computedStyleRef" : "styleRef";
        this.name = name;
    }

    static parse(parser) {
        var styleRef = parser.matchTokenType("STYLE_REF");
        if (!styleRef) return;
        if (!styleRef.value) return;
        var styleProp = styleRef.value.substr(1);
        if (styleProp.startsWith("computed-")) {
            styleProp = styleProp.substr("computed-".length);
            return new StyleRef("computed", styleProp);
        } else {
            return new StyleRef("style", styleProp);
        }
    }

    resolve(context) {
        var target = context.you || context.me;
        if (target) {
            if (this.variant === "computed") {
                return context.meta.runtime.resolveComputedStyle(target, this.name);
            } else {
                return context.meta.runtime.resolveStyle(target, this.name);
            }
        }
    }
}

/**
 * StyleLiteral - Represents templated style strings
 *
 * Parses: { css-text-with-$variables }
 * Returns: Interpolated CSS string
 */
export class StyleLiteral extends Expression {
    static grammarName = "styleLiteral";

    constructor(stringParts, exprs) {
        super();
        this.stringParts = stringParts;
        this.args = { exprs };
    }

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

        return new StyleLiteral(stringParts, exprs);
    }

    resolve(ctx, { exprs }) {
        var rv = "";
        const stringParts = this.stringParts;

        stringParts.forEach(function (part, idx) {
            rv += part;
            if (idx in exprs) rv += exprs[idx];
        });

        return rv;
    }
}
