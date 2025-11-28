// Web/DOM grammar for _hyperscript
import { Lexer } from '../core/lexer.js';
import { RegExpIterable, ElementCollection } from '../core/util.js';
import { parseJSON } from '../core/helpers.js';
import { config } from '../core/config.js';
import { StyleLiteral } from '../parsetree/expressions/webliterals.js';
import { ClosestExpr } from '../parsetree/expressions/positional.js';
import { PutCommand } from '../parsetree/commands/setters.js';
import { AddCommand, RemoveCommand, ToggleCommand, HideCommand, ShowCommand, TakeCommand, MeasureCommand } from '../parsetree/commands/dom.js';
import { SettleCommand, TransitionCommand } from '../parsetree/commands/animations.js';
import { GoCommand } from '../parsetree/commands/basic.js';

/**
 * @param {LanguageKernel} parser
 */
export default function hyperscriptWebGrammar(parser) {
        parser.addCommand("settle", SettleCommand.parse);

        parser.addCommand("add", AddCommand.parse);

        parser.addGrammarElement("styleLiteral", StyleLiteral.parse);

        parser.addCommand("remove", RemoveCommand.parse);

        parser.addCommand("toggle", function (helper) {
            return ToggleCommand.parse(helper, parser, config);
        });

        parser.addCommand("hide", function (helper) {
            return HideCommand.parse(helper, parser, config);
        });

        parser.addCommand("show", function (helper) {
            return ShowCommand.parse(helper, parser, config);
        });

        parser.addCommand("take", TakeCommand.parse);

        parser.addCommand("put", function (helper) {
            return PutCommand.parse(helper, parser);
        });

        parser.addCommand("transition", function (helper) {
            return TransitionCommand.parse(helper, config);
        });

        parser.addCommand("measure", MeasureCommand.parse);

        parser.addLeafExpression("closestExpr", ClosestExpr.parse);

        parser.addCommand("go", GoCommand.parse);

        config.conversions.dynamicResolvers.push(function (str, node) {
            if (!(str === "Values" || str.indexOf("Values:") === 0)) {
                return;
            }
            var conversion = str.split(":")[1];
            /** @type Object<string,string | string[]> */
            var result = {};

            var implicitLoop = parser.runtime.implicitLoop.bind(parser.runtime);

            implicitLoop(node, function (/** @type HTMLInputElement */ node) {
                // Try to get a value directly from this node
                var input = getInputInfo(node);

                if (input !== undefined) {
                    result[input.name] = input.value;
                    return;
                }

                // Otherwise, try to query all child elements of this node that *should* contain values.
                if (node.querySelectorAll != undefined) {
                    /** @type {NodeListOf<HTMLInputElement>} */
                    var children = node.querySelectorAll("input,select,textarea");
                    children.forEach(appendValue);
                }
            });

            if (conversion) {
                if (conversion === "JSON") {
                    return JSON.stringify(result);
                } else if (conversion === "Form") {
                    // TODO: does this work with multiple inputs of the same name?
                    return new URLSearchParams(/** @type {Record<string, string>} */ (result)).toString();
                } else {
                    throw "Unknown conversion: " + conversion;
                }
            } else {
                return result;
            }

            /**
             * @param {HTMLInputElement} node
             */
            function appendValue(node) {
                var info = getInputInfo(node);

                if (info == undefined) {
                    return;
                }

                // If there is no value already stored in this space.
                if (result[info.name] == undefined) {
                    result[info.name] = info.value;
                    return;
                }

                if (Array.isArray(result[info.name]) && Array.isArray(info.value)) {
                    result[info.name] = [].concat(result[info.name], info.value);
                    return;
                }
            }

            /**
             * @param {HTMLInputElement} node
             * @returns {{name:string, value:string | string[]} | undefined}
             */
            function getInputInfo(node) {
                try {
                    /** @type {{name: string, value: string | string[]}}*/
                    var result = {
                        name: node.name,
                        value: node.value,
                    };

                    if (result.name == undefined || result.value == undefined) {
                        return undefined;
                    }

                    if (node.type == "radio" && node.checked == false) {
                        return undefined;
                    }

                    if (node.type == "checkbox") {
                        if (node.checked == false) {
                            result.value = undefined;
                        } else if (typeof result.value === "string") {
                            result.value = [result.value];
                        }
                    }

                    if (node.type == "select-multiple") {
                        /** @type {NodeListOf<HTMLSelectElement>} */
                        var selected = node.querySelectorAll("option[selected]");

                        result.value = [];
                        for (var index = 0; index < selected.length; index++) {
                            result.value.push(selected[index].value);
                        }
                    }
                    return result;
                } catch (e) {
                    return undefined;
                }
            }
        });

        config.conversions["HTML"] = function (value) {
            var toHTML = /** @returns {string}*/ function (/** @type any*/ value) {
                if (value instanceof Array) {
                    return value
                        .map(function (item) {
                            return toHTML(item);
                        })
                        .join("");
                }

                if (value instanceof HTMLElement) {
                    return value.outerHTML;
                }

                if (value instanceof NodeList) {
                    var result = "";
                    for (var i = 0; i < value.length; i++) {
                        var node = value[i];
                        if (node instanceof HTMLElement) {
                            result += node.outerHTML;
                        }
                    }
                    return result;
                }

                if (value.toString) {
                    return value.toString();
                }

                return "";
            };

            return toHTML(value);
        };

        config.conversions["Fragment"] = function (val) {
            var frag = document.createDocumentFragment();
            parser.runtime.implicitLoop(val, function (val) {
                if (val instanceof Node) frag.append(val);
                else {
                    var temp = document.createElement("template");
                    temp.innerHTML = val;
                    frag.append(temp.content);
                }
            });
            return frag;
        };
}
