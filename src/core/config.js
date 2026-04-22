// Configuration for _hyperscript

export const config = {
    attributes: "_, script, data-script",
    defaultTransition: "all 500ms ease-in",
    disableSelector: "[disable-scripting], [data-disable-scripting]",
    fetchThrowsOn: [/4.*/, /5.*/],
    hideShowStrategies: {},
    debugMode: false,
    logAll: false,
    mutatingMethods: {
        Array: ["push", "pop", "shift", "unshift", "splice", "sort", "reverse", "fill", "copyWithin"],
        Set: ["add", "delete", "clear"],
        Map: ["set", "delete", "clear"],
    },
}
