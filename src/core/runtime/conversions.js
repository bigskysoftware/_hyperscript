// Type conversions for _hyperscript

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

export const conversions = {
    dynamicResolvers: [
        // Fixed-point number conversion
        function(str, value) {
            if (str === "Fixed") {
                return Number(value).toFixed();
            } else if (str.indexOf("Fixed:") === 0) {
                let num = str.split(":")[1];
                return Number(value).toFixed(parseInt(num));
            }
        },
        // Values conversion - extracts form values from DOM nodes
        function(str, node, runtime) {
            if (!(str === "Values" || str.indexOf("Values:") === 0)) {
                return;
            }
            var conversion = str.split(":")[1];
            var result = {};

            function appendValue(node) {
                var info = getInputInfo(node);
                if (info == undefined) return;
                if (result[info.name] == undefined) {
                    result[info.name] = info.value;
                    return;
                }
                if (Array.isArray(result[info.name]) && Array.isArray(info.value)) {
                    result[info.name] = [].concat(result[info.name], info.value);
                    return;
                }
            }

            runtime.implicitLoop(node, (node) => {
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
        },
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
    HTML: function (value) {
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
    },
    Fragment: function (val, runtime) {
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
    },
}
