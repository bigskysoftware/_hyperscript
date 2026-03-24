/**
 * Positional expression parse tree elements
 * DOM query and position-based selections
 */

import { Tokens } from '../../core/tokenizer.js';
import { Expression } from '../base.js';

/**
 * RelativePositionalExpression - Relative DOM navigation
 *
 * Parses: next <div/> | previous <p/> | next <div/> from <expr> in <container>
 * Returns: matching element relative to starting point
 */
export class RelativePositionalExpression extends Expression {
    static grammarName = "relativePositionalExpression";
    static expressionType = "unary";

    constructor(thingElt, from, forwardSearch, inSearch, wrapping, inElt, withinElt, operator) {
        super();
        this.thingElt = thingElt;
        this.from = from;
        this.forwardSearch = forwardSearch;
        this.inSearch = inSearch;
        this.wrapping = wrapping;
        this.inElt = inElt;
        this.withinElt = withinElt;
        this.operator = operator;
        this.args = [thingElt, from, inElt, withinElt];
    }

    /**
     * Parse a relative positional expression
     * @param {Parser} parser
     * @returns {RelativePositionalExpression | undefined}
     */
    static parse(parser) {
        var op = parser.matchAnyToken("next", "previous");
        if (!op) return;
        var forwardSearch = op.value === "next";

        var thingElt = parser.parseElement("expression");

        if (parser.matchToken("from")) {
            parser.pushFollow("in");
            try {
                var from = parser.requireElement("unaryExpression");
            } finally {
                parser.popFollow();
            }
        } else {
            var from = parser.requireElement("implicitMeTarget");
        }

        var inSearch = false;
        var withinElt;
        if (parser.matchToken("in")) {
            inSearch = true;
            var inElt = parser.requireElement("unaryExpression");
        } else if (parser.matchToken("within")) {
            withinElt = parser.requireElement("unaryExpression");
        } else {
            withinElt = document.body;
        }

        var wrapping = false;
        if (parser.matchToken("with")) {
            parser.requireToken("wrapping")
            wrapping = true;
        }

        return new RelativePositionalExpression(
            thingElt,
            from,
            forwardSearch,
            inSearch,
            wrapping,
            inElt,
            withinElt,
            op.value
        );
    }

    /**
     * Op function for relative positional
     */
    scanForwardQuery(start, root, match, wrap) {
        var results = root.querySelectorAll(match);
        for (var i = 0; i < results.length; i++) {
            var elt = results[i];
            if (elt.compareDocumentPosition(start) === Node.DOCUMENT_POSITION_PRECEDING) {
                return elt;
            }
        }
        if (wrap) {
            return results[0];
        }
    }

    scanBackwardsQuery(start, root, match, wrap) {
        var results = root.querySelectorAll(match);
        for (var i = results.length - 1; i >= 0; i--) {
            var elt = results[i];
            if (elt.compareDocumentPosition(start) === Node.DOCUMENT_POSITION_FOLLOWING) {
                return elt;
            }
        }
        if (wrap) {
            return results[results.length - 1];
        }
    }

    scanForwardArray(start, array, match, wrap) {
        var matches = [];
        for (var elt of array) {
            if (elt.matches(match) || elt === start) {
                matches.push(elt);
            }
        }
        for (var i = 0; i < matches.length - 1; i++) {
            var elt = matches[i];
            if (elt === start) {
                return matches[i + 1];
            }
        }
        if (wrap) {
            var first = matches[0];
            if (first && first.matches(match)) {
                return first;
            }
        }
    }

    scanBackwardsArray(start, array, match, wrap) {
        return this.scanForwardArray(start, Array.from(array).reverse(), match, wrap);
    }

    resolve(context, thing, from, inElt, withinElt) {
        var css = thing.css;
        if (css == null) {
            throw "Expected a CSS value to be returned by " + Tokens.sourceFor.apply(this.thingElt);
        }

        if(this.inSearch) {
            if (inElt) {
                if (this.forwardSearch) {
                    return this.scanForwardArray(from, inElt, css, this.wrapping);
                } else {
                    return this.scanBackwardsArray(from, inElt, css, this.wrapping);
                }
            }
        } else {
            if (withinElt) {
                if (this.forwardSearch) {
                    return this.scanForwardQuery(from, withinElt, css, this.wrapping);
                } else {
                    return this.scanBackwardsQuery(from, withinElt, css, this.wrapping);
                }
            }
        }
    }

    /**
     * Evaluate relative positional expression
     * @param {Context} context
     * @returns {Element}
     */
}

/**
 * PositionalExpression - Array/collection position selection
 *
 * Parses: first <expr> | last <expr> | random <expr>
 * Returns: selected element from collection
 */
export class PositionalExpression extends Expression {
    static grammarName = "positionalExpression";
    static expressionType = "unary";

    constructor(rhs, operator) {
        super();
        this.rhs = rhs;
        this.operator = operator;
        this.args = [rhs];
    }

    /**
     * Parse a positional expression
     * @param {Parser} parser
     * @returns {PositionalExpression | undefined}
     */
    static parse(parser) {
        var op = parser.matchAnyToken("first", "last", "random");
        if (!op) return;
        parser.matchAnyToken("in", "from", "of");
        var rhs = parser.requireElement("unaryExpression");
        return new PositionalExpression(rhs, op.value);
    }

    /**
     * Op function for positional
     */
    resolve(context, rhsVal) {
        if (rhsVal && !Array.isArray(rhsVal)) {
            if (rhsVal.children) {
                rhsVal = rhsVal.children;
            } else {
                rhsVal = Array.from(rhsVal);
            }
        }
        if (rhsVal) {
            if (this.operator === "first") {
                return rhsVal[0];
            } else if (this.operator === "last") {
                return rhsVal[rhsVal.length - 1];
            } else if (this.operator === "random") {
                return rhsVal[Math.floor(Math.random() * rhsVal.length)];
            }
        }
    }

    /**
     * Evaluate positional expression
     * @param {Context} context
     * @returns {any}
     */
}

/**
 * ClosestExprNode - Closest ancestor matching selector node
 */
class ClosestExprNode extends Expression {
    constructor(parentSearch, expr, css, to) {
        super();
        this.type = "closestExpr";
        this.parentSearch = parentSearch;
        this.expr = expr;
        this.css = css;
        this.to = to;
        this.args = [to];
    }

    resolve(ctx, to) {
        if (to == null) {
            return null;
        } else {
            let result = [];
            const css = this.css;
            const parentSearch = this.parentSearch;
            ctx.meta.runtime.implicitLoop(to, function(to){
                if (parentSearch) {
                    result.push(to.parentElement ? to.parentElement.closest(css) : null);
                } else {
                    result.push(to.closest(css));
                }
            })
            if (ctx.meta.runtime.shouldAutoIterate(to)) {
                return result;
            } else {
                return result[0];
            }
        }
    }
}

/**
 * ClosestExpr - Finds closest ancestor matching selector
 *
 * Parses: closest <selector> [to element] | closest parent <selector> [to element]
 * Returns: Closest matching element
 */
export class ClosestExpr extends Expression {
    static grammarName = "closestExpr";
    static expressionType = "leaf";

    /**
     * Parse a closest expression
     * @param {Parser} parser
     * @returns {ClosestExprNode | undefined}
     */
    static parse(parser) {
        if (!parser.matchToken("closest")) return;

        var parentSearch = false;
        if (parser.matchToken("parent")) {
            parentSearch = true;
        }

        var css = null;
        var attributeRef = null;
        if (parser.currentToken().type === "ATTRIBUTE_REF") {
            attributeRef = parser.requireElement("attributeRefAccess", null);
            css = "[" + attributeRef.attribute.name + "]";
        }

        if (css == null) {
            var expr = parser.requireElement("expression");
            if (expr.css == null) {
                parser.raiseParseError("Expected a CSS expression");
            } else {
                css = expr.css;
            }
        }

        if (parser.matchToken("to")) {
            var to = parser.parseElement("expression");
        } else {
            var to = parser.parseElement("implicitMeTarget");
        }

        var closestExpr = new ClosestExprNode(parentSearch, expr, css, to);

        // If we parsed an attributeRef, wrap the closestExpr
        if (attributeRef) {
            attributeRef.root = closestExpr;
            attributeRef.args = [closestExpr];
            return attributeRef;
        } else {
            return closestExpr;
        }
    }
}
