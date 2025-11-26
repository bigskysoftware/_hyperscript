// Helper functions and classes for _hyperscript

export function getCookiesAsArray() {
    let cookiesAsArray = document.cookie
        .split("; ")
        .map(cookieEntry => {
            let strings = cookieEntry.split("=");
            return {name: strings[0], value: decodeURIComponent(strings[1])}
        });
    return cookiesAsArray;
}

export function clearCookie(name) {
    document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
}

export function clearAllCookies() {
    for (const cookie of getCookiesAsArray()) {
        clearCookie(cookie.name);
    }
}

export const CookieJar = new Proxy({}, {
    get(target, prop) {
        if (prop === 'then' || prop === 'asyncWrapper') { // ignore special symbols
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
})

export class Context {
    /**
    * @param {*} owner
    * @param {*} feature
    * @param {*} hyperscriptTarget
    * @param {*} event
    */
    constructor(owner, feature, hyperscriptTarget, event, runtime, globalScope) {
        this.meta = {
            runtime,
            owner: owner,
            feature: feature,
            iterators: {},
            ctx: this
        }
        this.locals = {
            cookies:CookieJar
        };
        this.me = hyperscriptTarget,
        this.you = undefined
        this.result = undefined
        this.event = event;
        this.target = event ? event.target : null;
        this.detail = event ? event.detail : null;
        this.sender = event ? event.detail ? event.detail.sender : null : null;
        this.body = "document" in globalScope ? document.body : null;
        runtime.addFeatures(owner, this);
    }
}

export function getOrInitObject(root, prop) {
    var value = root[prop];
    if (value) {
        return value;
    } else {
        var newObj = {};
        root[prop] = newObj;
        return newObj;
    }
}

/**
 * parseJSON parses a JSON string into a corresponding value.  If the
 * value passed in is not valid JSON, then it logs an error and returns `null`.
 *
 * @param {string} jString
 * @returns any
 */
export function parseJSON(jString) {
    try {
        return JSON.parse(jString);
    } catch (error) {
        logError(error);
        return null;
    }
}

/**
 * logError writes an error message to the Javascript console.  It can take any
 * value, but msg should commonly be a simple string.
 * @param {*} msg
 */
export function logError(msg) {
    if (console.error) {
        console.error(msg);
    } else if (console.log) {
        console.log("ERROR: ", msg);
    }
}

// TODO: JSDoc description of what's happening here
export function varargConstructor(Cls, args) {
    return new (Cls.bind.apply(Cls, [Cls].concat(args)))();
}
