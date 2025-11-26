// Utility classes for _hyperscript

/**
 * @type {symbol}
 */
export const shouldAutoIterateSymbol = Symbol()

export class ElementCollection {
    constructor(css, relativeToElement, escape) {
        this._css = css;
        this.relativeToElement = relativeToElement;
        this.escape = escape;
        this[shouldAutoIterateSymbol] = true;
    }

    get css() {
        if (this.escape) {
            // Runtime will be set up after module initialization
            return ElementCollection._runtime.escapeSelector(this._css);
        } else {
            return this._css;
        }
    }

    get className() {
        return this._css.substr(1);
    }

    get id() {
        return this.className();
    }

    contains(elt) {
        for (let element of this) {
            if (element.contains(elt)) {
                return true;
            }
        }
        return false;
    }

    get length() {
        return this.selectMatches().length;
    }

    [Symbol.iterator]() {
        let query = this.selectMatches();
        return query [Symbol.iterator]();
    }

    selectMatches() {
        // Runtime will be set up after module initialization
        let query = ElementCollection._runtime.getRootNode(this.relativeToElement).querySelectorAll(this.css);
        return query;
    }
}

export class TemplatedQueryElementCollection extends ElementCollection {
    constructor(css, relativeToElement, templateParts) {
        super(css, relativeToElement);
        this.templateParts = templateParts;
        this.elements = templateParts.filter(elt => elt instanceof Element);
    }

    get css() {
        let rv = "", i = 0
        for (const val of this.templateParts) {
            if (val instanceof Element) {
                rv += "[data-hs-query-id='" + i++ + "']";
            } else rv += val;
        }
        return rv;
    }

    [Symbol.iterator]() {
        this.elements.forEach((el, i) => el.dataset.hsQueryId = i);
        const rv = super[Symbol.iterator]();
        this.elements.forEach(el => el.removeAttribute('data-hs-query-id'));
        return rv;
    }
}

export class RegExpIterator {
  constructor(re, str) {
    this.re = re;
    this.str = str;
  }

  next() {
    const match = this.re.exec(this.str);
    if (match === null) return { done: true };
    else return { value: match };
  }
}

export class RegExpIterable {
  constructor(re, flags, str) {
    this.re = re;
    this.flags = flags;
    this.str = str;
  }

  [Symbol.iterator]() {
    return new RegExpIterator(new RegExp(this.re, this.flags), this.str);
  }
}
