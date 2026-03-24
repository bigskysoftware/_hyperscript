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
            value = Array.from(node.querySelectorAll("option[selected]"), o => o.value);
        } else {
            value = node.value;
        }

        if (value == undefined) return;

        if (this.result[name] == undefined) {
            this.result[name] = value;
        } else if (Array.isArray(this.result[name]) && Array.isArray(value)) {
            this.result[name] = this.result[name].concat(value);
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
            var formData = new HyperscriptFormData();

            runtime.implicitLoop(node, (node) => formData.addContainer(node));

            if (conversion) {
                if (conversion === "JSON") {
                    return JSON.stringify(formData.result);
                } else if (conversion === "Form") {
                    return new URLSearchParams(formData.result).toString();
                } else {
                    throw "Unknown conversion: " + conversion;
                }
            } else {
                return formData.result;
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
