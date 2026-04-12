// Type conversions for _hyperscript

class HyperscriptFormData {
    result = {};

    addElement(node) {
        if (node.name == undefined || node.value == undefined) return;
        if (node.type === "radio" && !node.checked) return;

        var name = node.name;
        var value;

        if (node.type === "checkbox") {
            value = node.checked ? [node.value] : undefined;
        } else if (node.type === "select-multiple") {
            value = Array.from(node.options).filter(o => o.selected).map(o => o.value);
        } else {
            value = node.value;
        }

        if (value == undefined) return;

        if (this.result[name] == undefined) {
            this.result[name] = value;
        } else {
            var existing = Array.isArray(this.result[name]) ? this.result[name] : [this.result[name]];
            this.result[name] = existing.concat(value);
        }
    }

    addContainer(node) {
        if (node.name != undefined && node.value != undefined) {
            this.addElement(node);
            return;
        }
        if (node.querySelectorAll) {
            node.querySelectorAll("input,select,textarea").forEach(child => this.addElement(child));
        }
    }
}

function _toHTML(value) {
    if (value instanceof Array) {
        return value.map(item => _toHTML(item)).join("");
    }
    if (value instanceof HTMLElement) {
        return value.outerHTML;
    }
    if (value instanceof NodeList) {
        var result = "";
        for (var i = 0; i < value.length; i++) {
            if (value[i] instanceof HTMLElement) {
                result += value[i].outerHTML;
            }
        }
        return result;
    }
    if (value.toString) {
        return value.toString();
    }
    return "";
}

export const conversions = {
    dynamicResolvers: [
        // Fixed-point number conversion
        function(str, value) {
            if (str === "Fixed") {
                return Number(value).toFixed();
            } else if (str.startsWith("Fixed:")) {
                let num = str.split(":")[1];
                return Number(value).toFixed(parseInt(num));
            }
        },
        // Values conversion - extracts form values from DOM nodes
        function(str, node, runtime) {
            if (str !== "Values") return;
            var formData = new HyperscriptFormData();
            runtime.implicitLoop(node, (node) => formData.addContainer(node));
            return formData.result;
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
    Boolean: function (val) {
        return !!val;
    },
    Date: function (val) {
        return new Date(val);
    },
    Array: function (val) {
        return Array.from(val);
    },
    JSON: function (val) {
        if (typeof Response !== "undefined" && val instanceof Response) return val.json();
        return JSON.parse(val);
    },
    JSONString: function (val) {
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
    FormEncoded: function (val) {
        return new URLSearchParams(val).toString();
    },
    Set: function (val) {
        return new Set(val);
    },
    Map: function (val) {
        return new Map(Object.entries(val));
    },
    Keys: function (val) {
        if (val instanceof Map) return Array.from(val.keys());
        return Object.keys(val);
    },
    Entries: function (val) {
        if (val instanceof Map) return Array.from(val.entries());
        return Object.entries(val);
    },
    Reversed: function (val) {
        return Array.from(val).reverse();
    },
    Unique: function (val) {
        return [...new Set(val)];
    },
    Flat: function (val) {
        return Array.from(val).flat();
    },
    HTML: _toHTML,
    Stream: function () {
        throw new Error("The Stream conversion requires the SSE extension. " +
            "Include dist/ext/sse.js or dist/ext/sse.esm.js after hyperscript.");
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
