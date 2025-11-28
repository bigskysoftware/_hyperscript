// Configuration and type conversions for _hyperscript

/**
 * @type {Object}
 * @property {DynamicConverter[]} dynamicResolvers
 *
 * @callback DynamicConverter
 * @param {String} str
 * @param {*} value
 * @returns {*}
 */
export const conversions = {
    dynamicResolvers: [
        function(str, value){
            if (str === "Fixed") {
                return Number(value).toFixed();
            } else if (str.indexOf("Fixed:") === 0) {
                let num = str.split(":")[1];
                return Number(value).toFixed(parseInt(num));
            }
        }
    ],
    String: function (val) {
        if (val.toString) {
            return val.toString();
        } else {
            return "" + val;
        }
    },
    Int: function (val) {
        return parseInt(val);
    },
    Float: function (val) {
        return parseFloat(val);
    },
    Number: function (val) {
        return Number(val);
    },
    Date: function (val) {
        return new Date(val);
    },
    Array: function (val) {
        return Array.from(val);
    },
    JSON: function (val) {
        return JSON.stringify(val);
    },
    Object: function (val) {
        if (val instanceof String) {
            val = val.toString();
        }
        if (typeof val === "string") {
            return JSON.parse(val);
        } else {
            return Object.assign({}, val);
        }
    },
}

export const config = {
    attributes: "_, script, data-script",
    defaultTransition: "all 500ms ease-in",
    disableSelector: "[disable-scripting], [data-disable-scripting]",
    hideShowStrategies: {},
    conversions,
}

/**
 * Initialize web-specific conversions that require runtime access
 * @param {Runtime} runtime - The runtime instance
 */
export function initWebConversions(runtime) {
    // Values dynamic resolver - extracts form values from DOM nodes
    conversions.dynamicResolvers.push(function (str, node) {
        if (!(str === "Values" || str.indexOf("Values:") === 0)) {
            return;
        }
        var conversion = str.split(":")[1];
        /** @type Object<string,string | string[]> */
        var result = {};

        var implicitLoop = runtime.implicitLoop.bind(runtime);

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

    // HTML conversion - converts values to HTML strings
    conversions["HTML"] = function (value) {
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

    // Fragment conversion - converts values to document fragments
    conversions["Fragment"] = function (val) {
        var frag = document.createDocumentFragment();
        runtime.implicitLoop(val, function (val) {
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
