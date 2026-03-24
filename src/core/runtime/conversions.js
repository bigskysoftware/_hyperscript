// Web-specific type conversions for _hyperscript

import { conversions } from '../config.js';

/**
 * Initialize web-specific type conversions (Values, HTML, Fragment)
 * @param {*} runtime - Runtime instance for implicitLoop access
 */
export function initWebConversions(runtime) {
    // Values dynamic resolver - extracts form values from DOM nodes
    conversions.dynamicResolvers.push((str, node) => {
        if (!(str === "Values" || str.indexOf("Values:") === 0)) {
            return;
        }
        var conversion = str.split(":")[1];
        var result = {};

        runtime.implicitLoop(node, (/** @type HTMLInputElement */ node) => {
            var input = getInputInfo(node);

            if (input !== undefined) {
                result[input.name] = input.value;
                return;
            }

            if (node.querySelectorAll != undefined) {
                var children = node.querySelectorAll("input,select,textarea");
                children.forEach(appendValue);
            }
        });

        if (conversion) {
            if (conversion === "JSON") {
                return JSON.stringify(result);
            } else if (conversion === "Form") {
                return new URLSearchParams(result).toString();
            } else {
                throw "Unknown conversion: " + conversion;
            }
        } else {
            return result;
        }

        function appendValue(node) {
            var info = getInputInfo(node);
            if (info == undefined) {
                return;
            }
            if (result[info.name] == undefined) {
                result[info.name] = info.value;
                return;
            }
            if (Array.isArray(result[info.name]) && Array.isArray(info.value)) {
                result[info.name] = [].concat(result[info.name], info.value);
                return;
            }
        }

        function getInputInfo(node) {
            try {
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

    // HTML conversion - converts values to HTML strings
    conversions["HTML"] = (value) => {
        var toHTML = (value) => {
            if (value instanceof Array) {
                return value.map(item => toHTML(item)).join("");
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

    // Fragment conversion - converts values to document fragments
    conversions["Fragment"] = (val) => {
        var frag = document.createDocumentFragment();
        runtime.implicitLoop(val, (val) => {
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
