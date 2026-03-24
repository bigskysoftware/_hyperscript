// Cookie management for _hyperscript

function getCookiesAsArray() {
    let cookiesAsArray = document.cookie
        .split("; ")
        .map(cookieEntry => {
            let strings = cookieEntry.split("=");
            return {name: strings[0], value: decodeURIComponent(strings[1])}
        });
    return cookiesAsArray;
}

function clearCookie(name) {
    document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
}

function clearAllCookies() {
    for (const cookie of getCookiesAsArray()) {
        clearCookie(cookie.name);
    }
}

export const CookieJar = new Proxy({}, {
    get(target, prop) {
        if (prop === 'then') {
            return null;
        } else if (prop === 'length') {
            return getCookiesAsArray().length
        } else if (prop === 'clear') {
            return clearCookie;
        } else if (prop === 'clearAll') {
            return clearAllCookies;
        } else if (typeof prop === "string") {
            // @ts-ignore string works fine with isNaN
            if (!isNaN(prop)) {
                return getCookiesAsArray()[parseInt(prop)];
            } else {
                let value = document.cookie
                    .split("; ")
                    .find((row) => row.startsWith(prop + "="))
                    ?.split("=")[1];
                if(value) {
                    return decodeURIComponent(value);
                }
            }
        } else if (prop === Symbol.iterator) {
            return getCookiesAsArray()[prop];
        }
    },
    set(target, prop, value) {
        var finalValue = null;
        if ('string' === typeof value) {
            finalValue = encodeURIComponent(value)
            finalValue += ";samesite=lax"
        } else {
            finalValue = encodeURIComponent(value.value);
            if (value.expires) {
                finalValue+=";expires=" + value.maxAge;
            }
            if (value.maxAge) {
                finalValue+=";max-age=" + value.maxAge;
            }
            if (value.partitioned) {
                finalValue+=";partitioned=" + value.partitioned;
            }
            if (value.path) {
                finalValue+=";path=" + value.path;
            }
            if (value.samesite) {
                finalValue+=";samesite=" + value.path;
            }
            if (value.secure) {
                finalValue+=";secure=" + value.path;
            }
        }
        document.cookie= String(prop) + "=" + finalValue;
        return true;
    }
});
