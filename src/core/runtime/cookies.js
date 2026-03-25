// Cookie management for _hyperscript

export class CookieJar {
    #parseCookies() {
        return document.cookie.split("; ").map(entry => {
            var parts = entry.split("=");
            return { name: parts[0], value: decodeURIComponent(parts[1]) };
        });
    }

    get(target, prop) {
        if (prop === 'then') {
            return null; // prevent Promise detection
        } else if (prop === 'length') {
            return this.#parseCookies().length;
        } else if (prop === 'clear') {
            return (name) => {
                document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
            };
        } else if (prop === 'clearAll') {
            return () => {
                for (const cookie of this.#parseCookies()) {
                    document.cookie = cookie.name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
                }
            };
        } else if (prop === Symbol.iterator) {
            var cookies = this.#parseCookies();
            return cookies[Symbol.iterator].bind(cookies);
        } else if (typeof prop === "string") {
            if (!isNaN(prop)) {
                return this.#parseCookies()[parseInt(prop)];
            }
            var match = this.#parseCookies().find(c => c.name === prop);
            return match ? match.value : undefined;
        }
    }

    set(target, prop, value) {
        var parts = [];
        if (typeof value === 'string') {
            parts.push(encodeURIComponent(value));
            parts.push("samesite=lax");
        } else {
            parts.push(encodeURIComponent(value.value));
            if (value.expires)    parts.push("expires=" + value.expires);
            if (value.maxAge)     parts.push("max-age=" + value.maxAge);
            if (value.partitioned) parts.push("partitioned=" + value.partitioned);
            if (value.path)       parts.push("path=" + value.path);
            if (value.samesite)   parts.push("samesite=" + value.samesite);
            if (value.secure)     parts.push("secure");
        }
        document.cookie = String(prop) + "=" + parts.join(";");
        return true;
    }

    proxy() {
        return new Proxy({}, this)
    }
}

