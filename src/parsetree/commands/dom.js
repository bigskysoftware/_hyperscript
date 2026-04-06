/**
 * DOM manipulation command parse tree elements
 * Web-specific commands for manipulating DOM classes, attributes, and visibility
 */

import { Command } from '../base.js';
import { config } from '../../core/config.js';

/**
 * Hide/Show strategies for toggling element visibility
 */
const HIDE_SHOW_STRATEGIES = {
    display: function (op, element, arg, runtime) {
        if (!arg && element instanceof HTMLDialogElement) {
            if (op === "hide") element.close();
            else if (op === "show") { if (!element.open) element.showModal(); }
            else if (op === "toggle") { if (element.open) element.close(); else element.showModal(); }
            return;
        }
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

/** Extract property names from a CSS text string like "color: red; font-weight: bold" */
function _cssPropertyNames(css) {
    return css.split(";").map(function (p) { return p.split(":")[0].trim(); }).filter(Boolean);
}

/** Remove named CSS properties from an element */
function _removeCssProperties(elt, propNames) {
    for (var i = 0; i < propNames.length; i++) elt.style.removeProperty(propNames[i]);
}

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
            parser.raiseError("Unknown show/hide strategy : " + name);
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

    constructor(variant, classRefs, attributeRef, cssDeclaration, toExpr, when, valueExpr) {
        super();
        this.variant = variant;
        this.classRefs = classRefs;
        this.attributeRef = attributeRef;
        this.cssDeclaration = cssDeclaration;
        this.to = toExpr;
        this.toExpr = toExpr;
        this.when = when;
        this.valueExpr = valueExpr;
        if (variant === "class") {
            this.args = { to: toExpr, classRefs };
        } else if (variant === "attribute") {
            this.args = { to: toExpr };
        } else if (variant === "collection") {
            this.args = { to: toExpr, value: valueExpr };
        } else {
            this.args = { to: toExpr, css: cssDeclaration };
        }
    }

    static parse(parser) {
        if (!parser.matchToken("add")) return;

        var classRef = parser.parseElement("classRef");
        var attributeRef = null;
        var cssDeclaration = null;
        var valueExpr = null;
        if (classRef == null) {
            attributeRef = parser.parseElement("attributeRef");
            if (attributeRef == null) {
                cssDeclaration = parser.parseElement("styleLiteral");
                if (cssDeclaration == null) {
                    // Fall through to general expression for collection support:
                    // add item to myArray, add item to mySet
                    // Only if "to" follows — otherwise it's a parse error
                    parser.pushFollow("to");
                    try { valueExpr = parser.parseElement("expression"); }
                    finally { parser.popFollow(); }
                    if (valueExpr == null || !parser.currentToken() || parser.currentToken().value !== "to") {
                        parser.raiseError("Expected either a class reference or attribute expression");
                    }
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
            var when = parser.requireElement("expression");
        }

        if (classRefs) {
            return new AddCommand("class", classRefs, null, null, toExpr, when);
        } else if (attributeRef) {
            return new AddCommand("attribute", null, attributeRef, null, toExpr, when);
        } else if (cssDeclaration) {
            return new AddCommand("css", null, null, cssDeclaration, toExpr, null);
        } else {
            return new AddCommand("collection", null, null, null, toExpr, null, valueExpr);
        }
    }

    resolve(context, { to, classRefs, css, value }) {
        var runtime = context.meta.runtime;
        var cmd = this;
        runtime.nullCheck(to, this.toExpr);
        var result;
        if (this.variant === "collection") {
            if (Array.isArray(to)) {
                to.push(value);
            } else if (to instanceof Set) {
                to.add(value);
            } else if (to instanceof Map) {
                throw new Error("Use 'set myMap[key] to value' for Maps");
            } else {
                throw new Error("Cannot add to " + typeof to);
            }
            runtime.notifyMutation(to);
            return runtime.findNext(this, context);
        } else if (this.variant === "class") {
            runtime.forEach(classRefs, function (classRef) {
                if (cmd.when) {
                    result = runtime.implicitLoopWhen(to, cmd.when, context,
                        function (t) { if (t instanceof Element) t.classList.add(classRef.className); },
                        function (t) { if (t instanceof Element) t.classList.remove(classRef.className); }
                    );
                } else {
                    runtime.implicitLoop(to, function (t) {
                        if (t instanceof Element) t.classList.add(classRef.className);
                    });
                }
            });
        } else if (this.variant === "attribute") {
            var attributeRef = this.attributeRef;
            if (this.when) {
                result = runtime.implicitLoopWhen(to, this.when, context,
                    function (t) { t.setAttribute(attributeRef.name, attributeRef.value); },
                    function (t) { t.removeAttribute(attributeRef.name); }
                );
            } else {
                runtime.implicitLoop(to, function (t) {
                    t.setAttribute(attributeRef.name, attributeRef.value);
                });
            }
        } else {
            if (this.when) {
                var propNames = _cssPropertyNames(css);
                result = runtime.implicitLoopWhen(to, this.when, context,
                    function (t) { t.style.cssText += css; },
                    function (t) { _removeCssProperties(t, propNames); }
                );
            } else {
                runtime.implicitLoop(to, function (t) {
                    t.style.cssText += css;
                });
            }
        }
        if (result && result.then) {
            return result.then(function () { return runtime.findNext(cmd, context); });
        }
        return runtime.findNext(this, context);
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

    constructor(variant, elementExpr, classRefs, attributeRef, cssDeclaration, fromExpr, when) {
        super();
        this.variant = variant;
        this.elementExpr = elementExpr;
        this.classRefs = classRefs;
        this.attributeRef = attributeRef;
        this.cssDeclaration = cssDeclaration;
        this.from = fromExpr;
        this.fromExpr = fromExpr;
        this.when = when;
        if (variant === "element") {
            this.args = { element: elementExpr, from: fromExpr };
        } else if (variant === "css") {
            this.args = { css: cssDeclaration, from: fromExpr };
        } else {
            this.args = { classRefs, from: fromExpr };
        }
    }

    static parse(parser) {
        if (!parser.matchToken("remove")) return;

        var classRef = parser.parseElement("classRef");
        var attributeRef = null;
        var cssDeclaration = null;
        var elementExpr = null;
        if (classRef == null) {
            attributeRef = parser.parseElement("attributeRef");
            if (attributeRef == null) {
                cssDeclaration = parser.parseElement("styleLiteral");
                if (cssDeclaration == null) {
                    elementExpr = parser.parseElement("expression");
                    if (elementExpr == null) {
                        parser.raiseError(
                            "Expected either a class reference, attribute expression or value expression"
                        );
                    }
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

        if (parser.matchToken("when")) {
            if (elementExpr) {
                parser.raiseError("'when' clause is not supported when removing elements");
            }
            var when = parser.requireElement("expression");
        }

        if (elementExpr) {
            return new RemoveCommand("element", elementExpr, null, null, null, fromExpr);
        } else if (cssDeclaration) {
            return new RemoveCommand("css", null, null, null, cssDeclaration, fromExpr, when);
        } else {
            return new RemoveCommand("classOrAttr", null, classRefs, attributeRef, null, fromExpr, when);
        }
    }

    resolve(context, { element, classRefs, css, from }) {
        var runtime = context.meta.runtime;
        var cmd = this;
        var result;
        if (this.variant === "element") {
            runtime.nullCheck(element, this.elementExpr);
            if (from != null && Array.isArray(from)) {
                var idx = from.indexOf(element);
                if (idx > -1) from.splice(idx, 1);
                runtime.notifyMutation(from);
            } else if (from instanceof Set) {
                from.delete(element);
                runtime.notifyMutation(from);
            } else if (from instanceof Map) {
                from.delete(element);
                runtime.notifyMutation(from);
            } else {
                runtime.implicitLoop(element, function (target) {
                    if (target.parentElement && (from == null || from.contains(target))) {
                        target.parentElement.removeChild(target);
                    }
                });
            }
        } else if (this.variant === "css") {
            runtime.nullCheck(from, this.fromExpr);
            var propNames = _cssPropertyNames(css);
            runtime.implicitLoop(from, function (target) {
                _removeCssProperties(target, propNames);
            });
        } else {
            runtime.nullCheck(from, this.fromExpr);
            if (classRefs) {
                runtime.forEach(classRefs, function (classRef) {
                    if (cmd.when) {
                        result = runtime.implicitLoopWhen(from, cmd.when, context,
                            function (t) { t.classList.remove(classRef.className); },
                            function (t) { t.classList.add(classRef.className); }
                        );
                    } else {
                        runtime.implicitLoop(from, function (t) {
                            t.classList.remove(classRef.className);
                        });
                    }
                });
            } else {
                var attributeRef = this.attributeRef;
                if (this.when) {
                    result = runtime.implicitLoopWhen(from, this.when, context,
                        function (t) { t.removeAttribute(attributeRef.name); },
                        function (t) { t.setAttribute(attributeRef.name, attributeRef.value); }
                    );
                } else {
                    runtime.implicitLoop(from, function (t) {
                        t.removeAttribute(attributeRef.name);
                    });
                }
            }
        }
        if (result && result.then) {
            return result.then(function () { return runtime.findNext(cmd, context); });
        }
        return runtime.findNext(this, context);
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

    constructor(classRef, classRef2, classRefs, attributeRef, attributeRef2, onExpr, time, evt, from, visibility, betweenClass, betweenAttr, hideShowStrategy) {
        super();
        this.classRef = classRef;
        this.classRef2 = classRef2;
        this.classRefs = classRefs;
        this.attributeRef = attributeRef;
        this.attributeRef2 = attributeRef2;
        this.on = onExpr;
        this.time = time;
        this.evt = evt;
        this.from = from;
        this.visibility = visibility;
        this.betweenClass = betweenClass;
        this.betweenAttr = betweenAttr;
        this.hideShowStrategy = hideShowStrategy;
        this.onExpr = onExpr;
        this.args = { on: onExpr, time, evt, from, classRef, classRef2, classRefs };
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
            var name = styleRef.value.slice(1);
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
            classRef = parser.parseElement("classRef");
            if (classRef != null) {
                var betweenClass = true;
                parser.requireToken("and");
                classRef2 = parser.requireElement("classRef");
            } else {
                var betweenAttr = true;
                var attributeRef = parser.parseElement("attributeRef");
                if (attributeRef == null) {
                    parser.raiseError("Expected either a class reference or attribute expression");
                }
                parser.requireToken("and");
                var attributeRef2 = parser.requireElement("attributeRef");
            }
        } else {
            classRef = parser.parseElement("classRef");
            if (classRef == null) {
                attributeRef = parser.parseElement("attributeRef");
                if (attributeRef == null) {
                    parser.raiseError("Expected either a class reference or attribute expression");
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

        return new ToggleCommand(classRef, classRef2, classRefs, attributeRef, attributeRef2, onExpr, time, evt, from, visibility, betweenClass, betweenAttr, hideShowStrategy);
    }

    toggle(context, on, classRef, classRef2, classRefs) {
        context.meta.runtime.nullCheck(on, this.onExpr);
        if (this.visibility) {
            context.meta.runtime.implicitLoop(on, (target) => {
                this.hideShowStrategy("toggle", target, null, context.meta.runtime);
            });
        } else if (this.betweenClass) {
            context.meta.runtime.implicitLoop(on, (target) => {
                if (target.classList.contains(classRef.className)) {
                    target.classList.remove(classRef.className);
                    target.classList.add(classRef2.className);
                } else {
                    target.classList.add(classRef.className);
                    target.classList.remove(classRef2.className);
                }
            });
        } else if (this.betweenAttr) {
            context.meta.runtime.implicitLoop(on, (target) => {
                if (target.hasAttribute(this.attributeRef.name) &&
                    target.getAttribute(this.attributeRef.name) === this.attributeRef.value) {
                    target.removeAttribute(this.attributeRef.name);
                    target.setAttribute(this.attributeRef2.name, this.attributeRef2.value);
                } else {
                    if (target.hasAttribute(this.attributeRef2.name)) target.removeAttribute(this.attributeRef2.name);
                    target.setAttribute(this.attributeRef.name, this.attributeRef.value);
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

    resolve(context, { on, time, evt, from, classRef, classRef2, classRefs }) {
        if (time) {
            return new Promise((resolve) => {
                this.toggle(context, on, classRef, classRef2, classRefs);
                setTimeout(() => {
                    this.toggle(context, on, classRef, classRef2, classRefs);
                    resolve(this.findNext(context));
                }, time);
            });
        } else if (evt) {
            return new Promise((resolve) => {
                var target = from || context.me;
                target.addEventListener(
                    evt,
                    () => {
                        this.toggle(context, on, classRef, classRef2, classRefs);
                        resolve(this.findNext(context));
                    },
                    { once: true }
                );
                this.toggle(context, on, classRef, classRef2, classRefs);
            });
        } else {
            this.toggle(context, on, classRef, classRef2, classRefs);
            return this.findNext(context);
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

    constructor(targetExpr, when, hideShowStrategy) {
        super();
        this.target = targetExpr;
        this.targetExpr = targetExpr;
        this.when = when;
        this.hideShowStrategy = hideShowStrategy;
        this.args = { target: targetExpr };
    }

    static parse(parser) {
        if (!parser.matchToken("hide")) return;

        var targetExpr = VisibilityCommand.parseShowHideTarget(parser);

        var name = null;
        if (parser.matchToken("with")) {
            name = parser.requireTokenType("IDENTIFIER", "STYLE_REF").value;
            if (name.startsWith("*")) {
                name = name.slice(1);
            }
        }

        if (parser.matchToken("when")) {
            var when = parser.requireElement("expression");
        }

        var hideShowStrategy = VisibilityCommand.resolveHideShowStrategy(parser, name);

        return new HideCommand(targetExpr, when, hideShowStrategy);
    }

    resolve(ctx, { target }) {
        var runtime = ctx.meta.runtime;
        var cmd = this;
        runtime.nullCheck(target, this.targetExpr);
        if (this.when) {
            var result = runtime.implicitLoopWhen(target, this.when, ctx,
                function (elt) { cmd.hideShowStrategy("hide", elt, null, runtime); },
                function (elt) { cmd.hideShowStrategy("show", elt, null, runtime); }
            );
            if (result && result.then) {
                return result.then(function () { return runtime.findNext(cmd, ctx); });
            }
        } else {
            runtime.implicitLoop(target, function (elt) {
                cmd.hideShowStrategy("hide", elt, null, runtime);
            });
        }
        return runtime.findNext(this, ctx);
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
        this.target = targetExpr;
        this.targetExpr = targetExpr;
        this.when = when;
        this.arg = arg;
        this.hideShowStrategy = hideShowStrategy;
        this.args = { target: targetExpr };
    }

    static parse(parser) {
        if (!parser.matchToken("show")) return;

        var targetExpr = VisibilityCommand.parseShowHideTarget(parser);

        var name = null;
        if (parser.matchToken("with")) {
            name = parser.requireTokenType("IDENTIFIER", "STYLE_REF").value;
            if (name.startsWith("*")) {
                name = name.slice(1);
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

    resolve(ctx, { target }) {
        var runtime = ctx.meta.runtime;
        var cmd = this;
        runtime.nullCheck(target, this.targetExpr);
        if (this.when) {
            var result = runtime.implicitLoopWhen(target, this.when, ctx,
                function (elt) { cmd.hideShowStrategy("show", elt, cmd.arg, runtime); },
                function (elt) { cmd.hideShowStrategy("hide", elt, null, runtime); }
            );
            if (result && result.then) {
                return result.then(function () { return runtime.findNext(cmd, ctx); });
            }
        } else {
            runtime.implicitLoop(target, function (elt) {
                cmd.hideShowStrategy("show", elt, cmd.arg, runtime);
            });
        }
        return runtime.findNext(this, ctx);
    }
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
            this.args = { classRefs, from: fromExpr, forElt: forExpr };
        } else {
            this.args = { from: fromExpr, forElt: forExpr, replacementValue };
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
                    parser.raiseError("Expected either a class reference or attribute expression");
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

    resolve(context, { classRefs, from, forElt, replacementValue }) {
        if (this.variant === "class") {
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
        return this.findNext(context);
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
        this.properties = propsToMeasure;
        this.targetExpr = targetExpr;
        this.args = { target: targetExpr };
    }

    static parse(parser) {
        if (!parser.matchToken("measure")) return;

        var targetExpr;
        var propsToMeasure = [];

        var MEASURE_PROPS = ["x", "y", "left", "top", "right", "bottom",
            "width", "height", "bounds", "scrollLeft", "scrollTop",
            "scrollLeftMax", "scrollTopMax", "scrollWidth", "scrollHeight", "scroll"];

        if (parser.commandBoundary(parser.currentToken())) {
            targetExpr = parser.parseElement("implicitMeTarget");
        } else {
            var expr = parser.requireElement("expression");
            if (expr.type === "symbol" && MEASURE_PROPS.includes(expr.name)) {
                // bare identifier like "top" — it's a measurement property, target is me
                targetExpr = parser.parseElement("implicitMeTarget");
                propsToMeasure.push(expr.name);
            } else if (expr.type === "possessive" && expr.prop) {
                // "my top" or "#el's top" — root is target, prop is first measurement
                targetExpr = expr.root;
                propsToMeasure.push(expr.prop.value);
            } else if (expr.type === "ofExpression" && expr.prop) {
                // "top of #el"
                targetExpr = expr.root;
                propsToMeasure.push(expr.prop.value);
            } else {
                // just a target, e.g. "measure me" or "measure #el"
                targetExpr = expr;
            }
        }

        // additional comma-separated measurement properties
        while (parser.matchOpToken(",")) {
            propsToMeasure.push(parser.requireTokenType("IDENTIFIER").value);
        }

        return new MeasureCommand(targetExpr, propsToMeasure);
    }

    resolve(ctx, { target }) {
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
            else throw new Error("No such measurement as " + prop);
        });

        return this.findNext(ctx);
    }
}

/**
 * FocusCommand - Focus an element
 *
 * Parses: focus [<expr>]
 */
export class FocusCommand extends Command {
    static keyword = "focus";

    constructor(target) {
        super();
        this.args = { target };
    }

    static parse(parser) {
        if (!parser.matchToken("focus")) return;
        var target = null;
        if (!parser.commandBoundary(parser.currentToken())) {
            target = parser.requireElement("expression");
        }
        return new FocusCommand(target);
    }

    resolve(ctx, { target }) {
        (target || ctx.me).focus();
        return this.findNext(ctx);
    }
}

/**
 * BlurCommand - Blur (unfocus) an element
 *
 * Parses: blur [<expr>]
 */
export class BlurCommand extends Command {
    static keyword = "blur";

    constructor(target) {
        super();
        this.args = { target };
    }

    static parse(parser) {
        if (!parser.matchToken("blur")) return;
        var target = null;
        if (!parser.commandBoundary(parser.currentToken())) {
            target = parser.requireElement("expression");
        }
        return new BlurCommand(target);
    }

    resolve(ctx, { target }) {
        (target || ctx.me).blur();
        return this.findNext(ctx);
    }
}

/**
 * EmptyCommand - Clear an element's content
 *
 * Parses: empty [<expr>]
 */
export class EmptyCommand extends Command {
    static keyword = "empty";

    constructor(target) {
        super();
        this.args = { target };
    }

    static parse(parser) {
        if (!parser.matchToken("empty")) return;
        var target = null;
        if (!parser.commandBoundary(parser.currentToken())) {
            target = parser.requireElement("expression");
        }
        return new EmptyCommand(target);
    }

    resolve(ctx, { target }) {
        var elt = target || ctx.me;
        if (Array.isArray(elt)) {
            elt.splice(0);
            ctx.meta.runtime.notifyMutation(elt);
        } else if (elt instanceof Set || elt instanceof Map) {
            elt.clear();
            ctx.meta.runtime.notifyMutation(elt);
        } else {
            ctx.meta.runtime.implicitLoop(elt, function (e) {
                e.replaceChildren();
            });
        }
        return this.findNext(ctx);
    }
}

function _openElement(elt) {
    if (elt instanceof HTMLDialogElement) {
        if (!elt.open) elt.showModal();
    } else if (elt instanceof HTMLDetailsElement) {
        elt.open = true;
    } else if (elt.hasAttribute && elt.hasAttribute("popover")) {
        elt.showPopover();
    } else if (typeof elt.open === "function") {
        elt.open();
    }
}

function _closeElement(elt) {
    if (elt instanceof HTMLDialogElement) {
        elt.close();
    } else if (elt instanceof HTMLDetailsElement) {
        elt.open = false;
    } else if (elt.hasAttribute && elt.hasAttribute("popover")) {
        elt.hidePopover();
    } else if (typeof elt.close === "function") {
        elt.close();
    }
}

/**
 * OpenCommand - Open dialogs, details, popovers, or enter fullscreen
 *
 * Parses: open [fullscreen] [<expr>]
 */
export class OpenCommand extends Command {
    static keyword = "open";

    constructor(target, fullscreen) {
        super();
        this.fullscreen = fullscreen;
        this.args = { target };
    }

    static parse(parser) {
        if (!parser.matchToken("open")) return;
        var fullscreen = parser.matchToken("fullscreen");
        var target = null;
        if (!parser.commandBoundary(parser.currentToken())) {
            target = parser.requireElement("expression");
        }
        return new OpenCommand(target, !!fullscreen);
    }

    resolve(ctx, { target }) {
        var elt = target || ctx.me;
        if (this.fullscreen) {
            return (target || document.documentElement).requestFullscreen().then(() => {
                return this.findNext(ctx);
            });
        }
        ctx.meta.runtime.implicitLoop(elt, _openElement);
        return this.findNext(ctx);
    }
}

/**
 * CloseCommand - Close dialogs, details, popovers, or exit fullscreen
 *
 * Parses: close [fullscreen] [<expr>]
 */
export class CloseCommand extends Command {
    static keyword = "close";

    constructor(target, fullscreen) {
        super();
        this.fullscreen = fullscreen;
        this.args = { target };
    }

    static parse(parser) {
        if (!parser.matchToken("close")) return;
        var fullscreen = parser.matchToken("fullscreen");
        var target = null;
        if (!parser.commandBoundary(parser.currentToken())) {
            target = parser.requireElement("expression");
        }
        return new CloseCommand(target, !!fullscreen);
    }

    resolve(ctx, { target }) {
        if (this.fullscreen) {
            return document.exitFullscreen().then(() => {
                return this.findNext(ctx);
            });
        }
        var elt = target || ctx.me;
        ctx.meta.runtime.implicitLoop(elt, _closeElement);
        return this.findNext(ctx);
    }
}

/**
 * SpeakCommand - Speak text using the Web Speech API
 *
 * Parses: speak <expr> [with voice <expr>] [with rate <expr>] [with pitch <expr>] [with volume <expr>]
 */
export class SpeakCommand extends Command {
    static keyword = "speak";

    constructor(text, voice, rate, pitch, volume) {
        super();
        this.voice = voice;
        this.rate = rate;
        this.pitch = pitch;
        this.volume = volume;
        this.args = { text, voice, rate, pitch, volume };
    }

    static parse(parser) {
        if (!parser.matchToken("speak")) return;
        var text = parser.requireElement("expression");
        var voice = null, rate = null, pitch = null, volume = null;
        while (parser.matchToken("with")) {
            if (parser.matchToken("voice")) {
                voice = parser.requireElement("expression");
            } else if (parser.matchToken("rate")) {
                rate = parser.requireElement("expression");
            } else if (parser.matchToken("pitch")) {
                pitch = parser.requireElement("expression");
            } else if (parser.matchToken("volume")) {
                volume = parser.requireElement("expression");
            } else {
                parser.raiseExpected('voice', 'rate', 'pitch', 'volume');
            }
        }
        return new SpeakCommand(text, voice, rate, pitch, volume);
    }

    resolve(ctx, { text, voice, rate, pitch, volume }) {
        var utterance = new SpeechSynthesisUtterance(String(text));
        if (voice) {
            var voices = speechSynthesis.getVoices();
            var match = voices.find(v => v.name === voice);
            if (match) utterance.voice = match;
        }
        if (rate != null) utterance.rate = rate;
        if (pitch != null) utterance.pitch = pitch;
        if (volume != null) utterance.volume = volume;
        var cmd = this;
        return new Promise(function (resolve) {
            utterance.onend = function () {
                resolve(ctx.meta.runtime.findNext(cmd, ctx));
            };
            speechSynthesis.speak(utterance);
        });
    }
}

/**
 * SelectCommand - Select text in an input or textarea
 *
 * Parses: select [<expr>]
 */
export class SelectCommand extends Command {
    static keyword = "select";

    constructor(target) {
        super();
        this.args = { target };
    }

    static parse(parser) {
        if (!parser.matchToken("select")) return;
        var target = null;
        if (!parser.commandBoundary(parser.currentToken())) {
            target = parser.requireElement("expression");
        }
        return new SelectCommand(target);
    }

    resolve(ctx, { target }) {
        var elt = target || ctx.me;
        if (typeof elt.select === "function") elt.select();
        return this.findNext(ctx);
    }
}

/**
 * AskCommand - Prompt the user for input
 *
 * Parses: ask <expr>
 */
export class AskCommand extends Command {
    static keyword = "ask";

    constructor(message) {
        super();
        this.args = { message };
    }

    static parse(parser) {
        if (!parser.matchToken("ask")) return;
        var message = parser.requireElement("expression");
        return new AskCommand(message);
    }

    resolve(ctx, { message }) {
        ctx.result = prompt(String(message));
        return this.findNext(ctx);
    }
}

/**
 * AnswerCommand - Show an alert or confirm dialog
 *
 * Parses: answer <expr> [with <expr> or <expr>]
 */
export class AnswerCommand extends Command {
    static keyword = "answer";

    constructor(message, choiceA, choiceB) {
        super();
        this.choiceA = choiceA;
        this.choiceB = choiceB;
        this.args = { message, choiceA, choiceB };
    }

    static parse(parser) {
        if (!parser.matchToken("answer")) return;
        var message = parser.requireElement("expression");
        var choiceA = null, choiceB = null;
        if (parser.matchToken("with")) {
            parser.pushFollow("or");
            try {
                choiceA = parser.requireElement("expression");
            } finally {
                parser.popFollow();
            }
            parser.requireToken("or");
            choiceB = parser.requireElement("expression");
        }
        return new AnswerCommand(message, choiceA, choiceB);
    }

    resolve(ctx, { message, choiceA, choiceB }) {
        if (choiceA) {
            ctx.result = confirm(String(message)) ? choiceA : choiceB;
        } else {
            alert(String(message));
        }
        return this.findNext(ctx);
    }
}

/**
 * MorphCommand - Morph an element to match new content
 *
 * Parses: morph <target> to <content>
 * Executes: Morphs the target element to match the new content,
 *           preserving DOM node identity, focus, and event listeners
 */
export class MorphCommand extends Command {
    static keyword = "morph";

    constructor(target, content) {
        super();
        this.args = { target, content };
    }

    static parse(parser) {
        if (!parser.matchToken("morph")) return;
        var target = parser.requireElement("expression");
        parser.requireToken("to");
        var content = parser.requireElement("expression");
        return new MorphCommand(target, content);
    }

    resolve(ctx, { target, content }) {
        ctx.meta.runtime.implicitLoop(target, function (elt) {
            ctx.meta.runtime.morph(elt, content);
        });
        return this.findNext(ctx);
    }
}
