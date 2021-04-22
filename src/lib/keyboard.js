_hyperscript.config.conversions["KeyboardEvent"] = function(/** @type KeyboardEvent */ e) {

    var result = [];

    // Append modifier for control keys
    if (e.ctrlKey) {
        result.push("ctrl");
    }

    // Append modifier for "meta" keys ("command" on Apple keyboards)
    if (e.metaKey) {
        result.push("meta")
    }
    
    // Append modifier for "Alt" keys
    if (e.altKey) {
        result.push("alt")
    }

    // Append modifier for "Shift" keys
    if (e.shiftKey) {
        result.push("shift")
    }

    // Handle special cases for keyboard events
    switch (e.code.slice(0,3)) {

        // Strip "Key" modifier
        case "Key":
        result.push(e.code.slice(3));
        break;

        // Strip "Digit" modifier
        case "Dig":
        result.push(e.code.slice(5));
        break;

        // Strip "Numpad" modifier
        case "Num":
        result.push(e.code.slice(6));

        // Prevent an additional "Meta", "Alt", and "Shift" "Control" in the results
        case "Met":
        case "Alt":
        case "Shi":
        case "Con":
        break;

        // All other codes are added without change.
        default:
        result.push(e.code);
    }

    // turn the array into 
    return result.join("+").toLowerCase();
}
