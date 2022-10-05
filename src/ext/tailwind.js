_hyperscript.config.hideShowStrategies.twDisplay = function (op, element, arg) {
    if (op === "toggle") {
        if (element.classList.contains("hidden")) {
            HIDE_SHOW_STRATEGIES.tailwindcss("show", element, arg);
        } else {
            HIDE_SHOW_STRATEGIES.tailwindcss("hide", element, arg);
        }
    } else if (op === "hide") {
        element.classList.add('hidden');
    } else {
        element.classList.remove('hidden');
    }
}

_hyperscript.config.hideShowStrategies.twVisibility = function (op, element, arg) {
    if (op === "toggle") {
        if (element.classList.contains("invisible")) {
            HIDE_SHOW_STRATEGIES.tailwindcss("show", element, arg);
        } else {
            HIDE_SHOW_STRATEGIES.tailwindcss("hide", element, arg);
        }
    } else if (op === "hide") {
        element.classList.add('invisible');
    } else {
        element.classList.remove('invisible');
    }
}

_hyperscript.config.hideShowStrategies.twOpacity = function (op, element, arg) {
    if (op === "toggle") {
        if (element.classList.contains("opacity-0")) {
            HIDE_SHOW_STRATEGIES.tailwindcss("show", element, arg);
        } else {
            HIDE_SHOW_STRATEGIES.tailwindcss("hide", element, arg);
        }
    } else if (op === "hide") {
        element.classList.add('opacity-0');
    } else {
        element.classList.remove('opacity-0');
    }
}