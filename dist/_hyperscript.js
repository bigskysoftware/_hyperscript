// _hyperscript ES module
var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

// src/core/tokens.js
var _Tokens = class _Tokens {
  constructor(tokens2, consumed, source) {
    /** @type Token | null */
    __publicField(this, "_lastConsumed", null);
    __publicField(this, "follows", []);
    this.tokens = tokens2;
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
  raiseError(tokens2, error) {
    if (_Tokens._parserRaiseError) {
      _Tokens._parserRaiseError(tokens2, error);
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
  static isValidSingleQuoteStringStart(tokens2) {
    if (tokens2.length > 0) {
      var previousToken = tokens2[tokens2.length - 1];
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
    var tokens2 = (
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
          tokens2.push(consumeWhitespace());
        } else if (!possiblePrecedingSymbol() && currentChar() === "." && (_Lexer.isAlpha(nextChar()) || nextChar() === "{" || nextChar() === "-")) {
          tokens2.push(consumeClassReference());
        } else if (!possiblePrecedingSymbol() && currentChar() === "#" && (_Lexer.isAlpha(nextChar()) || nextChar() === "{")) {
          tokens2.push(consumeIdReference());
        } else if (currentChar() === "[" && nextChar() === "@") {
          tokens2.push(consumeAttributeReference());
        } else if (currentChar() === "@") {
          tokens2.push(consumeShortAttributeReference());
        } else if (currentChar() === "*" && _Lexer.isAlpha(nextChar())) {
          tokens2.push(consumeStyleReference());
        } else if (inTemplate() && (_Lexer.isAlpha(currentChar()) || currentChar() === "\\")) {
          tokens2.push(consumeTemplateIdentifier());
        } else if (!inTemplate() && (_Lexer.isAlpha(currentChar()) || _Lexer.isIdentifierChar(currentChar()))) {
          tokens2.push(consumeIdentifier());
        } else if (_Lexer.isNumeric(currentChar())) {
          tokens2.push(consumeNumber());
        } else if (!inTemplate() && (currentChar() === '"' || currentChar() === "`")) {
          tokens2.push(consumeString());
        } else if (!inTemplate() && currentChar() === "'") {
          if (_Lexer.isValidSingleQuoteStringStart(tokens2)) {
            tokens2.push(consumeString());
          } else {
            tokens2.push(consumeOp());
          }
        } else if (_Lexer.OP_TABLE[currentChar()]) {
          if (lastToken === "$" && currentChar() === "{") {
            templateBraceCount++;
          }
          if (currentChar() === "}") {
            templateBraceCount--;
          }
          tokens2.push(consumeOp());
        } else if (inTemplate() || _Lexer.isReservedChar(currentChar())) {
          tokens2.push(makeToken("RESERVED", consumeChar()));
        } else {
          if (position < source.length) {
            throw Error("Unknown token: " + currentChar() + " ");
          }
        }
      }
    }
    return new Tokens2(tokens2, [], source);
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

// src/core/parser-helper.js
var ParserHelper = class {
  /**
   * @param {import('./parser.js').Parser} parser
   * @param {import('./tokens.js').Tokens} tokens
   */
  constructor(parser, tokens2) {
    this.parser = parser;
    this.tokens = tokens2;
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
  matchAnyOpToken(op1, op2, op3) {
    return this.tokens.matchAnyOpToken(op1, op2, op3);
  }
  matchAnyToken(op1, op2, op3) {
    return this.tokens.matchAnyToken(op1, op2, op3);
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
    this.addGrammarElement("feature", function(helper2) {
      if (helper2.matchOpToken("(")) {
        var featureElement = helper2.requireElement("feature");
        helper2.requireOpToken(")");
        return featureElement;
      }
      var featureDefinition = helper2.FEATURES[helper2.currentToken().value || ""];
      if (featureDefinition) {
        return featureDefinition(helper2);
      }
    });
    this.addGrammarElement("command", function(helper2) {
      if (helper2.matchOpToken("(")) {
        const commandElement2 = helper2.requireElement("command");
        helper2.requireOpToken(")");
        return commandElement2;
      }
      var commandDefinition = helper2.COMMANDS[helper2.currentToken().value || ""];
      let commandElement;
      if (commandDefinition) {
        commandElement = commandDefinition(helper2);
      } else if (helper2.currentToken().type === "IDENTIFIER") {
        commandElement = helper2.parseElement("pseudoCommand");
      }
      if (commandElement) {
        return helper2.parser.parseElement("indirectStatement", helper2.tokens, commandElement);
      }
      return commandElement;
    });
    this.addGrammarElement("commandList", function(helper2) {
      if (helper2.hasMore()) {
        var cmd = helper2.parseElement("command");
        if (cmd) {
          helper2.matchToken("then");
          const next = helper2.parseElement("commandList");
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
    this.addGrammarElement("leaf", function(helper2) {
      var result = helper2.parseAnyOf(helper2.LEAF_EXPRESSIONS);
      if (result == null) {
        return helper2.parseElement("symbol");
      }
      return result;
    });
    this.addGrammarElement("indirectExpression", function(helper2, root) {
      for (var i = 0; i < helper2.INDIRECT_EXPRESSIONS.length; i++) {
        var indirect = helper2.INDIRECT_EXPRESSIONS[i];
        root.endToken = helper2.lastMatch();
        var result = helper2.parser.parseElement(indirect, helper2.tokens, root);
        if (result) {
          return result;
        }
      }
      return root;
    });
    this.addGrammarElement("indirectStatement", function(helper2, root) {
      if (helper2.matchToken("unless")) {
        root.endToken = helper2.lastMatch();
        var conditional = helper2.requireElement("expression");
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
    this.addGrammarElement("primaryExpression", function(helper2) {
      var leaf = helper2.parseElement("leaf");
      if (leaf) {
        return helper2.parser.parseElement("indirectExpression", helper2.tokens, leaf);
      }
      helper2.raiseParseError("Unexpected value: " + helper2.currentToken().value);
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
  initElt(parseElement, start, tokens2) {
    parseElement.startToken = start;
    parseElement.sourceFor = Tokens2.sourceFor;
    parseElement.lineFor = Tokens2.lineFor;
    parseElement.programSource = tokens2.source;
  }
  /**
   * @param {string} type
   * @param {Tokens} tokens
   * @param {ASTNode?} root
   * @returns {ASTNode}
   */
  parseElement(type, tokens2, root = void 0) {
    var elementDefinition = this.GRAMMAR[type];
    if (elementDefinition) {
      var start = tokens2.currentToken();
      var helper2 = new ParserHelper(this, tokens2);
      var parseElement = elementDefinition(helper2, root);
      if (parseElement) {
        this.initElt(parseElement, start, tokens2);
        parseElement.endToken = parseElement.endToken || tokens2.lastMatch();
        var root = parseElement.root;
        while (root != null) {
          this.initElt(root, start, tokens2);
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
  requireElement(type, tokens2, message, root) {
    var result = this.parseElement(type, tokens2, root);
    if (!result) _Parser.raiseParseError(tokens2, message || "Expected " + type);
    return result;
  }
  /**
   * @param {string[]} types
   * @param {Tokens} tokens
   * @param {Runtime} [runtime]
   * @returns {ASTNode}
   */
  parseAnyOf(types, tokens2) {
    for (var i = 0; i < types.length; i++) {
      var type = types[i];
      var expression = this.parseElement(type, tokens2);
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
    var commandDefinitionWrapper = function(helper2) {
      const commandElement = definition(helper2);
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
    var featureDefinitionWrapper = function(helper2) {
      var featureElement = definition(helper2);
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
  static createParserContext(tokens2) {
    var currentToken = tokens2.currentToken();
    var source = tokens2.source;
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
  static raiseParseError(tokens2, message) {
    message = (message || "Unexpected Token : " + tokens2.currentToken().value) + "\n\n" + _Parser.createParserContext(tokens2);
    var error = new Error(message);
    error["tokens"] = tokens2;
    throw error;
  }
  /**
   * @param {Tokens} tokens
   * @param {string} [message]
   */
  raiseParseError(tokens2, message) {
    _Parser.raiseParseError(tokens2, message);
  }
  /**
   * @param {Tokens} tokens
   * @returns {ASTNode}
   */
  parseHyperScript(tokens2) {
    var result = this.parseElement("hyperscript", tokens2);
    if (tokens2.hasMore()) this.raiseParseError(tokens2);
    if (result) return result;
  }
  /**
   * @param {Lexer} lexer
   * @param {string} src
   * @returns {ASTNode}
   */
  parse(lexer, src) {
    var tokens2 = lexer.tokenize(src);
    if (this.commandStart(tokens2.currentToken())) {
      var commandList = this.requireElement("commandList", tokens2);
      if (tokens2.hasMore()) _Parser.raiseParseError(tokens2);
      this.ensureTerminated(commandList);
      return commandList;
    } else if (this.featureStart(tokens2.currentToken())) {
      var hyperscript = this.requireElement("hyperscript", tokens2);
      if (tokens2.hasMore()) _Parser.raiseParseError(tokens2);
      return hyperscript;
    } else {
      var expression = this.requireElement("expression", tokens2);
      if (tokens2.hasMore()) _Parser.raiseParseError(tokens2);
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
  parseStringTemplate(tokens2) {
    var returnArr = [""];
    do {
      returnArr.push(tokens2.lastWhitespace());
      if (tokens2.currentToken().value === "$") {
        tokens2.consumeToken();
        var startingBrace = tokens2.matchOpToken("{");
        returnArr.push(this.requireElement("expression", tokens2));
        if (startingBrace) {
          tokens2.requireOpToken("}");
        }
        returnArr.push("");
      } else if (tokens2.currentToken().value === "\\") {
        tokens2.consumeToken();
        tokens2.consumeToken();
      } else {
        var token = tokens2.consumeToken();
        returnArr[returnArr.length - 1] += token ? token.value : "";
      }
    } while (tokens2.hasMore());
    returnArr.push(tokens2.lastWhitespace());
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
  parser.addLeafExpression("parenthesized", function(helper2) {
    if (helper2.matchOpToken("(")) {
      var follows = helper2.clearFollows();
      try {
        var expr = helper2.requireElement("expression");
      } finally {
        helper2.restoreFollows(follows);
      }
      helper2.requireOpToken(")");
      return expr;
    }
  });
  parser.addLeafExpression("string", function(helper2) {
    var stringToken = helper2.matchTokenType("STRING");
    if (!stringToken) return;
    var rawValue = (
      /** @type {string} */
      stringToken.value
    );
    var args;
    if (stringToken.template) {
      var innerTokens = Lexer.tokenize(rawValue, true);
      args = helper2.parser.parseStringTemplate(innerTokens);
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
  parser.addGrammarElement("nakedString", function(helper2) {
    if (helper2.hasMore()) {
      var tokenArr = helper2.consumeUntilWhitespace();
      helper2.matchTokenType("WHITESPACE");
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
  parser.addLeafExpression("number", function(helper2) {
    var number = helper2.matchTokenType("NUMBER");
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
  parser.addLeafExpression("idRef", function(helper2) {
    var elementId = helper2.matchTokenType("ID_REF");
    if (!elementId) return;
    if (!elementId.value) return;
    if (elementId.template) {
      var templateValue = elementId.value.substring(2);
      var innerTokens = Lexer.tokenize(templateValue);
      var innerExpression = helper2.parser.requireElement("expression", innerTokens);
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
  parser.addLeafExpression("classRef", function(helper2) {
    var classRef = helper2.matchTokenType("CLASS_REF");
    if (!classRef) return;
    if (!classRef.value) return;
    if (classRef.template) {
      var templateValue = classRef.value.substring(2);
      var innerTokens = Lexer.tokenize(templateValue);
      var innerExpression = helper2.parser.requireElement("expression", innerTokens);
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
  parser.addLeafExpression("queryRef", function(helper2) {
    var queryStart = helper2.matchOpToken("<");
    if (!queryStart) return;
    var queryTokens = helper2.consumeUntil("/");
    helper2.requireOpToken("/");
    helper2.requireOpToken(">");
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
      args = helper2.parser.parseStringTemplate(innerTokens);
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
  parser.addLeafExpression("attributeRef", function(helper2) {
    var attributeRef = helper2.matchTokenType("ATTRIBUTE_REF");
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
  parser.addLeafExpression("styleRef", function(helper2) {
    var styleRef = helper2.matchTokenType("STYLE_REF");
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
  parser.addGrammarElement("objectKey", function(helper2) {
    var token;
    if (token = helper2.matchTokenType("STRING")) {
      return {
        type: "objectKey",
        key: token.value,
        evaluate: function() {
          return token.value;
        }
      };
    } else if (helper2.matchOpToken("[")) {
      var expr = helper2.parseElement("expression");
      helper2.requireOpToken("]");
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
        token = helper2.matchTokenType("IDENTIFIER") || helper2.matchOpToken("-");
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
  parser.addLeafExpression("objectLiteral", function(helper2) {
    if (!helper2.matchOpToken("{")) return;
    var keyExpressions = [];
    var valueExpressions = [];
    if (!helper2.matchOpToken("}")) {
      do {
        var name = helper2.requireElement("objectKey");
        helper2.requireOpToken(":");
        var value = helper2.requireElement("expression");
        valueExpressions.push(value);
        keyExpressions.push(name);
      } while (helper2.matchOpToken(",") && !helper2.peekToken("}", 0, "R_BRACE"));
      helper2.requireOpToken("}");
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
  parser.addGrammarElement("nakedNamedArgumentList", function(helper2) {
    var fields = [];
    var valueExpressions = [];
    if (helper2.currentToken().type === "IDENTIFIER") {
      do {
        var name = helper2.requireTokenType("IDENTIFIER");
        helper2.requireOpToken(":");
        var value = helper2.requireElement("expression");
        valueExpressions.push(value);
        fields.push({ name, value });
      } while (helper2.matchOpToken(","));
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
  parser.addGrammarElement("namedArgumentList", function(helper2) {
    if (!helper2.matchOpToken("(")) return;
    var elt = helper2.requireElement("nakedNamedArgumentList");
    helper2.requireOpToken(")");
    return elt;
  });
  parser.addGrammarElement("symbol", function(helper2) {
    var scope = "default";
    if (helper2.matchToken("global")) {
      scope = "global";
    } else if (helper2.matchToken("element") || helper2.matchToken("module")) {
      scope = "element";
      if (helper2.matchOpToken("'")) {
        helper2.requireToken("s");
      }
    } else if (helper2.matchToken("local")) {
      scope = "local";
    }
    let eltPrefix = helper2.matchOpToken(":");
    let identifier = helper2.matchTokenType("IDENTIFIER");
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
  parser.addGrammarElement("implicitMeTarget", function(helper2) {
    return {
      type: "implicitMeTarget",
      evaluate: function(context2) {
        return context2.you || context2.me;
      }
    };
  });
  parser.addLeafExpression("boolean", function(helper2) {
    var booleanLiteral = helper2.matchToken("true") || helper2.matchToken("false");
    if (!booleanLiteral) return;
    const value = booleanLiteral.value === "true";
    return {
      type: "boolean",
      evaluate: function(context2) {
        return value;
      }
    };
  });
  parser.addLeafExpression("null", function(helper2) {
    if (helper2.matchToken("null")) {
      return {
        type: "null",
        evaluate: function(context2) {
          return null;
        }
      };
    }
  });
  parser.addLeafExpression("arrayLiteral", function(helper2) {
    if (!helper2.matchOpToken("[")) return;
    var values = [];
    if (!helper2.matchOpToken("]")) {
      do {
        var expr = helper2.requireElement("expression");
        values.push(expr);
      } while (helper2.matchOpToken(","));
      helper2.requireOpToken("]");
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
  parser.addLeafExpression("blockLiteral", function(helper2) {
    if (!helper2.matchOpToken("\\")) return;
    var args = [];
    var arg1 = helper2.matchTokenType("IDENTIFIER");
    if (arg1) {
      args.push(arg1);
      while (helper2.matchOpToken(",")) {
        args.push(helper2.requireTokenType("IDENTIFIER"));
      }
    }
    helper2.requireOpToken("-");
    helper2.requireOpToken(">");
    var expr = helper2.requireElement("expression");
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
  parser.addIndirectExpression("propertyAccess", function(helper2, root) {
    if (!helper2.matchOpToken(".")) return;
    var prop = helper2.requireTokenType("IDENTIFIER");
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
    return helper2.parser.parseElement("indirectExpression", helper2.tokens, propertyAccess);
  });
  parser.addIndirectExpression("of", function(helper2, root) {
    if (!helper2.matchToken("of")) return;
    var newRoot = helper2.requireElement("unaryExpression");
    var childOfUrRoot = null;
    var urRoot = root;
    while (urRoot.root) {
      childOfUrRoot = urRoot;
      urRoot = urRoot.root;
    }
    if (urRoot.type !== "symbol" && urRoot.type !== "attributeRef" && urRoot.type !== "styleRef" && urRoot.type !== "computedStyleRef") {
      helper2.raiseParseError("Cannot take a property of a non-symbol: " + urRoot.type);
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
    return helper2.parser.parseElement("indirectExpression", helper2.tokens, root);
  });
  parser.addIndirectExpression("possessive", function(helper2, root) {
    if (helper2.possessivesDisabled) {
      return;
    }
    var apostrophe = helper2.matchOpToken("'");
    if (apostrophe || root.type === "symbol" && (root.name === "my" || root.name === "its" || root.name === "your") && (helper2.currentToken().type === "IDENTIFIER" || helper2.currentToken().type === "ATTRIBUTE_REF" || helper2.currentToken().type === "STYLE_REF")) {
      if (apostrophe) {
        helper2.requireToken("s");
      }
      var attribute, style, prop;
      attribute = helper2.parseElement("attributeRef");
      if (attribute == null) {
        style = helper2.parseElement("styleRef");
        if (style == null) {
          prop = helper2.requireTokenType("IDENTIFIER");
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
      return helper2.parser.parseElement("indirectExpression", helper2.tokens, propertyAccess);
    }
  });
  parser.addIndirectExpression("inExpression", function(helper2, root) {
    if (!helper2.matchToken("in")) return;
    var target = helper2.requireElement("unaryExpression");
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
    return helper2.parser.parseElement("indirectExpression", helper2.tokens, propertyAccess);
  });
  parser.addIndirectExpression("asExpression", function(helper2, root) {
    if (!helper2.matchToken("as")) return;
    helper2.matchToken("a") || helper2.matchToken("an");
    var conversion = helper2.requireElement("dotOrColonPath").evaluate();
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
    return helper2.parser.parseElement("indirectExpression", helper2.tokens, propertyAccess);
  });
  parser.addIndirectExpression("functionCall", function(helper2, root) {
    if (!helper2.matchOpToken("(")) return;
    var args = [];
    if (!helper2.matchOpToken(")")) {
      do {
        args.push(helper2.requireElement("expression"));
      } while (helper2.matchOpToken(","));
      helper2.requireOpToken(")");
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
    return helper2.parser.parseElement("indirectExpression", helper2.tokens, functionCall);
  });
  parser.addIndirectExpression("attributeRefAccess", function(helper2, root) {
    var attribute = helper2.parseElement("attributeRef");
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
  parser.addIndirectExpression("arrayIndex", function(helper2, root) {
    if (!helper2.matchOpToken("[")) return;
    var andBefore = false;
    var andAfter = false;
    var firstIndex = null;
    var secondIndex = null;
    if (helper2.matchOpToken("..")) {
      andBefore = true;
      firstIndex = helper2.requireElement("expression");
    } else {
      firstIndex = helper2.requireElement("expression");
      if (helper2.matchOpToken("..")) {
        andAfter = true;
        var current = helper2.currentToken();
        if (current.type !== "R_BRACKET") {
          secondIndex = helper2.parseElement("expression");
        }
      }
    }
    helper2.requireOpToken("]");
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
    return helper2.parser.parseElement("indirectExpression", helper2.tokens, arrayIndex);
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
  parser.addGrammarElement("postfixExpression", function(helper2) {
    var root = helper2.parseElement("negativeNumber");
    let stringPosfix = helper2.tokens.matchAnyToken.apply(helper2.tokens, STRING_POSTFIXES) || helper2.matchOpToken("%");
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
    if (helper2.matchToken("s") || helper2.matchToken("seconds")) {
      timeFactor = 1e3;
    } else if (helper2.matchToken("ms") || helper2.matchToken("milliseconds")) {
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
    if (helper2.matchOpToken(":")) {
      var typeName = helper2.requireTokenType("IDENTIFIER");
      if (!typeName.value) return;
      var nullOk = !helper2.matchOpToken("!");
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
  parser.addGrammarElement("logicalNot", function(helper2) {
    if (!helper2.matchToken("not")) return;
    var root = helper2.requireElement("unaryExpression");
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
  parser.addGrammarElement("noExpression", function(helper2) {
    if (!helper2.matchToken("no")) return;
    var root = helper2.requireElement("unaryExpression");
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
  parser.addLeafExpression("some", function(helper2) {
    if (!helper2.matchToken("some")) return;
    var root = helper2.requireElement("expression");
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
  parser.addGrammarElement("negativeNumber", function(helper2) {
    if (helper2.matchOpToken("-")) {
      var root = helper2.requireElement("negativeNumber");
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
      return helper2.requireElement("primaryExpression");
    }
  });
  parser.addGrammarElement("unaryExpression", function(helper2) {
    helper2.matchToken("the");
    return helper2.parseAnyOf(["beepExpression", "logicalNot", "relativePositionalExpression", "positionalExpression", "noExpression", "postfixExpression"]);
  });
  parser.addGrammarElement("beepExpression", function(helper2) {
    if (!helper2.matchToken("beep!")) return;
    var expression = helper2.parseElement("unaryExpression");
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
  parser.addGrammarElement("relativePositionalExpression", function(helper2) {
    var op = helper2.matchAnyToken("next", "previous");
    if (!op) return;
    var forwardSearch = op.value === "next";
    var thingElt = helper2.parseElement("expression");
    if (helper2.matchToken("from")) {
      helper2.pushFollow("in");
      try {
        var from = helper2.requireElement("unaryExpression");
      } finally {
        helper2.popFollow();
      }
    } else {
      var from = helper2.requireElement("implicitMeTarget");
    }
    var inSearch = false;
    var withinElt;
    if (helper2.matchToken("in")) {
      inSearch = true;
      var inElt = helper2.requireElement("unaryExpression");
    } else if (helper2.matchToken("within")) {
      withinElt = helper2.requireElement("unaryExpression");
    } else {
      withinElt = document.body;
    }
    var wrapping = false;
    if (helper2.matchToken("with")) {
      helper2.requireToken("wrapping");
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
  parser.addGrammarElement("positionalExpression", function(helper2) {
    var op = helper2.matchAnyToken("first", "last", "random");
    if (!op) return;
    helper2.matchAnyToken("in", "from", "of");
    var rhs = helper2.requireElement("unaryExpression");
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
  parser.addGrammarElement("mathOperator", function(helper2) {
    var expr = helper2.parseElement("unaryExpression");
    var mathOp, initialMathOp = null;
    mathOp = helper2.matchAnyOpToken("+", "-", "*", "/") || helper2.matchToken("mod");
    while (mathOp) {
      initialMathOp = initialMathOp || mathOp;
      var operator = mathOp.value;
      if (initialMathOp.value !== operator) {
        helper2.raiseParseError("You must parenthesize math operations with different operators");
      }
      var rhs = helper2.parseElement("unaryExpression");
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
      mathOp = helper2.matchAnyOpToken("+", "-", "*", "/") || helper2.matchToken("mod");
    }
    return expr;
  });
  parser.addGrammarElement("mathExpression", function(helper2) {
    return helper2.parseAnyOf(["mathOperator", "unaryExpression"]);
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
  parser.addGrammarElement("comparisonOperator", function(helper2) {
    var expr = helper2.parseElement("mathExpression");
    var comparisonToken = helper2.matchAnyOpToken("<", ">", "<=", ">=", "==", "===", "!=", "!==");
    var operator = comparisonToken ? comparisonToken.value : null;
    var hasRightValue = true;
    var typeCheck = false;
    if (operator == null) {
      if (helper2.matchToken("is") || helper2.matchToken("am")) {
        if (helper2.matchToken("not")) {
          if (helper2.matchToken("in")) {
            operator = "not in";
          } else if (helper2.matchToken("a") || helper2.matchToken("an")) {
            operator = "not a";
            typeCheck = true;
          } else if (helper2.matchToken("empty")) {
            operator = "not empty";
            hasRightValue = false;
          } else {
            if (helper2.matchToken("really")) {
              operator = "!==";
            } else {
              operator = "!=";
            }
            if (helper2.matchToken("equal")) {
              helper2.matchToken("to");
            }
          }
        } else if (helper2.matchToken("in")) {
          operator = "in";
        } else if (helper2.matchToken("a") || helper2.matchToken("an")) {
          operator = "a";
          typeCheck = true;
        } else if (helper2.matchToken("empty")) {
          operator = "empty";
          hasRightValue = false;
        } else if (helper2.matchToken("less")) {
          helper2.requireToken("than");
          if (helper2.matchToken("or")) {
            helper2.requireToken("equal");
            helper2.requireToken("to");
            operator = "<=";
          } else {
            operator = "<";
          }
        } else if (helper2.matchToken("greater")) {
          helper2.requireToken("than");
          if (helper2.matchToken("or")) {
            helper2.requireToken("equal");
            helper2.requireToken("to");
            operator = ">=";
          } else {
            operator = ">";
          }
        } else {
          if (helper2.matchToken("really")) {
            operator = "===";
          } else {
            operator = "==";
          }
          if (helper2.matchToken("equal")) {
            helper2.matchToken("to");
          }
        }
      } else if (helper2.matchToken("equals")) {
        operator = "==";
      } else if (helper2.matchToken("really")) {
        helper2.requireToken("equals");
        operator = "===";
      } else if (helper2.matchToken("exist") || helper2.matchToken("exists")) {
        operator = "exist";
        hasRightValue = false;
      } else if (helper2.matchToken("matches") || helper2.matchToken("match")) {
        operator = "match";
      } else if (helper2.matchToken("contains") || helper2.matchToken("contain")) {
        operator = "contain";
      } else if (helper2.matchToken("includes") || helper2.matchToken("include")) {
        operator = "include";
      } else if (helper2.matchToken("do") || helper2.matchToken("does")) {
        helper2.requireToken("not");
        if (helper2.matchToken("matches") || helper2.matchToken("match")) {
          operator = "not match";
        } else if (helper2.matchToken("contains") || helper2.matchToken("contain")) {
          operator = "not contain";
        } else if (helper2.matchToken("exist") || helper2.matchToken("exist")) {
          operator = "not exist";
          hasRightValue = false;
        } else if (helper2.matchToken("include")) {
          operator = "not include";
        } else {
          helper2.raiseParseError("Expected matches or contains");
        }
      }
    }
    if (operator) {
      var typeName, nullOk, rhs;
      if (typeCheck) {
        typeName = helper2.requireTokenType("IDENTIFIER");
        nullOk = !helper2.matchOpToken("!");
      } else if (hasRightValue) {
        rhs = helper2.requireElement("mathExpression");
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
  parser.addGrammarElement("comparisonExpression", function(helper2) {
    return helper2.parseAnyOf(["comparisonOperator", "mathExpression"]);
  });
  parser.addGrammarElement("logicalOperator", function(helper2) {
    var expr = helper2.parseElement("comparisonExpression");
    var logicalOp, initialLogicalOp = null;
    logicalOp = helper2.matchToken("and") || helper2.matchToken("or");
    while (logicalOp) {
      initialLogicalOp = initialLogicalOp || logicalOp;
      if (initialLogicalOp.value !== logicalOp.value) {
        helper2.raiseParseError("You must parenthesize logical operations with different operators");
      }
      var rhs = helper2.requireElement("comparisonExpression");
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
      logicalOp = helper2.matchToken("and") || helper2.matchToken("or");
    }
    return expr;
  });
  parser.addGrammarElement("logicalExpression", function(helper2) {
    return helper2.parseAnyOf(["logicalOperator", "mathExpression"]);
  });
  parser.addGrammarElement("asyncExpression", function(helper2) {
    if (helper2.matchToken("async")) {
      var value = helper2.requireElement("logicalExpression");
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
      return helper2.parseElement("logicalExpression");
    }
  });
  parser.addGrammarElement("expression", function(helper2) {
    helper2.matchToken("the");
    return helper2.parseElement("asyncExpression");
  });
  parser.addGrammarElement("assignableExpression", function(helper2) {
    helper2.matchToken("the");
    var expr = helper2.parseElement("primaryExpression");
    if (expr && (expr.type === "symbol" || expr.type === "ofExpression" || expr.type === "propertyAccess" || expr.type === "attributeRefAccess" || expr.type === "attributeRef" || expr.type === "styleRef" || expr.type === "arrayIndex" || expr.type === "possessive")) {
      return expr;
    } else {
      helper2.raiseParseError(
        "A target expression must be writable.  The expression type '" + (expr && expr.type) + "' is not."
      );
    }
    return expr;
  });
  parser.addGrammarElement("hyperscript", function(helper2) {
    var features = [];
    if (helper2.hasMore()) {
      while (helper2.featureStart(helper2.currentToken()) || helper2.currentToken().value === "(") {
        var feature = helper2.requireElement("feature");
        features.push(feature);
        helper2.matchToken("end");
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
  var parseEventArgs = function(helper2) {
    var args = [];
    if (helper2.token(0).value === "(" && (helper2.token(1).value === ")" || helper2.token(2).value === "," || helper2.token(2).value === ")")) {
      helper2.matchOpToken("(");
      do {
        args.push(helper2.requireTokenType("IDENTIFIER"));
      } while (helper2.matchOpToken(","));
      helper2.requireOpToken(")");
    }
    return args;
  };
  parser.addFeature("on", function(helper2) {
    if (!helper2.matchToken("on")) return;
    var every = false;
    if (helper2.matchToken("every")) {
      every = true;
    }
    var events = [];
    var displayName = null;
    do {
      var on = helper2.requireElement("eventName", "Expected event name");
      var eventName = on.evaluate();
      if (displayName) {
        displayName = displayName + " or " + eventName;
      } else {
        displayName = "on " + eventName;
      }
      var args = parseEventArgs(helper2);
      var filter = null;
      if (helper2.matchOpToken("[")) {
        filter = helper2.requireElement("expression");
        helper2.requireOpToken("]");
      }
      var startCount, endCount, unbounded;
      if (helper2.currentToken().type === "NUMBER") {
        var startCountToken = helper2.consumeToken();
        if (!startCountToken.value) return;
        startCount = parseInt(startCountToken.value);
        if (helper2.matchToken("to")) {
          var endCountToken = helper2.consumeToken();
          if (!endCountToken.value) return;
          endCount = parseInt(endCountToken.value);
        } else if (helper2.matchToken("and")) {
          unbounded = true;
          helper2.requireToken("on");
        }
      }
      var intersectionSpec, mutationSpec;
      if (eventName === "intersection") {
        intersectionSpec = {};
        if (helper2.matchToken("with")) {
          intersectionSpec["with"] = helper2.requireElement("expression").evaluate();
        }
        if (helper2.matchToken("having")) {
          do {
            if (helper2.matchToken("margin")) {
              intersectionSpec["rootMargin"] = helper2.requireElement("stringLike").evaluate();
            } else if (helper2.matchToken("threshold")) {
              intersectionSpec["threshold"] = helper2.requireElement("expression").evaluate();
            } else {
              helper2.raiseParseError("Unknown intersection config specification");
            }
          } while (helper2.matchToken("and"));
        }
      } else if (eventName === "mutation") {
        mutationSpec = {};
        if (helper2.matchToken("of")) {
          do {
            if (helper2.matchToken("anything")) {
              mutationSpec["attributes"] = true;
              mutationSpec["subtree"] = true;
              mutationSpec["characterData"] = true;
              mutationSpec["childList"] = true;
            } else if (helper2.matchToken("childList")) {
              mutationSpec["childList"] = true;
            } else if (helper2.matchToken("attributes")) {
              mutationSpec["attributes"] = true;
              mutationSpec["attributeOldValue"] = true;
            } else if (helper2.matchToken("subtree")) {
              mutationSpec["subtree"] = true;
            } else if (helper2.matchToken("characterData")) {
              mutationSpec["characterData"] = true;
              mutationSpec["characterDataOldValue"] = true;
            } else if (helper2.currentToken().type === "ATTRIBUTE_REF") {
              var attribute = helper2.consumeToken();
              if (mutationSpec["attributeFilter"] == null) {
                mutationSpec["attributeFilter"] = [];
              }
              if (attribute.value.indexOf("@") == 0) {
                mutationSpec["attributeFilter"].push(attribute.value.substring(1));
              } else {
                helper2.raiseParseError(
                  "Only shorthand attribute references are allowed here"
                );
              }
            } else {
              helper2.raiseParseError("Unknown mutation config specification");
            }
          } while (helper2.matchToken("or"));
        } else {
          mutationSpec["attributes"] = true;
          mutationSpec["characterData"] = true;
          mutationSpec["childList"] = true;
        }
      }
      var from = null;
      var elsewhere = false;
      if (helper2.matchToken("from")) {
        if (helper2.matchToken("elsewhere")) {
          elsewhere = true;
        } else {
          helper2.pushFollow("or");
          try {
            from = helper2.requireElement("expression");
          } finally {
            helper2.popFollow();
          }
          if (!from) {
            helper2.raiseParseError('Expected either target value or "elsewhere".');
          }
        }
      }
      if (from === null && elsewhere === false && helper2.matchToken("elsewhere")) {
        elsewhere = true;
      }
      if (helper2.matchToken("in")) {
        var inExpr = helper2.parseElement("unaryExpression");
      }
      if (helper2.matchToken("debounced")) {
        helper2.requireToken("at");
        var timeExpr = helper2.requireElement("unaryExpression");
        var debounceTime = timeExpr.evaluate({});
      } else if (helper2.matchToken("throttled")) {
        helper2.requireToken("at");
        var timeExpr = helper2.requireElement("unaryExpression");
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
    } while (helper2.matchToken("or"));
    var queueLast = true;
    if (!every) {
      if (helper2.matchToken("queue")) {
        if (helper2.matchToken("all")) {
          var queueAll = true;
          var queueLast = false;
        } else if (helper2.matchToken("first")) {
          var queueFirst = true;
        } else if (helper2.matchToken("none")) {
          var queueNone = true;
        } else {
          helper2.requireToken("last");
        }
      }
    }
    var start = helper2.requireElement("commandList");
    parser.ensureTerminated(start);
    var errorSymbol, errorHandler;
    if (helper2.matchToken("catch")) {
      errorSymbol = helper2.requireTokenType("IDENTIFIER").value;
      errorHandler = helper2.requireElement("commandList");
      parser.ensureTerminated(errorHandler);
    }
    if (helper2.matchToken("finally")) {
      var finallyHandler = helper2.requireElement("commandList");
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
    helper2.setParent(start, onFeature);
    return onFeature;
  });
  parser.addFeature("def", function(helper2) {
    if (!helper2.matchToken("def")) return;
    var functionName = helper2.requireElement("dotOrColonPath");
    var nameVal = functionName.evaluate();
    var nameSpace = nameVal.split(".");
    var funcName = nameSpace.pop();
    var args = [];
    if (helper2.matchOpToken("(")) {
      if (helper2.matchOpToken(")")) {
      } else {
        do {
          args.push(helper2.requireTokenType("IDENTIFIER"));
        } while (helper2.matchOpToken(","));
        helper2.requireOpToken(")");
      }
    }
    var start = helper2.requireElement("commandList");
    var errorSymbol, errorHandler;
    if (helper2.matchToken("catch")) {
      errorSymbol = helper2.requireTokenType("IDENTIFIER").value;
      errorHandler = helper2.parseElement("commandList");
    }
    if (helper2.matchToken("finally")) {
      var finallyHandler = helper2.requireElement("commandList");
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
    helper2.setParent(start, functionFeature);
    return functionFeature;
  });
  parser.addFeature("set", function(helper2) {
    let setCmd = helper2.parseElement("setCommand");
    if (setCmd) {
      if (setCmd.target.scope !== "element") {
        helper2.raiseParseError("variables declared at the feature level must be element scoped.");
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
  parser.addFeature("init", function(helper2) {
    if (!helper2.matchToken("init")) return;
    var immediately = helper2.matchToken("immediately");
    var start = helper2.requireElement("commandList");
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
    helper2.setParent(start, initFeature);
    return initFeature;
  });
  parser.addFeature("worker", function(helper2) {
    if (helper2.matchToken("worker")) {
      helper2.raiseParseError(
        "In order to use the 'worker' feature, include the _hyperscript worker plugin. See https://hyperscript.org/features/worker/ for more info."
      );
      return void 0;
    }
  });
  parser.addFeature("behavior", function(helper2) {
    if (!helper2.matchToken("behavior")) return;
    var path = helper2.requireElement("dotOrColonPath").evaluate();
    var nameSpace = path.split(".");
    var name = nameSpace.pop();
    var formalParams = [];
    if (helper2.matchOpToken("(") && !helper2.matchOpToken(")")) {
      do {
        formalParams.push(helper2.requireTokenType("IDENTIFIER").value);
      } while (helper2.matchOpToken(","));
      helper2.requireOpToken(")");
    }
    var hs = helper2.requireElement("hyperscript");
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
  parser.addFeature("install", function(helper2) {
    if (!helper2.matchToken("install")) return;
    var behaviorPath = helper2.requireElement("dotOrColonPath").evaluate();
    var behaviorNamespace = behaviorPath.split(".");
    var args = helper2.parseElement("namedArgumentList");
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
  parser.addGrammarElement("jsBody", function(helper2) {
    var jsSourceStart = helper2.currentToken().start;
    var jsLastToken = helper2.currentToken();
    var funcNames = [];
    var funcName = "";
    var expectFunctionDeclaration = false;
    while (helper2.hasMore()) {
      jsLastToken = helper2.consumeToken();
      var peek = helper2.token(0, true);
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
      jsSource: helper2.source.substring(jsSourceStart, jsSourceEnd)
    };
  });
  parser.addFeature("js", function(helper2) {
    if (!helper2.matchToken("js")) return;
    var jsBody = helper2.requireElement("jsBody");
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
  parser.addCommand("js", function(helper2) {
    if (!helper2.matchToken("js")) return;
    var inputs = [];
    if (helper2.matchOpToken("(")) {
      if (helper2.matchOpToken(")")) {
      } else {
        do {
          var inp = helper2.requireTokenType("IDENTIFIER");
          inputs.push(inp.value);
        } while (helper2.matchOpToken(","));
        helper2.requireOpToken(")");
      }
    }
    var jsBody = helper2.requireElement("jsBody");
    helper2.matchToken("end");
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
  parser.addCommand("async", function(helper2) {
    if (!helper2.matchToken("async")) return;
    if (helper2.matchToken("do")) {
      var body = helper2.requireElement("commandList");
      var end = body;
      while (end.next) end = end.next;
      end.next = Runtime.HALT;
      helper2.requireToken("end");
    } else {
      var body = helper2.requireElement("command");
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
    helper2.setParent(body, command);
    return command;
  });
  parser.addCommand("tell", function(helper2) {
    var startToken = helper2.currentToken();
    if (!helper2.matchToken("tell")) return;
    var value = helper2.requireElement("expression");
    var body = helper2.requireElement("commandList");
    if (helper2.hasMore() && !helper2.featureStart(helper2.currentToken())) {
      helper2.requireToken("end");
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
    helper2.setParent(body, tellCmd);
    return tellCmd;
  });
  parser.addCommand("wait", function(helper2) {
    if (!helper2.matchToken("wait")) return;
    var command;
    if (helper2.matchToken("for")) {
      helper2.matchToken("a");
      var events = [];
      do {
        var lookahead = helper2.token(0);
        if (lookahead.type === "NUMBER" || lookahead.type === "L_PAREN") {
          events.push({
            time: helper2.requireElement("expression").evaluate()
            // TODO: do we want to allow async here?
          });
        } else {
          events.push({
            name: helper2.requireElement("dotOrColonPath", "Expected event name").evaluate(),
            args: parseEventArgs(helper2)
          });
        }
      } while (helper2.matchToken("or"));
      if (helper2.matchToken("from")) {
        var on = helper2.requireElement("expression");
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
      if (helper2.matchToken("a")) {
        helper2.requireToken("tick");
        time = 0;
      } else {
        time = helper2.requireElement("expression");
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
  parser.addGrammarElement("dotOrColonPath", function(helper2) {
    var root = helper2.matchTokenType("IDENTIFIER");
    if (root) {
      var path = [root.value];
      var separator = helper2.matchOpToken(".") || helper2.matchOpToken(":");
      if (separator) {
        do {
          path.push(helper2.requireTokenType("IDENTIFIER", "NUMBER").value);
        } while (helper2.matchOpToken(separator.value));
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
  parser.addGrammarElement("eventName", function(helper2) {
    var token;
    if (token = helper2.matchTokenType("STRING")) {
      return {
        evaluate: function() {
          return token.value;
        }
      };
    }
    return helper2.parseElement("dotOrColonPath");
  });
  function parseSendCmd(cmdType, helper2) {
    var eventName = helper2.requireElement("eventName");
    var details = helper2.parseElement("namedArgumentList");
    if (cmdType === "send" && helper2.matchToken("to") || cmdType === "trigger" && helper2.matchToken("on")) {
      var toExpr = helper2.requireElement("expression");
    } else {
      var toExpr = helper2.requireElement("implicitMeTarget");
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
  parser.addCommand("trigger", function(helper2) {
    if (helper2.matchToken("trigger")) {
      return parseSendCmd("trigger", helper2);
    }
  });
  parser.addCommand("send", function(helper2) {
    if (helper2.matchToken("send")) {
      return parseSendCmd("send", helper2);
    }
  });
  var parseReturnFunction = function(helper2, returnAValue) {
    if (returnAValue) {
      if (helper2.commandBoundary(helper2.currentToken())) {
        helper2.raiseParseError("'return' commands must return a value.  If you do not wish to return a value, use 'exit' instead.");
      } else {
        var value = helper2.requireElement("expression");
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
  parser.addCommand("return", function(helper2) {
    if (helper2.matchToken("return")) {
      return parseReturnFunction(helper2, true);
    }
  });
  parser.addCommand("exit", function(helper2) {
    if (helper2.matchToken("exit")) {
      return parseReturnFunction(helper2, false);
    }
  });
  parser.addCommand("halt", function(helper2) {
    if (helper2.matchToken("halt")) {
      if (helper2.matchToken("the")) {
        helper2.requireToken("event");
        if (helper2.matchOpToken("'")) {
          helper2.requireToken("s");
        }
        var keepExecuting = true;
      }
      if (helper2.matchToken("bubbling")) {
        var bubbling = true;
      } else if (helper2.matchToken("default")) {
        var haltDefault = true;
      }
      var exit = parseReturnFunction(helper2, false);
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
  parser.addCommand("log", function(helper2) {
    if (!helper2.matchToken("log")) return;
    var exprs = [helper2.parseElement("expression")];
    while (helper2.matchOpToken(",")) {
      exprs.push(helper2.requireElement("expression"));
    }
    if (helper2.matchToken("with")) {
      var withExpr = helper2.requireElement("expression");
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
  parser.addCommand("beep!", function(helper2) {
    if (!helper2.matchToken("beep!")) return;
    var exprs = [helper2.parseElement("expression")];
    while (helper2.matchOpToken(",")) {
      exprs.push(helper2.requireElement("expression"));
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
  parser.addCommand("throw", function(helper2) {
    if (!helper2.matchToken("throw")) return;
    var expr = helper2.requireElement("expression");
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
  var parseCallOrGet = function(helper2) {
    var expr = helper2.requireElement("expression");
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
  parser.addCommand("call", function(helper2) {
    if (!helper2.matchToken("call")) return;
    var call = parseCallOrGet(helper2);
    if (call.expr && call.expr.type !== "functionCall") {
      helper2.raiseParseError("Must be a function invocation");
    }
    return call;
  });
  parser.addCommand("get", function(helper2) {
    if (helper2.matchToken("get")) {
      return parseCallOrGet(helper2);
    }
  });
  parser.addCommand("make", function(helper2) {
    if (!helper2.matchToken("make")) return;
    helper2.matchToken("a") || helper2.matchToken("an");
    var expr = helper2.requireElement("expression");
    var args = [];
    if (expr.type !== "queryRef" && helper2.matchToken("from")) {
      do {
        args.push(helper2.requireElement("expression"));
      } while (helper2.matchOpToken(","));
    }
    if (helper2.matchToken("called")) {
      var target = helper2.requireElement("symbol");
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
  parser.addGrammarElement("pseudoCommand", function(helper2) {
    let lookAhead = helper2.token(1);
    if (!(lookAhead && lookAhead.op && (lookAhead.value === "." || lookAhead.value === "("))) {
      return null;
    }
    var expr = helper2.requireElement("primaryExpression");
    var rootRoot = expr.root;
    var root = expr;
    while (rootRoot.root != null) {
      root = root.root;
      rootRoot = rootRoot.root;
    }
    if (expr.type !== "functionCall") {
      helper2.raiseParseError("Pseudo-commands must be function calls");
    }
    if (root.type === "functionCall" && root.root.root == null) {
      if (helper2.matchAnyToken("the", "to", "on", "with", "into", "from", "at")) {
        var realRoot = helper2.requireElement("expression");
      } else if (helper2.matchToken("me")) {
        var realRoot = helper2.requireElement("implicitMeTarget");
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
  var makeSetter = function(helper2, target, value) {
    var symbolWrite = target.type === "symbol";
    var attributeWrite = target.type === "attributeRef";
    var styleWrite = target.type === "styleRef";
    var arrayWrite = target.type === "arrayIndex";
    if (!(attributeWrite || styleWrite || symbolWrite) && target.root == null) {
      helper2.raiseParseError("Can only put directly into symbols, not references");
    }
    var rootElt = null;
    var prop = null;
    if (symbolWrite) {
    } else if (attributeWrite || styleWrite) {
      rootElt = helper2.requireElement("implicitMeTarget");
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
  parser.addCommand("default", function(helper2) {
    if (!helper2.matchToken("default")) return;
    var target = helper2.requireElement("assignableExpression");
    helper2.requireToken("to");
    var value = helper2.requireElement("expression");
    var setter = makeSetter(helper2, target, value);
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
  parser.addCommand("set", function(helper2) {
    if (!helper2.matchToken("set")) return;
    if (helper2.currentToken().type === "L_BRACE") {
      var obj = helper2.requireElement("objectLiteral");
      helper2.requireToken("on");
      var target = helper2.requireElement("expression");
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
      helper2.pushFollow("to");
      var target = helper2.requireElement("assignableExpression");
    } finally {
      helper2.popFollow();
    }
    helper2.requireToken("to");
    var value = helper2.requireElement("expression");
    return makeSetter(helper2, target, value);
  });
  parser.addCommand("if", function(helper2) {
    if (!helper2.matchToken("if")) return;
    var expr = helper2.requireElement("expression");
    helper2.matchToken("then");
    var trueBranch = helper2.parseElement("commandList");
    var nestedIfStmt = false;
    let elseToken = helper2.matchToken("else") || helper2.matchToken("otherwise");
    if (elseToken) {
      let elseIfIfToken = helper2.peekToken("if");
      nestedIfStmt = elseIfIfToken != null && elseIfIfToken.line === elseToken.line;
      if (nestedIfStmt) {
        var falseBranch = helper2.parseElement("command");
      } else {
        var falseBranch = helper2.parseElement("commandList");
      }
    }
    if (helper2.hasMore() && !nestedIfStmt) {
      helper2.requireToken("end");
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
    helper2.setParent(trueBranch, ifCmd);
    helper2.setParent(falseBranch, ifCmd);
    return ifCmd;
  });
  var parseRepeatExpression = function(helper2, startedWithForToken) {
    var innerStartToken = helper2.currentToken();
    var identifier;
    if (helper2.matchToken("for") || startedWithForToken) {
      var identifierToken = helper2.requireTokenType("IDENTIFIER");
      identifier = identifierToken.value;
      helper2.requireToken("in");
      var expression = helper2.requireElement("expression");
    } else if (helper2.matchToken("in")) {
      identifier = "it";
      var expression = helper2.requireElement("expression");
    } else if (helper2.matchToken("while")) {
      var whileExpr = helper2.requireElement("expression");
    } else if (helper2.matchToken("until")) {
      var isUntil = true;
      if (helper2.matchToken("event")) {
        var evt = helper2.requireElement("dotOrColonPath", "Expected event name");
        if (helper2.matchToken("from")) {
          var on = helper2.requireElement("expression");
        }
      } else {
        var whileExpr = helper2.requireElement("expression");
      }
    } else {
      if (!helper2.commandBoundary(helper2.currentToken()) && helper2.currentToken().value !== "forever") {
        var times = helper2.requireElement("expression");
        helper2.requireToken("times");
      } else {
        helper2.matchToken("forever");
        var forever = true;
      }
    }
    if (helper2.matchToken("index")) {
      var identifierToken = helper2.requireTokenType("IDENTIFIER");
      var indexIdentifier = identifierToken.value;
    } else if (helper2.matchToken("indexed")) {
      helper2.requireToken("by");
      var identifierToken = helper2.requireTokenType("IDENTIFIER");
      var indexIdentifier = identifierToken.value;
    }
    var loop = helper2.parseElement("commandList");
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
    if (helper2.hasMore()) {
      helper2.requireToken("end");
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
    helper2.setParent(loop, repeatCmd);
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
    helper2.setParent(repeatCmd, repeatInit);
    return repeatInit;
  };
  parser.addCommand("repeat", function(helper2) {
    if (helper2.matchToken("repeat")) {
      return parseRepeatExpression(helper2, false);
    }
  });
  parser.addCommand("for", function(helper2) {
    if (helper2.matchToken("for")) {
      return parseRepeatExpression(helper2, true);
    }
  });
  parser.addCommand("continue", function(helper2) {
    if (!helper2.matchToken("continue")) return;
    var command = {
      op: function(context2) {
        for (var parent = this.parent; true; parent = parent.parent) {
          if (parent == void 0) {
            helper2.raiseParseError("Command `continue` cannot be used outside of a `repeat` loop.");
          }
          if (parent.loop != void 0) {
            return parent.resolveNext(context2);
          }
        }
      }
    };
    return command;
  });
  parser.addCommand("break", function(helper2) {
    if (!helper2.matchToken("break")) return;
    var command = {
      op: function(context2) {
        for (var parent = this.parent; true; parent = parent.parent) {
          if (parent == void 0) {
            helper2.raiseParseError("Command `continue` cannot be used outside of a `repeat` loop.");
          }
          if (parent.loop != void 0) {
            return context2.meta.runtime.findNext(parent.parent, context2);
          }
        }
      }
    };
    return command;
  });
  parser.addGrammarElement("stringLike", function(helper2) {
    return helper2.parseAnyOf(["string", "nakedString"]);
  });
  parser.addCommand("append", function(helper2) {
    if (!helper2.matchToken("append")) return;
    var targetExpr = null;
    var value = helper2.requireElement("expression");
    var implicitResultSymbol = {
      type: "symbol",
      evaluate: function(context2) {
        return context2.meta.runtime.resolveSymbol("result", context2);
      }
    };
    if (helper2.matchToken("to")) {
      targetExpr = helper2.requireElement("expression");
    } else {
      targetExpr = implicitResultSymbol;
    }
    var setter = null;
    if (targetExpr.type === "symbol" || targetExpr.type === "attributeRef" || targetExpr.root != null) {
      setter = makeSetter(helper2, targetExpr, implicitResultSymbol);
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
  function parsePickRange(parser2, tokens2) {
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
  parser.addCommand("pick", (parser2, tokens2) => {
    if (!helper.matchToken("pick")) return;
    helper.matchToken("the");
    if (helper.matchToken("item") || helper.matchToken("items") || helper.matchToken("character") || helper.matchToken("characters")) {
      const range = parsePickRange(parser2, tokens2);
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
  parser.addCommand("increment", function(helper2) {
    if (!helper2.matchToken("increment")) return;
    var amountExpr;
    var target = helper2.parseElement("assignableExpression");
    if (helper2.matchToken("by")) {
      amountExpr = helper2.requireElement("expression");
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
    return makeSetter(helper2, target, implicitIncrementOp);
  });
  parser.addCommand("decrement", function(helper2) {
    if (!helper2.matchToken("decrement")) return;
    var amountExpr;
    var target = helper2.parseElement("assignableExpression");
    if (helper2.matchToken("by")) {
      amountExpr = helper2.requireElement("expression");
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
    return makeSetter(helper2, target, implicitDecrementOp);
  });
  function parseConversionInfo(tokens2, parser2) {
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
  parser.addCommand("fetch", function(helper2) {
    if (!helper2.matchToken("fetch")) return;
    var url = helper2.requireElement("stringLike");
    if (helper2.matchToken("as")) {
      var conversionInfo = parseConversionInfo(tokens, parser);
    }
    if (helper2.matchToken("with") && helper2.currentToken().value !== "{") {
      var args = helper2.parseElement("nakedNamedArgumentList");
    } else {
      var args = helper2.parseElement("objectLiteral");
    }
    if (conversionInfo == null && helper2.matchToken("as")) {
      conversionInfo = parseConversionInfo(tokens, parser);
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
  parser.addCommand("settle", function(helper2) {
    if (helper2.matchToken("settle")) {
      if (!helper2.commandBoundary(helper2.currentToken())) {
        var onExpr = helper2.requireElement("expression");
      } else {
        var onExpr = helper2.requireElement("implicitMeTarget");
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
  parser.addCommand("add", function(helper2) {
    if (helper2.matchToken("add")) {
      var classRef = helper2.parseElement("classRef");
      var attributeRef = null;
      var cssDeclaration = null;
      if (classRef == null) {
        attributeRef = helper2.parseElement("attributeRef");
        if (attributeRef == null) {
          cssDeclaration = helper2.parseElement("styleLiteral");
          if (cssDeclaration == null) {
            helper2.raiseParseError("Expected either a class reference or attribute expression");
          }
        }
      } else {
        var classRefs = [classRef];
        while (classRef = helper2.parseElement("classRef")) {
          classRefs.push(classRef);
        }
      }
      if (helper2.matchToken("to")) {
        var toExpr = helper2.requireElement("expression");
      } else {
        var toExpr = helper2.requireElement("implicitMeTarget");
      }
      if (helper2.matchToken("when")) {
        if (cssDeclaration) {
          helper2.raiseParseError("Only class and properties are supported with a when clause");
        }
        var when = helper2.requireElement("expression");
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
  parser.addGrammarElement("styleLiteral", function(helper2) {
    if (!helper2.matchOpToken("{")) return;
    var stringParts = [""];
    var exprs = [];
    while (helper2.hasMore()) {
      if (helper2.matchOpToken("\\")) {
        helper2.consumeToken();
      } else if (helper2.matchOpToken("}")) {
        break;
      } else if (helper2.matchToken("$")) {
        var opencurly = helper2.matchOpToken("{");
        var expr = helper2.parseElement("expression");
        if (opencurly) helper2.requireOpToken("}");
        exprs.push(expr);
        stringParts.push("");
      } else {
        var tok = helper2.consumeToken();
        stringParts[stringParts.length - 1] += helper2.source.substring(tok.start, tok.end);
      }
      stringParts[stringParts.length - 1] += helper2.lastWhitespace();
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
  parser.addCommand("remove", function(helper2) {
    if (helper2.matchToken("remove")) {
      var classRef = helper2.parseElement("classRef");
      var attributeRef = null;
      var elementExpr = null;
      if (classRef == null) {
        attributeRef = helper2.parseElement("attributeRef");
        if (attributeRef == null) {
          elementExpr = helper2.parseElement("expression");
          if (elementExpr == null) {
            helper2.raiseParseError(
              "Expected either a class reference, attribute expression or value expression"
            );
          }
        }
      } else {
        var classRefs = [classRef];
        while (classRef = helper2.parseElement("classRef")) {
          classRefs.push(classRef);
        }
      }
      if (helper2.matchToken("from")) {
        var fromExpr = helper2.requireElement("expression");
      } else {
        if (elementExpr == null) {
          var fromExpr = helper2.requireElement("implicitMeTarget");
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
  parser.addCommand("toggle", function(helper2) {
    if (helper2.matchToken("toggle")) {
      helper2.matchAnyToken("the", "my");
      if (helper2.currentToken().type === "STYLE_REF") {
        let styleRef = helper2.consumeToken();
        var name = styleRef.value.substr(1);
        var visibility = true;
        var hideShowStrategy = resolveHideShowStrategy(parser, helper2, name);
        if (helper2.matchToken("of")) {
          helper2.pushFollow("with");
          try {
            var onExpr = helper2.requireElement("expression");
          } finally {
            helper2.popFollow();
          }
        } else {
          var onExpr = helper2.requireElement("implicitMeTarget");
        }
      } else if (helper2.matchToken("between")) {
        var between = true;
        var classRef = helper2.parseElement("classRef");
        helper2.requireToken("and");
        var classRef2 = helper2.requireElement("classRef");
      } else {
        var classRef = helper2.parseElement("classRef");
        var attributeRef = null;
        if (classRef == null) {
          attributeRef = helper2.parseElement("attributeRef");
          if (attributeRef == null) {
            helper2.raiseParseError("Expected either a class reference or attribute expression");
          }
        } else {
          var classRefs = [classRef];
          while (classRef = helper2.parseElement("classRef")) {
            classRefs.push(classRef);
          }
        }
      }
      if (visibility !== true) {
        if (helper2.matchToken("on")) {
          var onExpr = helper2.requireElement("expression");
        } else {
          var onExpr = helper2.requireElement("implicitMeTarget");
        }
      }
      if (helper2.matchToken("for")) {
        var time = helper2.requireElement("expression");
      } else if (helper2.matchToken("until")) {
        var evt = helper2.requireElement("dotOrColonPath", "Expected event name");
        if (helper2.matchToken("from")) {
          var from = helper2.requireElement("expression");
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
  var parseShowHideTarget = function(helper2) {
    var target;
    var currentTokenValue = helper2.currentToken();
    if (currentTokenValue.value === "when" || currentTokenValue.value === "with" || helper2.commandBoundary(currentTokenValue)) {
      target = helper2.parseElement("implicitMeTarget");
    } else {
      target = helper2.parseElement("expression");
    }
    return target;
  };
  var resolveHideShowStrategy = function(parser2, helper2, name) {
    var configDefault = config.defaultHideShowStrategy;
    var strategies = HIDE_SHOW_STRATEGIES;
    if (config.hideShowStrategies) {
      strategies = Object.assign(strategies, config.hideShowStrategies);
    }
    name = name || configDefault || "display";
    var value = strategies[name];
    if (value == null) {
      helper2.raiseParseError("Unknown show/hide strategy : " + name);
    }
    return value;
  };
  parser.addCommand("hide", function(helper2) {
    if (helper2.matchToken("hide")) {
      var targetExpr = parseShowHideTarget(helper2);
      var name = null;
      if (helper2.matchToken("with")) {
        name = helper2.requireTokenType("IDENTIFIER", "STYLE_REF").value;
        if (name.indexOf("*") === 0) {
          name = name.substr(1);
        }
      }
      var hideShowStrategy = resolveHideShowStrategy(parser, helper2, name);
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
  parser.addCommand("show", function(helper2) {
    if (helper2.matchToken("show")) {
      var targetExpr = parseShowHideTarget(helper2);
      var name = null;
      if (helper2.matchToken("with")) {
        name = helper2.requireTokenType("IDENTIFIER", "STYLE_REF").value;
        if (name.indexOf("*") === 0) {
          name = name.substr(1);
        }
      }
      var arg = null;
      if (helper2.matchOpToken(":")) {
        var tokenArr = helper2.consumeUntilWhitespace();
        helper2.matchTokenType("WHITESPACE");
        arg = tokenArr.map(function(t) {
          return t.value;
        }).join("");
      }
      if (helper2.matchToken("when")) {
        var when = helper2.requireElement("expression");
      }
      var hideShowStrategy = resolveHideShowStrategy(parser, helper2, name);
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
  parser.addCommand("take", function(helper2) {
    if (helper2.matchToken("take")) {
      let classRef = null;
      let classRefs = [];
      while (classRef = helper2.parseElement("classRef")) {
        classRefs.push(classRef);
      }
      var attributeRef = null;
      var replacementValue = null;
      let weAreTakingClasses = classRefs.length > 0;
      if (!weAreTakingClasses) {
        attributeRef = helper2.parseElement("attributeRef");
        if (attributeRef == null) {
          helper2.raiseParseError("Expected either a class reference or attribute expression");
        }
        if (helper2.matchToken("with")) {
          replacementValue = helper2.requireElement("expression");
        }
      }
      if (helper2.matchToken("from")) {
        var fromExpr = helper2.requireElement("expression");
      }
      if (helper2.matchToken("for")) {
        var forExpr = helper2.requireElement("expression");
      } else {
        var forExpr = helper2.requireElement("implicitMeTarget");
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
  parser.addCommand("put", function(helper2) {
    if (helper2.matchToken("put")) {
      var value = helper2.requireElement("expression");
      var operationToken = helper2.matchAnyToken("into", "before", "after");
      if (operationToken == null && helper2.matchToken("at")) {
        helper2.matchToken("the");
        operationToken = helper2.matchAnyToken("start", "end");
        helper2.requireToken("of");
      }
      if (operationToken == null) {
        helper2.raiseParseError("Expected one of 'into', 'before', 'at start of', 'at end of', 'after'");
      }
      var target = helper2.requireElement("expression");
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
        rootExpr = helper2.requireElement("implicitMeTarget");
      } else if (target.type === "styleRef" && operation === "into") {
        var styleWrite = true;
        prop = target.name;
        rootExpr = helper2.requireElement("implicitMeTarget");
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
  function parsePseudopossessiveTarget(helper2) {
    var targets;
    if (helper2.matchToken("the") || helper2.matchToken("element") || helper2.matchToken("elements") || helper2.currentToken().type === "CLASS_REF" || helper2.currentToken().type === "ID_REF" || helper2.currentToken().op && helper2.currentToken().value === "<") {
      helper2.possessivesDisabled = true;
      try {
        targets = helper2.parseElement("expression");
      } finally {
        delete helper2.possessivesDisabled;
      }
      if (helper2.matchOpToken("'")) {
        helper2.requireToken("s");
      }
    } else if (helper2.currentToken().type === "IDENTIFIER" && helper2.currentToken().value === "its") {
      var identifier = helper2.matchToken("its");
      targets = {
        type: "pseudopossessiveIts",
        token: identifier,
        name: identifier.value,
        evaluate: function(context2) {
          return context2.meta.runtime.resolveSymbol("it", context2);
        }
      };
    } else {
      helper2.matchToken("my") || helper2.matchToken("me");
      targets = helper2.parseElement("implicitMeTarget");
    }
    return targets;
  }
  parser.addCommand("transition", function(helper2) {
    if (helper2.matchToken("transition")) {
      var targetsExpr = parsePseudopossessiveTarget(helper2);
      var properties = [];
      var from = [];
      var to = [];
      var currentToken = helper2.currentToken();
      while (!helper2.commandBoundary(currentToken) && currentToken.value !== "over" && currentToken.value !== "using") {
        if (helper2.currentToken().type === "STYLE_REF") {
          let styleRef = helper2.consumeToken();
          let styleProp = styleRef.value.substr(1);
          properties.push({
            type: "styleRefValue",
            evaluate: function() {
              return styleProp;
            }
          });
        } else {
          properties.push(helper2.requireElement("stringLike"));
        }
        if (helper2.matchToken("from")) {
          from.push(helper2.requireElement("expression"));
        } else {
          from.push(null);
        }
        helper2.requireToken("to");
        if (helper2.matchToken("initial")) {
          to.push({
            type: "initial_literal",
            evaluate: function() {
              return "initial";
            }
          });
        } else {
          to.push(helper2.requireElement("expression"));
        }
        currentToken = helper2.currentToken();
      }
      if (helper2.matchToken("over")) {
        var over = helper2.requireElement("expression");
      } else if (helper2.matchToken("using")) {
        var usingExpr = helper2.requireElement("expression");
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
  parser.addCommand("measure", function(helper2) {
    if (!helper2.matchToken("measure")) return;
    var targetExpr = parsePseudopossessiveTarget(helper2);
    var propsToMeasure = [];
    if (!helper2.commandBoundary(helper2.currentToken()))
      do {
        propsToMeasure.push(helper2.matchTokenType("IDENTIFIER").value);
      } while (helper2.matchOpToken(","));
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
  parser.addLeafExpression("closestExpr", function(helper2) {
    if (helper2.matchToken("closest")) {
      if (helper2.matchToken("parent")) {
        var parentSearch = true;
      }
      var css = null;
      if (helper2.currentToken().type === "ATTRIBUTE_REF") {
        var attributeRef = helper2.requireElement("attributeRefAccess", null);
        css = "[" + attributeRef.attribute.name + "]";
      }
      if (css == null) {
        var expr = helper2.requireElement("expression");
        if (expr.css == null) {
          helper2.raiseParseError("Expected a CSS expression");
        } else {
          css = expr.css;
        }
      }
      if (helper2.matchToken("to")) {
        var to = helper2.parseElement("expression");
      } else {
        var to = helper2.parseElement("implicitMeTarget");
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
  parser.addCommand("go", function(helper2) {
    if (helper2.matchToken("go")) {
      if (helper2.matchToken("back")) {
        var back = true;
      } else {
        helper2.matchToken("to");
        if (helper2.matchToken("url")) {
          var target = helper2.requireElement("stringLike");
          var url = true;
          if (helper2.matchToken("in")) {
            helper2.requireToken("new");
            helper2.requireToken("window");
            var newWindow = true;
          }
        } else {
          helper2.matchToken("the");
          var verticalPosition = helper2.matchAnyToken("top", "middle", "bottom");
          var horizontalPosition = helper2.matchAnyToken("left", "center", "right");
          if (verticalPosition || horizontalPosition) {
            helper2.requireToken("of");
          }
          var target = helper2.requireElement("unaryExpression");
          var plusOrMinus = helper2.matchAnyOpToken("+", "-");
          if (plusOrMinus) {
            helper2.pushFollow("px");
            try {
              var offset = helper2.requireElement("expression");
            } finally {
              helper2.popFollow();
            }
          }
          helper2.matchToken("px");
          var smoothness = helper2.matchAnyToken("smoothly", "instantly");
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
        var tokens2 = lexer_.tokenize(src);
        var hyperScript = parser_.parseHyperScript(tokens2);
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
