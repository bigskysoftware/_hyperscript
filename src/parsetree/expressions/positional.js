/**
 * Positional expression parse tree elements
 * DOM query and position-based selections
 */

import { Tokens } from '../../core/tokens.js';

/**
 * Helper function - scan forward in DOM tree for matching element
 */
function scanForwardQuery(start, root, match, wrap) {
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

/**
 * Helper function - scan backward in DOM tree for matching element
 */
function scanBackwardsQuery(start, root, match, wrap) {
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

/**
 * Helper function - scan forward in array for matching element
 */
function scanForwardArray(start, array, match, wrap) {
    var matches = [];
    for(var elt of array){
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

/**
 * Helper function - scan backward in array for matching element
 */
function scanBackwardsArray(start, array, match, wrap) {
    return scanForwardArray(start, Array.from(array).reverse(), match, wrap);
}

/**
 * RelativePositionalExpression - Relative DOM navigation
 *
 * Parses: next <div/> | previous <p/> | next <div/> from <expr> in <container>
 * Returns: matching element relative to starting point
 */
export class RelativePositionalExpression {
    constructor(thingElt, from, forwardSearch, inSearch, wrapping, inElt, withinElt, operator) {
        this.type = "relativePositionalExpression";
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
    op(context, thing, from, inElt, withinElt) {
        var css = thing.css;
        if (css == null) {
            throw "Expected a CSS value to be returned by " + Tokens.sourceFor.apply(this.thingElt);
        }

        if(this.inSearch) {
            if (inElt) {
                if (this.forwardSearch) {
                    return scanForwardArray(from, inElt, css, this.wrapping);
                } else {
                    return scanBackwardsArray(from, inElt, css, this.wrapping);
                }
            }
        } else {
            if (withinElt) {
                if (this.forwardSearch) {
                    return scanForwardQuery(from, withinElt, css, this.wrapping);
                } else {
                    return scanBackwardsQuery(from, withinElt, css, this.wrapping);
                }
            }
        }
    }

    /**
     * Evaluate relative positional expression
     * @param {Context} context
     * @returns {Element}
     */
    evaluate(context) {
        return context.meta.runtime.unifiedEval(this, context);
    }
}

/**
 * PositionalExpression - Array/collection position selection
 *
 * Parses: first <expr> | last <expr> | random <expr>
 * Returns: selected element from collection
 */
export class PositionalExpression {
    constructor(rhs, operator) {
        this.type = "positionalExpression";
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
    op(context, rhsVal) {
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
    evaluate(context) {
        return context.meta.runtime.unifiedEval(this, context);
    }
}

/**
 * ClosestExpr - Finds closest ancestor matching selector
 *
 * Parses: closest <selector> [to element] | closest parent <selector> [to element]
 * Returns: Closest matching element
 */
export class ClosestExpr {
    /**
     * Parse a closest expression
     * @param {Parser} parser
     * @returns {any | undefined}
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

        var closestExpr = {
            type: "closestExpr",
            parentSearch: parentSearch,
            expr: expr,
            css: css,
            to: to,
            args: [to],
            op: function (ctx, to) {
                if (to == null) {
                    return null;
                } else {
                    let result = [];
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
            },
            evaluate: function (ctx) {
                return ctx.meta.runtime.unifiedEval(this, ctx);
            },
        };

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
