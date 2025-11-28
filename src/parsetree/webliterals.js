/**
 * Web-related literal parse tree elements
 * References to DOM elements and attributes
 */
import { ElementCollection } from '../core/util.js';

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