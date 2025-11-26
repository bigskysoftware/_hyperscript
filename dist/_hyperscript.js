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
   * @param {string} op1
   * @param {string} [op2]
   * @param {string} [op3]
   * @returns {Token | void}
   */
  matchAnyOpToken(op1, op2, op3) {
    for (var i = 0; i < arguments.length; i++) {
      var opToken = arguments[i];
      var match = this.matchOpToken(opToken);
      if (match) {
        return match;
      }
    }
  }
  /**
   * @param {string} op1
   * @param {string} [op2]
   * @param {string} [op3]
   * @returns {Token | void}
   */
  matchAnyToken(op1, op2, op3) {
    for (var i = 0; i < arguments.length; i++) {
      var opToken = arguments[i];
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
var Tokens2 = _Tokens;

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
    return new Tokens2(tokens, [], source);
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
      throw new Error(Tokens2.sourceFor.call(elt) + " returned a Promise in a context that they are not allowed.");
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
      console.log("///_ BEEP! The expression (" + Tokens2.sourceFor.call(expression).replace("beep! ", "") + ") evaluates to:", logValue, "of type " + typeName);
    }
  }
};
__publicField(_Runtime, "HALT", {});
var Runtime = _Runtime;

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
    this.addGrammarElement("feature", function(parser, tokens) {
      if (tokens.matchOpToken("(")) {
        var featureElement = parser.requireElement("feature", tokens);
        tokens.requireOpToken(")");
        return featureElement;
      }
      var featureDefinition = parser.FEATURES[tokens.currentToken().value || ""];
      if (featureDefinition) {
        return featureDefinition(parser, tokens);
      }
    });
    this.addGrammarElement("command", function(parser, tokens) {
      if (tokens.matchOpToken("(")) {
        const commandElement2 = parser.requireElement("command", tokens);
        tokens.requireOpToken(")");
        return commandElement2;
      }
      var commandDefinition = parser.COMMANDS[tokens.currentToken().value || ""];
      let commandElement;
      if (commandDefinition) {
        commandElement = commandDefinition(parser, tokens);
      } else if (tokens.currentToken().type === "IDENTIFIER") {
        commandElement = parser.parseElement("pseudoCommand", tokens);
      }
      if (commandElement) {
        return parser.parseElement("indirectStatement", tokens, commandElement);
      }
      return commandElement;
    });
    this.addGrammarElement("commandList", function(parser, tokens) {
      if (tokens.hasMore()) {
        var cmd = parser.parseElement("command", tokens);
        if (cmd) {
          tokens.matchToken("then");
          const next = parser.parseElement("commandList", tokens);
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
    this.addGrammarElement("leaf", function(parser, tokens) {
      var result = parser.parseAnyOf(parser.LEAF_EXPRESSIONS, tokens);
      if (result == null) {
        return parser.parseElement("symbol", tokens);
      }
      return result;
    });
    this.addGrammarElement("indirectExpression", function(parser, tokens, root) {
      for (var i = 0; i < parser.INDIRECT_EXPRESSIONS.length; i++) {
        var indirect = parser.INDIRECT_EXPRESSIONS[i];
        root.endToken = tokens.lastMatch();
        var result = parser.parseElement(indirect, tokens, root);
        if (result) {
          return result;
        }
      }
      return root;
    });
    this.addGrammarElement("indirectStatement", function(parser, tokens, root) {
      if (tokens.matchToken("unless")) {
        root.endToken = tokens.lastMatch();
        var conditional = parser.requireElement("expression", tokens);
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
    this.addGrammarElement("primaryExpression", function(parser, tokens) {
      var leaf = parser.parseElement("leaf", tokens);
      if (leaf) {
        return parser.parseElement("indirectExpression", tokens, leaf);
      }
      parser.raiseParseError(tokens, "Unexpected value: " + tokens.currentToken().value);
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
    parseElement.sourceFor = Tokens2.sourceFor;
    parseElement.lineFor = Tokens2.lineFor;
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
      var parseElement = elementDefinition(this, tokens, root);
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
    var commandDefinitionWrapper = function(parser, tokens) {
      const commandElement = definition(parser, tokens);
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
    var featureDefinitionWrapper = function(parser, tokens) {
      var featureElement = definition(parser, tokens);
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

// src/grammars/core.js
function hyperscriptCoreGrammar(parser) {
  parser.addLeafExpression("parenthesized", function(parser2, tokens) {
    if (tokens.matchOpToken("(")) {
      var follows = tokens.clearFollows();
      try {
        var expr = parser2.requireElement("expression", tokens);
      } finally {
        tokens.restoreFollows(follows);
      }
      tokens.requireOpToken(")");
      return expr;
    }
  });
  parser.addLeafExpression("string", function(parser2, tokens) {
    var stringToken = tokens.matchTokenType("STRING");
    if (!stringToken) return;
    var rawValue = (
      /** @type {string} */
      stringToken.value
    );
    var args;
    if (stringToken.template) {
      var innerTokens = Lexer.tokenize(rawValue, true);
      args = parser2.parseStringTemplate(innerTokens);
    } else {
      args = [];
    }
    return {
      type: "string",
      token: stringToken,
      args,
      op: function(context2) {
        var returnStr = "";
        for (var i = 1; i < arguments.length; i++) {
          var val = arguments[i];
          if (val !== void 0) {
            returnStr += val;
          }
        }
        return returnStr;
      },
      evaluate: function(context2) {
        if (args.length === 0) {
          return rawValue;
        } else {
          return context2.meta.runtime.unifiedEval(this, context2);
        }
      }
    };
  });
  parser.addGrammarElement("nakedString", function(parser2, tokens) {
    if (tokens.hasMore()) {
      var tokenArr = tokens.consumeUntilWhitespace();
      tokens.matchTokenType("WHITESPACE");
      return {
        type: "nakedString",
        tokens: tokenArr,
        evaluate: function(context2) {
          return tokenArr.map(function(t) {
            return t.value;
          }).join("");
        }
      };
    }
  });
  parser.addLeafExpression("number", function(parser2, tokens) {
    var number = tokens.matchTokenType("NUMBER");
    if (!number) return;
    var numberToken = number;
    var value = parseFloat(
      /** @type {string} */
      number.value
    );
    return {
      type: "number",
      value,
      numberToken,
      evaluate: function() {
        return value;
      }
    };
  });
  parser.addLeafExpression("idRef", function(parser2, tokens) {
    var elementId = tokens.matchTokenType("ID_REF");
    if (!elementId) return;
    if (!elementId.value) return;
    if (elementId.template) {
      var templateValue = elementId.value.substring(2);
      var innerTokens = Lexer.tokenize(templateValue);
      var innerExpression = parser2.requireElement("expression", innerTokens);
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
  });
  parser.addLeafExpression("classRef", function(parser2, tokens) {
    var classRef = tokens.matchTokenType("CLASS_REF");
    if (!classRef) return;
    if (!classRef.value) return;
    if (classRef.template) {
      var templateValue = classRef.value.substring(2);
      var innerTokens = Lexer.tokenize(templateValue);
      var innerExpression = parser2.requireElement("expression", innerTokens);
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
      return {
        type: "classRef",
        css,
        evaluate: function(context2) {
          return new ElementCollection(css, context2.me, true);
        }
      };
    }
  });
  parser.addLeafExpression("queryRef", function(parser2, tokens) {
    var queryStart = tokens.matchOpToken("<");
    if (!queryStart) return;
    var queryTokens = tokens.consumeUntil("/");
    tokens.requireOpToken("/");
    tokens.requireOpToken(">");
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
      innerTokens = Lexer.tokenize(queryValue, true);
      args = parser2.parseStringTemplate(innerTokens);
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
  });
  parser.addLeafExpression("attributeRef", function(parser2, tokens) {
    var attributeRef = tokens.matchTokenType("ATTRIBUTE_REF");
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
  });
  parser.addLeafExpression("styleRef", function(parser2, tokens) {
    var styleRef = tokens.matchTokenType("STYLE_REF");
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
  });
  parser.addGrammarElement("objectKey", function(parser2, tokens) {
    var token;
    if (token = tokens.matchTokenType("STRING")) {
      return {
        type: "objectKey",
        key: token.value,
        evaluate: function() {
          return token.value;
        }
      };
    } else if (tokens.matchOpToken("[")) {
      var expr = parser2.parseElement("expression", tokens);
      tokens.requireOpToken("]");
      return {
        type: "objectKey",
        expr,
        args: [expr],
        op: function(ctx, expr2) {
          return expr2;
        },
        evaluate: function(context2) {
          return context2.meta.runtime.unifiedEval(this, context2);
        }
      };
    } else {
      var key = "";
      do {
        token = tokens.matchTokenType("IDENTIFIER") || tokens.matchOpToken("-");
        if (token) key += token.value;
      } while (token);
      return {
        type: "objectKey",
        key,
        evaluate: function() {
          return key;
        }
      };
    }
  });
  parser.addLeafExpression("objectLiteral", function(parser2, tokens) {
    if (!tokens.matchOpToken("{")) return;
    var keyExpressions = [];
    var valueExpressions = [];
    if (!tokens.matchOpToken("}")) {
      do {
        var name = parser2.requireElement("objectKey", tokens);
        tokens.requireOpToken(":");
        var value = parser2.requireElement("expression", tokens);
        valueExpressions.push(value);
        keyExpressions.push(name);
      } while (tokens.matchOpToken(",") && !tokens.peekToken("}", 0, "R_BRACE"));
      tokens.requireOpToken("}");
    }
    return {
      type: "objectLiteral",
      args: [keyExpressions, valueExpressions],
      op: function(context2, keys, values) {
        var returnVal = {};
        for (var i = 0; i < keys.length; i++) {
          returnVal[keys[i]] = values[i];
        }
        return returnVal;
      },
      evaluate: function(context2) {
        return context2.meta.runtime.unifiedEval(this, context2);
      }
    };
  });
  parser.addGrammarElement("nakedNamedArgumentList", function(parser2, tokens) {
    var fields = [];
    var valueExpressions = [];
    if (tokens.currentToken().type === "IDENTIFIER") {
      do {
        var name = tokens.requireTokenType("IDENTIFIER");
        tokens.requireOpToken(":");
        var value = parser2.requireElement("expression", tokens);
        valueExpressions.push(value);
        fields.push({ name, value });
      } while (tokens.matchOpToken(","));
    }
    return {
      type: "namedArgumentList",
      fields,
      args: [valueExpressions],
      op: function(context2, values) {
        var returnVal = { _namedArgList_: true };
        for (var i = 0; i < values.length; i++) {
          var field = fields[i];
          returnVal[field.name.value] = values[i];
        }
        return returnVal;
      },
      evaluate: function(context2) {
        return context2.meta.runtime.unifiedEval(this, context2);
      }
    };
  });
  parser.addGrammarElement("namedArgumentList", function(parser2, tokens) {
    if (!tokens.matchOpToken("(")) return;
    var elt = parser2.requireElement("nakedNamedArgumentList", tokens);
    tokens.requireOpToken(")");
    return elt;
  });
  parser.addGrammarElement("symbol", function(parser2, tokens) {
    var scope = "default";
    if (tokens.matchToken("global")) {
      scope = "global";
    } else if (tokens.matchToken("element") || tokens.matchToken("module")) {
      scope = "element";
      if (tokens.matchOpToken("'")) {
        tokens.requireToken("s");
      }
    } else if (tokens.matchToken("local")) {
      scope = "local";
    }
    let eltPrefix = tokens.matchOpToken(":");
    let identifier = tokens.matchTokenType("IDENTIFIER");
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
      return {
        type: "symbol",
        token: identifier,
        scope,
        name,
        evaluate: function(context2) {
          return context2.meta.runtime.resolveSymbol(name, context2, scope);
        }
      };
    }
  });
  parser.addGrammarElement("implicitMeTarget", function(parser2, tokens) {
    return {
      type: "implicitMeTarget",
      evaluate: function(context2) {
        return context2.you || context2.me;
      }
    };
  });
  parser.addLeafExpression("boolean", function(parser2, tokens) {
    var booleanLiteral = tokens.matchToken("true") || tokens.matchToken("false");
    if (!booleanLiteral) return;
    const value = booleanLiteral.value === "true";
    return {
      type: "boolean",
      evaluate: function(context2) {
        return value;
      }
    };
  });
  parser.addLeafExpression("null", function(parser2, tokens) {
    if (tokens.matchToken("null")) {
      return {
        type: "null",
        evaluate: function(context2) {
          return null;
        }
      };
    }
  });
  parser.addLeafExpression("arrayLiteral", function(parser2, tokens) {
    if (!tokens.matchOpToken("[")) return;
    var values = [];
    if (!tokens.matchOpToken("]")) {
      do {
        var expr = parser2.requireElement("expression", tokens);
        values.push(expr);
      } while (tokens.matchOpToken(","));
      tokens.requireOpToken("]");
    }
    return {
      type: "arrayLiteral",
      values,
      args: [values],
      op: function(context2, values2) {
        return values2;
      },
      evaluate: function(context2) {
        return context2.meta.runtime.unifiedEval(this, context2);
      }
    };
  });
  parser.addLeafExpression("blockLiteral", function(parser2, tokens) {
    if (!tokens.matchOpToken("\\")) return;
    var args = [];
    var arg1 = tokens.matchTokenType("IDENTIFIER");
    if (arg1) {
      args.push(arg1);
      while (tokens.matchOpToken(",")) {
        args.push(tokens.requireTokenType("IDENTIFIER"));
      }
    }
    tokens.requireOpToken("-");
    tokens.requireOpToken(">");
    var expr = parser2.requireElement("expression", tokens);
    return {
      type: "blockLiteral",
      args,
      expr,
      evaluate: function(ctx) {
        var returnFunc = function() {
          for (var i = 0; i < args.length; i++) {
            ctx.locals[args[i].value] = arguments[i];
          }
          return expr.evaluate(ctx);
        };
        return returnFunc;
      }
    };
  });
  parser.addIndirectExpression("propertyAccess", function(parser2, tokens, root) {
    if (!tokens.matchOpToken(".")) return;
    var prop = tokens.requireTokenType("IDENTIFIER");
    var propertyAccess = {
      type: "propertyAccess",
      root,
      prop,
      args: [root],
      op: function(context2, rootVal) {
        var value = context2.meta.runtime.resolveProperty(rootVal, prop.value);
        return value;
      },
      evaluate: function(context2) {
        return context2.meta.runtime.unifiedEval(this, context2);
      }
    };
    return parser2.parseElement("indirectExpression", tokens, propertyAccess);
  });
  parser.addIndirectExpression("of", function(parser2, tokens, root) {
    if (!tokens.matchToken("of")) return;
    var newRoot = parser2.requireElement("unaryExpression", tokens);
    var childOfUrRoot = null;
    var urRoot = root;
    while (urRoot.root) {
      childOfUrRoot = urRoot;
      urRoot = urRoot.root;
    }
    if (urRoot.type !== "symbol" && urRoot.type !== "attributeRef" && urRoot.type !== "styleRef" && urRoot.type !== "computedStyleRef") {
      parser2.raiseParseError(tokens, "Cannot take a property of a non-symbol: " + urRoot.type);
    }
    var attribute = urRoot.type === "attributeRef";
    var style = urRoot.type === "styleRef" || urRoot.type === "computedStyleRef";
    if (attribute || style) {
      var attributeElt = urRoot;
    }
    var prop = urRoot.name;
    var propertyAccess = {
      type: "ofExpression",
      prop: urRoot.token,
      root: newRoot,
      attribute: attributeElt,
      expression: root,
      args: [newRoot],
      op: function(context2, rootVal) {
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
      },
      evaluate: function(context2) {
        return context2.meta.runtime.unifiedEval(this, context2);
      }
    };
    if (urRoot.type === "attributeRef") {
      propertyAccess.attribute = urRoot;
    }
    if (childOfUrRoot) {
      childOfUrRoot.root = propertyAccess;
      childOfUrRoot.args = [propertyAccess];
    } else {
      root = propertyAccess;
    }
    return parser2.parseElement("indirectExpression", tokens, root);
  });
  parser.addIndirectExpression("possessive", function(parser2, tokens, root) {
    if (parser2.possessivesDisabled) {
      return;
    }
    var apostrophe = tokens.matchOpToken("'");
    if (apostrophe || root.type === "symbol" && (root.name === "my" || root.name === "its" || root.name === "your") && (tokens.currentToken().type === "IDENTIFIER" || tokens.currentToken().type === "ATTRIBUTE_REF" || tokens.currentToken().type === "STYLE_REF")) {
      if (apostrophe) {
        tokens.requireToken("s");
      }
      var attribute, style, prop;
      attribute = parser2.parseElement("attributeRef", tokens);
      if (attribute == null) {
        style = parser2.parseElement("styleRef", tokens);
        if (style == null) {
          prop = tokens.requireTokenType("IDENTIFIER");
        }
      }
      var propertyAccess = {
        type: "possessive",
        root,
        attribute: attribute || style,
        prop,
        args: [root],
        op: function(context2, rootVal) {
          if (attribute) {
            var value = context2.meta.runtime.resolveAttribute(rootVal, attribute.name);
          } else if (style) {
            var value;
            if (style.type === "computedStyleRef") {
              value = context2.meta.runtime.resolveComputedStyle(rootVal, style["name"]);
            } else {
              value = context2.meta.runtime.resolveStyle(rootVal, style["name"]);
            }
          } else {
            var value = context2.meta.runtime.resolveProperty(rootVal, prop.value);
          }
          return value;
        },
        evaluate: function(context2) {
          return context2.meta.runtime.unifiedEval(this, context2);
        }
      };
      return parser2.parseElement("indirectExpression", tokens, propertyAccess);
    }
  });
  parser.addIndirectExpression("inExpression", function(parser2, tokens, root) {
    if (!tokens.matchToken("in")) return;
    var target = parser2.requireElement("unaryExpression", tokens);
    var propertyAccess = {
      type: "inExpression",
      root,
      args: [root, target],
      op: function(context2, rootVal, target2) {
        var returnArr = [];
        if (rootVal.css) {
          context2.meta.runtime.implicitLoop(target2, function(targetElt) {
            var results = targetElt.querySelectorAll(rootVal.css);
            for (var i = 0; i < results.length; i++) {
              returnArr.push(results[i]);
            }
          });
        } else if (rootVal instanceof Element) {
          var within = false;
          context2.meta.runtime.implicitLoop(target2, function(targetElt) {
            if (targetElt.contains(rootVal)) {
              within = true;
            }
          });
          if (within) {
            return rootVal;
          }
        } else {
          context2.meta.runtime.implicitLoop(rootVal, function(rootElt) {
            context2.meta.runtime.implicitLoop(target2, function(targetElt) {
              if (rootElt === targetElt) {
                returnArr.push(rootElt);
              }
            });
          });
        }
        return returnArr;
      },
      evaluate: function(context2) {
        return context2.meta.runtime.unifiedEval(this, context2);
      }
    };
    return parser2.parseElement("indirectExpression", tokens, propertyAccess);
  });
  parser.addIndirectExpression("asExpression", function(parser2, tokens, root) {
    if (!tokens.matchToken("as")) return;
    tokens.matchToken("a") || tokens.matchToken("an");
    var conversion = parser2.requireElement("dotOrColonPath", tokens).evaluate();
    var propertyAccess = {
      type: "asExpression",
      root,
      args: [root],
      op: function(context2, rootVal) {
        return context2.meta.runtime.convertValue(rootVal, conversion);
      },
      evaluate: function(context2) {
        return context2.meta.runtime.unifiedEval(this, context2);
      }
    };
    return parser2.parseElement("indirectExpression", tokens, propertyAccess);
  });
  parser.addIndirectExpression("functionCall", function(parser2, tokens, root) {
    if (!tokens.matchOpToken("(")) return;
    var args = [];
    if (!tokens.matchOpToken(")")) {
      do {
        args.push(parser2.requireElement("expression", tokens));
      } while (tokens.matchOpToken(","));
      tokens.requireOpToken(")");
    }
    if (root.root) {
      var functionCall = {
        type: "functionCall",
        root,
        argExressions: args,
        args: [root.root, args],
        op: function(context2, rootRoot, args2) {
          context2.meta.runtime.nullCheck(rootRoot, root.root);
          var func = rootRoot[root.prop.value];
          context2.meta.runtime.nullCheck(func, root);
          if (func.hyperfunc) {
            args2.push(context2);
          }
          return func.apply(rootRoot, args2);
        },
        evaluate: function(context2) {
          return context2.meta.runtime.unifiedEval(this, context2);
        }
      };
    } else {
      var functionCall = {
        type: "functionCall",
        root,
        argExressions: args,
        args: [root, args],
        op: function(context2, func, argVals) {
          context2.meta.runtime.nullCheck(func, root);
          if (func.hyperfunc) {
            argVals.push(context2);
          }
          var apply = func.apply(null, argVals);
          return apply;
        },
        evaluate: function(context2) {
          return context2.meta.runtime.unifiedEval(this, context2);
        }
      };
    }
    return parser2.parseElement("indirectExpression", tokens, functionCall);
  });
  parser.addIndirectExpression("attributeRefAccess", function(parser2, tokens, root) {
    var attribute = parser2.parseElement("attributeRef", tokens);
    if (!attribute) return;
    var attributeAccess = {
      type: "attributeRefAccess",
      root,
      attribute,
      args: [root],
      op: function(_ctx, rootVal) {
        var value = _ctx.meta.runtime.resolveAttribute(rootVal, attribute.name);
        return value;
      },
      evaluate: function(context2) {
        return context2.meta.runtime.unifiedEval(this, context2);
      }
    };
    return attributeAccess;
  });
  parser.addIndirectExpression("arrayIndex", function(parser2, tokens, root) {
    if (!tokens.matchOpToken("[")) return;
    var andBefore = false;
    var andAfter = false;
    var firstIndex = null;
    var secondIndex = null;
    if (tokens.matchOpToken("..")) {
      andBefore = true;
      firstIndex = parser2.requireElement("expression", tokens);
    } else {
      firstIndex = parser2.requireElement("expression", tokens);
      if (tokens.matchOpToken("..")) {
        andAfter = true;
        var current = tokens.currentToken();
        if (current.type !== "R_BRACKET") {
          secondIndex = parser2.parseElement("expression", tokens);
        }
      }
    }
    tokens.requireOpToken("]");
    var arrayIndex = {
      type: "arrayIndex",
      root,
      prop: firstIndex,
      firstIndex,
      secondIndex,
      args: [root, firstIndex, secondIndex],
      op: function(_ctx, root2, firstIndex2, secondIndex2) {
        if (root2 == null) {
          return null;
        }
        if (andBefore) {
          if (firstIndex2 < 0) {
            firstIndex2 = root2.length + firstIndex2;
          }
          return root2.slice(0, firstIndex2 + 1);
        } else if (andAfter) {
          if (secondIndex2 != null) {
            if (secondIndex2 < 0) {
              secondIndex2 = root2.length + secondIndex2;
            }
            return root2.slice(firstIndex2, secondIndex2 + 1);
          } else {
            return root2.slice(firstIndex2);
          }
        } else {
          return root2[firstIndex2];
        }
      },
      evaluate: function(context2) {
        return context2.meta.runtime.unifiedEval(this, context2);
      }
    };
    return parser2.parseElement("indirectExpression", tokens, arrayIndex);
  });
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
  parser.addGrammarElement("postfixExpression", function(parser2, tokens) {
    var root = parser2.parseElement("negativeNumber", tokens);
    let stringPosfix = tokens.matchAnyToken.apply(tokens, STRING_POSTFIXES) || tokens.matchOpToken("%");
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
    if (tokens.matchToken("s") || tokens.matchToken("seconds")) {
      timeFactor = 1e3;
    } else if (tokens.matchToken("ms") || tokens.matchToken("milliseconds")) {
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
    if (tokens.matchOpToken(":")) {
      var typeName = tokens.requireTokenType("IDENTIFIER");
      if (!typeName.value) return;
      var nullOk = !tokens.matchOpToken("!");
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
  parser.addGrammarElement("logicalNot", function(parser2, tokens) {
    if (!tokens.matchToken("not")) return;
    var root = parser2.requireElement("unaryExpression", tokens);
    return {
      type: "logicalNot",
      root,
      args: [root],
      op: function(context2, val) {
        return !val;
      },
      evaluate: function(context2) {
        return context2.meta.runtime.unifiedEval(this, context2);
      }
    };
  });
  parser.addGrammarElement("noExpression", function(parser2, tokens) {
    if (!tokens.matchToken("no")) return;
    var root = parser2.requireElement("unaryExpression", tokens);
    return {
      type: "noExpression",
      root,
      args: [root],
      op: function(context2, val) {
        return context2.meta.runtime.isEmpty(val);
      },
      evaluate: function(context2) {
        return context2.meta.runtime.unifiedEval(this, context2);
      }
    };
  });
  parser.addLeafExpression("some", function(parser2, tokens) {
    if (!tokens.matchToken("some")) return;
    var root = parser2.requireElement("expression", tokens);
    return {
      type: "noExpression",
      root,
      args: [root],
      op: function(context2, val) {
        return !context2.meta.runtime.isEmpty(val);
      },
      evaluate(context2) {
        return context2.meta.runtime.unifiedEval(this, context2);
      }
    };
  });
  parser.addGrammarElement("negativeNumber", function(parser2, tokens) {
    if (tokens.matchOpToken("-")) {
      var root = parser2.requireElement("negativeNumber", tokens);
      return {
        type: "negativeNumber",
        root,
        args: [root],
        op: function(context2, value) {
          return -1 * value;
        },
        evaluate: function(context2) {
          return context2.meta.runtime.unifiedEval(this, context2);
        }
      };
    } else {
      return parser2.requireElement("primaryExpression", tokens);
    }
  });
  parser.addGrammarElement("unaryExpression", function(parser2, tokens) {
    tokens.matchToken("the");
    return parser2.parseAnyOf(
      ["beepExpression", "logicalNot", "relativePositionalExpression", "positionalExpression", "noExpression", "postfixExpression"],
      tokens
    );
  });
  parser.addGrammarElement("beepExpression", function(parser2, tokens) {
    if (!tokens.matchToken("beep!")) return;
    var expression = parser2.parseElement("unaryExpression", tokens);
    if (expression) {
      expression["booped"] = true;
      var originalEvaluate = expression.evaluate;
      expression.evaluate = function(ctx) {
        let value = originalEvaluate.apply(expression, arguments);
        let element = ctx.me;
        ctx.meta.runtime.beepValueToConsole(element, expression, value);
        return value;
      };
      return expression;
    }
  });
  var scanForwardQuery = function(start, root, match, wrap) {
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
  };
  var scanBackwardsQuery = function(start, root, match, wrap) {
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
  };
  var scanForwardArray = function(start, array, match, wrap) {
    var matches = [];
    for (elt of array) {
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
  };
  var scanBackwardsArray = function(start, array, match, wrap) {
    return scanForwardArray(start, Array.from(array).reverse(), match, wrap);
  };
  parser.addGrammarElement("relativePositionalExpression", function(parser2, tokens) {
    var op = tokens.matchAnyToken("next", "previous");
    if (!op) return;
    var forwardSearch = op.value === "next";
    var thingElt = parser2.parseElement("expression", tokens);
    if (tokens.matchToken("from")) {
      tokens.pushFollow("in");
      try {
        var from = parser2.requireElement("unaryExpression", tokens);
      } finally {
        tokens.popFollow();
      }
    } else {
      var from = parser2.requireElement("implicitMeTarget", tokens);
    }
    var inSearch = false;
    var withinElt;
    if (tokens.matchToken("in")) {
      inSearch = true;
      var inElt = parser2.requireElement("unaryExpression", tokens);
    } else if (tokens.matchToken("within")) {
      withinElt = parser2.requireElement("unaryExpression", tokens);
    } else {
      withinElt = document.body;
    }
    var wrapping = false;
    if (tokens.matchToken("with")) {
      tokens.requireToken("wrapping");
      wrapping = true;
    }
    return {
      type: "relativePositionalExpression",
      from,
      forwardSearch,
      inSearch,
      wrapping,
      inElt,
      withinElt,
      operator: op.value,
      args: [thingElt, from, inElt, withinElt],
      op: function(context2, thing, from2, inElt2, withinElt2) {
        var css = thing.css;
        if (css == null) {
          throw "Expected a CSS value to be returned by " + Tokens.sourceFor.apply(thingElt);
        }
        if (inSearch) {
          if (inElt2) {
            if (forwardSearch) {
              return scanForwardArray(from2, inElt2, css, wrapping);
            } else {
              return scanBackwardsArray(from2, inElt2, css, wrapping);
            }
          }
        } else {
          if (withinElt2) {
            if (forwardSearch) {
              return scanForwardQuery(from2, withinElt2, css, wrapping);
            } else {
              return scanBackwardsQuery(from2, withinElt2, css, wrapping);
            }
          }
        }
      },
      evaluate: function(context2) {
        return context2.meta.runtime.unifiedEval(this, context2);
      }
    };
  });
  parser.addGrammarElement("positionalExpression", function(parser2, tokens) {
    var op = tokens.matchAnyToken("first", "last", "random");
    if (!op) return;
    tokens.matchAnyToken("in", "from", "of");
    var rhs = parser2.requireElement("unaryExpression", tokens);
    const operator = op.value;
    return {
      type: "positionalExpression",
      rhs,
      operator: op.value,
      args: [rhs],
      op: function(context2, rhsVal) {
        if (rhsVal && !Array.isArray(rhsVal)) {
          if (rhsVal.children) {
            rhsVal = rhsVal.children;
          } else {
            rhsVal = Array.from(rhsVal);
          }
        }
        if (rhsVal) {
          if (operator === "first") {
            return rhsVal[0];
          } else if (operator === "last") {
            return rhsVal[rhsVal.length - 1];
          } else if (operator === "random") {
            return rhsVal[Math.floor(Math.random() * rhsVal.length)];
          }
        }
      },
      evaluate: function(context2) {
        return context2.meta.runtime.unifiedEval(this, context2);
      }
    };
  });
  parser.addGrammarElement("mathOperator", function(parser2, tokens) {
    var expr = parser2.parseElement("unaryExpression", tokens);
    var mathOp, initialMathOp = null;
    mathOp = tokens.matchAnyOpToken("+", "-", "*", "/") || tokens.matchToken("mod");
    while (mathOp) {
      initialMathOp = initialMathOp || mathOp;
      var operator = mathOp.value;
      if (initialMathOp.value !== operator) {
        parser2.raiseParseError(tokens, "You must parenthesize math operations with different operators");
      }
      var rhs = parser2.parseElement("unaryExpression", tokens);
      expr = {
        type: "mathOperator",
        lhs: expr,
        rhs,
        operator,
        args: [expr, rhs],
        op: function(context2, lhsVal, rhsVal) {
          if (operator === "+") {
            return lhsVal + rhsVal;
          } else if (operator === "-") {
            return lhsVal - rhsVal;
          } else if (operator === "*") {
            return lhsVal * rhsVal;
          } else if (operator === "/") {
            return lhsVal / rhsVal;
          } else if (operator === "mod") {
            return lhsVal % rhsVal;
          }
        },
        evaluate: function(context2) {
          return context2.meta.runtime.unifiedEval(this, context2);
        }
      };
      mathOp = tokens.matchAnyOpToken("+", "-", "*", "/") || tokens.matchToken("mod");
    }
    return expr;
  });
  parser.addGrammarElement("mathExpression", function(parser2, tokens) {
    return parser2.parseAnyOf(["mathOperator", "unaryExpression"], tokens);
  });
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
  parser.addGrammarElement("comparisonOperator", function(parser2, tokens) {
    var expr = parser2.parseElement("mathExpression", tokens);
    var comparisonToken = tokens.matchAnyOpToken("<", ">", "<=", ">=", "==", "===", "!=", "!==");
    var operator = comparisonToken ? comparisonToken.value : null;
    var hasRightValue = true;
    var typeCheck = false;
    if (operator == null) {
      if (tokens.matchToken("is") || tokens.matchToken("am")) {
        if (tokens.matchToken("not")) {
          if (tokens.matchToken("in")) {
            operator = "not in";
          } else if (tokens.matchToken("a") || tokens.matchToken("an")) {
            operator = "not a";
            typeCheck = true;
          } else if (tokens.matchToken("empty")) {
            operator = "not empty";
            hasRightValue = false;
          } else {
            if (tokens.matchToken("really")) {
              operator = "!==";
            } else {
              operator = "!=";
            }
            if (tokens.matchToken("equal")) {
              tokens.matchToken("to");
            }
          }
        } else if (tokens.matchToken("in")) {
          operator = "in";
        } else if (tokens.matchToken("a") || tokens.matchToken("an")) {
          operator = "a";
          typeCheck = true;
        } else if (tokens.matchToken("empty")) {
          operator = "empty";
          hasRightValue = false;
        } else if (tokens.matchToken("less")) {
          tokens.requireToken("than");
          if (tokens.matchToken("or")) {
            tokens.requireToken("equal");
            tokens.requireToken("to");
            operator = "<=";
          } else {
            operator = "<";
          }
        } else if (tokens.matchToken("greater")) {
          tokens.requireToken("than");
          if (tokens.matchToken("or")) {
            tokens.requireToken("equal");
            tokens.requireToken("to");
            operator = ">=";
          } else {
            operator = ">";
          }
        } else {
          if (tokens.matchToken("really")) {
            operator = "===";
          } else {
            operator = "==";
          }
          if (tokens.matchToken("equal")) {
            tokens.matchToken("to");
          }
        }
      } else if (tokens.matchToken("equals")) {
        operator = "==";
      } else if (tokens.matchToken("really")) {
        tokens.requireToken("equals");
        operator = "===";
      } else if (tokens.matchToken("exist") || tokens.matchToken("exists")) {
        operator = "exist";
        hasRightValue = false;
      } else if (tokens.matchToken("matches") || tokens.matchToken("match")) {
        operator = "match";
      } else if (tokens.matchToken("contains") || tokens.matchToken("contain")) {
        operator = "contain";
      } else if (tokens.matchToken("includes") || tokens.matchToken("include")) {
        operator = "include";
      } else if (tokens.matchToken("do") || tokens.matchToken("does")) {
        tokens.requireToken("not");
        if (tokens.matchToken("matches") || tokens.matchToken("match")) {
          operator = "not match";
        } else if (tokens.matchToken("contains") || tokens.matchToken("contain")) {
          operator = "not contain";
        } else if (tokens.matchToken("exist") || tokens.matchToken("exist")) {
          operator = "not exist";
          hasRightValue = false;
        } else if (tokens.matchToken("include")) {
          operator = "not include";
        } else {
          parser2.raiseParseError(tokens, "Expected matches or contains");
        }
      }
    }
    if (operator) {
      var typeName, nullOk, rhs;
      if (typeCheck) {
        typeName = tokens.requireTokenType("IDENTIFIER");
        nullOk = !tokens.matchOpToken("!");
      } else if (hasRightValue) {
        rhs = parser2.requireElement("mathExpression", tokens);
        if (operator === "match" || operator === "not match") {
          rhs = rhs.css ? rhs.css : rhs;
        }
      }
      var lhs = expr;
      expr = {
        type: "comparisonOperator",
        operator,
        typeName,
        nullOk,
        lhs: expr,
        rhs,
        args: [expr, rhs],
        op: function(context2, lhsVal, rhsVal) {
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
          if (operator === "===") {
            return lhsVal === rhsVal;
          } else if (operator === "!==") {
            return lhsVal !== rhsVal;
          } else if (operator === "<") {
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
        },
        evaluate: function(context2) {
          return context2.meta.runtime.unifiedEval(this, context2);
        }
      };
    }
    return expr;
  });
  parser.addGrammarElement("comparisonExpression", function(parser2, tokens) {
    return parser2.parseAnyOf(["comparisonOperator", "mathExpression"], tokens);
  });
  parser.addGrammarElement("logicalOperator", function(parser2, tokens) {
    var expr = parser2.parseElement("comparisonExpression", tokens);
    var logicalOp, initialLogicalOp = null;
    logicalOp = tokens.matchToken("and") || tokens.matchToken("or");
    while (logicalOp) {
      initialLogicalOp = initialLogicalOp || logicalOp;
      if (initialLogicalOp.value !== logicalOp.value) {
        parser2.raiseParseError(tokens, "You must parenthesize logical operations with different operators");
      }
      var rhs = parser2.requireElement("comparisonExpression", tokens);
      const operator = logicalOp.value;
      expr = {
        type: "logicalOperator",
        operator,
        lhs: expr,
        rhs,
        args: [expr, rhs],
        op: function(context2, lhsVal, rhsVal) {
          if (operator === "and") {
            return lhsVal && rhsVal;
          } else {
            return lhsVal || rhsVal;
          }
        },
        evaluate: function(context2) {
          return context2.meta.runtime.unifiedEval(this, context2, operator === "or");
        }
      };
      logicalOp = tokens.matchToken("and") || tokens.matchToken("or");
    }
    return expr;
  });
  parser.addGrammarElement("logicalExpression", function(parser2, tokens) {
    return parser2.parseAnyOf(["logicalOperator", "mathExpression"], tokens);
  });
  parser.addGrammarElement("asyncExpression", function(parser2, tokens) {
    if (tokens.matchToken("async")) {
      var value = parser2.requireElement("logicalExpression", tokens);
      var expr = {
        type: "asyncExpression",
        value,
        evaluate: function(context2) {
          return {
            asyncWrapper: true,
            value: this.value.evaluate(context2)
            //OK
          };
        }
      };
      return expr;
    } else {
      return parser2.parseElement("logicalExpression", tokens);
    }
  });
  parser.addGrammarElement("expression", function(parser2, tokens) {
    tokens.matchToken("the");
    return parser2.parseElement("asyncExpression", tokens);
  });
  parser.addGrammarElement("assignableExpression", function(parser2, tokens) {
    tokens.matchToken("the");
    var expr = parser2.parseElement("primaryExpression", tokens);
    if (expr && (expr.type === "symbol" || expr.type === "ofExpression" || expr.type === "propertyAccess" || expr.type === "attributeRefAccess" || expr.type === "attributeRef" || expr.type === "styleRef" || expr.type === "arrayIndex" || expr.type === "possessive")) {
      return expr;
    } else {
      parser2.raiseParseError(
        tokens,
        "A target expression must be writable.  The expression type '" + (expr && expr.type) + "' is not."
      );
    }
    return expr;
  });
  parser.addGrammarElement("hyperscript", function(parser2, tokens) {
    var features = [];
    if (tokens.hasMore()) {
      while (parser2.featureStart(tokens.currentToken()) || tokens.currentToken().value === "(") {
        var feature = parser2.requireElement("feature", tokens);
        features.push(feature);
        tokens.matchToken("end");
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
  var parseEventArgs = function(tokens) {
    var args = [];
    if (tokens.token(0).value === "(" && (tokens.token(1).value === ")" || tokens.token(2).value === "," || tokens.token(2).value === ")")) {
      tokens.matchOpToken("(");
      do {
        args.push(tokens.requireTokenType("IDENTIFIER"));
      } while (tokens.matchOpToken(","));
      tokens.requireOpToken(")");
    }
    return args;
  };
  parser.addFeature("on", function(parser2, tokens) {
    if (!tokens.matchToken("on")) return;
    var every = false;
    if (tokens.matchToken("every")) {
      every = true;
    }
    var events = [];
    var displayName = null;
    do {
      var on = parser2.requireElement("eventName", tokens, "Expected event name");
      var eventName = on.evaluate();
      if (displayName) {
        displayName = displayName + " or " + eventName;
      } else {
        displayName = "on " + eventName;
      }
      var args = parseEventArgs(tokens);
      var filter = null;
      if (tokens.matchOpToken("[")) {
        filter = parser2.requireElement("expression", tokens);
        tokens.requireOpToken("]");
      }
      var startCount, endCount, unbounded;
      if (tokens.currentToken().type === "NUMBER") {
        var startCountToken = tokens.consumeToken();
        if (!startCountToken.value) return;
        startCount = parseInt(startCountToken.value);
        if (tokens.matchToken("to")) {
          var endCountToken = tokens.consumeToken();
          if (!endCountToken.value) return;
          endCount = parseInt(endCountToken.value);
        } else if (tokens.matchToken("and")) {
          unbounded = true;
          tokens.requireToken("on");
        }
      }
      var intersectionSpec, mutationSpec;
      if (eventName === "intersection") {
        intersectionSpec = {};
        if (tokens.matchToken("with")) {
          intersectionSpec["with"] = parser2.requireElement("expression", tokens).evaluate();
        }
        if (tokens.matchToken("having")) {
          do {
            if (tokens.matchToken("margin")) {
              intersectionSpec["rootMargin"] = parser2.requireElement("stringLike", tokens).evaluate();
            } else if (tokens.matchToken("threshold")) {
              intersectionSpec["threshold"] = parser2.requireElement("expression", tokens).evaluate();
            } else {
              parser2.raiseParseError(tokens, "Unknown intersection config specification");
            }
          } while (tokens.matchToken("and"));
        }
      } else if (eventName === "mutation") {
        mutationSpec = {};
        if (tokens.matchToken("of")) {
          do {
            if (tokens.matchToken("anything")) {
              mutationSpec["attributes"] = true;
              mutationSpec["subtree"] = true;
              mutationSpec["characterData"] = true;
              mutationSpec["childList"] = true;
            } else if (tokens.matchToken("childList")) {
              mutationSpec["childList"] = true;
            } else if (tokens.matchToken("attributes")) {
              mutationSpec["attributes"] = true;
              mutationSpec["attributeOldValue"] = true;
            } else if (tokens.matchToken("subtree")) {
              mutationSpec["subtree"] = true;
            } else if (tokens.matchToken("characterData")) {
              mutationSpec["characterData"] = true;
              mutationSpec["characterDataOldValue"] = true;
            } else if (tokens.currentToken().type === "ATTRIBUTE_REF") {
              var attribute = tokens.consumeToken();
              if (mutationSpec["attributeFilter"] == null) {
                mutationSpec["attributeFilter"] = [];
              }
              if (attribute.value.indexOf("@") == 0) {
                mutationSpec["attributeFilter"].push(attribute.value.substring(1));
              } else {
                parser2.raiseParseError(
                  tokens,
                  "Only shorthand attribute references are allowed here"
                );
              }
            } else {
              parser2.raiseParseError(tokens, "Unknown mutation config specification");
            }
          } while (tokens.matchToken("or"));
        } else {
          mutationSpec["attributes"] = true;
          mutationSpec["characterData"] = true;
          mutationSpec["childList"] = true;
        }
      }
      var from = null;
      var elsewhere = false;
      if (tokens.matchToken("from")) {
        if (tokens.matchToken("elsewhere")) {
          elsewhere = true;
        } else {
          tokens.pushFollow("or");
          try {
            from = parser2.requireElement("expression", tokens);
          } finally {
            tokens.popFollow();
          }
          if (!from) {
            parser2.raiseParseError(tokens, 'Expected either target value or "elsewhere".');
          }
        }
      }
      if (from === null && elsewhere === false && tokens.matchToken("elsewhere")) {
        elsewhere = true;
      }
      if (tokens.matchToken("in")) {
        var inExpr = parser2.parseElement("unaryExpression", tokens);
      }
      if (tokens.matchToken("debounced")) {
        tokens.requireToken("at");
        var timeExpr = parser2.requireElement("unaryExpression", tokens);
        var debounceTime = timeExpr.evaluate({});
      } else if (tokens.matchToken("throttled")) {
        tokens.requireToken("at");
        var timeExpr = parser2.requireElement("unaryExpression", tokens);
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
    } while (tokens.matchToken("or"));
    var queueLast = true;
    if (!every) {
      if (tokens.matchToken("queue")) {
        if (tokens.matchToken("all")) {
          var queueAll = true;
          var queueLast = false;
        } else if (tokens.matchToken("first")) {
          var queueFirst = true;
        } else if (tokens.matchToken("none")) {
          var queueNone = true;
        } else {
          tokens.requireToken("last");
        }
      }
    }
    var start = parser2.requireElement("commandList", tokens);
    parser2.ensureTerminated(start);
    var errorSymbol, errorHandler;
    if (tokens.matchToken("catch")) {
      errorSymbol = tokens.requireTokenType("IDENTIFIER").value;
      errorHandler = parser2.requireElement("commandList", tokens);
      parser2.ensureTerminated(errorHandler);
    }
    if (tokens.matchToken("finally")) {
      var finallyHandler = parser2.requireElement("commandList", tokens);
      parser2.ensureTerminated(finallyHandler);
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
    parser2.setParent(start, onFeature);
    return onFeature;
  });
  parser.addFeature("def", function(parser2, tokens) {
    if (!tokens.matchToken("def")) return;
    var functionName = parser2.requireElement("dotOrColonPath", tokens);
    var nameVal = functionName.evaluate();
    var nameSpace = nameVal.split(".");
    var funcName = nameSpace.pop();
    var args = [];
    if (tokens.matchOpToken("(")) {
      if (tokens.matchOpToken(")")) {
      } else {
        do {
          args.push(tokens.requireTokenType("IDENTIFIER"));
        } while (tokens.matchOpToken(","));
        tokens.requireOpToken(")");
      }
    }
    var start = parser2.requireElement("commandList", tokens);
    var errorSymbol, errorHandler;
    if (tokens.matchToken("catch")) {
      errorSymbol = tokens.requireTokenType("IDENTIFIER").value;
      errorHandler = parser2.parseElement("commandList", tokens);
    }
    if (tokens.matchToken("finally")) {
      var finallyHandler = parser2.requireElement("commandList", tokens);
      parser2.ensureTerminated(finallyHandler);
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
    parser2.ensureTerminated(start);
    if (errorHandler) {
      parser2.ensureTerminated(errorHandler);
    }
    parser2.setParent(start, functionFeature);
    return functionFeature;
  });
  parser.addFeature("set", function(parser2, tokens) {
    let setCmd = parser2.parseElement("setCommand", tokens);
    if (setCmd) {
      if (setCmd.target.scope !== "element") {
        parser2.raiseParseError(tokens, "variables declared at the feature level must be element scoped.");
      }
      let setFeature = {
        start: setCmd,
        install: function(target, source, args, runtime) {
          setCmd && setCmd.execute(runtime.makeContext(target, setFeature, target, null));
        }
      };
      parser2.ensureTerminated(setCmd);
      return setFeature;
    }
  });
  parser.addFeature("init", function(parser2, tokens) {
    if (!tokens.matchToken("init")) return;
    var immediately = tokens.matchToken("immediately");
    var start = parser2.requireElement("commandList", tokens);
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
    parser2.ensureTerminated(start);
    parser2.setParent(start, initFeature);
    return initFeature;
  });
  parser.addFeature("worker", function(parser2, tokens) {
    if (tokens.matchToken("worker")) {
      parser2.raiseParseError(
        tokens,
        "In order to use the 'worker' feature, include the _hyperscript worker plugin. See https://hyperscript.org/features/worker/ for more info."
      );
      return void 0;
    }
  });
  parser.addFeature("behavior", function(parser2, tokens) {
    if (!tokens.matchToken("behavior")) return;
    var path = parser2.requireElement("dotOrColonPath", tokens).evaluate();
    var nameSpace = path.split(".");
    var name = nameSpace.pop();
    var formalParams = [];
    if (tokens.matchOpToken("(") && !tokens.matchOpToken(")")) {
      do {
        formalParams.push(tokens.requireTokenType("IDENTIFIER").value);
      } while (tokens.matchOpToken(","));
      tokens.requireOpToken(")");
    }
    var hs = parser2.requireElement("hyperscript", tokens);
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
  parser.addFeature("install", function(parser2, tokens) {
    if (!tokens.matchToken("install")) return;
    var behaviorPath = parser2.requireElement("dotOrColonPath", tokens).evaluate();
    var behaviorNamespace = behaviorPath.split(".");
    var args = parser2.parseElement("namedArgumentList", tokens);
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
  parser.addGrammarElement("jsBody", function(parser2, tokens) {
    var jsSourceStart = tokens.currentToken().start;
    var jsLastToken = tokens.currentToken();
    var funcNames = [];
    var funcName = "";
    var expectFunctionDeclaration = false;
    while (tokens.hasMore()) {
      jsLastToken = tokens.consumeToken();
      var peek = tokens.token(0, true);
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
      jsSource: tokens.source.substring(jsSourceStart, jsSourceEnd)
    };
  });
  parser.addFeature("js", function(parser2, tokens) {
    if (!tokens.matchToken("js")) return;
    var jsBody = parser2.requireElement("jsBody", tokens);
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
  parser.addCommand("js", function(parser2, tokens) {
    if (!tokens.matchToken("js")) return;
    var inputs = [];
    if (tokens.matchOpToken("(")) {
      if (tokens.matchOpToken(")")) {
      } else {
        do {
          var inp = tokens.requireTokenType("IDENTIFIER");
          inputs.push(inp.value);
        } while (tokens.matchOpToken(","));
        tokens.requireOpToken(")");
      }
    }
    var jsBody = parser2.requireElement("jsBody", tokens);
    tokens.matchToken("end");
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
  parser.addCommand("async", function(parser2, tokens) {
    if (!tokens.matchToken("async")) return;
    if (tokens.matchToken("do")) {
      var body = parser2.requireElement("commandList", tokens);
      var end = body;
      while (end.next) end = end.next;
      end.next = Runtime.HALT;
      tokens.requireToken("end");
    } else {
      var body = parser2.requireElement("command", tokens);
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
    parser2.setParent(body, command);
    return command;
  });
  parser.addCommand("tell", function(parser2, tokens) {
    var startToken = tokens.currentToken();
    if (!tokens.matchToken("tell")) return;
    var value = parser2.requireElement("expression", tokens);
    var body = parser2.requireElement("commandList", tokens);
    if (tokens.hasMore() && !parser2.featureStart(tokens.currentToken())) {
      tokens.requireToken("end");
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
    parser2.setParent(body, tellCmd);
    return tellCmd;
  });
  parser.addCommand("wait", function(parser2, tokens) {
    if (!tokens.matchToken("wait")) return;
    var command;
    if (tokens.matchToken("for")) {
      tokens.matchToken("a");
      var events = [];
      do {
        var lookahead = tokens.token(0);
        if (lookahead.type === "NUMBER" || lookahead.type === "L_PAREN") {
          events.push({
            time: parser2.requireElement("expression", tokens).evaluate()
            // TODO: do we want to allow async here?
          });
        } else {
          events.push({
            name: parser2.requireElement("dotOrColonPath", tokens, "Expected event name").evaluate(),
            args: parseEventArgs(tokens)
          });
        }
      } while (tokens.matchToken("or"));
      if (tokens.matchToken("from")) {
        var on = parser2.requireElement("expression", tokens);
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
      if (tokens.matchToken("a")) {
        tokens.requireToken("tick");
        time = 0;
      } else {
        time = parser2.requireElement("expression", tokens);
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
  parser.addGrammarElement("dotOrColonPath", function(parser2, tokens) {
    var root = tokens.matchTokenType("IDENTIFIER");
    if (root) {
      var path = [root.value];
      var separator = tokens.matchOpToken(".") || tokens.matchOpToken(":");
      if (separator) {
        do {
          path.push(tokens.requireTokenType("IDENTIFIER", "NUMBER").value);
        } while (tokens.matchOpToken(separator.value));
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
  parser.addGrammarElement("eventName", function(parser2, tokens) {
    var token;
    if (token = tokens.matchTokenType("STRING")) {
      return {
        evaluate: function() {
          return token.value;
        }
      };
    }
    return parser2.parseElement("dotOrColonPath", tokens);
  });
  function parseSendCmd(cmdType, parser2, tokens) {
    var eventName = parser2.requireElement("eventName", tokens);
    var details = parser2.parseElement("namedArgumentList", tokens);
    if (cmdType === "send" && tokens.matchToken("to") || cmdType === "trigger" && tokens.matchToken("on")) {
      var toExpr = parser2.requireElement("expression", tokens);
    } else {
      var toExpr = parser2.requireElement("implicitMeTarget", tokens);
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
  parser.addCommand("trigger", function(parser2, tokens) {
    if (tokens.matchToken("trigger")) {
      return parseSendCmd("trigger", parser2, tokens);
    }
  });
  parser.addCommand("send", function(parser2, tokens) {
    if (tokens.matchToken("send")) {
      return parseSendCmd("send", parser2, tokens);
    }
  });
  var parseReturnFunction = function(parser2, tokens, returnAValue) {
    if (returnAValue) {
      if (parser2.commandBoundary(tokens.currentToken())) {
        parser2.raiseParseError(tokens, "'return' commands must return a value.  If you do not wish to return a value, use 'exit' instead.");
      } else {
        var value = parser2.requireElement("expression", tokens);
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
  parser.addCommand("return", function(parser2, tokens) {
    if (tokens.matchToken("return")) {
      return parseReturnFunction(parser2, tokens, true);
    }
  });
  parser.addCommand("exit", function(parser2, tokens) {
    if (tokens.matchToken("exit")) {
      return parseReturnFunction(parser2, tokens, false);
    }
  });
  parser.addCommand("halt", function(parser2, tokens) {
    if (tokens.matchToken("halt")) {
      if (tokens.matchToken("the")) {
        tokens.requireToken("event");
        if (tokens.matchOpToken("'")) {
          tokens.requireToken("s");
        }
        var keepExecuting = true;
      }
      if (tokens.matchToken("bubbling")) {
        var bubbling = true;
      } else if (tokens.matchToken("default")) {
        var haltDefault = true;
      }
      var exit = parseReturnFunction(parser2, tokens, false);
      var haltCmd = {
        keepExecuting: true,
        bubbling,
        haltDefault,
        exit,
        op: function(ctx) {
          if (ctx.event) {
            if (bubbling) {
              ctx.event.stopPropagation();
            } else if (haltDefault) {
              ctx.event.preventDefault();
            } else {
              ctx.event.stopPropagation();
              ctx.event.preventDefault();
            }
            if (keepExecuting) {
              return ctx.meta.runtime.findNext(this, ctx);
            } else {
              return exit;
            }
          }
        }
      };
      return haltCmd;
    }
  });
  parser.addCommand("log", function(parser2, tokens) {
    if (!tokens.matchToken("log")) return;
    var exprs = [parser2.parseElement("expression", tokens)];
    while (tokens.matchOpToken(",")) {
      exprs.push(parser2.requireElement("expression", tokens));
    }
    if (tokens.matchToken("with")) {
      var withExpr = parser2.requireElement("expression", tokens);
    }
    var logCmd = {
      exprs,
      withExpr,
      args: [withExpr, exprs],
      op: function(ctx, withExpr2, values) {
        if (withExpr2) {
          withExpr2.apply(null, values);
        } else {
          console.log.apply(null, values);
        }
        return ctx.meta.runtime.findNext(this, ctx);
      }
    };
    return logCmd;
  });
  parser.addCommand("beep!", function(parser2, tokens) {
    if (!tokens.matchToken("beep!")) return;
    var exprs = [parser2.parseElement("expression", tokens)];
    while (tokens.matchOpToken(",")) {
      exprs.push(parser2.requireElement("expression", tokens));
    }
    var beepCmd = {
      exprs,
      args: [exprs],
      op: function(ctx, values) {
        for (let i = 0; i < exprs.length; i++) {
          const expr = exprs[i];
          const val = values[i];
          ctx.meta.runtime.beepValueToConsole(ctx.me, expr, val);
        }
        return ctx.meta.runtime.findNext(this, ctx);
      }
    };
    return beepCmd;
  });
  parser.addCommand("throw", function(parser2, tokens) {
    if (!tokens.matchToken("throw")) return;
    var expr = parser2.requireElement("expression", tokens);
    var throwCmd = {
      expr,
      args: [expr],
      op: function(ctx, expr2) {
        ctx.meta.runtime.registerHyperTrace(ctx, expr2);
        throw expr2;
      }
    };
    return throwCmd;
  });
  var parseCallOrGet = function(parser2, tokens) {
    var expr = parser2.requireElement("expression", tokens);
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
  parser.addCommand("call", function(parser2, tokens) {
    if (!tokens.matchToken("call")) return;
    var call = parseCallOrGet(parser2, tokens);
    if (call.expr && call.expr.type !== "functionCall") {
      parser2.raiseParseError(tokens, "Must be a function invocation");
    }
    return call;
  });
  parser.addCommand("get", function(parser2, tokens) {
    if (tokens.matchToken("get")) {
      return parseCallOrGet(parser2, tokens);
    }
  });
  parser.addCommand("make", function(parser2, tokens) {
    if (!tokens.matchToken("make")) return;
    tokens.matchToken("a") || tokens.matchToken("an");
    var expr = parser2.requireElement("expression", tokens);
    var args = [];
    if (expr.type !== "queryRef" && tokens.matchToken("from")) {
      do {
        args.push(parser2.requireElement("expression", tokens));
      } while (tokens.matchOpToken(","));
    }
    if (tokens.matchToken("called")) {
      var target = parser2.requireElement("symbol", tokens);
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
  parser.addGrammarElement("pseudoCommand", function(parser2, tokens) {
    let lookAhead = tokens.token(1);
    if (!(lookAhead && lookAhead.op && (lookAhead.value === "." || lookAhead.value === "("))) {
      return null;
    }
    var expr = parser2.requireElement("primaryExpression", tokens);
    var rootRoot = expr.root;
    var root = expr;
    while (rootRoot.root != null) {
      root = root.root;
      rootRoot = rootRoot.root;
    }
    if (expr.type !== "functionCall") {
      parser2.raiseParseError(tokens, "Pseudo-commands must be function calls");
    }
    if (root.type === "functionCall" && root.root.root == null) {
      if (tokens.matchAnyToken("the", "to", "on", "with", "into", "from", "at")) {
        var realRoot = parser2.requireElement("expression", tokens);
      } else if (tokens.matchToken("me")) {
        var realRoot = parser2.requireElement("implicitMeTarget", tokens);
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
  var makeSetter = function(parser2, tokens, target, value) {
    var symbolWrite = target.type === "symbol";
    var attributeWrite = target.type === "attributeRef";
    var styleWrite = target.type === "styleRef";
    var arrayWrite = target.type === "arrayIndex";
    if (!(attributeWrite || styleWrite || symbolWrite) && target.root == null) {
      parser2.raiseParseError(tokens, "Can only put directly into symbols, not references");
    }
    var rootElt = null;
    var prop = null;
    if (symbolWrite) {
    } else if (attributeWrite || styleWrite) {
      rootElt = parser2.requireElement("implicitMeTarget", tokens);
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
  parser.addCommand("default", function(parser2, tokens) {
    if (!tokens.matchToken("default")) return;
    var target = parser2.requireElement("assignableExpression", tokens);
    tokens.requireToken("to");
    var value = parser2.requireElement("expression", tokens);
    var setter = makeSetter(parser2, tokens, target, value);
    var defaultCmd = {
      target,
      value,
      setter,
      args: [target],
      op: function(context2, target2) {
        if (target2) {
          return context2.meta.runtime.findNext(this, context2);
        } else {
          return setter;
        }
      }
    };
    setter.parent = defaultCmd;
    return defaultCmd;
  });
  parser.addCommand("set", function(parser2, tokens) {
    if (!tokens.matchToken("set")) return;
    if (tokens.currentToken().type === "L_BRACE") {
      var obj = parser2.requireElement("objectLiteral", tokens);
      tokens.requireToken("on");
      var target = parser2.requireElement("expression", tokens);
      var command = {
        objectLiteral: obj,
        target,
        args: [obj, target],
        op: function(ctx, obj2, target2) {
          Object.assign(target2, obj2);
          return ctx.meta.runtime.findNext(this, ctx);
        }
      };
      return command;
    }
    try {
      tokens.pushFollow("to");
      var target = parser2.requireElement("assignableExpression", tokens);
    } finally {
      tokens.popFollow();
    }
    tokens.requireToken("to");
    var value = parser2.requireElement("expression", tokens);
    return makeSetter(parser2, tokens, target, value);
  });
  parser.addCommand("if", function(parser2, tokens) {
    if (!tokens.matchToken("if")) return;
    var expr = parser2.requireElement("expression", tokens);
    tokens.matchToken("then");
    var trueBranch = parser2.parseElement("commandList", tokens);
    var nestedIfStmt = false;
    let elseToken = tokens.matchToken("else") || tokens.matchToken("otherwise");
    if (elseToken) {
      let elseIfIfToken = tokens.peekToken("if");
      nestedIfStmt = elseIfIfToken != null && elseIfIfToken.line === elseToken.line;
      if (nestedIfStmt) {
        var falseBranch = parser2.parseElement("command", tokens);
      } else {
        var falseBranch = parser2.parseElement("commandList", tokens);
      }
    }
    if (tokens.hasMore() && !nestedIfStmt) {
      tokens.requireToken("end");
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
    parser2.setParent(trueBranch, ifCmd);
    parser2.setParent(falseBranch, ifCmd);
    return ifCmd;
  });
  var parseRepeatExpression = function(parser2, tokens, startedWithForToken) {
    var innerStartToken = tokens.currentToken();
    var identifier;
    if (tokens.matchToken("for") || startedWithForToken) {
      var identifierToken = tokens.requireTokenType("IDENTIFIER");
      identifier = identifierToken.value;
      tokens.requireToken("in");
      var expression = parser2.requireElement("expression", tokens);
    } else if (tokens.matchToken("in")) {
      identifier = "it";
      var expression = parser2.requireElement("expression", tokens);
    } else if (tokens.matchToken("while")) {
      var whileExpr = parser2.requireElement("expression", tokens);
    } else if (tokens.matchToken("until")) {
      var isUntil = true;
      if (tokens.matchToken("event")) {
        var evt = parser2.requireElement("dotOrColonPath", tokens, "Expected event name");
        if (tokens.matchToken("from")) {
          var on = parser2.requireElement("expression", tokens);
        }
      } else {
        var whileExpr = parser2.requireElement("expression", tokens);
      }
    } else {
      if (!parser2.commandBoundary(tokens.currentToken()) && tokens.currentToken().value !== "forever") {
        var times = parser2.requireElement("expression", tokens);
        tokens.requireToken("times");
      } else {
        tokens.matchToken("forever");
        var forever = true;
      }
    }
    if (tokens.matchToken("index")) {
      var identifierToken = tokens.requireTokenType("IDENTIFIER");
      var indexIdentifier = identifierToken.value;
    } else if (tokens.matchToken("indexed")) {
      tokens.requireToken("by");
      var identifierToken = tokens.requireTokenType("IDENTIFIER");
      var indexIdentifier = identifierToken.value;
    }
    var loop = parser2.parseElement("commandList", tokens);
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
    if (tokens.hasMore()) {
      tokens.requireToken("end");
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
    parser2.setParent(loop, repeatCmd);
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
    parser2.setParent(repeatCmd, repeatInit);
    return repeatInit;
  };
  parser.addCommand("repeat", function(parser2, tokens) {
    if (tokens.matchToken("repeat")) {
      return parseRepeatExpression(parser2, tokens, false);
    }
  });
  parser.addCommand("for", function(parser2, tokens) {
    if (tokens.matchToken("for")) {
      return parseRepeatExpression(parser2, tokens, true);
    }
  });
  parser.addCommand("continue", function(parser2, tokens) {
    if (!tokens.matchToken("continue")) return;
    var command = {
      op: function(context2) {
        for (var parent = this.parent; true; parent = parent.parent) {
          if (parent == void 0) {
            parser2.raiseParseError(tokens, "Command `continue` cannot be used outside of a `repeat` loop.");
          }
          if (parent.loop != void 0) {
            return parent.resolveNext(context2);
          }
        }
      }
    };
    return command;
  });
  parser.addCommand("break", function(parser2, tokens) {
    if (!tokens.matchToken("break")) return;
    var command = {
      op: function(context2) {
        for (var parent = this.parent; true; parent = parent.parent) {
          if (parent == void 0) {
            parser2.raiseParseError(tokens, "Command `continue` cannot be used outside of a `repeat` loop.");
          }
          if (parent.loop != void 0) {
            return context2.meta.runtime.findNext(parent.parent, context2);
          }
        }
      }
    };
    return command;
  });
  parser.addGrammarElement("stringLike", function(parser2, tokens) {
    return parser2.parseAnyOf(["string", "nakedString"], tokens);
  });
  parser.addCommand("append", function(parser2, tokens) {
    if (!tokens.matchToken("append")) return;
    var targetExpr = null;
    var value = parser2.requireElement("expression", tokens);
    var implicitResultSymbol = {
      type: "symbol",
      evaluate: function(context2) {
        return context2.meta.runtime.resolveSymbol("result", context2);
      }
    };
    if (tokens.matchToken("to")) {
      targetExpr = parser2.requireElement("expression", tokens);
    } else {
      targetExpr = implicitResultSymbol;
    }
    var setter = null;
    if (targetExpr.type === "symbol" || targetExpr.type === "attributeRef" || targetExpr.root != null) {
      setter = makeSetter(parser2, tokens, targetExpr, implicitResultSymbol);
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
  function parsePickRange(parser2, tokens) {
    tokens.matchToken("at") || tokens.matchToken("from");
    const rv = { includeStart: true, includeEnd: false };
    rv.from = tokens.matchToken("start") ? 0 : parser2.requireElement("expression", tokens);
    if (tokens.matchToken("to") || tokens.matchOpToken("..")) {
      if (tokens.matchToken("end")) {
        rv.toEnd = true;
      } else {
        rv.to = parser2.requireElement("expression", tokens);
      }
    }
    if (tokens.matchToken("inclusive")) rv.includeEnd = true;
    else if (tokens.matchToken("exclusive")) rv.includeStart = false;
    return rv;
  }
  parser.addCommand("pick", (parser2, tokens) => {
    if (!tokens.matchToken("pick")) return;
    tokens.matchToken("the");
    if (tokens.matchToken("item") || tokens.matchToken("items") || tokens.matchToken("character") || tokens.matchToken("characters")) {
      const range = parsePickRange(parser2, tokens);
      tokens.requireToken("from");
      const root = parser2.requireElement("expression", tokens);
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
    if (tokens.matchToken("match")) {
      tokens.matchToken("of");
      const re = parser2.parseElement("expression", tokens);
      let flags = "";
      if (tokens.matchOpToken("|")) {
        flags = tokens.requireTokenType("IDENTIFIER").value;
      }
      tokens.requireToken("from");
      const root = parser2.parseElement("expression", tokens);
      return {
        args: [root, re],
        op(ctx, root2, re2) {
          ctx.result = new RegExp(re2, flags).exec(root2);
          return ctx.meta.runtime.findNext(this, ctx);
        }
      };
    }
    if (tokens.matchToken("matches")) {
      tokens.matchToken("of");
      const re = parser2.parseElement("expression", tokens);
      let flags = "gu";
      if (tokens.matchOpToken("|")) {
        flags = "g" + tokens.requireTokenType("IDENTIFIER").value.replace("g", "");
      }
      tokens.requireToken("from");
      const root = parser2.parseElement("expression", tokens);
      return {
        args: [root, re],
        op(ctx, root2, re2) {
          ctx.result = new RegExpIterable(re2, flags, root2);
          return ctx.meta.runtime.findNext(this, ctx);
        }
      };
    }
  });
  parser.addCommand("increment", function(parser2, tokens) {
    if (!tokens.matchToken("increment")) return;
    var amountExpr;
    var target = parser2.parseElement("assignableExpression", tokens);
    if (tokens.matchToken("by")) {
      amountExpr = parser2.requireElement("expression", tokens);
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
    return makeSetter(parser2, tokens, target, implicitIncrementOp);
  });
  parser.addCommand("decrement", function(parser2, tokens) {
    if (!tokens.matchToken("decrement")) return;
    var amountExpr;
    var target = parser2.parseElement("assignableExpression", tokens);
    if (tokens.matchToken("by")) {
      amountExpr = parser2.requireElement("expression", tokens);
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
    return makeSetter(parser2, tokens, target, implicitDecrementOp);
  });
  function parseConversionInfo(tokens, parser2) {
    var type = "text";
    var conversion;
    tokens.matchToken("a") || tokens.matchToken("an");
    if (tokens.matchToken("json") || tokens.matchToken("Object")) {
      type = "json";
    } else if (tokens.matchToken("response")) {
      type = "response";
    } else if (tokens.matchToken("html")) {
      type = "html";
    } else if (tokens.matchToken("text")) {
    } else {
      conversion = parser2.requireElement("dotOrColonPath", tokens).evaluate();
    }
    return { type, conversion };
  }
  parser.addCommand("fetch", function(parser2, tokens) {
    if (!tokens.matchToken("fetch")) return;
    var url = parser2.requireElement("stringLike", tokens);
    if (tokens.matchToken("as")) {
      var conversionInfo = parseConversionInfo(tokens, parser2);
    }
    if (tokens.matchToken("with") && tokens.currentToken().value !== "{") {
      var args = parser2.parseElement("nakedNamedArgumentList", tokens);
    } else {
      var args = parser2.parseElement("objectLiteral", tokens);
    }
    if (conversionInfo == null && tokens.matchToken("as")) {
      conversionInfo = parseConversionInfo(tokens, parser2);
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
  parser.addCommand("settle", function(parser2, tokens) {
    if (tokens.matchToken("settle")) {
      if (!parser2.commandBoundary(tokens.currentToken())) {
        var onExpr = parser2.requireElement("expression", tokens);
      } else {
        var onExpr = parser2.requireElement("implicitMeTarget", tokens);
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
  parser.addCommand("add", function(parser2, tokens) {
    if (tokens.matchToken("add")) {
      var classRef = parser2.parseElement("classRef", tokens);
      var attributeRef = null;
      var cssDeclaration = null;
      if (classRef == null) {
        attributeRef = parser2.parseElement("attributeRef", tokens);
        if (attributeRef == null) {
          cssDeclaration = parser2.parseElement("styleLiteral", tokens);
          if (cssDeclaration == null) {
            parser2.raiseParseError(tokens, "Expected either a class reference or attribute expression");
          }
        }
      } else {
        var classRefs = [classRef];
        while (classRef = parser2.parseElement("classRef", tokens)) {
          classRefs.push(classRef);
        }
      }
      if (tokens.matchToken("to")) {
        var toExpr = parser2.requireElement("expression", tokens);
      } else {
        var toExpr = parser2.requireElement("implicitMeTarget", tokens);
      }
      if (tokens.matchToken("when")) {
        if (cssDeclaration) {
          parser2.raiseParseError(tokens, "Only class and properties are supported with a when clause");
        }
        var when = parser2.requireElement("expression", tokens);
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
  parser.addGrammarElement("styleLiteral", function(parser2, tokens) {
    if (!tokens.matchOpToken("{")) return;
    var stringParts = [""];
    var exprs = [];
    while (tokens.hasMore()) {
      if (tokens.matchOpToken("\\")) {
        tokens.consumeToken();
      } else if (tokens.matchOpToken("}")) {
        break;
      } else if (tokens.matchToken("$")) {
        var opencurly = tokens.matchOpToken("{");
        var expr = parser2.parseElement("expression", tokens);
        if (opencurly) tokens.requireOpToken("}");
        exprs.push(expr);
        stringParts.push("");
      } else {
        var tok = tokens.consumeToken();
        stringParts[stringParts.length - 1] += tokens.source.substring(tok.start, tok.end);
      }
      stringParts[stringParts.length - 1] += tokens.lastWhitespace();
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
  });
  parser.addCommand("remove", function(parser2, tokens) {
    if (tokens.matchToken("remove")) {
      var classRef = parser2.parseElement("classRef", tokens);
      var attributeRef = null;
      var elementExpr = null;
      if (classRef == null) {
        attributeRef = parser2.parseElement("attributeRef", tokens);
        if (attributeRef == null) {
          elementExpr = parser2.parseElement("expression", tokens);
          if (elementExpr == null) {
            parser2.raiseParseError(
              tokens,
              "Expected either a class reference, attribute expression or value expression"
            );
          }
        }
      } else {
        var classRefs = [classRef];
        while (classRef = parser2.parseElement("classRef", tokens)) {
          classRefs.push(classRef);
        }
      }
      if (tokens.matchToken("from")) {
        var fromExpr = parser2.requireElement("expression", tokens);
      } else {
        if (elementExpr == null) {
          var fromExpr = parser2.requireElement("implicitMeTarget", tokens);
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
  parser.addCommand("toggle", function(parser2, tokens) {
    if (tokens.matchToken("toggle")) {
      tokens.matchAnyToken("the", "my");
      if (tokens.currentToken().type === "STYLE_REF") {
        let styleRef = tokens.consumeToken();
        var name = styleRef.value.substr(1);
        var visibility = true;
        var hideShowStrategy = resolveHideShowStrategy(parser2, tokens, name);
        if (tokens.matchToken("of")) {
          tokens.pushFollow("with");
          try {
            var onExpr = parser2.requireElement("expression", tokens);
          } finally {
            tokens.popFollow();
          }
        } else {
          var onExpr = parser2.requireElement("implicitMeTarget", tokens);
        }
      } else if (tokens.matchToken("between")) {
        var between = true;
        var classRef = parser2.parseElement("classRef", tokens);
        tokens.requireToken("and");
        var classRef2 = parser2.requireElement("classRef", tokens);
      } else {
        var classRef = parser2.parseElement("classRef", tokens);
        var attributeRef = null;
        if (classRef == null) {
          attributeRef = parser2.parseElement("attributeRef", tokens);
          if (attributeRef == null) {
            parser2.raiseParseError(tokens, "Expected either a class reference or attribute expression");
          }
        } else {
          var classRefs = [classRef];
          while (classRef = parser2.parseElement("classRef", tokens)) {
            classRefs.push(classRef);
          }
        }
      }
      if (visibility !== true) {
        if (tokens.matchToken("on")) {
          var onExpr = parser2.requireElement("expression", tokens);
        } else {
          var onExpr = parser2.requireElement("implicitMeTarget", tokens);
        }
      }
      if (tokens.matchToken("for")) {
        var time = parser2.requireElement("expression", tokens);
      } else if (tokens.matchToken("until")) {
        var evt = parser2.requireElement("dotOrColonPath", tokens, "Expected event name");
        if (tokens.matchToken("from")) {
          var from = parser2.requireElement("expression", tokens);
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
  var parseShowHideTarget = function(parser2, tokens) {
    var target;
    var currentTokenValue = tokens.currentToken();
    if (currentTokenValue.value === "when" || currentTokenValue.value === "with" || parser2.commandBoundary(currentTokenValue)) {
      target = parser2.parseElement("implicitMeTarget", tokens);
    } else {
      target = parser2.parseElement("expression", tokens);
    }
    return target;
  };
  var resolveHideShowStrategy = function(parser2, tokens, name) {
    var configDefault = config.defaultHideShowStrategy;
    var strategies = HIDE_SHOW_STRATEGIES;
    if (config.hideShowStrategies) {
      strategies = Object.assign(strategies, config.hideShowStrategies);
    }
    name = name || configDefault || "display";
    var value = strategies[name];
    if (value == null) {
      parser2.raiseParseError(tokens, "Unknown show/hide strategy : " + name);
    }
    return value;
  };
  parser.addCommand("hide", function(parser2, tokens) {
    if (tokens.matchToken("hide")) {
      var targetExpr = parseShowHideTarget(parser2, tokens);
      var name = null;
      if (tokens.matchToken("with")) {
        name = tokens.requireTokenType("IDENTIFIER", "STYLE_REF").value;
        if (name.indexOf("*") === 0) {
          name = name.substr(1);
        }
      }
      var hideShowStrategy = resolveHideShowStrategy(parser2, tokens, name);
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
  parser.addCommand("show", function(parser2, tokens) {
    if (tokens.matchToken("show")) {
      var targetExpr = parseShowHideTarget(parser2, tokens);
      var name = null;
      if (tokens.matchToken("with")) {
        name = tokens.requireTokenType("IDENTIFIER", "STYLE_REF").value;
        if (name.indexOf("*") === 0) {
          name = name.substr(1);
        }
      }
      var arg = null;
      if (tokens.matchOpToken(":")) {
        var tokenArr = tokens.consumeUntilWhitespace();
        tokens.matchTokenType("WHITESPACE");
        arg = tokenArr.map(function(t) {
          return t.value;
        }).join("");
      }
      if (tokens.matchToken("when")) {
        var when = parser2.requireElement("expression", tokens);
      }
      var hideShowStrategy = resolveHideShowStrategy(parser2, tokens, name);
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
  parser.addCommand("take", function(parser2, tokens) {
    if (tokens.matchToken("take")) {
      let classRef = null;
      let classRefs = [];
      while (classRef = parser2.parseElement("classRef", tokens)) {
        classRefs.push(classRef);
      }
      var attributeRef = null;
      var replacementValue = null;
      let weAreTakingClasses = classRefs.length > 0;
      if (!weAreTakingClasses) {
        attributeRef = parser2.parseElement("attributeRef", tokens);
        if (attributeRef == null) {
          parser2.raiseParseError(tokens, "Expected either a class reference or attribute expression");
        }
        if (tokens.matchToken("with")) {
          replacementValue = parser2.requireElement("expression", tokens);
        }
      }
      if (tokens.matchToken("from")) {
        var fromExpr = parser2.requireElement("expression", tokens);
      }
      if (tokens.matchToken("for")) {
        var forExpr = parser2.requireElement("expression", tokens);
      } else {
        var forExpr = parser2.requireElement("implicitMeTarget", tokens);
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
  function putInto(context2, root, prop, valueToPut) {
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
  parser.addCommand("put", function(parser2, tokens) {
    if (tokens.matchToken("put")) {
      var value = parser2.requireElement("expression", tokens);
      var operationToken = tokens.matchAnyToken("into", "before", "after");
      if (operationToken == null && tokens.matchToken("at")) {
        tokens.matchToken("the");
        operationToken = tokens.matchAnyToken("start", "end");
        tokens.requireToken("of");
      }
      if (operationToken == null) {
        parser2.raiseParseError(tokens, "Expected one of 'into', 'before', 'at start of', 'at end of', 'after'");
      }
      var target = parser2.requireElement("expression", tokens);
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
        rootExpr = parser2.requireElement("implicitMeTarget", tokens);
      } else if (target.type === "styleRef" && operation === "into") {
        var styleWrite = true;
        prop = target.name;
        rootExpr = parser2.requireElement("implicitMeTarget", tokens);
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
            putInto(context2, root, prop2, valueToPut);
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
                  putInto(context2, elt, prop2, valueToPut);
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
  });
  function parsePseudopossessiveTarget(parser2, tokens) {
    var targets;
    if (tokens.matchToken("the") || tokens.matchToken("element") || tokens.matchToken("elements") || tokens.currentToken().type === "CLASS_REF" || tokens.currentToken().type === "ID_REF" || tokens.currentToken().op && tokens.currentToken().value === "<") {
      parser2.possessivesDisabled = true;
      try {
        targets = parser2.parseElement("expression", tokens);
      } finally {
        delete parser2.possessivesDisabled;
      }
      if (tokens.matchOpToken("'")) {
        tokens.requireToken("s");
      }
    } else if (tokens.currentToken().type === "IDENTIFIER" && tokens.currentToken().value === "its") {
      var identifier = tokens.matchToken("its");
      targets = {
        type: "pseudopossessiveIts",
        token: identifier,
        name: identifier.value,
        evaluate: function(context2) {
          return context2.meta.runtime.resolveSymbol("it", context2);
        }
      };
    } else {
      tokens.matchToken("my") || tokens.matchToken("me");
      targets = parser2.parseElement("implicitMeTarget", tokens);
    }
    return targets;
  }
  parser.addCommand("transition", function(parser2, tokens) {
    if (tokens.matchToken("transition")) {
      var targetsExpr = parsePseudopossessiveTarget(parser2, tokens);
      var properties = [];
      var from = [];
      var to = [];
      var currentToken = tokens.currentToken();
      while (!parser2.commandBoundary(currentToken) && currentToken.value !== "over" && currentToken.value !== "using") {
        if (tokens.currentToken().type === "STYLE_REF") {
          let styleRef = tokens.consumeToken();
          let styleProp = styleRef.value.substr(1);
          properties.push({
            type: "styleRefValue",
            evaluate: function() {
              return styleProp;
            }
          });
        } else {
          properties.push(parser2.requireElement("stringLike", tokens));
        }
        if (tokens.matchToken("from")) {
          from.push(parser2.requireElement("expression", tokens));
        } else {
          from.push(null);
        }
        tokens.requireToken("to");
        if (tokens.matchToken("initial")) {
          to.push({
            type: "initial_literal",
            evaluate: function() {
              return "initial";
            }
          });
        } else {
          to.push(parser2.requireElement("expression", tokens));
        }
        currentToken = tokens.currentToken();
      }
      if (tokens.matchToken("over")) {
        var over = parser2.requireElement("expression", tokens);
      } else if (tokens.matchToken("using")) {
        var usingExpr = parser2.requireElement("expression", tokens);
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
  parser.addCommand("measure", function(parser2, tokens) {
    if (!tokens.matchToken("measure")) return;
    var targetExpr = parsePseudopossessiveTarget(parser2, tokens);
    var propsToMeasure = [];
    if (!parser2.commandBoundary(tokens.currentToken()))
      do {
        propsToMeasure.push(tokens.matchTokenType("IDENTIFIER").value);
      } while (tokens.matchOpToken(","));
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
  parser.addLeafExpression("closestExpr", function(parser2, tokens) {
    if (tokens.matchToken("closest")) {
      if (tokens.matchToken("parent")) {
        var parentSearch = true;
      }
      var css = null;
      if (tokens.currentToken().type === "ATTRIBUTE_REF") {
        var attributeRef = parser2.requireElement("attributeRefAccess", tokens, null);
        css = "[" + attributeRef.attribute.name + "]";
      }
      if (css == null) {
        var expr = parser2.requireElement("expression", tokens);
        if (expr.css == null) {
          parser2.raiseParseError(tokens, "Expected a CSS expression");
        } else {
          css = expr.css;
        }
      }
      if (tokens.matchToken("to")) {
        var to = parser2.parseElement("expression", tokens);
      } else {
        var to = parser2.parseElement("implicitMeTarget", tokens);
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
        evaluate: function(context2) {
          return context2.meta.runtime.unifiedEval(this, context2);
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
  });
  parser.addCommand("go", function(parser2, tokens) {
    if (tokens.matchToken("go")) {
      if (tokens.matchToken("back")) {
        var back = true;
      } else {
        tokens.matchToken("to");
        if (tokens.matchToken("url")) {
          var target = parser2.requireElement("stringLike", tokens);
          var url = true;
          if (tokens.matchToken("in")) {
            tokens.requireToken("new");
            tokens.requireToken("window");
            var newWindow = true;
          }
        } else {
          tokens.matchToken("the");
          var verticalPosition = tokens.matchAnyToken("top", "middle", "bottom");
          var horizontalPosition = tokens.matchAnyToken("left", "center", "right");
          if (verticalPosition || horizontalPosition) {
            tokens.requireToken("of");
          }
          var target = parser2.requireElement("unaryExpression", tokens);
          var plusOrMinus = tokens.matchAnyOpToken("+", "-");
          if (plusOrMinus) {
            tokens.pushFollow("px");
            try {
              var offset = parser2.requireElement("expression", tokens);
            } finally {
              tokens.popFollow();
            }
          }
          tokens.matchToken("px");
          var smoothness = tokens.matchAnyToken("smoothly", "instantly");
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
Tokens2._parserRaiseError = Parser.raiseParseError;
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
      Tokens: Tokens2,
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
