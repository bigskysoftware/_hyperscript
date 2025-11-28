// _hyperscript ES module
var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

// src/core/tokens.js
var _Tokens = class _Tokens {
  constructor(tokens, consumed, source) {
    /** @type Token | null */
    __publicField(this, "_lastConsumed", null);
    __publicField(this, "follows", []);
    this.tokens = tokens;
    this.consumed = consumed;
    this.source = source;
    this.consumeWhitespace();
  }
  get list() {
    return this.tokens;
  }
  consumeWhitespace() {
    while (this.token(0, true).type === "WHITESPACE") {
      this.consumed.push(this.tokens.shift());
    }
  }
  /**
   * @param {Tokens} tokens
   * @param {*} error
   * @returns {never}
   */
  raiseError(tokens, error) {
    if (_Tokens._parserRaiseError) {
      _Tokens._parserRaiseError(tokens, error);
    } else {
      throw new Error(error);
    }
  }
  /**
   * @param {string} value
   * @returns {Token}
   */
  requireOpToken(value) {
    var token = this.matchOpToken(value);
    if (token) {
      return token;
    } else {
      this.raiseError(this, "Expected '" + value + "' but found '" + this.currentToken().value + "'");
    }
  }
  /**
   * @param {...string} ops
   * @returns {Token | void}
   */
  matchAnyOpToken(...ops) {
    for (var i = 0; i < ops.length; i++) {
      var opToken = ops[i];
      var match = this.matchOpToken(opToken);
      if (match) {
        return match;
      }
    }
  }
  /**
   * @param {...string} tokens
   * @returns {Token | void}
   */
  matchAnyToken(...tokens) {
    for (var i = 0; i < tokens.length; i++) {
      var opToken = tokens[i];
      var match = this.matchToken(opToken);
      if (match) {
        return match;
      }
    }
  }
  /**
   * @param {string} value
   * @returns {Token | void}
   */
  matchOpToken(value) {
    if (this.currentToken() && this.currentToken().op && this.currentToken().value === value) {
      return this.consumeToken();
    }
  }
  /**
   * @param {string} type1
   * @param {string} [type2]
   * @param {string} [type3]
   * @param {string} [type4]
   * @returns {Token}
   */
  requireTokenType(type1, type2, type3, type4) {
    var token = this.matchTokenType(type1, type2, type3, type4);
    if (token) {
      return token;
    } else {
      this.raiseError(this, "Expected one of " + JSON.stringify([type1, type2, type3]));
    }
  }
  /**
   * @param {string} type1
   * @param {string} [type2]
   * @param {string} [type3]
   * @param {string} [type4]
   * @returns {Token | void}
   */
  matchTokenType(type1, type2, type3, type4) {
    if (this.currentToken() && this.currentToken().type && [type1, type2, type3, type4].indexOf(this.currentToken().type) >= 0) {
      return this.consumeToken();
    }
  }
  /**
   * @param {string} value
   * @param {string} [type]
   * @returns {Token}
   */
  requireToken(value, type) {
    var token = this.matchToken(value, type);
    if (token) {
      return token;
    } else {
      this.raiseError(this, "Expected '" + value + "' but found '" + this.currentToken().value + "'");
    }
  }
  peekToken(value, peek, type) {
    peek = peek || 0;
    type = type || "IDENTIFIER";
    if (this.tokens[peek] && this.tokens[peek].value === value && this.tokens[peek].type === type) {
      return this.tokens[peek];
    }
  }
  /**
   * @param {string} value
   * @param {string} [type]
   * @returns {Token | void}
   */
  matchToken(value, type) {
    if (this.follows.indexOf(value) !== -1) {
      return;
    }
    type = type || "IDENTIFIER";
    if (this.currentToken() && this.currentToken().value === value && this.currentToken().type === type) {
      return this.consumeToken();
    }
  }
  /**
   * @returns {Token}
   */
  consumeToken() {
    var match = this.tokens.shift();
    this.consumed.push(match);
    this._lastConsumed = match;
    this.consumeWhitespace();
    return match;
  }
  /**
   * @param {string | null} value
   * @param {string | null} [type]
   * @returns {Token[]}
   */
  consumeUntil(value, type) {
    var tokenList = [];
    var currentToken = this.token(0, true);
    while ((type == null || currentToken.type !== type) && (value == null || currentToken.value !== value) && currentToken.type !== "EOF") {
      var match = this.tokens.shift();
      this.consumed.push(match);
      tokenList.push(currentToken);
      currentToken = this.token(0, true);
    }
    this.consumeWhitespace();
    return tokenList;
  }
  /**
   * @returns {string}
   */
  lastWhitespace() {
    if (this.consumed[this.consumed.length - 1] && this.consumed[this.consumed.length - 1].type === "WHITESPACE") {
      return this.consumed[this.consumed.length - 1].value;
    } else {
      return "";
    }
  }
  consumeUntilWhitespace() {
    return this.consumeUntil(null, "WHITESPACE");
  }
  /**
   * @returns {boolean}
   */
  hasMore() {
    return this.tokens.length > 0;
  }
  /**
   * @param {number} n
   * @param {boolean} [dontIgnoreWhitespace]
   * @returns {Token}
   */
  token(n, dontIgnoreWhitespace) {
    var token;
    var i = 0;
    do {
      if (!dontIgnoreWhitespace) {
        while (this.tokens[i] && this.tokens[i].type === "WHITESPACE") {
          i++;
        }
      }
      token = this.tokens[i];
      n--;
      i++;
    } while (n > -1);
    if (token) {
      return token;
    } else {
      return {
        type: "EOF",
        value: "<<<EOF>>>"
      };
    }
  }
  /**
   * @returns {Token}
   */
  currentToken() {
    return this.token(0);
  }
  /**
   * @returns {Token | null}
   */
  lastMatch() {
    return this._lastConsumed;
  }
  pushFollow(str) {
    this.follows.push(str);
  }
  popFollow() {
    this.follows.pop();
  }
  clearFollows() {
    var tmp = this.follows;
    this.follows = [];
    return tmp;
  }
  restoreFollows(f) {
    this.follows = f;
  }
};
/**
 * @returns {string}
 */
__publicField(_Tokens, "sourceFor", function() {
  return this.programSource.substring(this.startToken.start, this.endToken.end);
});
/**
 * @returns {string}
 */
__publicField(_Tokens, "lineFor", function() {
  return this.programSource.split("\n")[this.startToken.line - 1];
});
var Tokens = _Tokens;

// src/core/lexer.js
var _Lexer = class _Lexer {
  /**
   * isValidCSSClassChar returns `true` if the provided character is valid in a CSS class.
   * @param {string} c
   * @returns boolean
   */
  static isValidCSSClassChar(c) {
    return _Lexer.isAlpha(c) || _Lexer.isNumeric(c) || c === "-" || c === "_" || c === ":";
  }
  /**
   * isValidCSSIDChar returns `true` if the provided character is valid in a CSS ID
   * @param {string} c
   * @returns boolean
   */
  static isValidCSSIDChar(c) {
    return _Lexer.isAlpha(c) || _Lexer.isNumeric(c) || c === "-" || c === "_" || c === ":";
  }
  /**
   * isWhitespace returns `true` if the provided character is whitespace.
   * @param {string} c
   * @returns boolean
   */
  static isWhitespace(c) {
    return c === " " || c === "	" || _Lexer.isNewline(c);
  }
  /**
   * positionString returns a string representation of a Token's line and column details.
   * @param {Token} token
   * @returns string
   */
  static positionString(token) {
    return "[Line: " + token.line + ", Column: " + token.column + "]";
  }
  /**
   * isNewline returns `true` if the provided character is a carriage return or newline
   * @param {string} c
   * @returns boolean
   */
  static isNewline(c) {
    return c === "\r" || c === "\n";
  }
  /**
   * isNumeric returns `true` if the provided character is a number (0-9)
   * @param {string} c
   * @returns boolean
   */
  static isNumeric(c) {
    return c >= "0" && c <= "9";
  }
  /**
   * isAlpha returns `true` if the provided character is a letter in the alphabet
   * @param {string} c
   * @returns boolean
   */
  static isAlpha(c) {
    return c >= "a" && c <= "z" || c >= "A" && c <= "Z";
  }
  /**
   * @param {string} c
   * @param {boolean} [dollarIsOp]
   * @returns boolean
   */
  static isIdentifierChar(c, dollarIsOp) {
    return c === "_" || c === "$";
  }
  /**
   * @param {string} c
   * @returns boolean
   */
  static isReservedChar(c) {
    return c === "`" || c === "^";
  }
  /**
   * @param {Token[]} tokens
   * @returns {boolean}
   */
  static isValidSingleQuoteStringStart(tokens) {
    if (tokens.length > 0) {
      var previousToken = tokens[tokens.length - 1];
      if (previousToken.type === "IDENTIFIER" || previousToken.type === "CLASS_REF" || previousToken.type === "ID_REF") {
        return false;
      }
      if (previousToken.op && (previousToken.value === ">" || previousToken.value === ")")) {
        return false;
      }
    }
    return true;
  }
  /**
   * @param {string} string
   * @param {boolean} [template]
   * @returns {Tokens}
   */
  static tokenize(string, template) {
    var tokens = (
      /** @type {Token[]}*/
      []
    );
    var source = string;
    var position = 0;
    var column = 0;
    var line = 1;
    var lastToken = "<START>";
    var templateBraceCount = 0;
    function inTemplate() {
      return template && templateBraceCount === 0;
    }
    while (position < source.length) {
      if (currentChar() === "-" && nextChar() === "-" && (_Lexer.isWhitespace(nextCharAt(2)) || nextCharAt(2) === "" || nextCharAt(2) === "-") || currentChar() === "/" && nextChar() === "/" && (_Lexer.isWhitespace(nextCharAt(2)) || nextCharAt(2) === "" || nextCharAt(2) === "/")) {
        consumeComment();
      } else if (currentChar() === "/" && nextChar() === "*" && (_Lexer.isWhitespace(nextCharAt(2)) || nextCharAt(2) === "" || nextCharAt(2) === "*")) {
        consumeCommentMultiline();
      } else {
        if (_Lexer.isWhitespace(currentChar())) {
          tokens.push(consumeWhitespace());
        } else if (!possiblePrecedingSymbol() && currentChar() === "." && (_Lexer.isAlpha(nextChar()) || nextChar() === "{" || nextChar() === "-")) {
          tokens.push(consumeClassReference());
        } else if (!possiblePrecedingSymbol() && currentChar() === "#" && (_Lexer.isAlpha(nextChar()) || nextChar() === "{")) {
          tokens.push(consumeIdReference());
        } else if (currentChar() === "[" && nextChar() === "@") {
          tokens.push(consumeAttributeReference());
        } else if (currentChar() === "@") {
          tokens.push(consumeShortAttributeReference());
        } else if (currentChar() === "*" && _Lexer.isAlpha(nextChar())) {
          tokens.push(consumeStyleReference());
        } else if (inTemplate() && (_Lexer.isAlpha(currentChar()) || currentChar() === "\\")) {
          tokens.push(consumeTemplateIdentifier());
        } else if (!inTemplate() && (_Lexer.isAlpha(currentChar()) || _Lexer.isIdentifierChar(currentChar()))) {
          tokens.push(consumeIdentifier());
        } else if (_Lexer.isNumeric(currentChar())) {
          tokens.push(consumeNumber());
        } else if (!inTemplate() && (currentChar() === '"' || currentChar() === "`")) {
          tokens.push(consumeString());
        } else if (!inTemplate() && currentChar() === "'") {
          if (_Lexer.isValidSingleQuoteStringStart(tokens)) {
            tokens.push(consumeString());
          } else {
            tokens.push(consumeOp());
          }
        } else if (_Lexer.OP_TABLE[currentChar()]) {
          if (lastToken === "$" && currentChar() === "{") {
            templateBraceCount++;
          }
          if (currentChar() === "}") {
            templateBraceCount--;
          }
          tokens.push(consumeOp());
        } else if (inTemplate() || _Lexer.isReservedChar(currentChar())) {
          tokens.push(makeToken("RESERVED", consumeChar()));
        } else {
          if (position < source.length) {
            throw Error("Unknown token: " + currentChar() + " ");
          }
        }
      }
    }
    return new Tokens(tokens, [], source);
    function makeOpToken(type, value) {
      var token = makeToken(type, value);
      token.op = true;
      return token;
    }
    function makeToken(type, value) {
      return {
        type,
        value: value || "",
        start: position,
        end: position + 1,
        column,
        line
      };
    }
    function consumeComment() {
      while (currentChar() && !_Lexer.isNewline(currentChar())) {
        consumeChar();
      }
      consumeChar();
    }
    function consumeCommentMultiline() {
      while (currentChar() && !(currentChar() === "*" && nextChar() === "/")) {
        consumeChar();
      }
      consumeChar();
      consumeChar();
    }
    function consumeClassReference() {
      var classRef = makeToken("CLASS_REF");
      var value = consumeChar();
      if (currentChar() === "{") {
        classRef.template = true;
        value += consumeChar();
        while (currentChar() && currentChar() !== "}") {
          value += consumeChar();
        }
        if (currentChar() !== "}") {
          throw Error("Unterminated class reference");
        } else {
          value += consumeChar();
        }
      } else {
        while (_Lexer.isValidCSSClassChar(currentChar()) || currentChar() === "\\") {
          if (currentChar() === "\\") {
            consumeChar();
          }
          value += consumeChar();
        }
      }
      classRef.value = value;
      classRef.end = position;
      return classRef;
    }
    function consumeAttributeReference() {
      var attributeRef = makeToken("ATTRIBUTE_REF");
      var value = consumeChar();
      while (position < source.length && currentChar() !== "]") {
        value += consumeChar();
      }
      if (currentChar() === "]") {
        value += consumeChar();
      }
      attributeRef.value = value;
      attributeRef.end = position;
      return attributeRef;
    }
    function consumeShortAttributeReference() {
      var attributeRef = makeToken("ATTRIBUTE_REF");
      var value = consumeChar();
      while (_Lexer.isValidCSSIDChar(currentChar())) {
        value += consumeChar();
      }
      if (currentChar() === "=") {
        value += consumeChar();
        if (currentChar() === '"' || currentChar() === "'") {
          let stringValue = consumeString();
          value += stringValue.value;
        } else if (_Lexer.isAlpha(currentChar()) || _Lexer.isNumeric(currentChar()) || _Lexer.isIdentifierChar(currentChar())) {
          let id = consumeIdentifier();
          value += id.value;
        }
      }
      attributeRef.value = value;
      attributeRef.end = position;
      return attributeRef;
    }
    function consumeStyleReference() {
      var styleRef = makeToken("STYLE_REF");
      var value = consumeChar();
      while (_Lexer.isAlpha(currentChar()) || currentChar() === "-") {
        value += consumeChar();
      }
      styleRef.value = value;
      styleRef.end = position;
      return styleRef;
    }
    function consumeIdReference() {
      var idRef = makeToken("ID_REF");
      var value = consumeChar();
      if (currentChar() === "{") {
        idRef.template = true;
        value += consumeChar();
        while (currentChar() && currentChar() !== "}") {
          value += consumeChar();
        }
        if (currentChar() !== "}") {
          throw Error("Unterminated id reference");
        } else {
          consumeChar();
        }
      } else {
        while (_Lexer.isValidCSSIDChar(currentChar())) {
          value += consumeChar();
        }
      }
      idRef.value = value;
      idRef.end = position;
      return idRef;
    }
    function consumeTemplateIdentifier() {
      var identifier = makeToken("IDENTIFIER");
      var value = consumeChar();
      var escd = value === "\\";
      if (escd) {
        value = "";
      }
      while (_Lexer.isAlpha(currentChar()) || _Lexer.isNumeric(currentChar()) || _Lexer.isIdentifierChar(currentChar()) || currentChar() === "\\" || currentChar() === "{" || currentChar() === "}") {
        if (currentChar() === "$" && escd === false) {
          break;
        } else if (currentChar() === "\\") {
          escd = true;
          consumeChar();
        } else {
          escd = false;
          value += consumeChar();
        }
      }
      if (currentChar() === "!" && value === "beep") {
        value += consumeChar();
      }
      identifier.value = value;
      identifier.end = position;
      return identifier;
    }
    function consumeIdentifier() {
      var identifier = makeToken("IDENTIFIER");
      var value = consumeChar();
      while (_Lexer.isAlpha(currentChar()) || _Lexer.isNumeric(currentChar()) || _Lexer.isIdentifierChar(currentChar())) {
        value += consumeChar();
      }
      if (currentChar() === "!" && value === "beep") {
        value += consumeChar();
      }
      identifier.value = value;
      identifier.end = position;
      return identifier;
    }
    function consumeNumber() {
      var number = makeToken("NUMBER");
      var value = consumeChar();
      while (_Lexer.isNumeric(currentChar())) {
        value += consumeChar();
      }
      if (currentChar() === "." && _Lexer.isNumeric(nextChar())) {
        value += consumeChar();
      }
      while (_Lexer.isNumeric(currentChar())) {
        value += consumeChar();
      }
      if (currentChar() === "e" || currentChar() === "E") {
        if (_Lexer.isNumeric(nextChar())) {
          value += consumeChar();
        } else if (nextChar() === "-") {
          value += consumeChar();
          value += consumeChar();
        }
      }
      while (_Lexer.isNumeric(currentChar())) {
        value += consumeChar();
      }
      number.value = value;
      number.end = position;
      return number;
    }
    function consumeOp() {
      var op = makeOpToken();
      var value = consumeChar();
      while (currentChar() && _Lexer.OP_TABLE[value + currentChar()]) {
        value += consumeChar();
      }
      op.type = _Lexer.OP_TABLE[value];
      op.value = value;
      op.end = position;
      return op;
    }
    function consumeString() {
      var string2 = makeToken("STRING");
      var startChar = consumeChar();
      string2.template = startChar === "`";
      var value = "";
      while (currentChar() && currentChar() !== startChar) {
        if (currentChar() === "\\") {
          consumeChar();
          let nextChar2 = consumeChar();
          if (nextChar2 === "b") {
            value += "\b";
          } else if (nextChar2 === "f") {
            value += "\f";
          } else if (nextChar2 === "n") {
            value += "\n";
          } else if (nextChar2 === "r") {
            value += "\r";
          } else if (nextChar2 === "t") {
            value += "	";
          } else if (nextChar2 === "v") {
            value += "\v";
          } else if (string2.template && nextChar2 === "$") {
            value += "\\$";
          } else if (nextChar2 === "x") {
            const hex = consumeHexEscape();
            if (Number.isNaN(hex)) {
              throw Error("Invalid hexadecimal escape at " + _Lexer.positionString(string2));
            }
            value += String.fromCharCode(hex);
          } else {
            value += nextChar2;
          }
        } else {
          value += consumeChar();
        }
      }
      if (currentChar() !== startChar) {
        throw Error("Unterminated string at " + _Lexer.positionString(string2));
      } else {
        consumeChar();
      }
      string2.value = value;
      string2.end = position;
      return string2;
    }
    function consumeHexEscape() {
      const BASE = 16;
      if (!currentChar()) {
        return NaN;
      }
      let result = BASE * Number.parseInt(consumeChar(), BASE);
      if (!currentChar()) {
        return NaN;
      }
      result += Number.parseInt(consumeChar(), BASE);
      return result;
    }
    function currentChar() {
      return source.charAt(position);
    }
    function nextChar() {
      return source.charAt(position + 1);
    }
    function nextCharAt(number = 1) {
      return source.charAt(position + number);
    }
    function consumeChar() {
      lastToken = currentChar();
      position++;
      column++;
      return lastToken;
    }
    function possiblePrecedingSymbol() {
      return _Lexer.isAlpha(lastToken) || _Lexer.isNumeric(lastToken) || lastToken === ")" || lastToken === '"' || lastToken === "'" || lastToken === "`" || lastToken === "}" || lastToken === "]";
    }
    function consumeWhitespace() {
      var whitespace = makeToken("WHITESPACE");
      var value = "";
      while (currentChar() && _Lexer.isWhitespace(currentChar())) {
        if (_Lexer.isNewline(currentChar())) {
          column = 0;
          line++;
        }
        value += consumeChar();
      }
      whitespace.value = value;
      whitespace.end = position;
      return whitespace;
    }
  }
  /**
   * @param {string} string
   * @param {boolean} [template]
   * @returns {Tokens}
   */
  tokenize(string, template) {
    return _Lexer.tokenize(string, template);
  }
};
__publicField(_Lexer, "OP_TABLE", {
  "+": "PLUS",
  "-": "MINUS",
  "*": "MULTIPLY",
  "/": "DIVIDE",
  ".": "PERIOD",
  "..": "ELLIPSIS",
  "\\": "BACKSLASH",
  ":": "COLON",
  "%": "PERCENT",
  "|": "PIPE",
  "!": "EXCLAMATION",
  "?": "QUESTION",
  "#": "POUND",
  "&": "AMPERSAND",
  "$": "DOLLAR",
  ";": "SEMI",
  ",": "COMMA",
  "(": "L_PAREN",
  ")": "R_PAREN",
  "<": "L_ANG",
  ">": "R_ANG",
  "<=": "LTE_ANG",
  ">=": "GTE_ANG",
  "==": "EQ",
  "===": "EQQ",
  "!=": "NEQ",
  "!==": "NEQQ",
  "{": "L_BRACE",
  "}": "R_BRACE",
  "[": "L_BRACKET",
  "]": "R_BRACKET",
  "=": "EQUALS",
  "~": "TILDE"
});
var Lexer = _Lexer;

// src/core/config.js
var conversions = {
  dynamicResolvers: [
    function(str, value) {
      if (str === "Fixed") {
        return Number(value).toFixed();
      } else if (str.indexOf("Fixed:") === 0) {
        let num = str.split(":")[1];
        return Number(value).toFixed(parseInt(num));
      }
    }
  ],
  String: function(val) {
    if (val.toString) {
      return val.toString();
    } else {
      return "" + val;
    }
  },
  Int: function(val) {
    return parseInt(val);
  },
  Float: function(val) {
    return parseFloat(val);
  },
  Number: function(val) {
    return Number(val);
  },
  Date: function(val) {
    return new Date(val);
  },
  Array: function(val) {
    return Array.from(val);
  },
  JSON: function(val) {
    return JSON.stringify(val);
  },
  Object: function(val) {
    if (val instanceof String) {
      val = val.toString();
    }
    if (typeof val === "string") {
      return JSON.parse(val);
    } else {
      return Object.assign({}, val);
    }
  }
};
var config = {
  attributes: "_, script, data-script",
  defaultTransition: "all 500ms ease-in",
  disableSelector: "[disable-scripting], [data-disable-scripting]",
  hideShowStrategies: {},
  conversions
};

// src/core/helpers.js
function getCookiesAsArray() {
  let cookiesAsArray = document.cookie.split("; ").map((cookieEntry) => {
    let strings = cookieEntry.split("=");
    return { name: strings[0], value: decodeURIComponent(strings[1]) };
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
var CookieJar = new Proxy({}, {
  get(target, prop) {
    var _a;
    if (prop === "then" || prop === "asyncWrapper") {
      return null;
    } else if (prop === "length") {
      return getCookiesAsArray().length;
    } else if (prop === "clear") {
      return clearCookie;
    } else if (prop === "clearAll") {
      return clearAllCookies;
    } else if (typeof prop === "string") {
      if (!isNaN(prop)) {
        return getCookiesAsArray()[parseInt(prop)];
      } else {
        let value = (_a = document.cookie.split("; ").find((row) => row.startsWith(prop + "="))) == null ? void 0 : _a.split("=")[1];
        if (value) {
          return decodeURIComponent(value);
        }
      }
    } else if (prop === Symbol.iterator) {
      return getCookiesAsArray()[prop];
    }
  },
  set(target, prop, value) {
    var finalValue = null;
    if ("string" === typeof value) {
      finalValue = encodeURIComponent(value);
      finalValue += ";samesite=lax";
    } else {
      finalValue = encodeURIComponent(value.value);
      if (value.expires) {
        finalValue += ";expires=" + value.maxAge;
      }
      if (value.maxAge) {
        finalValue += ";max-age=" + value.maxAge;
      }
      if (value.partitioned) {
        finalValue += ";partitioned=" + value.partitioned;
      }
      if (value.path) {
        finalValue += ";path=" + value.path;
      }
      if (value.samesite) {
        finalValue += ";samesite=" + value.path;
      }
      if (value.secure) {
        finalValue += ";secure=" + value.path;
      }
    }
    document.cookie = String(prop) + "=" + finalValue;
    return true;
  }
});
var Context = class {
  /**
  * @param {*} owner
  * @param {*} feature
  * @param {*} hyperscriptTarget
  * @param {*} event
  */
  constructor(owner, feature, hyperscriptTarget, event, runtime, globalScope2) {
    this.meta = {
      runtime,
      owner,
      feature,
      iterators: {},
      ctx: this
    };
    this.locals = {
      cookies: CookieJar
    };
    this.me = hyperscriptTarget, this.you = void 0;
    this.result = void 0;
    this.event = event;
    this.target = event ? event.target : null;
    this.detail = event ? event.detail : null;
    this.sender = event ? event.detail ? event.detail.sender : null : null;
    this.body = "document" in globalScope2 ? document.body : null;
    runtime.addFeatures(owner, this);
  }
};
function getOrInitObject(root, prop) {
  var value = root[prop];
  if (value) {
    return value;
  } else {
    var newObj = {};
    root[prop] = newObj;
    return newObj;
  }
}
function varargConstructor(Cls, args) {
  return new (Cls.bind.apply(Cls, [Cls].concat(args)))();
}

// src/core/util.js
var shouldAutoIterateSymbol = Symbol();
var ElementCollection = class _ElementCollection {
  constructor(css, relativeToElement, escape) {
    this._css = css;
    this.relativeToElement = relativeToElement;
    this.escape = escape;
    this[shouldAutoIterateSymbol] = true;
  }
  get css() {
    if (this.escape) {
      return _ElementCollection._runtime.escapeSelector(this._css);
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
    return query[Symbol.iterator]();
  }
  selectMatches() {
    let query = _ElementCollection._runtime.getRootNode(this.relativeToElement).querySelectorAll(this.css);
    return query;
  }
};
var TemplatedQueryElementCollection = class extends ElementCollection {
  constructor(css, relativeToElement, templateParts) {
    super(css, relativeToElement);
    this.templateParts = templateParts;
    this.elements = templateParts.filter((elt) => elt instanceof Element);
  }
  get css() {
    let rv = "", i = 0;
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
    this.elements.forEach((el) => el.removeAttribute("data-hs-query-id"));
    return rv;
  }
};
var RegExpIterator = class {
  constructor(re, str) {
    this.re = re;
    this.str = str;
  }
  next() {
    const match = this.re.exec(this.str);
    if (match === null) return { done: true };
    else return { value: match };
  }
};
var RegExpIterable = class {
  constructor(re, flags, str) {
    this.re = re;
    this.flags = flags;
    this.str = str;
  }
  [Symbol.iterator]() {
    return new RegExpIterator(new RegExp(this.re, this.flags), this.str);
  }
};

// src/core/runtime.js
var _Runtime = class _Runtime {
  /**
   *
   * @param {Object} globalScope
   */
  constructor(globalScope2) {
    __publicField(this, "HALT", _Runtime.HALT);
    /**
     * @type {string[] | null}
     */
    __publicField(this, "_scriptAttrs", null);
    __publicField(this, "hyperscriptFeaturesMap", /* @__PURE__ */ new WeakMap());
    __publicField(this, "internalDataMap", /* @__PURE__ */ new WeakMap());
    this.globalScope = globalScope2;
  }
  /**
   * @param {HTMLElement} elt
   * @param {string} selector
   * @returns boolean
   */
  matchesSelector(elt, selector) {
    var matchesFunction = (
      // @ts-ignore
      elt.matches || elt.matchesSelector || elt.msMatchesSelector || elt.mozMatchesSelector || elt.webkitMatchesSelector || elt.oMatchesSelector
    );
    return matchesFunction && matchesFunction.call(elt, selector);
  }
  /**
   * @param {string} eventName
   * @param {Object} [detail]
   * @returns {Event}
   */
  makeEvent(eventName, detail) {
    var evt;
    if (this.globalScope.Event && typeof this.globalScope.Event === "function") {
      evt = new Event(eventName, {
        bubbles: true,
        cancelable: true,
        composed: true
      });
      evt["detail"] = detail;
    } else {
      evt = document.createEvent("CustomEvent");
      evt.initCustomEvent(eventName, true, true, detail);
    }
    return evt;
  }
  /**
   * @param {Element} elt
   * @param {string} eventName
   * @param {Object} [detail]
   * @param {Element} [sender]
   * @returns {boolean}
   */
  triggerEvent(elt, eventName, detail, sender) {
    detail = detail || {};
    detail["sender"] = sender;
    var event = this.makeEvent(eventName, detail);
    var eventResult = elt.dispatchEvent(event);
    return eventResult;
  }
  /**
   * isArrayLike returns `true` if the provided value is an array or
   * something close enough to being an array for our purposes.
   *
   * @param {any} value
   * @returns {value is Array | NodeList | HTMLCollection | FileList}
   */
  isArrayLike(value) {
    return Array.isArray(value) || typeof NodeList !== "undefined" && (value instanceof NodeList || value instanceof HTMLCollection || value instanceof FileList);
  }
  /**
   * isIterable returns `true` if the provided value supports the
   * iterator protocol.
   *
   * @param {any} value
   * @returns {value is Iterable}
   */
  isIterable(value) {
    return typeof value === "object" && Symbol.iterator in value && typeof value[Symbol.iterator] === "function";
  }
  /**
   * shouldAutoIterate returns `true` if the provided value
   * should be implicitly iterated over when accessing properties,
   * and as the target of some commands.
   *
   * Currently, this is when the value is an {ElementCollection}
   * or {isArrayLike} returns true.
   *
   * @param {any} value
   * @returns {value is (any[] | ElementCollection)}
   */
  shouldAutoIterate(value) {
    return value != null && value[shouldAutoIterateSymbol] || this.isArrayLike(value);
  }
  /**
   * forEach executes the provided `func` on every item in the `value` array.
   * if `value` is a single item (and not an array) then `func` is simply called
   * once.  If `value` is null, then no further actions are taken.
   *
   * @template T
   * @param {T | Iterable<T>} value
   * @param {(item: T) => void} func
   */
  forEach(value, func) {
    if (value == null) {
    } else if (this.isIterable(value)) {
      for (const nth of value) {
        func(nth);
      }
    } else if (this.isArrayLike(value)) {
      for (var i = 0; i < value.length; i++) {
        func(value[i]);
      }
    } else {
      func(value);
    }
  }
  /**
   * implicitLoop executes the provided `func` on:
   * - every item of {value}, if {value} should be auto-iterated
   *   (see {shouldAutoIterate})
   * - {value} otherwise
   *
   * @template T
   * @param {ElementCollection | T | T[]} value
   * @param {(item: T) => void} func
   */
  implicitLoop(value, func) {
    if (this.shouldAutoIterate(value)) {
      for (const x of value) func(x);
    } else {
      func(value);
    }
  }
  wrapArrays(args) {
    var arr = [];
    for (var i = 0; i < args.length; i++) {
      var arg = args[i];
      if (Array.isArray(arg)) {
        arr.push(Promise.all(arg));
      } else {
        arr.push(arg);
      }
    }
    return arr;
  }
  unwrapAsyncs(values) {
    for (var i = 0; i < values.length; i++) {
      var value = values[i];
      if (value.asyncWrapper) {
        values[i] = value.value;
      }
      if (Array.isArray(value)) {
        for (var j = 0; j < value.length; j++) {
          var valueElement = value[j];
          if (valueElement.asyncWrapper) {
            value[j] = valueElement.value;
          }
        }
      }
    }
  }
  /**
   * @param {ASTNode} command
   * @param {Context} ctx
   */
  unifiedExec(command, ctx) {
    while (true) {
      try {
        var next = this.unifiedEval(command, ctx);
      } catch (e) {
        if (ctx.meta.handlingFinally) {
          console.error(" Exception in finally block: ", e);
          next = _Runtime.HALT;
        } else {
          this.registerHyperTrace(ctx, e);
          if (ctx.meta.errorHandler && !ctx.meta.handlingError) {
            ctx.meta.handlingError = true;
            ctx.locals[ctx.meta.errorSymbol] = e;
            command = ctx.meta.errorHandler;
            continue;
          } else {
            ctx.meta.currentException = e;
            next = _Runtime.HALT;
          }
        }
      }
      if (next == null) {
        console.error(command, " did not return a next element to execute! context: ", ctx);
        return;
      } else if (next.then) {
        next.then((resolvedNext) => {
          this.unifiedExec(resolvedNext, ctx);
        }).catch((reason) => {
          this.unifiedExec({
            // Anonymous command to simply throw the exception
            op: function() {
              throw reason;
            }
          }, ctx);
        });
        return;
      } else if (next === _Runtime.HALT) {
        if (ctx.meta.finallyHandler && !ctx.meta.handlingFinally) {
          ctx.meta.handlingFinally = true;
          command = ctx.meta.finallyHandler;
        } else {
          if (ctx.meta.onHalt) {
            ctx.meta.onHalt();
          }
          if (ctx.meta.currentException) {
            if (ctx.meta.reject) {
              ctx.meta.reject(ctx.meta.currentException);
              return;
            } else {
              throw ctx.meta.currentException;
            }
          } else {
            return;
          }
        }
      } else {
        command = next;
      }
    }
  }
  /**
  * @param {*} parseElement
  * @param {Context} ctx
  * @param {Boolean} [shortCircuitOnValue]
  * @returns {*}
  */
  unifiedEval(parseElement, ctx, shortCircuitOnValue) {
    var args = [ctx];
    var async = false;
    var wrappedAsyncs = false;
    if (parseElement.args) {
      for (var i = 0; i < parseElement.args.length; i++) {
        var argument = parseElement.args[i];
        if (argument == null) {
          args.push(null);
        } else if (Array.isArray(argument)) {
          var arr = [];
          for (var j = 0; j < argument.length; j++) {
            var element = argument[j];
            var value = element ? element.evaluate(ctx) : null;
            if (value) {
              if (value.then) {
                async = true;
              } else if (value.asyncWrapper) {
                wrappedAsyncs = true;
              }
            }
            arr.push(value);
          }
          args.push(arr);
        } else if (argument.evaluate) {
          var value = argument.evaluate(ctx);
          if (value) {
            if (value.then) {
              async = true;
            } else if (value.asyncWrapper) {
              wrappedAsyncs = true;
            }
          }
          args.push(value);
          if (value) {
            if (shortCircuitOnValue === true) {
              break;
            }
          } else {
            if (shortCircuitOnValue === false) {
              break;
            }
          }
        } else {
          args.push(argument);
        }
      }
    }
    if (async) {
      return new Promise((resolve, reject) => {
        args = this.wrapArrays(args);
        Promise.all(args).then(function(values) {
          if (wrappedAsyncs) {
            this.unwrapAsyncs(values);
          }
          try {
            var apply = parseElement.op.apply(parseElement, values);
            resolve(apply);
          } catch (e) {
            reject(e);
          }
        }).catch(function(reason) {
          reject(reason);
        });
      });
    } else {
      if (wrappedAsyncs) {
        this.unwrapAsyncs(args);
      }
      return parseElement.op.apply(parseElement, args);
    }
  }
  /**
  * getAttributes returns the attribute name(s) to use when
  * locating hyperscript scripts in a DOM element.  If no value
  * has been configured, it defaults to config.attributes
  * @returns string[]
  */
  getScriptAttributes() {
    if (this._scriptAttrs == null) {
      this._scriptAttrs = config.attributes.replace(/ /g, "").split(",");
    }
    return this._scriptAttrs;
  }
  /**
  * @param {Element} elt
  * @returns {string | null}
  */
  getScript(elt) {
    for (var i = 0; i < this.getScriptAttributes().length; i++) {
      var scriptAttribute = this.getScriptAttributes()[i];
      if (elt.hasAttribute && elt.hasAttribute(scriptAttribute)) {
        return elt.getAttribute(scriptAttribute);
      }
    }
    if (elt instanceof HTMLScriptElement && elt.type === "text/hyperscript") {
      return elt.innerText;
    }
    return null;
  }
  /**
  * @param {*} elt
  * @returns {Object}
  */
  getHyperscriptFeatures(elt) {
    var hyperscriptFeatures = this.hyperscriptFeaturesMap.get(elt);
    if (typeof hyperscriptFeatures === "undefined") {
      if (elt) {
        this.hyperscriptFeaturesMap.set(elt, hyperscriptFeatures = {});
      }
    }
    return hyperscriptFeatures;
  }
  /**
  * @param {Object} owner
  * @param {Context} ctx
  */
  addFeatures(owner, ctx) {
    if (owner) {
      Object.assign(ctx.locals, this.getHyperscriptFeatures(owner));
      this.addFeatures(owner.parentElement, ctx);
    }
  }
  /**
  * @param {*} owner
  * @param {*} feature
  * @param {*} hyperscriptTarget
  * @param {*} event
  * @returns {Context}
  */
  makeContext(owner, feature, hyperscriptTarget, event) {
    return new Context(owner, feature, hyperscriptTarget, event, this, this.globalScope);
  }
  /**
  * @returns string
  */
  getScriptSelector() {
    return this.getScriptAttributes().map(function(attribute) {
      return "[" + attribute + "]";
    }).join(", ");
  }
  /**
  * @param {any} value
  * @param {string} type
  * @returns {any}
  */
  convertValue(value, type) {
    var dynamicResolvers = conversions.dynamicResolvers;
    for (var i = 0; i < dynamicResolvers.length; i++) {
      var dynamicResolver = dynamicResolvers[i];
      var converted = dynamicResolver(type, value);
      if (converted !== void 0) {
        return converted;
      }
    }
    if (value == null) {
      return null;
    }
    var converter = conversions[type];
    if (converter) {
      return converter(value);
    }
    throw "Unknown conversion : " + type;
  }
  /**
   *
   * @param {ASTNode} elt
   * @param {Context} ctx
   * @returns {any}
   */
  evaluateNoPromise(elt, ctx) {
    let result = elt.evaluate(ctx);
    if (result.next) {
      throw new Error(Tokens.sourceFor.call(elt) + " returned a Promise in a context that they are not allowed.");
    }
    return result;
  }
  /**
  * @param {Element} elt
  * @returns {Object}
  */
  getInternalData(elt) {
    var internalData = this.internalDataMap.get(elt);
    if (typeof internalData === "undefined") {
      this.internalDataMap.set(elt, internalData = {});
    }
    return internalData;
  }
  /**
  * @param {any} value
  * @param {string} typeString
  * @param {boolean} [nullOk]
  * @returns {boolean}
  */
  typeCheck(value, typeString, nullOk) {
    if (value == null && nullOk) {
      return true;
    }
    var typeName = Object.prototype.toString.call(value).slice(8, -1);
    return typeName === typeString;
  }
  getElementScope(context2) {
    var elt = context2.meta && context2.meta.owner;
    if (elt) {
      var internalData = this.getInternalData(elt);
      var scopeName = "elementScope";
      if (context2.meta.feature && context2.meta.feature.behavior) {
        scopeName = context2.meta.feature.behavior + "Scope";
      }
      var elementScope = getOrInitObject(internalData, scopeName);
      return elementScope;
    } else {
      return {};
    }
  }
  /**
  * @param {string} str
  * @returns {boolean}
  */
  isReservedWord(str) {
    return ["meta", "it", "result", "locals", "event", "target", "detail", "sender", "body"].includes(str);
  }
  /**
  * @param {any} context
  * @returns {boolean}
  */
  isHyperscriptContext(context2) {
    return context2 instanceof Context;
  }
  /**
  * @param {string} str
  * @param {Context} context
  * @returns {any}
  */
  resolveSymbol(str, context2, type) {
    if (str === "me" || str === "my" || str === "I") {
      return context2.me;
    }
    if (str === "it" || str === "its" || str === "result") {
      return context2.result;
    }
    if (str === "you" || str === "your" || str === "yourself") {
      return context2.you;
    } else {
      if (type === "global") {
        return this.globalScope[str];
      } else if (type === "element") {
        var elementScope = this.getElementScope(context2);
        return elementScope[str];
      } else if (type === "local") {
        return context2.locals[str];
      } else {
        if (context2.meta && context2.meta.context) {
          var fromMetaContext = context2.meta.context[str];
          if (typeof fromMetaContext !== "undefined") {
            return fromMetaContext;
          }
          if (context2.meta.context.detail) {
            fromMetaContext = context2.meta.context.detail[str];
            if (typeof fromMetaContext !== "undefined") {
              return fromMetaContext;
            }
          }
        }
        if (this.isHyperscriptContext(context2) && !this.isReservedWord(str)) {
          var fromContext = context2.locals[str];
        } else {
          var fromContext = context2[str];
        }
        if (typeof fromContext !== "undefined") {
          return fromContext;
        } else {
          var elementScope = this.getElementScope(context2);
          fromContext = elementScope[str];
          if (typeof fromContext !== "undefined") {
            return fromContext;
          } else {
            return this.globalScope[str];
          }
        }
      }
    }
  }
  setSymbol(str, context2, type, value) {
    if (type === "global") {
      this.globalScope[str] = value;
    } else if (type === "element") {
      var elementScope = this.getElementScope(context2);
      elementScope[str] = value;
    } else if (type === "local") {
      context2.locals[str] = value;
    } else {
      if (this.isHyperscriptContext(context2) && !this.isReservedWord(str) && typeof context2.locals[str] !== "undefined") {
        context2.locals[str] = value;
      } else {
        var elementScope = this.getElementScope(context2);
        var fromContext = elementScope[str];
        if (typeof fromContext !== "undefined") {
          elementScope[str] = value;
        } else {
          if (this.isHyperscriptContext(context2) && !this.isReservedWord(str)) {
            context2.locals[str] = value;
          } else {
            context2[str] = value;
          }
        }
      }
    }
  }
  /**
  * @param {ASTNode} command
  * @param {Context} context
  * @returns {undefined | ASTNode}
  */
  findNext(command, context2) {
    if (command) {
      if (command.resolveNext) {
        return command.resolveNext(context2);
      } else if (command.next) {
        return command.next;
      } else {
        return this.findNext(command.parent, context2);
      }
    }
  }
  /**
  * @param {Object<string,any>} root
  * @param {string} property
  * @param {Getter} getter
  * @returns {any}
  *
  * @callback Getter
  * @param {Object<string,any>} root
  * @param {string} property
  */
  flatGet(root, property, getter) {
    if (root != null) {
      var val = getter(root, property);
      if (typeof val !== "undefined") {
        return val;
      }
      if (this.shouldAutoIterate(root)) {
        var result = [];
        for (var component of root) {
          var componentValue = getter(component, property);
          result.push(componentValue);
        }
        return result;
      }
    }
  }
  resolveProperty(root, property) {
    return this.flatGet(root, property, (root2, property2) => root2[property2]);
  }
  resolveAttribute(root, property) {
    return this.flatGet(root, property, (root2, property2) => root2.getAttribute && root2.getAttribute(property2));
  }
  /**
   *
   * @param {Object<string, any>} root
   * @param {string} property
   * @returns {string}
   */
  resolveStyle(root, property) {
    return this.flatGet(root, property, (root2, property2) => root2.style && root2.style[property2]);
  }
  /**
   *
   * @param {Object<string, any>} root
   * @param {string} property
   * @returns {string}
   */
  resolveComputedStyle(root, property) {
    return this.flatGet(root, property, (root2, property2) => getComputedStyle(
      /** @type {Element} */
      root2
    ).getPropertyValue(property2));
  }
  /**
  * @param {Element} elt
  * @param {string[]} nameSpace
  * @param {string} name
  * @param {any} value
  */
  assignToNamespace(elt, nameSpace, name, value) {
    let root;
    if (typeof document !== "undefined" && elt === document.body) {
      root = this.globalScope;
    } else {
      root = this.getHyperscriptFeatures(elt);
    }
    var propertyName;
    while ((propertyName = nameSpace.shift()) !== void 0) {
      var newRoot = root[propertyName];
      if (newRoot == null) {
        newRoot = {};
        root[propertyName] = newRoot;
      }
      root = newRoot;
    }
    root[name] = value;
  }
  getHyperTrace(ctx, thrown) {
    var trace = [];
    var root = ctx;
    while (root.meta.caller) {
      root = root.meta.caller;
    }
    if (root.meta.traceMap) {
      return root.meta.traceMap.get(thrown, trace);
    }
  }
  registerHyperTrace(ctx, thrown) {
    var trace = [];
    var root = null;
    while (ctx != null) {
      trace.push(ctx);
      root = ctx;
      ctx = ctx.meta.caller;
    }
    if (root.meta.traceMap == null) {
      root.meta.traceMap = /* @__PURE__ */ new Map();
    }
    if (!root.meta.traceMap.get(thrown)) {
      var traceEntry = {
        trace,
        print: function(logger) {
          logger = logger || console.error;
          logger("hypertrace /// ");
          var maxLen = 0;
          for (var i = 0; i < trace.length; i++) {
            maxLen = Math.max(maxLen, trace[i].meta.feature.displayName.length);
          }
          for (var i = 0; i < trace.length; i++) {
            var traceElt = trace[i];
            logger(
              "  ->",
              traceElt.meta.feature.displayName.padEnd(maxLen + 2),
              "-",
              traceElt.meta.owner
            );
          }
        }
      };
      root.meta.traceMap.set(thrown, traceEntry);
    }
  }
  /**
  * @param {string} str
  * @returns {string}
  */
  escapeSelector(str) {
    return str.replace(/[:&()\[\]\/]/g, function(str2) {
      return "\\" + str2;
    });
  }
  /**
  * @param {any} value
  * @param {*} elt
  */
  nullCheck(value, elt) {
    if (value == null) {
      throw new Error("'" + elt.sourceFor() + "' is null");
    }
  }
  /**
  * @param {any} value
  * @returns {boolean}
  */
  isEmpty(value) {
    return value == void 0 || value.length === 0;
  }
  /**
  * @param {any} value
  * @returns {boolean}
  */
  doesExist(value) {
    if (value == null) {
      return false;
    }
    if (this.shouldAutoIterate(value)) {
      for (const elt of value) {
        return true;
      }
      return false;
    }
    return true;
  }
  /**
  * @param {Node} node
  * @returns {Document|ShadowRoot}
  */
  getRootNode(node) {
    if (node && node instanceof Node) {
      var rv = node.getRootNode();
      if (rv instanceof Document || rv instanceof ShadowRoot) return rv;
    }
    return document;
  }
  /**
   *
   * @param {Element} elt
   * @param {ASTNode} onFeature
   * @returns {EventQueue}
   *
   * @typedef {{queue:Array, executing:boolean}} EventQueue
   */
  getEventQueueFor(elt, onFeature) {
    let internalData = this.getInternalData(elt);
    var eventQueuesForElt = internalData.eventQueues;
    if (eventQueuesForElt == null) {
      eventQueuesForElt = /* @__PURE__ */ new Map();
      internalData.eventQueues = eventQueuesForElt;
    }
    var eventQueueForFeature = eventQueuesForElt.get(onFeature);
    if (eventQueueForFeature == null) {
      eventQueueForFeature = { queue: [], executing: false };
      eventQueuesForElt.set(onFeature, eventQueueForFeature);
    }
    return eventQueueForFeature;
  }
  beepValueToConsole(element, expression, value) {
    if (this.triggerEvent(element, "hyperscript:beep", { element, expression, value })) {
      var typeName;
      if (value) {
        if (value instanceof ElementCollection) {
          typeName = "ElementCollection";
        } else if (value.constructor) {
          typeName = value.constructor.name;
        } else {
          typeName = "unknown";
        }
      } else {
        typeName = "object (null)";
      }
      var logValue = value;
      if (typeName === "String") {
        logValue = '"' + logValue + '"';
      } else if (value instanceof ElementCollection) {
        logValue = Array.from(value);
      }
      console.log("///_ BEEP! The expression (" + Tokens.sourceFor.call(expression).replace("beep! ", "") + ") evaluates to:", logValue, "of type " + typeName);
    }
  }
};
__publicField(_Runtime, "HALT", {});
var Runtime = _Runtime;

// src/core/parser-helper.js
var ParserHelper = class {
  /**
   * @param {import('./parser.js').Parser} parser
   * @param {import('./tokens.js').Tokens} tokens
   */
  constructor(parser, tokens) {
    this.parser = parser;
    this.tokens = tokens;
  }
  // ===========================
  // Token delegation methods
  // ===========================
  consumeWhitespace() {
    return this.tokens.consumeWhitespace();
  }
  requireOpToken(value) {
    return this.tokens.requireOpToken(value);
  }
  matchAnyOpToken(...ops) {
    return this.tokens.matchAnyOpToken(...ops);
  }
  matchAnyToken(...tokens) {
    return this.tokens.matchAnyToken(...tokens);
  }
  matchOpToken(value) {
    return this.tokens.matchOpToken(value);
  }
  requireTokenType(type1, type2, type3, type4) {
    return this.tokens.requireTokenType(type1, type2, type3, type4);
  }
  matchTokenType(type1, type2, type3, type4) {
    return this.tokens.matchTokenType(type1, type2, type3, type4);
  }
  requireToken(value, type) {
    return this.tokens.requireToken(value, type);
  }
  peekToken(value, peek, type) {
    return this.tokens.peekToken(value, peek, type);
  }
  matchToken(value, type) {
    return this.tokens.matchToken(value, type);
  }
  consumeToken() {
    return this.tokens.consumeToken();
  }
  consumeUntil(value, type) {
    return this.tokens.consumeUntil(value, type);
  }
  lastWhitespace() {
    return this.tokens.lastWhitespace();
  }
  consumeUntilWhitespace() {
    return this.tokens.consumeUntilWhitespace();
  }
  hasMore() {
    return this.tokens.hasMore();
  }
  token(n, dontIgnoreWhitespace) {
    return this.tokens.token(n, dontIgnoreWhitespace);
  }
  currentToken() {
    return this.tokens.currentToken();
  }
  lastMatch() {
    return this.tokens.lastMatch();
  }
  pushFollow(str) {
    return this.tokens.pushFollow(str);
  }
  popFollow() {
    return this.tokens.popFollow();
  }
  clearFollows() {
    return this.tokens.clearFollows();
  }
  restoreFollows(f) {
    return this.tokens.restoreFollows(f);
  }
  get source() {
    return this.tokens.source;
  }
  get consumed() {
    return this.tokens.consumed;
  }
  get list() {
    return this.tokens.list;
  }
  // ===========================
  // Parser delegation methods
  // ===========================
  parseElement(type, root) {
    return this.parser.parseElement(type, this.tokens, root);
  }
  requireElement(type, message, root) {
    return this.parser.requireElement(type, this.tokens, message, root);
  }
  parseAnyOf(types) {
    return this.parser.parseAnyOf(types, this.tokens);
  }
  raiseParseError(message) {
    return this.parser.raiseParseError(this.tokens, message);
  }
  parseStringTemplate() {
    return this.parser.parseStringTemplate(this.tokens);
  }
  commandBoundary(token) {
    return this.parser.commandBoundary(token);
  }
  commandStart(token) {
    return this.parser.commandStart(token);
  }
  featureStart(token) {
    return this.parser.featureStart(token);
  }
  setParent(elt, parent) {
    return this.parser.setParent(elt, parent);
  }
  // Access to parser properties needed by grammars
  get possessivesDisabled() {
    return this.parser.possessivesDisabled;
  }
  set possessivesDisabled(value) {
    this.parser.possessivesDisabled = value;
  }
  get GRAMMAR() {
    return this.parser.GRAMMAR;
  }
  get COMMANDS() {
    return this.parser.COMMANDS;
  }
  get FEATURES() {
    return this.parser.FEATURES;
  }
  get LEAF_EXPRESSIONS() {
    return this.parser.LEAF_EXPRESSIONS;
  }
  get INDIRECT_EXPRESSIONS() {
    return this.parser.INDIRECT_EXPRESSIONS;
  }
  // Access to runtime for grammars that need it
  get runtime() {
    return this.parser.runtime;
  }
};

// src/core/parser.js
var Parser = class _Parser {
  constructor() {
    /** @type {Object<string,ParseRule>} */
    __publicField(this, "GRAMMAR", {});
    /** @type {Object<string,ParseRule>} */
    __publicField(this, "COMMANDS", {});
    /** @type {Object<string,ParseRule>} */
    __publicField(this, "FEATURES", {});
    /** @type {string[]} */
    __publicField(this, "LEAF_EXPRESSIONS", []);
    /** @type {string[]} */
    __publicField(this, "INDIRECT_EXPRESSIONS", []);
    this.possessivesDisabled = false;
    this.addGrammarElement("feature", function(helper) {
      if (helper.matchOpToken("(")) {
        var featureElement = helper.requireElement("feature");
        helper.requireOpToken(")");
        return featureElement;
      }
      var featureDefinition = helper.FEATURES[helper.currentToken().value || ""];
      if (featureDefinition) {
        return featureDefinition(helper);
      }
    });
    this.addGrammarElement("command", function(helper) {
      if (helper.matchOpToken("(")) {
        const commandElement2 = helper.requireElement("command");
        helper.requireOpToken(")");
        return commandElement2;
      }
      var commandDefinition = helper.COMMANDS[helper.currentToken().value || ""];
      let commandElement;
      if (commandDefinition) {
        commandElement = commandDefinition(helper);
      } else if (helper.currentToken().type === "IDENTIFIER") {
        commandElement = helper.parseElement("pseudoCommand");
      }
      if (commandElement) {
        return helper.parser.parseElement("indirectStatement", helper.tokens, commandElement);
      }
      return commandElement;
    });
    this.addGrammarElement("commandList", function(helper) {
      if (helper.hasMore()) {
        var cmd = helper.parseElement("command");
        if (cmd) {
          helper.matchToken("then");
          const next = helper.parseElement("commandList");
          if (next) cmd.next = next;
          return cmd;
        }
      }
      return {
        type: "emptyCommandListCommand",
        op: function(context2) {
          return context2.meta.runtime.findNext(this, context2);
        },
        execute: function(context2) {
          return context2.meta.runtime.unifiedExec(this, context2);
        }
      };
    });
    this.addGrammarElement("leaf", function(helper) {
      var result = helper.parseAnyOf(helper.LEAF_EXPRESSIONS);
      if (result == null) {
        return helper.parseElement("symbol");
      }
      return result;
    });
    this.addGrammarElement("indirectExpression", function(helper, root) {
      for (var i = 0; i < helper.INDIRECT_EXPRESSIONS.length; i++) {
        var indirect = helper.INDIRECT_EXPRESSIONS[i];
        root.endToken = helper.lastMatch();
        var result = helper.parser.parseElement(indirect, helper.tokens, root);
        if (result) {
          return result;
        }
      }
      return root;
    });
    this.addGrammarElement("indirectStatement", function(helper, root) {
      if (helper.matchToken("unless")) {
        root.endToken = helper.lastMatch();
        var conditional = helper.requireElement("expression");
        var unless = {
          type: "unlessStatementModifier",
          args: [conditional],
          op: function(context2, conditional2) {
            if (conditional2) {
              return this.next;
            } else {
              return root;
            }
          },
          execute: function(context2) {
            return context2.meta.runtime.unifiedExec(this, context2);
          }
        };
        root.parent = unless;
        return unless;
      }
      return root;
    });
    this.addGrammarElement("primaryExpression", function(helper) {
      var leaf = helper.parseElement("leaf");
      if (leaf) {
        return helper.parser.parseElement("indirectExpression", helper.tokens, leaf);
      }
      helper.raiseParseError("Unexpected value: " + helper.currentToken().value);
    });
  }
  use(plugin) {
    plugin(this);
    return this;
  }
  /**
   * @param {*} parseElement
   * @param {*} start
   * @param {Tokens} tokens
   */
  initElt(parseElement, start, tokens) {
    parseElement.startToken = start;
    parseElement.sourceFor = Tokens.sourceFor;
    parseElement.lineFor = Tokens.lineFor;
    parseElement.programSource = tokens.source;
  }
  /**
   * @param {string} type
   * @param {Tokens} tokens
   * @param {ASTNode?} root
   * @returns {ASTNode}
   */
  parseElement(type, tokens, root = void 0) {
    var elementDefinition = this.GRAMMAR[type];
    if (elementDefinition) {
      var start = tokens.currentToken();
      var helper = new ParserHelper(this, tokens);
      var parseElement = elementDefinition(helper, root);
      if (parseElement) {
        this.initElt(parseElement, start, tokens);
        parseElement.endToken = parseElement.endToken || tokens.lastMatch();
        var root = parseElement.root;
        while (root != null) {
          this.initElt(root, start, tokens);
          root = root.root;
        }
      }
      return parseElement;
    }
  }
  /**
   * @param {string} type
   * @param {Tokens} tokens
   * @param {string} [message]
   * @param {*} [root]
   * @returns {ASTNode}
   */
  requireElement(type, tokens, message, root) {
    var result = this.parseElement(type, tokens, root);
    if (!result) _Parser.raiseParseError(tokens, message || "Expected " + type);
    return result;
  }
  /**
   * @param {string[]} types
   * @param {Tokens} tokens
   * @param {Runtime} [runtime]
   * @returns {ASTNode}
   */
  parseAnyOf(types, tokens) {
    for (var i = 0; i < types.length; i++) {
      var type = types[i];
      var expression = this.parseElement(type, tokens);
      if (expression) {
        return expression;
      }
    }
  }
  /**
   * @param {string} name
   * @param {ParseRule} definition
   */
  addGrammarElement(name, definition) {
    this.GRAMMAR[name] = definition;
  }
  /**
   * @param {string} keyword
   * @param {ParseRule} definition
   */
  addCommand(keyword, definition) {
    var commandGrammarType = keyword + "Command";
    var commandDefinitionWrapper = function(helper) {
      const commandElement = definition(helper);
      if (commandElement) {
        commandElement.type = commandGrammarType;
        commandElement.execute = function(context2) {
          context2.meta.command = commandElement;
          return context2.meta.runtime.unifiedExec(this, context2);
        };
        return commandElement;
      }
    };
    this.GRAMMAR[commandGrammarType] = commandDefinitionWrapper;
    this.COMMANDS[keyword] = commandDefinitionWrapper;
  }
  /**
   * @param {string} keyword
   * @param {ParseRule} definition
   */
  addFeature(keyword, definition) {
    var featureGrammarType = keyword + "Feature";
    var featureDefinitionWrapper = function(helper) {
      var featureElement = definition(helper);
      if (featureElement) {
        featureElement.isFeature = true;
        featureElement.keyword = keyword;
        featureElement.type = featureGrammarType;
        return featureElement;
      }
    };
    this.GRAMMAR[featureGrammarType] = featureDefinitionWrapper;
    this.FEATURES[keyword] = featureDefinitionWrapper;
  }
  /**
   * @param {string} name
   * @param {ParseRule} definition
   */
  addLeafExpression(name, definition) {
    this.LEAF_EXPRESSIONS.push(name);
    this.addGrammarElement(name, definition);
  }
  /**
   * @param {string} name
   * @param {ParseRule} definition
   */
  addIndirectExpression(name, definition) {
    this.INDIRECT_EXPRESSIONS.push(name);
    this.addGrammarElement(name, definition);
  }
  /**
   *
   * @param {Tokens} tokens
   * @returns string
   */
  static createParserContext(tokens) {
    var currentToken = tokens.currentToken();
    var source = tokens.source;
    var lines = source.split("\n");
    var line = currentToken && currentToken.line ? currentToken.line - 1 : lines.length - 1;
    var contextLine = lines[line];
    var offset = (
      /** @type {number} */
      currentToken && currentToken.line ? currentToken.column : contextLine.length - 1
    );
    return contextLine + "\n" + " ".repeat(offset) + "^^\n\n";
  }
  /**
   * @param {Tokens} tokens
   * @param {string} [message]
   * @returns {never}
   */
  static raiseParseError(tokens, message) {
    message = (message || "Unexpected Token : " + tokens.currentToken().value) + "\n\n" + _Parser.createParserContext(tokens);
    var error = new Error(message);
    error["tokens"] = tokens;
    throw error;
  }
  /**
   * @param {Tokens} tokens
   * @param {string} [message]
   */
  raiseParseError(tokens, message) {
    _Parser.raiseParseError(tokens, message);
  }
  /**
   * @param {Tokens} tokens
   * @returns {ASTNode}
   */
  parseHyperScript(tokens) {
    var result = this.parseElement("hyperscript", tokens);
    if (tokens.hasMore()) this.raiseParseError(tokens);
    if (result) return result;
  }
  /**
   * @param {Lexer} lexer
   * @param {string} src
   * @returns {ASTNode}
   */
  parse(lexer, src) {
    var tokens = lexer.tokenize(src);
    if (this.commandStart(tokens.currentToken())) {
      var commandList = this.requireElement("commandList", tokens);
      if (tokens.hasMore()) _Parser.raiseParseError(tokens);
      this.ensureTerminated(commandList);
      return commandList;
    } else if (this.featureStart(tokens.currentToken())) {
      var hyperscript = this.requireElement("hyperscript", tokens);
      if (tokens.hasMore()) _Parser.raiseParseError(tokens);
      return hyperscript;
    } else {
      var expression = this.requireElement("expression", tokens);
      if (tokens.hasMore()) _Parser.raiseParseError(tokens);
      return expression;
    }
  }
  /**
   * @param {ASTNode | undefined} elt
   * @param {ASTNode} parent
   */
  setParent(elt, parent) {
    if (typeof elt === "object") {
      elt.parent = parent;
      if (typeof parent === "object") {
        parent.children = parent.children || /* @__PURE__ */ new Set();
        parent.children.add(elt);
      }
      this.setParent(elt.next, parent);
    }
  }
  /**
   * @param {Token} token
   * @returns {ParseRule}
   */
  commandStart(token) {
    return this.COMMANDS[token.value || ""];
  }
  /**
   * @param {Token} token
   * @returns {ParseRule}
   */
  featureStart(token) {
    return this.FEATURES[token.value || ""];
  }
  /**
   * @param {Token} token
   * @returns {boolean}
   */
  commandBoundary(token) {
    if (token.value == "end" || token.value == "then" || token.value == "else" || token.value == "otherwise" || token.value == ")" || this.commandStart(token) || this.featureStart(token) || token.type == "EOF") {
      return true;
    }
    return false;
  }
  /**
   * @param {Tokens} tokens
   * @returns {(string | ASTNode)[]}
   */
  parseStringTemplate(tokens) {
    var returnArr = [""];
    do {
      returnArr.push(tokens.lastWhitespace());
      if (tokens.currentToken().value === "$") {
        tokens.consumeToken();
        var startingBrace = tokens.matchOpToken("{");
        returnArr.push(this.requireElement("expression", tokens));
        if (startingBrace) {
          tokens.requireOpToken("}");
        }
        returnArr.push("");
      } else if (tokens.currentToken().value === "\\") {
        tokens.consumeToken();
        tokens.consumeToken();
      } else {
        var token = tokens.consumeToken();
        returnArr[returnArr.length - 1] += token ? token.value : "";
      }
    } while (tokens.hasMore());
    returnArr.push(tokens.lastWhitespace());
    return returnArr;
  }
  /**
   * @param {ASTNode} commandList
   */
  ensureTerminated(commandList) {
    var implicitReturn = {
      type: "implicitReturn",
      op: function(context2) {
        context2.meta.returned = true;
        if (context2.meta.resolve) {
          context2.meta.resolve();
        }
        return Runtime.HALT;
      },
      execute: function(ctx) {
      }
    };
    var end = commandList;
    while (end.next) {
      end = end.next;
    }
    end.next = implicitReturn;
  }
};

// src/parsetree/expressions/webliterals.js
var IdRef = class {
  /**
   * Parse an ID reference
   * @param {ParserHelper} helper
   * @returns {any | undefined}
   */
  static parse(helper) {
    var _a, _b;
    const Lexer2 = helper.parser.constructor.Lexer || ((_b = (_a = window._hyperscript) == null ? void 0 : _a.internals) == null ? void 0 : _b.Lexer);
    var elementId = helper.matchTokenType("ID_REF");
    if (!elementId) return;
    if (!elementId.value) return;
    if (elementId.template) {
      var templateValue = elementId.value.substring(2);
      var innerTokens = Lexer2.tokenize(templateValue);
      var innerExpression = helper.parser.requireElement("expression", innerTokens);
      return {
        type: "idRefTemplate",
        args: [innerExpression],
        op: function(context2, arg) {
          return context2.meta.runtime.getRootNode(context2.me).getElementById(arg);
        },
        evaluate: function(context2) {
          return context2.meta.runtime.unifiedEval(this, context2);
        }
      };
    } else {
      const value = elementId.value.substring(1);
      return {
        type: "idRef",
        css: elementId.value,
        value,
        evaluate: function(context2) {
          return context2.meta.runtime.getRootNode(context2.me).getElementById(value);
        }
      };
    }
  }
};
var ClassRef = class {
  /**
   * Parse a class reference
   * @param {ParserHelper} helper
   * @returns {any | undefined}
   */
  static parse(helper) {
    var _a, _b;
    const Lexer2 = helper.parser.constructor.Lexer || ((_b = (_a = window._hyperscript) == null ? void 0 : _a.internals) == null ? void 0 : _b.Lexer);
    var classRef = helper.matchTokenType("CLASS_REF");
    if (!classRef) return;
    if (!classRef.value) return;
    if (classRef.template) {
      var templateValue = classRef.value.substring(2);
      var innerTokens = Lexer2.tokenize(templateValue);
      var innerExpression = helper.parser.requireElement("expression", innerTokens);
      return {
        type: "classRefTemplate",
        args: [innerExpression],
        op: function(context2, arg) {
          return new ElementCollection("." + arg, context2.me, true);
        },
        evaluate: function(context2) {
          return context2.meta.runtime.unifiedEval(this, context2);
        }
      };
    } else {
      const css = classRef.value;
      const className = css.substr(1);
      return {
        type: "classRef",
        css,
        className,
        evaluate: function(context2) {
          return new ElementCollection(css, context2.me, true);
        }
      };
    }
  }
};
var QueryRef = class {
  /**
   * Parse a query reference
   * @param {ParserHelper} helper
   * @returns {any | undefined}
   */
  static parse(helper) {
    var _a, _b;
    const Lexer2 = helper.parser.constructor.Lexer || ((_b = (_a = window._hyperscript) == null ? void 0 : _a.internals) == null ? void 0 : _b.Lexer);
    var queryStart = helper.matchOpToken("<");
    if (!queryStart) return;
    var queryTokens = helper.consumeUntil("/");
    helper.requireOpToken("/");
    helper.requireOpToken(">");
    var queryValue = queryTokens.map(function(t) {
      if (t.type === "STRING") {
        return '"' + t.value + '"';
      } else {
        return t.value;
      }
    }).join("");
    var template, innerTokens, args;
    if (/\$[^=]/.test(queryValue)) {
      template = true;
      innerTokens = Lexer2.tokenize(queryValue, true);
      args = helper.parser.parseStringTemplate(innerTokens);
    }
    return {
      type: "queryRef",
      css: queryValue,
      args,
      op: function(context2, ...args2) {
        if (template) {
          return new TemplatedQueryElementCollection(queryValue, context2.me, args2);
        } else {
          return new ElementCollection(queryValue, context2.me);
        }
      },
      evaluate: function(context2) {
        return context2.meta.runtime.unifiedEval(this, context2);
      }
    };
  }
};
var AttributeRef = class {
  /**
   * Parse an attribute reference
   * @param {ParserHelper} helper
   * @returns {any | undefined}
   */
  static parse(helper) {
    var attributeRef = helper.matchTokenType("ATTRIBUTE_REF");
    if (!attributeRef) return;
    if (!attributeRef.value) return;
    var outerVal = attributeRef.value;
    if (outerVal.indexOf("[") === 0) {
      var innerValue = outerVal.substring(2, outerVal.length - 1);
    } else {
      var innerValue = outerVal.substring(1);
    }
    var css = "[" + innerValue + "]";
    var split = innerValue.split("=");
    var name = split[0];
    var value = split[1];
    if (value) {
      if (value.indexOf('"') === 0) {
        value = value.substring(1, value.length - 1);
      }
    }
    return {
      type: "attributeRef",
      name,
      css,
      value,
      op: function(context2) {
        var target = context2.you || context2.me;
        if (target) {
          return target.getAttribute(name);
        }
      },
      evaluate: function(context2) {
        return context2.meta.runtime.unifiedEval(this, context2);
      }
    };
  }
};
var StyleRef = class {
  /**
   * Parse a style reference
   * @param {ParserHelper} helper
   * @returns {any | undefined}
   */
  static parse(helper) {
    var styleRef = helper.matchTokenType("STYLE_REF");
    if (!styleRef) return;
    if (!styleRef.value) return;
    var styleProp = styleRef.value.substr(1);
    if (styleProp.startsWith("computed-")) {
      styleProp = styleProp.substr("computed-".length);
      return {
        type: "computedStyleRef",
        name: styleProp,
        op: function(context2) {
          var target = context2.you || context2.me;
          if (target) {
            return context2.meta.runtime.resolveComputedStyle(target, styleProp);
          }
        },
        evaluate: function(context2) {
          return context2.meta.runtime.unifiedEval(this, context2);
        }
      };
    } else {
      return {
        type: "styleRef",
        name: styleProp,
        op: function(context2) {
          var target = context2.you || context2.me;
          if (target) {
            return context2.meta.runtime.resolveStyle(target, styleProp);
          }
        },
        evaluate: function(context2) {
          return context2.meta.runtime.unifiedEval(this, context2);
        }
      };
    }
  }
};
var StyleLiteral = class {
  /**
   * Parse a style literal
   * @param {ParserHelper} helper
   * @returns {any | undefined}
   */
  static parse(helper) {
    if (!helper.matchOpToken("{")) return;
    var stringParts = [""];
    var exprs = [];
    while (helper.hasMore()) {
      if (helper.matchOpToken("\\")) {
        helper.consumeToken();
      } else if (helper.matchOpToken("}")) {
        break;
      } else if (helper.matchToken("$")) {
        var opencurly = helper.matchOpToken("{");
        var expr = helper.parseElement("expression");
        if (opencurly) helper.requireOpToken("}");
        exprs.push(expr);
        stringParts.push("");
      } else {
        var tok = helper.consumeToken();
        stringParts[stringParts.length - 1] += helper.source.substring(tok.start, tok.end);
      }
      stringParts[stringParts.length - 1] += helper.lastWhitespace();
    }
    return {
      type: "styleLiteral",
      args: [exprs],
      op: function(ctx, exprs2) {
        var rv = "";
        stringParts.forEach(function(part, idx) {
          rv += part;
          if (idx in exprs2) rv += exprs2[idx];
        });
        return rv;
      },
      evaluate: function(ctx) {
        return ctx.meta.runtime.unifiedEval(this, ctx);
      }
    };
  }
};

// src/parsetree/expressions/expressions.js
var ParenthesizedExpression = class {
  /**
   * Parse a parenthesized expression
   * @param {ParserHelper} helper
   * @returns {any | undefined}
   */
  static parse(helper) {
    if (helper.matchOpToken("(")) {
      var follows = helper.clearFollows();
      try {
        var expr = helper.requireElement("expression");
      } finally {
        helper.restoreFollows(follows);
      }
      helper.requireOpToken(")");
      return expr;
    }
  }
};
var BlockLiteral = class _BlockLiteral {
  constructor(args, expr) {
    this.type = "blockLiteral";
    this.args = args;
    this.expr = expr;
  }
  /**
   * Parse a block literal (lambda expression)
   * @param {ParserHelper} helper
   * @returns {BlockLiteral | undefined}
   */
  static parse(helper) {
    if (!helper.matchOpToken("\\")) return;
    var args = [];
    var arg1 = helper.matchTokenType("IDENTIFIER");
    if (arg1) {
      args.push(arg1);
      while (helper.matchOpToken(",")) {
        args.push(helper.requireTokenType("IDENTIFIER"));
      }
    }
    helper.requireOpToken("-");
    helper.requireOpToken(">");
    var expr = helper.requireElement("expression");
    return new _BlockLiteral(args, expr);
  }
  /**
   * Evaluate to a function
   * @param {Context} ctx
   * @returns {Function}
   */
  evaluate(ctx) {
    var args = this.args;
    var expr = this.expr;
    var returnFunc = function() {
      for (var i = 0; i < args.length; i++) {
        ctx.locals[args[i].value] = arguments[i];
      }
      return expr.evaluate(ctx);
    };
    return returnFunc;
  }
};
var NegativeNumber = class _NegativeNumber {
  constructor(root) {
    this.type = "negativeNumber";
    this.root = root;
    this.args = [root];
  }
  /**
   * Parse a negative number
   * @param {ParserHelper} helper
   * @returns {NegativeNumber | any}
   */
  static parse(helper) {
    if (helper.matchOpToken("-")) {
      var root = helper.requireElement("negativeNumber");
      return new _NegativeNumber(root);
    } else {
      return helper.requireElement("primaryExpression");
    }
  }
  /**
   * Op function for negation
   */
  op(context2, value) {
    return -1 * value;
  }
  /**
   * Evaluate negated value
   * @param {Context} context
   * @returns {number}
   */
  evaluate(context2) {
    return context2.meta.runtime.unifiedEval(this, context2);
  }
};
var LogicalNot = class _LogicalNot {
  constructor(root) {
    this.type = "logicalNot";
    this.root = root;
    this.args = [root];
  }
  /**
   * Parse a logical not expression
   * @param {ParserHelper} helper
   * @returns {LogicalNot | undefined}
   */
  static parse(helper) {
    if (!helper.matchToken("not")) return;
    var root = helper.requireElement("unaryExpression");
    return new _LogicalNot(root);
  }
  /**
   * Op function for logical not
   */
  op(context2, val) {
    return !val;
  }
  /**
   * Evaluate logical not
   * @param {Context} context
   * @returns {boolean}
   */
  evaluate(context2) {
    return context2.meta.runtime.unifiedEval(this, context2);
  }
};
var SymbolRef = class _SymbolRef {
  constructor(token, scope, name) {
    this.type = "symbol";
    this.token = token;
    this.scope = scope;
    this.name = name;
  }
  /**
   * Parse a symbol reference
   * @param {ParserHelper} helper
   * @returns {SymbolRef | undefined}
   */
  static parse(helper) {
    var scope = "default";
    if (helper.matchToken("global")) {
      scope = "global";
    } else if (helper.matchToken("element") || helper.matchToken("module")) {
      scope = "element";
      if (helper.matchOpToken("'")) {
        helper.requireToken("s");
      }
    } else if (helper.matchToken("local")) {
      scope = "local";
    }
    let eltPrefix = helper.matchOpToken(":");
    let identifier = helper.matchTokenType("IDENTIFIER");
    if (identifier && identifier.value) {
      var name = identifier.value;
      if (eltPrefix) {
        name = ":" + name;
      }
      if (scope === "default") {
        if (name.indexOf("$") === 0) {
          scope = "global";
        }
        if (name.indexOf(":") === 0) {
          scope = "element";
        }
      }
      return new _SymbolRef(identifier, scope, name);
    }
  }
  /**
   * Evaluate symbol reference
   * @param {Context} context
   * @returns {any}
   */
  evaluate(context2) {
    return context2.meta.runtime.resolveSymbol(this.name, context2, this.scope);
  }
};
var BeepExpression = class _BeepExpression {
  constructor(expression) {
    this.type = "beepExpression";
    this.expression = expression;
    this.expression["booped"] = true;
  }
  /**
   * Parse a beep expression
   * @param {ParserHelper} helper
   * @returns {any | undefined}
   */
  static parse(helper) {
    if (!helper.matchToken("beep!")) return;
    var expression = helper.parseElement("unaryExpression");
    if (expression) {
      return new _BeepExpression(expression);
    }
  }
  /**
   * Evaluate expression and log to console
   * @param {Context} ctx
   * @returns {any}
   */
  evaluate(ctx) {
    let value = this.expression.evaluate(ctx);
    let element = ctx.me;
    ctx.meta.runtime.beepValueToConsole(element, this.expression, value);
    return value;
  }
};
var PropertyAccess = class _PropertyAccess {
  constructor(root, prop) {
    this.type = "propertyAccess";
    this.root = root;
    this.prop = prop;
    this.args = [root];
  }
  /**
   * Parse a property access expression
   * @param {ParserHelper} helper
   * @param {any} root - The root expression
   * @returns {any | undefined}
   */
  static parse(helper, root) {
    if (!helper.matchOpToken(".")) return;
    var prop = helper.requireTokenType("IDENTIFIER");
    var propertyAccess = new _PropertyAccess(root, prop);
    return helper.parser.parseElement("indirectExpression", helper.tokens, propertyAccess);
  }
  /**
   * Op function for property access
   */
  op(context2, rootVal) {
    var value = context2.meta.runtime.resolveProperty(rootVal, this.prop.value);
    return value;
  }
  /**
   * Evaluate property access
   * @param {Context} context
   * @returns {any}
   */
  evaluate(context2) {
    return context2.meta.runtime.unifiedEval(this, context2);
  }
};
var OfExpression = class _OfExpression {
  constructor(prop, newRoot, attribute, expression, args, urRoot) {
    this.type = "ofExpression";
    this.prop = prop;
    this.root = newRoot;
    this.attribute = attribute;
    this.expression = expression;
    this.args = args;
    this._urRoot = urRoot;
  }
  /**
   * Parse an of expression
   * @param {ParserHelper} helper
   * @param {any} root - The property expression
   * @returns {any | undefined}
   */
  static parse(helper, root) {
    if (!helper.matchToken("of")) return;
    var newRoot = helper.requireElement("unaryExpression");
    var childOfUrRoot = null;
    var urRoot = root;
    while (urRoot.root) {
      childOfUrRoot = urRoot;
      urRoot = urRoot.root;
    }
    if (urRoot.type !== "symbol" && urRoot.type !== "attributeRef" && urRoot.type !== "styleRef" && urRoot.type !== "computedStyleRef") {
      helper.raiseParseError("Cannot take a property of a non-symbol: " + urRoot.type);
    }
    var attribute = urRoot.type === "attributeRef";
    var style = urRoot.type === "styleRef" || urRoot.type === "computedStyleRef";
    var attributeElt = attribute || style ? urRoot : null;
    var prop = urRoot.name;
    var propertyAccess = new _OfExpression(
      urRoot.token,
      // can be undefined for attributeRef
      newRoot,
      attributeElt,
      root,
      [newRoot],
      urRoot
    );
    if (urRoot.type === "attributeRef") {
      propertyAccess.attribute = urRoot;
    }
    if (childOfUrRoot) {
      childOfUrRoot.root = propertyAccess;
      childOfUrRoot.args = [propertyAccess];
    } else {
      root = propertyAccess;
    }
    return helper.parser.parseElement("indirectExpression", helper.tokens, root);
  }
  /**
   * Op function for of expression
   */
  op(context2, rootVal) {
    var urRoot = this._urRoot;
    var prop = urRoot.name;
    var attribute = urRoot.type === "attributeRef";
    var style = urRoot.type === "styleRef" || urRoot.type === "computedStyleRef";
    if (attribute) {
      return context2.meta.runtime.resolveAttribute(rootVal, prop);
    } else if (style) {
      if (urRoot.type === "computedStyleRef") {
        return context2.meta.runtime.resolveComputedStyle(rootVal, prop);
      } else {
        return context2.meta.runtime.resolveStyle(rootVal, prop);
      }
    } else {
      return context2.meta.runtime.resolveProperty(rootVal, prop);
    }
  }
  /**
   * Evaluate of expression
   * @param {Context} context
   * @returns {any}
   */
  evaluate(context2) {
    return context2.meta.runtime.unifiedEval(this, context2);
  }
};
var PossessiveExpression = class _PossessiveExpression {
  constructor(root, attribute, prop) {
    this.type = "possessive";
    this.root = root;
    this.attribute = attribute;
    this.prop = prop;
    this.args = [root];
  }
  /**
   * Parse a possessive expression
   * @param {ParserHelper} helper
   * @param {any} root
   * @returns {any | undefined}
   */
  static parse(helper, root) {
    if (helper.possessivesDisabled) {
      return;
    }
    var apostrophe = helper.matchOpToken("'");
    if (apostrophe || root.type === "symbol" && (root.name === "my" || root.name === "its" || root.name === "your") && (helper.currentToken().type === "IDENTIFIER" || helper.currentToken().type === "ATTRIBUTE_REF" || helper.currentToken().type === "STYLE_REF")) {
      if (apostrophe) {
        helper.requireToken("s");
      }
      var attribute, style, prop;
      attribute = helper.parseElement("attributeRef");
      if (attribute == null) {
        style = helper.parseElement("styleRef");
        if (style == null) {
          prop = helper.requireTokenType("IDENTIFIER");
        }
      }
      var propertyAccess = new _PossessiveExpression(root, attribute || style, prop);
      return helper.parser.parseElement("indirectExpression", helper.tokens, propertyAccess);
    }
  }
  /**
   * Op function for possessive
   */
  op(context2, rootVal) {
    if (this.attribute) {
      var value;
      if (this.attribute.type === "computedStyleRef") {
        value = context2.meta.runtime.resolveComputedStyle(rootVal, this.attribute["name"]);
      } else if (this.attribute.type === "styleRef") {
        value = context2.meta.runtime.resolveStyle(rootVal, this.attribute["name"]);
      } else {
        value = context2.meta.runtime.resolveAttribute(rootVal, this.attribute.name);
      }
    } else {
      var value = context2.meta.runtime.resolveProperty(rootVal, this.prop.value);
    }
    return value;
  }
  /**
   * Evaluate possessive expression
   * @param {Context} context
   * @returns {any}
   */
  evaluate(context2) {
    return context2.meta.runtime.unifiedEval(this, context2);
  }
};
var InExpression = class _InExpression {
  constructor(root, target) {
    this.type = "inExpression";
    this.root = root;
    this.target = target;
    this.args = [root, target];
  }
  /**
   * Parse an in expression
   * @param {ParserHelper} helper
   * @param {any} root
   * @returns {InExpression | undefined}
   */
  static parse(helper, root) {
    if (!helper.matchToken("in")) return;
    var target = helper.requireElement("unaryExpression");
    var inExpression = new _InExpression(root, target);
    return helper.parser.parseElement("indirectExpression", helper.tokens, inExpression);
  }
  /**
   * Op function for in expression
   */
  op(context2, rootVal, target) {
    var returnArr = [];
    if (rootVal.css) {
      context2.meta.runtime.implicitLoop(target, function(targetElt) {
        var results = targetElt.querySelectorAll(rootVal.css);
        for (var i = 0; i < results.length; i++) {
          returnArr.push(results[i]);
        }
      });
    } else if (rootVal instanceof Element) {
      var within = false;
      context2.meta.runtime.implicitLoop(target, function(targetElt) {
        if (targetElt.contains(rootVal)) {
          within = true;
        }
      });
      if (within) {
        return rootVal;
      }
    } else {
      context2.meta.runtime.implicitLoop(rootVal, function(rootElt) {
        context2.meta.runtime.implicitLoop(target, function(targetElt) {
          if (rootElt === targetElt) {
            returnArr.push(rootElt);
          }
        });
      });
    }
    return returnArr;
  }
  /**
   * Evaluate in expression
   * @param {Context} context
   * @returns {any}
   */
  evaluate(context2) {
    return context2.meta.runtime.unifiedEval(this, context2);
  }
};
var AsExpression = class _AsExpression {
  constructor(root, conversion) {
    this.type = "asExpression";
    this.root = root;
    this.conversion = conversion;
    this.args = [root];
  }
  /**
   * Parse an as expression
   * @param {ParserHelper} helper
   * @param {any} root
   * @returns {AsExpression | undefined}
   */
  static parse(helper, root) {
    if (!helper.matchToken("as")) return;
    helper.matchToken("a") || helper.matchToken("an");
    var conversion = helper.requireElement("dotOrColonPath").evaluate();
    var asExpression = new _AsExpression(root, conversion);
    return helper.parser.parseElement("indirectExpression", helper.tokens, asExpression);
  }
  /**
   * Op function for as expression
   */
  op(context2, rootVal) {
    return context2.meta.runtime.convertValue(rootVal, this.conversion);
  }
  /**
   * Evaluate as expression
   * @param {Context} context
   * @returns {any}
   */
  evaluate(context2) {
    return context2.meta.runtime.unifiedEval(this, context2);
  }
};
var FunctionCall = class _FunctionCall {
  constructor(root, argExpressions, args, isMethodCall) {
    this.type = "functionCall";
    this.root = root;
    this.argExressions = argExpressions;
    this.args = args;
    this._isMethodCall = isMethodCall;
    this._parseRoot = root;
  }
  /**
   * Parse a function call
   * @param {ParserHelper} helper
   * @param {any} root
   * @returns {FunctionCall | undefined}
   */
  static parse(helper, root) {
    if (!helper.matchOpToken("(")) return;
    var args = [];
    if (!helper.matchOpToken(")")) {
      do {
        args.push(helper.requireElement("expression"));
      } while (helper.matchOpToken(","));
      helper.requireOpToken(")");
    }
    var functionCall;
    if (root.root) {
      functionCall = new _FunctionCall(root, args, [root.root, args], true);
    } else {
      functionCall = new _FunctionCall(root, args, [root, args], false);
    }
    return helper.parser.parseElement("indirectExpression", helper.tokens, functionCall);
  }
  /**
   * Op function for function call
   */
  op(context2, firstArg, argVals) {
    if (this._isMethodCall) {
      var rootRoot = firstArg;
      context2.meta.runtime.nullCheck(rootRoot, this._parseRoot.root);
      var func = rootRoot[this._parseRoot.prop.value];
      context2.meta.runtime.nullCheck(func, this._parseRoot);
      if (func.hyperfunc) {
        argVals.push(context2);
      }
      return func.apply(rootRoot, argVals);
    } else {
      var func = firstArg;
      context2.meta.runtime.nullCheck(func, this._parseRoot);
      if (func.hyperfunc) {
        argVals.push(context2);
      }
      return func.apply(null, argVals);
    }
  }
  /**
   * Evaluate function call
   * @param {Context} context
   * @returns {any}
   */
  evaluate(context2) {
    return context2.meta.runtime.unifiedEval(this, context2);
  }
};
var AttributeRefAccess = class _AttributeRefAccess {
  constructor(root, attribute) {
    this.type = "attributeRefAccess";
    this.root = root;
    this.attribute = attribute;
    this.args = [root];
  }
  /**
   * Parse an attribute ref access
   * @param {ParserHelper} helper
   * @param {any} root
   * @returns {AttributeRefAccess | undefined}
   */
  static parse(helper, root) {
    var attribute = helper.parseElement("attributeRef");
    if (!attribute) return;
    return new _AttributeRefAccess(root, attribute);
  }
  /**
   * Op function for attribute ref access
   */
  op(_ctx, rootVal) {
    var value = _ctx.meta.runtime.resolveAttribute(rootVal, this.attribute.name);
    return value;
  }
  /**
   * Evaluate attribute ref access
   * @param {Context} context
   * @returns {any}
   */
  evaluate(context2) {
    return context2.meta.runtime.unifiedEval(this, context2);
  }
};
function sloppyContains(src, container, value) {
  if (container["contains"]) {
    return container.contains(value);
  } else if (container["includes"]) {
    return container.includes(value);
  } else {
    throw Error("The value of " + src.sourceFor() + " does not have a contains or includes method on it");
  }
}
function sloppyMatches(src, target, toMatch) {
  if (target["match"]) {
    return !!target.match(toMatch);
  } else if (target["matches"]) {
    return target.matches(toMatch);
  } else {
    throw Error("The value of " + src.sourceFor() + " does not have a match or matches method on it");
  }
}
var ArrayIndex = class _ArrayIndex {
  constructor(root, firstIndex, secondIndex, andBefore, andAfter) {
    this.type = "arrayIndex";
    this.root = root;
    this.prop = firstIndex;
    this.firstIndex = firstIndex;
    this.secondIndex = secondIndex;
    this.andBefore = andBefore;
    this.andAfter = andAfter;
    this.args = [root, firstIndex, secondIndex];
  }
  /**
   * Parse an array index expression
   * @param {ParserHelper} helper
   * @param {any} root
   * @returns {any | undefined}
   */
  static parse(helper, root) {
    if (!helper.matchOpToken("[")) return;
    var andBefore = false;
    var andAfter = false;
    var firstIndex = null;
    var secondIndex = null;
    if (helper.matchOpToken("..")) {
      andBefore = true;
      firstIndex = helper.requireElement("expression");
    } else {
      firstIndex = helper.requireElement("expression");
      if (helper.matchOpToken("..")) {
        andAfter = true;
        var current = helper.currentToken();
        if (current.type !== "R_BRACKET") {
          secondIndex = helper.parseElement("expression");
        }
      }
    }
    helper.requireOpToken("]");
    var arrayIndex = new _ArrayIndex(root, firstIndex, secondIndex, andBefore, andAfter);
    return helper.parser.parseElement("indirectExpression", helper.tokens, arrayIndex);
  }
  /**
   * Op function for array index
   */
  op(_ctx, root, firstIndex, secondIndex) {
    if (root == null) {
      return null;
    }
    if (this.andBefore) {
      if (firstIndex < 0) {
        firstIndex = root.length + firstIndex;
      }
      return root.slice(0, firstIndex + 1);
    } else if (this.andAfter) {
      if (secondIndex != null) {
        if (secondIndex < 0) {
          secondIndex = root.length + secondIndex;
        }
        return root.slice(firstIndex, secondIndex + 1);
      } else {
        return root.slice(firstIndex);
      }
    } else {
      return root[firstIndex];
    }
  }
  /**
   * Evaluate array index
   * @param {Context} context
   * @returns {any}
   */
  evaluate(context2) {
    return context2.meta.runtime.unifiedEval(this, context2);
  }
};
var MathOperator = class _MathOperator {
  constructor(lhs, operator, rhs) {
    this.type = "mathOperator";
    this.lhs = lhs;
    this.rhs = rhs;
    this.operator = operator;
    this.args = [lhs, rhs];
  }
  /**
   * Parse math operator expression
   * @param {ParserHelper} helper
   * @returns {any}
   */
  static parse(helper) {
    var expr = helper.parseElement("unaryExpression");
    var mathOp, initialMathOp = null;
    mathOp = helper.matchAnyOpToken("+", "-", "*", "/") || helper.matchToken("mod");
    while (mathOp) {
      initialMathOp = initialMathOp || mathOp;
      var operator = mathOp.value;
      if (initialMathOp.value !== operator) {
        helper.raiseParseError("You must parenthesize math operations with different operators");
      }
      var rhs = helper.parseElement("unaryExpression");
      expr = new _MathOperator(expr, operator, rhs);
      mathOp = helper.matchAnyOpToken("+", "-", "*", "/") || helper.matchToken("mod");
    }
    return expr;
  }
  /**
   * Op function for math operations
   */
  op(context2, lhsVal, rhsVal) {
    if (this.operator === "+") {
      return lhsVal + rhsVal;
    } else if (this.operator === "-") {
      return lhsVal - rhsVal;
    } else if (this.operator === "*") {
      return lhsVal * rhsVal;
    } else if (this.operator === "/") {
      return lhsVal / rhsVal;
    } else if (this.operator === "mod") {
      return lhsVal % rhsVal;
    }
  }
  /**
   * Evaluate math operation
   * @param {Context} context
   * @returns {number}
   */
  evaluate(context2) {
    return context2.meta.runtime.unifiedEval(this, context2);
  }
};
var MathExpression = class {
  /**
   * Parse math expression (dispatcher)
   * @param {ParserHelper} helper
   * @returns {any}
   */
  static parse(helper) {
    return helper.parseAnyOf(["mathOperator", "unaryExpression"]);
  }
};
var ComparisonOperator = class _ComparisonOperator {
  constructor(lhs, operator, rhs, typeName, nullOk) {
    this.type = "comparisonOperator";
    this.operator = operator;
    this.typeName = typeName;
    this.nullOk = nullOk;
    this.lhs = lhs;
    this.rhs = rhs;
    this.args = [lhs, rhs];
  }
  /**
   * Parse comparison operator expression
   * @param {ParserHelper} helper
   * @returns {any}
   */
  static parse(helper) {
    var expr = helper.parseElement("mathExpression");
    var comparisonToken = helper.matchAnyOpToken("<", ">", "<=", ">=", "==", "===", "!=", "!==");
    var operator = comparisonToken ? comparisonToken.value : null;
    var hasRightValue = true;
    var typeCheck = false;
    if (operator == null) {
      if (helper.matchToken("is") || helper.matchToken("am")) {
        if (helper.matchToken("not")) {
          if (helper.matchToken("in")) {
            operator = "not in";
          } else if (helper.matchToken("a") || helper.matchToken("an")) {
            operator = "not a";
            typeCheck = true;
          } else if (helper.matchToken("empty")) {
            operator = "not empty";
            hasRightValue = false;
          } else {
            if (helper.matchToken("really")) {
              operator = "!==";
            } else {
              operator = "!=";
            }
            if (helper.matchToken("equal")) {
              helper.matchToken("to");
            }
          }
        } else if (helper.matchToken("in")) {
          operator = "in";
        } else if (helper.matchToken("a") || helper.matchToken("an")) {
          operator = "a";
          typeCheck = true;
        } else if (helper.matchToken("empty")) {
          operator = "empty";
          hasRightValue = false;
        } else if (helper.matchToken("less")) {
          helper.requireToken("than");
          if (helper.matchToken("or")) {
            helper.requireToken("equal");
            helper.requireToken("to");
            operator = "<=";
          } else {
            operator = "<";
          }
        } else if (helper.matchToken("greater")) {
          helper.requireToken("than");
          if (helper.matchToken("or")) {
            helper.requireToken("equal");
            helper.requireToken("to");
            operator = ">=";
          } else {
            operator = ">";
          }
        } else {
          if (helper.matchToken("really")) {
            operator = "===";
          } else {
            operator = "==";
          }
          if (helper.matchToken("equal")) {
            helper.matchToken("to");
          }
        }
      } else if (helper.matchToken("equals")) {
        operator = "==";
      } else if (helper.matchToken("really")) {
        helper.requireToken("equals");
        operator = "===";
      } else if (helper.matchToken("exist") || helper.matchToken("exists")) {
        operator = "exist";
        hasRightValue = false;
      } else if (helper.matchToken("matches") || helper.matchToken("match")) {
        operator = "match";
      } else if (helper.matchToken("contains") || helper.matchToken("contain")) {
        operator = "contain";
      } else if (helper.matchToken("includes") || helper.matchToken("include")) {
        operator = "include";
      } else if (helper.matchToken("do") || helper.matchToken("does")) {
        helper.requireToken("not");
        if (helper.matchToken("matches") || helper.matchToken("match")) {
          operator = "not match";
        } else if (helper.matchToken("contains") || helper.matchToken("contain")) {
          operator = "not contain";
        } else if (helper.matchToken("exist") || helper.matchToken("exist")) {
          operator = "not exist";
          hasRightValue = false;
        } else if (helper.matchToken("include")) {
          operator = "not include";
        } else {
          helper.raiseParseError("Expected matches or contains");
        }
      }
    }
    if (operator) {
      var typeName, nullOk, rhs;
      if (typeCheck) {
        typeName = helper.requireTokenType("IDENTIFIER");
        nullOk = !helper.matchOpToken("!");
      } else if (hasRightValue) {
        rhs = helper.requireElement("mathExpression");
        if (operator === "match" || operator === "not match") {
          rhs = rhs.css ? rhs.css : rhs;
        }
      }
      var lhs = expr;
      expr = new _ComparisonOperator(lhs, operator, rhs, typeName, nullOk);
    }
    return expr;
  }
  /**
   * Op function for comparison operations
   */
  op(context2, lhsVal, rhsVal) {
    const operator = this.operator;
    const lhs = this.lhs;
    const rhs = this.rhs;
    const typeName = this.typeName;
    const nullOk = this.nullOk;
    if (operator === "==") {
      return lhsVal == rhsVal;
    } else if (operator === "!=") {
      return lhsVal != rhsVal;
    }
    if (operator === "===") {
      return lhsVal === rhsVal;
    } else if (operator === "!==") {
      return lhsVal !== rhsVal;
    }
    if (operator === "match") {
      return lhsVal != null && sloppyMatches(lhs, lhsVal, rhsVal);
    }
    if (operator === "not match") {
      return lhsVal == null || !sloppyMatches(lhs, lhsVal, rhsVal);
    }
    if (operator === "in") {
      return rhsVal != null && sloppyContains(rhs, rhsVal, lhsVal);
    }
    if (operator === "not in") {
      return rhsVal == null || !sloppyContains(rhs, rhsVal, lhsVal);
    }
    if (operator === "contain") {
      return lhsVal != null && sloppyContains(lhs, lhsVal, rhsVal);
    }
    if (operator === "not contain") {
      return lhsVal == null || !sloppyContains(lhs, lhsVal, rhsVal);
    }
    if (operator === "include") {
      return lhsVal != null && sloppyContains(lhs, lhsVal, rhsVal);
    }
    if (operator === "not include") {
      return lhsVal == null || !sloppyContains(lhs, lhsVal, rhsVal);
    }
    if (operator === "<") {
      return lhsVal < rhsVal;
    } else if (operator === ">") {
      return lhsVal > rhsVal;
    } else if (operator === "<=") {
      return lhsVal <= rhsVal;
    } else if (operator === ">=") {
      return lhsVal >= rhsVal;
    } else if (operator === "empty") {
      return context2.meta.runtime.isEmpty(lhsVal);
    } else if (operator === "not empty") {
      return !context2.meta.runtime.isEmpty(lhsVal);
    } else if (operator === "exist") {
      return context2.meta.runtime.doesExist(lhsVal);
    } else if (operator === "not exist") {
      return !context2.meta.runtime.doesExist(lhsVal);
    } else if (operator === "a") {
      return context2.meta.runtime.typeCheck(lhsVal, typeName.value, nullOk);
    } else if (operator === "not a") {
      return !context2.meta.runtime.typeCheck(lhsVal, typeName.value, nullOk);
    } else {
      throw "Unknown comparison : " + operator;
    }
  }
  /**
   * Evaluate comparison
   * @param {Context} context
   * @returns {boolean}
   */
  evaluate(context2) {
    return context2.meta.runtime.unifiedEval(this, context2);
  }
};
var ComparisonExpression = class {
  /**
   * Parse comparison expression (dispatcher)
   * @param {ParserHelper} helper
   * @returns {any}
   */
  static parse(helper) {
    return helper.parseAnyOf(["comparisonOperator", "mathExpression"]);
  }
};
var LogicalOperator = class _LogicalOperator {
  constructor(lhs, operator, rhs) {
    this.type = "logicalOperator";
    this.operator = operator;
    this.lhs = lhs;
    this.rhs = rhs;
    this.args = [lhs, rhs];
  }
  /**
   * Parse logical operator expression
   * @param {ParserHelper} helper
   * @returns {any}
   */
  static parse(helper) {
    var expr = helper.parseElement("comparisonExpression");
    var logicalOp, initialLogicalOp = null;
    logicalOp = helper.matchToken("and") || helper.matchToken("or");
    while (logicalOp) {
      initialLogicalOp = initialLogicalOp || logicalOp;
      if (initialLogicalOp.value !== logicalOp.value) {
        helper.raiseParseError("You must parenthesize logical operations with different operators");
      }
      var rhs = helper.requireElement("comparisonExpression");
      const operator = logicalOp.value;
      expr = new _LogicalOperator(expr, operator, rhs);
      logicalOp = helper.matchToken("and") || helper.matchToken("or");
    }
    return expr;
  }
  /**
   * Op function for logical operations
   */
  op(context2, lhsVal, rhsVal) {
    if (this.operator === "and") {
      return lhsVal && rhsVal;
    } else {
      return lhsVal || rhsVal;
    }
  }
  /**
   * Evaluate logical operation
   * @param {Context} context
   * @returns {boolean}
   */
  evaluate(context2) {
    return context2.meta.runtime.unifiedEval(this, context2, this.operator === "or");
  }
};
var LogicalExpression = class {
  /**
   * Parse logical expression (dispatcher)
   * @param {ParserHelper} helper
   * @returns {any}
   */
  static parse(helper) {
    return helper.parseAnyOf(["logicalOperator", "mathExpression"]);
  }
};
var AsyncExpression = class _AsyncExpression {
  constructor(value) {
    this.type = "asyncExpression";
    this.value = value;
  }
  /**
   * Parse async expression (dispatcher with optional async keyword)
   * @param {ParserHelper} helper
   * @returns {AsyncExpression | any}
   */
  static parse(helper) {
    if (helper.matchToken("async")) {
      var value = helper.requireElement("logicalExpression");
      return new _AsyncExpression(value);
    } else {
      return helper.parseElement("logicalExpression");
    }
  }
  /**
   * Evaluate async expression (wraps result in async marker)
   * @param {Context} context
   * @returns {{asyncWrapper: boolean, value: any}}
   */
  evaluate(context2) {
    return {
      asyncWrapper: true,
      value: this.value.evaluate(context2)
      //OK
    };
  }
};

// src/parsetree/expressions/literals.js
var NakedString = class _NakedString {
  constructor(tokens) {
    this.type = "nakedString";
    this.tokens = tokens;
  }
  /**
   * Parse a naked string (unquoted string until whitespace)
   * @param {ParserHelper} helper
   * @returns {NakedString | undefined}
   */
  static parse(helper) {
    if (helper.hasMore()) {
      var tokenArr = helper.consumeUntilWhitespace();
      helper.matchTokenType("WHITESPACE");
      return new _NakedString(tokenArr);
    }
  }
  /**
   * Evaluate to joined token values
   * @param {Context} context
   * @returns {string}
   */
  evaluate(context2) {
    return this.tokens.map(function(t) {
      return t.value;
    }).join("");
  }
};
var BooleanLiteral = class _BooleanLiteral {
  constructor(value) {
    this.type = "boolean";
    this.value = value;
  }
  /**
   * Parse a boolean literal
   * @param {ParserHelper} helper
   * @returns {BooleanLiteral | undefined}
   */
  static parse(helper) {
    var booleanLiteral = helper.matchToken("true") || helper.matchToken("false");
    if (!booleanLiteral) return;
    const value = booleanLiteral.value === "true";
    return new _BooleanLiteral(value);
  }
  /**
   * Evaluate to boolean value
   * @param {Context} context
   * @returns {boolean}
   */
  evaluate(context2) {
    return this.value;
  }
};
var NullLiteral = class _NullLiteral {
  constructor() {
    this.type = "null";
  }
  /**
   * Parse a null literal
   * @param {ParserHelper} helper
   * @returns {NullLiteral | undefined}
   */
  static parse(helper) {
    if (helper.matchToken("null")) {
      return new _NullLiteral();
    }
  }
  /**
   * Evaluate to null
   * @param {Context} context
   * @returns {null}
   */
  evaluate(context2) {
    return null;
  }
};
var NumberLiteral = class _NumberLiteral {
  constructor(value, numberToken) {
    this.type = "number";
    this.value = value;
    this.numberToken = numberToken;
  }
  /**
   * Parse a number literal
   * @param {ParserHelper} helper
   * @returns {NumberLiteral | undefined}
   */
  static parse(helper) {
    var number = helper.matchTokenType("NUMBER");
    if (!number) return;
    var numberToken = number;
    var value = parseFloat(
      /** @type {string} */
      number.value
    );
    return new _NumberLiteral(value, numberToken);
  }
  /**
   * Evaluate to numeric value
   * @param {Context} context
   * @returns {number}
   */
  evaluate(context2) {
    return this.value;
  }
};
var StringLiteral = class _StringLiteral {
  constructor(stringToken, rawValue, args) {
    this.type = "string";
    this.token = stringToken;
    this.rawValue = rawValue;
    this.args = args;
  }
  /**
   * Parse a string literal
   * @param {ParserHelper} helper
   * @returns {StringLiteral | undefined}
   */
  static parse(helper) {
    var _a, _b;
    var stringToken = helper.matchTokenType("STRING");
    if (!stringToken) return;
    var rawValue = (
      /** @type {string} */
      stringToken.value
    );
    var args;
    if (stringToken.template) {
      const Lexer2 = helper.parser.constructor.Lexer || ((_b = (_a = window._hyperscript) == null ? void 0 : _a.internals) == null ? void 0 : _b.Lexer);
      if (Lexer2) {
        var innerTokens = Lexer2.tokenize(rawValue, true);
        args = helper.parser.parseStringTemplate(innerTokens);
      } else {
        args = [];
      }
    } else {
      args = [];
    }
    return new _StringLiteral(stringToken, rawValue, args);
  }
  /**
   * Op function for template strings
   */
  op(context2) {
    var returnStr = "";
    for (var i = 1; i < arguments.length; i++) {
      var val = arguments[i];
      if (val !== void 0) {
        returnStr += val;
      }
    }
    return returnStr;
  }
  /**
   * Evaluate string value
   * @param {Context} context
   * @returns {string}
   */
  evaluate(context2) {
    if (this.args.length === 0) {
      return this.rawValue;
    } else {
      return context2.meta.runtime.unifiedEval(this, context2);
    }
  }
};
var ArrayLiteral = class _ArrayLiteral {
  constructor(values) {
    this.type = "arrayLiteral";
    this.values = values;
    this.args = [values];
  }
  /**
   * Parse an array literal
   * @param {ParserHelper} helper
   * @returns {ArrayLiteral | undefined}
   */
  static parse(helper) {
    if (!helper.matchOpToken("[")) return;
    var values = [];
    if (!helper.matchOpToken("]")) {
      do {
        var expr = helper.requireElement("expression");
        values.push(expr);
      } while (helper.matchOpToken(","));
      helper.requireOpToken("]");
    }
    return new _ArrayLiteral(values);
  }
  /**
   * Op function for array literal
   */
  op(context2, values) {
    return values;
  }
  /**
   * Evaluate array value
   * @param {Context} context
   * @returns {Array}
   */
  evaluate(context2) {
    return context2.meta.runtime.unifiedEval(this, context2);
  }
};
var ObjectKey = class _ObjectKey {
  constructor(key, expr, args) {
    this.type = "objectKey";
    this.key = key;
    this.expr = expr;
    this.args = args;
  }
  /**
   * Parse an object key
   * @param {ParserHelper} helper
   * @returns {ObjectKey}
   */
  static parse(helper) {
    var token;
    if (token = helper.matchTokenType("STRING")) {
      return new _ObjectKey(token.value, null, null);
    } else if (helper.matchOpToken("[")) {
      var expr = helper.parseElement("expression");
      helper.requireOpToken("]");
      return new _ObjectKey(null, expr, [expr]);
    } else {
      var key = "";
      do {
        token = helper.matchTokenType("IDENTIFIER") || helper.matchOpToken("-");
        if (token) key += token.value;
      } while (token);
      return new _ObjectKey(key, null, null);
    }
  }
  /**
   * Op function for computed keys
   */
  op(ctx, expr) {
    return expr;
  }
  /**
   * Evaluate to key string
   * @param {Context} context
   * @returns {string}
   */
  evaluate(context2) {
    if (this.expr) {
      return context2.meta.runtime.unifiedEval(this, context2);
    } else {
      return this.key;
    }
  }
};
var ObjectLiteral = class _ObjectLiteral {
  constructor(keyExpressions, valueExpressions) {
    this.type = "objectLiteral";
    this.keyExpressions = keyExpressions;
    this.valueExpressions = valueExpressions;
    this.args = [keyExpressions, valueExpressions];
  }
  /**
   * Parse an object literal
   * @param {ParserHelper} helper
   * @returns {ObjectLiteral | undefined}
   */
  static parse(helper) {
    if (!helper.matchOpToken("{")) return;
    var keyExpressions = [];
    var valueExpressions = [];
    if (!helper.matchOpToken("}")) {
      do {
        var name = helper.requireElement("objectKey");
        helper.requireOpToken(":");
        var value = helper.requireElement("expression");
        valueExpressions.push(value);
        keyExpressions.push(name);
      } while (helper.matchOpToken(",") && !helper.peekToken("}", 0, "R_BRACE"));
      helper.requireOpToken("}");
    }
    return new _ObjectLiteral(keyExpressions, valueExpressions);
  }
  /**
   * Op function for object literal
   */
  op(context2, keys, values) {
    var returnVal = {};
    for (var i = 0; i < keys.length; i++) {
      returnVal[keys[i]] = values[i];
    }
    return returnVal;
  }
  /**
   * Evaluate to object value
   * @param {Context} context
   * @returns {Object}
   */
  evaluate(context2) {
    return context2.meta.runtime.unifiedEval(this, context2);
  }
};
var NamedArgumentList = class _NamedArgumentList {
  constructor(fields, valueExpressions) {
    this.type = "namedArgumentList";
    this.fields = fields;
    this.args = [valueExpressions];
  }
  /**
   * Parse a naked named argument list (without parentheses)
   * @param {ParserHelper} helper
   * @returns {NamedArgumentList}
   */
  static parseNaked(helper) {
    var fields = [];
    var valueExpressions = [];
    if (helper.currentToken().type === "IDENTIFIER") {
      do {
        var name = helper.requireTokenType("IDENTIFIER");
        helper.requireOpToken(":");
        var value = helper.requireElement("expression");
        valueExpressions.push(value);
        fields.push({ name, value });
      } while (helper.matchOpToken(","));
    }
    return new _NamedArgumentList(fields, valueExpressions);
  }
  /**
   * Parse a named argument list with parentheses
   * @param {ParserHelper} helper
   * @returns {NamedArgumentList | undefined}
   */
  static parse(helper) {
    if (!helper.matchOpToken("(")) return;
    var elt = _NamedArgumentList.parseNaked(helper);
    helper.requireOpToken(")");
    return elt;
  }
  /**
   * Op function for named arguments
   */
  op(context2, values) {
    var returnVal = { _namedArgList_: true };
    for (var i = 0; i < values.length; i++) {
      var field = this.fields[i];
      returnVal[field.name.value] = values[i];
    }
    return returnVal;
  }
  /**
   * Evaluate to named argument object
   * @param {Context} context
   * @returns {Object}
   */
  evaluate(context2) {
    return context2.meta.runtime.unifiedEval(this, context2);
  }
};

// src/parsetree/expressions/targets.js
var ImplicitMeTarget = class _ImplicitMeTarget {
  constructor() {
    this.type = "implicitMeTarget";
  }
  /**
   * Parse an implicit me target
   * @param {ParserHelper} helper
   * @returns {ImplicitMeTarget}
   */
  static parse(helper) {
    return new _ImplicitMeTarget();
  }
  /**
   * Evaluate to me or you from context
   * @param {Context} context
   * @returns {*}
   */
  evaluate(context2) {
    return context2.you || context2.me;
  }
};

// src/parsetree/expressions/existentials.js
var NoExpression = class _NoExpression {
  constructor(root) {
    this.type = "noExpression";
    this.root = root;
    this.args = [root];
  }
  /**
   * Parse a no expression
   * @param {ParserHelper} helper
   * @returns {NoExpression | undefined}
   */
  static parse(helper) {
    if (!helper.matchToken("no")) return;
    var root = helper.requireElement("unaryExpression");
    return new _NoExpression(root);
  }
  /**
   * Op function for no expression
   */
  op(context2, val) {
    return context2.meta.runtime.isEmpty(val);
  }
  /**
   * Evaluate the no expression
   * @param {Context} context
   * @returns {boolean}
   */
  evaluate(context2) {
    return context2.meta.runtime.unifiedEval(this, context2);
  }
};
var SomeExpression = class _SomeExpression {
  constructor(root) {
    this.type = "noExpression";
    this.root = root;
    this.args = [root];
  }
  /**
   * Parse a some expression
   * @param {ParserHelper} helper
   * @returns {SomeExpression | undefined}
   */
  static parse(helper) {
    if (!helper.matchToken("some")) return;
    var root = helper.requireElement("expression");
    return new _SomeExpression(root);
  }
  /**
   * Op function for some expression
   */
  op(context2, val) {
    return !context2.meta.runtime.isEmpty(val);
  }
  /**
   * Evaluate the some expression
   * @param {Context} context
   * @returns {boolean}
   */
  evaluate(context2) {
    return context2.meta.runtime.unifiedEval(this, context2);
  }
};

// src/parsetree/expressions/positional.js
function scanForwardQuery(start, root, match, wrap) {
  var results = root.querySelectorAll(match);
  for (var i = 0; i < results.length; i++) {
    var elt = results[i];
    if (elt.compareDocumentPosition(start) === Node.DOCUMENT_POSITION_PRECEDING) {
      return elt;
    }
  }
  if (wrap) {
    return results[0];
  }
}
function scanBackwardsQuery(start, root, match, wrap) {
  var results = root.querySelectorAll(match);
  for (var i = results.length - 1; i >= 0; i--) {
    var elt = results[i];
    if (elt.compareDocumentPosition(start) === Node.DOCUMENT_POSITION_FOLLOWING) {
      return elt;
    }
  }
  if (wrap) {
    return results[results.length - 1];
  }
}
function scanForwardArray(start, array, match, wrap) {
  var matches = [];
  for (var elt of array) {
    if (elt.matches(match) || elt === start) {
      matches.push(elt);
    }
  }
  for (var i = 0; i < matches.length - 1; i++) {
    var elt = matches[i];
    if (elt === start) {
      return matches[i + 1];
    }
  }
  if (wrap) {
    var first = matches[0];
    if (first && first.matches(match)) {
      return first;
    }
  }
}
function scanBackwardsArray(start, array, match, wrap) {
  return scanForwardArray(start, Array.from(array).reverse(), match, wrap);
}
var RelativePositionalExpression = class _RelativePositionalExpression {
  constructor(thingElt, from, forwardSearch, inSearch, wrapping, inElt, withinElt, operator) {
    this.type = "relativePositionalExpression";
    this.thingElt = thingElt;
    this.from = from;
    this.forwardSearch = forwardSearch;
    this.inSearch = inSearch;
    this.wrapping = wrapping;
    this.inElt = inElt;
    this.withinElt = withinElt;
    this.operator = operator;
    this.args = [thingElt, from, inElt, withinElt];
  }
  /**
   * Parse a relative positional expression
   * @param {ParserHelper} helper
   * @returns {RelativePositionalExpression | undefined}
   */
  static parse(helper) {
    var op = helper.matchAnyToken("next", "previous");
    if (!op) return;
    var forwardSearch = op.value === "next";
    var thingElt = helper.parseElement("expression");
    if (helper.matchToken("from")) {
      helper.pushFollow("in");
      try {
        var from = helper.requireElement("unaryExpression");
      } finally {
        helper.popFollow();
      }
    } else {
      var from = helper.requireElement("implicitMeTarget");
    }
    var inSearch = false;
    var withinElt;
    if (helper.matchToken("in")) {
      inSearch = true;
      var inElt = helper.requireElement("unaryExpression");
    } else if (helper.matchToken("within")) {
      withinElt = helper.requireElement("unaryExpression");
    } else {
      withinElt = document.body;
    }
    var wrapping = false;
    if (helper.matchToken("with")) {
      helper.requireToken("wrapping");
      wrapping = true;
    }
    return new _RelativePositionalExpression(
      thingElt,
      from,
      forwardSearch,
      inSearch,
      wrapping,
      inElt,
      withinElt,
      op.value
    );
  }
  /**
   * Op function for relative positional
   */
  op(context2, thing, from, inElt, withinElt) {
    var css = thing.css;
    if (css == null) {
      throw "Expected a CSS value to be returned by " + Tokens.sourceFor.apply(this.thingElt);
    }
    if (this.inSearch) {
      if (inElt) {
        if (this.forwardSearch) {
          return scanForwardArray(from, inElt, css, this.wrapping);
        } else {
          return scanBackwardsArray(from, inElt, css, this.wrapping);
        }
      }
    } else {
      if (withinElt) {
        if (this.forwardSearch) {
          return scanForwardQuery(from, withinElt, css, this.wrapping);
        } else {
          return scanBackwardsQuery(from, withinElt, css, this.wrapping);
        }
      }
    }
  }
  /**
   * Evaluate relative positional expression
   * @param {Context} context
   * @returns {Element}
   */
  evaluate(context2) {
    return context2.meta.runtime.unifiedEval(this, context2);
  }
};
var PositionalExpression = class _PositionalExpression {
  constructor(rhs, operator) {
    this.type = "positionalExpression";
    this.rhs = rhs;
    this.operator = operator;
    this.args = [rhs];
  }
  /**
   * Parse a positional expression
   * @param {ParserHelper} helper
   * @returns {PositionalExpression | undefined}
   */
  static parse(helper) {
    var op = helper.matchAnyToken("first", "last", "random");
    if (!op) return;
    helper.matchAnyToken("in", "from", "of");
    var rhs = helper.requireElement("unaryExpression");
    return new _PositionalExpression(rhs, op.value);
  }
  /**
   * Op function for positional
   */
  op(context2, rhsVal) {
    if (rhsVal && !Array.isArray(rhsVal)) {
      if (rhsVal.children) {
        rhsVal = rhsVal.children;
      } else {
        rhsVal = Array.from(rhsVal);
      }
    }
    if (rhsVal) {
      if (this.operator === "first") {
        return rhsVal[0];
      } else if (this.operator === "last") {
        return rhsVal[rhsVal.length - 1];
      } else if (this.operator === "random") {
        return rhsVal[Math.floor(Math.random() * rhsVal.length)];
      }
    }
  }
  /**
   * Evaluate positional expression
   * @param {Context} context
   * @returns {any}
   */
  evaluate(context2) {
    return context2.meta.runtime.unifiedEval(this, context2);
  }
};
var ClosestExpr = class {
  /**
   * Parse a closest expression
   * @param {ParserHelper} helper
   * @returns {any | undefined}
   */
  static parse(helper) {
    if (!helper.matchToken("closest")) return;
    var parentSearch = false;
    if (helper.matchToken("parent")) {
      parentSearch = true;
    }
    var css = null;
    var attributeRef = null;
    if (helper.currentToken().type === "ATTRIBUTE_REF") {
      attributeRef = helper.requireElement("attributeRefAccess", null);
      css = "[" + attributeRef.attribute.name + "]";
    }
    if (css == null) {
      var expr = helper.requireElement("expression");
      if (expr.css == null) {
        helper.raiseParseError("Expected a CSS expression");
      } else {
        css = expr.css;
      }
    }
    if (helper.matchToken("to")) {
      var to = helper.parseElement("expression");
    } else {
      var to = helper.parseElement("implicitMeTarget");
    }
    var closestExpr = {
      type: "closestExpr",
      parentSearch,
      expr,
      css,
      to,
      args: [to],
      op: function(ctx, to2) {
        if (to2 == null) {
          return null;
        } else {
          let result = [];
          ctx.meta.runtime.implicitLoop(to2, function(to3) {
            if (parentSearch) {
              result.push(to3.parentElement ? to3.parentElement.closest(css) : null);
            } else {
              result.push(to3.closest(css));
            }
          });
          if (ctx.meta.runtime.shouldAutoIterate(to2)) {
            return result;
          } else {
            return result[0];
          }
        }
      },
      evaluate: function(ctx) {
        return ctx.meta.runtime.unifiedEval(this, ctx);
      }
    };
    if (attributeRef) {
      attributeRef.root = closestExpr;
      attributeRef.args = [closestExpr];
      return attributeRef;
    } else {
      return closestExpr;
    }
  }
};

// src/parsetree/commands/basic.js
var LogCommand = class _LogCommand {
  constructor(exprs, withExpr) {
    this.exprs = exprs;
    this.withExpr = withExpr;
    this.args = [withExpr, exprs];
  }
  /**
   * Parse log command
   * @param {ParserHelper} helper
   * @returns {LogCommand | undefined}
   */
  static parse(helper) {
    if (!helper.matchToken("log")) return;
    var exprs = [helper.parseElement("expression")];
    while (helper.matchOpToken(",")) {
      exprs.push(helper.requireElement("expression"));
    }
    if (helper.matchToken("with")) {
      var withExpr = helper.requireElement("expression");
    }
    return new _LogCommand(exprs, withExpr);
  }
  /**
   * Execute log command
   */
  op(ctx, withExpr, values) {
    if (withExpr) {
      withExpr.apply(null, values);
    } else {
      console.log.apply(null, values);
    }
    return ctx.meta.runtime.findNext(this, ctx);
  }
};
var BeepCommand = class _BeepCommand {
  constructor(exprs) {
    this.exprs = exprs;
    this.args = [exprs];
  }
  /**
   * Parse beep command
   * @param {ParserHelper} helper
   * @returns {BeepCommand | undefined}
   */
  static parse(helper) {
    if (!helper.matchToken("beep!")) return;
    var exprs = [helper.parseElement("expression")];
    while (helper.matchOpToken(",")) {
      exprs.push(helper.requireElement("expression"));
    }
    return new _BeepCommand(exprs);
  }
  /**
   * Execute beep command
   */
  op(ctx, values) {
    for (let i = 0; i < this.exprs.length; i++) {
      const expr = this.exprs[i];
      const val = values[i];
      ctx.meta.runtime.beepValueToConsole(ctx.me, expr, val);
    }
    return ctx.meta.runtime.findNext(this, ctx);
  }
};
var ThrowCommand = class _ThrowCommand {
  constructor(expr) {
    this.expr = expr;
    this.args = [expr];
  }
  /**
   * Parse throw command
   * @param {ParserHelper} helper
   * @returns {ThrowCommand | undefined}
   */
  static parse(helper) {
    if (!helper.matchToken("throw")) return;
    var expr = helper.requireElement("expression");
    return new _ThrowCommand(expr);
  }
  /**
   * Execute throw command
   */
  op(ctx, expr) {
    ctx.meta.runtime.registerHyperTrace(ctx, expr);
    throw expr;
  }
};
var ReturnCommand = class _ReturnCommand {
  constructor(value) {
    this.value = value;
    this.args = [value];
  }
  /**
   * Parse return command
   * @param {ParserHelper} helper
   * @returns {ReturnCommand | undefined}
   */
  static parse(helper) {
    if (!helper.matchToken("return")) return;
    if (helper.commandBoundary(helper.currentToken())) {
      helper.raiseParseError("'return' commands must return a value.  If you do not wish to return a value, use 'exit' instead.");
    } else {
      var value = helper.requireElement("expression");
    }
    return new _ReturnCommand(value);
  }
  /**
   * Execute return command
   */
  op(context2, value) {
    var resolve = context2.meta.resolve;
    context2.meta.returned = true;
    context2.meta.returnValue = value;
    if (resolve) {
      if (value) {
        resolve(value);
      } else {
        resolve();
      }
    }
    return context2.meta.runtime.HALT;
  }
};
var ExitCommand = class _ExitCommand {
  constructor() {
    this.args = [void 0];
  }
  /**
   * Parse exit command
   * @param {ParserHelper} helper
   * @returns {ExitCommand | undefined}
   */
  static parse(helper) {
    if (!helper.matchToken("exit")) return;
    return new _ExitCommand();
  }
  /**
   * Execute exit command
   */
  op(context2, value) {
    var resolve = context2.meta.resolve;
    context2.meta.returned = true;
    context2.meta.returnValue = value;
    if (resolve) {
      if (value) {
        resolve(value);
      } else {
        resolve();
      }
    }
    return context2.meta.runtime.HALT;
  }
};
var HaltCommand = class _HaltCommand {
  constructor(bubbling, haltDefault, keepExecuting, exit) {
    this.keepExecuting = keepExecuting;
    this.bubbling = bubbling;
    this.haltDefault = haltDefault;
    this.exit = exit;
  }
  /**
   * Parse halt command
   * @param {ParserHelper} helper
   * @returns {HaltCommand | undefined}
   */
  static parse(helper) {
    if (!helper.matchToken("halt")) return;
    if (helper.matchToken("the")) {
      helper.requireToken("event");
      if (helper.matchOpToken("'")) {
        helper.requireToken("s");
      }
      var keepExecuting = true;
    }
    if (helper.matchToken("bubbling")) {
      var bubbling = true;
    } else if (helper.matchToken("default")) {
      var haltDefault = true;
    }
    var exit = {
      args: [void 0],
      op: function(context2, value) {
        var resolve = context2.meta.resolve;
        context2.meta.returned = true;
        context2.meta.returnValue = value;
        if (resolve) {
          if (value) {
            resolve(value);
          } else {
            resolve();
          }
        }
        return context2.meta.runtime.HALT;
      }
    };
    return new _HaltCommand(bubbling, haltDefault, keepExecuting, exit);
  }
  /**
   * Execute halt command
   */
  op(ctx) {
    if (ctx.event) {
      if (this.bubbling) {
        ctx.event.stopPropagation();
      } else if (this.haltDefault) {
        ctx.event.preventDefault();
      } else {
        ctx.event.stopPropagation();
        ctx.event.preventDefault();
      }
      if (this.keepExecuting) {
        return ctx.meta.runtime.findNext(this, ctx);
      } else {
        return this.exit;
      }
    }
  }
};

// src/parsetree/commands/setters.js
function putInto(context2, root, prop, valueToPut, parser) {
  if (root == null) {
    var value = context2.meta.runtime.resolveSymbol(prop, context2);
  } else {
    var value = root;
  }
  if (value instanceof Element || value instanceof HTMLDocument) {
    while (value.firstChild) value.removeChild(value.firstChild);
    value.append(parser.runtime.convertValue(valueToPut, "Fragment"));
    context2.meta.runtime.processNode(value);
  } else {
    if (root == null) {
      context2.meta.runtime.setSymbol(prop, context2, null, valueToPut);
    } else {
      root[prop] = valueToPut;
    }
  }
}
var SetterCommand = class {
  /**
   * Create a setter operation for a target
   * @param {*} helper - Parser helper
   * @param {*} target - Target expression to set
   * @param {*} value - Value expression to assign
   * @returns Setter command object
   */
  static makeSetter(helper, target, value) {
    var symbolWrite = target.type === "symbol";
    var attributeWrite = target.type === "attributeRef";
    var styleWrite = target.type === "styleRef";
    var arrayWrite = target.type === "arrayIndex";
    if (!(attributeWrite || styleWrite || symbolWrite) && target.root == null) {
      helper.raiseParseError("Can only put directly into symbols, not references");
    }
    var rootElt = null;
    var prop = null;
    if (symbolWrite) {
    } else if (attributeWrite || styleWrite) {
      rootElt = helper.requireElement("implicitMeTarget");
      var attribute = target;
    } else if (arrayWrite) {
      prop = target.firstIndex;
      rootElt = target.root;
    } else {
      prop = target.prop ? target.prop.value : null;
      var attribute = target.attribute;
      rootElt = target.root;
    }
    var setCmd = {
      target,
      symbolWrite,
      value,
      args: [rootElt, prop, value],
      op: function(context2, root, prop2, valueToSet) {
        if (symbolWrite) {
          context2.meta.runtime.setSymbol(target.name, context2, target.scope, valueToSet);
        } else {
          context2.meta.runtime.nullCheck(root, rootElt);
          if (arrayWrite) {
            root[prop2] = valueToSet;
          } else {
            context2.meta.runtime.implicitLoop(root, function(elt) {
              if (attribute) {
                if (attribute.type === "attributeRef") {
                  if (valueToSet == null) {
                    elt.removeAttribute(attribute.name);
                  } else {
                    elt.setAttribute(attribute.name, valueToSet);
                  }
                } else {
                  elt.style[attribute.name] = valueToSet;
                }
              } else {
                elt[prop2] = valueToSet;
              }
            });
          }
        }
        return context2.meta.runtime.findNext(this, context2);
      }
    };
    return setCmd;
  }
};
var SetCommand = class _SetCommand extends SetterCommand {
  constructor(target, value, objectLiteral) {
    super();
    this.target = target;
    this.value = value;
    this.objectLiteral = objectLiteral;
    if (objectLiteral) {
      this.args = [objectLiteral, target];
    } else {
    }
  }
  /**
   * Parse set command
   * @param {ParserHelper} helper
   * @returns {SetCommand | undefined}
   */
  static parse(helper) {
    if (!helper.matchToken("set")) return;
    if (helper.currentToken().type === "L_BRACE") {
      var obj = helper.requireElement("objectLiteral");
      helper.requireToken("on");
      var target = helper.requireElement("expression");
      var command = new _SetCommand(target, null, obj);
      command.op = function(ctx, obj2, target2) {
        Object.assign(target2, obj2);
        return ctx.meta.runtime.findNext(this, ctx);
      };
      return command;
    }
    try {
      helper.pushFollow("to");
      var target = helper.requireElement("assignableExpression");
    } finally {
      helper.popFollow();
    }
    helper.requireToken("to");
    var value = helper.requireElement("expression");
    return _SetCommand.makeSetter(helper, target, value);
  }
};
var DefaultCommand = class _DefaultCommand extends SetterCommand {
  constructor(target, value, setter) {
    super();
    this.target = target;
    this.value = value;
    this.setter = setter;
    this.args = [target];
  }
  /**
   * Parse default command
   * @param {ParserHelper} helper
   * @returns {DefaultCommand | undefined}
   */
  static parse(helper) {
    if (!helper.matchToken("default")) return;
    var target = helper.requireElement("assignableExpression");
    helper.requireToken("to");
    var value = helper.requireElement("expression");
    var setter = SetCommand.makeSetter(helper, target, value);
    var defaultCmd = new _DefaultCommand(target, value, setter);
    defaultCmd.op = function(context2, target2) {
      if (target2) {
        return context2.meta.runtime.findNext(this, context2);
      } else {
        return setter;
      }
    };
    setter.parent = defaultCmd;
    return defaultCmd;
  }
};
var IncrementCommand = class extends SetterCommand {
  constructor(target, amountExpr) {
    super();
    this.target = target;
    this.amountExpr = amountExpr;
  }
  /**
   * Parse increment command
   * @param {ParserHelper} helper
   * @returns {IncrementCommand | undefined}
   */
  static parse(helper) {
    if (!helper.matchToken("increment")) return;
    var amountExpr;
    var target = helper.parseElement("assignableExpression");
    if (helper.matchToken("by")) {
      amountExpr = helper.requireElement("expression");
    }
    var implicitIncrementOp = {
      type: "implicitIncrementOp",
      target,
      args: [target, amountExpr],
      op: function(context2, targetValue, amount) {
        targetValue = targetValue ? parseFloat(targetValue) : 0;
        amount = amountExpr ? parseFloat(amount) : 1;
        var newValue = targetValue + amount;
        context2.result = newValue;
        return newValue;
      },
      evaluate: function(context2) {
        return context2.meta.runtime.unifiedEval(this, context2);
      }
    };
    return SetCommand.makeSetter(helper, target, implicitIncrementOp);
  }
};
var DecrementCommand = class extends SetterCommand {
  constructor(target, amountExpr) {
    super();
    this.target = target;
    this.amountExpr = amountExpr;
  }
  /**
   * Parse decrement command
   * @param {ParserHelper} helper
   * @returns {DecrementCommand | undefined}
   */
  static parse(helper) {
    if (!helper.matchToken("decrement")) return;
    var amountExpr;
    var target = helper.parseElement("assignableExpression");
    if (helper.matchToken("by")) {
      amountExpr = helper.requireElement("expression");
    }
    var implicitDecrementOp = {
      type: "implicitDecrementOp",
      target,
      args: [target, amountExpr],
      op: function(context2, targetValue, amount) {
        targetValue = targetValue ? parseFloat(targetValue) : 0;
        amount = amountExpr ? parseFloat(amount) : 1;
        var newValue = targetValue - amount;
        context2.result = newValue;
        return newValue;
      },
      evaluate: function(context2) {
        return context2.meta.runtime.unifiedEval(this, context2);
      }
    };
    return SetCommand.makeSetter(helper, target, implicitDecrementOp);
  }
};
var PutCommand = class extends SetterCommand {
  constructor(value, target, operation) {
    super();
    this.value = value;
    this.target = target;
    this.operation = operation;
  }
  /**
   * Parse put command
   * @param {ParserHelper} helper
   * @returns {PutCommand | undefined}
   */
  static parse(helper, parser) {
    if (!helper.matchToken("put")) return;
    var value = helper.requireElement("expression");
    var operationToken = helper.matchAnyToken("into", "before", "after");
    if (operationToken == null && helper.matchToken("at")) {
      helper.matchToken("the");
      operationToken = helper.matchAnyToken("start", "end");
      helper.requireToken("of");
    }
    if (operationToken == null) {
      helper.raiseParseError("Expected one of 'into', 'before', 'at start of', 'at end of', 'after'");
    }
    var target = helper.requireElement("expression");
    var operation = operationToken.value;
    var arrayIndex = false;
    var symbolWrite = false;
    var rootExpr = null;
    var prop = null;
    if (target.type === "arrayIndex" && operation === "into") {
      arrayIndex = true;
      prop = target.prop;
      rootExpr = target.root;
    } else if (target.prop && target.root && operation === "into") {
      prop = target.prop.value;
      rootExpr = target.root;
    } else if (target.type === "symbol" && operation === "into") {
      symbolWrite = true;
      prop = target.name;
    } else if (target.type === "attributeRef" && operation === "into") {
      var attributeWrite = true;
      prop = target.name;
      rootExpr = helper.requireElement("implicitMeTarget");
    } else if (target.type === "styleRef" && operation === "into") {
      var styleWrite = true;
      prop = target.name;
      rootExpr = helper.requireElement("implicitMeTarget");
    } else if (target.attribute && operation === "into") {
      var attributeWrite = target.attribute.type === "attributeRef";
      var styleWrite = target.attribute.type === "styleRef";
      prop = target.attribute.name;
      rootExpr = target.root;
    } else {
      rootExpr = target;
    }
    var putCmd = {
      target,
      operation,
      symbolWrite,
      value,
      args: [rootExpr, prop, value],
      op: function(context2, root, prop2, valueToPut) {
        if (symbolWrite) {
          putInto(context2, root, prop2, valueToPut, parser);
        } else {
          context2.meta.runtime.nullCheck(root, rootExpr);
          if (operation === "into") {
            if (attributeWrite) {
              context2.meta.runtime.implicitLoop(root, function(elt) {
                elt.setAttribute(prop2, valueToPut);
              });
            } else if (styleWrite) {
              context2.meta.runtime.implicitLoop(root, function(elt) {
                elt.style[prop2] = valueToPut;
              });
            } else if (arrayIndex) {
              root[prop2] = valueToPut;
            } else {
              context2.meta.runtime.implicitLoop(root, function(elt) {
                putInto(context2, elt, prop2, valueToPut, parser);
              });
            }
          } else {
            var op = operation === "before" ? Element.prototype.before : operation === "after" ? Element.prototype.after : operation === "start" ? Element.prototype.prepend : operation === "end" ? Element.prototype.append : Element.prototype.append;
            context2.meta.runtime.implicitLoop(root, function(elt) {
              op.call(
                elt,
                valueToPut instanceof Node ? valueToPut : context2.meta.runtime.convertValue(valueToPut, "Fragment")
              );
              if (elt.parentElement) {
                context2.meta.runtime.processNode(elt.parentElement);
              } else {
                context2.meta.runtime.processNode(elt);
              }
            });
          }
        }
        return context2.meta.runtime.findNext(this, context2);
      }
    };
    return putCmd;
  }
};

// src/grammars/core.js
function hyperscriptCoreGrammar(parser) {
  parser.addLeafExpression("parenthesized", ParenthesizedExpression.parse);
  parser.addLeafExpression("string", StringLiteral.parse);
  parser.addGrammarElement("nakedString", NakedString.parse);
  parser.addLeafExpression("number", NumberLiteral.parse);
  parser.addLeafExpression("idRef", IdRef.parse);
  parser.addLeafExpression("classRef", ClassRef.parse);
  parser.addLeafExpression("queryRef", QueryRef.parse);
  parser.addLeafExpression("attributeRef", AttributeRef.parse);
  parser.addLeafExpression("styleRef", StyleRef.parse);
  parser.addGrammarElement("objectKey", ObjectKey.parse);
  parser.addLeafExpression("objectLiteral", ObjectLiteral.parse);
  parser.addGrammarElement("nakedNamedArgumentList", NamedArgumentList.parseNaked);
  parser.addGrammarElement("namedArgumentList", NamedArgumentList.parse);
  parser.addGrammarElement("symbol", SymbolRef.parse);
  parser.addGrammarElement("implicitMeTarget", ImplicitMeTarget.parse);
  parser.addLeafExpression("boolean", BooleanLiteral.parse);
  parser.addLeafExpression("null", NullLiteral.parse);
  parser.addLeafExpression("arrayLiteral", ArrayLiteral.parse);
  parser.addLeafExpression("blockLiteral", BlockLiteral.parse);
  parser.addIndirectExpression("propertyAccess", PropertyAccess.parse);
  parser.addIndirectExpression("of", OfExpression.parse);
  parser.addIndirectExpression("possessive", PossessiveExpression.parse);
  parser.addIndirectExpression("inExpression", InExpression.parse);
  parser.addIndirectExpression("asExpression", AsExpression.parse);
  parser.addIndirectExpression("functionCall", FunctionCall.parse);
  parser.addIndirectExpression("attributeRefAccess", AttributeRefAccess.parse);
  parser.addIndirectExpression("arrayIndex", ArrayIndex.parse);
  var STRING_POSTFIXES = [
    "em",
    "ex",
    "cap",
    "ch",
    "ic",
    "rem",
    "lh",
    "rlh",
    "vw",
    "vh",
    "vi",
    "vb",
    "vmin",
    "vmax",
    "cm",
    "mm",
    "Q",
    "pc",
    "pt",
    "px"
  ];
  parser.addGrammarElement("postfixExpression", function(helper) {
    var root = helper.parseElement("negativeNumber");
    let stringPosfix = helper.tokens.matchAnyToken.apply(helper.tokens, STRING_POSTFIXES) || helper.matchOpToken("%");
    if (stringPosfix) {
      return {
        type: "stringPostfix",
        postfix: stringPosfix.value,
        args: [root],
        op: function(context2, val) {
          return "" + val + stringPosfix.value;
        },
        evaluate: function(context2) {
          return context2.meta.runtime.unifiedEval(this, context2);
        }
      };
    }
    var timeFactor = null;
    if (helper.matchToken("s") || helper.matchToken("seconds")) {
      timeFactor = 1e3;
    } else if (helper.matchToken("ms") || helper.matchToken("milliseconds")) {
      timeFactor = 1;
    }
    if (timeFactor) {
      return {
        type: "timeExpression",
        time: root,
        factor: timeFactor,
        args: [root],
        op: function(context2, val) {
          return val * timeFactor;
        },
        evaluate: function(context2) {
          return context2.meta.runtime.unifiedEval(this, context2);
        }
      };
    }
    if (helper.matchOpToken(":")) {
      var typeName = helper.requireTokenType("IDENTIFIER");
      if (!typeName.value) return;
      var nullOk = !helper.matchOpToken("!");
      return {
        type: "typeCheck",
        typeName,
        nullOk,
        args: [root],
        op: function(context2, val) {
          var passed = context2.meta.runtime.typeCheck(val, this.typeName.value, nullOk);
          if (passed) {
            return val;
          } else {
            throw new Error("Typecheck failed!  Expected: " + typeName.value);
          }
        },
        evaluate: function(context2) {
          return context2.meta.runtime.unifiedEval(this, context2);
        }
      };
    } else {
      return root;
    }
  });
  parser.addGrammarElement("logicalNot", LogicalNot.parse);
  parser.addGrammarElement("noExpression", NoExpression.parse);
  parser.addLeafExpression("some", SomeExpression.parse);
  parser.addGrammarElement("negativeNumber", NegativeNumber.parse);
  parser.addGrammarElement("unaryExpression", function(helper) {
    helper.matchToken("the");
    return helper.parseAnyOf(["beepExpression", "logicalNot", "relativePositionalExpression", "positionalExpression", "noExpression", "postfixExpression"]);
  });
  parser.addGrammarElement("beepExpression", BeepExpression.parse);
  parser.addGrammarElement("relativePositionalExpression", RelativePositionalExpression.parse);
  parser.addGrammarElement("positionalExpression", PositionalExpression.parse);
  parser.addGrammarElement("mathOperator", MathOperator.parse);
  parser.addGrammarElement("mathExpression", MathExpression.parse);
  parser.addGrammarElement("comparisonOperator", ComparisonOperator.parse);
  parser.addGrammarElement("comparisonExpression", ComparisonExpression.parse);
  parser.addGrammarElement("logicalOperator", LogicalOperator.parse);
  parser.addGrammarElement("logicalExpression", LogicalExpression.parse);
  parser.addGrammarElement("asyncExpression", AsyncExpression.parse);
  parser.addGrammarElement("expression", function(helper) {
    helper.matchToken("the");
    return helper.parseElement("asyncExpression");
  });
  parser.addGrammarElement("assignableExpression", function(helper) {
    helper.matchToken("the");
    var expr = helper.parseElement("primaryExpression");
    if (expr && (expr.type === "symbol" || expr.type === "ofExpression" || expr.type === "propertyAccess" || expr.type === "attributeRefAccess" || expr.type === "attributeRef" || expr.type === "styleRef" || expr.type === "arrayIndex" || expr.type === "possessive")) {
      return expr;
    } else {
      helper.raiseParseError(
        "A target expression must be writable.  The expression type '" + (expr && expr.type) + "' is not."
      );
    }
    return expr;
  });
  parser.addGrammarElement("hyperscript", function(helper) {
    var features = [];
    if (helper.hasMore()) {
      while (helper.featureStart(helper.currentToken()) || helper.currentToken().value === "(") {
        var feature = helper.requireElement("feature");
        features.push(feature);
        helper.matchToken("end");
      }
    }
    return {
      type: "hyperscript",
      features,
      apply: function(target, source, args, runtime) {
        for (const feature2 of features) {
          feature2.install(target, source, args, runtime);
        }
      }
    };
  });
  var parseEventArgs = function(helper) {
    var args = [];
    if (helper.token(0).value === "(" && (helper.token(1).value === ")" || helper.token(2).value === "," || helper.token(2).value === ")")) {
      helper.matchOpToken("(");
      do {
        args.push(helper.requireTokenType("IDENTIFIER"));
      } while (helper.matchOpToken(","));
      helper.requireOpToken(")");
    }
    return args;
  };
  parser.addFeature("on", function(helper) {
    if (!helper.matchToken("on")) return;
    var every = false;
    if (helper.matchToken("every")) {
      every = true;
    }
    var events = [];
    var displayName = null;
    do {
      var on = helper.requireElement("eventName", "Expected event name");
      var eventName = on.evaluate();
      if (displayName) {
        displayName = displayName + " or " + eventName;
      } else {
        displayName = "on " + eventName;
      }
      var args = parseEventArgs(helper);
      var filter = null;
      if (helper.matchOpToken("[")) {
        filter = helper.requireElement("expression");
        helper.requireOpToken("]");
      }
      var startCount, endCount, unbounded;
      if (helper.currentToken().type === "NUMBER") {
        var startCountToken = helper.consumeToken();
        if (!startCountToken.value) return;
        startCount = parseInt(startCountToken.value);
        if (helper.matchToken("to")) {
          var endCountToken = helper.consumeToken();
          if (!endCountToken.value) return;
          endCount = parseInt(endCountToken.value);
        } else if (helper.matchToken("and")) {
          unbounded = true;
          helper.requireToken("on");
        }
      }
      var intersectionSpec, mutationSpec;
      if (eventName === "intersection") {
        intersectionSpec = {};
        if (helper.matchToken("with")) {
          intersectionSpec["with"] = helper.requireElement("expression").evaluate();
        }
        if (helper.matchToken("having")) {
          do {
            if (helper.matchToken("margin")) {
              intersectionSpec["rootMargin"] = helper.requireElement("stringLike").evaluate();
            } else if (helper.matchToken("threshold")) {
              intersectionSpec["threshold"] = helper.requireElement("expression").evaluate();
            } else {
              helper.raiseParseError("Unknown intersection config specification");
            }
          } while (helper.matchToken("and"));
        }
      } else if (eventName === "mutation") {
        mutationSpec = {};
        if (helper.matchToken("of")) {
          do {
            if (helper.matchToken("anything")) {
              mutationSpec["attributes"] = true;
              mutationSpec["subtree"] = true;
              mutationSpec["characterData"] = true;
              mutationSpec["childList"] = true;
            } else if (helper.matchToken("childList")) {
              mutationSpec["childList"] = true;
            } else if (helper.matchToken("attributes")) {
              mutationSpec["attributes"] = true;
              mutationSpec["attributeOldValue"] = true;
            } else if (helper.matchToken("subtree")) {
              mutationSpec["subtree"] = true;
            } else if (helper.matchToken("characterData")) {
              mutationSpec["characterData"] = true;
              mutationSpec["characterDataOldValue"] = true;
            } else if (helper.currentToken().type === "ATTRIBUTE_REF") {
              var attribute = helper.consumeToken();
              if (mutationSpec["attributeFilter"] == null) {
                mutationSpec["attributeFilter"] = [];
              }
              if (attribute.value.indexOf("@") == 0) {
                mutationSpec["attributeFilter"].push(attribute.value.substring(1));
              } else {
                helper.raiseParseError(
                  "Only shorthand attribute references are allowed here"
                );
              }
            } else {
              helper.raiseParseError("Unknown mutation config specification");
            }
          } while (helper.matchToken("or"));
        } else {
          mutationSpec["attributes"] = true;
          mutationSpec["characterData"] = true;
          mutationSpec["childList"] = true;
        }
      }
      var from = null;
      var elsewhere = false;
      if (helper.matchToken("from")) {
        if (helper.matchToken("elsewhere")) {
          elsewhere = true;
        } else {
          helper.pushFollow("or");
          try {
            from = helper.requireElement("expression");
          } finally {
            helper.popFollow();
          }
          if (!from) {
            helper.raiseParseError('Expected either target value or "elsewhere".');
          }
        }
      }
      if (from === null && elsewhere === false && helper.matchToken("elsewhere")) {
        elsewhere = true;
      }
      if (helper.matchToken("in")) {
        var inExpr = helper.parseElement("unaryExpression");
      }
      if (helper.matchToken("debounced")) {
        helper.requireToken("at");
        var timeExpr = helper.requireElement("unaryExpression");
        var debounceTime = timeExpr.evaluate({});
      } else if (helper.matchToken("throttled")) {
        helper.requireToken("at");
        var timeExpr = helper.requireElement("unaryExpression");
        var throttleTime = timeExpr.evaluate({});
      }
      events.push({
        execCount: 0,
        every,
        on: eventName,
        args,
        filter,
        from,
        inExpr,
        elsewhere,
        startCount,
        endCount,
        unbounded,
        debounceTime,
        throttleTime,
        mutationSpec,
        intersectionSpec,
        debounced: void 0,
        lastExec: void 0
      });
    } while (helper.matchToken("or"));
    var queueLast = true;
    if (!every) {
      if (helper.matchToken("queue")) {
        if (helper.matchToken("all")) {
          var queueAll = true;
          var queueLast = false;
        } else if (helper.matchToken("first")) {
          var queueFirst = true;
        } else if (helper.matchToken("none")) {
          var queueNone = true;
        } else {
          helper.requireToken("last");
        }
      }
    }
    var start = helper.requireElement("commandList");
    parser.ensureTerminated(start);
    var errorSymbol, errorHandler;
    if (helper.matchToken("catch")) {
      errorSymbol = helper.requireTokenType("IDENTIFIER").value;
      errorHandler = helper.requireElement("commandList");
      parser.ensureTerminated(errorHandler);
    }
    if (helper.matchToken("finally")) {
      var finallyHandler = helper.requireElement("commandList");
      parser.ensureTerminated(finallyHandler);
    }
    var onFeature = {
      displayName,
      events,
      start,
      every,
      execCount: 0,
      errorHandler,
      errorSymbol,
      execute: function(ctx) {
        let eventQueueInfo = ctx.meta.runtime.getEventQueueFor(ctx.me, onFeature);
        if (eventQueueInfo.executing && every === false) {
          if (queueNone || queueFirst && eventQueueInfo.queue.length > 0) {
            return;
          }
          if (queueLast) {
            eventQueueInfo.queue.length = 0;
          }
          eventQueueInfo.queue.push(ctx);
          return;
        }
        onFeature.execCount++;
        eventQueueInfo.executing = true;
        ctx.meta.onHalt = function() {
          eventQueueInfo.executing = false;
          var queued = eventQueueInfo.queue.shift();
          if (queued) {
            setTimeout(function() {
              onFeature.execute(queued);
            }, 1);
          }
        };
        ctx.meta.reject = function(err) {
          console.error(err.message ? err.message : err);
          console.error(err.stack);
          var hypertrace = ctx.meta.runtime.getHyperTrace(ctx, err);
          if (hypertrace) {
            hypertrace.print();
          }
          ctx.meta.runtime.triggerEvent(ctx.me, "exception", {
            error: err
          });
        };
        start.execute(ctx);
      },
      install: function(elt, source, args2, runtime) {
        for (const eventSpec of onFeature.events) {
          var targets;
          if (eventSpec.elsewhere) {
            targets = [document];
          } else if (eventSpec.from) {
            targets = eventSpec.from.evaluate(runtime.makeContext(elt, onFeature, elt, null));
          } else {
            targets = [elt];
          }
          runtime.implicitLoop(targets, function(target) {
            var eventName2 = eventSpec.on;
            if (target == null) {
              console.warn("'%s' feature ignored because target does not exists:", displayName, elt);
              return;
            }
            if (eventSpec.mutationSpec) {
              eventName2 = "hyperscript:mutation";
              const observer = new MutationObserver(function(mutationList, observer2) {
                if (!onFeature.executing) {
                  runtime.triggerEvent(target, eventName2, {
                    mutationList,
                    observer: observer2
                  });
                }
              });
              observer.observe(target, eventSpec.mutationSpec);
            }
            if (eventSpec.intersectionSpec) {
              eventName2 = "hyperscript:intersection";
              const observer = new IntersectionObserver(function(entries) {
                for (const entry of entries) {
                  var detail = {
                    observer
                  };
                  detail = Object.assign(detail, entry);
                  detail["intersecting"] = entry.isIntersecting;
                  runtime.triggerEvent(target, eventName2, detail);
                }
              }, eventSpec.intersectionSpec);
              observer.observe(target);
            }
            var addEventListener = target.addEventListener || target.on;
            addEventListener.call(target, eventName2, function listener(evt) {
              if (typeof Node !== "undefined" && elt instanceof Node && target !== elt && !elt.isConnected) {
                target.removeEventListener(eventName2, listener);
                return;
              }
              var ctx = runtime.makeContext(elt, onFeature, elt, evt);
              if (eventSpec.elsewhere && elt.contains(evt.target)) {
                return;
              }
              if (eventSpec.from) {
                ctx.result = target;
              }
              for (const arg of eventSpec.args) {
                let eventValue = ctx.event[arg.value];
                if (eventValue !== void 0) {
                  ctx.locals[arg.value] = eventValue;
                } else if ("detail" in ctx.event) {
                  ctx.locals[arg.value] = ctx.event["detail"][arg.value];
                }
              }
              ctx.meta.errorHandler = errorHandler;
              ctx.meta.errorSymbol = errorSymbol;
              ctx.meta.finallyHandler = finallyHandler;
              if (eventSpec.filter) {
                var initialCtx = ctx.meta.context;
                ctx.meta.context = ctx.event;
                try {
                  var value = eventSpec.filter.evaluate(ctx);
                  if (value) {
                  } else {
                    return;
                  }
                } finally {
                  ctx.meta.context = initialCtx;
                }
              }
              if (eventSpec.inExpr) {
                var inElement = evt.target;
                while (true) {
                  if (inElement.matches && inElement.matches(eventSpec.inExpr.css)) {
                    ctx.result = inElement;
                    break;
                  } else {
                    inElement = inElement.parentElement;
                    if (inElement == null) {
                      return;
                    }
                  }
                }
              }
              eventSpec.execCount++;
              if (eventSpec.startCount) {
                if (eventSpec.endCount) {
                  if (eventSpec.execCount < eventSpec.startCount || eventSpec.execCount > eventSpec.endCount) {
                    return;
                  }
                } else if (eventSpec.unbounded) {
                  if (eventSpec.execCount < eventSpec.startCount) {
                    return;
                  }
                } else if (eventSpec.execCount !== eventSpec.startCount) {
                  return;
                }
              }
              if (eventSpec.debounceTime) {
                if (eventSpec.debounced) {
                  clearTimeout(eventSpec.debounced);
                }
                eventSpec.debounced = setTimeout(function() {
                  onFeature.execute(ctx);
                }, eventSpec.debounceTime);
                return;
              }
              if (eventSpec.throttleTime) {
                if (eventSpec.lastExec && Date.now() < eventSpec.lastExec + eventSpec.throttleTime) {
                  return;
                } else {
                  eventSpec.lastExec = Date.now();
                }
              }
              onFeature.execute(ctx);
            });
          });
        }
      }
    };
    helper.setParent(start, onFeature);
    return onFeature;
  });
  parser.addFeature("def", function(helper) {
    if (!helper.matchToken("def")) return;
    var functionName = helper.requireElement("dotOrColonPath");
    var nameVal = functionName.evaluate();
    var nameSpace = nameVal.split(".");
    var funcName = nameSpace.pop();
    var args = [];
    if (helper.matchOpToken("(")) {
      if (helper.matchOpToken(")")) {
      } else {
        do {
          args.push(helper.requireTokenType("IDENTIFIER"));
        } while (helper.matchOpToken(","));
        helper.requireOpToken(")");
      }
    }
    var start = helper.requireElement("commandList");
    var errorSymbol, errorHandler;
    if (helper.matchToken("catch")) {
      errorSymbol = helper.requireTokenType("IDENTIFIER").value;
      errorHandler = helper.parseElement("commandList");
    }
    if (helper.matchToken("finally")) {
      var finallyHandler = helper.requireElement("commandList");
      parser.ensureTerminated(finallyHandler);
    }
    var functionFeature = {
      displayName: funcName + "(" + args.map(function(arg) {
        return arg.value;
      }).join(", ") + ")",
      name: funcName,
      args,
      start,
      errorHandler,
      errorSymbol,
      finallyHandler,
      install: function(target, source, funcArgs, runtime) {
        var func = function() {
          var ctx = runtime.makeContext(source, functionFeature, target, null);
          ctx.meta.errorHandler = errorHandler;
          ctx.meta.errorSymbol = errorSymbol;
          ctx.meta.finallyHandler = finallyHandler;
          for (var i = 0; i < args.length; i++) {
            var name = args[i];
            var argumentVal = arguments[i];
            if (name) {
              ctx.locals[name.value] = argumentVal;
            }
          }
          ctx.meta.caller = arguments[args.length];
          if (ctx.meta.caller) {
            ctx.meta.callingCommand = ctx.meta.caller.meta.command;
          }
          var resolve, reject = null;
          var promise = new Promise(function(theResolve, theReject) {
            resolve = theResolve;
            reject = theReject;
          });
          start.execute(ctx);
          if (ctx.meta.returned) {
            return ctx.meta.returnValue;
          } else {
            ctx.meta.resolve = resolve;
            ctx.meta.reject = reject;
            return promise;
          }
        };
        func.hyperfunc = true;
        func.hypername = nameVal;
        runtime.assignToNamespace(target, nameSpace, funcName, func);
      }
    };
    parser.ensureTerminated(start);
    if (errorHandler) {
      parser.ensureTerminated(errorHandler);
    }
    helper.setParent(start, functionFeature);
    return functionFeature;
  });
  parser.addFeature("set", function(helper) {
    let setCmd = helper.parseElement("setCommand");
    if (setCmd) {
      if (setCmd.target.scope !== "element") {
        helper.raiseParseError("variables declared at the feature level must be element scoped.");
      }
      let setFeature = {
        start: setCmd,
        install: function(target, source, args, runtime) {
          setCmd && setCmd.execute(runtime.makeContext(target, setFeature, target, null));
        }
      };
      parser.ensureTerminated(setCmd);
      return setFeature;
    }
  });
  parser.addFeature("init", function(helper) {
    if (!helper.matchToken("init")) return;
    var immediately = helper.matchToken("immediately");
    var start = helper.requireElement("commandList");
    var initFeature = {
      start,
      install: function(target, source, args, runtime) {
        let handler = function() {
          start && start.execute(runtime.makeContext(target, initFeature, target, null));
        };
        if (immediately) {
          handler();
        } else {
          setTimeout(handler, 0);
        }
      }
    };
    parser.ensureTerminated(start);
    helper.setParent(start, initFeature);
    return initFeature;
  });
  parser.addFeature("worker", function(helper) {
    if (helper.matchToken("worker")) {
      helper.raiseParseError(
        "In order to use the 'worker' feature, include the _hyperscript worker plugin. See https://hyperscript.org/features/worker/ for more info."
      );
      return void 0;
    }
  });
  parser.addFeature("behavior", function(helper) {
    if (!helper.matchToken("behavior")) return;
    var path = helper.requireElement("dotOrColonPath").evaluate();
    var nameSpace = path.split(".");
    var name = nameSpace.pop();
    var formalParams = [];
    if (helper.matchOpToken("(") && !helper.matchOpToken(")")) {
      do {
        formalParams.push(helper.requireTokenType("IDENTIFIER").value);
      } while (helper.matchOpToken(","));
      helper.requireOpToken(")");
    }
    var hs = helper.requireElement("hyperscript");
    for (var i = 0; i < hs.features.length; i++) {
      var feature = hs.features[i];
      feature.behavior = path;
    }
    return {
      install: function(target, source, args, runtime) {
        runtime.assignToNamespace(
          runtime.globalScope.document && runtime.globalScope.document.body,
          nameSpace,
          name,
          function(target2, source2, innerArgs) {
            var internalData = runtime.getInternalData(target2);
            var elementScope = getOrInitObject(internalData, path + "Scope");
            for (var i2 = 0; i2 < formalParams.length; i2++) {
              elementScope[formalParams[i2]] = innerArgs[formalParams[i2]];
            }
            hs.apply(target2, source2, null, runtime);
          }
        );
      }
    };
  });
  parser.addFeature("install", function(helper) {
    if (!helper.matchToken("install")) return;
    var behaviorPath = helper.requireElement("dotOrColonPath").evaluate();
    var behaviorNamespace = behaviorPath.split(".");
    var args = helper.parseElement("namedArgumentList");
    var installFeature;
    return installFeature = {
      install: function(target, source, installArgs, runtime) {
        runtime.unifiedEval(
          {
            args: [args],
            op: function(ctx, args2) {
              var behavior = runtime.globalScope;
              for (var i = 0; i < behaviorNamespace.length; i++) {
                behavior = behavior[behaviorNamespace[i]];
                if (typeof behavior !== "object" && typeof behavior !== "function")
                  throw new Error("No such behavior defined as " + behaviorPath);
              }
              if (!(behavior instanceof Function))
                throw new Error(behaviorPath + " is not a behavior");
              behavior(target, source, args2);
            }
          },
          runtime.makeContext(target, installFeature, target, null)
        );
      }
    };
  });
  parser.addGrammarElement("jsBody", function(helper) {
    var jsSourceStart = helper.currentToken().start;
    var jsLastToken = helper.currentToken();
    var funcNames = [];
    var funcName = "";
    var expectFunctionDeclaration = false;
    while (helper.hasMore()) {
      jsLastToken = helper.consumeToken();
      var peek = helper.token(0, true);
      if (peek.type === "IDENTIFIER" && peek.value === "end") {
        break;
      }
      if (expectFunctionDeclaration) {
        if (jsLastToken.type === "IDENTIFIER" || jsLastToken.type === "NUMBER") {
          funcName += jsLastToken.value;
        } else {
          if (funcName !== "") funcNames.push(funcName);
          funcName = "";
          expectFunctionDeclaration = false;
        }
      } else if (jsLastToken.type === "IDENTIFIER" && jsLastToken.value === "function") {
        expectFunctionDeclaration = true;
      }
    }
    var jsSourceEnd = jsLastToken.end + 1;
    return {
      type: "jsBody",
      exposedFunctionNames: funcNames,
      jsSource: helper.source.substring(jsSourceStart, jsSourceEnd)
    };
  });
  parser.addFeature("js", function(helper) {
    if (!helper.matchToken("js")) return;
    var jsBody = helper.requireElement("jsBody");
    var jsSource = jsBody.jsSource + "\nreturn { " + jsBody.exposedFunctionNames.map(function(name) {
      return name + ":" + name;
    }).join(",") + " } ";
    var func = new Function(jsSource);
    return {
      jsSource,
      function: func,
      exposedFunctionNames: jsBody.exposedFunctionNames,
      install: function(target, source, args, runtime) {
        Object.assign(runtime.globalScope, func());
      }
    };
  });
  parser.addCommand("js", function(helper) {
    if (!helper.matchToken("js")) return;
    var inputs = [];
    if (helper.matchOpToken("(")) {
      if (helper.matchOpToken(")")) {
      } else {
        do {
          var inp = helper.requireTokenType("IDENTIFIER");
          inputs.push(inp.value);
        } while (helper.matchOpToken(","));
        helper.requireOpToken(")");
      }
    }
    var jsBody = helper.requireElement("jsBody");
    helper.matchToken("end");
    var func = varargConstructor(Function, inputs.concat([jsBody.jsSource]));
    var command = {
      jsSource: jsBody.jsSource,
      function: func,
      inputs,
      op: function(context2) {
        var args = [];
        inputs.forEach(function(input) {
          args.push(context2.meta.runtime.resolveSymbol(input, context2, "default"));
        });
        var result = func.apply(context2.meta.runtime.globalScope, args);
        if (result && typeof result.then === "function") {
          return new Promise(function(resolve) {
            result.then(function(actualResult) {
              context2.result = actualResult;
              resolve(context2.meta.runtime.findNext(this, context2));
            });
          });
        } else {
          context2.result = result;
          return context2.meta.runtime.findNext(this, context2);
        }
      }
    };
    return command;
  });
  parser.addCommand("async", function(helper) {
    if (!helper.matchToken("async")) return;
    if (helper.matchToken("do")) {
      var body = helper.requireElement("commandList");
      var end = body;
      while (end.next) end = end.next;
      end.next = Runtime.HALT;
      helper.requireToken("end");
    } else {
      var body = helper.requireElement("command");
    }
    var command = {
      body,
      op: function(context2) {
        setTimeout(function() {
          body.execute(context2);
        });
        return context2.meta.runtime.findNext(this, context2);
      }
    };
    helper.setParent(body, command);
    return command;
  });
  parser.addCommand("tell", function(helper) {
    var startToken = helper.currentToken();
    if (!helper.matchToken("tell")) return;
    var value = helper.requireElement("expression");
    var body = helper.requireElement("commandList");
    if (helper.hasMore() && !helper.featureStart(helper.currentToken())) {
      helper.requireToken("end");
    }
    var slot = "tell_" + startToken.start;
    var tellCmd = {
      value,
      body,
      args: [value],
      resolveNext: function(context2) {
        var iterator = context2.meta.iterators[slot];
        if (iterator.index < iterator.value.length) {
          context2.you = iterator.value[iterator.index++];
          return body;
        } else {
          context2.you = iterator.originalYou;
          if (this.next) {
            return this.next;
          } else {
            return context2.meta.runtime.findNext(this.parent, context2);
          }
        }
      },
      op: function(context2, value2) {
        if (value2 == null) {
          value2 = [];
        } else if (!(Array.isArray(value2) || value2 instanceof NodeList)) {
          value2 = [value2];
        }
        context2.meta.iterators[slot] = {
          originalYou: context2.you,
          index: 0,
          value: value2
        };
        return this.resolveNext(context2);
      }
    };
    helper.setParent(body, tellCmd);
    return tellCmd;
  });
  parser.addCommand("wait", function(helper) {
    if (!helper.matchToken("wait")) return;
    var command;
    if (helper.matchToken("for")) {
      helper.matchToken("a");
      var events = [];
      do {
        var lookahead = helper.token(0);
        if (lookahead.type === "NUMBER" || lookahead.type === "L_PAREN") {
          events.push({
            time: helper.requireElement("expression").evaluate()
            // TODO: do we want to allow async here?
          });
        } else {
          events.push({
            name: helper.requireElement("dotOrColonPath", "Expected event name").evaluate(),
            args: parseEventArgs(helper)
          });
        }
      } while (helper.matchToken("or"));
      if (helper.matchToken("from")) {
        var on = helper.requireElement("expression");
      }
      command = {
        event: events,
        on,
        args: [on],
        op: function(context2, on2) {
          var target = on2 ? on2 : context2.me;
          if (!(target instanceof EventTarget))
            throw new Error("Not a valid event target: " + this.on.sourceFor());
          return new Promise((resolve) => {
            var resolved = false;
            for (const eventInfo of events) {
              var listener = (event) => {
                context2.result = event;
                if (eventInfo.args) {
                  for (const arg of eventInfo.args) {
                    context2.locals[arg.value] = event[arg.value] || (event.detail ? event.detail[arg.value] : null);
                  }
                }
                if (!resolved) {
                  resolved = true;
                  resolve(context2.meta.runtime.findNext(this, context2));
                }
              };
              if (eventInfo.name) {
                target.addEventListener(eventInfo.name, listener, { once: true });
              } else if (eventInfo.time != null) {
                setTimeout(listener, eventInfo.time, eventInfo.time);
              }
            }
          });
        }
      };
      return command;
    } else {
      var time;
      if (helper.matchToken("a")) {
        helper.requireToken("tick");
        time = 0;
      } else {
        time = helper.requireElement("expression");
      }
      command = {
        type: "waitCmd",
        time,
        args: [time],
        op: function(context2, timeValue) {
          return new Promise((resolve) => {
            setTimeout(() => {
              resolve(context2.meta.runtime.findNext(this, context2));
            }, timeValue);
          });
        },
        execute: function(context2) {
          return context2.meta.runtime.unifiedExec(this, context2);
        }
      };
      return command;
    }
  });
  parser.addGrammarElement("dotOrColonPath", function(helper) {
    var root = helper.matchTokenType("IDENTIFIER");
    if (root) {
      var path = [root.value];
      var separator = helper.matchOpToken(".") || helper.matchOpToken(":");
      if (separator) {
        do {
          path.push(helper.requireTokenType("IDENTIFIER", "NUMBER").value);
        } while (helper.matchOpToken(separator.value));
      }
      return {
        type: "dotOrColonPath",
        path,
        evaluate: function() {
          return path.join(separator ? separator.value : "");
        }
      };
    }
  });
  parser.addGrammarElement("eventName", function(helper) {
    var token;
    if (token = helper.matchTokenType("STRING")) {
      return {
        evaluate: function() {
          return token.value;
        }
      };
    }
    return helper.parseElement("dotOrColonPath");
  });
  function parseSendCmd(cmdType, helper) {
    var eventName = helper.requireElement("eventName");
    var details = helper.parseElement("namedArgumentList");
    if (cmdType === "send" && helper.matchToken("to") || cmdType === "trigger" && helper.matchToken("on")) {
      var toExpr = helper.requireElement("expression");
    } else {
      var toExpr = helper.requireElement("implicitMeTarget");
    }
    var sendCmd = {
      eventName,
      details,
      to: toExpr,
      args: [toExpr, eventName, details],
      op: function(context2, to, eventName2, details2) {
        context2.meta.runtime.nullCheck(to, toExpr);
        context2.meta.runtime.implicitLoop(to, function(target) {
          context2.meta.runtime.triggerEvent(target, eventName2, details2, context2.me);
        });
        return context2.meta.runtime.findNext(sendCmd, context2);
      }
    };
    return sendCmd;
  }
  parser.addCommand("trigger", function(helper) {
    if (helper.matchToken("trigger")) {
      return parseSendCmd("trigger", helper);
    }
  });
  parser.addCommand("send", function(helper) {
    if (helper.matchToken("send")) {
      return parseSendCmd("send", helper);
    }
  });
  var parseReturnFunction = function(helper, returnAValue) {
    if (returnAValue) {
      if (helper.commandBoundary(helper.currentToken())) {
        helper.raiseParseError("'return' commands must return a value.  If you do not wish to return a value, use 'exit' instead.");
      } else {
        var value = helper.requireElement("expression");
      }
    }
    var returnCmd = {
      value,
      args: [value],
      op: function(context2, value2) {
        var resolve = context2.meta.resolve;
        context2.meta.returned = true;
        context2.meta.returnValue = value2;
        if (resolve) {
          if (value2) {
            resolve(value2);
          } else {
            resolve();
          }
        }
        return context2.meta.runtime.HALT;
      }
    };
    return returnCmd;
  };
  parser.addCommand("return", ReturnCommand.parse);
  parser.addCommand("exit", ExitCommand.parse);
  parser.addCommand("halt", HaltCommand.parse);
  parser.addCommand("log", LogCommand.parse);
  parser.addCommand("beep!", BeepCommand.parse);
  parser.addCommand("throw", ThrowCommand.parse);
  var parseCallOrGet = function(helper) {
    var expr = helper.requireElement("expression");
    var callCmd = {
      expr,
      args: [expr],
      op: function(context2, result) {
        context2.result = result;
        return context2.meta.runtime.findNext(callCmd, context2);
      }
    };
    return callCmd;
  };
  parser.addCommand("call", function(helper) {
    if (!helper.matchToken("call")) return;
    var call = parseCallOrGet(helper);
    if (call.expr && call.expr.type !== "functionCall") {
      helper.raiseParseError("Must be a function invocation");
    }
    return call;
  });
  parser.addCommand("get", function(helper) {
    if (helper.matchToken("get")) {
      return parseCallOrGet(helper);
    }
  });
  parser.addCommand("make", function(helper) {
    if (!helper.matchToken("make")) return;
    helper.matchToken("a") || helper.matchToken("an");
    var expr = helper.requireElement("expression");
    var args = [];
    if (expr.type !== "queryRef" && helper.matchToken("from")) {
      do {
        args.push(helper.requireElement("expression"));
      } while (helper.matchOpToken(","));
    }
    if (helper.matchToken("called")) {
      var target = helper.requireElement("symbol");
    }
    var command;
    if (expr.type === "queryRef") {
      command = {
        op: function(ctx) {
          var match, tagname = "div", id, classes = [];
          var re = /(?:(^|#|\.)([^#\. ]+))/g;
          while (match = re.exec(expr.css)) {
            if (match[1] === "") tagname = match[2].trim();
            else if (match[1] === "#") id = match[2].trim();
            else classes.push(match[2].trim());
          }
          var result = document.createElement(tagname);
          if (id !== void 0) result.id = id;
          for (var i = 0; i < classes.length; i++) {
            var cls = classes[i];
            result.classList.add(cls);
          }
          ctx.result = result;
          if (target) {
            ctx.meta.runtime.setSymbol(target.name, ctx, target.scope, result);
          }
          return ctx.meta.runtime.findNext(this, ctx);
        }
      };
      return command;
    } else {
      command = {
        args: [expr, args],
        op: function(ctx, expr2, args2) {
          ctx.result = varargConstructor(expr2, args2);
          if (target) {
            ctx.meta.runtime.setSymbol(target.name, ctx, target.scope, ctx.result);
          }
          return ctx.meta.runtime.findNext(this, ctx);
        }
      };
      return command;
    }
  });
  parser.addGrammarElement("pseudoCommand", function(helper) {
    let lookAhead = helper.token(1);
    if (!(lookAhead && lookAhead.op && (lookAhead.value === "." || lookAhead.value === "("))) {
      return null;
    }
    var expr = helper.requireElement("primaryExpression");
    var rootRoot = expr.root;
    var root = expr;
    while (rootRoot.root != null) {
      root = root.root;
      rootRoot = rootRoot.root;
    }
    if (expr.type !== "functionCall") {
      helper.raiseParseError("Pseudo-commands must be function calls");
    }
    if (root.type === "functionCall" && root.root.root == null) {
      if (helper.matchAnyToken("the", "to", "on", "with", "into", "from", "at")) {
        var realRoot = helper.requireElement("expression");
      } else if (helper.matchToken("me")) {
        var realRoot = helper.requireElement("implicitMeTarget");
      }
    }
    var pseudoCommand;
    if (realRoot) {
      pseudoCommand = {
        type: "pseudoCommand",
        root: realRoot,
        argExressions: root.argExressions,
        args: [realRoot, root.argExressions],
        op: function(context2, rootRoot2, args) {
          context2.meta.runtime.nullCheck(rootRoot2, realRoot);
          var func = rootRoot2[root.root.name];
          context2.meta.runtime.nullCheck(func, root);
          if (func.hyperfunc) {
            args.push(context2);
          }
          context2.result = func.apply(rootRoot2, args);
          return context2.meta.runtime.findNext(pseudoCommand, context2);
        },
        execute: function(context2) {
          return context2.meta.runtime.unifiedExec(this, context2);
        }
      };
    } else {
      pseudoCommand = {
        type: "pseudoCommand",
        expr,
        args: [expr],
        op: function(context2, result) {
          context2.result = result;
          return context2.meta.runtime.findNext(pseudoCommand, context2);
        },
        execute: function(context2) {
          return context2.meta.runtime.unifiedExec(this, context2);
        }
      };
    }
    return pseudoCommand;
  });
  var makeSetter = function(helper, target, value) {
    var symbolWrite = target.type === "symbol";
    var attributeWrite = target.type === "attributeRef";
    var styleWrite = target.type === "styleRef";
    var arrayWrite = target.type === "arrayIndex";
    if (!(attributeWrite || styleWrite || symbolWrite) && target.root == null) {
      helper.raiseParseError("Can only put directly into symbols, not references");
    }
    var rootElt = null;
    var prop = null;
    if (symbolWrite) {
    } else if (attributeWrite || styleWrite) {
      rootElt = helper.requireElement("implicitMeTarget");
      var attribute = target;
    } else if (arrayWrite) {
      prop = target.firstIndex;
      rootElt = target.root;
    } else {
      prop = target.prop ? target.prop.value : null;
      var attribute = target.attribute;
      rootElt = target.root;
    }
    var setCmd = {
      target,
      symbolWrite,
      value,
      args: [rootElt, prop, value],
      op: function(context2, root, prop2, valueToSet) {
        if (symbolWrite) {
          context2.meta.runtime.setSymbol(target.name, context2, target.scope, valueToSet);
        } else {
          context2.meta.runtime.nullCheck(root, rootElt);
          if (arrayWrite) {
            root[prop2] = valueToSet;
          } else {
            context2.meta.runtime.implicitLoop(root, function(elt) {
              if (attribute) {
                if (attribute.type === "attributeRef") {
                  if (valueToSet == null) {
                    elt.removeAttribute(attribute.name);
                  } else {
                    elt.setAttribute(attribute.name, valueToSet);
                  }
                } else {
                  elt.style[attribute.name] = valueToSet;
                }
              } else {
                elt[prop2] = valueToSet;
              }
            });
          }
        }
        return context2.meta.runtime.findNext(this, context2);
      }
    };
    return setCmd;
  };
  parser.addCommand("default", DefaultCommand.parse);
  parser.addCommand("set", SetCommand.parse);
  parser.addCommand("if", function(helper) {
    if (!helper.matchToken("if")) return;
    var expr = helper.requireElement("expression");
    helper.matchToken("then");
    var trueBranch = helper.parseElement("commandList");
    var nestedIfStmt = false;
    let elseToken = helper.matchToken("else") || helper.matchToken("otherwise");
    if (elseToken) {
      let elseIfIfToken = helper.peekToken("if");
      nestedIfStmt = elseIfIfToken != null && elseIfIfToken.line === elseToken.line;
      if (nestedIfStmt) {
        var falseBranch = helper.parseElement("command");
      } else {
        var falseBranch = helper.parseElement("commandList");
      }
    }
    if (helper.hasMore() && !nestedIfStmt) {
      helper.requireToken("end");
    }
    var ifCmd = {
      expr,
      trueBranch,
      falseBranch,
      args: [expr],
      op: function(context2, exprValue) {
        if (exprValue) {
          return trueBranch;
        } else if (falseBranch) {
          return falseBranch;
        } else {
          return context2.meta.runtime.findNext(this, context2);
        }
      }
    };
    helper.setParent(trueBranch, ifCmd);
    helper.setParent(falseBranch, ifCmd);
    return ifCmd;
  });
  var parseRepeatExpression = function(helper, startedWithForToken) {
    var innerStartToken = helper.currentToken();
    var identifier;
    if (helper.matchToken("for") || startedWithForToken) {
      var identifierToken = helper.requireTokenType("IDENTIFIER");
      identifier = identifierToken.value;
      helper.requireToken("in");
      var expression = helper.requireElement("expression");
    } else if (helper.matchToken("in")) {
      identifier = "it";
      var expression = helper.requireElement("expression");
    } else if (helper.matchToken("while")) {
      var whileExpr = helper.requireElement("expression");
    } else if (helper.matchToken("until")) {
      var isUntil = true;
      if (helper.matchToken("event")) {
        var evt = helper.requireElement("dotOrColonPath", "Expected event name");
        if (helper.matchToken("from")) {
          var on = helper.requireElement("expression");
        }
      } else {
        var whileExpr = helper.requireElement("expression");
      }
    } else {
      if (!helper.commandBoundary(helper.currentToken()) && helper.currentToken().value !== "forever") {
        var times = helper.requireElement("expression");
        helper.requireToken("times");
      } else {
        helper.matchToken("forever");
        var forever = true;
      }
    }
    if (helper.matchToken("index")) {
      var identifierToken = helper.requireTokenType("IDENTIFIER");
      var indexIdentifier = identifierToken.value;
    } else if (helper.matchToken("indexed")) {
      helper.requireToken("by");
      var identifierToken = helper.requireTokenType("IDENTIFIER");
      var indexIdentifier = identifierToken.value;
    }
    var loop = helper.parseElement("commandList");
    if (loop && evt) {
      var last = loop;
      while (last.next) {
        last = last.next;
      }
      var waitATick = {
        type: "waitATick",
        op: function() {
          return new Promise(function(resolve) {
            setTimeout(function() {
              resolve(context.meta.runtime.findNext(waitATick));
            }, 0);
          });
        }
      };
      last.next = waitATick;
    }
    if (helper.hasMore()) {
      helper.requireToken("end");
    }
    if (identifier == null) {
      identifier = "_implicit_repeat_" + innerStartToken.start;
      var slot = identifier;
    } else {
      var slot = identifier + "_" + innerStartToken.start;
    }
    var repeatCmd = {
      identifier,
      indexIdentifier,
      slot,
      expression,
      forever,
      times,
      until: isUntil,
      event: evt,
      on,
      whileExpr,
      resolveNext: function() {
        return this;
      },
      loop,
      args: [whileExpr, times],
      op: function(context2, whileValue, times2) {
        var iteratorInfo = context2.meta.iterators[slot];
        var keepLooping = false;
        var loopVal = null;
        if (this.forever) {
          keepLooping = true;
        } else if (this.until) {
          if (evt) {
            keepLooping = context2.meta.iterators[slot].eventFired === false;
          } else {
            keepLooping = whileValue !== true;
          }
        } else if (whileExpr) {
          keepLooping = whileValue;
        } else if (times2) {
          keepLooping = iteratorInfo.index < times2;
        } else {
          var nextValFromIterator = iteratorInfo.iterator.next();
          keepLooping = !nextValFromIterator.done;
          loopVal = nextValFromIterator.value;
        }
        if (keepLooping) {
          if (iteratorInfo.value) {
            context2.result = context2.locals[identifier] = loopVal;
          } else {
            context2.result = iteratorInfo.index;
          }
          if (indexIdentifier) {
            context2.locals[indexIdentifier] = iteratorInfo.index;
          }
          iteratorInfo.index++;
          return loop;
        } else {
          context2.meta.iterators[slot] = null;
          return context2.meta.runtime.findNext(this.parent, context2);
        }
      }
    };
    helper.setParent(loop, repeatCmd);
    var repeatInit = {
      name: "repeatInit",
      args: [expression, evt, on],
      op: function(context2, value, event, on2) {
        var iteratorInfo = {
          index: 0,
          value,
          eventFired: false
        };
        context2.meta.iterators[slot] = iteratorInfo;
        if (value) {
          if (value[Symbol.iterator]) {
            iteratorInfo.iterator = value[Symbol.iterator]();
          } else {
            iteratorInfo.iterator = Object.keys(value)[Symbol.iterator]();
          }
        }
        if (evt) {
          var target = on2 || context2.me;
          target.addEventListener(
            event,
            function(e) {
              context2.meta.iterators[slot].eventFired = true;
            },
            { once: true }
          );
        }
        return repeatCmd;
      },
      execute: function(context2) {
        return context2.meta.runtime.unifiedExec(this, context2);
      }
    };
    helper.setParent(repeatCmd, repeatInit);
    return repeatInit;
  };
  parser.addCommand("repeat", function(helper) {
    if (helper.matchToken("repeat")) {
      return parseRepeatExpression(helper, false);
    }
  });
  parser.addCommand("for", function(helper) {
    if (helper.matchToken("for")) {
      return parseRepeatExpression(helper, true);
    }
  });
  parser.addCommand("continue", function(helper) {
    if (!helper.matchToken("continue")) return;
    var command = {
      op: function(context2) {
        for (var parent = this.parent; true; parent = parent.parent) {
          if (parent == void 0) {
            helper.raiseParseError("Command `continue` cannot be used outside of a `repeat` loop.");
          }
          if (parent.loop != void 0) {
            return parent.resolveNext(context2);
          }
        }
      }
    };
    return command;
  });
  parser.addCommand("break", function(helper) {
    if (!helper.matchToken("break")) return;
    var command = {
      op: function(context2) {
        for (var parent = this.parent; true; parent = parent.parent) {
          if (parent == void 0) {
            helper.raiseParseError("Command `continue` cannot be used outside of a `repeat` loop.");
          }
          if (parent.loop != void 0) {
            return context2.meta.runtime.findNext(parent.parent, context2);
          }
        }
      }
    };
    return command;
  });
  parser.addGrammarElement("stringLike", function(helper) {
    return helper.parseAnyOf(["string", "nakedString"]);
  });
  parser.addCommand("append", function(helper) {
    if (!helper.matchToken("append")) return;
    var targetExpr = null;
    var value = helper.requireElement("expression");
    var implicitResultSymbol = {
      type: "symbol",
      evaluate: function(context2) {
        return context2.meta.runtime.resolveSymbol("result", context2);
      }
    };
    if (helper.matchToken("to")) {
      targetExpr = helper.requireElement("expression");
    } else {
      targetExpr = implicitResultSymbol;
    }
    var setter = null;
    if (targetExpr.type === "symbol" || targetExpr.type === "attributeRef" || targetExpr.root != null) {
      setter = makeSetter(helper, targetExpr, implicitResultSymbol);
    }
    var command = {
      value,
      target: targetExpr,
      args: [targetExpr, value],
      op: function(context2, target, value2) {
        if (Array.isArray(target)) {
          target.push(value2);
          return context2.meta.runtime.findNext(this, context2);
        } else if (target instanceof Element) {
          if (value2 instanceof Element) {
            target.insertAdjacentElement("beforeend", value2);
          } else {
            target.insertAdjacentHTML("beforeend", value2);
          }
          context2.meta.runtime.processNode(
            /** @type {HTMLElement} */
            target
          );
          return context2.meta.runtime.findNext(this, context2);
        } else if (setter) {
          context2.result = (target || "") + value2;
          return setter;
        } else {
          throw Error("Unable to append a value!");
        }
      },
      execute: function(context2) {
        return context2.meta.runtime.unifiedExec(
          this,
          context2
          /*, value, target*/
        );
      }
    };
    if (setter != null) {
      setter.parent = command;
    }
    return command;
  });
  function parsePickRange(helper) {
    helper.matchToken("at") || helper.matchToken("from");
    const rv = { includeStart: true, includeEnd: false };
    rv.from = helper.matchToken("start") ? 0 : helper.requireElement("expression");
    if (helper.matchToken("to") || helper.matchOpToken("..")) {
      if (helper.matchToken("end")) {
        rv.toEnd = true;
      } else {
        rv.to = helper.requireElement("expression");
      }
    }
    if (helper.matchToken("inclusive")) rv.includeEnd = true;
    else if (helper.matchToken("exclusive")) rv.includeStart = false;
    return rv;
  }
  parser.addCommand("pick", (helper) => {
    if (!helper.matchToken("pick")) return;
    helper.matchToken("the");
    if (helper.matchToken("item") || helper.matchToken("items") || helper.matchToken("character") || helper.matchToken("characters")) {
      const range = parsePickRange(helper);
      helper.requireToken("from");
      const root = helper.requireElement("expression");
      return {
        args: [root, range.from, range.to],
        op(ctx, root2, from, to) {
          if (range.toEnd) to = root2.length;
          if (!range.includeStart) from++;
          if (range.includeEnd) to++;
          if (to == null || to == void 0) to = from + 1;
          ctx.result = root2.slice(from, to);
          return ctx.meta.runtime.findNext(this, ctx);
        }
      };
    }
    if (helper.matchToken("match")) {
      helper.matchToken("of");
      const re = helper.parseElement("expression");
      let flags = "";
      if (helper.matchOpToken("|")) {
        flags = helper.requireTokenType("IDENTIFIER").value;
      }
      helper.requireToken("from");
      const root = helper.parseElement("expression");
      return {
        args: [root, re],
        op(ctx, root2, re2) {
          ctx.result = new RegExp(re2, flags).exec(root2);
          return ctx.meta.runtime.findNext(this, ctx);
        }
      };
    }
    if (helper.matchToken("matches")) {
      helper.matchToken("of");
      const re = helper.parseElement("expression");
      let flags = "gu";
      if (helper.matchOpToken("|")) {
        flags = "g" + helper.requireTokenType("IDENTIFIER").value.replace("g", "");
      }
      helper.requireToken("from");
      const root = helper.parseElement("expression");
      return {
        args: [root, re],
        op(ctx, root2, re2) {
          ctx.result = new RegExpIterable(re2, flags, root2);
          return ctx.meta.runtime.findNext(this, ctx);
        }
      };
    }
  });
  parser.addCommand("increment", IncrementCommand.parse);
  parser.addCommand("decrement", DecrementCommand.parse);
  function parseConversionInfo(helper) {
    var type = "text";
    var conversion;
    helper.matchToken("a") || helper.matchToken("an");
    if (helper.matchToken("json") || helper.matchToken("Object")) {
      type = "json";
    } else if (helper.matchToken("response")) {
      type = "response";
    } else if (helper.matchToken("html")) {
      type = "html";
    } else if (helper.matchToken("text")) {
    } else {
      conversion = helper.requireElement("dotOrColonPath").evaluate();
    }
    return { type, conversion };
  }
  parser.addCommand("fetch", function(helper) {
    if (!helper.matchToken("fetch")) return;
    var url = helper.requireElement("stringLike");
    if (helper.matchToken("as")) {
      var conversionInfo = parseConversionInfo(helper);
    }
    if (helper.matchToken("with") && helper.currentToken().value !== "{") {
      var args = helper.parseElement("nakedNamedArgumentList");
    } else {
      var args = helper.parseElement("objectLiteral");
    }
    if (conversionInfo == null && helper.matchToken("as")) {
      conversionInfo = parseConversionInfo(helper);
    }
    var type = conversionInfo ? conversionInfo.type : "text";
    var conversion = conversionInfo ? conversionInfo.conversion : null;
    var fetchCmd = {
      url,
      argExpressions: args,
      args: [url, args],
      op: function(context2, url2, args2) {
        var detail = args2 || {};
        detail["sender"] = context2.me;
        detail["headers"] = detail["headers"] || {};
        var abortController = new AbortController();
        let abortListener = context2.me.addEventListener("fetch:abort", function() {
          abortController.abort();
        }, { once: true });
        detail["signal"] = abortController.signal;
        context2.meta.runtime.triggerEvent(context2.me, "hyperscript:beforeFetch", detail);
        context2.meta.runtime.triggerEvent(context2.me, "fetch:beforeRequest", detail);
        args2 = detail;
        var finished = false;
        if (args2.timeout) {
          setTimeout(function() {
            if (!finished) {
              abortController.abort();
            }
          }, args2.timeout);
        }
        return fetch(url2, args2).then(function(resp) {
          let resultDetails = { response: resp };
          context2.meta.runtime.triggerEvent(context2.me, "fetch:afterResponse", resultDetails);
          resp = resultDetails.response;
          if (type === "response") {
            context2.result = resp;
            context2.meta.runtime.triggerEvent(context2.me, "fetch:afterRequest", { result: resp });
            finished = true;
            return context2.meta.runtime.findNext(fetchCmd, context2);
          }
          if (type === "json") {
            return resp.json().then(function(result) {
              context2.result = result;
              context2.meta.runtime.triggerEvent(context2.me, "fetch:afterRequest", { result });
              finished = true;
              return context2.meta.runtime.findNext(fetchCmd, context2);
            });
          }
          return resp.text().then(function(result) {
            if (conversion) result = context2.meta.runtime.convertValue(result, conversion);
            if (type === "html") result = context2.meta.runtime.convertValue(result, "Fragment");
            context2.result = result;
            context2.meta.runtime.triggerEvent(context2.me, "fetch:afterRequest", { result });
            finished = true;
            return context2.meta.runtime.findNext(fetchCmd, context2);
          });
        }).catch(function(reason) {
          context2.meta.runtime.triggerEvent(context2.me, "fetch:error", {
            reason
          });
          throw reason;
        }).finally(function() {
          context2.me.removeEventListener("fetch:abort", abortListener);
        });
      }
    };
    return fetchCmd;
  });
}

// src/grammars/web.js
function hyperscriptWebGrammar(parser) {
  parser.addCommand("settle", function(helper) {
    if (helper.matchToken("settle")) {
      if (!helper.commandBoundary(helper.currentToken())) {
        var onExpr = helper.requireElement("expression");
      } else {
        var onExpr = helper.requireElement("implicitMeTarget");
      }
      var settleCommand = {
        type: "settleCmd",
        args: [onExpr],
        op: function(context2, on) {
          context2.meta.runtime.nullCheck(on, onExpr);
          var resolve = null;
          var resolved = false;
          var transitionStarted = false;
          var promise = new Promise(function(r) {
            resolve = r;
          });
          on.addEventListener(
            "transitionstart",
            function() {
              transitionStarted = true;
            },
            { once: true }
          );
          setTimeout(function() {
            if (!transitionStarted && !resolved) {
              resolve(context2.meta.runtime.findNext(settleCommand, context2));
            }
          }, 500);
          on.addEventListener(
            "transitionend",
            function() {
              if (!resolved) {
                resolve(context2.meta.runtime.findNext(settleCommand, context2));
              }
            },
            { once: true }
          );
          return promise;
        },
        execute: function(context2) {
          return context2.meta.runtime.unifiedExec(this, context2);
        }
      };
      return settleCommand;
    }
  });
  parser.addCommand("add", function(helper) {
    if (helper.matchToken("add")) {
      var classRef = helper.parseElement("classRef");
      var attributeRef = null;
      var cssDeclaration = null;
      if (classRef == null) {
        attributeRef = helper.parseElement("attributeRef");
        if (attributeRef == null) {
          cssDeclaration = helper.parseElement("styleLiteral");
          if (cssDeclaration == null) {
            helper.raiseParseError("Expected either a class reference or attribute expression");
          }
        }
      } else {
        var classRefs = [classRef];
        while (classRef = helper.parseElement("classRef")) {
          classRefs.push(classRef);
        }
      }
      if (helper.matchToken("to")) {
        var toExpr = helper.requireElement("expression");
      } else {
        var toExpr = helper.requireElement("implicitMeTarget");
      }
      if (helper.matchToken("when")) {
        if (cssDeclaration) {
          helper.raiseParseError("Only class and properties are supported with a when clause");
        }
        var when = helper.requireElement("expression");
      }
      if (classRefs) {
        return {
          classRefs,
          to: toExpr,
          args: [toExpr, classRefs],
          op: function(context2, to, classRefs2) {
            context2.meta.runtime.nullCheck(to, toExpr);
            context2.meta.runtime.forEach(classRefs2, function(classRef2) {
              context2.meta.runtime.implicitLoop(to, function(target) {
                if (when) {
                  context2.result = target;
                  let whenResult = context2.meta.runtime.evaluateNoPromise(when, context2);
                  if (whenResult) {
                    if (target instanceof Element) target.classList.add(classRef2.className);
                  } else {
                    if (target instanceof Element) target.classList.remove(classRef2.className);
                  }
                  context2.result = null;
                } else {
                  if (target instanceof Element) target.classList.add(classRef2.className);
                }
              });
            });
            return context2.meta.runtime.findNext(this, context2);
          }
        };
      } else if (attributeRef) {
        return {
          type: "addCmd",
          attributeRef,
          to: toExpr,
          args: [toExpr],
          op: function(context2, to, attrRef) {
            context2.meta.runtime.nullCheck(to, toExpr);
            context2.meta.runtime.implicitLoop(to, function(target) {
              if (when) {
                context2.result = target;
                let whenResult = context2.meta.runtime.evaluateNoPromise(when, context2);
                if (whenResult) {
                  target.setAttribute(attributeRef.name, attributeRef.value);
                } else {
                  target.removeAttribute(attributeRef.name);
                }
                context2.result = null;
              } else {
                target.setAttribute(attributeRef.name, attributeRef.value);
              }
            });
            return context2.meta.runtime.findNext(this, context2);
          },
          execute: function(ctx) {
            return context.meta.runtime.unifiedExec(this, ctx);
          }
        };
      } else {
        return {
          type: "addCmd",
          cssDeclaration,
          to: toExpr,
          args: [toExpr, cssDeclaration],
          op: function(context2, to, css) {
            context2.meta.runtime.nullCheck(to, toExpr);
            context2.meta.runtime.implicitLoop(to, function(target) {
              target.style.cssText += css;
            });
            return context2.meta.runtime.findNext(this, context2);
          },
          execute: function(ctx) {
            return context.meta.runtime.unifiedExec(this, ctx);
          }
        };
      }
    }
  });
  parser.addGrammarElement("styleLiteral", StyleLiteral.parse);
  parser.addCommand("remove", function(helper) {
    if (helper.matchToken("remove")) {
      var classRef = helper.parseElement("classRef");
      var attributeRef = null;
      var elementExpr = null;
      if (classRef == null) {
        attributeRef = helper.parseElement("attributeRef");
        if (attributeRef == null) {
          elementExpr = helper.parseElement("expression");
          if (elementExpr == null) {
            helper.raiseParseError(
              "Expected either a class reference, attribute expression or value expression"
            );
          }
        }
      } else {
        var classRefs = [classRef];
        while (classRef = helper.parseElement("classRef")) {
          classRefs.push(classRef);
        }
      }
      if (helper.matchToken("from")) {
        var fromExpr = helper.requireElement("expression");
      } else {
        if (elementExpr == null) {
          var fromExpr = helper.requireElement("implicitMeTarget");
        }
      }
      if (elementExpr) {
        return {
          elementExpr,
          from: fromExpr,
          args: [elementExpr, fromExpr],
          op: function(context2, element, from) {
            context2.meta.runtime.nullCheck(element, elementExpr);
            context2.meta.runtime.implicitLoop(element, function(target) {
              if (target.parentElement && (from == null || from.contains(target))) {
                target.parentElement.removeChild(target);
              }
            });
            return context2.meta.runtime.findNext(this, context2);
          }
        };
      } else {
        return {
          classRefs,
          attributeRef,
          elementExpr,
          from: fromExpr,
          args: [classRefs, fromExpr],
          op: function(context2, classRefs2, from) {
            context2.meta.runtime.nullCheck(from, fromExpr);
            if (classRefs2) {
              context2.meta.runtime.forEach(classRefs2, function(classRef2) {
                context2.meta.runtime.implicitLoop(from, function(target) {
                  target.classList.remove(classRef2.className);
                });
              });
            } else {
              context2.meta.runtime.implicitLoop(from, function(target) {
                target.removeAttribute(attributeRef.name);
              });
            }
            return context2.meta.runtime.findNext(this, context2);
          }
        };
      }
    }
  });
  parser.addCommand("toggle", function(helper) {
    if (helper.matchToken("toggle")) {
      helper.matchAnyToken("the", "my");
      if (helper.currentToken().type === "STYLE_REF") {
        let styleRef = helper.consumeToken();
        var name = styleRef.value.substr(1);
        var visibility = true;
        var hideShowStrategy = resolveHideShowStrategy(parser, helper, name);
        if (helper.matchToken("of")) {
          helper.pushFollow("with");
          try {
            var onExpr = helper.requireElement("expression");
          } finally {
            helper.popFollow();
          }
        } else {
          var onExpr = helper.requireElement("implicitMeTarget");
        }
      } else if (helper.matchToken("between")) {
        var between = true;
        var classRef = helper.parseElement("classRef");
        helper.requireToken("and");
        var classRef2 = helper.requireElement("classRef");
      } else {
        var classRef = helper.parseElement("classRef");
        var attributeRef = null;
        if (classRef == null) {
          attributeRef = helper.parseElement("attributeRef");
          if (attributeRef == null) {
            helper.raiseParseError("Expected either a class reference or attribute expression");
          }
        } else {
          var classRefs = [classRef];
          while (classRef = helper.parseElement("classRef")) {
            classRefs.push(classRef);
          }
        }
      }
      if (visibility !== true) {
        if (helper.matchToken("on")) {
          var onExpr = helper.requireElement("expression");
        } else {
          var onExpr = helper.requireElement("implicitMeTarget");
        }
      }
      if (helper.matchToken("for")) {
        var time = helper.requireElement("expression");
      } else if (helper.matchToken("until")) {
        var evt = helper.requireElement("dotOrColonPath", "Expected event name");
        if (helper.matchToken("from")) {
          var from = helper.requireElement("expression");
        }
      }
      var toggleCmd = {
        classRef,
        classRef2,
        classRefs,
        attributeRef,
        on: onExpr,
        time,
        evt,
        from,
        toggle: function(context2, on, classRef3, classRef22, classRefs2) {
          context2.meta.runtime.nullCheck(on, onExpr);
          if (visibility) {
            context2.meta.runtime.implicitLoop(on, function(target) {
              hideShowStrategy("toggle", target);
            });
          } else if (between) {
            context2.meta.runtime.implicitLoop(on, function(target) {
              if (target.classList.contains(classRef3.className)) {
                target.classList.remove(classRef3.className);
                target.classList.add(classRef22.className);
              } else {
                target.classList.add(classRef3.className);
                target.classList.remove(classRef22.className);
              }
            });
          } else if (classRefs2) {
            context2.meta.runtime.forEach(classRefs2, function(classRef4) {
              context2.meta.runtime.implicitLoop(on, function(target) {
                target.classList.toggle(classRef4.className);
              });
            });
          } else {
            context2.meta.runtime.implicitLoop(on, function(target) {
              if (target.hasAttribute(attributeRef.name)) {
                target.removeAttribute(attributeRef.name);
              } else {
                target.setAttribute(attributeRef.name, attributeRef.value);
              }
            });
          }
        },
        args: [onExpr, time, evt, from, classRef, classRef2, classRefs],
        op: function(context2, on, time2, evt2, from2, classRef3, classRef22, classRefs2) {
          if (time2) {
            return new Promise(function(resolve) {
              toggleCmd.toggle(context2, on, classRef3, classRef22, classRefs2);
              setTimeout(function() {
                toggleCmd.toggle(context2, on, classRef3, classRef22, classRefs2);
                resolve(context2.meta.runtime.findNext(toggleCmd, context2));
              }, time2);
            });
          } else if (evt2) {
            return new Promise(function(resolve) {
              var target = from2 || context2.me;
              target.addEventListener(
                evt2,
                function() {
                  toggleCmd.toggle(context2, on, classRef3, classRef22, classRefs2);
                  resolve(context2.meta.runtime.findNext(toggleCmd, context2));
                },
                { once: true }
              );
              toggleCmd.toggle(context2, on, classRef3, classRef22, classRefs2);
            });
          } else {
            this.toggle(context2, on, classRef3, classRef22, classRefs2);
            return context2.meta.runtime.findNext(toggleCmd, context2);
          }
        }
      };
      return toggleCmd;
    }
  });
  var HIDE_SHOW_STRATEGIES = {
    display: function(op, element, arg) {
      if (arg) {
        element.style.display = arg;
      } else if (op === "toggle") {
        if (getComputedStyle(element).display === "none") {
          HIDE_SHOW_STRATEGIES.display("show", element, arg);
        } else {
          HIDE_SHOW_STRATEGIES.display("hide", element, arg);
        }
      } else if (op === "hide") {
        const internalData = parser.runtime.getInternalData(element);
        if (internalData.originalDisplay == null) {
          internalData.originalDisplay = element.style.display;
        }
        element.style.display = "none";
      } else {
        const internalData = parser.runtime.getInternalData(element);
        if (internalData.originalDisplay && internalData.originalDisplay !== "none") {
          element.style.display = internalData.originalDisplay;
        } else {
          element.style.removeProperty("display");
        }
      }
    },
    visibility: function(op, element, arg) {
      if (arg) {
        element.style.visibility = arg;
      } else if (op === "toggle") {
        if (getComputedStyle(element).visibility === "hidden") {
          HIDE_SHOW_STRATEGIES.visibility("show", element, arg);
        } else {
          HIDE_SHOW_STRATEGIES.visibility("hide", element, arg);
        }
      } else if (op === "hide") {
        element.style.visibility = "hidden";
      } else {
        element.style.visibility = "visible";
      }
    },
    opacity: function(op, element, arg) {
      if (arg) {
        element.style.opacity = arg;
      } else if (op === "toggle") {
        if (getComputedStyle(element).opacity === "0") {
          HIDE_SHOW_STRATEGIES.opacity("show", element, arg);
        } else {
          HIDE_SHOW_STRATEGIES.opacity("hide", element, arg);
        }
      } else if (op === "hide") {
        element.style.opacity = "0";
      } else {
        element.style.opacity = "1";
      }
    }
  };
  var parseShowHideTarget = function(helper) {
    var target;
    var currentTokenValue = helper.currentToken();
    if (currentTokenValue.value === "when" || currentTokenValue.value === "with" || helper.commandBoundary(currentTokenValue)) {
      target = helper.parseElement("implicitMeTarget");
    } else {
      target = helper.parseElement("expression");
    }
    return target;
  };
  var resolveHideShowStrategy = function(parser2, helper, name) {
    var configDefault = config.defaultHideShowStrategy;
    var strategies = HIDE_SHOW_STRATEGIES;
    if (config.hideShowStrategies) {
      strategies = Object.assign(strategies, config.hideShowStrategies);
    }
    name = name || configDefault || "display";
    var value = strategies[name];
    if (value == null) {
      helper.raiseParseError("Unknown show/hide strategy : " + name);
    }
    return value;
  };
  parser.addCommand("hide", function(helper) {
    if (helper.matchToken("hide")) {
      var targetExpr = parseShowHideTarget(helper);
      var name = null;
      if (helper.matchToken("with")) {
        name = helper.requireTokenType("IDENTIFIER", "STYLE_REF").value;
        if (name.indexOf("*") === 0) {
          name = name.substr(1);
        }
      }
      var hideShowStrategy = resolveHideShowStrategy(parser, helper, name);
      return {
        target: targetExpr,
        args: [targetExpr],
        op: function(ctx, target) {
          ctx.meta.runtime.nullCheck(target, targetExpr);
          ctx.meta.runtime.implicitLoop(target, function(elt) {
            hideShowStrategy("hide", elt);
          });
          return ctx.meta.runtime.findNext(this, ctx);
        }
      };
    }
  });
  parser.addCommand("show", function(helper) {
    if (helper.matchToken("show")) {
      var targetExpr = parseShowHideTarget(helper);
      var name = null;
      if (helper.matchToken("with")) {
        name = helper.requireTokenType("IDENTIFIER", "STYLE_REF").value;
        if (name.indexOf("*") === 0) {
          name = name.substr(1);
        }
      }
      var arg = null;
      if (helper.matchOpToken(":")) {
        var tokenArr = helper.consumeUntilWhitespace();
        helper.matchTokenType("WHITESPACE");
        arg = tokenArr.map(function(t) {
          return t.value;
        }).join("");
      }
      if (helper.matchToken("when")) {
        var when = helper.requireElement("expression");
      }
      var hideShowStrategy = resolveHideShowStrategy(parser, helper, name);
      return {
        target: targetExpr,
        when,
        args: [targetExpr],
        op: function(ctx, target) {
          ctx.meta.runtime.nullCheck(target, targetExpr);
          ctx.meta.runtime.implicitLoop(target, function(elt) {
            if (when) {
              ctx.result = elt;
              let whenResult = ctx.meta.runtime.evaluateNoPromise(when, ctx);
              if (whenResult) {
                hideShowStrategy("show", elt, arg);
              } else {
                hideShowStrategy("hide", elt);
              }
              ctx.result = null;
            } else {
              hideShowStrategy("show", elt, arg);
            }
          });
          return ctx.meta.runtime.findNext(this, ctx);
        }
      };
    }
  });
  parser.addCommand("take", function(helper) {
    if (helper.matchToken("take")) {
      let classRef = null;
      let classRefs = [];
      while (classRef = helper.parseElement("classRef")) {
        classRefs.push(classRef);
      }
      var attributeRef = null;
      var replacementValue = null;
      let weAreTakingClasses = classRefs.length > 0;
      if (!weAreTakingClasses) {
        attributeRef = helper.parseElement("attributeRef");
        if (attributeRef == null) {
          helper.raiseParseError("Expected either a class reference or attribute expression");
        }
        if (helper.matchToken("with")) {
          replacementValue = helper.requireElement("expression");
        }
      }
      if (helper.matchToken("from")) {
        var fromExpr = helper.requireElement("expression");
      }
      if (helper.matchToken("for")) {
        var forExpr = helper.requireElement("expression");
      } else {
        var forExpr = helper.requireElement("implicitMeTarget");
      }
      if (weAreTakingClasses) {
        var takeCmd = {
          classRefs,
          from: fromExpr,
          forElt: forExpr,
          args: [classRefs, fromExpr, forExpr],
          op: function(context2, classRefs2, from, forElt) {
            context2.meta.runtime.nullCheck(forElt, forExpr);
            context2.meta.runtime.implicitLoop(classRefs2, function(classRef2) {
              var clazz = classRef2.className;
              if (from) {
                context2.meta.runtime.implicitLoop(from, function(target) {
                  target.classList.remove(clazz);
                });
              } else {
                context2.meta.runtime.implicitLoop(classRef2, function(target) {
                  target.classList.remove(clazz);
                });
              }
              context2.meta.runtime.implicitLoop(forElt, function(target) {
                target.classList.add(clazz);
              });
            });
            return context2.meta.runtime.findNext(this, context2);
          }
        };
        return takeCmd;
      } else {
        var takeCmd2 = {
          attributeRef,
          from: fromExpr,
          forElt: forExpr,
          args: [fromExpr, forExpr, replacementValue],
          op: function(context2, from, forElt, replacementValue2) {
            context2.meta.runtime.nullCheck(from, fromExpr);
            context2.meta.runtime.nullCheck(forElt, forExpr);
            context2.meta.runtime.implicitLoop(from, function(target) {
              if (!replacementValue2) {
                target.removeAttribute(attributeRef.name);
              } else {
                target.setAttribute(attributeRef.name, replacementValue2);
              }
            });
            context2.meta.runtime.implicitLoop(forElt, function(target) {
              target.setAttribute(attributeRef.name, attributeRef.value || "");
            });
            return context2.meta.runtime.findNext(this, context2);
          }
        };
        return takeCmd2;
      }
    }
  });
  parser.addCommand("put", function(helper) {
    return PutCommand.parse(helper, parser);
  });
  function parsePseudopossessiveTarget(helper) {
    var targets;
    if (helper.matchToken("the") || helper.matchToken("element") || helper.matchToken("elements") || helper.currentToken().type === "CLASS_REF" || helper.currentToken().type === "ID_REF" || helper.currentToken().op && helper.currentToken().value === "<") {
      helper.possessivesDisabled = true;
      try {
        targets = helper.parseElement("expression");
      } finally {
        delete helper.possessivesDisabled;
      }
      if (helper.matchOpToken("'")) {
        helper.requireToken("s");
      }
    } else if (helper.currentToken().type === "IDENTIFIER" && helper.currentToken().value === "its") {
      var identifier = helper.matchToken("its");
      targets = {
        type: "pseudopossessiveIts",
        token: identifier,
        name: identifier.value,
        evaluate: function(context2) {
          return context2.meta.runtime.resolveSymbol("it", context2);
        }
      };
    } else {
      helper.matchToken("my") || helper.matchToken("me");
      targets = helper.parseElement("implicitMeTarget");
    }
    return targets;
  }
  parser.addCommand("transition", function(helper) {
    if (helper.matchToken("transition")) {
      var targetsExpr = parsePseudopossessiveTarget(helper);
      var properties = [];
      var from = [];
      var to = [];
      var currentToken = helper.currentToken();
      while (!helper.commandBoundary(currentToken) && currentToken.value !== "over" && currentToken.value !== "using") {
        if (helper.currentToken().type === "STYLE_REF") {
          let styleRef = helper.consumeToken();
          let styleProp = styleRef.value.substr(1);
          properties.push({
            type: "styleRefValue",
            evaluate: function() {
              return styleProp;
            }
          });
        } else {
          properties.push(helper.requireElement("stringLike"));
        }
        if (helper.matchToken("from")) {
          from.push(helper.requireElement("expression"));
        } else {
          from.push(null);
        }
        helper.requireToken("to");
        if (helper.matchToken("initial")) {
          to.push({
            type: "initial_literal",
            evaluate: function() {
              return "initial";
            }
          });
        } else {
          to.push(helper.requireElement("expression"));
        }
        currentToken = helper.currentToken();
      }
      if (helper.matchToken("over")) {
        var over = helper.requireElement("expression");
      } else if (helper.matchToken("using")) {
        var usingExpr = helper.requireElement("expression");
      }
      var transition = {
        to,
        args: [targetsExpr, properties, from, to, usingExpr, over],
        op: function(context2, targets, properties2, from2, to2, using, over2) {
          context2.meta.runtime.nullCheck(targets, targetsExpr);
          var promises = [];
          context2.meta.runtime.implicitLoop(targets, function(target) {
            var promise = new Promise(function(resolve, reject) {
              var initialTransition = target.style.transition;
              if (over2) {
                target.style.transition = "all " + over2 + "ms ease-in";
              } else if (using) {
                target.style.transition = using;
              } else {
                target.style.transition = config.defaultTransition;
              }
              var internalData = context2.meta.runtime.getInternalData(target);
              var computedStyles = getComputedStyle(target);
              var initialStyles = {};
              for (var i = 0; i < computedStyles.length; i++) {
                var name = computedStyles[i];
                var initialValue = computedStyles[name];
                initialStyles[name] = initialValue;
              }
              if (!internalData.initialStyles) {
                internalData.initialStyles = initialStyles;
              }
              for (var i = 0; i < properties2.length; i++) {
                var property = properties2[i];
                var fromVal = from2[i];
                if (fromVal === "computed" || fromVal == null) {
                  target.style[property] = initialStyles[property];
                } else {
                  target.style[property] = fromVal;
                }
              }
              var transitionStarted = false;
              var resolved = false;
              target.addEventListener(
                "transitionend",
                function() {
                  if (!resolved) {
                    target.style.transition = initialTransition;
                    resolved = true;
                    resolve();
                  }
                },
                { once: true }
              );
              target.addEventListener(
                "transitionstart",
                function() {
                  transitionStarted = true;
                },
                { once: true }
              );
              setTimeout(function() {
                if (!resolved && !transitionStarted) {
                  target.style.transition = initialTransition;
                  resolved = true;
                  resolve();
                }
              }, 100);
              setTimeout(function() {
                var autoProps = [];
                for (var i2 = 0; i2 < properties2.length; i2++) {
                  var property2 = properties2[i2];
                  var toVal = to2[i2];
                  if (toVal === "initial") {
                    var propertyValue = internalData.initialStyles[property2];
                    target.style[property2] = propertyValue;
                  } else {
                    target.style[property2] = toVal;
                  }
                }
              }, 0);
            });
            promises.push(promise);
          });
          return Promise.all(promises).then(function() {
            return context2.meta.runtime.findNext(transition, context2);
          });
        }
      };
      return transition;
    }
  });
  parser.addCommand("measure", function(helper) {
    if (!helper.matchToken("measure")) return;
    var targetExpr = parsePseudopossessiveTarget(helper);
    var propsToMeasure = [];
    if (!helper.commandBoundary(helper.currentToken()))
      do {
        propsToMeasure.push(helper.matchTokenType("IDENTIFIER").value);
      } while (helper.matchOpToken(","));
    return {
      properties: propsToMeasure,
      args: [targetExpr],
      op: function(ctx, target) {
        ctx.meta.runtime.nullCheck(target, targetExpr);
        if (0 in target) target = target[0];
        var rect = target.getBoundingClientRect();
        var scroll = {
          top: target.scrollTop,
          left: target.scrollLeft,
          topMax: target.scrollTopMax,
          leftMax: target.scrollLeftMax,
          height: target.scrollHeight,
          width: target.scrollWidth
        };
        ctx.result = {
          x: rect.x,
          y: rect.y,
          left: rect.left,
          top: rect.top,
          right: rect.right,
          bottom: rect.bottom,
          width: rect.width,
          height: rect.height,
          bounds: rect,
          scrollLeft: scroll.left,
          scrollTop: scroll.top,
          scrollLeftMax: scroll.leftMax,
          scrollTopMax: scroll.topMax,
          scrollWidth: scroll.width,
          scrollHeight: scroll.height,
          scroll
        };
        ctx.meta.runtime.forEach(propsToMeasure, function(prop) {
          if (prop in ctx.result) ctx.locals[prop] = ctx.result[prop];
          else throw "No such measurement as " + prop;
        });
        return ctx.meta.runtime.findNext(this, ctx);
      }
    };
  });
  parser.addLeafExpression("closestExpr", ClosestExpr.parse);
  parser.addCommand("go", function(helper) {
    if (helper.matchToken("go")) {
      if (helper.matchToken("back")) {
        var back = true;
      } else {
        helper.matchToken("to");
        if (helper.matchToken("url")) {
          var target = helper.requireElement("stringLike");
          var url = true;
          if (helper.matchToken("in")) {
            helper.requireToken("new");
            helper.requireToken("window");
            var newWindow = true;
          }
        } else {
          helper.matchToken("the");
          var verticalPosition = helper.matchAnyToken("top", "middle", "bottom");
          var horizontalPosition = helper.matchAnyToken("left", "center", "right");
          if (verticalPosition || horizontalPosition) {
            helper.requireToken("of");
          }
          var target = helper.requireElement("unaryExpression");
          var plusOrMinus = helper.matchAnyOpToken("+", "-");
          if (plusOrMinus) {
            helper.pushFollow("px");
            try {
              var offset = helper.requireElement("expression");
            } finally {
              helper.popFollow();
            }
          }
          helper.matchToken("px");
          var smoothness = helper.matchAnyToken("smoothly", "instantly");
          var scrollOptions = {
            block: "start",
            inline: "nearest"
          };
          if (verticalPosition) {
            if (verticalPosition.value === "top") {
              scrollOptions.block = "start";
            } else if (verticalPosition.value === "bottom") {
              scrollOptions.block = "end";
            } else if (verticalPosition.value === "middle") {
              scrollOptions.block = "center";
            }
          }
          if (horizontalPosition) {
            if (horizontalPosition.value === "left") {
              scrollOptions.inline = "start";
            } else if (horizontalPosition.value === "center") {
              scrollOptions.inline = "center";
            } else if (horizontalPosition.value === "right") {
              scrollOptions.inline = "end";
            }
          }
          if (smoothness) {
            if (smoothness.value === "smoothly") {
              scrollOptions.behavior = "smooth";
            } else if (smoothness.value === "instantly") {
              scrollOptions.behavior = "instant";
            }
          }
        }
      }
      var goCmd = {
        target,
        args: [target, offset],
        op: function(ctx, to, offset2) {
          if (back) {
            window.history.back();
          } else if (url) {
            if (to) {
              if (newWindow) {
                window.open(to);
              } else {
                window.location.href = to;
              }
            }
          } else {
            context.meta.runtime.implicitLoop(to, function(target2) {
              if (target2 === window) {
                target2 = document.body;
              }
              if (plusOrMinus) {
                let boundingRect = target2.getBoundingClientRect();
                let scrollShim = document.createElement("div");
                let actualOffset = plusOrMinus.value === "+" ? offset2 : offset2 * -1;
                let offsetX = scrollOptions.inline == "start" || scrollOptions.inline == "end" ? actualOffset : 0;
                let offsetY = scrollOptions.block == "start" || scrollOptions.block == "end" ? actualOffset : 0;
                scrollShim.style.position = "absolute";
                scrollShim.style.top = boundingRect.top + window.scrollY + offsetY + "px";
                scrollShim.style.left = boundingRect.left + window.scrollX + offsetX + "px";
                scrollShim.style.height = boundingRect.height + "px";
                scrollShim.style.width = boundingRect.width + "px";
                scrollShim.style.zIndex = "" + Number.MIN_SAFE_INTEGER;
                scrollShim.style.opacity = "0";
                document.body.appendChild(scrollShim);
                setTimeout(function() {
                  document.body.removeChild(scrollShim);
                }, 100);
                target2 = scrollShim;
              }
              target2.scrollIntoView(scrollOptions);
            });
          }
          return context.meta.runtime.findNext(goCmd, ctx);
        }
      };
      return goCmd;
    }
  });
  config.conversions.dynamicResolvers.push(function(str, node) {
    if (!(str === "Values" || str.indexOf("Values:") === 0)) {
      return;
    }
    var conversion = str.split(":")[1];
    var result = {};
    var implicitLoop = parser.runtime.implicitLoop.bind(parser.runtime);
    implicitLoop(node, function(node2) {
      var input = getInputInfo(node2);
      if (input !== void 0) {
        result[input.name] = input.value;
        return;
      }
      if (node2.querySelectorAll != void 0) {
        var children = node2.querySelectorAll("input,select,textarea");
        children.forEach(appendValue);
      }
    });
    if (conversion) {
      if (conversion === "JSON") {
        return JSON.stringify(result);
      } else if (conversion === "Form") {
        return new URLSearchParams(
          /** @type {Record<string, string>} */
          result
        ).toString();
      } else {
        throw "Unknown conversion: " + conversion;
      }
    } else {
      return result;
    }
    function appendValue(node2) {
      var info = getInputInfo(node2);
      if (info == void 0) {
        return;
      }
      if (result[info.name] == void 0) {
        result[info.name] = info.value;
        return;
      }
      if (Array.isArray(result[info.name]) && Array.isArray(info.value)) {
        result[info.name] = [].concat(result[info.name], info.value);
        return;
      }
    }
    function getInputInfo(node2) {
      try {
        var result2 = {
          name: node2.name,
          value: node2.value
        };
        if (result2.name == void 0 || result2.value == void 0) {
          return void 0;
        }
        if (node2.type == "radio" && node2.checked == false) {
          return void 0;
        }
        if (node2.type == "checkbox") {
          if (node2.checked == false) {
            result2.value = void 0;
          } else if (typeof result2.value === "string") {
            result2.value = [result2.value];
          }
        }
        if (node2.type == "select-multiple") {
          var selected = node2.querySelectorAll("option[selected]");
          result2.value = [];
          for (var index = 0; index < selected.length; index++) {
            result2.value.push(selected[index].value);
          }
        }
        return result2;
      } catch (e) {
        return void 0;
      }
    }
  });
  config.conversions["HTML"] = function(value) {
    var toHTML = (
      /** @returns {string}*/
      function(value2) {
        if (value2 instanceof Array) {
          return value2.map(function(item) {
            return toHTML(item);
          }).join("");
        }
        if (value2 instanceof HTMLElement) {
          return value2.outerHTML;
        }
        if (value2 instanceof NodeList) {
          var result = "";
          for (var i = 0; i < value2.length; i++) {
            var node = value2[i];
            if (node instanceof HTMLElement) {
              result += node.outerHTML;
            }
          }
          return result;
        }
        if (value2.toString) {
          return value2.toString();
        }
        return "";
      }
    );
    return toHTML(value);
  };
  config.conversions["Fragment"] = function(val) {
    var frag = document.createDocumentFragment();
    parser.runtime.implicitLoop(val, function(val2) {
      if (val2 instanceof Node) frag.append(val2);
      else {
        var temp = document.createElement("template");
        temp.innerHTML = val2;
        frag.append(temp.content);
      }
    });
    return frag;
  };
}

// src/_hyperscript.js
var globalScope = typeof self !== "undefined" ? self : typeof global !== "undefined" ? global : void 0;
function getCookiesAsArray2() {
  let cookiesAsArray = document.cookie.split("; ").map((cookieEntry) => {
    let strings = cookieEntry.split("=");
    return { name: strings[0], value: decodeURIComponent(strings[1]) };
  });
  return cookiesAsArray;
}
function clearCookie2(name) {
  document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
}
function clearAllCookies2() {
  for (const cookie of getCookiesAsArray2()) {
    clearCookie2(cookie.name);
  }
}
var CookieJar2 = new Proxy({}, {
  get(target, prop) {
    var _a;
    if (prop === "then" || prop === "asyncWrapper") {
      return null;
    } else if (prop === "length") {
      return getCookiesAsArray2().length;
    } else if (prop === "clear") {
      return clearCookie2;
    } else if (prop === "clearAll") {
      return clearAllCookies2;
    } else if (typeof prop === "string") {
      if (!isNaN(prop)) {
        return getCookiesAsArray2()[parseInt(prop)];
      } else {
        let value = (_a = document.cookie.split("; ").find((row) => row.startsWith(prop + "="))) == null ? void 0 : _a.split("=")[1];
        if (value) {
          return decodeURIComponent(value);
        }
      }
    } else if (prop === Symbol.iterator) {
      return getCookiesAsArray2()[prop];
    }
  },
  set(target, prop, value) {
    var finalValue = null;
    if ("string" === typeof value) {
      finalValue = encodeURIComponent(value);
      finalValue += ";samesite=lax";
    } else {
      finalValue = encodeURIComponent(value.value);
      if (value.expires) {
        finalValue += ";expires=" + value.maxAge;
      }
      if (value.maxAge) {
        finalValue += ";max-age=" + value.maxAge;
      }
      if (value.partitioned) {
        finalValue += ";partitioned=" + value.partitioned;
      }
      if (value.path) {
        finalValue += ";path=" + value.path;
      }
      if (value.samesite) {
        finalValue += ";samesite=" + value.path;
      }
      if (value.secure) {
        finalValue += ";secure=" + value.path;
      }
    }
    document.cookie = String(prop) + "=" + finalValue;
    return true;
  }
});
function parseJSON2(jString) {
  try {
    return JSON.parse(jString);
  } catch (error) {
    logError(error);
    return null;
  }
}
function logError(msg) {
  if (console.error) {
    console.error(msg);
  } else if (console.log) {
    console.log("ERROR: ", msg);
  }
}
var lexer_ = new Lexer();
var runtime_ = new Runtime(globalScope);
var parser_ = new Parser();
parser_.runtime = runtime_;
hyperscriptCoreGrammar(parser_);
hyperscriptWebGrammar(parser_);
Tokens._parserRaiseError = Parser.raiseParseError;
ElementCollection._runtime = runtime_;
var processNode;
var initElement;
function evaluate(src, ctx, args) {
  class HyperscriptModule extends EventTarget {
    constructor(mod) {
      super();
      this.module = mod;
    }
    toString() {
      return this.module.id;
    }
  }
  var body = "document" in globalScope ? globalScope.document.body : new HyperscriptModule(args && args.module);
  ctx = Object.assign(runtime_.makeContext(body, null, body, null), ctx || {});
  var element = parser_.parse(lexer_, src);
  if (element.execute) {
    element.execute(ctx);
    if (typeof ctx.meta.returnValue !== "undefined") {
      return ctx.meta.returnValue;
    } else {
      return ctx.result;
    }
  } else if (element.apply) {
    element.apply(body, body, args, runtime_);
    return runtime_.getHyperscriptFeatures(body);
  } else {
    return element.evaluate(ctx);
  }
}
initElement = function(elt, target) {
  if (elt.closest && elt.closest(config.disableSelector)) {
    return;
  }
  var internalData = runtime_.getInternalData(elt);
  if (!internalData.initialized) {
    var src = runtime_.getScript(elt);
    if (src) {
      try {
        internalData.initialized = true;
        internalData.script = src;
        var tokens = lexer_.tokenize(src);
        var hyperScript = parser_.parseHyperScript(tokens);
        if (!hyperScript) return;
        hyperScript.apply(target || elt, elt, null, runtime_);
        setTimeout(() => {
          runtime_.triggerEvent(target || elt, "load", {
            hyperscript: true
          });
        }, 1);
      } catch (e) {
        runtime_.triggerEvent(elt, "exception", {
          error: e
        });
        console.error(
          "hyperscript errors were found on the following element:",
          elt,
          "\n\n",
          e.message,
          e.stack
        );
      }
    }
  }
};
processNode = function(elt) {
  var selector = runtime_.getScriptSelector();
  if (runtime_.matchesSelector(elt, selector)) {
    initElement(elt, elt);
  }
  if (elt instanceof HTMLScriptElement && elt.type === "text/hyperscript") {
    initElement(elt, document.body);
  }
  if (elt.querySelectorAll) {
    runtime_.forEach(elt.querySelectorAll(selector + ", [type='text/hyperscript']"), (elt2) => {
      initElement(elt2, elt2 instanceof HTMLScriptElement && elt2.type === "text/hyperscript" ? document.body : elt2);
    });
  }
};
runtime_.processNode = processNode;
function run(src, ctx) {
  return evaluate(src, ctx);
}
function browserInit() {
  var scripts = Array.from(globalScope.document.querySelectorAll("script[type='text/hyperscript'][src]"));
  Promise.all(
    scripts.map(function(script) {
      return fetch(script.src).then(function(res) {
        return res.text();
      });
    })
  ).then((script_values) => script_values.forEach((sc) => _hyperscript(sc))).then(() => ready(function() {
    mergeMetaConfig();
    processNode(document.documentElement);
    document.dispatchEvent(new Event("hyperscript:ready"));
    globalScope.document.addEventListener("htmx:load", function(evt) {
      processNode(evt.detail.elt);
    });
  }));
  function ready(fn) {
    if (document.readyState !== "loading") {
      setTimeout(fn);
    } else {
      document.addEventListener("DOMContentLoaded", fn);
    }
  }
  function getMetaConfig() {
    var element = document.querySelector('meta[name="htmx-config"]');
    if (element) {
      return parseJSON2(element.content);
    } else {
      return null;
    }
  }
  function mergeMetaConfig() {
    var metaConfig = getMetaConfig();
    if (metaConfig) {
      Object.assign(config, metaConfig);
    }
  }
}
var _hyperscript = Object.assign(
  run,
  {
    config,
    use(plugin) {
      plugin(_hyperscript);
    },
    internals: {
      lexer: lexer_,
      parser: parser_,
      runtime: runtime_,
      Lexer,
      Tokens,
      Parser,
      Runtime
    },
    ElementCollection,
    addFeature: parser_.addFeature.bind(parser_),
    addCommand: parser_.addCommand.bind(parser_),
    addLeafExpression: parser_.addLeafExpression.bind(parser_),
    addIndirectExpression: parser_.addIndirectExpression.bind(parser_),
    evaluate,
    parse: (src) => parser_.parse(lexer_, src),
    process: processNode,
    processNode,
    version: "0.9.14",
    browserInit
  }
);
var hyperscript_default = _hyperscript;

// src/browser.js
if (typeof document !== "undefined") {
  hyperscript_default.browserInit();
}
var browser_default = hyperscript_default;
if (typeof self !== "undefined") {
  self._hyperscript = hyperscript_default;
}
export {
  hyperscript_default as _hyperscript,
  browser_default as default
};
//# sourceMappingURL=_hyperscript.js.map
