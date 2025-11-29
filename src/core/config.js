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
