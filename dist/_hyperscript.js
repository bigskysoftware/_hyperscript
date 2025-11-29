// _hyperscript ES module
var __defProp = Object.defineProperty;
var __typeError = (msg) => {
  throw TypeError(msg);
};
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
var __accessCheck = (obj, member, msg) => member.has(obj) || __typeError("Cannot " + msg);
var __privateGet = (obj, member, getter) => (__accessCheck(obj, member, "read from private field"), getter ? getter.call(obj) : member.get(obj));
var __privateAdd = (obj, member, value) => member.has(obj) ? __typeError("Cannot add the same private member more than once") : member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
var __privateSet = (obj, member, value, setter) => (__accessCheck(obj, member, "write to private field"), setter ? setter.call(obj, value) : member.set(obj, value), value);
var __privateMethod = (obj, member, method) => (__accessCheck(obj, member, "access private method"), method);
var __privateWrapper = (obj, member, setter, getter) => ({
  set _(value) {
    __privateSet(obj, member, value, setter);
  },
  get _() {
    return __privateGet(obj, member, getter);
  }
});
var __async = (__this, __arguments, generator) => {
  return new Promise((resolve, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    };
    var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};

// src/core/tokenizer.js
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
var _source, _position, _column, _line, _lastToken, _templateBraceCount, _tokens, _template, _Tokenizer_instances, initializeState_fn, isValidCSSClassChar_fn, isValidCSSIDChar_fn, isIdentifierChar_fn, isReservedChar_fn, isValidSingleQuoteStringStart_fn, inTemplate_fn, currentChar_fn, nextChar_fn, nextCharAt_fn, consumeChar_fn, possiblePrecedingSymbol_fn, makeToken_fn, makeOpToken_fn, consumeComment_fn, consumeCommentMultiline_fn, consumeWhitespace_fn, consumeClassReference_fn, consumeIdReference_fn, consumeAttributeReference_fn, consumeShortAttributeReference_fn, consumeStyleReference_fn, consumeTemplateIdentifier_fn, consumeIdentifier_fn, consumeNumber_fn, consumeOp_fn, consumeString_fn, consumeHexEscape_fn, tokenizeImpl_fn;
var _Tokenizer = class _Tokenizer {
  constructor() {
    __privateAdd(this, _Tokenizer_instances);
    // Instance state for tokenization
    __privateAdd(this, _source, "");
    __privateAdd(this, _position, 0);
    __privateAdd(this, _column, 0);
    __privateAdd(this, _line, 1);
    __privateAdd(this, _lastToken, "<START>");
    __privateAdd(this, _templateBraceCount, 0);
    __privateAdd(this, _tokens, []);
    __privateAdd(this, _template, false);
  }
  /**
   * isValidCSSClassChar returns `true` if the provided character is valid in a CSS class.
   * @param {string} c
   * @returns boolean
   */
  static isValidCSSClassChar(c) {
    return _Tokenizer.isAlpha(c) || _Tokenizer.isNumeric(c) || c === "-" || c === "_" || c === ":";
  }
  /**
   * isValidCSSIDChar returns `true` if the provided character is valid in a CSS ID
   * @param {string} c
   * @returns boolean
   */
  static isValidCSSIDChar(c) {
    return _Tokenizer.isAlpha(c) || _Tokenizer.isNumeric(c) || c === "-" || c === "_" || c === ":";
  }
  /**
   * isWhitespace returns `true` if the provided character is whitespace.
   * @param {string} c
   * @returns boolean
   */
  static isWhitespace(c) {
    return c === " " || c === "	" || _Tokenizer.isNewline(c);
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
    const tokenizer2 = new _Tokenizer();
    return tokenizer2.tokenize(string, template);
  }
  /**
   * Instance tokenize method
   * @param {string} string
   * @param {boolean} [template]
   * @returns {Tokens}
   */
  tokenize(string, template) {
    __privateMethod(this, _Tokenizer_instances, initializeState_fn).call(this, string, template);
    return __privateMethod(this, _Tokenizer_instances, tokenizeImpl_fn).call(this);
  }
};
_source = new WeakMap();
_position = new WeakMap();
_column = new WeakMap();
_line = new WeakMap();
_lastToken = new WeakMap();
_templateBraceCount = new WeakMap();
_tokens = new WeakMap();
_template = new WeakMap();
_Tokenizer_instances = new WeakSet();
/**
 * Initialize tokenization state
 * @param {string} string
 * @param {boolean} [template]
 */
initializeState_fn = function(string, template) {
  __privateSet(this, _source, string);
  __privateSet(this, _position, 0);
  __privateSet(this, _column, 0);
  __privateSet(this, _line, 1);
  __privateSet(this, _lastToken, "<START>");
  __privateSet(this, _templateBraceCount, 0);
  __privateSet(this, _tokens, []);
  __privateSet(this, _template, template || false);
};
/**
 * @param {string} c
 * @returns {boolean}
 */
isValidCSSClassChar_fn = function(c) {
  return _Tokenizer.isAlpha(c) || _Tokenizer.isNumeric(c) || c === "-" || c === "_" || c === ":";
};
/**
 * @param {string} c
 * @returns {boolean}
 */
isValidCSSIDChar_fn = function(c) {
  return _Tokenizer.isAlpha(c) || _Tokenizer.isNumeric(c) || c === "-" || c === "_" || c === ":";
};
/**
 * @param {string} c
 * @returns {boolean}
 */
isIdentifierChar_fn = function(c) {
  return c === "_" || c === "$";
};
/**
 * @param {string} c
 * @returns {boolean}
 */
isReservedChar_fn = function(c) {
  return c === "`" || c === "^";
};
/**
 * @param {Token[]} tokens
 * @returns {boolean}
 */
isValidSingleQuoteStringStart_fn = function(tokens) {
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
};
/**
 * @returns {boolean}
 */
inTemplate_fn = function() {
  return __privateGet(this, _template) && __privateGet(this, _templateBraceCount) === 0;
};
/**
 * @returns {string}
 */
currentChar_fn = function() {
  return __privateGet(this, _source).charAt(__privateGet(this, _position));
};
/**
 * @returns {string}
 */
nextChar_fn = function() {
  return __privateGet(this, _source).charAt(__privateGet(this, _position) + 1);
};
/**
 * @param {number} number
 * @returns {string}
 */
nextCharAt_fn = function(number = 1) {
  return __privateGet(this, _source).charAt(__privateGet(this, _position) + number);
};
/**
 * @returns {string}
 */
consumeChar_fn = function() {
  __privateSet(this, _lastToken, __privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this));
  __privateWrapper(this, _position)._++;
  __privateWrapper(this, _column)._++;
  return __privateGet(this, _lastToken);
};
/**
 * @returns {boolean}
 */
possiblePrecedingSymbol_fn = function() {
  return _Tokenizer.isAlpha(__privateGet(this, _lastToken)) || _Tokenizer.isNumeric(__privateGet(this, _lastToken)) || __privateGet(this, _lastToken) === ")" || __privateGet(this, _lastToken) === '"' || __privateGet(this, _lastToken) === "'" || __privateGet(this, _lastToken) === "`" || __privateGet(this, _lastToken) === "}" || __privateGet(this, _lastToken) === "]";
};
/**
 * @param {string} [type]
 * @param {string} [value]
 * @returns {Token}
 */
makeToken_fn = function(type, value) {
  return {
    type,
    value: value || "",
    start: __privateGet(this, _position),
    end: __privateGet(this, _position) + 1,
    column: __privateGet(this, _column),
    line: __privateGet(this, _line)
  };
};
/**
 * @param {string} [type]
 * @param {string} [value]
 * @returns {Token}
 */
makeOpToken_fn = function(type, value) {
  var token = __privateMethod(this, _Tokenizer_instances, makeToken_fn).call(this, type, value);
  token.op = true;
  return token;
};
consumeComment_fn = function() {
  while (__privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this) && !_Tokenizer.isNewline(__privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this))) {
    __privateMethod(this, _Tokenizer_instances, consumeChar_fn).call(this);
  }
  __privateMethod(this, _Tokenizer_instances, consumeChar_fn).call(this);
};
consumeCommentMultiline_fn = function() {
  while (__privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this) && !(__privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this) === "*" && __privateMethod(this, _Tokenizer_instances, nextChar_fn).call(this) === "/")) {
    __privateMethod(this, _Tokenizer_instances, consumeChar_fn).call(this);
  }
  __privateMethod(this, _Tokenizer_instances, consumeChar_fn).call(this);
  __privateMethod(this, _Tokenizer_instances, consumeChar_fn).call(this);
};
/**
 * @returns {Token}
 */
consumeWhitespace_fn = function() {
  var whitespace = __privateMethod(this, _Tokenizer_instances, makeToken_fn).call(this, "WHITESPACE");
  var value = "";
  while (__privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this) && _Tokenizer.isWhitespace(__privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this))) {
    if (_Tokenizer.isNewline(__privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this))) {
      __privateSet(this, _column, 0);
      __privateWrapper(this, _line)._++;
    }
    value += __privateMethod(this, _Tokenizer_instances, consumeChar_fn).call(this);
  }
  whitespace.value = value;
  whitespace.end = __privateGet(this, _position);
  return whitespace;
};
/**
 * @returns {Token}
 */
consumeClassReference_fn = function() {
  var classRef = __privateMethod(this, _Tokenizer_instances, makeToken_fn).call(this, "CLASS_REF");
  var value = __privateMethod(this, _Tokenizer_instances, consumeChar_fn).call(this);
  if (__privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this) === "{") {
    classRef.template = true;
    value += __privateMethod(this, _Tokenizer_instances, consumeChar_fn).call(this);
    while (__privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this) && __privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this) !== "}") {
      value += __privateMethod(this, _Tokenizer_instances, consumeChar_fn).call(this);
    }
    if (__privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this) !== "}") {
      throw Error("Unterminated class reference");
    } else {
      value += __privateMethod(this, _Tokenizer_instances, consumeChar_fn).call(this);
    }
  } else {
    while (__privateMethod(this, _Tokenizer_instances, isValidCSSClassChar_fn).call(this, __privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this)) || __privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this) === "\\") {
      if (__privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this) === "\\") {
        __privateMethod(this, _Tokenizer_instances, consumeChar_fn).call(this);
      }
      value += __privateMethod(this, _Tokenizer_instances, consumeChar_fn).call(this);
    }
  }
  classRef.value = value;
  classRef.end = __privateGet(this, _position);
  return classRef;
};
/**
 * @returns {Token}
 */
consumeIdReference_fn = function() {
  var idRef = __privateMethod(this, _Tokenizer_instances, makeToken_fn).call(this, "ID_REF");
  var value = __privateMethod(this, _Tokenizer_instances, consumeChar_fn).call(this);
  if (__privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this) === "{") {
    idRef.template = true;
    value += __privateMethod(this, _Tokenizer_instances, consumeChar_fn).call(this);
    while (__privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this) && __privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this) !== "}") {
      value += __privateMethod(this, _Tokenizer_instances, consumeChar_fn).call(this);
    }
    if (__privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this) !== "}") {
      throw Error("Unterminated id reference");
    } else {
      __privateMethod(this, _Tokenizer_instances, consumeChar_fn).call(this);
    }
  } else {
    while (__privateMethod(this, _Tokenizer_instances, isValidCSSIDChar_fn).call(this, __privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this))) {
      value += __privateMethod(this, _Tokenizer_instances, consumeChar_fn).call(this);
    }
  }
  idRef.value = value;
  idRef.end = __privateGet(this, _position);
  return idRef;
};
/**
 * @returns {Token}
 */
consumeAttributeReference_fn = function() {
  var attributeRef = __privateMethod(this, _Tokenizer_instances, makeToken_fn).call(this, "ATTRIBUTE_REF");
  var value = __privateMethod(this, _Tokenizer_instances, consumeChar_fn).call(this);
  while (__privateGet(this, _position) < __privateGet(this, _source).length && __privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this) !== "]") {
    value += __privateMethod(this, _Tokenizer_instances, consumeChar_fn).call(this);
  }
  if (__privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this) === "]") {
    value += __privateMethod(this, _Tokenizer_instances, consumeChar_fn).call(this);
  }
  attributeRef.value = value;
  attributeRef.end = __privateGet(this, _position);
  return attributeRef;
};
consumeShortAttributeReference_fn = function() {
  var attributeRef = __privateMethod(this, _Tokenizer_instances, makeToken_fn).call(this, "ATTRIBUTE_REF");
  var value = __privateMethod(this, _Tokenizer_instances, consumeChar_fn).call(this);
  while (__privateMethod(this, _Tokenizer_instances, isValidCSSIDChar_fn).call(this, __privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this))) {
    value += __privateMethod(this, _Tokenizer_instances, consumeChar_fn).call(this);
  }
  if (__privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this) === "=") {
    value += __privateMethod(this, _Tokenizer_instances, consumeChar_fn).call(this);
    if (__privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this) === '"' || __privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this) === "'") {
      let stringValue = __privateMethod(this, _Tokenizer_instances, consumeString_fn).call(this);
      value += stringValue.value;
    } else if (_Tokenizer.isAlpha(__privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this)) || _Tokenizer.isNumeric(__privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this)) || __privateMethod(this, _Tokenizer_instances, isIdentifierChar_fn).call(this, __privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this))) {
      let id = __privateMethod(this, _Tokenizer_instances, consumeIdentifier_fn).call(this);
      value += id.value;
    }
  }
  attributeRef.value = value;
  attributeRef.end = __privateGet(this, _position);
  return attributeRef;
};
consumeStyleReference_fn = function() {
  var styleRef = __privateMethod(this, _Tokenizer_instances, makeToken_fn).call(this, "STYLE_REF");
  var value = __privateMethod(this, _Tokenizer_instances, consumeChar_fn).call(this);
  while (_Tokenizer.isAlpha(__privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this)) || __privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this) === "-") {
    value += __privateMethod(this, _Tokenizer_instances, consumeChar_fn).call(this);
  }
  styleRef.value = value;
  styleRef.end = __privateGet(this, _position);
  return styleRef;
};
/**
 * @returns {Token}
 */
consumeTemplateIdentifier_fn = function() {
  var identifier = __privateMethod(this, _Tokenizer_instances, makeToken_fn).call(this, "IDENTIFIER");
  var value = __privateMethod(this, _Tokenizer_instances, consumeChar_fn).call(this);
  var escd = value === "\\";
  if (escd) {
    value = "";
  }
  while (_Tokenizer.isAlpha(__privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this)) || _Tokenizer.isNumeric(__privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this)) || __privateMethod(this, _Tokenizer_instances, isIdentifierChar_fn).call(this, __privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this)) || __privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this) === "\\" || __privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this) === "{" || __privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this) === "}") {
    if (__privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this) === "$" && escd === false) {
      break;
    } else if (__privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this) === "\\") {
      escd = true;
      __privateMethod(this, _Tokenizer_instances, consumeChar_fn).call(this);
    } else {
      escd = false;
      value += __privateMethod(this, _Tokenizer_instances, consumeChar_fn).call(this);
    }
  }
  if (__privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this) === "!" && value === "beep") {
    value += __privateMethod(this, _Tokenizer_instances, consumeChar_fn).call(this);
  }
  identifier.value = value;
  identifier.end = __privateGet(this, _position);
  return identifier;
};
/**
 * @returns {Token}
 */
consumeIdentifier_fn = function() {
  var identifier = __privateMethod(this, _Tokenizer_instances, makeToken_fn).call(this, "IDENTIFIER");
  var value = __privateMethod(this, _Tokenizer_instances, consumeChar_fn).call(this);
  while (_Tokenizer.isAlpha(__privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this)) || _Tokenizer.isNumeric(__privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this)) || __privateMethod(this, _Tokenizer_instances, isIdentifierChar_fn).call(this, __privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this))) {
    value += __privateMethod(this, _Tokenizer_instances, consumeChar_fn).call(this);
  }
  if (__privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this) === "!" && value === "beep") {
    value += __privateMethod(this, _Tokenizer_instances, consumeChar_fn).call(this);
  }
  identifier.value = value;
  identifier.end = __privateGet(this, _position);
  return identifier;
};
/**
 * @returns {Token}
 */
consumeNumber_fn = function() {
  var number = __privateMethod(this, _Tokenizer_instances, makeToken_fn).call(this, "NUMBER");
  var value = __privateMethod(this, _Tokenizer_instances, consumeChar_fn).call(this);
  while (_Tokenizer.isNumeric(__privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this))) {
    value += __privateMethod(this, _Tokenizer_instances, consumeChar_fn).call(this);
  }
  if (__privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this) === "." && _Tokenizer.isNumeric(__privateMethod(this, _Tokenizer_instances, nextChar_fn).call(this))) {
    value += __privateMethod(this, _Tokenizer_instances, consumeChar_fn).call(this);
  }
  while (_Tokenizer.isNumeric(__privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this))) {
    value += __privateMethod(this, _Tokenizer_instances, consumeChar_fn).call(this);
  }
  if (__privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this) === "e" || __privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this) === "E") {
    if (_Tokenizer.isNumeric(__privateMethod(this, _Tokenizer_instances, nextChar_fn).call(this))) {
      value += __privateMethod(this, _Tokenizer_instances, consumeChar_fn).call(this);
    } else if (__privateMethod(this, _Tokenizer_instances, nextChar_fn).call(this) === "-") {
      value += __privateMethod(this, _Tokenizer_instances, consumeChar_fn).call(this);
      value += __privateMethod(this, _Tokenizer_instances, consumeChar_fn).call(this);
    }
  }
  while (_Tokenizer.isNumeric(__privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this))) {
    value += __privateMethod(this, _Tokenizer_instances, consumeChar_fn).call(this);
  }
  number.value = value;
  number.end = __privateGet(this, _position);
  return number;
};
/**
 * @returns {Token}
 */
consumeOp_fn = function() {
  var op = __privateMethod(this, _Tokenizer_instances, makeOpToken_fn).call(this);
  var value = __privateMethod(this, _Tokenizer_instances, consumeChar_fn).call(this);
  while (__privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this) && _Tokenizer.OP_TABLE[value + __privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this)]) {
    value += __privateMethod(this, _Tokenizer_instances, consumeChar_fn).call(this);
  }
  op.type = _Tokenizer.OP_TABLE[value];
  op.value = value;
  op.end = __privateGet(this, _position);
  return op;
};
/**
 * @returns {Token}
 */
consumeString_fn = function() {
  var string = __privateMethod(this, _Tokenizer_instances, makeToken_fn).call(this, "STRING");
  var startChar = __privateMethod(this, _Tokenizer_instances, consumeChar_fn).call(this);
  string.template = startChar === "`";
  var value = "";
  while (__privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this) && __privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this) !== startChar) {
    if (__privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this) === "\\") {
      __privateMethod(this, _Tokenizer_instances, consumeChar_fn).call(this);
      let nextChar = __privateMethod(this, _Tokenizer_instances, consumeChar_fn).call(this);
      if (nextChar === "b") {
        value += "\b";
      } else if (nextChar === "f") {
        value += "\f";
      } else if (nextChar === "n") {
        value += "\n";
      } else if (nextChar === "r") {
        value += "\r";
      } else if (nextChar === "t") {
        value += "	";
      } else if (nextChar === "v") {
        value += "\v";
      } else if (string.template && nextChar === "$") {
        value += "\\$";
      } else if (nextChar === "x") {
        const hex = __privateMethod(this, _Tokenizer_instances, consumeHexEscape_fn).call(this);
        if (Number.isNaN(hex)) {
          throw Error("Invalid hexadecimal escape at " + _Tokenizer.positionString(string));
        }
        value += String.fromCharCode(hex);
      } else {
        value += nextChar;
      }
    } else {
      value += __privateMethod(this, _Tokenizer_instances, consumeChar_fn).call(this);
    }
  }
  if (__privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this) !== startChar) {
    throw Error("Unterminated string at " + _Tokenizer.positionString(string));
  } else {
    __privateMethod(this, _Tokenizer_instances, consumeChar_fn).call(this);
  }
  string.value = value;
  string.end = __privateGet(this, _position);
  return string;
};
/**
 * @returns {number}
 */
consumeHexEscape_fn = function() {
  const BASE = 16;
  if (!__privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this)) {
    return NaN;
  }
  let result = BASE * Number.parseInt(__privateMethod(this, _Tokenizer_instances, consumeChar_fn).call(this), BASE);
  if (!__privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this)) {
    return NaN;
  }
  result += Number.parseInt(__privateMethod(this, _Tokenizer_instances, consumeChar_fn).call(this), BASE);
  return result;
};
/**
 * Main tokenization implementation
 * @returns {Tokens}
 */
tokenizeImpl_fn = function() {
  while (__privateGet(this, _position) < __privateGet(this, _source).length) {
    if (__privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this) === "-" && __privateMethod(this, _Tokenizer_instances, nextChar_fn).call(this) === "-" && (_Tokenizer.isWhitespace(__privateMethod(this, _Tokenizer_instances, nextCharAt_fn).call(this, 2)) || __privateMethod(this, _Tokenizer_instances, nextCharAt_fn).call(this, 2) === "" || __privateMethod(this, _Tokenizer_instances, nextCharAt_fn).call(this, 2) === "-") || __privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this) === "/" && __privateMethod(this, _Tokenizer_instances, nextChar_fn).call(this) === "/" && (_Tokenizer.isWhitespace(__privateMethod(this, _Tokenizer_instances, nextCharAt_fn).call(this, 2)) || __privateMethod(this, _Tokenizer_instances, nextCharAt_fn).call(this, 2) === "" || __privateMethod(this, _Tokenizer_instances, nextCharAt_fn).call(this, 2) === "/")) {
      __privateMethod(this, _Tokenizer_instances, consumeComment_fn).call(this);
    } else if (__privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this) === "/" && __privateMethod(this, _Tokenizer_instances, nextChar_fn).call(this) === "*" && (_Tokenizer.isWhitespace(__privateMethod(this, _Tokenizer_instances, nextCharAt_fn).call(this, 2)) || __privateMethod(this, _Tokenizer_instances, nextCharAt_fn).call(this, 2) === "" || __privateMethod(this, _Tokenizer_instances, nextCharAt_fn).call(this, 2) === "*")) {
      __privateMethod(this, _Tokenizer_instances, consumeCommentMultiline_fn).call(this);
    } else {
      if (_Tokenizer.isWhitespace(__privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this))) {
        __privateGet(this, _tokens).push(__privateMethod(this, _Tokenizer_instances, consumeWhitespace_fn).call(this));
      } else if (!__privateMethod(this, _Tokenizer_instances, possiblePrecedingSymbol_fn).call(this) && __privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this) === "." && (_Tokenizer.isAlpha(__privateMethod(this, _Tokenizer_instances, nextChar_fn).call(this)) || __privateMethod(this, _Tokenizer_instances, nextChar_fn).call(this) === "{" || __privateMethod(this, _Tokenizer_instances, nextChar_fn).call(this) === "-")) {
        __privateGet(this, _tokens).push(__privateMethod(this, _Tokenizer_instances, consumeClassReference_fn).call(this));
      } else if (!__privateMethod(this, _Tokenizer_instances, possiblePrecedingSymbol_fn).call(this) && __privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this) === "#" && (_Tokenizer.isAlpha(__privateMethod(this, _Tokenizer_instances, nextChar_fn).call(this)) || __privateMethod(this, _Tokenizer_instances, nextChar_fn).call(this) === "{")) {
        __privateGet(this, _tokens).push(__privateMethod(this, _Tokenizer_instances, consumeIdReference_fn).call(this));
      } else if (__privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this) === "[" && __privateMethod(this, _Tokenizer_instances, nextChar_fn).call(this) === "@") {
        __privateGet(this, _tokens).push(__privateMethod(this, _Tokenizer_instances, consumeAttributeReference_fn).call(this));
      } else if (__privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this) === "@") {
        __privateGet(this, _tokens).push(__privateMethod(this, _Tokenizer_instances, consumeShortAttributeReference_fn).call(this));
      } else if (__privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this) === "*" && _Tokenizer.isAlpha(__privateMethod(this, _Tokenizer_instances, nextChar_fn).call(this))) {
        __privateGet(this, _tokens).push(__privateMethod(this, _Tokenizer_instances, consumeStyleReference_fn).call(this));
      } else if (__privateMethod(this, _Tokenizer_instances, inTemplate_fn).call(this) && (_Tokenizer.isAlpha(__privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this)) || __privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this) === "\\")) {
        __privateGet(this, _tokens).push(__privateMethod(this, _Tokenizer_instances, consumeTemplateIdentifier_fn).call(this));
      } else if (!__privateMethod(this, _Tokenizer_instances, inTemplate_fn).call(this) && (_Tokenizer.isAlpha(__privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this)) || __privateMethod(this, _Tokenizer_instances, isIdentifierChar_fn).call(this, __privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this)))) {
        __privateGet(this, _tokens).push(__privateMethod(this, _Tokenizer_instances, consumeIdentifier_fn).call(this));
      } else if (_Tokenizer.isNumeric(__privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this))) {
        __privateGet(this, _tokens).push(__privateMethod(this, _Tokenizer_instances, consumeNumber_fn).call(this));
      } else if (!__privateMethod(this, _Tokenizer_instances, inTemplate_fn).call(this) && (__privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this) === '"' || __privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this) === "`")) {
        __privateGet(this, _tokens).push(__privateMethod(this, _Tokenizer_instances, consumeString_fn).call(this));
      } else if (!__privateMethod(this, _Tokenizer_instances, inTemplate_fn).call(this) && __privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this) === "'") {
        if (__privateMethod(this, _Tokenizer_instances, isValidSingleQuoteStringStart_fn).call(this, __privateGet(this, _tokens))) {
          __privateGet(this, _tokens).push(__privateMethod(this, _Tokenizer_instances, consumeString_fn).call(this));
        } else {
          __privateGet(this, _tokens).push(__privateMethod(this, _Tokenizer_instances, consumeOp_fn).call(this));
        }
      } else if (_Tokenizer.OP_TABLE[__privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this)]) {
        if (__privateGet(this, _lastToken) === "$" && __privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this) === "{") {
          __privateWrapper(this, _templateBraceCount)._++;
        }
        if (__privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this) === "}") {
          __privateWrapper(this, _templateBraceCount)._--;
        }
        __privateGet(this, _tokens).push(__privateMethod(this, _Tokenizer_instances, consumeOp_fn).call(this));
      } else if (__privateMethod(this, _Tokenizer_instances, inTemplate_fn).call(this) || __privateMethod(this, _Tokenizer_instances, isReservedChar_fn).call(this, __privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this))) {
        __privateGet(this, _tokens).push(__privateMethod(this, _Tokenizer_instances, makeToken_fn).call(this, "RESERVED", __privateMethod(this, _Tokenizer_instances, consumeChar_fn).call(this)));
      } else {
        if (__privateGet(this, _position) < __privateGet(this, _source).length) {
          throw Error("Unknown token: " + __privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this) + " ");
        }
      }
    }
  }
  return new Tokens(__privateGet(this, _tokens), [], __privateGet(this, _source));
};
__publicField(_Tokenizer, "OP_TABLE", {
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
var Tokenizer = _Tokenizer;

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

// src/core/runtime.js
var shouldAutoIterateSymbol = Symbol();
var ElementCollection = class {
  constructor(css, relativeToElement, escape, runtime2) {
    this._css = css;
    this.relativeToElement = relativeToElement;
    this.escape = escape;
    this._runtime = runtime2;
    this[shouldAutoIterateSymbol] = true;
  }
  get css() {
    if (this.escape) {
      return this._runtime.escapeSelector(this._css);
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
    let query = this._runtime.getRootNode(this.relativeToElement).querySelectorAll(this.css);
    return query;
  }
};
var TemplatedQueryElementCollection = class extends ElementCollection {
  constructor(css, relativeToElement, templateParts, runtime2) {
    super(css, relativeToElement, false, runtime2);
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
var HyperscriptModule = class extends EventTarget {
  constructor(mod) {
    super();
    this.module = mod;
  }
  toString() {
    return this.module.id;
  }
};
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
  constructor(owner, feature, hyperscriptTarget, event, runtime2, globalScope2) {
    this.meta = {
      parser: runtime2.parser,
      tokenizer: runtime2.tokenizer,
      runtime: runtime2,
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
    runtime2.addFeatures(owner, this);
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
var _Runtime = class _Runtime {
  /**
   *
   * @param {Object} globalScope
   * @param {Object} kernel - The language kernel for parsing
   * @param {Object} tokenizer - The tokenizer for tokenizing hyperscript
   */
  constructor(globalScope2, kernel2, tokenizer2) {
    __publicField(this, "HALT", _Runtime.HALT);
    /**
     * @type {string[] | null}
     */
    __publicField(this, "_scriptAttrs", null);
    __publicField(this, "hyperscriptFeaturesMap", /* @__PURE__ */ new WeakMap());
    __publicField(this, "internalDataMap", /* @__PURE__ */ new WeakMap());
    this.globalScope = globalScope2;
    this.parser = kernel2;
    this.tokenizer = tokenizer2;
    this.initWebConversions();
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
  /**
   * @param {Element} elt
   * @param {Element} [target]
   */
  initElement(elt, target) {
    if (elt.closest && elt.closest(config.disableSelector)) {
      return;
    }
    var internalData = this.getInternalData(elt);
    if (!internalData.initialized) {
      var src = this.getScript(elt);
      if (src) {
        try {
          internalData.initialized = true;
          internalData.script = src;
          var tokens = this.tokenizer.tokenize(src);
          var hyperScript = this.parser.parseHyperScript(tokens);
          if (!hyperScript) return;
          hyperScript.apply(target || elt, elt, null, this);
          setTimeout(() => {
            this.triggerEvent(target || elt, "load", {
              hyperscript: true
            });
          }, 1);
        } catch (e) {
          this.triggerEvent(elt, "exception", {
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
  }
  /**
   * @param {HTMLElement} elt
   */
  processNode(elt) {
    var selector = this.getScriptSelector();
    if (this.matchesSelector(elt, selector)) {
      this.initElement(elt, elt);
    }
    if (elt instanceof HTMLScriptElement && elt.type === "text/hyperscript") {
      this.initElement(elt, document.body);
    }
    if (elt.querySelectorAll) {
      this.forEach(elt.querySelectorAll(selector + ", [type='text/hyperscript']"), (elt2) => {
        this.initElement(elt2, elt2 instanceof HTMLScriptElement && elt2.type === "text/hyperscript" ? document.body : elt2);
      });
    }
  }
  /**
   * Initialize web-specific conversions
   */
  initWebConversions() {
    conversions.dynamicResolvers.push((str, node) => {
      if (!(str === "Values" || str.indexOf("Values:") === 0)) {
        return;
      }
      var conversion = str.split(":")[1];
      var result = {};
      this.implicitLoop(node, (node2) => {
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
          return new URLSearchParams(result).toString();
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
    conversions["HTML"] = (value) => {
      var toHTML = (value2) => {
        if (value2 instanceof Array) {
          return value2.map((item) => toHTML(item)).join("");
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
      };
      return toHTML(value);
    };
    conversions["Fragment"] = (val) => {
      var frag = document.createDocumentFragment();
      this.implicitLoop(val, (val2) => {
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
};
__publicField(_Runtime, "HALT", {});
var Runtime = _Runtime;

// src/core/parser.js
var Parser = class {
  /**
   * @param {import('./kernel.js').LanguageKernel} kernel
   * @param {import('./tokens.js').Tokens} tokens
   */
  constructor(kernel2, tokens) {
    this.kernel = kernel2;
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
  // Kernel delegation methods
  // ===========================
  parseElement(type, root = null) {
    return this.kernel.parseElement(type, this.tokens, root);
  }
  requireElement(type, message, root) {
    return this.kernel.requireElement(type, this.tokens, message, root);
  }
  parseAnyOf(types) {
    return this.kernel.parseAnyOf(types, this.tokens);
  }
  raiseParseError(message) {
    return this.kernel.raiseParseError(this.tokens, message);
  }
  parseStringTemplate() {
    return this.kernel.parseStringTemplate(this.tokens);
  }
  commandBoundary(token) {
    return this.kernel.commandBoundary(token);
  }
  commandStart(token) {
    return this.kernel.commandStart(token);
  }
  featureStart(token) {
    return this.kernel.featureStart(token);
  }
  setParent(elt, parent) {
    return this.kernel.setParent(elt, parent);
  }
  ensureTerminated(commandList) {
    return this.kernel.ensureTerminated(commandList);
  }
  // Access to parser properties needed by grammars
  get possessivesDisabled() {
    return this.kernel.possessivesDisabled;
  }
  set possessivesDisabled(value) {
    this.kernel.possessivesDisabled = value;
  }
  get GRAMMAR() {
    return this.kernel.GRAMMAR;
  }
  get COMMANDS() {
    return this.kernel.COMMANDS;
  }
  get FEATURES() {
    return this.kernel.FEATURES;
  }
  get LEAF_EXPRESSIONS() {
    return this.kernel.LEAF_EXPRESSIONS;
  }
  get INDIRECT_EXPRESSIONS() {
    return this.kernel.INDIRECT_EXPRESSIONS;
  }
};

// src/core/kernel.js
var _LanguageKernel = class _LanguageKernel {
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
    /** @type {string[]} */
    __publicField(this, "POSTFIX_EXPRESSIONS", []);
    /** @type {string[]} */
    __publicField(this, "UNARY_EXPRESSIONS", []);
    /** @type {string[]} */
    __publicField(this, "TOP_EXPRESSIONS", []);
    /** @type {string[]} */
    __publicField(this, "ASSIGNABLE_EXPRESSIONS", []);
    this.possessivesDisabled = false;
    this.addGrammarElement("feature", (parser) => {
      if (parser.matchOpToken("(")) {
        var featureElement = parser.requireElement("feature");
        parser.requireOpToken(")");
        return featureElement;
      }
      var featureDefinition = parser.FEATURES[parser.currentToken().value || ""];
      if (featureDefinition) {
        return featureDefinition(parser);
      }
    });
    this.addGrammarElement("command", (parser) => {
      if (parser.matchOpToken("(")) {
        const commandElement2 = parser.requireElement("command");
        parser.requireOpToken(")");
        return commandElement2;
      }
      var commandDefinition = parser.COMMANDS[parser.currentToken().value || ""];
      let commandElement;
      if (commandDefinition) {
        commandElement = commandDefinition(parser);
      } else if (parser.currentToken().type === "IDENTIFIER") {
        commandElement = parser.parseElement("pseudoCommand");
      }
      if (commandElement) {
        return this.parseElement("indirectStatement", parser.tokens, commandElement);
      }
      return commandElement;
    });
    this.addGrammarElement("commandList", (parser) => {
      if (parser.hasMore()) {
        var cmd = parser.parseElement("command");
        if (cmd) {
          parser.matchToken("then");
          const next = parser.parseElement("commandList");
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
    this.addGrammarElement("leaf", (parser) => {
      var result = parser.parseAnyOf(parser.LEAF_EXPRESSIONS);
      if (result == null) {
        return parser.parseElement("symbol");
      }
      return result;
    });
    this.addGrammarElement("indirectExpression", (parser, root) => {
      for (var i = 0; i < this.INDIRECT_EXPRESSIONS.length; i++) {
        var indirect = this.INDIRECT_EXPRESSIONS[i];
        root.endToken = parser.lastMatch();
        var result = this.parseElement(indirect, parser.tokens, root);
        if (result) {
          return result;
        }
      }
      return root;
    });
    this.addGrammarElement("postfixExpression", (parser) => {
      var root = parser.parseElement("negativeNumber");
      for (var i = 0; i < this.POSTFIX_EXPRESSIONS.length; i++) {
        var postfixType = this.POSTFIX_EXPRESSIONS[i];
        var result = this.parseElement(postfixType, parser.tokens, root);
        if (result) {
          return result;
        }
      }
      return root;
    });
    this.addGrammarElement("unaryExpression", (parser) => {
      parser.matchToken("the");
      return parser.parseAnyOf(this.UNARY_EXPRESSIONS);
    });
    this.addGrammarElement("expression", (parser) => {
      parser.matchToken("the");
      return parser.parseAnyOf(this.TOP_EXPRESSIONS);
    });
    this.addGrammarElement("assignableExpression", (parser) => {
      parser.matchToken("the");
      var expr = parser.parseElement("primaryExpression");
      if (expr && this.ASSIGNABLE_EXPRESSIONS.indexOf(expr.type) >= 0) {
        return expr;
      } else {
        parser.raiseParseError(
          "A target expression must be writable.  The expression type '" + (expr && expr.type) + "' is not."
        );
      }
    });
    this.addGrammarElement("indirectStatement", (parser, root) => {
      if (parser.matchToken("unless")) {
        root.endToken = parser.lastMatch();
        var conditional = parser.requireElement("expression");
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
    this.addGrammarElement("primaryExpression", (parser) => {
      var leaf = parser.parseElement("leaf");
      if (leaf) {
        return this.parseElement("indirectExpression", parser.tokens, leaf);
      }
      parser.raiseParseError("Unexpected value: " + parser.currentToken().value);
    });
    this.addGrammarElement("hyperscript", (parser) => {
      var features = [];
      if (parser.hasMore()) {
        while (parser.featureStart(parser.currentToken()) || parser.currentToken().value === "(") {
          var feature = parser.requireElement("feature");
          features.push(feature);
          parser.matchToken("end");
        }
      }
      return {
        type: "hyperscript",
        features,
        apply: function(target, source, args, runtime2) {
          for (const feature2 of features) {
            feature2.install(target, source, args, runtime2);
          }
        }
      };
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
      var parser = new Parser(this, tokens);
      var parseElement = elementDefinition(parser, root);
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
    if (!result) _LanguageKernel.raiseParseError(tokens, message || "Expected " + type);
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
    if (this.GRAMMAR[name]) {
      throw new Error(`Grammar element '${name}' already exists`);
    }
    this.GRAMMAR[name] = definition;
  }
  /**
   * @param {string} keyword
   * @param {ParseRule} definition
   */
  addCommand(keyword, definition) {
    var commandGrammarType = keyword + "Command";
    var commandDefinitionWrapper = function(parser) {
      const commandElement = definition(parser);
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
   * Register multiple command classes at once
   * @param {...Function} commandClasses - Command classes with static keyword and parse properties
   */
  addCommands(...commandClasses) {
    for (const CommandClass of commandClasses) {
      if (!CommandClass.keyword) {
        throw new Error(`Command class ${CommandClass.name} must have a static 'keyword' property`);
      }
      if (!CommandClass.parse) {
        throw new Error(`Command class ${CommandClass.name} must have a static 'parse' method`);
      }
      this.addCommand(CommandClass.keyword, CommandClass.parse);
    }
  }
  /**
   * Register multiple feature classes at once
   * @param {...Function} featureClasses - Feature classes with static keyword and parse properties
   */
  addFeatures(...featureClasses) {
    for (const FeatureClass of featureClasses) {
      if (!FeatureClass.keyword) {
        throw new Error(`Feature class ${FeatureClass.name} must have a static 'keyword' property`);
      }
      if (!FeatureClass.parse) {
        throw new Error(`Feature class ${FeatureClass.name} must have a static 'parse' method`);
      }
      this.addFeature(FeatureClass.keyword, FeatureClass.parse);
    }
  }
  /**
   * @param {string} keyword
   * @param {ParseRule} definition
   */
  addFeature(keyword, definition) {
    var featureGrammarType = keyword + "Feature";
    var featureDefinitionWrapper = function(parser) {
      var featureElement = definition(parser);
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
   * @param {string} name
   * @param {ParseRule} definition
   */
  addPostfixExpression(name, definition) {
    this.POSTFIX_EXPRESSIONS.push(name);
    this.addGrammarElement(name, definition);
  }
  /**
   * @param {string} name
   * @param {ParseRule} definition
   */
  addUnaryExpression(name, definition) {
    this.UNARY_EXPRESSIONS.push(name);
    this.addGrammarElement(name, definition);
  }
  /**
   * @param {string} name
   * @param {ParseRule} definition
   */
  addTopExpression(name, definition) {
    this.TOP_EXPRESSIONS.push(name);
    this.addGrammarElement(name, definition);
  }
  /**
   * Register an expression as assignable (adds to both ASSIGNABLE_EXPRESSIONS and GRAMMAR)
   * @param {string} name
   * @param {ParseRule} definition
   */
  addAssignableExpression(name, definition) {
    this.ASSIGNABLE_EXPRESSIONS.push(name);
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
    message = (message || "Unexpected Token : " + tokens.currentToken().value) + "\n\n" + _LanguageKernel.createParserContext(tokens);
    var error = new Error(message);
    error["tokens"] = tokens;
    throw error;
  }
  /**
   * @param {Tokens} tokens
   * @param {string} [message]
   */
  raiseParseError(tokens, message) {
    _LanguageKernel.raiseParseError(tokens, message);
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
   * @param {Tokenizer} tokenizer
   * @param {string} src
   * @returns {ASTNode}
   */
  parse(tokenizer2, src) {
    var tokens = tokenizer2.tokenize(src);
    if (this.commandStart(tokens.currentToken())) {
      var commandList = this.requireElement("commandList", tokens);
      if (tokens.hasMore()) _LanguageKernel.raiseParseError(tokens);
      this.ensureTerminated(commandList);
      return commandList;
    } else if (this.featureStart(tokens.currentToken())) {
      var hyperscript = this.requireElement("hyperscript", tokens);
      if (tokens.hasMore()) _LanguageKernel.raiseParseError(tokens);
      return hyperscript;
    } else {
      var expression = this.requireElement("expression", tokens);
      if (tokens.hasMore()) _LanguageKernel.raiseParseError(tokens);
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
__publicField(_LanguageKernel, "Tokenizer", Tokenizer);
var LanguageKernel = _LanguageKernel;

// src/parsetree/expressions/webliterals.js
var IdRefTemplateNode = class {
  constructor(innerExpression) {
    this.type = "idRefTemplate";
    this.args = [innerExpression];
  }
  op(context2, arg) {
    return context2.meta.runtime.getRootNode(context2.me).getElementById(arg);
  }
  evaluate(context2) {
    return context2.meta.runtime.unifiedEval(this, context2);
  }
};
var IdRefNode = class {
  constructor(css, value) {
    this.type = "idRef";
    this.css = css;
    this.value = value;
  }
  evaluate(context2) {
    return context2.meta.runtime.getRootNode(context2.me).getElementById(this.value);
  }
};
var IdRef = class {
  /**
   * Parse an ID reference
   * @param {Parser} parser
   * @returns {IdRefTemplateNode | IdRefNode | undefined}
   */
  static parse(parser) {
    var _a, _b;
    const Tokenizer2 = parser.kernel.constructor.Tokenizer || ((_b = (_a = window._hyperscript) == null ? void 0 : _a.internals) == null ? void 0 : _b.Tokenizer);
    var elementId = parser.matchTokenType("ID_REF");
    if (!elementId) return;
    if (!elementId.value) return;
    if (elementId.template) {
      var templateValue = elementId.value.substring(2);
      var innerTokens = Tokenizer2.tokenize(templateValue);
      var innerExpression = parser.kernel.requireElement("expression", innerTokens);
      return new IdRefTemplateNode(innerExpression);
    } else {
      const value = elementId.value.substring(1);
      return new IdRefNode(elementId.value, value);
    }
  }
};
var ClassRefTemplateNode = class {
  constructor(innerExpression) {
    this.type = "classRefTemplate";
    this.args = [innerExpression];
  }
  op(context2, arg) {
    return new ElementCollection("." + arg, context2.me, true, context2.meta.runtime);
  }
  evaluate(context2) {
    return context2.meta.runtime.unifiedEval(this, context2);
  }
};
var ClassRefNode = class {
  constructor(css, className) {
    this.type = "classRef";
    this.css = css;
    this.className = className;
  }
  evaluate(context2) {
    return new ElementCollection(this.css, context2.me, true, context2.meta.runtime);
  }
};
var ClassRef = class {
  /**
   * Parse a class reference
   * @param {Parser} parser
   * @returns {ClassRefTemplateNode | ClassRefNode | undefined}
   */
  static parse(parser) {
    var _a, _b;
    const Tokenizer2 = parser.kernel.constructor.Tokenizer || ((_b = (_a = window._hyperscript) == null ? void 0 : _a.internals) == null ? void 0 : _b.Tokenizer);
    var classRef = parser.matchTokenType("CLASS_REF");
    if (!classRef) return;
    if (!classRef.value) return;
    if (classRef.template) {
      var templateValue = classRef.value.substring(2);
      var innerTokens = Tokenizer2.tokenize(templateValue);
      var innerExpression = parser.kernel.requireElement("expression", innerTokens);
      return new ClassRefTemplateNode(innerExpression);
    } else {
      const css = classRef.value;
      const className = css.substr(1);
      return new ClassRefNode(css, className);
    }
  }
};
var QueryRefNode = class {
  constructor(css, args, template) {
    this.type = "queryRef";
    this.css = css;
    this.args = args;
    this.template = template;
  }
  op(context2, ...args) {
    if (this.template) {
      return new TemplatedQueryElementCollection(this.css, context2.me, args, context2.meta.runtime);
    } else {
      return new ElementCollection(this.css, context2.me, false, context2.meta.runtime);
    }
  }
  evaluate(context2) {
    return context2.meta.runtime.unifiedEval(this, context2);
  }
};
var QueryRef = class {
  /**
   * Parse a query reference
   * @param {Parser} parser
   * @returns {QueryRefNode | undefined}
   */
  static parse(parser) {
    var _a, _b;
    const Tokenizer2 = parser.kernel.constructor.Tokenizer || ((_b = (_a = window._hyperscript) == null ? void 0 : _a.internals) == null ? void 0 : _b.Tokenizer);
    var queryStart = parser.matchOpToken("<");
    if (!queryStart) return;
    var queryTokens = parser.consumeUntil("/");
    parser.requireOpToken("/");
    parser.requireOpToken(">");
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
      innerTokens = Tokenizer2.tokenize(queryValue, true);
      args = parser.kernel.parseStringTemplate(innerTokens);
    }
    return new QueryRefNode(queryValue, args, template);
  }
};
var AttributeRefNode = class {
  constructor(name, css, value) {
    this.type = "attributeRef";
    this.name = name;
    this.css = css;
    this.value = value;
  }
  op(context2) {
    var target = context2.you || context2.me;
    if (target) {
      return target.getAttribute(this.name);
    }
  }
  evaluate(context2) {
    return context2.meta.runtime.unifiedEval(this, context2);
  }
};
var AttributeRef = class {
  /**
   * Parse an attribute reference
   * @param {Parser} parser
   * @returns {AttributeRefNode | undefined}
   */
  static parse(parser) {
    var attributeRef = parser.matchTokenType("ATTRIBUTE_REF");
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
    return new AttributeRefNode(name, css, value);
  }
};
var ComputedStyleRefNode = class {
  constructor(name) {
    this.type = "computedStyleRef";
    this.name = name;
  }
  op(context2) {
    var target = context2.you || context2.me;
    if (target) {
      return context2.meta.runtime.resolveComputedStyle(target, this.name);
    }
  }
  evaluate(context2) {
    return context2.meta.runtime.unifiedEval(this, context2);
  }
};
var StyleRefNode = class {
  constructor(name) {
    this.type = "styleRef";
    this.name = name;
  }
  op(context2) {
    var target = context2.you || context2.me;
    if (target) {
      return context2.meta.runtime.resolveStyle(target, this.name);
    }
  }
  evaluate(context2) {
    return context2.meta.runtime.unifiedEval(this, context2);
  }
};
var StyleRef = class {
  /**
   * Parse a style reference
   * @param {Parser} parser
   * @returns {ComputedStyleRefNode | StyleRefNode | undefined}
   */
  static parse(parser) {
    var styleRef = parser.matchTokenType("STYLE_REF");
    if (!styleRef) return;
    if (!styleRef.value) return;
    var styleProp = styleRef.value.substr(1);
    if (styleProp.startsWith("computed-")) {
      styleProp = styleProp.substr("computed-".length);
      return new ComputedStyleRefNode(styleProp);
    } else {
      return new StyleRefNode(styleProp);
    }
  }
};
var StyleLiteralNode = class {
  constructor(stringParts, exprs) {
    this.type = "styleLiteral";
    this.stringParts = stringParts;
    this.args = [exprs];
  }
  op(ctx, exprs) {
    var rv = "";
    const stringParts = this.stringParts;
    stringParts.forEach(function(part, idx) {
      rv += part;
      if (idx in exprs) rv += exprs[idx];
    });
    return rv;
  }
  evaluate(ctx) {
    return ctx.meta.runtime.unifiedEval(this, ctx);
  }
};
var StyleLiteral = class {
  /**
   * Parse a style literal
   * @param {Parser} parser
   * @returns {StyleLiteralNode | undefined}
   */
  static parse(parser) {
    if (!parser.matchOpToken("{")) return;
    var stringParts = [""];
    var exprs = [];
    while (parser.hasMore()) {
      if (parser.matchOpToken("\\")) {
        parser.consumeToken();
      } else if (parser.matchOpToken("}")) {
        break;
      } else if (parser.matchToken("$")) {
        var opencurly = parser.matchOpToken("{");
        var expr = parser.parseElement("expression");
        if (opencurly) parser.requireOpToken("}");
        exprs.push(expr);
        stringParts.push("");
      } else {
        var tok = parser.consumeToken();
        stringParts[stringParts.length - 1] += parser.source.substring(tok.start, tok.end);
      }
      stringParts[stringParts.length - 1] += parser.lastWhitespace();
    }
    return new StyleLiteralNode(stringParts, exprs);
  }
};

// src/parsetree/expressions/expressions.js
var ParenthesizedExpression = class {
  /**
   * Parse a parenthesized expression
   * @param {Parser} parser
   * @returns {any | undefined}
   */
  static parse(parser) {
    if (parser.matchOpToken("(")) {
      var follows = parser.clearFollows();
      try {
        var expr = parser.requireElement("expression");
      } finally {
        parser.restoreFollows(follows);
      }
      parser.requireOpToken(")");
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
   * @param {Parser} parser
   * @returns {BlockLiteral | undefined}
   */
  static parse(parser) {
    if (!parser.matchOpToken("\\")) return;
    var args = [];
    var arg1 = parser.matchTokenType("IDENTIFIER");
    if (arg1) {
      args.push(arg1);
      while (parser.matchOpToken(",")) {
        args.push(parser.requireTokenType("IDENTIFIER"));
      }
    }
    parser.requireOpToken("-");
    parser.requireOpToken(">");
    var expr = parser.requireElement("expression");
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
   * @param {Parser} parser
   * @returns {NegativeNumber | any}
   */
  static parse(parser) {
    if (parser.matchOpToken("-")) {
      var root = parser.requireElement("negativeNumber");
      return new _NegativeNumber(root);
    } else {
      return parser.requireElement("primaryExpression");
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
   * @param {Parser} parser
   * @returns {LogicalNot | undefined}
   */
  static parse(parser) {
    if (!parser.matchToken("not")) return;
    var root = parser.requireElement("unaryExpression");
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
   * @param {Parser} parser
   * @returns {SymbolRef | undefined}
   */
  static parse(parser) {
    var scope = "default";
    if (parser.matchToken("global")) {
      scope = "global";
    } else if (parser.matchToken("element") || parser.matchToken("module")) {
      scope = "element";
      if (parser.matchOpToken("'")) {
        parser.requireToken("s");
      }
    } else if (parser.matchToken("local")) {
      scope = "local";
    }
    let eltPrefix = parser.matchOpToken(":");
    let identifier = parser.matchTokenType("IDENTIFIER");
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
   * @param {Parser} parser
   * @returns {any | undefined}
   */
  static parse(parser) {
    if (!parser.matchToken("beep!")) return;
    var expression = parser.parseElement("unaryExpression");
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
   * @param {Parser} parser
   * @param {any} root - The root expression
   * @returns {any | undefined}
   */
  static parse(parser, root) {
    if (!parser.matchOpToken(".")) return;
    var prop = parser.requireTokenType("IDENTIFIER");
    var propertyAccess = new _PropertyAccess(root, prop);
    return parser.kernel.parseElement("indirectExpression", parser.tokens, propertyAccess);
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
   * @param {Parser} parser
   * @param {any} root - The property expression
   * @returns {any | undefined}
   */
  static parse(parser, root) {
    if (!parser.matchToken("of")) return;
    var newRoot = parser.requireElement("unaryExpression");
    var childOfUrRoot = null;
    var urRoot = root;
    while (urRoot.root) {
      childOfUrRoot = urRoot;
      urRoot = urRoot.root;
    }
    if (urRoot.type !== "symbol" && urRoot.type !== "attributeRef" && urRoot.type !== "styleRef" && urRoot.type !== "computedStyleRef") {
      parser.raiseParseError("Cannot take a property of a non-symbol: " + urRoot.type);
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
    return parser.kernel.parseElement("indirectExpression", parser.tokens, root);
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
   * @param {Parser} parser
   * @param {any} root
   * @returns {any | undefined}
   */
  static parse(parser, root) {
    if (parser.possessivesDisabled) {
      return;
    }
    var apostrophe = parser.matchOpToken("'");
    if (apostrophe || root.type === "symbol" && (root.name === "my" || root.name === "its" || root.name === "your") && (parser.currentToken().type === "IDENTIFIER" || parser.currentToken().type === "ATTRIBUTE_REF" || parser.currentToken().type === "STYLE_REF")) {
      if (apostrophe) {
        parser.requireToken("s");
      }
      var attribute, style, prop;
      attribute = parser.parseElement("attributeRef");
      if (attribute == null) {
        style = parser.parseElement("styleRef");
        if (style == null) {
          prop = parser.requireTokenType("IDENTIFIER");
        }
      }
      var propertyAccess = new _PossessiveExpression(root, attribute || style, prop);
      return parser.kernel.parseElement("indirectExpression", parser.tokens, propertyAccess);
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
   * @param {Parser} parser
   * @param {any} root
   * @returns {InExpression | undefined}
   */
  static parse(parser, root) {
    if (!parser.matchToken("in")) return;
    var target = parser.requireElement("unaryExpression");
    var inExpression = new _InExpression(root, target);
    return parser.kernel.parseElement("indirectExpression", parser.tokens, inExpression);
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
   * @param {Parser} parser
   * @param {any} root
   * @returns {AsExpression | undefined}
   */
  static parse(parser, root) {
    if (!parser.matchToken("as")) return;
    parser.matchToken("a") || parser.matchToken("an");
    var conversion = parser.requireElement("dotOrColonPath").evaluate();
    var asExpression = new _AsExpression(root, conversion);
    return parser.kernel.parseElement("indirectExpression", parser.tokens, asExpression);
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
   * @param {Parser} parser
   * @param {any} root
   * @returns {FunctionCall | undefined}
   */
  static parse(parser, root) {
    if (!parser.matchOpToken("(")) return;
    var args = [];
    if (!parser.matchOpToken(")")) {
      do {
        args.push(parser.requireElement("expression"));
      } while (parser.matchOpToken(","));
      parser.requireOpToken(")");
    }
    var functionCall;
    if (root.root) {
      functionCall = new _FunctionCall(root, args, [root.root, args], true);
    } else {
      functionCall = new _FunctionCall(root, args, [root, args], false);
    }
    return parser.kernel.parseElement("indirectExpression", parser.tokens, functionCall);
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
   * @param {Parser} parser
   * @param {any} root
   * @returns {AttributeRefAccess | undefined}
   */
  static parse(parser, root) {
    var attribute = parser.parseElement("attributeRef");
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
   * @param {Parser} parser
   * @param {any} root
   * @returns {any | undefined}
   */
  static parse(parser, root) {
    if (!parser.matchOpToken("[")) return;
    var andBefore = false;
    var andAfter = false;
    var firstIndex = null;
    var secondIndex = null;
    if (parser.matchOpToken("..")) {
      andBefore = true;
      firstIndex = parser.requireElement("expression");
    } else {
      firstIndex = parser.requireElement("expression");
      if (parser.matchOpToken("..")) {
        andAfter = true;
        var current = parser.currentToken();
        if (current.type !== "R_BRACKET") {
          secondIndex = parser.parseElement("expression");
        }
      }
    }
    parser.requireOpToken("]");
    var arrayIndex = new _ArrayIndex(root, firstIndex, secondIndex, andBefore, andAfter);
    return parser.kernel.parseElement("indirectExpression", parser.tokens, arrayIndex);
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
   * @param {Parser} parser
   * @returns {any}
   */
  static parse(parser) {
    var expr = parser.parseElement("unaryExpression");
    var mathOp, initialMathOp = null;
    mathOp = parser.matchAnyOpToken("+", "-", "*", "/") || parser.matchToken("mod");
    while (mathOp) {
      initialMathOp = initialMathOp || mathOp;
      var operator = mathOp.value;
      if (initialMathOp.value !== operator) {
        parser.raiseParseError("You must parenthesize math operations with different operators");
      }
      var rhs = parser.parseElement("unaryExpression");
      expr = new _MathOperator(expr, operator, rhs);
      mathOp = parser.matchAnyOpToken("+", "-", "*", "/") || parser.matchToken("mod");
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
   * @param {Parser} parser
   * @returns {any}
   */
  static parse(parser) {
    return parser.parseAnyOf(["mathOperator", "unaryExpression"]);
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
   * @param {Parser} parser
   * @returns {any}
   */
  static parse(parser) {
    var expr = parser.parseElement("mathExpression");
    var comparisonToken = parser.matchAnyOpToken("<", ">", "<=", ">=", "==", "===", "!=", "!==");
    var operator = comparisonToken ? comparisonToken.value : null;
    var hasRightValue = true;
    var typeCheck = false;
    if (operator == null) {
      if (parser.matchToken("is") || parser.matchToken("am")) {
        if (parser.matchToken("not")) {
          if (parser.matchToken("in")) {
            operator = "not in";
          } else if (parser.matchToken("a") || parser.matchToken("an")) {
            operator = "not a";
            typeCheck = true;
          } else if (parser.matchToken("empty")) {
            operator = "not empty";
            hasRightValue = false;
          } else {
            if (parser.matchToken("really")) {
              operator = "!==";
            } else {
              operator = "!=";
            }
            if (parser.matchToken("equal")) {
              parser.matchToken("to");
            }
          }
        } else if (parser.matchToken("in")) {
          operator = "in";
        } else if (parser.matchToken("a") || parser.matchToken("an")) {
          operator = "a";
          typeCheck = true;
        } else if (parser.matchToken("empty")) {
          operator = "empty";
          hasRightValue = false;
        } else if (parser.matchToken("less")) {
          parser.requireToken("than");
          if (parser.matchToken("or")) {
            parser.requireToken("equal");
            parser.requireToken("to");
            operator = "<=";
          } else {
            operator = "<";
          }
        } else if (parser.matchToken("greater")) {
          parser.requireToken("than");
          if (parser.matchToken("or")) {
            parser.requireToken("equal");
            parser.requireToken("to");
            operator = ">=";
          } else {
            operator = ">";
          }
        } else {
          if (parser.matchToken("really")) {
            operator = "===";
          } else {
            operator = "==";
          }
          if (parser.matchToken("equal")) {
            parser.matchToken("to");
          }
        }
      } else if (parser.matchToken("equals")) {
        operator = "==";
      } else if (parser.matchToken("really")) {
        parser.requireToken("equals");
        operator = "===";
      } else if (parser.matchToken("exist") || parser.matchToken("exists")) {
        operator = "exist";
        hasRightValue = false;
      } else if (parser.matchToken("matches") || parser.matchToken("match")) {
        operator = "match";
      } else if (parser.matchToken("contains") || parser.matchToken("contain")) {
        operator = "contain";
      } else if (parser.matchToken("includes") || parser.matchToken("include")) {
        operator = "include";
      } else if (parser.matchToken("do") || parser.matchToken("does")) {
        parser.requireToken("not");
        if (parser.matchToken("matches") || parser.matchToken("match")) {
          operator = "not match";
        } else if (parser.matchToken("contains") || parser.matchToken("contain")) {
          operator = "not contain";
        } else if (parser.matchToken("exist") || parser.matchToken("exist")) {
          operator = "not exist";
          hasRightValue = false;
        } else if (parser.matchToken("include")) {
          operator = "not include";
        } else {
          parser.raiseParseError("Expected matches or contains");
        }
      }
    }
    if (operator) {
      var typeName, nullOk, rhs;
      if (typeCheck) {
        typeName = parser.requireTokenType("IDENTIFIER");
        nullOk = !parser.matchOpToken("!");
      } else if (hasRightValue) {
        rhs = parser.requireElement("mathExpression");
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
   * @param {Parser} parser
   * @returns {any}
   */
  static parse(parser) {
    return parser.parseAnyOf(["comparisonOperator", "mathExpression"]);
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
   * @param {Parser} parser
   * @returns {any}
   */
  static parse(parser) {
    var expr = parser.parseElement("comparisonExpression");
    var logicalOp, initialLogicalOp = null;
    logicalOp = parser.matchToken("and") || parser.matchToken("or");
    while (logicalOp) {
      initialLogicalOp = initialLogicalOp || logicalOp;
      if (initialLogicalOp.value !== logicalOp.value) {
        parser.raiseParseError("You must parenthesize logical operations with different operators");
      }
      var rhs = parser.requireElement("comparisonExpression");
      const operator = logicalOp.value;
      expr = new _LogicalOperator(expr, operator, rhs);
      logicalOp = parser.matchToken("and") || parser.matchToken("or");
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
   * @param {Parser} parser
   * @returns {any}
   */
  static parse(parser) {
    return parser.parseAnyOf(["logicalOperator", "mathExpression"]);
  }
};
var AsyncExpression = class _AsyncExpression {
  constructor(value) {
    this.type = "asyncExpression";
    this.value = value;
  }
  /**
   * Parse async expression (dispatcher with optional async keyword)
   * @param {Parser} parser
   * @returns {AsyncExpression | any}
   */
  static parse(parser) {
    if (parser.matchToken("async")) {
      var value = parser.requireElement("logicalExpression");
      return new _AsyncExpression(value);
    } else {
      return parser.parseElement("logicalExpression");
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
var DotOrColonPathNode = class {
  constructor(path, separator) {
    this.type = "dotOrColonPath";
    this.path = path;
    this.separator = separator;
  }
  evaluate() {
    return this.path.join(this.separator ? this.separator : "");
  }
};
var DotOrColonPath = class {
  /**
   * Parse dot or colon separated path
   * @param {Parser} parser
   * @returns {DotOrColonPathNode | undefined}
   */
  static parse(parser) {
    var root = parser.matchTokenType("IDENTIFIER");
    if (root) {
      var path = [root.value];
      var separator = parser.matchOpToken(".") || parser.matchOpToken(":");
      if (separator) {
        do {
          path.push(parser.requireTokenType("IDENTIFIER", "NUMBER").value);
        } while (parser.matchOpToken(separator.value));
      }
      return new DotOrColonPathNode(path, separator ? separator.value : null);
    }
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
   * @param {Parser} parser
   * @returns {NakedString | undefined}
   */
  static parse(parser) {
    if (parser.hasMore()) {
      var tokenArr = parser.consumeUntilWhitespace();
      parser.matchTokenType("WHITESPACE");
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
   * @param {Parser} parser
   * @returns {BooleanLiteral | undefined}
   */
  static parse(parser) {
    var booleanLiteral = parser.matchToken("true") || parser.matchToken("false");
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
   * @param {Parser} parser
   * @returns {NullLiteral | undefined}
   */
  static parse(parser) {
    if (parser.matchToken("null")) {
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
   * @param {Parser} parser
   * @returns {NumberLiteral | undefined}
   */
  static parse(parser) {
    var number = parser.matchTokenType("NUMBER");
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
   * @param {Parser} parser
   * @returns {StringLiteral | undefined}
   */
  static parse(parser) {
    var _a, _b;
    var stringToken = parser.matchTokenType("STRING");
    if (!stringToken) return;
    var rawValue = (
      /** @type {string} */
      stringToken.value
    );
    var args;
    if (stringToken.template) {
      const Tokenizer2 = parser.kernel.constructor.Tokenizer || ((_b = (_a = window._hyperscript) == null ? void 0 : _a.internals) == null ? void 0 : _b.Tokenizer);
      if (Tokenizer2) {
        var innerTokens = Tokenizer2.tokenize(rawValue, true);
        args = parser.kernel.parseStringTemplate(innerTokens);
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
   * @param {Parser} parser
   * @returns {ArrayLiteral | undefined}
   */
  static parse(parser) {
    if (!parser.matchOpToken("[")) return;
    var values = [];
    if (!parser.matchOpToken("]")) {
      do {
        var expr = parser.requireElement("expression");
        values.push(expr);
      } while (parser.matchOpToken(","));
      parser.requireOpToken("]");
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
   * @param {Parser} parser
   * @returns {ObjectKey}
   */
  static parse(parser) {
    var token;
    if (token = parser.matchTokenType("STRING")) {
      return new _ObjectKey(token.value, null, null);
    } else if (parser.matchOpToken("[")) {
      var expr = parser.parseElement("expression");
      parser.requireOpToken("]");
      return new _ObjectKey(null, expr, [expr]);
    } else {
      var key = "";
      do {
        token = parser.matchTokenType("IDENTIFIER") || parser.matchOpToken("-");
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
   * @param {Parser} parser
   * @returns {ObjectLiteral | undefined}
   */
  static parse(parser) {
    if (!parser.matchOpToken("{")) return;
    var keyExpressions = [];
    var valueExpressions = [];
    if (!parser.matchOpToken("}")) {
      do {
        var name = parser.requireElement("objectKey");
        parser.requireOpToken(":");
        var value = parser.requireElement("expression");
        valueExpressions.push(value);
        keyExpressions.push(name);
      } while (parser.matchOpToken(",") && !parser.peekToken("}", 0, "R_BRACE"));
      parser.requireOpToken("}");
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
   * @param {Parser} parser
   * @returns {NamedArgumentList}
   */
  static parseNaked(parser) {
    var fields = [];
    var valueExpressions = [];
    if (parser.currentToken().type === "IDENTIFIER") {
      do {
        var name = parser.requireTokenType("IDENTIFIER");
        parser.requireOpToken(":");
        var value = parser.requireElement("expression");
        valueExpressions.push(value);
        fields.push({ name, value });
      } while (parser.matchOpToken(","));
    }
    return new _NamedArgumentList(fields, valueExpressions);
  }
  /**
   * Parse a named argument list with parentheses
   * @param {Parser} parser
   * @returns {NamedArgumentList | undefined}
   */
  static parse(parser) {
    if (!parser.matchOpToken("(")) return;
    var elt = _NamedArgumentList.parseNaked(parser);
    parser.requireOpToken(")");
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
   * @param {Parser} parser
   * @returns {ImplicitMeTarget}
   */
  static parse(parser) {
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
   * @param {Parser} parser
   * @returns {NoExpression | undefined}
   */
  static parse(parser) {
    if (!parser.matchToken("no")) return;
    var root = parser.requireElement("unaryExpression");
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
   * @param {Parser} parser
   * @returns {SomeExpression | undefined}
   */
  static parse(parser) {
    if (!parser.matchToken("some")) return;
    var root = parser.requireElement("expression");
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
   * @param {Parser} parser
   * @returns {RelativePositionalExpression | undefined}
   */
  static parse(parser) {
    var op = parser.matchAnyToken("next", "previous");
    if (!op) return;
    var forwardSearch = op.value === "next";
    var thingElt = parser.parseElement("expression");
    if (parser.matchToken("from")) {
      parser.pushFollow("in");
      try {
        var from = parser.requireElement("unaryExpression");
      } finally {
        parser.popFollow();
      }
    } else {
      var from = parser.requireElement("implicitMeTarget");
    }
    var inSearch = false;
    var withinElt;
    if (parser.matchToken("in")) {
      inSearch = true;
      var inElt = parser.requireElement("unaryExpression");
    } else if (parser.matchToken("within")) {
      withinElt = parser.requireElement("unaryExpression");
    } else {
      withinElt = document.body;
    }
    var wrapping = false;
    if (parser.matchToken("with")) {
      parser.requireToken("wrapping");
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
   * @param {Parser} parser
   * @returns {PositionalExpression | undefined}
   */
  static parse(parser) {
    var op = parser.matchAnyToken("first", "last", "random");
    if (!op) return;
    parser.matchAnyToken("in", "from", "of");
    var rhs = parser.requireElement("unaryExpression");
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
var ClosestExprNode = class {
  constructor(parentSearch, expr, css, to) {
    this.type = "closestExpr";
    this.parentSearch = parentSearch;
    this.expr = expr;
    this.css = css;
    this.to = to;
    this.args = [to];
  }
  op(ctx, to) {
    if (to == null) {
      return null;
    } else {
      let result = [];
      const css = this.css;
      const parentSearch = this.parentSearch;
      ctx.meta.runtime.implicitLoop(to, function(to2) {
        if (parentSearch) {
          result.push(to2.parentElement ? to2.parentElement.closest(css) : null);
        } else {
          result.push(to2.closest(css));
        }
      });
      if (ctx.meta.runtime.shouldAutoIterate(to)) {
        return result;
      } else {
        return result[0];
      }
    }
  }
  evaluate(ctx) {
    return ctx.meta.runtime.unifiedEval(this, ctx);
  }
};
var ClosestExpr = class {
  /**
   * Parse a closest expression
   * @param {Parser} parser
   * @returns {ClosestExprNode | undefined}
   */
  static parse(parser) {
    if (!parser.matchToken("closest")) return;
    var parentSearch = false;
    if (parser.matchToken("parent")) {
      parentSearch = true;
    }
    var css = null;
    var attributeRef = null;
    if (parser.currentToken().type === "ATTRIBUTE_REF") {
      attributeRef = parser.requireElement("attributeRefAccess", null);
      css = "[" + attributeRef.attribute.name + "]";
    }
    if (css == null) {
      var expr = parser.requireElement("expression");
      if (expr.css == null) {
        parser.raiseParseError("Expected a CSS expression");
      } else {
        css = expr.css;
      }
    }
    if (parser.matchToken("to")) {
      var to = parser.parseElement("expression");
    } else {
      var to = parser.parseElement("implicitMeTarget");
    }
    var closestExpr = new ClosestExprNode(parentSearch, expr, css, to);
    if (attributeRef) {
      attributeRef.root = closestExpr;
      attributeRef.args = [closestExpr];
      return attributeRef;
    } else {
      return closestExpr;
    }
  }
};

// src/parsetree/expressions/postfix.js
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
var StringPostfixExpressionNode = class {
  constructor(root, postfix) {
    this.type = "stringPostfix";
    this.postfix = postfix;
    this.args = [root];
  }
  op(context2, val) {
    return "" + val + this.postfix;
  }
  evaluate(context2) {
    return context2.meta.runtime.unifiedEval(this, context2);
  }
};
var StringPostfixExpression = class {
  /**
   * Parse string postfix expression
   * @param {Parser} parser
   * @param {Object} root - the root expression to apply postfix to
   * @returns {StringPostfixExpressionNode | undefined}
   */
  static parse(parser, root) {
    let stringPostfix = parser.tokens.matchAnyToken.apply(parser.tokens, STRING_POSTFIXES) || parser.matchOpToken("%");
    if (!stringPostfix) return;
    return new StringPostfixExpressionNode(root, stringPostfix.value);
  }
};
var TimeExpressionNode = class {
  constructor(root, timeFactor) {
    this.type = "timeExpression";
    this.time = root;
    this.factor = timeFactor;
    this.args = [root];
  }
  op(context2, val) {
    return val * this.factor;
  }
  evaluate(context2) {
    return context2.meta.runtime.unifiedEval(this, context2);
  }
};
var TimeExpression = class {
  /**
   * Parse time expression
   * @param {Parser} parser
   * @param {Object} root - the root expression to apply time factor to
   * @returns {TimeExpressionNode | undefined}
   */
  static parse(parser, root) {
    var timeFactor = null;
    if (parser.matchToken("s") || parser.matchToken("seconds")) {
      timeFactor = 1e3;
    } else if (parser.matchToken("ms") || parser.matchToken("milliseconds")) {
      timeFactor = 1;
    }
    if (!timeFactor) return;
    return new TimeExpressionNode(root, timeFactor);
  }
};
var TypeCheckExpressionNode = class {
  constructor(root, typeName, nullOk) {
    this.type = "typeCheck";
    this.typeName = typeName;
    this.nullOk = nullOk;
    this.args = [root];
  }
  op(context2, val) {
    var passed = context2.meta.runtime.typeCheck(val, this.typeName.value, this.nullOk);
    if (passed) {
      return val;
    } else {
      throw new Error("Typecheck failed!  Expected: " + this.typeName.value);
    }
  }
  evaluate(context2) {
    return context2.meta.runtime.unifiedEval(this, context2);
  }
};
var TypeCheckExpression = class {
  /**
   * Parse type check expression
   * @param {Parser} parser
   * @param {Object} root - the root expression to type check
   * @returns {TypeCheckExpressionNode | undefined}
   */
  static parse(parser, root) {
    if (!parser.matchOpToken(":")) return;
    var typeName = parser.requireTokenType("IDENTIFIER");
    if (!typeName.value) return;
    var nullOk = !parser.matchOpToken("!");
    return new TypeCheckExpressionNode(root, typeName, nullOk);
  }
};

// src/parsetree/commands/setters.js
function putInto(context2, root, prop, valueToPut) {
  if (root == null) {
    var value = context2.meta.runtime.resolveSymbol(prop, context2);
  } else {
    var value = root;
  }
  if (value instanceof Element || value instanceof HTMLDocument) {
    while (value.firstChild) value.removeChild(value.firstChild);
    value.append(context2.meta.runtime.convertValue(valueToPut, "Fragment"));
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
  static makeSetter(parser, target, value) {
    var symbolWrite = target.type === "symbol";
    var attributeWrite = target.type === "attributeRef";
    var styleWrite = target.type === "styleRef";
    var arrayWrite = target.type === "arrayIndex";
    if (!(attributeWrite || styleWrite || symbolWrite) && target.root == null) {
      parser.raiseParseError("Can only put directly into symbols, not references");
    }
    var rootElt = null;
    var prop = null;
    if (symbolWrite) {
    } else if (attributeWrite || styleWrite) {
      rootElt = parser.requireElement("implicitMeTarget");
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
var _SetCommand = class _SetCommand extends SetterCommand {
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
   * @param {Parser} parser
   * @returns {SetCommand | undefined}
   */
  static parse(parser) {
    if (!parser.matchToken("set")) return;
    if (parser.currentToken().type === "L_BRACE") {
      var obj = parser.requireElement("objectLiteral");
      parser.requireToken("on");
      var target = parser.requireElement("expression");
      var command = new _SetCommand(target, null, obj);
      command.op = function(ctx, obj2, target2) {
        Object.assign(target2, obj2);
        return ctx.meta.runtime.findNext(this, ctx);
      };
      return command;
    }
    try {
      parser.pushFollow("to");
      var target = parser.requireElement("assignableExpression");
    } finally {
      parser.popFollow();
    }
    parser.requireToken("to");
    var value = parser.requireElement("expression");
    return _SetCommand.makeSetter(parser, target, value);
  }
};
__publicField(_SetCommand, "keyword", "set");
var SetCommand = _SetCommand;
var _DefaultCommand = class _DefaultCommand extends SetterCommand {
  constructor(target, value, setter) {
    super();
    this.target = target;
    this.value = value;
    this.setter = setter;
    this.args = [target];
  }
  /**
   * Parse default command
   * @param {Parser} parser
   * @returns {DefaultCommand | undefined}
   */
  static parse(parser) {
    if (!parser.matchToken("default")) return;
    var target = parser.requireElement("assignableExpression");
    parser.requireToken("to");
    var value = parser.requireElement("expression");
    var setter = SetCommand.makeSetter(parser, target, value);
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
__publicField(_DefaultCommand, "keyword", "default");
var DefaultCommand = _DefaultCommand;
var IncrementCommand = class extends SetterCommand {
  constructor(target, amountExpr) {
    super();
    this.target = target;
    this.amountExpr = amountExpr;
  }
  /**
   * Parse increment command
   * @param {Parser} parser
   * @returns {IncrementCommand | undefined}
   */
  static parse(parser) {
    if (!parser.matchToken("increment")) return;
    var amountExpr;
    var target = parser.parseElement("assignableExpression");
    if (parser.matchToken("by")) {
      amountExpr = parser.requireElement("expression");
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
    return SetCommand.makeSetter(parser, target, implicitIncrementOp);
  }
};
__publicField(IncrementCommand, "keyword", "increment");
var DecrementCommand = class extends SetterCommand {
  constructor(target, amountExpr) {
    super();
    this.target = target;
    this.amountExpr = amountExpr;
  }
  /**
   * Parse decrement command
   * @param {Parser} parser
   * @returns {DecrementCommand | undefined}
   */
  static parse(parser) {
    if (!parser.matchToken("decrement")) return;
    var amountExpr;
    var target = parser.parseElement("assignableExpression");
    if (parser.matchToken("by")) {
      amountExpr = parser.requireElement("expression");
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
    return SetCommand.makeSetter(parser, target, implicitDecrementOp);
  }
};
__publicField(DecrementCommand, "keyword", "decrement");
var PutCommand = class extends SetterCommand {
  constructor(value, target, operation) {
    super();
    this.value = value;
    this.target = target;
    this.operation = operation;
  }
  /**
   * Parse put command
   * @param {Parser} parser
   * @returns {PutCommand | undefined}
   */
  static parse(parser) {
    if (!parser.matchToken("put")) return;
    var value = parser.requireElement("expression");
    var operationToken = parser.matchAnyToken("into", "before", "after");
    if (operationToken == null && parser.matchToken("at")) {
      parser.matchToken("the");
      operationToken = parser.matchAnyToken("start", "end");
      parser.requireToken("of");
    }
    if (operationToken == null) {
      parser.raiseParseError("Expected one of 'into', 'before', 'at start of', 'at end of', 'after'");
    }
    var target = parser.requireElement("expression");
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
      rootExpr = parser.requireElement("implicitMeTarget");
    } else if (target.type === "styleRef" && operation === "into") {
      var styleWrite = true;
      prop = target.name;
      rootExpr = parser.requireElement("implicitMeTarget");
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
};
__publicField(PutCommand, "keyword", "put");

// src/parsetree/commands/basic.js
var _LogCommand = class _LogCommand {
  constructor(exprs, withExpr) {
    this.exprs = exprs;
    this.withExpr = withExpr;
    this.args = [withExpr, exprs];
  }
  /**
   * Parse log command
   * @param {Parser} parser
   * @returns {LogCommand | undefined}
   */
  static parse(parser) {
    if (!parser.matchToken("log")) return;
    var exprs = [parser.parseElement("expression")];
    while (parser.matchOpToken(",")) {
      exprs.push(parser.requireElement("expression"));
    }
    if (parser.matchToken("with")) {
      var withExpr = parser.requireElement("expression");
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
__publicField(_LogCommand, "keyword", "log");
var LogCommand = _LogCommand;
var _BeepCommand = class _BeepCommand {
  constructor(exprs) {
    this.exprs = exprs;
    this.args = [exprs];
  }
  /**
   * Parse beep command
   * @param {Parser} parser
   * @returns {BeepCommand | undefined}
   */
  static parse(parser) {
    if (!parser.matchToken("beep!")) return;
    var exprs = [parser.parseElement("expression")];
    while (parser.matchOpToken(",")) {
      exprs.push(parser.requireElement("expression"));
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
__publicField(_BeepCommand, "keyword", "beep!");
var BeepCommand = _BeepCommand;
var _ThrowCommand = class _ThrowCommand {
  constructor(expr) {
    this.expr = expr;
    this.args = [expr];
  }
  /**
   * Parse throw command
   * @param {Parser} parser
   * @returns {ThrowCommand | undefined}
   */
  static parse(parser) {
    if (!parser.matchToken("throw")) return;
    var expr = parser.requireElement("expression");
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
__publicField(_ThrowCommand, "keyword", "throw");
var ThrowCommand = _ThrowCommand;
var _ReturnCommand = class _ReturnCommand {
  constructor(value) {
    this.value = value;
    this.args = [value];
  }
  /**
   * Parse return command
   * @param {Parser} parser
   * @returns {ReturnCommand | undefined}
   */
  static parse(parser) {
    if (!parser.matchToken("return")) return;
    if (parser.commandBoundary(parser.currentToken())) {
      parser.raiseParseError("'return' commands must return a value.  If you do not wish to return a value, use 'exit' instead.");
    } else {
      var value = parser.requireElement("expression");
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
__publicField(_ReturnCommand, "keyword", "return");
var ReturnCommand = _ReturnCommand;
var _ExitCommand = class _ExitCommand {
  constructor() {
    this.args = [void 0];
  }
  /**
   * Parse exit command
   * @param {Parser} parser
   * @returns {ExitCommand | undefined}
   */
  static parse(parser) {
    if (!parser.matchToken("exit")) return;
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
__publicField(_ExitCommand, "keyword", "exit");
var ExitCommand = _ExitCommand;
var _HaltCommand = class _HaltCommand {
  constructor(bubbling, haltDefault, keepExecuting, exit) {
    this.keepExecuting = keepExecuting;
    this.bubbling = bubbling;
    this.haltDefault = haltDefault;
    this.exit = exit;
  }
  /**
   * Parse halt command
   * @param {Parser} parser
   * @returns {HaltCommand | undefined}
   */
  static parse(parser) {
    if (!parser.matchToken("halt")) return;
    if (parser.matchToken("the")) {
      parser.requireToken("event");
      if (parser.matchOpToken("'")) {
        parser.requireToken("s");
      }
      var keepExecuting = true;
    }
    if (parser.matchToken("bubbling")) {
      var bubbling = true;
    } else if (parser.matchToken("default")) {
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
__publicField(_HaltCommand, "keyword", "halt");
var HaltCommand = _HaltCommand;
var MakeCommand = class {
  /**
   * Parse make command
   * @param {Parser} parser
   * @returns {MakeCommand | undefined}
   */
  static parse(parser) {
    if (!parser.matchToken("make")) return;
    parser.matchToken("a") || parser.matchToken("an");
    var expr = parser.requireElement("expression");
    var args = [];
    if (expr.type !== "queryRef" && parser.matchToken("from")) {
      do {
        args.push(parser.requireElement("expression"));
      } while (parser.matchOpToken(","));
    }
    if (parser.matchToken("called")) {
      var target = parser.requireElement("symbol");
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
  }
};
__publicField(MakeCommand, "keyword", "make");
var AppendCommand = class {
  /**
   * Parse append command
   * @param {Parser} parser
   * @returns {AppendCommand | undefined}
   */
  static parse(parser) {
    if (!parser.matchToken("append")) return;
    var targetExpr = null;
    var value = parser.requireElement("expression");
    var implicitResultSymbol = {
      type: "symbol",
      evaluate: function(context2) {
        return context2.meta.runtime.resolveSymbol("result", context2);
      }
    };
    if (parser.matchToken("to")) {
      targetExpr = parser.requireElement("expression");
    } else {
      targetExpr = implicitResultSymbol;
    }
    var setter = null;
    if (targetExpr.type === "symbol" || targetExpr.type === "attributeRef" || targetExpr.root != null) {
      setter = SetCommand.makeSetter(parser, targetExpr, implicitResultSymbol);
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
  }
};
__publicField(AppendCommand, "keyword", "append");
function parsePickRange(parser) {
  parser.matchToken("at") || parser.matchToken("from");
  const rv = { includeStart: true, includeEnd: false };
  rv.from = parser.matchToken("start") ? 0 : parser.requireElement("expression");
  if (parser.matchToken("to") || parser.matchOpToken("..")) {
    if (parser.matchToken("end")) {
      rv.toEnd = true;
    } else {
      rv.to = parser.requireElement("expression");
    }
  }
  if (parser.matchToken("inclusive")) rv.includeEnd = true;
  else if (parser.matchToken("exclusive")) rv.includeStart = false;
  return rv;
}
var PickCommandRange = class {
  constructor(root, range) {
    this.type = "pickCommand";
    this.args = [root, range.from, range.to];
    this.range = range;
  }
  op(ctx, root, from, to) {
    if (this.range.toEnd) to = root.length;
    if (!this.range.includeStart) from++;
    if (this.range.includeEnd) to++;
    if (to == null || to == void 0) to = from + 1;
    ctx.result = root.slice(from, to);
    return ctx.meta.runtime.findNext(this, ctx);
  }
  execute(ctx) {
    return ctx.meta.runtime.unifiedExec(this, ctx);
  }
};
var PickCommandMatch = class {
  constructor(root, re, flags) {
    this.type = "pickCommand";
    this.args = [root, re];
    this.flags = flags;
  }
  op(ctx, root, re) {
    ctx.result = new RegExp(re, this.flags).exec(root);
    return ctx.meta.runtime.findNext(this, ctx);
  }
  execute(ctx) {
    return ctx.meta.runtime.unifiedExec(this, ctx);
  }
};
var PickCommandMatches = class {
  constructor(root, re, flags) {
    this.type = "pickCommand";
    this.args = [root, re];
    this.flags = flags;
  }
  op(ctx, root, re) {
    ctx.result = new RegExpIterable(re, this.flags, root);
    return ctx.meta.runtime.findNext(this, ctx);
  }
  execute(ctx) {
    return ctx.meta.runtime.unifiedExec(this, ctx);
  }
};
var PickCommand = class {
  /**
   * Parse pick command
   * @param {Parser} parser
   * @returns {PickCommandRange | PickCommandMatch | PickCommandMatches | undefined}
   */
  static parse(parser) {
    if (!parser.matchToken("pick")) return;
    parser.matchToken("the");
    if (parser.matchToken("item") || parser.matchToken("items") || parser.matchToken("character") || parser.matchToken("characters")) {
      const range = parsePickRange(parser);
      parser.requireToken("from");
      const root = parser.requireElement("expression");
      return new PickCommandRange(root, range);
    }
    if (parser.matchToken("match")) {
      parser.matchToken("of");
      const re = parser.parseElement("expression");
      let flags = "";
      if (parser.matchOpToken("|")) {
        flags = parser.requireTokenType("IDENTIFIER").value;
      }
      parser.requireToken("from");
      const root = parser.parseElement("expression");
      return new PickCommandMatch(root, re, flags);
    }
    if (parser.matchToken("matches")) {
      parser.matchToken("of");
      const re = parser.parseElement("expression");
      let flags = "gu";
      if (parser.matchOpToken("|")) {
        flags = "g" + parser.requireTokenType("IDENTIFIER").value.replace("g", "");
      }
      parser.requireToken("from");
      const root = parser.parseElement("expression");
      return new PickCommandMatches(root, re, flags);
    }
  }
};
__publicField(PickCommand, "keyword", "pick");
function parseConversionInfo(parser) {
  var type = "text";
  var conversion;
  parser.matchToken("a") || parser.matchToken("an");
  if (parser.matchToken("json") || parser.matchToken("Object")) {
    type = "json";
  } else if (parser.matchToken("response")) {
    type = "response";
  } else if (parser.matchToken("html")) {
    type = "html";
  } else if (parser.matchToken("text")) {
  } else {
    conversion = parser.requireElement("dotOrColonPath").evaluate();
  }
  return { type, conversion };
}
var FetchCommandNode = class {
  constructor(url, args, type, conversion) {
    this.type = "fetchCommand";
    this.url = url;
    this.argExpressions = args;
    this.args = [url, args];
    this.conversionType = type;
    this.conversion = conversion;
  }
  op(context2, url, args) {
    const type = this.conversionType;
    const conversion = this.conversion;
    const fetchCmd = this;
    var detail = args || {};
    detail["sender"] = context2.me;
    detail["headers"] = detail["headers"] || {};
    var abortController = new AbortController();
    let abortListener = context2.me.addEventListener("fetch:abort", function() {
      abortController.abort();
    }, { once: true });
    detail["signal"] = abortController.signal;
    context2.meta.runtime.triggerEvent(context2.me, "hyperscript:beforeFetch", detail);
    context2.meta.runtime.triggerEvent(context2.me, "fetch:beforeRequest", detail);
    args = detail;
    var finished = false;
    if (args.timeout) {
      setTimeout(function() {
        if (!finished) {
          abortController.abort();
        }
      }, args.timeout);
    }
    return fetch(url, args).then(function(resp) {
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
  execute(context2) {
    return context2.meta.runtime.unifiedExec(this, context2);
  }
};
var FetchCommand = class {
  /**
   * Parse fetch command
   * @param {Parser} parser
   * @returns {FetchCommandNode | undefined}
   */
  static parse(parser) {
    if (!parser.matchToken("fetch")) return;
    var url = parser.requireElement("stringLike");
    if (parser.matchToken("as")) {
      var conversionInfo = parseConversionInfo(parser);
    }
    if (parser.matchToken("with") && parser.currentToken().value !== "{") {
      var args = parser.parseElement("nakedNamedArgumentList");
    } else {
      var args = parser.parseElement("objectLiteral");
    }
    if (conversionInfo == null && parser.matchToken("as")) {
      conversionInfo = parseConversionInfo(parser);
    }
    var type = conversionInfo ? conversionInfo.type : "text";
    var conversion = conversionInfo ? conversionInfo.conversion : null;
    var fetchCmd = new FetchCommandNode(url, args, type, conversion);
    return fetchCmd;
  }
};
__publicField(FetchCommand, "keyword", "fetch");
var GoCommandNode = class {
  constructor(target, offset, back, url, newWindow, plusOrMinus, scrollOptions) {
    this.type = "goCommand";
    this.target = target;
    this.args = [target, offset];
    this.back = back;
    this.url = url;
    this.newWindow = newWindow;
    this.plusOrMinus = plusOrMinus;
    this.scrollOptions = scrollOptions;
  }
  op(ctx, to, offset) {
    if (this.back) {
      window.history.back();
    } else if (this.url) {
      if (to) {
        if (this.newWindow) {
          window.open(to);
        } else {
          window.location.href = to;
        }
      }
    } else {
      const plusOrMinus = this.plusOrMinus;
      const scrollOptions = this.scrollOptions;
      ctx.meta.runtime.implicitLoop(to, function(target) {
        if (target === window) {
          target = document.body;
        }
        if (plusOrMinus) {
          let boundingRect = target.getBoundingClientRect();
          let scrollShim = document.createElement("div");
          let actualOffset = plusOrMinus.value === "+" ? offset : offset * -1;
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
          target = scrollShim;
        }
        target.scrollIntoView(scrollOptions);
      });
    }
    return ctx.meta.runtime.findNext(this, ctx);
  }
  execute(ctx) {
    return ctx.meta.runtime.unifiedExec(this, ctx);
  }
};
var GoCommand = class {
  /**
   * Parse go command
   * @param {Parser} parser
   * @returns {GoCommandNode | undefined}
   */
  static parse(parser) {
    if (parser.matchToken("go")) {
      if (parser.matchToken("back")) {
        var back = true;
      } else {
        parser.matchToken("to");
        if (parser.matchToken("url")) {
          var target = parser.requireElement("stringLike");
          var url = true;
          if (parser.matchToken("in")) {
            parser.requireToken("new");
            parser.requireToken("window");
            var newWindow = true;
          }
        } else {
          parser.matchToken("the");
          var verticalPosition = parser.matchAnyToken("top", "middle", "bottom");
          var horizontalPosition = parser.matchAnyToken("left", "center", "right");
          if (verticalPosition || horizontalPosition) {
            parser.requireToken("of");
          }
          var target = parser.requireElement("unaryExpression");
          var plusOrMinus = parser.matchAnyOpToken("+", "-");
          if (plusOrMinus) {
            parser.pushFollow("px");
            try {
              var offset = parser.requireElement("expression");
            } finally {
              parser.popFollow();
            }
          }
          parser.matchToken("px");
          var smoothness = parser.matchAnyToken("smoothly", "instantly");
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
      var goCmd = new GoCommandNode(target, offset, back, url, newWindow, plusOrMinus, scrollOptions);
      return goCmd;
    }
  }
};
__publicField(GoCommand, "keyword", "go");

// src/parsetree/commands/events.js
function parseEventArgs(parser) {
  var args = [];
  if (parser.token(0).value === "(" && (parser.token(1).value === ")" || parser.token(2).value === "," || parser.token(2).value === ")")) {
    parser.matchOpToken("(");
    do {
      args.push(parser.requireTokenType("IDENTIFIER"));
    } while (parser.matchOpToken(","));
    parser.requireOpToken(")");
  }
  return args;
}
var WaitCommandEvent = class {
  constructor(events, on) {
    this.type = "waitCommand";
    this.event = events;
    this.on = on;
    this.args = [on];
  }
  op(context2, on) {
    const events = this.event;
    var target = on ? on : context2.me;
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
  execute(context2) {
    return context2.meta.runtime.unifiedExec(this, context2);
  }
};
var WaitCommandTime = class {
  constructor(time) {
    this.type = "waitCmd";
    this.time = time;
    this.args = [time];
  }
  op(context2, timeValue) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(context2.meta.runtime.findNext(this, context2));
      }, timeValue);
    });
  }
  execute(context2) {
    return context2.meta.runtime.unifiedExec(this, context2);
  }
};
var WaitCommand = class {
  /**
   * Parse wait command
   * @param {Parser} parser
   * @returns {WaitCommandEvent | WaitCommandTime | undefined}
   */
  static parse(parser) {
    if (!parser.matchToken("wait")) return;
    if (parser.matchToken("for")) {
      parser.matchToken("a");
      var events = [];
      do {
        var lookahead = parser.token(0);
        if (lookahead.type === "NUMBER" || lookahead.type === "L_PAREN") {
          events.push({
            time: parser.requireElement("expression").evaluate()
            // TODO: do we want to allow async here?
          });
        } else {
          events.push({
            name: parser.requireElement("dotOrColonPath", "Expected event name").evaluate(),
            args: parseEventArgs(parser)
          });
        }
      } while (parser.matchToken("or"));
      if (parser.matchToken("from")) {
        var on = parser.requireElement("expression");
      }
      return new WaitCommandEvent(events, on);
    } else {
      var time;
      if (parser.matchToken("a")) {
        parser.requireToken("tick");
        time = 0;
      } else {
        time = parser.requireElement("expression");
      }
      return new WaitCommandTime(time);
    }
  }
};
__publicField(WaitCommand, "keyword", "wait");
var SendCommandNode = class {
  constructor(eventName, details, toExpr) {
    this.type = "sendCommand";
    this.eventName = eventName;
    this.details = details;
    this.to = toExpr;
    this.args = [toExpr, eventName, details];
    this.toExpr = toExpr;
  }
  op(context2, to, eventName, details) {
    context2.meta.runtime.nullCheck(to, this.toExpr);
    context2.meta.runtime.implicitLoop(to, function(target) {
      context2.meta.runtime.triggerEvent(target, eventName, details, context2.me);
    });
    return context2.meta.runtime.findNext(this, context2);
  }
  execute(context2) {
    return context2.meta.runtime.unifiedExec(this, context2);
  }
};
function parseSendCmd(cmdType, parser) {
  var eventName = parser.requireElement("eventName");
  var details = parser.parseElement("namedArgumentList");
  if (cmdType === "send" && parser.matchToken("to") || cmdType === "trigger" && parser.matchToken("on")) {
    var toExpr = parser.requireElement("expression");
  } else {
    var toExpr = parser.requireElement("implicitMeTarget");
  }
  return new SendCommandNode(eventName, details, toExpr);
}
var TriggerCommand = class {
  /**
   * Parse trigger command
   * @param {Parser} parser
   * @returns {TriggerCommand | undefined}
   */
  static parse(parser) {
    if (parser.matchToken("trigger")) {
      return parseSendCmd("trigger", parser);
    }
  }
};
__publicField(TriggerCommand, "keyword", "trigger");
var SendCommand = class {
  /**
   * Parse send command
   * @param {Parser} parser
   * @returns {SendCommand | undefined}
   */
  static parse(parser) {
    if (parser.matchToken("send")) {
      return parseSendCmd("send", parser);
    }
  }
};
__publicField(SendCommand, "keyword", "send");
var EventNameNode = class {
  constructor(value) {
    this.value = value;
  }
  evaluate() {
    return this.value;
  }
};
var EventName = class {
  /**
   * Parse event name (string literal or dot/colon path)
   * @param {Parser} parser
   * @returns {EventNameNode | DotOrColonPathNode | undefined}
   */
  static parse(parser) {
    var token;
    if (token = parser.matchTokenType("STRING")) {
      return new EventNameNode(token.value);
    }
    return parser.parseElement("dotOrColonPath");
  }
};

// src/parsetree/commands/controlflow.js
var IfCommand = class {
  /**
   * Parse if command
   * @param {Parser} parser
   * @returns {IfCommand | undefined}
   */
  static parse(parser) {
    if (!parser.matchToken("if")) return;
    var expr = parser.requireElement("expression");
    parser.matchToken("then");
    var trueBranch = parser.parseElement("commandList");
    var nestedIfStmt = false;
    let elseToken = parser.matchToken("else") || parser.matchToken("otherwise");
    if (elseToken) {
      let elseIfIfToken = parser.peekToken("if");
      nestedIfStmt = elseIfIfToken != null && elseIfIfToken.line === elseToken.line;
      if (nestedIfStmt) {
        var falseBranch = parser.parseElement("command");
      } else {
        var falseBranch = parser.parseElement("commandList");
      }
    }
    if (parser.hasMore() && !nestedIfStmt) {
      parser.requireToken("end");
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
    parser.setParent(trueBranch, ifCmd);
    parser.setParent(falseBranch, ifCmd);
    return ifCmd;
  }
};
__publicField(IfCommand, "keyword", "if");
function parseRepeatExpression(parser, startedWithForToken) {
  var innerStartToken = parser.currentToken();
  var identifier;
  if (parser.matchToken("for") || startedWithForToken) {
    var identifierToken = parser.requireTokenType("IDENTIFIER");
    identifier = identifierToken.value;
    parser.requireToken("in");
    var expression = parser.requireElement("expression");
  } else if (parser.matchToken("in")) {
    identifier = "it";
    var expression = parser.requireElement("expression");
  } else if (parser.matchToken("while")) {
    var whileExpr = parser.requireElement("expression");
  } else if (parser.matchToken("until")) {
    var isUntil = true;
    if (parser.matchToken("event")) {
      var evt = parser.requireElement("dotOrColonPath", "Expected event name");
      if (parser.matchToken("from")) {
        var on = parser.requireElement("expression");
      }
    } else {
      var whileExpr = parser.requireElement("expression");
    }
  } else {
    if (!parser.commandBoundary(parser.currentToken()) && parser.currentToken().value !== "forever") {
      var times = parser.requireElement("expression");
      parser.requireToken("times");
    } else {
      parser.matchToken("forever");
      var forever = true;
    }
  }
  if (parser.matchToken("index")) {
    var identifierToken = parser.requireTokenType("IDENTIFIER");
    var indexIdentifier = identifierToken.value;
  } else if (parser.matchToken("indexed")) {
    parser.requireToken("by");
    var identifierToken = parser.requireTokenType("IDENTIFIER");
    var indexIdentifier = identifierToken.value;
  }
  var loop = parser.parseElement("commandList");
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
  if (parser.hasMore()) {
    parser.requireToken("end");
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
  parser.setParent(loop, repeatCmd);
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
  parser.setParent(repeatCmd, repeatInit);
  return repeatInit;
}
var RepeatCommand = class {
  /**
   * Parse repeat command
   * @param {Parser} parser
   * @returns {RepeatCommand | undefined}
   */
  static parse(parser) {
    if (parser.matchToken("repeat")) {
      return parseRepeatExpression(parser, false);
    }
  }
};
__publicField(RepeatCommand, "keyword", "repeat");
var ForCommand = class {
  /**
   * Parse for command
   * @param {Parser} parser
   * @returns {ForCommand | undefined}
   */
  static parse(parser) {
    if (parser.matchToken("for")) {
      return parseRepeatExpression(parser, true);
    }
  }
};
__publicField(ForCommand, "keyword", "for");
var ContinueCommand = class {
  /**
   * Parse continue command
   * @param {Parser} parser
   * @returns {ContinueCommand | undefined}
   */
  static parse(parser) {
    if (!parser.matchToken("continue")) return;
    var command = {
      op: function(context2) {
        for (var parent = this.parent; true; parent = parent.parent) {
          if (parent == void 0) {
            parser.raiseParseError("Command `continue` cannot be used outside of a `repeat` loop.");
          }
          if (parent.loop != void 0) {
            return parent.resolveNext(context2);
          }
        }
      }
    };
    return command;
  }
};
__publicField(ContinueCommand, "keyword", "continue");
var BreakCommand = class {
  /**
   * Parse break command
   * @param {Parser} parser
   * @returns {BreakCommand | undefined}
   */
  static parse(parser) {
    if (!parser.matchToken("break")) return;
    var command = {
      op: function(context2) {
        for (var parent = this.parent; true; parent = parent.parent) {
          if (parent == void 0) {
            parser.raiseParseError("Command `continue` cannot be used outside of a `repeat` loop.");
          }
          if (parent.loop != void 0) {
            return context2.meta.runtime.findNext(parent.parent, context2);
          }
        }
      }
    };
    return command;
  }
};
__publicField(BreakCommand, "keyword", "break");
var TellCommand = class {
  /**
   * Parse tell command
   * @param {Parser} parser
   * @returns {TellCommand | undefined}
   */
  static parse(parser) {
    var startToken = parser.currentToken();
    if (!parser.matchToken("tell")) return;
    var value = parser.requireElement("expression");
    var body = parser.requireElement("commandList");
    if (parser.hasMore() && !parser.featureStart(parser.currentToken())) {
      parser.requireToken("end");
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
    parser.setParent(body, tellCmd);
    return tellCmd;
  }
};
__publicField(TellCommand, "keyword", "tell");

// src/parsetree/commands/execution.js
var JsBody = class {
  /**
   * Parse JavaScript body
   * @param {Parser} parser
   * @returns {Object}
   */
  static parse(parser) {
    var jsSourceStart = parser.currentToken().start;
    var jsLastToken = parser.currentToken();
    var funcNames = [];
    var funcName = "";
    var expectFunctionDeclaration = false;
    while (parser.hasMore()) {
      jsLastToken = parser.consumeToken();
      var peek = parser.token(0, true);
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
      jsSource: parser.source.substring(jsSourceStart, jsSourceEnd)
    };
  }
};
var JsCommand = class {
  /**
   * Parse js command
   * @param {Parser} parser
   * @returns {JsCommand | undefined}
   */
  static parse(parser) {
    if (!parser.matchToken("js")) return;
    var inputs = [];
    if (parser.matchOpToken("(")) {
      if (parser.matchOpToken(")")) {
      } else {
        do {
          var inp = parser.requireTokenType("IDENTIFIER");
          inputs.push(inp.value);
        } while (parser.matchOpToken(","));
        parser.requireOpToken(")");
      }
    }
    var jsBody = parser.requireElement("jsBody");
    parser.matchToken("end");
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
  }
};
__publicField(JsCommand, "keyword", "js");
var AsyncCommand = class {
  /**
   * Parse async command
   * @param {Parser} parser
   * @returns {AsyncCommand | undefined}
   */
  static parse(parser) {
    if (!parser.matchToken("async")) return;
    if (parser.matchToken("do")) {
      var body = parser.requireElement("commandList");
      var end = body;
      while (end.next) end = end.next;
      end.next = Runtime.HALT;
      parser.requireToken("end");
    } else {
      var body = parser.requireElement("command");
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
    parser.setParent(body, command);
    return command;
  }
};
__publicField(AsyncCommand, "keyword", "async");
function parseCallOrGet(parser) {
  var expr = parser.requireElement("expression");
  var callCmd = {
    expr,
    args: [expr],
    op: function(context2, result) {
      context2.result = result;
      return context2.meta.runtime.findNext(callCmd, context2);
    }
  };
  return callCmd;
}
var CallCommand = class {
  /**
   * Parse call command
   * @param {Parser} parser
   * @returns {CallCommand | undefined}
   */
  static parse(parser) {
    if (!parser.matchToken("call")) return;
    var call = parseCallOrGet(parser);
    if (call.expr && call.expr.type !== "functionCall") {
      parser.raiseParseError("Must be a function invocation");
    }
    return call;
  }
};
__publicField(CallCommand, "keyword", "call");
var GetCommand = class {
  /**
   * Parse get command
   * @param {Parser} parser
   * @returns {GetCommand | undefined}
   */
  static parse(parser) {
    if (parser.matchToken("get")) {
      return parseCallOrGet(parser);
    }
  }
};
__publicField(GetCommand, "keyword", "get");

// src/parsetree/commands/pseudoCommand.js
var PseudoCommandWithTarget = class {
  constructor(realRoot, root) {
    this.type = "pseudoCommand";
    this.root = realRoot;
    this.argExressions = root.argExressions;
    this.args = [realRoot, root.argExressions];
    this._root = root;
    this._realRoot = realRoot;
  }
  op(context2, rootRoot, args) {
    context2.meta.runtime.nullCheck(rootRoot, this._realRoot);
    var func = rootRoot[this._root.root.name];
    context2.meta.runtime.nullCheck(func, this._root);
    if (func.hyperfunc) {
      args.push(context2);
    }
    context2.result = func.apply(rootRoot, args);
    return context2.meta.runtime.findNext(this, context2);
  }
  execute(context2) {
    return context2.meta.runtime.unifiedExec(this, context2);
  }
};
var PseudoCommandSimple = class {
  constructor(expr) {
    this.type = "pseudoCommand";
    this.expr = expr;
    this.args = [expr];
  }
  op(context2, result) {
    context2.result = result;
    return context2.meta.runtime.findNext(this, context2);
  }
  execute(context2) {
    return context2.meta.runtime.unifiedExec(this, context2);
  }
};
var PseudoCommand = class {
  /**
   * Parse pseudo-command
   * @param {Parser} parser
   * @returns {PseudoCommandWithTarget | PseudoCommandSimple | undefined}
   */
  static parse(parser) {
    let lookAhead = parser.token(1);
    if (!(lookAhead && lookAhead.op && (lookAhead.value === "." || lookAhead.value === "("))) {
      return null;
    }
    var expr = parser.requireElement("primaryExpression");
    var rootRoot = expr.root;
    var root = expr;
    while (rootRoot.root != null) {
      root = root.root;
      rootRoot = rootRoot.root;
    }
    if (expr.type !== "functionCall") {
      parser.raiseParseError("Pseudo-commands must be function calls");
    }
    if (root.type === "functionCall" && root.root.root == null) {
      if (parser.matchAnyToken("the", "to", "on", "with", "into", "from", "at")) {
        var realRoot = parser.requireElement("expression");
      } else if (parser.matchToken("me")) {
        var realRoot = parser.requireElement("implicitMeTarget");
      }
    }
    if (realRoot) {
      return new PseudoCommandWithTarget(realRoot, root);
    } else {
      return new PseudoCommandSimple(expr);
    }
  }
};

// src/parsetree/commands/dom.js
var HIDE_SHOW_STRATEGIES = {
  display: function(op, element, arg, runtime2) {
    if (arg) {
      element.style.display = arg;
    } else if (op === "toggle") {
      if (getComputedStyle(element).display === "none") {
        HIDE_SHOW_STRATEGIES.display("show", element, arg, runtime2);
      } else {
        HIDE_SHOW_STRATEGIES.display("hide", element, arg, runtime2);
      }
    } else if (op === "hide") {
      const internalData = runtime2.getInternalData(element);
      if (internalData.originalDisplay == null) {
        internalData.originalDisplay = element.style.display;
      }
      element.style.display = "none";
    } else {
      const internalData = runtime2.getInternalData(element);
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
function parseShowHideTarget(parser) {
  var target;
  var currentTokenValue = parser.currentToken();
  if (currentTokenValue.value === "when" || currentTokenValue.value === "with" || parser.commandBoundary(currentTokenValue)) {
    target = parser.parseElement("implicitMeTarget");
  } else {
    target = parser.parseElement("expression");
  }
  return target;
}
function resolveHideShowStrategy(parser, name) {
  var configDefault = config.defaultHideShowStrategy;
  var strategies = HIDE_SHOW_STRATEGIES;
  if (config.hideShowStrategies) {
    strategies = Object.assign({}, strategies, config.hideShowStrategies);
  }
  name = name || configDefault || "display";
  var value = strategies[name];
  if (value == null) {
    parser.raiseParseError("Unknown show/hide strategy : " + name);
  }
  return value;
}
var AddCommandClass = class {
  constructor(classRefs, toExpr, when) {
    this.type = "addCommand";
    this.classRefs = classRefs;
    this.to = toExpr;
    this.args = [toExpr, classRefs];
    this.when = when;
    this.toExpr = toExpr;
  }
  op(context2, to, classRefs) {
    const when = this.when;
    const toExpr = this.toExpr;
    context2.meta.runtime.nullCheck(to, toExpr);
    context2.meta.runtime.forEach(classRefs, function(classRef) {
      context2.meta.runtime.implicitLoop(to, function(target) {
        if (when) {
          context2.result = target;
          let whenResult = context2.meta.runtime.evaluateNoPromise(when, context2);
          if (whenResult) {
            if (target instanceof Element) target.classList.add(classRef.className);
          } else {
            if (target instanceof Element) target.classList.remove(classRef.className);
          }
          context2.result = null;
        } else {
          if (target instanceof Element) target.classList.add(classRef.className);
        }
      });
    });
    return context2.meta.runtime.findNext(this, context2);
  }
  execute(ctx) {
    return ctx.meta.runtime.unifiedExec(this, ctx);
  }
};
var AddCommandAttribute = class {
  constructor(attributeRef, toExpr, when) {
    this.type = "addCmd";
    this.attributeRef = attributeRef;
    this.to = toExpr;
    this.args = [toExpr];
    this.when = when;
    this.toExpr = toExpr;
  }
  op(context2, to, attrRef) {
    const when = this.when;
    const attributeRef = this.attributeRef;
    const toExpr = this.toExpr;
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
  }
  execute(ctx) {
    return ctx.meta.runtime.unifiedExec(this, ctx);
  }
};
var AddCommandCSS = class {
  constructor(cssDeclaration, toExpr) {
    this.type = "addCmd";
    this.cssDeclaration = cssDeclaration;
    this.to = toExpr;
    this.args = [toExpr, cssDeclaration];
    this.toExpr = toExpr;
  }
  op(context2, to, css) {
    context2.meta.runtime.nullCheck(to, this.toExpr);
    context2.meta.runtime.implicitLoop(to, function(target) {
      target.style.cssText += css;
    });
    return context2.meta.runtime.findNext(this, context2);
  }
  execute(ctx) {
    return ctx.meta.runtime.unifiedExec(this, ctx);
  }
};
var AddCommand = class {
  static parse(parser) {
    if (!parser.matchToken("add")) return;
    var classRef = parser.parseElement("classRef");
    var attributeRef = null;
    var cssDeclaration = null;
    if (classRef == null) {
      attributeRef = parser.parseElement("attributeRef");
      if (attributeRef == null) {
        cssDeclaration = parser.parseElement("styleLiteral");
        if (cssDeclaration == null) {
          parser.raiseParseError("Expected either a class reference or attribute expression");
        }
      }
    } else {
      var classRefs = [classRef];
      while (classRef = parser.parseElement("classRef")) {
        classRefs.push(classRef);
      }
    }
    if (parser.matchToken("to")) {
      var toExpr = parser.requireElement("expression");
    } else {
      var toExpr = parser.requireElement("implicitMeTarget");
    }
    if (parser.matchToken("when")) {
      if (cssDeclaration) {
        parser.raiseParseError("Only class and properties are supported with a when clause");
      }
      var when = parser.requireElement("expression");
    }
    if (classRefs) {
      return new AddCommandClass(classRefs, toExpr, when);
    } else if (attributeRef) {
      return new AddCommandAttribute(attributeRef, toExpr, when);
    } else {
      return new AddCommandCSS(cssDeclaration, toExpr);
    }
  }
};
__publicField(AddCommand, "keyword", "add");
var RemoveCommandElement = class {
  constructor(elementExpr, fromExpr) {
    this.type = "removeCommand";
    this.elementExpr = elementExpr;
    this.from = fromExpr;
    this.args = [elementExpr, fromExpr];
  }
  op(context2, element, from) {
    context2.meta.runtime.nullCheck(element, this.elementExpr);
    context2.meta.runtime.implicitLoop(element, function(target) {
      if (target.parentElement && (from == null || from.contains(target))) {
        target.parentElement.removeChild(target);
      }
    });
    return context2.meta.runtime.findNext(this, context2);
  }
  execute(ctx) {
    return ctx.meta.runtime.unifiedExec(this, ctx);
  }
};
var RemoveCommandClassOrAttr = class {
  constructor(classRefs, attributeRef, fromExpr) {
    this.type = "removeCommand";
    this.classRefs = classRefs;
    this.attributeRef = attributeRef;
    this.from = fromExpr;
    this.args = [classRefs, fromExpr];
    this.fromExpr = fromExpr;
  }
  op(context2, classRefs, from) {
    const attributeRef = this.attributeRef;
    const fromExpr = this.fromExpr;
    context2.meta.runtime.nullCheck(from, fromExpr);
    if (classRefs) {
      context2.meta.runtime.forEach(classRefs, function(classRef) {
        context2.meta.runtime.implicitLoop(from, function(target) {
          target.classList.remove(classRef.className);
        });
      });
    } else {
      context2.meta.runtime.implicitLoop(from, function(target) {
        target.removeAttribute(attributeRef.name);
      });
    }
    return context2.meta.runtime.findNext(this, context2);
  }
  execute(ctx) {
    return ctx.meta.runtime.unifiedExec(this, ctx);
  }
};
var RemoveCommand = class {
  static parse(parser) {
    if (!parser.matchToken("remove")) return;
    var classRef = parser.parseElement("classRef");
    var attributeRef = null;
    var elementExpr = null;
    if (classRef == null) {
      attributeRef = parser.parseElement("attributeRef");
      if (attributeRef == null) {
        elementExpr = parser.parseElement("expression");
        if (elementExpr == null) {
          parser.raiseParseError(
            "Expected either a class reference, attribute expression or value expression"
          );
        }
      }
    } else {
      var classRefs = [classRef];
      while (classRef = parser.parseElement("classRef")) {
        classRefs.push(classRef);
      }
    }
    if (parser.matchToken("from")) {
      var fromExpr = parser.requireElement("expression");
    } else {
      if (elementExpr == null) {
        var fromExpr = parser.requireElement("implicitMeTarget");
      }
    }
    if (elementExpr) {
      return new RemoveCommandElement(elementExpr, fromExpr);
    } else {
      return new RemoveCommandClassOrAttr(classRefs, attributeRef, fromExpr);
    }
  }
};
__publicField(RemoveCommand, "keyword", "remove");
var ToggleCommandImpl = class {
  constructor(classRef, classRef2, classRefs, attributeRef, onExpr, time, evt, from, visibility, between, hideShowStrategy) {
    this.type = "toggleCommand";
    this.classRef = classRef;
    this.classRef2 = classRef2;
    this.classRefs = classRefs;
    this.attributeRef = attributeRef;
    this.on = onExpr;
    this.time = time;
    this.evt = evt;
    this.from = from;
    this.visibility = visibility;
    this.between = between;
    this.hideShowStrategy = hideShowStrategy;
    this.onExpr = onExpr;
    this.args = [onExpr, time, evt, from, classRef, classRef2, classRefs];
  }
  toggle(context2, on, classRef, classRef2, classRefs) {
    context2.meta.runtime.nullCheck(on, this.onExpr);
    if (this.visibility) {
      context2.meta.runtime.implicitLoop(on, (target) => {
        this.hideShowStrategy("toggle", target, null, context2.meta.runtime);
      });
    } else if (this.between) {
      context2.meta.runtime.implicitLoop(on, (target) => {
        if (target.classList.contains(classRef.className)) {
          target.classList.remove(classRef.className);
          target.classList.add(classRef2.className);
        } else {
          target.classList.add(classRef.className);
          target.classList.remove(classRef2.className);
        }
      });
    } else if (classRefs) {
      context2.meta.runtime.forEach(classRefs, (classRef3) => {
        context2.meta.runtime.implicitLoop(on, (target) => {
          target.classList.toggle(classRef3.className);
        });
      });
    } else {
      context2.meta.runtime.implicitLoop(on, (target) => {
        if (target.hasAttribute(this.attributeRef.name)) {
          target.removeAttribute(this.attributeRef.name);
        } else {
          target.setAttribute(this.attributeRef.name, this.attributeRef.value);
        }
      });
    }
  }
  op(context2, on, time, evt, from, classRef, classRef2, classRefs) {
    if (time) {
      return new Promise((resolve) => {
        this.toggle(context2, on, classRef, classRef2, classRefs);
        setTimeout(() => {
          this.toggle(context2, on, classRef, classRef2, classRefs);
          resolve(context2.meta.runtime.findNext(this, context2));
        }, time);
      });
    } else if (evt) {
      return new Promise((resolve) => {
        var target = from || context2.me;
        target.addEventListener(
          evt,
          () => {
            this.toggle(context2, on, classRef, classRef2, classRefs);
            resolve(context2.meta.runtime.findNext(this, context2));
          },
          { once: true }
        );
        this.toggle(context2, on, classRef, classRef2, classRefs);
      });
    } else {
      this.toggle(context2, on, classRef, classRef2, classRefs);
      return context2.meta.runtime.findNext(this, context2);
    }
  }
  execute(ctx) {
    return ctx.meta.runtime.unifiedExec(this, ctx);
  }
};
var ToggleCommand = class {
  static parse(parser) {
    if (!parser.matchToken("toggle")) return;
    parser.matchAnyToken("the", "my");
    var visibility = false;
    var between = false;
    var hideShowStrategy = null;
    var onExpr = null;
    var classRef = null;
    var classRef2 = null;
    var classRefs = null;
    var attributeRef = null;
    if (parser.currentToken().type === "STYLE_REF") {
      let styleRef = parser.consumeToken();
      var name = styleRef.value.substr(1);
      visibility = true;
      hideShowStrategy = resolveHideShowStrategy(parser, name);
      if (parser.matchToken("of")) {
        parser.pushFollow("with");
        try {
          onExpr = parser.requireElement("expression");
        } finally {
          parser.popFollow();
        }
      } else {
        onExpr = parser.requireElement("implicitMeTarget");
      }
    } else if (parser.matchToken("between")) {
      between = true;
      classRef = parser.parseElement("classRef");
      parser.requireToken("and");
      classRef2 = parser.requireElement("classRef");
    } else {
      classRef = parser.parseElement("classRef");
      if (classRef == null) {
        attributeRef = parser.parseElement("attributeRef");
        if (attributeRef == null) {
          parser.raiseParseError("Expected either a class reference or attribute expression");
        }
      } else {
        classRefs = [classRef];
        while (classRef = parser.parseElement("classRef")) {
          classRefs.push(classRef);
        }
      }
    }
    if (visibility !== true) {
      if (parser.matchToken("on")) {
        onExpr = parser.requireElement("expression");
      } else {
        onExpr = parser.requireElement("implicitMeTarget");
      }
    }
    var time = null;
    var evt = null;
    var from = null;
    if (parser.matchToken("for")) {
      time = parser.requireElement("expression");
    } else if (parser.matchToken("until")) {
      evt = parser.requireElement("dotOrColonPath", "Expected event name");
      if (parser.matchToken("from")) {
        from = parser.requireElement("expression");
      }
    }
    return new ToggleCommandImpl(classRef, classRef2, classRefs, attributeRef, onExpr, time, evt, from, visibility, between, hideShowStrategy);
  }
};
__publicField(ToggleCommand, "keyword", "toggle");
var HideCommandImpl = class {
  constructor(targetExpr, hideShowStrategy) {
    this.type = "hideCommand";
    this.target = targetExpr;
    this.targetExpr = targetExpr;
    this.hideShowStrategy = hideShowStrategy;
    this.args = [targetExpr];
  }
  op(ctx, target) {
    ctx.meta.runtime.nullCheck(target, this.targetExpr);
    ctx.meta.runtime.implicitLoop(target, (elt) => {
      this.hideShowStrategy("hide", elt, null, ctx.meta.runtime);
    });
    return ctx.meta.runtime.findNext(this, ctx);
  }
  execute(ctx) {
    return ctx.meta.runtime.unifiedExec(this, ctx);
  }
};
var HideCommand = class {
  static parse(parser) {
    if (!parser.matchToken("hide")) return;
    var targetExpr = parseShowHideTarget(parser);
    var name = null;
    if (parser.matchToken("with")) {
      name = parser.requireTokenType("IDENTIFIER", "STYLE_REF").value;
      if (name.indexOf("*") === 0) {
        name = name.substr(1);
      }
    }
    var hideShowStrategy = resolveHideShowStrategy(parser, name);
    return new HideCommandImpl(targetExpr, hideShowStrategy);
  }
};
__publicField(HideCommand, "keyword", "hide");
var ShowCommandImpl = class {
  constructor(targetExpr, when, arg, hideShowStrategy) {
    this.type = "showCommand";
    this.target = targetExpr;
    this.targetExpr = targetExpr;
    this.when = when;
    this.arg = arg;
    this.hideShowStrategy = hideShowStrategy;
    this.args = [targetExpr];
  }
  op(ctx, target) {
    ctx.meta.runtime.nullCheck(target, this.targetExpr);
    ctx.meta.runtime.implicitLoop(target, (elt) => {
      if (this.when) {
        ctx.result = elt;
        let whenResult = ctx.meta.runtime.evaluateNoPromise(this.when, ctx);
        if (whenResult) {
          this.hideShowStrategy("show", elt, this.arg, ctx.meta.runtime);
        } else {
          this.hideShowStrategy("hide", elt, null, ctx.meta.runtime);
        }
        ctx.result = null;
      } else {
        this.hideShowStrategy("show", elt, this.arg, ctx.meta.runtime);
      }
    });
    return ctx.meta.runtime.findNext(this, ctx);
  }
  execute(ctx) {
    return ctx.meta.runtime.unifiedExec(this, ctx);
  }
};
var ShowCommand = class {
  static parse(parser) {
    if (!parser.matchToken("show")) return;
    var targetExpr = parseShowHideTarget(parser);
    var name = null;
    if (parser.matchToken("with")) {
      name = parser.requireTokenType("IDENTIFIER", "STYLE_REF").value;
      if (name.indexOf("*") === 0) {
        name = name.substr(1);
      }
    }
    var arg = null;
    if (parser.matchOpToken(":")) {
      var tokenArr = parser.consumeUntilWhitespace();
      parser.matchTokenType("WHITESPACE");
      arg = tokenArr.map(function(t) {
        return t.value;
      }).join("");
    }
    if (parser.matchToken("when")) {
      var when = parser.requireElement("expression");
    }
    var hideShowStrategy = resolveHideShowStrategy(parser, name);
    return new ShowCommandImpl(targetExpr, when, arg, hideShowStrategy);
  }
};
__publicField(ShowCommand, "keyword", "show");
function parsePseudopossessiveTarget(parser) {
  var targets;
  if (parser.matchToken("the") || parser.matchToken("element") || parser.matchToken("elements") || parser.currentToken().type === "CLASS_REF" || parser.currentToken().type === "ID_REF" || parser.currentToken().op && parser.currentToken().value === "<") {
    parser.possessivesDisabled = true;
    try {
      targets = parser.parseElement("expression");
    } finally {
      delete parser.possessivesDisabled;
    }
    if (parser.matchOpToken("'")) {
      parser.requireToken("s");
    }
  } else if (parser.currentToken().type === "IDENTIFIER" && parser.currentToken().value === "its") {
    var identifier = parser.matchToken("its");
    targets = {
      type: "pseudopossessiveIts",
      token: identifier,
      name: identifier.value,
      evaluate: function(context2) {
        return context2.meta.runtime.resolveSymbol("it", context2);
      }
    };
  } else {
    parser.matchToken("my") || parser.matchToken("me");
    targets = parser.parseElement("implicitMeTarget");
  }
  return targets;
}
var TakeCommandClass = class {
  constructor(classRefs, fromExpr, forExpr) {
    this.type = "takeCommand";
    this.classRefs = classRefs;
    this.from = fromExpr;
    this.forElt = forExpr;
    this.forExpr = forExpr;
    this.args = [classRefs, fromExpr, forExpr];
  }
  op(context2, classRefs, from, forElt) {
    context2.meta.runtime.nullCheck(forElt, this.forExpr);
    context2.meta.runtime.implicitLoop(classRefs, (classRef) => {
      var clazz = classRef.className;
      if (from) {
        context2.meta.runtime.implicitLoop(from, (target) => {
          target.classList.remove(clazz);
        });
      } else {
        context2.meta.runtime.implicitLoop(classRef, (target) => {
          target.classList.remove(clazz);
        });
      }
      context2.meta.runtime.implicitLoop(forElt, (target) => {
        target.classList.add(clazz);
      });
    });
    return context2.meta.runtime.findNext(this, context2);
  }
  execute(ctx) {
    return ctx.meta.runtime.unifiedExec(this, ctx);
  }
};
var TakeCommandAttribute = class {
  constructor(attributeRef, fromExpr, forExpr, replacementValue) {
    this.type = "takeCommand";
    this.attributeRef = attributeRef;
    this.from = fromExpr;
    this.fromExpr = fromExpr;
    this.forElt = forExpr;
    this.forExpr = forExpr;
    this.replacementValue = replacementValue;
    this.args = [fromExpr, forExpr, replacementValue];
  }
  op(context2, from, forElt, replacementValue) {
    context2.meta.runtime.nullCheck(from, this.fromExpr);
    context2.meta.runtime.nullCheck(forElt, this.forExpr);
    context2.meta.runtime.implicitLoop(from, (target) => {
      if (!replacementValue) {
        target.removeAttribute(this.attributeRef.name);
      } else {
        target.setAttribute(this.attributeRef.name, replacementValue);
      }
    });
    context2.meta.runtime.implicitLoop(forElt, (target) => {
      target.setAttribute(this.attributeRef.name, this.attributeRef.value || "");
    });
    return context2.meta.runtime.findNext(this, context2);
  }
  execute(ctx) {
    return ctx.meta.runtime.unifiedExec(this, ctx);
  }
};
var TakeCommand = class {
  /**
   * Parse take command
   * @param {Parser} parser
   * @returns {TakeCommand | undefined}
   */
  static parse(parser) {
    if (parser.matchToken("take")) {
      let classRef = null;
      let classRefs = [];
      while (classRef = parser.parseElement("classRef")) {
        classRefs.push(classRef);
      }
      var attributeRef = null;
      var replacementValue = null;
      let weAreTakingClasses = classRefs.length > 0;
      if (!weAreTakingClasses) {
        attributeRef = parser.parseElement("attributeRef");
        if (attributeRef == null) {
          parser.raiseParseError("Expected either a class reference or attribute expression");
        }
        if (parser.matchToken("with")) {
          replacementValue = parser.requireElement("expression");
        }
      }
      if (parser.matchToken("from")) {
        var fromExpr = parser.requireElement("expression");
      }
      if (parser.matchToken("for")) {
        var forExpr = parser.requireElement("expression");
      } else {
        var forExpr = parser.requireElement("implicitMeTarget");
      }
      if (weAreTakingClasses) {
        return new TakeCommandClass(classRefs, fromExpr, forExpr);
      } else {
        return new TakeCommandAttribute(attributeRef, fromExpr, forExpr, replacementValue);
      }
    }
  }
};
__publicField(TakeCommand, "keyword", "take");
var MeasureCommandImpl = class {
  constructor(targetExpr, propsToMeasure) {
    this.type = "measureCommand";
    this.properties = propsToMeasure;
    this.targetExpr = targetExpr;
    this.args = [targetExpr];
  }
  op(ctx, target) {
    ctx.meta.runtime.nullCheck(target, this.targetExpr);
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
    ctx.meta.runtime.forEach(this.properties, (prop) => {
      if (prop in ctx.result) ctx.locals[prop] = ctx.result[prop];
      else throw "No such measurement as " + prop;
    });
    return ctx.meta.runtime.findNext(this, ctx);
  }
  execute(ctx) {
    return ctx.meta.runtime.unifiedExec(this, ctx);
  }
};
var MeasureCommand = class {
  /**
   * Parse measure command
   * @param {Parser} parser
   * @returns {MeasureCommand | undefined}
   */
  static parse(parser) {
    if (!parser.matchToken("measure")) return;
    var targetExpr = parsePseudopossessiveTarget(parser);
    var propsToMeasure = [];
    if (!parser.commandBoundary(parser.currentToken()))
      do {
        propsToMeasure.push(parser.matchTokenType("IDENTIFIER").value);
      } while (parser.matchOpToken(","));
    return new MeasureCommandImpl(targetExpr, propsToMeasure);
  }
};
__publicField(MeasureCommand, "keyword", "measure");

// src/parsetree/commands/animations.js
function parsePseudopossessiveTarget2(parser) {
  var targets;
  if (parser.matchToken("the") || parser.matchToken("element") || parser.matchToken("elements") || parser.currentToken().type === "CLASS_REF" || parser.currentToken().type === "ID_REF" || parser.currentToken().op && parser.currentToken().value === "<") {
    parser.possessivesDisabled = true;
    try {
      targets = parser.parseElement("expression");
    } finally {
      delete parser.possessivesDisabled;
    }
    if (parser.matchOpToken("'")) {
      parser.requireToken("s");
    }
  } else if (parser.currentToken().type === "IDENTIFIER" && parser.currentToken().value === "its") {
    var identifier = parser.matchToken("its");
    targets = {
      type: "pseudopossessiveIts",
      token: identifier,
      name: identifier.value,
      evaluate: function(context2) {
        return context2.meta.runtime.resolveSymbol("it", context2);
      }
    };
  } else {
    parser.matchToken("my") || parser.matchToken("me");
    targets = parser.parseElement("implicitMeTarget");
  }
  return targets;
}
var SettleCommand = class {
  /**
   * Parse settle command
   * @param {Parser} parser
   * @returns {SettleCommand | undefined}
   */
  static parse(parser) {
    if (parser.matchToken("settle")) {
      if (!parser.commandBoundary(parser.currentToken())) {
        var onExpr = parser.requireElement("expression");
      } else {
        var onExpr = parser.requireElement("implicitMeTarget");
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
  }
};
__publicField(SettleCommand, "keyword", "settle");
var TransitionCommand = class {
  /**
   * Parse transition command
   * @param {Parser} parser
   * @returns {TransitionCommand | undefined}
   */
  static parse(parser) {
    if (parser.matchToken("transition")) {
      var targetsExpr = parsePseudopossessiveTarget2(parser);
      var properties = [];
      var from = [];
      var to = [];
      var currentToken = parser.currentToken();
      while (!parser.commandBoundary(currentToken) && currentToken.value !== "over" && currentToken.value !== "using") {
        if (parser.currentToken().type === "STYLE_REF") {
          let styleRef = parser.consumeToken();
          let styleProp = styleRef.value.substr(1);
          properties.push({
            type: "styleRefValue",
            evaluate: function() {
              return styleProp;
            }
          });
        } else {
          properties.push(parser.requireElement("stringLike"));
        }
        if (parser.matchToken("from")) {
          from.push(parser.requireElement("expression"));
        } else {
          from.push(null);
        }
        parser.requireToken("to");
        if (parser.matchToken("initial")) {
          to.push({
            type: "initial_literal",
            evaluate: function() {
              return "initial";
            }
          });
        } else {
          to.push(parser.requireElement("expression"));
        }
        currentToken = parser.currentToken();
      }
      if (parser.matchToken("over")) {
        var over = parser.requireElement("expression");
      } else if (parser.matchToken("using")) {
        var usingExpr = parser.requireElement("expression");
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
  }
};
__publicField(TransitionCommand, "keyword", "transition");

// src/parsetree/features/set.js
var SetFeature = class {
  /**
   * Parse set feature
   * @param {Parser} parser
   * @returns {SetFeature | undefined}
   */
  static parse(parser) {
    let setCmd = parser.parseElement("setCommand");
    if (setCmd) {
      if (setCmd.target.scope !== "element") {
        parser.raiseParseError("variables declared at the feature level must be element scoped.");
      }
      let setFeature = {
        start: setCmd,
        install: function(target, source, args, runtime2) {
          setCmd && setCmd.execute(runtime2.makeContext(target, setFeature, target, null));
        }
      };
      parser.ensureTerminated(setCmd);
      return setFeature;
    }
  }
};
__publicField(SetFeature, "keyword", "set");

// src/parsetree/features/init.js
var InitFeature = class {
  /**
   * Parse init feature
   * @param {Parser} parser
   * @returns {InitFeature | undefined}
   */
  static parse(parser) {
    if (!parser.matchToken("init")) return;
    var immediately = parser.matchToken("immediately");
    var start = parser.requireElement("commandList");
    var initFeature = {
      start,
      install: function(target, source, args, runtime2) {
        let handler = function() {
          start && start.execute(runtime2.makeContext(target, initFeature, target, null));
        };
        if (immediately) {
          handler();
        } else {
          setTimeout(handler, 0);
        }
      }
    };
    parser.ensureTerminated(start);
    parser.setParent(start, initFeature);
    return initFeature;
  }
};
__publicField(InitFeature, "keyword", "init");

// src/parsetree/features/worker.js
var WorkerFeature = class {
  /**
   * Parse worker feature
   * @param {Parser} parser
   * @returns {WorkerFeature | undefined}
   */
  static parse(parser) {
    if (parser.matchToken("worker")) {
      parser.raiseParseError(
        "In order to use the 'worker' feature, include the _hyperscript worker plugin. See https://hyperscript.org/features/worker/ for more info."
      );
      return void 0;
    }
  }
};
__publicField(WorkerFeature, "keyword", "worker");

// src/parsetree/features/behavior.js
var BehaviorFeature = class {
  /**
   * Parse behavior feature
   * @param {Parser} parser
   * @returns {BehaviorFeature | undefined}
   */
  static parse(parser) {
    if (!parser.matchToken("behavior")) return;
    var path = parser.requireElement("dotOrColonPath").evaluate();
    var nameSpace = path.split(".");
    var name = nameSpace.pop();
    var formalParams = [];
    if (parser.matchOpToken("(") && !parser.matchOpToken(")")) {
      do {
        formalParams.push(parser.requireTokenType("IDENTIFIER").value);
      } while (parser.matchOpToken(","));
      parser.requireOpToken(")");
    }
    var hs = parser.requireElement("hyperscript");
    for (var i = 0; i < hs.features.length; i++) {
      var feature = hs.features[i];
      feature.behavior = path;
    }
    return {
      install: function(target, source, args, runtime2) {
        runtime2.assignToNamespace(
          runtime2.globalScope.document && runtime2.globalScope.document.body,
          nameSpace,
          name,
          function(target2, source2, innerArgs) {
            var internalData = runtime2.getInternalData(target2);
            var elementScope = getOrInitObject(internalData, path + "Scope");
            for (var i2 = 0; i2 < formalParams.length; i2++) {
              elementScope[formalParams[i2]] = innerArgs[formalParams[i2]];
            }
            hs.apply(target2, source2, null, runtime2);
          }
        );
      }
    };
  }
};
__publicField(BehaviorFeature, "keyword", "behavior");

// src/parsetree/features/install.js
var InstallFeature = class {
  /**
   * Parse install feature
   * @param {Parser} parser
   * @returns {InstallFeature | undefined}
   */
  static parse(parser) {
    if (!parser.matchToken("install")) return;
    var behaviorPath = parser.requireElement("dotOrColonPath").evaluate();
    var behaviorNamespace = behaviorPath.split(".");
    var args = parser.parseElement("namedArgumentList");
    var installFeature;
    return installFeature = {
      install: function(target, source, installArgs, runtime2) {
        runtime2.unifiedEval(
          {
            args: [args],
            op: function(ctx, args2) {
              var behavior = runtime2.globalScope;
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
          runtime2.makeContext(target, installFeature, target, null)
        );
      }
    };
  }
};
__publicField(InstallFeature, "keyword", "install");

// src/parsetree/features/js.js
var JsFeature = class {
  /**
   * Parse js feature
   * @param {Parser} parser
   * @returns {JsFeature | undefined}
   */
  static parse(parser) {
    if (!parser.matchToken("js")) return;
    var jsBody = parser.requireElement("jsBody");
    var jsSource = jsBody.jsSource + "\nreturn { " + jsBody.exposedFunctionNames.map(function(name) {
      return name + ":" + name;
    }).join(",") + " } ";
    var func = new Function(jsSource);
    return {
      jsSource,
      function: func,
      exposedFunctionNames: jsBody.exposedFunctionNames,
      install: function(target, source, args, runtime2) {
        Object.assign(runtime2.globalScope, func());
      }
    };
  }
};

// src/parsetree/features/def.js
var DefFeature = class {
  /**
   * Parse def feature
   * @param {Parser} parser
   * @returns {DefFeature | undefined}
   */
  static parse(parser) {
    if (!parser.matchToken("def")) return;
    var functionName = parser.requireElement("dotOrColonPath");
    var nameVal = functionName.evaluate();
    var nameSpace = nameVal.split(".");
    var funcName = nameSpace.pop();
    var args = [];
    if (parser.matchOpToken("(")) {
      if (parser.matchOpToken(")")) {
      } else {
        do {
          args.push(parser.requireTokenType("IDENTIFIER"));
        } while (parser.matchOpToken(","));
        parser.requireOpToken(")");
      }
    }
    var start = parser.requireElement("commandList");
    var errorSymbol, errorHandler;
    if (parser.matchToken("catch")) {
      errorSymbol = parser.requireTokenType("IDENTIFIER").value;
      errorHandler = parser.parseElement("commandList");
    }
    if (parser.matchToken("finally")) {
      var finallyHandler = parser.requireElement("commandList");
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
      install: function(target, source, funcArgs, runtime2) {
        var func = function() {
          var ctx = runtime2.makeContext(source, functionFeature, target, null);
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
        runtime2.assignToNamespace(target, nameSpace, funcName, func);
      }
    };
    parser.ensureTerminated(start);
    if (errorHandler) {
      parser.ensureTerminated(errorHandler);
    }
    parser.setParent(start, functionFeature);
    return functionFeature;
  }
};
__publicField(DefFeature, "keyword", "def");

// src/parsetree/features/on.js
function parseEventArgs2(parser) {
  var args = [];
  if (parser.token(0).value === "(" && (parser.token(1).value === ")" || parser.token(2).value === "," || parser.token(2).value === ")")) {
    parser.matchOpToken("(");
    do {
      args.push(parser.requireTokenType("IDENTIFIER"));
    } while (parser.matchOpToken(","));
    parser.requireOpToken(")");
  }
  return args;
}
var OnFeature = class {
  /**
   * Parse on feature
   * @param {Parser} parser
   * @returns {OnFeature | undefined}
   */
  static parse(parser) {
    if (!parser.matchToken("on")) return;
    var every = false;
    if (parser.matchToken("every")) {
      every = true;
    }
    var events = [];
    var displayName = null;
    do {
      var on = parser.requireElement("eventName", "Expected event name");
      var eventName = on.evaluate();
      if (displayName) {
        displayName = displayName + " or " + eventName;
      } else {
        displayName = "on " + eventName;
      }
      var args = parseEventArgs2(parser);
      var filter = null;
      if (parser.matchOpToken("[")) {
        filter = parser.requireElement("expression");
        parser.requireOpToken("]");
      }
      var startCount, endCount, unbounded;
      if (parser.currentToken().type === "NUMBER") {
        var startCountToken = parser.consumeToken();
        if (!startCountToken.value) return;
        startCount = parseInt(startCountToken.value);
        if (parser.matchToken("to")) {
          var endCountToken = parser.consumeToken();
          if (!endCountToken.value) return;
          endCount = parseInt(endCountToken.value);
        } else if (parser.matchToken("and")) {
          unbounded = true;
          parser.requireToken("on");
        }
      }
      var intersectionSpec, mutationSpec;
      if (eventName === "intersection") {
        intersectionSpec = {};
        if (parser.matchToken("with")) {
          intersectionSpec["with"] = parser.requireElement("expression").evaluate();
        }
        if (parser.matchToken("having")) {
          do {
            if (parser.matchToken("margin")) {
              intersectionSpec["rootMargin"] = parser.requireElement("stringLike").evaluate();
            } else if (parser.matchToken("threshold")) {
              intersectionSpec["threshold"] = parser.requireElement("expression").evaluate();
            } else {
              parser.raiseParseError("Unknown intersection config specification");
            }
          } while (parser.matchToken("and"));
        }
      } else if (eventName === "mutation") {
        mutationSpec = {};
        if (parser.matchToken("of")) {
          do {
            if (parser.matchToken("anything")) {
              mutationSpec["attributes"] = true;
              mutationSpec["subtree"] = true;
              mutationSpec["characterData"] = true;
              mutationSpec["childList"] = true;
            } else if (parser.matchToken("childList")) {
              mutationSpec["childList"] = true;
            } else if (parser.matchToken("attributes")) {
              mutationSpec["attributes"] = true;
              mutationSpec["attributeOldValue"] = true;
            } else if (parser.matchToken("subtree")) {
              mutationSpec["subtree"] = true;
            } else if (parser.matchToken("characterData")) {
              mutationSpec["characterData"] = true;
              mutationSpec["characterDataOldValue"] = true;
            } else if (parser.currentToken().type === "ATTRIBUTE_REF") {
              var attribute = parser.consumeToken();
              if (mutationSpec["attributeFilter"] == null) {
                mutationSpec["attributeFilter"] = [];
              }
              if (attribute.value.indexOf("@") == 0) {
                mutationSpec["attributeFilter"].push(attribute.value.substring(1));
              } else {
                parser.raiseParseError(
                  "Only shorthand attribute references are allowed here"
                );
              }
            } else {
              parser.raiseParseError("Unknown mutation config specification");
            }
          } while (parser.matchToken("or"));
        } else {
          mutationSpec["attributes"] = true;
          mutationSpec["characterData"] = true;
          mutationSpec["childList"] = true;
        }
      }
      var from = null;
      var elsewhere = false;
      if (parser.matchToken("from")) {
        if (parser.matchToken("elsewhere")) {
          elsewhere = true;
        } else {
          parser.pushFollow("or");
          try {
            from = parser.requireElement("expression");
          } finally {
            parser.popFollow();
          }
          if (!from) {
            parser.raiseParseError('Expected either target value or "elsewhere".');
          }
        }
      }
      if (from === null && elsewhere === false && parser.matchToken("elsewhere")) {
        elsewhere = true;
      }
      if (parser.matchToken("in")) {
        var inExpr = parser.parseElement("unaryExpression");
      }
      if (parser.matchToken("debounced")) {
        parser.requireToken("at");
        var timeExpr = parser.requireElement("unaryExpression");
        var debounceTime = timeExpr.evaluate({});
      } else if (parser.matchToken("throttled")) {
        parser.requireToken("at");
        var timeExpr = parser.requireElement("unaryExpression");
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
    } while (parser.matchToken("or"));
    var queueLast = true;
    if (!every) {
      if (parser.matchToken("queue")) {
        if (parser.matchToken("all")) {
          var queueAll = true;
          var queueLast = false;
        } else if (parser.matchToken("first")) {
          var queueFirst = true;
        } else if (parser.matchToken("none")) {
          var queueNone = true;
        } else {
          parser.requireToken("last");
        }
      }
    }
    var start = parser.requireElement("commandList");
    parser.ensureTerminated(start);
    var errorSymbol, errorHandler;
    if (parser.matchToken("catch")) {
      errorSymbol = parser.requireTokenType("IDENTIFIER").value;
      errorHandler = parser.requireElement("commandList");
      parser.ensureTerminated(errorHandler);
    }
    if (parser.matchToken("finally")) {
      var finallyHandler = parser.requireElement("commandList");
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
      install: function(elt, source, args2, runtime2) {
        for (const eventSpec of onFeature.events) {
          var targets;
          if (eventSpec.elsewhere) {
            targets = [document];
          } else if (eventSpec.from) {
            targets = eventSpec.from.evaluate(runtime2.makeContext(elt, onFeature, elt, null));
          } else {
            targets = [elt];
          }
          runtime2.implicitLoop(targets, function(target) {
            var eventName2 = eventSpec.on;
            if (target == null) {
              console.warn("'%s' feature ignored because target does not exists:", displayName, elt);
              return;
            }
            if (eventSpec.mutationSpec) {
              eventName2 = "hyperscript:mutation";
              const observer = new MutationObserver(function(mutationList, observer2) {
                if (!onFeature.executing) {
                  runtime2.triggerEvent(target, eventName2, {
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
                  runtime2.triggerEvent(target, eventName2, detail);
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
              var ctx = runtime2.makeContext(elt, onFeature, elt, evt);
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
    parser.setParent(start, onFeature);
    return onFeature;
  }
};
__publicField(OnFeature, "keyword", "on");

// src/_hyperscript.js
var globalScope = typeof self !== "undefined" ? self : typeof global !== "undefined" ? global : void 0;
var kernel = new LanguageKernel();
var tokenizer = new Tokenizer();
var runtime = new Runtime(globalScope, kernel, tokenizer);
kernel.addLeafExpression("parenthesized", ParenthesizedExpression.parse);
kernel.addLeafExpression("string", StringLiteral.parse);
kernel.addGrammarElement("nakedString", NakedString.parse);
kernel.addGrammarElement("stringLike", function(parser) {
  return parser.parseAnyOf(["string", "nakedString"]);
});
kernel.addLeafExpression("number", NumberLiteral.parse);
kernel.addLeafExpression("boolean", BooleanLiteral.parse);
kernel.addLeafExpression("null", NullLiteral.parse);
kernel.addLeafExpression("arrayLiteral", ArrayLiteral.parse);
kernel.addLeafExpression("blockLiteral", BlockLiteral.parse);
kernel.addLeafExpression("objectLiteral", ObjectLiteral.parse);
kernel.addGrammarElement("objectKey", ObjectKey.parse);
kernel.addGrammarElement("nakedNamedArgumentList", NamedArgumentList.parseNaked);
kernel.addGrammarElement("namedArgumentList", NamedArgumentList.parse);
kernel.addLeafExpression("idRef", IdRef.parse);
kernel.addLeafExpression("classRef", ClassRef.parse);
kernel.addLeafExpression("queryRef", QueryRef.parse);
kernel.addLeafExpression("attributeRef", AttributeRef.parse);
kernel.addLeafExpression("styleRef", StyleRef.parse);
kernel.addGrammarElement("styleLiteral", StyleLiteral.parse);
kernel.addGrammarElement("symbol", SymbolRef.parse);
kernel.addGrammarElement("implicitMeTarget", ImplicitMeTarget.parse);
kernel.addGrammarElement("dotOrColonPath", DotOrColonPath.parse);
kernel.addGrammarElement("eventName", EventName.parse);
kernel.addIndirectExpression("propertyAccess", PropertyAccess.parse);
kernel.addIndirectExpression("of", OfExpression.parse);
kernel.addIndirectExpression("possessive", PossessiveExpression.parse);
kernel.addIndirectExpression("inExpression", InExpression.parse);
kernel.addIndirectExpression("asExpression", AsExpression.parse);
kernel.addIndirectExpression("functionCall", FunctionCall.parse);
kernel.addIndirectExpression("attributeRefAccess", AttributeRefAccess.parse);
kernel.addIndirectExpression("arrayIndex", ArrayIndex.parse);
kernel.addUnaryExpression("beepExpression", BeepExpression.parse);
kernel.addUnaryExpression("logicalNot", LogicalNot.parse);
kernel.addUnaryExpression("noExpression", NoExpression.parse);
kernel.addLeafExpression("some", SomeExpression.parse);
kernel.addGrammarElement("negativeNumber", NegativeNumber.parse);
kernel.addUnaryExpression("relativePositionalExpression", RelativePositionalExpression.parse);
kernel.addUnaryExpression("positionalExpression", PositionalExpression.parse);
kernel.addLeafExpression("closestExpr", ClosestExpr.parse);
kernel.UNARY_EXPRESSIONS.push("postfixExpression");
kernel.addGrammarElement("mathOperator", MathOperator.parse);
kernel.addGrammarElement("mathExpression", MathExpression.parse);
kernel.addGrammarElement("comparisonOperator", ComparisonOperator.parse);
kernel.addGrammarElement("comparisonExpression", ComparisonExpression.parse);
kernel.addGrammarElement("logicalOperator", LogicalOperator.parse);
kernel.addGrammarElement("logicalExpression", LogicalExpression.parse);
kernel.addTopExpression("asyncExpression", AsyncExpression.parse);
kernel.addFeatures(
  OnFeature,
  DefFeature,
  SetFeature,
  InitFeature,
  WorkerFeature,
  BehaviorFeature,
  InstallFeature
);
kernel.addGrammarElement("jsBody", JsBody.parse);
kernel.addFeature("js", JsFeature.parse);
kernel.addCommands(
  LogCommand,
  BeepCommand,
  ThrowCommand,
  ReturnCommand,
  ExitCommand,
  HaltCommand,
  MakeCommand,
  PickCommand,
  FetchCommand,
  GoCommand
);
kernel.addCommands(
  SetCommand,
  DefaultCommand,
  IncrementCommand,
  DecrementCommand,
  AppendCommand,
  PutCommand
);
kernel.addCommands(
  IfCommand,
  RepeatCommand,
  ForCommand,
  ContinueCommand,
  BreakCommand,
  TellCommand
);
kernel.addCommands(
  WaitCommand,
  TriggerCommand,
  SendCommand
);
kernel.addCommands(
  JsCommand,
  AsyncCommand,
  CallCommand,
  GetCommand
);
kernel.addGrammarElement("pseudoCommand", PseudoCommand.parse);
kernel.addCommands(
  AddCommand,
  RemoveCommand,
  TakeCommand,
  MeasureCommand,
  ToggleCommand,
  HideCommand,
  ShowCommand
);
kernel.addCommands(SettleCommand, TransitionCommand);
kernel.addPostfixExpression("stringPostfixExpression", StringPostfixExpression.parse);
kernel.addPostfixExpression("timeExpression", TimeExpression.parse);
kernel.addPostfixExpression("typeCheckExpression", TypeCheckExpression.parse);
kernel.ASSIGNABLE_EXPRESSIONS.push("symbol");
kernel.ASSIGNABLE_EXPRESSIONS.push("ofExpression");
kernel.ASSIGNABLE_EXPRESSIONS.push("propertyAccess");
kernel.ASSIGNABLE_EXPRESSIONS.push("attributeRefAccess");
kernel.ASSIGNABLE_EXPRESSIONS.push("attributeRef");
kernel.ASSIGNABLE_EXPRESSIONS.push("styleRef");
kernel.ASSIGNABLE_EXPRESSIONS.push("arrayIndex");
kernel.ASSIGNABLE_EXPRESSIONS.push("possessive");
Tokens._parserRaiseError = LanguageKernel.raiseParseError;
function evaluate(src, ctx, args) {
  let body;
  if ("document" in globalScope) {
    body = globalScope.document.body;
  } else {
    body = new HyperscriptModule(args && args.module);
  }
  ctx = Object.assign(runtime.makeContext(body, null, body, null), ctx || {});
  let element = kernel.parse(tokenizer, src);
  if (element.execute) {
    element.execute(ctx);
    return ctx.meta.returnValue !== void 0 ? ctx.meta.returnValue : ctx.result;
  } else if (element.apply) {
    element.apply(body, body, args, runtime);
    return runtime.getHyperscriptFeatures(body);
  } else {
    return element.evaluate(ctx);
  }
}
var _hyperscript = Object.assign(
  evaluate,
  {
    config,
    use(plugin) {
      plugin(_hyperscript);
    },
    internals: {
      tokenizer,
      parser: kernel,
      runtime,
      Tokenizer,
      Tokens,
      Parser: LanguageKernel,
      Runtime
    },
    ElementCollection,
    addFeature: kernel.addFeature.bind(kernel),
    addCommand: kernel.addCommand.bind(kernel),
    addLeafExpression: kernel.addLeafExpression.bind(kernel),
    addIndirectExpression: kernel.addIndirectExpression.bind(kernel),
    evaluate,
    parse: (src) => kernel.parse(tokenizer, src),
    process: (elt) => runtime.processNode(elt),
    processNode: (elt) => runtime.processNode(elt),
    version: "0.9.14"
  }
);
function ready(fn) {
  if (document.readyState !== "loading") {
    setTimeout(fn);
  } else {
    document.addEventListener("DOMContentLoaded", fn);
  }
}
function mergeMetaConfig() {
  let element = document.querySelector('meta[name="htmx-config"]');
  if (element) {
    let metaConfig = JSON.parse(element.content);
    Object.assign(config, metaConfig);
  }
}
if (typeof document !== "undefined") {
  (function() {
    return __async(this, null, function* () {
      mergeMetaConfig();
      let scriptNodes = globalScope.document.querySelectorAll("script[type='text/hyperscript'][src]");
      const scripts = Array.from(scriptNodes);
      const scriptTexts = yield Promise.all(
        scripts.map((script) => __async(null, null, function* () {
          const res = yield fetch(script.src);
          return res.text();
        }))
      );
      scriptTexts.forEach((sc) => _hyperscript(sc));
      ready(() => {
        runtime.processNode(document.documentElement);
        document.dispatchEvent(new Event("hyperscript:ready"));
        globalScope.document.addEventListener("htmx:load", (evt) => {
          runtime.processNode(evt.detail.elt);
        });
      });
    });
  })();
}
if (typeof self !== "undefined") {
  self._hyperscript = _hyperscript;
}
var hyperscript_default = _hyperscript;
export {
  _hyperscript,
  hyperscript_default as default
};
//# sourceMappingURL=_hyperscript.js.map
