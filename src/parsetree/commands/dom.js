/**
 * DOM manipulation command parse tree elements
 * Web-specific commands for manipulating DOM classes, attributes, and visibility
 */

import { Command } from '../base.js';
import { config } from '../../core/config.js';
import { PseudopossessiveIts } from '../expressions/pseudopossessive.js';

/**
 * Hide/Show strategies for toggling element visibility
 */
const HIDE_SHOW_STRATEGIES = {
    display: function (op, element, arg, runtime) {
        if (arg) {
            element.style.display = arg;
        } else if (op === "toggle") {
            if (getComputedStyle(element).display === "none") {
                HIDE_SHOW_STRATEGIES.display("show", element, arg, runtime);
            } else {
                HIDE_SHOW_STRATEGIES.display("hide", element, arg, runtime);
            }
        } else if (op === "hide") {
            const internalData = runtime.getInternalData(element);
            if (internalData.originalDisplay == null) {
                internalData.originalDisplay = element.style.display;
            }
            element.style.display = "none";
        } else {
            const internalData = runtime.getInternalData(element);
            if (internalData.originalDisplay && internalData.originalDisplay !== 'none') {
                element.style.display = internalData.originalDisplay;
            } else {
                element.style.removeProperty('display');
            }
        }
    },
    visibility: function (op, element, arg) {
        if (arg) {
            element.style.visibility = arg;
        } else if (op === "toggle") {
            if (getComputedStyle(element).visibility === "hidden") {
                HIDE_SHOW_STRATEGIES.visibility("show", element, arg);
            } else {
                HIDE_SHOW_STRATEGIES.visibility("hide", element, arg);
            }
        } else if (op === "hide") {
            element.style.visibility = "hidden";
        } else {
            element.style.visibility = "visible";
        }
    },
    opacity: function (op, element, arg) {
        if (arg) {
            element.style.opacity = arg;
        } else if (op === "toggle") {
            if (getComputedStyle(element).opacity === "0") {
                HIDE_SHOW_STRATEGIES.opacity("show", element, arg);
            } else {
                HIDE_SHOW_STRATEGIES.opacity("hide", element, arg);
            }
        } else if (op === "hide") {
            element.style.opacity = "0";
        } else {
            element.style.opacity = "1";
        }
    },
};

/**
 * VisibilityCommand - Base class for show/hide/toggle commands
 * Provides shared parsing helpers for visibility-related commands
 */
class VisibilityCommand extends Command {
    static parseShowHideTarget(parser) {
        var currentTokenValue = parser.currentToken();
        if (currentTokenValue.value === "when" || currentTokenValue.value === "with" || parser.commandBoundary(currentTokenValue)) {
            return parser.parseElement("implicitMeTarget");
        } else {
            return parser.parseElement("expression");
        }
    }

    static resolveHideShowStrategy(parser, name) {
        var configDefault = config.defaultHideShowStrategy;
        var strategies = HIDE_SHOW_STRATEGIES;
        if (config.hideShowStrategies) {
            strategies = Object.assign({}, strategies, config.hideShowStrategies);
        }
        name = name || configDefault || "display";
        var value = strategies[name];
        if (value == null) {
            parser.raiseParseError("Unknown show/hide strategy : " + name);
        }
        return value;
    }
}

/**
 * AddCommand - Add classes, attributes, or CSS to elements
 *
 * Parses: add .class to target | add @attr to target | add {css} to target
 * Executes: Adds classes/attributes/CSS to target elements
 */
export class AddCommand extends Command {
    static keyword = "add";

    constructor(variant, classRefs, attributeRef, cssDeclaration, toExpr, when) {
        super();
        this.variant = variant;
        this.classRefs = classRefs;
        this.attributeRef = attributeRef;
        this.cssDeclaration = cssDeclaration;
        this.to = toExpr;
        this.toExpr = toExpr;
        this.when = when;
        if (variant === "class") {
            this.args = [toExpr, classRefs];
        } else if (variant === "attribute") {
            this.args = [toExpr];
        } else {
            this.args = [toExpr, cssDeclaration];
        }
    }

    static parse(parser) {
        if (!parser.matchToken("add")) return;

        var classRef = parser.parseElement("classRef");
        var attributeRef = null;
        var cssDeclaration = null;
        if (classRef == null) {
            attributeRef = parser.parseElement("attributeRef");
            if (attributeRef == null) {
                cssDeclaration = parser.parseElement("styleLiteral");
                if (cssDeclaration == null) {
                    parser.raiseParseError("Expected either a class reference or attribute expression");
                }
            }
        } else {
            var classRefs = [classRef];
            while ((classRef = parser.parseElement("classRef"))) {
                classRefs.push(classRef);
            }
        }

        if (parser.matchToken("to")) {
            var toExpr = parser.requireElement("expression");
        } else {
            var toExpr = parser.requireElement("implicitMeTarget");
        }

        if (parser.matchToken("when")) {
            if (cssDeclaration) {
                parser.raiseParseError("Only class and properties are supported with a when clause")
            }
            var when = parser.requireElement("expression");
        }

        if (classRefs) {
            return new AddCommand("class", classRefs, null, null, toExpr, when);
        } else if (attributeRef) {
            return new AddCommand("attribute", null, attributeRef, null, toExpr, when);
        } else {
            return new AddCommand("css", null, null, cssDeclaration, toExpr, null);
        }
    }

    resolve(context, to, secondArg) {
        context.meta.runtime.nullCheck(to, this.toExpr);
        if (this.variant === "class") {
            var classRefs = secondArg;
            const when = this.when;
            context.meta.runtime.forEach(classRefs, function (classRef) {
                context.meta.runtime.implicitLoop(to, function (target) {
                    if (when) {
                        context.result = target;
                        let whenResult = context.meta.runtime.evaluateNoPromise(when, context);
                        if (whenResult) {
                            if (target instanceof Element) target.classList.add(classRef.className);
                        } else {
                            if (target instanceof Element) target.classList.remove(classRef.className);
                        }
                        context.result = null;
                    } else {
                        if (target instanceof Element) target.classList.add(classRef.className);
                    }
                });
            });
        } else if (this.variant === "attribute") {
            const attributeRef = this.attributeRef;
            const when = this.when;
            context.meta.runtime.implicitLoop(to, function (target) {
                if (when) {
                    context.result = target;
                    let whenResult = context.meta.runtime.evaluateNoPromise(when, context);
                    if (whenResult) {
                        target.setAttribute(attributeRef.name, attributeRef.value);
                    } else {
                        target.removeAttribute(attributeRef.name);
                    }
                    context.result = null;
                } else {
                    target.setAttribute(attributeRef.name, attributeRef.value);
                }
            });
        } else {
            var css = secondArg;
            context.meta.runtime.implicitLoop(to, function (target) {
                target.style.cssText += css;
            });
        }
        return context.meta.runtime.findNext(this, context);
    }
}

/**
 * RemoveCommand - Remove classes, attributes, or elements
 *
 * Parses: remove .class from target | remove @attr from target | remove element [from container]
 * Executes: Removes classes/attributes or removes element from DOM
 */
export class RemoveCommand extends Command {
    static keyword = "remove";

    constructor(variant, elementExpr, classRefs, attributeRef, fromExpr) {
        super();
        this.variant = variant;
        this.elementExpr = elementExpr;
        this.classRefs = classRefs;
        this.attributeRef = attributeRef;
        this.from = fromExpr;
        this.fromExpr = fromExpr;
        if (variant === "element") {
            this.args = [elementExpr, fromExpr];
        } else {
            this.args = [classRefs, fromExpr];
        }
    }

    static parse(parser) {
        if (!parser.matchToken("remove")) return;

        var classRef = parser.parseElement("classRef");
        var attributeRef = null;
        var elementExpr = null;
        if (classRef == null) {
            attributeRef = parser.parseElement("attributeRef");
            if (attributeRef == null) {
                elementExpr = parser.parseElement("expression");
                if (elementExpr == null) {
                    parser.raiseParseError(
                        "Expected either a class reference, attribute expression or value expression"
                    );
                }
            }
        } else {
            var classRefs = [classRef];
            while ((classRef = parser.parseElement("classRef"))) {
                classRefs.push(classRef);
            }
        }

        if (parser.matchToken("from")) {
            var fromExpr = parser.requireElement("expression");
        } else {
            if (elementExpr == null) {
                var fromExpr = parser.requireElement("implicitMeTarget");
            }
        }

        if (elementExpr) {
            return new RemoveCommand("element", elementExpr, null, null, fromExpr);
        } else {
            return new RemoveCommand("classOrAttr", null, classRefs, attributeRef, fromExpr);
        }
    }

    resolve(context, firstArg, secondArg) {
        if (this.variant === "element") {
            var element = firstArg;
            var from = secondArg;
            context.meta.runtime.nullCheck(element, this.elementExpr);
            context.meta.runtime.implicitLoop(element, function (target) {
                if (target.parentElement && (from == null || from.contains(target))) {
                    target.parentElement.removeChild(target);
                }
            });
        } else {
            var classRefs = firstArg;
            var from = secondArg;
            context.meta.runtime.nullCheck(from, this.fromExpr);
            if (classRefs) {
                context.meta.runtime.forEach(classRefs, function (classRef) {
                    context.meta.runtime.implicitLoop(from, function (target) {
                        target.classList.remove(classRef.className);
                    });
                });
            } else {
                const attributeRef = this.attributeRef;
                context.meta.runtime.implicitLoop(from, function (target) {
                    target.removeAttribute(attributeRef.name);
                });
            }
        }
        return context.meta.runtime.findNext(this, context);
    }
}

/**
 * ToggleCommand - Toggle classes, attributes, or visibility
 *
 * Parses: toggle .class on target | toggle @attr on target | toggle *visibility | toggle between .class1 and .class2
 * Executes: Toggles classes/attributes or visibility state
 */
export class ToggleCommand extends VisibilityCommand {
    static keyword = "toggle";

    constructor(classRef, classRef2, classRefs, attributeRef, onExpr, time, evt, from, visibility, between, hideShowStrategy) {
        super();
        this.type = "toggleCommand";
        this.classRef = classRef;
        this.classRef2 = classRef2;
        this.classRefs = classRefs;
        this.attributeRef = attributeRef;
        this.on = onExpr;
        this.time = time;
        this.evt = evt;
        this.from = from;
        this.visibility = visibility;
        this.between = between;
        this.hideShowStrategy = hideShowStrategy;
        this.onExpr = onExpr;
        this.args = [onExpr, time, evt, from, classRef, classRef2, classRefs];
    }

    static parse(parser) {
        if (!parser.matchToken("toggle")) return;
        parser.matchAnyToken("the", "my");

        var visibility = false;
        var between = false;
        var hideShowStrategy = null;
        var onExpr = null;
        var classRef = null;
        var classRef2 = null;
        var classRefs = null;
        var attributeRef = null;

        if (parser.currentToken().type === "STYLE_REF") {
            let styleRef = parser.consumeToken();
            var name = styleRef.value.substr(1);
            visibility = true;
            hideShowStrategy = VisibilityCommand.resolveHideShowStrategy(parser, name);
            if (parser.matchToken("of")) {
                parser.pushFollow("with");
                try {
                    onExpr = parser.requireElement("expression");
                } finally {
                    parser.popFollow();
                }
            } else {
                onExpr = parser.requireElement("implicitMeTarget");
            }
        } else if (parser.matchToken("between")) {
            between = true;
            classRef = parser.parseElement("classRef");
            parser.requireToken("and");
            classRef2 = parser.requireElement("classRef");
        } else {
            classRef = parser.parseElement("classRef");
            if (classRef == null) {
                attributeRef = parser.parseElement("attributeRef");
                if (attributeRef == null) {
                    parser.raiseParseError("Expected either a class reference or attribute expression");
                }
            } else {
                classRefs = [classRef];
                while ((classRef = parser.parseElement("classRef"))) {
                    classRefs.push(classRef);
                }
            }
        }

        if (visibility !== true) {
            if (parser.matchToken("on")) {
                onExpr = parser.requireElement("expression");
            } else {
                onExpr = parser.requireElement("implicitMeTarget");
            }
        }

        var time = null;
        var evt = null;
        var from = null;

        if (parser.matchToken("for")) {
            time = parser.requireElement("expression");
        } else if (parser.matchToken("until")) {
            evt = parser.requireElement("dotOrColonPath", "Expected event name");
            if (parser.matchToken("from")) {
                from = parser.requireElement("expression");
            }
        }

        return new ToggleCommand(classRef, classRef2, classRefs, attributeRef, onExpr, time, evt, from, visibility, between, hideShowStrategy);
    }

    toggle(context, on, classRef, classRef2, classRefs) {
        context.meta.runtime.nullCheck(on, this.onExpr);
        if (this.visibility) {
            context.meta.runtime.implicitLoop(on, (target) => {
                this.hideShowStrategy("toggle", target, null, context.meta.runtime);
            });
        } else if (this.between) {
            context.meta.runtime.implicitLoop(on, (target) => {
                if (target.classList.contains(classRef.className)) {
                    target.classList.remove(classRef.className);
                    target.classList.add(classRef2.className);
                } else {
                    target.classList.add(classRef.className);
                    target.classList.remove(classRef2.className);
                }
            });
        } else if (classRefs) {
            context.meta.runtime.forEach(classRefs, (classRef) => {
                context.meta.runtime.implicitLoop(on, (target) => {
                    target.classList.toggle(classRef.className);
                });
            });
        } else {
            context.meta.runtime.implicitLoop(on, (target) => {
                if (target.hasAttribute(this.attributeRef.name)) {
                    target.removeAttribute(this.attributeRef.name);
                } else {
                    target.setAttribute(this.attributeRef.name, this.attributeRef.value);
                }
            });
        }
    }

    resolve(context, on, time, evt, from, classRef, classRef2, classRefs) {
        if (time) {
            return new Promise((resolve) => {
                this.toggle(context, on, classRef, classRef2, classRefs);
                setTimeout(() => {
                    this.toggle(context, on, classRef, classRef2, classRefs);
                    resolve(context.meta.runtime.findNext(this, context));
                }, time);
            });
        } else if (evt) {
            return new Promise((resolve) => {
                var target = from || context.me;
                target.addEventListener(
                    evt,
                    () => {
                        this.toggle(context, on, classRef, classRef2, classRefs);
                        resolve(context.meta.runtime.findNext(this, context));
                    },
                    { once: true }
                );
                this.toggle(context, on, classRef, classRef2, classRefs);
            });
        } else {
            this.toggle(context, on, classRef, classRef2, classRefs);
            return context.meta.runtime.findNext(this, context);
        }
    }
}

/**
 * HideCommand - Hide elements using various strategies
 *
 * Parses: hide target [with display|visibility|opacity]
 * Executes: Hides target element using specified strategy
 */
export class HideCommand extends VisibilityCommand {
    static keyword = "hide";

    constructor(targetExpr, hideShowStrategy) {
        super();
        this.type = "hideCommand";
        this.target = targetExpr;
        this.targetExpr = targetExpr;
        this.hideShowStrategy = hideShowStrategy;
        this.args = [targetExpr];
    }

    static parse(parser) {
        if (!parser.matchToken("hide")) return;

        var targetExpr = VisibilityCommand.parseShowHideTarget(parser);

        var name = null;
        if (parser.matchToken("with")) {
            name = parser.requireTokenType("IDENTIFIER", "STYLE_REF").value;
            if (name.indexOf("*") === 0) {
                name = name.substr(1);
            }
        }
        var hideShowStrategy = VisibilityCommand.resolveHideShowStrategy(parser, name);

        return new HideCommand(targetExpr, hideShowStrategy);
    }

    resolve(ctx, target) {
        ctx.meta.runtime.nullCheck(target, this.targetExpr);
        ctx.meta.runtime.implicitLoop(target, (elt) => {
            this.hideShowStrategy("hide", elt, null, ctx.meta.runtime);
        });
        return ctx.meta.runtime.findNext(this, ctx);
    }
}

/**
 * ShowCommand - Show elements using various strategies
 *
 * Parses: show target [with display|visibility|opacity] [:value] [when condition]
 * Executes: Shows target element using specified strategy
 */
export class ShowCommand extends VisibilityCommand {
    static keyword = "show";

    constructor(targetExpr, when, arg, hideShowStrategy) {
        super();
        this.type = "showCommand";
        this.target = targetExpr;
        this.targetExpr = targetExpr;
        this.when = when;
        this.arg = arg;
        this.hideShowStrategy = hideShowStrategy;
        this.args = [targetExpr];
    }

    static parse(parser) {
        if (!parser.matchToken("show")) return;

        var targetExpr = VisibilityCommand.parseShowHideTarget(parser);

        var name = null;
        if (parser.matchToken("with")) {
            name = parser.requireTokenType("IDENTIFIER", "STYLE_REF").value;
            if (name.indexOf("*") === 0) {
                name = name.substr(1);
            }
        }
        var arg = null;
        if (parser.matchOpToken(":")) {
            var tokenArr = parser.consumeUntilWhitespace();
            parser.matchTokenType("WHITESPACE");
            arg = tokenArr
                .map(function (t) {
                    return t.value;
                })
                .join("");
        }

        if (parser.matchToken("when")) {
            var when = parser.requireElement("expression");
        }

        var hideShowStrategy = VisibilityCommand.resolveHideShowStrategy(parser, name);

        return new ShowCommand(targetExpr, when, arg, hideShowStrategy);
    }

    resolve(ctx, target) {
        ctx.meta.runtime.nullCheck(target, this.targetExpr);
        ctx.meta.runtime.implicitLoop(target, (elt) => {
            if (this.when) {
                ctx.result = elt;
                let whenResult = ctx.meta.runtime.evaluateNoPromise(this.when, ctx);
                if (whenResult) {
                    this.hideShowStrategy("show", elt, this.arg, ctx.meta.runtime);
                } else {
                    this.hideShowStrategy("hide", elt, null, ctx.meta.runtime);
                }
                ctx.result = null;
            } else {
                this.hideShowStrategy("show", elt, this.arg, ctx.meta.runtime);
            }
        });
        return ctx.meta.runtime.findNext(this, ctx);
    }
}

/**
 * Parse pseudopossessive targets (the/its/my element's)
 * Shared by MeasureCommand and TransitionCommand
 */
export function parsePseudopossessiveTarget(parser) {
    var targets;
    if (
        parser.matchToken("the") ||
        parser.matchToken("element") ||
        parser.matchToken("elements") ||
        parser.currentToken().type === "CLASS_REF" ||
        parser.currentToken().type === "ID_REF" ||
        (parser.currentToken().op && parser.currentToken().value === "<")
    ) {
        parser.possessivesDisabled = true;
        try {
            targets = parser.parseElement("expression");
        } finally {
            delete parser.possessivesDisabled;
        }
        // optional possessive
        if (parser.matchOpToken("'")) {
            parser.requireToken("s");
        }
    } else if (parser.currentToken().type === "IDENTIFIER" && parser.currentToken().value === "its") {
        var identifier = parser.matchToken("its");
        targets = new PseudopossessiveIts(identifier);
    } else {
        parser.matchToken("my") || parser.matchToken("me"); // consume optional 'my'
        targets = parser.parseElement("implicitMeTarget");
    }
    return targets;
}

/**
 * TakeCommand - Take classes or attributes from elements
 *
 * Parses: take <classes|attribute> [from <elements>] [for <target>]
 * Executes: Removes classes/attributes from source and adds to target
 */
export class TakeCommand extends Command {
    static keyword = "take";

    constructor(variant, classRefs, attributeRef, fromExpr, forExpr, replacementValue) {
        super();
        this.variant = variant;
        this.classRefs = classRefs;
        this.attributeRef = attributeRef;
        this.from = fromExpr;
        this.fromExpr = fromExpr;
        this.forElt = forExpr;
        this.forExpr = forExpr;
        this.replacementValue = replacementValue;
        if (variant === "class") {
            this.args = [classRefs, fromExpr, forExpr];
        } else {
            this.args = [fromExpr, forExpr, replacementValue];
        }
    }

    static parse(parser) {
        if (parser.matchToken("take")) {
            let classRef = null;
            let classRefs = [];
            while ((classRef = parser.parseElement("classRef"))) {
                classRefs.push(classRef);
            }

            var attributeRef = null;
            var replacementValue = null;

            let weAreTakingClasses = classRefs.length > 0;
            if (!weAreTakingClasses) {
                attributeRef = parser.parseElement("attributeRef");
                if (attributeRef == null) {
                    parser.raiseParseError("Expected either a class reference or attribute expression");
                }

                if (parser.matchToken("with")) {
                    replacementValue = parser.requireElement("expression");
                }
            }

            if (parser.matchToken("from")) {
                var fromExpr = parser.requireElement("expression");
            }

            if (parser.matchToken("for")) {
                var forExpr = parser.requireElement("expression");
            } else {
                var forExpr = parser.requireElement("implicitMeTarget");
            }

            if (weAreTakingClasses) {
                return new TakeCommand("class", classRefs, null, fromExpr, forExpr, null);
            } else {
                return new TakeCommand("attribute", null, attributeRef, fromExpr, forExpr, replacementValue);
            }
        }
    }

    resolve(context, firstArg, secondArg, thirdArg) {
        if (this.variant === "class") {
            var classRefs = firstArg;
            var from = secondArg;
            var forElt = thirdArg;
            context.meta.runtime.nullCheck(forElt, this.forExpr);
            context.meta.runtime.implicitLoop(classRefs, (classRef) => {
                var clazz = classRef.className;
                if (from) {
                    context.meta.runtime.implicitLoop(from, (target) => {
                        target.classList.remove(clazz);
                    });
                } else {
                    context.meta.runtime.implicitLoop(classRef, (target) => {
                        target.classList.remove(clazz);
                    });
                }
                context.meta.runtime.implicitLoop(forElt, (target) => {
                    target.classList.add(clazz);
                });
            });
        } else {
            var from = firstArg;
            var forElt = secondArg;
            var replacementValue = thirdArg;
            context.meta.runtime.nullCheck(from, this.fromExpr);
            context.meta.runtime.nullCheck(forElt, this.forExpr);
            context.meta.runtime.implicitLoop(from, (target) => {
                if (!replacementValue) {
                    target.removeAttribute(this.attributeRef.name);
                } else {
                    target.setAttribute(this.attributeRef.name, replacementValue);
                }
            });
            context.meta.runtime.implicitLoop(forElt, (target) => {
                target.setAttribute(this.attributeRef.name, this.attributeRef.value || "");
            });
        }
        return context.meta.runtime.findNext(this, context);
    }
}

/**
 * MeasureCommand - Measure element dimensions
 *
 * Parses: measure <element's> [property, ...]
 * Executes: Measures element bounds and scroll properties
 */
export class MeasureCommand extends Command {
    static keyword = "measure";

    constructor(targetExpr, propsToMeasure) {
        super();
        this.type = "measureCommand";
        this.properties = propsToMeasure;
        this.targetExpr = targetExpr;
        this.args = [targetExpr];
    }

    /**
     * Parse measure command
     * @param {Parser} parser
     * @returns {MeasureCommand | undefined}
     */
    static parse(parser) {
        if (!parser.matchToken("measure")) return;

        var targetExpr = parsePseudopossessiveTarget(parser);

        var propsToMeasure = [];
        if (!parser.commandBoundary(parser.currentToken()))
            do {
                propsToMeasure.push(parser.matchTokenType("IDENTIFIER").value);
            } while (parser.matchOpToken(","));

        return new MeasureCommand(targetExpr, propsToMeasure);
    }

    resolve(ctx, target) {
        ctx.meta.runtime.nullCheck(target, this.targetExpr);
        if (0 in target) target = target[0]; // not measuring multiple elts
        var rect = target.getBoundingClientRect();
        var scroll = {
            top: target.scrollTop,
            left: target.scrollLeft,
            topMax: target.scrollTopMax,
            leftMax: target.scrollLeftMax,
            height: target.scrollHeight,
            width: target.scrollWidth,
        };

        ctx.result = {
            x: rect.x,
            y: rect.y,
            left: rect.left,
            top: rect.top,
            right: rect.right,
            bottom: rect.bottom,
            width: rect.width,
            height: rect.height,
            bounds: rect,

            scrollLeft: scroll.left,
            scrollTop: scroll.top,
            scrollLeftMax: scroll.leftMax,
            scrollTopMax: scroll.topMax,
            scrollWidth: scroll.width,
            scrollHeight: scroll.height,
            scroll: scroll,
        };

        ctx.meta.runtime.forEach(this.properties, (prop) => {
            if (prop in ctx.result) ctx.locals[prop] = ctx.result[prop];
            else throw "No such measurement as " + prop;
        });

        return ctx.meta.runtime.findNext(this, ctx);
    }
}
