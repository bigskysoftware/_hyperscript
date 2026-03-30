var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __typeError = (msg) => {
  throw TypeError(msg);
};
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
var __objRest = (source, exclude) => {
  var target = {};
  for (var prop in source)
    if (__hasOwnProp.call(source, prop) && exclude.indexOf(prop) < 0)
      target[prop] = source[prop];
  if (source != null && __getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(source)) {
      if (exclude.indexOf(prop) < 0 && __propIsEnum.call(source, prop))
        target[prop] = source[prop];
    }
  return target;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
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
var ParseError = class {
  constructor(message, token, source) {
    var _a, _b;
    this.message = message;
    this.token = token;
    this.source = source;
    this.line = (_a = token == null ? void 0 : token.line) != null ? _a : null;
    this.column = (_b = token == null ? void 0 : token.column) != null ? _b : null;
  }
};
var ParseRecoverySentinel = class extends Error {
  constructor(parseError) {
    super(parseError.message);
    this.parseError = parseError;
  }
};
function formatErrors(errors) {
  var _a, _b, _c, _d, _e;
  if (!errors.length) return "";
  var source = errors[0].source;
  var lines = source.split("\n");
  var byLine = /* @__PURE__ */ new Map();
  for (var e of errors) {
    var lineIdx = ((_a = e.token) == null ? void 0 : _a.line) ? e.token.line - 1 : lines.length - 1;
    if (!byLine.has(lineIdx)) byLine.set(lineIdx, []);
    byLine.get(lineIdx).push(e);
  }
  var maxLine = Math.max(...byLine.keys()) + 1;
  var gutter = String(maxLine).length;
  var pad = " ".repeat(gutter + 5);
  var sortedLines = [...byLine.entries()].sort((a, b) => a[0] - b[0]);
  var prevLineIdx = -1;
  var out = "";
  for (var [lineIdx, lineErrors] of sortedLines) {
    if (prevLineIdx !== -1 && lineIdx > prevLineIdx + 1) {
      out += " ".repeat(gutter + 1) + "...\n";
    } else if (prevLineIdx === -1 && lineIdx > 0) {
      out += " ".repeat(gutter + 1) + "...\n";
    }
    prevLineIdx = lineIdx;
    var lineNum = String(lineIdx + 1).padStart(gutter);
    var contextLine = lines[lineIdx] || "";
    out += "  " + lineNum + " | " + contextLine + "\n";
    lineErrors.sort((a, b) => (a.column || 0) - (b.column || 0));
    var underlineChars = Array(contextLine.length + 10).fill(" ");
    for (var e of lineErrors) {
      var col = ((_b = e.token) == null ? void 0 : _b.line) ? e.token.column : Math.max(0, contextLine.length - 1);
      var len = Math.max(1, ((_d = (_c = e.token) == null ? void 0 : _c.value) == null ? void 0 : _d.length) || 1);
      for (var i = 0; i < len; i++) underlineChars[col + i] = "^";
    }
    out += pad + underlineChars.join("").trimEnd() + "\n";
    for (var e of lineErrors) {
      var col = ((_e = e.token) == null ? void 0 : _e.line) ? e.token.column : 0;
      out += pad + " ".repeat(col) + e.message + "\n";
    }
  }
  return out;
}
var _tokens, _consumed, _lastConsumed, _follows, _errors, _recoveryMode;
var Tokens = class {
  constructor(tokens, source) {
    __privateAdd(this, _tokens);
    __privateAdd(this, _consumed, []);
    __privateAdd(this, _lastConsumed, null);
    __privateAdd(this, _follows, []);
    __privateAdd(this, _errors, []);
    __privateAdd(this, _recoveryMode, false);
    __publicField(this, "source");
    __privateSet(this, _tokens, tokens);
    this.source = source;
    this.consumeWhitespace();
  }
  get list() {
    return __privateGet(this, _tokens);
  }
  get consumed() {
    return __privateGet(this, _consumed);
  }
  // ----- Error recovery -----
  enableRecovery() {
    __privateSet(this, _recoveryMode, true);
  }
  get recoveryMode() {
    return __privateGet(this, _recoveryMode);
  }
  get errors() {
    return __privateGet(this, _errors);
  }
  // ----- Debug -----
  toString() {
    var _a;
    var cur = this.currentToken();
    var lines = this.source.split("\n");
    var lineIdx = (cur == null ? void 0 : cur.line) ? cur.line - 1 : lines.length - 1;
    var col = (cur == null ? void 0 : cur.line) ? cur.column : 0;
    var contextLine = lines[lineIdx] || "";
    var tokenLen = Math.max(1, ((_a = cur == null ? void 0 : cur.value) == null ? void 0 : _a.length) || 1);
    var gutter = String(lineIdx + 1).length;
    var out = "Tokens(";
    out += __privateGet(this, _consumed).filter((t) => t.type !== "WHITESPACE").length + " consumed, ";
    out += __privateGet(this, _tokens).filter((t) => t.type !== "WHITESPACE").length + " remaining";
    out += ", line " + (lineIdx + 1) + ")\n";
    out += "  " + String(lineIdx + 1).padStart(gutter) + " | " + contextLine + "\n";
    out += " ".repeat(gutter + 5) + " ".repeat(col) + "^".repeat(tokenLen);
    if (cur) out += " " + cur.type + " '" + cur.value + "'";
    return out;
  }
  // ----- Token access -----
  currentToken() {
    return this.token(0);
  }
  token(n, includeWhitespace) {
    var token;
    var i = 0;
    do {
      if (!includeWhitespace) {
        while (__privateGet(this, _tokens)[i] && __privateGet(this, _tokens)[i].type === "WHITESPACE") {
          i++;
        }
      }
      token = __privateGet(this, _tokens)[i];
      n--;
      i++;
    } while (n > -1);
    return token || { type: "EOF", value: "<<<EOF>>>" };
  }
  hasMore() {
    return __privateGet(this, _tokens).length > 0;
  }
  lastMatch() {
    return __privateGet(this, _lastConsumed);
  }
  // ----- Token matching -----
  matchToken(value, type) {
    if (__privateGet(this, _follows).includes(value)) return;
    type = type || "IDENTIFIER";
    if (this.currentToken() && this.currentToken().value === value && this.currentToken().type === type) {
      return this.consumeToken();
    }
  }
  matchOpToken(value) {
    if (this.currentToken() && this.currentToken().op && this.currentToken().value === value) {
      return this.consumeToken();
    }
  }
  matchTokenType(...types) {
    if (this.currentToken() && this.currentToken().type && types.includes(this.currentToken().type)) {
      return this.consumeToken();
    }
  }
  matchAnyToken(...tokens) {
    for (var i = 0; i < tokens.length; i++) {
      var match = this.matchToken(tokens[i]);
      if (match) return match;
    }
  }
  matchAnyOpToken(...ops) {
    for (var i = 0; i < ops.length; i++) {
      var match = this.matchOpToken(ops[i]);
      if (match) return match;
    }
  }
  // ----- Token requiring -----
  requireToken(value, type) {
    var token = this.matchToken(value, type);
    if (token) return token;
    this.raiseError("Expected '" + value + "' but found '" + this.currentToken().value + "'");
  }
  requireOpToken(value) {
    var token = this.matchOpToken(value);
    if (token) return token;
    this.raiseError("Expected '" + value + "' but found '" + this.currentToken().value + "'");
  }
  requireTokenType(...types) {
    var token = this.matchTokenType(...types);
    if (token) return token;
    this.raiseError("Expected one of " + JSON.stringify(types));
  }
  // ----- Token consuming -----
  consumeToken() {
    var match = __privateGet(this, _tokens).shift();
    __privateGet(this, _consumed).push(match);
    __privateSet(this, _lastConsumed, match);
    this.consumeWhitespace();
    return match;
  }
  consumeWhitespace() {
    while (this.token(0, true).type === "WHITESPACE") {
      __privateGet(this, _consumed).push(__privateGet(this, _tokens).shift());
    }
  }
  consumeUntil(value, type) {
    var tokenList = [];
    var currentToken = this.token(0, true);
    while ((type == null || currentToken.type !== type) && (value == null || currentToken.value !== value) && currentToken.type !== "EOF") {
      var match = __privateGet(this, _tokens).shift();
      __privateGet(this, _consumed).push(match);
      tokenList.push(currentToken);
      currentToken = this.token(0, true);
    }
    this.consumeWhitespace();
    return tokenList;
  }
  consumeUntilWhitespace() {
    return this.consumeUntil(null, "WHITESPACE");
  }
  // ----- Lookahead -----
  peekToken(value, peek, type) {
    peek = peek || 0;
    type = type || "IDENTIFIER";
    if (__privateGet(this, _tokens)[peek] && __privateGet(this, _tokens)[peek].value === value && __privateGet(this, _tokens)[peek].type === type) {
      return __privateGet(this, _tokens)[peek];
    }
  }
  // ----- Whitespace -----
  lastWhitespace() {
    var last = __privateGet(this, _consumed)[__privateGet(this, _consumed).length - 1];
    return last && last.type === "WHITESPACE" ? last.value : "";
  }
  // ----- Follow set management -----
  pushFollow(str) {
    __privateGet(this, _follows).push(str);
  }
  popFollow() {
    __privateGet(this, _follows).pop();
  }
  clearFollows() {
    var tmp = __privateGet(this, _follows);
    __privateSet(this, _follows, []);
    return tmp;
  }
  restoreFollows(f) {
    __privateSet(this, _follows, f);
  }
  // ----- Error handling -----
  raiseError(message) {
    var _a;
    message = message || "Unexpected Token : " + this.currentToken().value;
    var currentToken = this.currentToken();
    var parseError = new ParseError(message, currentToken, this.source);
    if (__privateGet(this, _recoveryMode)) {
      __privateGet(this, _errors).push(parseError);
      throw new ParseRecoverySentinel(parseError);
    }
    var lines = this.source.split("\n");
    var lineIdx = (currentToken == null ? void 0 : currentToken.line) ? currentToken.line - 1 : lines.length - 1;
    var contextLine = lines[lineIdx] || "";
    var col = (currentToken == null ? void 0 : currentToken.line) ? currentToken.column : Math.max(0, contextLine.length - 1);
    var tokenLen = Math.max(1, ((_a = currentToken == null ? void 0 : currentToken.value) == null ? void 0 : _a.length) || 1);
    var formatted = message + "\n\n" + contextLine + "\n" + " ".repeat(col) + "^".repeat(tokenLen) + "\n";
    var error = new Error(formatted);
    error["tokens"] = this;
    throw error;
  }
};
_tokens = new WeakMap();
_consumed = new WeakMap();
_lastConsumed = new WeakMap();
_follows = new WeakMap();
_errors = new WeakMap();
_recoveryMode = new WeakMap();
var OP_TABLE = {
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
  "~": "TILDE",
  "^": "CARET"
};
var _source, _position, _column, _line, _lastToken, _templateBraceCount, _tokens2, _template, _Tokenizer_instances, isAlpha_fn, isNumeric_fn, isWhitespace_fn, isNewline_fn, isValidCSSChar_fn, isIdentifierChar_fn, isReservedChar_fn, currentChar_fn, nextChar_fn, charAt_fn, consumeChar_fn, inTemplate_fn, possiblePrecedingSymbol_fn, isValidSingleQuoteStringStart_fn, makeToken_fn, makeOpToken_fn, consumeComment_fn, consumeMultilineComment_fn, consumeWhitespace_fn, consumeClassReference_fn, consumeIdReference_fn, consumeAttributeReference_fn, consumeShortAttributeReference_fn, consumeStyleReference_fn, consumeTemplateIdentifier_fn, consumeIdentifier_fn, consumeNumber_fn, consumeOp_fn, consumeString_fn, consumeHexEscape_fn, isLineComment_fn, isBlockComment_fn, tokenize_fn;
var _Tokenizer = class _Tokenizer {
  constructor() {
    __privateAdd(this, _Tokenizer_instances);
    // ----- Instance state -----
    __privateAdd(this, _source, "");
    __privateAdd(this, _position, 0);
    __privateAdd(this, _column, 0);
    __privateAdd(this, _line, 1);
    __privateAdd(this, _lastToken, "<START>");
    __privateAdd(this, _templateBraceCount, 0);
    __privateAdd(this, _tokens2, []);
    __privateAdd(this, _template, false);
  }
  static tokenize(string, template) {
    return new _Tokenizer().tokenize(string, template);
  }
  tokenize(string, template) {
    __privateSet(this, _source, string);
    __privateSet(this, _position, 0);
    __privateSet(this, _column, 0);
    __privateSet(this, _line, 1);
    __privateSet(this, _lastToken, "<START>");
    __privateSet(this, _templateBraceCount, 0);
    __privateSet(this, _tokens2, []);
    __privateSet(this, _template, template || false);
    return __privateMethod(this, _Tokenizer_instances, tokenize_fn).call(this);
  }
};
_source = new WeakMap();
_position = new WeakMap();
_column = new WeakMap();
_line = new WeakMap();
_lastToken = new WeakMap();
_templateBraceCount = new WeakMap();
_tokens2 = new WeakMap();
_template = new WeakMap();
_Tokenizer_instances = new WeakSet();
// ----- Character classification -----
isAlpha_fn = function(c) {
  return c >= "a" && c <= "z" || c >= "A" && c <= "Z";
};
isNumeric_fn = function(c) {
  return c >= "0" && c <= "9";
};
isWhitespace_fn = function(c) {
  return c === " " || c === "	" || c === "\r" || c === "\n";
};
isNewline_fn = function(c) {
  return c === "\r" || c === "\n";
};
isValidCSSChar_fn = function(c) {
  return __privateMethod(this, _Tokenizer_instances, isAlpha_fn).call(this, c) || __privateMethod(this, _Tokenizer_instances, isNumeric_fn).call(this, c) || c === "-" || c === "_" || c === ":";
};
isIdentifierChar_fn = function(c) {
  return c === "_" || c === "$";
};
isReservedChar_fn = function(c) {
  return c === "`";
};
// ----- Character access -----
currentChar_fn = function() {
  return __privateGet(this, _source).charAt(__privateGet(this, _position));
};
nextChar_fn = function() {
  return __privateGet(this, _source).charAt(__privateGet(this, _position) + 1);
};
charAt_fn = function(offset = 1) {
  return __privateGet(this, _source).charAt(__privateGet(this, _position) + offset);
};
consumeChar_fn = function() {
  __privateSet(this, _lastToken, __privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this));
  __privateWrapper(this, _position)._++;
  if (__privateGet(this, _lastToken) === "\n") {
    __privateWrapper(this, _line)._++;
    __privateSet(this, _column, 0);
  } else {
    __privateWrapper(this, _column)._++;
  }
  return __privateGet(this, _lastToken);
};
// ----- Context checks -----
inTemplate_fn = function() {
  return __privateGet(this, _template) && __privateGet(this, _templateBraceCount) === 0;
};
possiblePrecedingSymbol_fn = function() {
  return __privateMethod(this, _Tokenizer_instances, isAlpha_fn).call(this, __privateGet(this, _lastToken)) || __privateMethod(this, _Tokenizer_instances, isNumeric_fn).call(this, __privateGet(this, _lastToken)) || __privateGet(this, _lastToken) === ")" || __privateGet(this, _lastToken) === '"' || __privateGet(this, _lastToken) === "'" || __privateGet(this, _lastToken) === "`" || __privateGet(this, _lastToken) === "}" || __privateGet(this, _lastToken) === "]";
};
isValidSingleQuoteStringStart_fn = function() {
  if (__privateGet(this, _tokens2).length > 0) {
    var prev = __privateGet(this, _tokens2)[__privateGet(this, _tokens2).length - 1];
    if (prev.type === "IDENTIFIER" || prev.type === "CLASS_REF" || prev.type === "ID_REF") {
      return false;
    }
    if (prev.op && (prev.value === ">" || prev.value === ")")) {
      return false;
    }
  }
  return true;
};
// ----- Token constructors -----
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
makeOpToken_fn = function(type, value) {
  var token = __privateMethod(this, _Tokenizer_instances, makeToken_fn).call(this, type, value);
  token.op = true;
  return token;
};
// ----- Consume methods -----
consumeComment_fn = function() {
  while (__privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this) && !__privateMethod(this, _Tokenizer_instances, isNewline_fn).call(this, __privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this))) {
    __privateMethod(this, _Tokenizer_instances, consumeChar_fn).call(this);
  }
  __privateMethod(this, _Tokenizer_instances, consumeChar_fn).call(this);
};
consumeMultilineComment_fn = function() {
  while (__privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this) && !(__privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this) === "*" && __privateMethod(this, _Tokenizer_instances, nextChar_fn).call(this) === "/")) {
    __privateMethod(this, _Tokenizer_instances, consumeChar_fn).call(this);
  }
  __privateMethod(this, _Tokenizer_instances, consumeChar_fn).call(this);
  __privateMethod(this, _Tokenizer_instances, consumeChar_fn).call(this);
};
consumeWhitespace_fn = function() {
  var ws = __privateMethod(this, _Tokenizer_instances, makeToken_fn).call(this, "WHITESPACE");
  var value = "";
  while (__privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this) && __privateMethod(this, _Tokenizer_instances, isWhitespace_fn).call(this, __privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this))) {
    value += __privateMethod(this, _Tokenizer_instances, consumeChar_fn).call(this);
  }
  ws.value = value;
  ws.end = __privateGet(this, _position);
  return ws;
};
consumeClassReference_fn = function() {
  var token = __privateMethod(this, _Tokenizer_instances, makeToken_fn).call(this, "CLASS_REF");
  var value = __privateMethod(this, _Tokenizer_instances, consumeChar_fn).call(this);
  if (__privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this) === "{") {
    token.template = true;
    value += __privateMethod(this, _Tokenizer_instances, consumeChar_fn).call(this);
    while (__privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this) && __privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this) !== "}") {
      value += __privateMethod(this, _Tokenizer_instances, consumeChar_fn).call(this);
    }
    if (__privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this) !== "}") {
      throw new Error("Unterminated class reference");
    } else {
      value += __privateMethod(this, _Tokenizer_instances, consumeChar_fn).call(this);
    }
  } else {
    while (__privateMethod(this, _Tokenizer_instances, isValidCSSChar_fn).call(this, __privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this)) || __privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this) === "\\") {
      if (__privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this) === "\\") __privateMethod(this, _Tokenizer_instances, consumeChar_fn).call(this);
      value += __privateMethod(this, _Tokenizer_instances, consumeChar_fn).call(this);
    }
  }
  token.value = value;
  token.end = __privateGet(this, _position);
  return token;
};
consumeIdReference_fn = function() {
  var token = __privateMethod(this, _Tokenizer_instances, makeToken_fn).call(this, "ID_REF");
  var value = __privateMethod(this, _Tokenizer_instances, consumeChar_fn).call(this);
  if (__privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this) === "{") {
    token.template = true;
    value += __privateMethod(this, _Tokenizer_instances, consumeChar_fn).call(this);
    while (__privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this) && __privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this) !== "}") {
      value += __privateMethod(this, _Tokenizer_instances, consumeChar_fn).call(this);
    }
    if (__privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this) !== "}") {
      throw new Error("Unterminated id reference");
    } else {
      __privateMethod(this, _Tokenizer_instances, consumeChar_fn).call(this);
    }
  } else {
    while (__privateMethod(this, _Tokenizer_instances, isValidCSSChar_fn).call(this, __privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this))) {
      value += __privateMethod(this, _Tokenizer_instances, consumeChar_fn).call(this);
    }
  }
  token.value = value;
  token.end = __privateGet(this, _position);
  return token;
};
consumeAttributeReference_fn = function() {
  var token = __privateMethod(this, _Tokenizer_instances, makeToken_fn).call(this, "ATTRIBUTE_REF");
  var value = __privateMethod(this, _Tokenizer_instances, consumeChar_fn).call(this);
  while (__privateGet(this, _position) < __privateGet(this, _source).length && __privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this) !== "]") {
    value += __privateMethod(this, _Tokenizer_instances, consumeChar_fn).call(this);
  }
  if (__privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this) === "]") {
    value += __privateMethod(this, _Tokenizer_instances, consumeChar_fn).call(this);
  }
  token.value = value;
  token.end = __privateGet(this, _position);
  return token;
};
consumeShortAttributeReference_fn = function() {
  var token = __privateMethod(this, _Tokenizer_instances, makeToken_fn).call(this, "ATTRIBUTE_REF");
  var value = __privateMethod(this, _Tokenizer_instances, consumeChar_fn).call(this);
  while (__privateMethod(this, _Tokenizer_instances, isValidCSSChar_fn).call(this, __privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this))) {
    value += __privateMethod(this, _Tokenizer_instances, consumeChar_fn).call(this);
  }
  if (__privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this) === "=") {
    value += __privateMethod(this, _Tokenizer_instances, consumeChar_fn).call(this);
    if (__privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this) === '"' || __privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this) === "'") {
      value += __privateMethod(this, _Tokenizer_instances, consumeString_fn).call(this).value;
    } else if (__privateMethod(this, _Tokenizer_instances, isAlpha_fn).call(this, __privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this)) || __privateMethod(this, _Tokenizer_instances, isNumeric_fn).call(this, __privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this)) || __privateMethod(this, _Tokenizer_instances, isIdentifierChar_fn).call(this, __privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this))) {
      value += __privateMethod(this, _Tokenizer_instances, consumeIdentifier_fn).call(this).value;
    }
  }
  token.value = value;
  token.end = __privateGet(this, _position);
  return token;
};
consumeStyleReference_fn = function() {
  var token = __privateMethod(this, _Tokenizer_instances, makeToken_fn).call(this, "STYLE_REF");
  var value = __privateMethod(this, _Tokenizer_instances, consumeChar_fn).call(this);
  while (__privateMethod(this, _Tokenizer_instances, isAlpha_fn).call(this, __privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this)) || __privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this) === "-") {
    value += __privateMethod(this, _Tokenizer_instances, consumeChar_fn).call(this);
  }
  token.value = value;
  token.end = __privateGet(this, _position);
  return token;
};
consumeTemplateIdentifier_fn = function() {
  var token = __privateMethod(this, _Tokenizer_instances, makeToken_fn).call(this, "IDENTIFIER");
  var value = __privateMethod(this, _Tokenizer_instances, consumeChar_fn).call(this);
  var escaped = value === "\\";
  if (escaped) value = "";
  while (__privateMethod(this, _Tokenizer_instances, isAlpha_fn).call(this, __privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this)) || __privateMethod(this, _Tokenizer_instances, isNumeric_fn).call(this, __privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this)) || __privateMethod(this, _Tokenizer_instances, isIdentifierChar_fn).call(this, __privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this)) || __privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this) === "\\" || __privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this) === "{" || __privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this) === "}") {
    if (__privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this) === "$" && !escaped) {
      break;
    } else if (__privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this) === "\\") {
      escaped = true;
      __privateMethod(this, _Tokenizer_instances, consumeChar_fn).call(this);
    } else {
      escaped = false;
      value += __privateMethod(this, _Tokenizer_instances, consumeChar_fn).call(this);
    }
  }
  if (__privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this) === "!" && value === "beep") {
    value += __privateMethod(this, _Tokenizer_instances, consumeChar_fn).call(this);
  }
  token.value = value;
  token.end = __privateGet(this, _position);
  return token;
};
consumeIdentifier_fn = function() {
  var token = __privateMethod(this, _Tokenizer_instances, makeToken_fn).call(this, "IDENTIFIER");
  var value = __privateMethod(this, _Tokenizer_instances, consumeChar_fn).call(this);
  while (__privateMethod(this, _Tokenizer_instances, isAlpha_fn).call(this, __privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this)) || __privateMethod(this, _Tokenizer_instances, isNumeric_fn).call(this, __privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this)) || __privateMethod(this, _Tokenizer_instances, isIdentifierChar_fn).call(this, __privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this))) {
    value += __privateMethod(this, _Tokenizer_instances, consumeChar_fn).call(this);
  }
  if (__privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this) === "!" && value === "beep") {
    value += __privateMethod(this, _Tokenizer_instances, consumeChar_fn).call(this);
  }
  token.value = value;
  token.end = __privateGet(this, _position);
  return token;
};
consumeNumber_fn = function() {
  var token = __privateMethod(this, _Tokenizer_instances, makeToken_fn).call(this, "NUMBER");
  var value = __privateMethod(this, _Tokenizer_instances, consumeChar_fn).call(this);
  while (__privateMethod(this, _Tokenizer_instances, isNumeric_fn).call(this, __privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this))) {
    value += __privateMethod(this, _Tokenizer_instances, consumeChar_fn).call(this);
  }
  if (__privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this) === "." && __privateMethod(this, _Tokenizer_instances, isNumeric_fn).call(this, __privateMethod(this, _Tokenizer_instances, nextChar_fn).call(this))) {
    value += __privateMethod(this, _Tokenizer_instances, consumeChar_fn).call(this);
  }
  while (__privateMethod(this, _Tokenizer_instances, isNumeric_fn).call(this, __privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this))) {
    value += __privateMethod(this, _Tokenizer_instances, consumeChar_fn).call(this);
  }
  if (__privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this) === "e" || __privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this) === "E") {
    if (__privateMethod(this, _Tokenizer_instances, isNumeric_fn).call(this, __privateMethod(this, _Tokenizer_instances, nextChar_fn).call(this))) {
      value += __privateMethod(this, _Tokenizer_instances, consumeChar_fn).call(this);
    } else if (__privateMethod(this, _Tokenizer_instances, nextChar_fn).call(this) === "-") {
      value += __privateMethod(this, _Tokenizer_instances, consumeChar_fn).call(this);
      value += __privateMethod(this, _Tokenizer_instances, consumeChar_fn).call(this);
    }
  }
  while (__privateMethod(this, _Tokenizer_instances, isNumeric_fn).call(this, __privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this))) {
    value += __privateMethod(this, _Tokenizer_instances, consumeChar_fn).call(this);
  }
  token.value = value;
  token.end = __privateGet(this, _position);
  return token;
};
consumeOp_fn = function() {
  var token = __privateMethod(this, _Tokenizer_instances, makeOpToken_fn).call(this);
  var value = __privateMethod(this, _Tokenizer_instances, consumeChar_fn).call(this);
  while (__privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this) && OP_TABLE[value + __privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this)]) {
    value += __privateMethod(this, _Tokenizer_instances, consumeChar_fn).call(this);
  }
  token.type = OP_TABLE[value];
  token.value = value;
  token.end = __privateGet(this, _position);
  return token;
};
consumeString_fn = function() {
  var token = __privateMethod(this, _Tokenizer_instances, makeToken_fn).call(this, "STRING");
  var startChar = __privateMethod(this, _Tokenizer_instances, consumeChar_fn).call(this);
  token.template = startChar === "`";
  var value = "";
  while (__privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this) && __privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this) !== startChar) {
    if (__privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this) === "\\") {
      __privateMethod(this, _Tokenizer_instances, consumeChar_fn).call(this);
      let next = __privateMethod(this, _Tokenizer_instances, consumeChar_fn).call(this);
      if (next === "b") value += "\b";
      else if (next === "f") value += "\f";
      else if (next === "n") value += "\n";
      else if (next === "r") value += "\r";
      else if (next === "t") value += "	";
      else if (next === "v") value += "\v";
      else if (token.template && next === "$") value += "\\$";
      else if (next === "x") {
        const hex = __privateMethod(this, _Tokenizer_instances, consumeHexEscape_fn).call(this);
        if (Number.isNaN(hex)) {
          throw new Error("Invalid hexadecimal escape at [Line: " + token.line + ", Column: " + token.column + "]");
        }
        value += String.fromCharCode(hex);
      } else value += next;
    } else {
      value += __privateMethod(this, _Tokenizer_instances, consumeChar_fn).call(this);
    }
  }
  if (__privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this) !== startChar) {
    throw new Error("Unterminated string at [Line: " + token.line + ", Column: " + token.column + "]");
  } else {
    __privateMethod(this, _Tokenizer_instances, consumeChar_fn).call(this);
  }
  token.value = value;
  token.end = __privateGet(this, _position);
  return token;
};
consumeHexEscape_fn = function() {
  if (!__privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this)) return NaN;
  let result = 16 * Number.parseInt(__privateMethod(this, _Tokenizer_instances, consumeChar_fn).call(this), 16);
  if (!__privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this)) return NaN;
  result += Number.parseInt(__privateMethod(this, _Tokenizer_instances, consumeChar_fn).call(this), 16);
  return result;
};
// ----- Main tokenization loop -----
isLineComment_fn = function() {
  var c = __privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this), n = __privateMethod(this, _Tokenizer_instances, nextChar_fn).call(this), n2 = __privateMethod(this, _Tokenizer_instances, charAt_fn).call(this, 2);
  return c === "-" && n === "-" && (__privateMethod(this, _Tokenizer_instances, isWhitespace_fn).call(this, n2) || n2 === "" || n2 === "-") || c === "/" && n === "/" && (__privateMethod(this, _Tokenizer_instances, isWhitespace_fn).call(this, n2) || n2 === "" || n2 === "/");
};
isBlockComment_fn = function() {
  var c = __privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this), n = __privateMethod(this, _Tokenizer_instances, nextChar_fn).call(this), n2 = __privateMethod(this, _Tokenizer_instances, charAt_fn).call(this, 2);
  return c === "/" && n === "*" && (__privateMethod(this, _Tokenizer_instances, isWhitespace_fn).call(this, n2) || n2 === "" || n2 === "*");
};
tokenize_fn = function() {
  while (__privateGet(this, _position) < __privateGet(this, _source).length) {
    if (__privateMethod(this, _Tokenizer_instances, isLineComment_fn).call(this)) {
      __privateMethod(this, _Tokenizer_instances, consumeComment_fn).call(this);
    } else if (__privateMethod(this, _Tokenizer_instances, isBlockComment_fn).call(this)) {
      __privateMethod(this, _Tokenizer_instances, consumeMultilineComment_fn).call(this);
    } else if (__privateMethod(this, _Tokenizer_instances, isWhitespace_fn).call(this, __privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this))) {
      __privateGet(this, _tokens2).push(__privateMethod(this, _Tokenizer_instances, consumeWhitespace_fn).call(this));
    } else if (!__privateMethod(this, _Tokenizer_instances, possiblePrecedingSymbol_fn).call(this) && __privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this) === "." && (__privateMethod(this, _Tokenizer_instances, isAlpha_fn).call(this, __privateMethod(this, _Tokenizer_instances, nextChar_fn).call(this)) || __privateMethod(this, _Tokenizer_instances, nextChar_fn).call(this) === "{" || __privateMethod(this, _Tokenizer_instances, nextChar_fn).call(this) === "-")) {
      __privateGet(this, _tokens2).push(__privateMethod(this, _Tokenizer_instances, consumeClassReference_fn).call(this));
    } else if (!__privateMethod(this, _Tokenizer_instances, possiblePrecedingSymbol_fn).call(this) && __privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this) === "#" && (__privateMethod(this, _Tokenizer_instances, isAlpha_fn).call(this, __privateMethod(this, _Tokenizer_instances, nextChar_fn).call(this)) || __privateMethod(this, _Tokenizer_instances, nextChar_fn).call(this) === "{")) {
      __privateGet(this, _tokens2).push(__privateMethod(this, _Tokenizer_instances, consumeIdReference_fn).call(this));
    } else if (__privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this) === "[" && __privateMethod(this, _Tokenizer_instances, nextChar_fn).call(this) === "@") {
      __privateGet(this, _tokens2).push(__privateMethod(this, _Tokenizer_instances, consumeAttributeReference_fn).call(this));
    } else if (__privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this) === "@") {
      __privateGet(this, _tokens2).push(__privateMethod(this, _Tokenizer_instances, consumeShortAttributeReference_fn).call(this));
    } else if (__privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this) === "*" && __privateMethod(this, _Tokenizer_instances, isAlpha_fn).call(this, __privateMethod(this, _Tokenizer_instances, nextChar_fn).call(this))) {
      __privateGet(this, _tokens2).push(__privateMethod(this, _Tokenizer_instances, consumeStyleReference_fn).call(this));
    } else if (__privateMethod(this, _Tokenizer_instances, inTemplate_fn).call(this) && (__privateMethod(this, _Tokenizer_instances, isAlpha_fn).call(this, __privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this)) || __privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this) === "\\")) {
      __privateGet(this, _tokens2).push(__privateMethod(this, _Tokenizer_instances, consumeTemplateIdentifier_fn).call(this));
    } else if (!__privateMethod(this, _Tokenizer_instances, inTemplate_fn).call(this) && (__privateMethod(this, _Tokenizer_instances, isAlpha_fn).call(this, __privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this)) || __privateMethod(this, _Tokenizer_instances, isIdentifierChar_fn).call(this, __privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this)))) {
      __privateGet(this, _tokens2).push(__privateMethod(this, _Tokenizer_instances, consumeIdentifier_fn).call(this));
    } else if (__privateMethod(this, _Tokenizer_instances, isNumeric_fn).call(this, __privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this))) {
      __privateGet(this, _tokens2).push(__privateMethod(this, _Tokenizer_instances, consumeNumber_fn).call(this));
    } else if (!__privateMethod(this, _Tokenizer_instances, inTemplate_fn).call(this) && (__privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this) === '"' || __privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this) === "`")) {
      __privateGet(this, _tokens2).push(__privateMethod(this, _Tokenizer_instances, consumeString_fn).call(this));
    } else if (!__privateMethod(this, _Tokenizer_instances, inTemplate_fn).call(this) && __privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this) === "'") {
      if (__privateMethod(this, _Tokenizer_instances, isValidSingleQuoteStringStart_fn).call(this)) {
        __privateGet(this, _tokens2).push(__privateMethod(this, _Tokenizer_instances, consumeString_fn).call(this));
      } else {
        __privateGet(this, _tokens2).push(__privateMethod(this, _Tokenizer_instances, consumeOp_fn).call(this));
      }
    } else if (OP_TABLE[__privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this)]) {
      if (__privateGet(this, _lastToken) === "$" && __privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this) === "{") {
        __privateWrapper(this, _templateBraceCount)._++;
      }
      if (__privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this) === "}") {
        __privateWrapper(this, _templateBraceCount)._--;
      }
      __privateGet(this, _tokens2).push(__privateMethod(this, _Tokenizer_instances, consumeOp_fn).call(this));
    } else if (__privateMethod(this, _Tokenizer_instances, inTemplate_fn).call(this) || __privateMethod(this, _Tokenizer_instances, isReservedChar_fn).call(this, __privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this))) {
      __privateGet(this, _tokens2).push(__privateMethod(this, _Tokenizer_instances, makeToken_fn).call(this, "RESERVED", __privateMethod(this, _Tokenizer_instances, consumeChar_fn).call(this)));
    } else {
      if (__privateGet(this, _position) < __privateGet(this, _source).length) {
        throw new Error("Unknown token: " + __privateMethod(this, _Tokenizer_instances, currentChar_fn).call(this) + " ");
      }
    }
  }
  return new Tokens(__privateGet(this, _tokens2), __privateGet(this, _source));
};
var Tokenizer = _Tokenizer;

// src/parsetree/base.js
var ParseElement = class {
  sourceFor() {
    return this.programSource.substring(this.startToken.start, this.endToken.end);
  }
  lineFor() {
    return this.programSource.split("\n")[this.startToken.line - 1];
  }
  static parseEventArgs(parser) {
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
};
var Expression = class extends ParseElement {
  constructor() {
    super();
    if (this.constructor.grammarName) {
      this.type = this.constructor.grammarName;
    }
  }
  evaluate(context) {
    return context.meta.runtime.unifiedEval(this, context);
  }
  evalStatically() {
    throw new Error("This expression cannot be evaluated statically: " + this.type);
  }
};
var Command = class extends ParseElement {
  constructor() {
    super();
    if (this.constructor.keyword) {
      this.type = this.constructor.keyword + "Command";
    }
  }
  execute(context) {
    context.meta.command = this;
    return context.meta.runtime.unifiedExec(this, context);
  }
  static parsePseudopossessiveTarget(parser) {
    var targets;
    if (parser.matchToken("the") || parser.matchToken("element") || parser.matchToken("elements") || parser.currentToken().type === "CLASS_REF" || parser.currentToken().type === "ID_REF" || parser.currentToken().op && parser.currentToken().value === "<") {
      parser.possessivesDisabled = true;
      try {
        targets = parser.parseElement("expression");
      } finally {
        parser.possessivesDisabled = false;
      }
      if (parser.matchOpToken("'")) {
        parser.requireToken("s");
      }
    } else if (parser.currentToken().type === "IDENTIFIER" && parser.currentToken().value === "its") {
      targets = parser.parseElement("pseudopossessiveIts");
    } else {
      parser.matchToken("my") || parser.matchToken("me");
      targets = parser.parseElement("implicitMeTarget");
    }
    return targets;
  }
};
var Feature = class extends ParseElement {
  constructor() {
    super();
    __publicField(this, "isFeature", true);
    if (this.constructor.keyword) {
      this.type = this.constructor.keyword + "Feature";
    }
  }
  install(target, source, args, runtime2) {
  }
  /**
   * Parse optional catch/finally blocks after a command list.
   * Returns { errorHandler, errorSymbol, finallyHandler }
   */
  static parseErrorAndFinally(parser) {
    var errorSymbol, errorHandler, finallyHandler;
    if (parser.matchToken("catch")) {
      errorSymbol = parser.requireTokenType("IDENTIFIER").value;
      errorHandler = parser.requireElement("commandList");
      parser.ensureTerminated(errorHandler);
    }
    if (parser.matchToken("finally")) {
      finallyHandler = parser.requireElement("commandList");
      parser.ensureTerminated(finallyHandler);
    }
    return { errorHandler, errorSymbol, finallyHandler };
  }
};

// src/parsetree/internals.js
var EmptyCommandListCommand = class extends Command {
  constructor() {
    super();
    this.type = "emptyCommandListCommand";
  }
  resolve(context) {
    return context.meta.runtime.findNext(this, context);
  }
};
var UnlessStatementModifier = class extends Command {
  constructor(root, conditional) {
    super();
    this.type = "unlessStatementModifier";
    this.root = root;
    this.args = { conditional };
  }
  resolve(context, { conditional }) {
    if (conditional) {
      return this.next;
    } else {
      return this.root;
    }
  }
};
var HyperscriptProgram = class {
  constructor(features) {
    this.type = "hyperscript";
    this.features = features;
    this.errors = [];
  }
  apply(target, source, args, runtime2) {
    for (const feature of this.features) {
      feature.install(target, source, args, runtime2);
    }
  }
};
var FailedFeature = class extends Feature {
  constructor(error) {
    super();
    this.type = "failedFeature";
    this.error = error;
  }
  install() {
  }
};
var FailedCommand = class extends Command {
  constructor(error) {
    super();
    this.type = "failedCommand";
    this.error = error;
  }
  resolve() {
  }
};
var ImplicitReturn = class extends Command {
  constructor() {
    super();
    this.type = "implicitReturn";
  }
  resolve(context) {
    context.meta.returned = true;
    if (context.meta.resolve) {
      context.meta.resolve();
    }
    return context.meta.runtime.HALT;
  }
};

// src/parsetree/expressions/literals.js
var literals_exports = {};
__export(literals_exports, {
  ArrayLiteral: () => ArrayLiteral,
  BooleanLiteral: () => BooleanLiteral,
  NakedNamedArgumentList: () => NakedNamedArgumentList,
  NakedString: () => NakedString,
  NamedArgumentList: () => NamedArgumentList,
  NullLiteral: () => NullLiteral,
  NumberLiteral: () => NumberLiteral,
  ObjectKey: () => ObjectKey,
  ObjectLiteral: () => ObjectLiteral,
  StringLike: () => StringLike,
  StringLiteral: () => StringLiteral
});
var _NakedString = class _NakedString extends Expression {
  constructor(tokens) {
    super();
    this.tokens = tokens;
  }
  static parse(parser) {
    if (parser.hasMore()) {
      var tokenArr = parser.consumeUntilWhitespace();
      parser.matchTokenType("WHITESPACE");
      return new _NakedString(tokenArr);
    }
  }
  evalStatically() {
    return this.resolve();
  }
  resolve(context) {
    return this.tokens.map(function(t) {
      return t.value;
    }).join("");
  }
};
__publicField(_NakedString, "grammarName", "nakedString");
var NakedString = _NakedString;
var _BooleanLiteral = class _BooleanLiteral extends Expression {
  constructor(value) {
    super();
    this.value = value;
  }
  static parse(parser) {
    var booleanLiteral = parser.matchToken("true") || parser.matchToken("false");
    if (!booleanLiteral) return;
    const value = booleanLiteral.value === "true";
    return new _BooleanLiteral(value);
  }
  evalStatically() {
    return this.value;
  }
  resolve(context) {
    return this.value;
  }
};
__publicField(_BooleanLiteral, "grammarName", "boolean");
__publicField(_BooleanLiteral, "expressionType", "leaf");
var BooleanLiteral = _BooleanLiteral;
var _NullLiteral = class _NullLiteral extends Expression {
  constructor() {
    super();
  }
  static parse(parser) {
    if (parser.matchToken("null")) {
      return new _NullLiteral();
    }
  }
  evalStatically() {
    return null;
  }
  resolve(context) {
    return null;
  }
};
__publicField(_NullLiteral, "grammarName", "null");
__publicField(_NullLiteral, "expressionType", "leaf");
var NullLiteral = _NullLiteral;
var _NumberLiteral = class _NumberLiteral extends Expression {
  constructor(value, numberToken) {
    super();
    this.value = value;
    this.numberToken = numberToken;
  }
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
  evalStatically() {
    return this.value;
  }
  resolve(context) {
    return this.value;
  }
};
__publicField(_NumberLiteral, "grammarName", "number");
__publicField(_NumberLiteral, "expressionType", "leaf");
var NumberLiteral = _NumberLiteral;
var _StringLiteral = class _StringLiteral extends Expression {
  constructor(stringToken, rawValue, args) {
    super();
    this.token = stringToken;
    this.rawValue = rawValue;
    this.args = args.length > 0 ? { parts: args } : null;
  }
  static parse(parser) {
    var stringToken = parser.matchTokenType("STRING");
    if (!stringToken) return;
    var rawValue = (
      /** @type {string} */
      stringToken.value
    );
    var args;
    if (stringToken.template) {
      var innerTokens = Tokenizer.tokenize(rawValue, true);
      var innerParser = parser.createChildParser(innerTokens);
      args = innerParser.parseStringTemplate();
    } else {
      args = [];
    }
    return new _StringLiteral(stringToken, rawValue, args);
  }
  evalStatically() {
    if (this.args === null) return this.rawValue;
    return super.evalStatically();
  }
  resolve(context, { parts } = {}) {
    if (!parts || parts.length === 0) {
      return this.rawValue;
    }
    var returnStr = "";
    for (var i = 0; i < parts.length; i++) {
      var val = parts[i];
      if (val !== void 0) {
        returnStr += val;
      }
    }
    return returnStr;
  }
};
__publicField(_StringLiteral, "grammarName", "string");
__publicField(_StringLiteral, "expressionType", "leaf");
var StringLiteral = _StringLiteral;
var _ArrayLiteral = class _ArrayLiteral extends Expression {
  constructor(values) {
    super();
    this.values = values;
    this.args = { values };
  }
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
  resolve(context, { values }) {
    return values;
  }
};
__publicField(_ArrayLiteral, "grammarName", "arrayLiteral");
__publicField(_ArrayLiteral, "expressionType", "leaf");
var ArrayLiteral = _ArrayLiteral;
var _ObjectKey = class _ObjectKey extends Expression {
  constructor(key, expr, args) {
    super();
    this.key = key;
    this.expr = expr;
    this.args = args;
  }
  static parse(parser) {
    var token;
    if (token = parser.matchTokenType("STRING")) {
      return new _ObjectKey(token.value, null, null);
    } else if (parser.matchOpToken("[")) {
      var expr = parser.parseElement("expression");
      parser.requireOpToken("]");
      return new _ObjectKey(null, expr, { value: expr });
    } else {
      var key = "";
      do {
        token = parser.matchTokenType("IDENTIFIER") || parser.matchOpToken("-");
        if (token) key += token.value;
      } while (token);
      return new _ObjectKey(key, null, null);
    }
  }
  evalStatically() {
    if (!this.expr) return this.key;
    return super.evalStatically();
  }
  resolve(ctx, { value } = {}) {
    if (this.expr) {
      return value;
    }
    return this.key;
  }
};
__publicField(_ObjectKey, "grammarName", "objectKey");
var ObjectKey = _ObjectKey;
var _ObjectLiteral = class _ObjectLiteral extends Expression {
  constructor(keyExpressions, valueExpressions) {
    super();
    this.keyExpressions = keyExpressions;
    this.valueExpressions = valueExpressions;
    this.args = { keys: keyExpressions, values: valueExpressions };
  }
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
  resolve(context, { keys, values }) {
    var returnVal = {};
    for (var i = 0; i < keys.length; i++) {
      returnVal[keys[i]] = values[i];
    }
    return returnVal;
  }
};
__publicField(_ObjectLiteral, "grammarName", "objectLiteral");
__publicField(_ObjectLiteral, "expressionType", "leaf");
var ObjectLiteral = _ObjectLiteral;
var _NamedArgumentList = class _NamedArgumentList extends Expression {
  constructor(fields, valueExpressions) {
    super();
    this.fields = fields;
    this.args = { values: valueExpressions };
  }
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
  static parse(parser) {
    if (!parser.matchOpToken("(")) return;
    var elt = _NamedArgumentList.parseNaked(parser);
    parser.requireOpToken(")");
    return elt;
  }
  resolve(context, { values }) {
    var returnVal = { _namedArgList_: true };
    for (var i = 0; i < values.length; i++) {
      var field = this.fields[i];
      returnVal[field.name.value] = values[i];
    }
    return returnVal;
  }
};
__publicField(_NamedArgumentList, "grammarName", "namedArgumentList");
var NamedArgumentList = _NamedArgumentList;
var NakedNamedArgumentList = class extends Expression {
};
__publicField(NakedNamedArgumentList, "grammarName", "nakedNamedArgumentList");
__publicField(NakedNamedArgumentList, "parse", NamedArgumentList.parseNaked);
var StringLike = class extends Expression {
  static parse(parser) {
    return parser.parseAnyOf(["string", "nakedString"]);
  }
};
__publicField(StringLike, "grammarName", "stringLike");

// src/core/parser.js
var _kernel, _possessivesDisabled;
var _Parser = class _Parser {
  constructor(kernel2, tokens) {
    __privateAdd(this, _kernel);
    __privateAdd(this, _possessivesDisabled, false);
    __privateSet(this, _kernel, kernel2);
    this.tokens = tokens;
  }
  get possessivesDisabled() {
    return __privateGet(this, _possessivesDisabled);
  }
  set possessivesDisabled(value) {
    __privateSet(this, _possessivesDisabled, value);
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
  requireTokenType(...types) {
    return this.tokens.requireTokenType(...types);
  }
  matchTokenType(...types) {
    return this.tokens.matchTokenType(...types);
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
  token(n, includeWhitespace) {
    return this.tokens.token(n, includeWhitespace);
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
  createChildParser(tokens) {
    return new _Parser(__privateGet(this, _kernel), tokens);
  }
  // ===========================
  // Kernel delegation methods
  // ===========================
  parseElement(type, root = null) {
    return __privateGet(this, _kernel).parseElement(type, this, root);
  }
  requireElement(type, message, root) {
    return __privateGet(this, _kernel).requireElement(type, this, message, root);
  }
  parseAnyOf(types) {
    return __privateGet(this, _kernel).parseAnyOf(types, this);
  }
  raiseParseError(message) {
    return __privateGet(this, _kernel).raiseParseError(this.tokens, message);
  }
  // ===========================
  // Parser-owned methods
  // ===========================
  parseStringTemplate() {
    var returnArr = [""];
    do {
      returnArr.push(this.lastWhitespace());
      if (this.currentToken().value === "$") {
        this.consumeToken();
        var startingBrace = this.matchOpToken("{");
        returnArr.push(this.requireElement("expression"));
        if (startingBrace) {
          this.requireOpToken("}");
        }
        returnArr.push("");
      } else if (this.currentToken().value === "\\") {
        this.consumeToken();
        this.consumeToken();
      } else {
        var token = this.consumeToken();
        returnArr[returnArr.length - 1] += token ? token.value : "";
      }
    } while (this.hasMore());
    returnArr.push(this.lastWhitespace());
    return returnArr;
  }
  commandBoundary(token) {
    if (token.value == "end" || token.value == "then" || token.value == "else" || token.value == "otherwise" || token.value == ")" || this.commandStart(token) || this.featureStart(token) || token.type == "EOF") {
      return true;
    }
    return false;
  }
  commandStart(token) {
    return __privateGet(this, _kernel).commandStart(token);
  }
  featureStart(token) {
    return __privateGet(this, _kernel).featureStart(token);
  }
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
  parseURLOrExpression() {
    var cur = this.currentToken();
    if (cur.value === "/" && cur.type === "DIVIDE") {
      var tokens = this.consumeUntilWhitespace();
      this.matchTokenType("WHITESPACE");
      return new NakedString(tokens);
    }
    if (cur.type === "IDENTIFIER" && (cur.value === "http" || cur.value === "https" || cur.value === "ws" || cur.value === "wss")) {
      var tokens = this.consumeUntilWhitespace();
      this.matchTokenType("WHITESPACE");
      return new NakedString(tokens);
    }
    return this.requireElement("expression");
  }
  ensureTerminated(commandList) {
    var implicitReturn = new ImplicitReturn();
    var end = commandList;
    while (end.next) {
      end = end.next;
    }
    end.next = implicitReturn;
  }
};
_kernel = new WeakMap();
_possessivesDisabled = new WeakMap();
var Parser = _Parser;

// src/core/kernel.js
var _grammar, _commands, _features, _leafExpressions, _indirectExpressions, _postfixExpressions, _unaryExpressions, _topExpressions, _assignableExpressions, _LanguageKernel_instances, syncToFeature_fn, syncToCommand_fn;
var _LanguageKernel = class _LanguageKernel {
  constructor() {
    __privateAdd(this, _LanguageKernel_instances);
    __privateAdd(this, _grammar, {});
    __privateAdd(this, _commands, {});
    __privateAdd(this, _features, {});
    __privateAdd(this, _leafExpressions, []);
    __privateAdd(this, _indirectExpressions, []);
    __privateAdd(this, _postfixExpressions, []);
    __privateAdd(this, _unaryExpressions, []);
    __privateAdd(this, _topExpressions, []);
    __privateAdd(this, _assignableExpressions, []);
    this.addGrammarElement("hyperscript", this.parseHyperscriptProgram.bind(this));
    this.addGrammarElement("feature", this.parseFeature.bind(this));
    this.addGrammarElement("commandList", this.parseCommandList.bind(this));
    this.addGrammarElement("command", this.parseCommand.bind(this));
    this.addGrammarElement("indirectStatement", this.parseIndirectStatement.bind(this));
    this.addGrammarElement("expression", this.parseExpression.bind(this));
    this.addGrammarElement("assignableExpression", this.parseAssignableExpression.bind(this));
    this.addGrammarElement("unaryExpression", this.parseUnaryExpression.bind(this));
    this.addGrammarElement("postfixExpression", this.parsePostfixExpression.bind(this));
    this.addGrammarElement("primaryExpression", this.parsePrimaryExpression.bind(this));
    this.addGrammarElement("indirectExpression", this.parseIndirectExpression.bind(this));
    this.addGrammarElement("leaf", this.parseLeaf.bind(this));
  }
  parseFeature(parser) {
    if (parser.matchOpToken("(")) {
      var featureElement = parser.requireElement("feature");
      parser.requireOpToken(")");
      return featureElement;
    }
    var featureDefinition = __privateGet(this, _features)[parser.currentToken().value || ""];
    if (featureDefinition) {
      return featureDefinition(parser);
    }
  }
  parseCommand(parser) {
    if (parser.matchOpToken("(")) {
      const commandElement2 = parser.requireElement("command");
      parser.requireOpToken(")");
      return commandElement2;
    }
    var commandDefinition = __privateGet(this, _commands)[parser.currentToken().value || ""];
    let commandElement;
    if (commandDefinition) {
      commandElement = commandDefinition(parser);
    } else if (parser.currentToken().type === "IDENTIFIER") {
      commandElement = parser.parseElement("pseudoCommand");
    }
    if (commandElement) {
      return this.parseElement("indirectStatement", parser, commandElement);
    }
    return commandElement;
  }
  parseCommandList(parser) {
    if (parser.hasMore()) {
      var cmd;
      try {
        cmd = parser.parseElement("command");
      } catch (e) {
        if (e instanceof ParseRecoverySentinel) {
          console.error("RECOVERY at token:", parser.currentToken().value, "pos:", parser.currentToken().start, "error:", e.parseError.message);
          debugger;
          cmd = new FailedCommand(e.parseError);
          __privateMethod(this, _LanguageKernel_instances, syncToCommand_fn).call(this, parser);
          console.error("SYNCED to token:", parser.currentToken().value);
        } else {
          throw e;
        }
      }
      if (cmd) {
        parser.matchToken("then");
        const next = parser.parseElement("commandList");
        if (next) cmd.next = next;
        return cmd;
      }
    }
    return new EmptyCommandListCommand();
  }
  parseLeaf(parser) {
    var result = parser.parseAnyOf(__privateGet(this, _leafExpressions));
    if (result == null) {
      return parser.parseElement("symbol");
    }
    return result;
  }
  parseIndirectExpression(parser, root) {
    for (var i = 0; i < __privateGet(this, _indirectExpressions).length; i++) {
      var indirect = __privateGet(this, _indirectExpressions)[i];
      root.endToken = parser.lastMatch();
      var result = this.parseElement(indirect, parser, root);
      if (result) {
        return result;
      }
    }
    return root;
  }
  parsePostfixExpression(parser) {
    var root = parser.parseElement("negativeNumber");
    for (var i = 0; i < __privateGet(this, _postfixExpressions).length; i++) {
      var postfixType = __privateGet(this, _postfixExpressions)[i];
      var result = this.parseElement(postfixType, parser, root);
      if (result) {
        return result;
      }
    }
    return root;
  }
  parseUnaryExpression(parser) {
    parser.matchToken("the");
    return parser.parseAnyOf(__privateGet(this, _unaryExpressions)) || parser.parseElement("postfixExpression");
  }
  parseExpression(parser) {
    parser.matchToken("the");
    return parser.parseAnyOf(__privateGet(this, _topExpressions));
  }
  parseAssignableExpression(parser) {
    parser.matchToken("the");
    var expr = parser.parseElement("primaryExpression");
    var checkExpr = expr;
    while (checkExpr && checkExpr.type === "parenthesized") {
      checkExpr = checkExpr.expr;
    }
    if (checkExpr && __privateGet(this, _assignableExpressions).includes(checkExpr.type)) {
      return expr;
    } else {
      parser.raiseParseError(
        "A target expression must be writable.  The expression type '" + (checkExpr && checkExpr.type) + "' is not."
      );
    }
  }
  parseIndirectStatement(parser, root) {
    if (parser.matchToken("unless")) {
      root.endToken = parser.lastMatch();
      var conditional = parser.requireElement("expression");
      var unless = new UnlessStatementModifier(root, conditional);
      root.parent = unless;
      return unless;
    }
    return root;
  }
  parsePrimaryExpression(parser) {
    var leaf = parser.parseElement("leaf");
    if (leaf) {
      return this.parseElement("indirectExpression", parser, leaf);
    }
    parser.raiseParseError("Unexpected value: " + parser.currentToken().value);
  }
  parseHyperscriptProgram(parser) {
    var features = [];
    if (parser.hasMore()) {
      var _pLoopGuard = 0;
      while (parser.currentToken().type !== "EOF") {
        if (++_pLoopGuard > 100) {
          console.error("HANG: program parse loop, token:", parser.currentToken());
          debugger;
        }
        if (parser.featureStart(parser.currentToken()) || parser.currentToken().value === "(") {
          try {
            var feature = parser.requireElement("feature");
            features.push(feature);
            parser.matchToken("end");
          } catch (e) {
            if (e instanceof ParseRecoverySentinel) {
              features.push(new FailedFeature(e.parseError));
              __privateMethod(this, _LanguageKernel_instances, syncToFeature_fn).call(this, parser);
            } else {
              throw e;
            }
          }
        } else if (parser.currentToken().value === "end") {
          break;
        } else if (parser.tokens.recoveryMode) {
          try {
            parser.raiseParseError("Unexpected token: " + parser.currentToken().value);
          } catch (e) {
            if (e instanceof ParseRecoverySentinel) {
              features.push(new FailedFeature(e.parseError));
              __privateMethod(this, _LanguageKernel_instances, syncToFeature_fn).call(this, parser);
            } else {
              throw e;
            }
          }
        } else {
          break;
        }
      }
    }
    return new HyperscriptProgram(features);
  }
  use(plugin) {
    plugin(this);
    return this;
  }
  initElt(parseElement, start, tokens) {
    parseElement.startToken = start;
    parseElement.programSource = tokens.source;
  }
  parseElement(type, parser, root = void 0) {
    var elementDefinition = __privateGet(this, _grammar)[type];
    if (elementDefinition) {
      var tokens = parser.tokens;
      var start = tokens.currentToken();
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
  requireElement(type, parser, message, root) {
    var result = this.parseElement(type, parser, root);
    if (!result) _LanguageKernel.raiseParseError(parser.tokens, message || "Expected " + type);
    return result;
  }
  parseAnyOf(types, parser) {
    for (var i = 0; i < types.length; i++) {
      var type = types[i];
      var expression = this.parseElement(type, parser);
      if (expression) {
        return expression;
      }
    }
  }
  addGrammarElement(name, definition) {
    if (__privateGet(this, _grammar)[name]) {
      throw new Error(`Grammar element '${name}' already exists`);
    }
    __privateGet(this, _grammar)[name] = definition;
  }
  addCommand(keyword, definition) {
    var commandGrammarType = keyword + "Command";
    __privateGet(this, _grammar)[commandGrammarType] = definition;
    __privateGet(this, _commands)[keyword] = definition;
  }
  addCommands(...commandClasses) {
    for (const CommandClass of commandClasses) {
      if (!CommandClass.keyword) {
        throw new Error(`Command class ${CommandClass.name} must have a static 'keyword' property`);
      }
      if (!CommandClass.parse) {
        throw new Error(`Command class ${CommandClass.name} must have a static 'parse' method`);
      }
      var keywords = Array.isArray(CommandClass.keyword) ? CommandClass.keyword : [CommandClass.keyword];
      for (var kw of keywords) this.addCommand(kw, CommandClass.parse);
    }
  }
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
  addFeature(keyword, definition) {
    var featureGrammarType = keyword + "Feature";
    __privateGet(this, _grammar)[featureGrammarType] = definition;
    __privateGet(this, _features)[keyword] = definition;
  }
  /**
   * Register a parse element class based on its static metadata.
   * Commands need `static keyword`, expressions need `static grammarName`.
   */
  registerParseElement(ElementClass) {
    if (!ElementClass.parse) return;
    const parse = ElementClass.parse.bind(ElementClass);
    if (ElementClass.keyword && ElementClass.prototype instanceof Command) {
      var keywords = Array.isArray(ElementClass.keyword) ? ElementClass.keyword : [ElementClass.keyword];
      for (var kw of keywords) this.addCommand(kw, parse);
      return;
    }
    if (ElementClass.keyword && ElementClass.prototype instanceof Feature) {
      var keywords = Array.isArray(ElementClass.keyword) ? ElementClass.keyword : [ElementClass.keyword];
      for (var kw of keywords) this.addFeature(kw, parse);
      return;
    }
    const name = ElementClass.grammarName;
    if (!name) return;
    switch (ElementClass.expressionType) {
      case "leaf":
        this.addLeafExpression(name, parse);
        break;
      case "indirect":
        this.addIndirectExpression(name, parse);
        break;
      case "unary":
        this.addUnaryExpression(name, parse);
        break;
      case "top":
        this.addTopExpression(name, parse);
        break;
      case "postfix":
        this.addPostfixExpression(name, parse);
        break;
      default:
        this.addGrammarElement(name, parse);
        break;
    }
    if (ElementClass.assignable) {
      __privateGet(this, _assignableExpressions).push(name);
    }
  }
  /**
   * Register all exported parse element classes from a module.
   * Iterates over module exports and registers any class with
   * a static `parse` method and appropriate metadata.
   */
  registerModule(module) {
    for (const exported of Object.values(module)) {
      if (typeof exported === "function" && exported.parse) {
        this.registerParseElement(exported);
      }
    }
  }
  addLeafExpression(name, definition) {
    __privateGet(this, _leafExpressions).push(name);
    this.addGrammarElement(name, definition);
  }
  addIndirectExpression(name, definition) {
    __privateGet(this, _indirectExpressions).push(name);
    this.addGrammarElement(name, definition);
  }
  addPostfixExpression(name, definition) {
    __privateGet(this, _postfixExpressions).push(name);
    this.addGrammarElement(name, definition);
  }
  addUnaryExpression(name, definition) {
    __privateGet(this, _unaryExpressions).push(name);
    this.addGrammarElement(name, definition);
  }
  addTopExpression(name, definition) {
    __privateGet(this, _topExpressions).push(name);
    this.addGrammarElement(name, definition);
  }
  commandStart(token) {
    return __privateGet(this, _commands)[token.value || ""];
  }
  featureStart(token) {
    return __privateGet(this, _features)[token.value || ""];
  }
  static raiseParseError(tokens, message) {
    tokens.raiseError(message);
  }
  raiseParseError(tokens, message) {
    tokens.raiseError(message);
  }
  parseHyperScript(tokens) {
    tokens.enableRecovery();
    var parser = new Parser(this, tokens);
    var result;
    try {
      result = parser.parseElement("hyperscript");
      if (tokens.hasMore()) this.raiseParseError(tokens);
    } catch (e) {
      if (!(e instanceof ParseRecoverySentinel)) throw e;
    }
    if (result) {
      result.errors = tokens.errors;
      return result;
    }
  }
  parse(tokenizer2, src) {
    var tokens = tokenizer2.tokenize(src);
    var parser = new Parser(this, tokens);
    if (parser.commandStart(tokens.currentToken())) {
      var commandList = this.requireElement("commandList", parser);
      if (tokens.hasMore()) _LanguageKernel.raiseParseError(tokens);
      parser.ensureTerminated(commandList);
      return commandList;
    } else if (parser.featureStart(tokens.currentToken())) {
      var hyperscript = this.requireElement("hyperscript", parser);
      if (tokens.hasMore()) _LanguageKernel.raiseParseError(tokens);
      return hyperscript;
    } else {
      var expression = this.requireElement("expression", parser);
      if (tokens.hasMore()) _LanguageKernel.raiseParseError(tokens);
      return expression;
    }
  }
};
_grammar = new WeakMap();
_commands = new WeakMap();
_features = new WeakMap();
_leafExpressions = new WeakMap();
_indirectExpressions = new WeakMap();
_postfixExpressions = new WeakMap();
_unaryExpressions = new WeakMap();
_topExpressions = new WeakMap();
_assignableExpressions = new WeakMap();
_LanguageKernel_instances = new WeakSet();
syncToFeature_fn = function(parser) {
  parser.tokens.clearFollows();
  while (parser.hasMore() && !parser.featureStart(parser.currentToken()) && parser.currentToken().value !== "end" && parser.currentToken().type !== "EOF") {
    parser.tokens.consumeToken();
  }
};
syncToCommand_fn = function(parser) {
  parser.tokens.clearFollows();
  var _sLoopGuard = 0;
  while (parser.hasMore() && !parser.commandBoundary(parser.currentToken())) {
    if (++_sLoopGuard > 200) {
      console.error("HANG: syncToCommand loop, token:", parser.currentToken());
      debugger;
    }
    parser.tokens.consumeToken();
  }
  if (parser.hasMore() && parser.currentToken().value === "then") {
    parser.tokens.consumeToken();
  }
};
var LanguageKernel = _LanguageKernel;

// src/core/config.js
var config = {
  attributes: "_, script, data-script",
  defaultTransition: "all 500ms ease-in",
  disableSelector: "[disable-scripting], [data-disable-scripting]",
  hideShowStrategies: {},
  logAll: false
};

// src/core/runtime/conversions.js
var HyperscriptFormData = class {
  constructor() {
    __publicField(this, "result", {});
  }
  addElement(node) {
    if (node.name == void 0 || node.value == void 0) return;
    if (node.type === "radio" && !node.checked) return;
    var name = node.name;
    var value;
    if (node.type === "checkbox") {
      value = node.checked ? [node.value] : void 0;
    } else if (node.type === "select-multiple") {
      value = Array.from(node.options).filter((o) => o.selected).map((o) => o.value);
    } else {
      value = node.value;
    }
    if (value == void 0) return;
    if (this.result[name] == void 0) {
      this.result[name] = value;
    } else {
      var existing = Array.isArray(this.result[name]) ? this.result[name] : [this.result[name]];
      this.result[name] = existing.concat(value);
    }
  }
  addContainer(node) {
    if (node.name != void 0 && node.value != void 0) {
      this.addElement(node);
      return;
    }
    if (node.querySelectorAll) {
      node.querySelectorAll("input,select,textarea").forEach((child) => this.addElement(child));
    }
  }
};
var conversions = {
  dynamicResolvers: [
    // Fixed-point number conversion
    function(str, value) {
      if (str === "Fixed") {
        return Number(value).toFixed();
      } else if (str.startsWith("Fixed:")) {
        let num = str.split(":")[1];
        return Number(value).toFixed(parseInt(num));
      }
    },
    // Values conversion - extracts form values from DOM nodes
    function(str, node, runtime2) {
      if (str !== "Values") return;
      var formData = new HyperscriptFormData();
      runtime2.implicitLoop(node, (node2) => formData.addContainer(node2));
      return formData.result;
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
  Boolean: function(val) {
    return !!val;
  },
  Date: function(val) {
    return new Date(val);
  },
  Array: function(val) {
    return Array.from(val);
  },
  JSON: function(val) {
    return JSON.parse(val);
  },
  JSONString: function(val) {
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
  },
  FormEncoded: function(val) {
    return new URLSearchParams(val).toString();
  },
  HTML: function(value) {
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
  },
  Fragment: function(val, runtime2) {
    var frag = document.createDocumentFragment();
    runtime2.implicitLoop(val, (val2) => {
      if (val2 instanceof Node) frag.append(val2);
      else {
        var temp = document.createElement("template");
        temp.innerHTML = val2;
        frag.append(temp.content);
      }
    });
    return frag;
  }
};

// src/core/runtime/cookies.js
var _CookieJar_instances, parseCookies_fn;
var CookieJar = class {
  constructor() {
    __privateAdd(this, _CookieJar_instances);
  }
  get(target, prop) {
    if (prop === "then") {
      return null;
    } else if (prop === "length") {
      return __privateMethod(this, _CookieJar_instances, parseCookies_fn).call(this).length;
    } else if (prop === "clear") {
      return (name) => {
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
      };
    } else if (prop === "clearAll") {
      return () => {
        for (const cookie of __privateMethod(this, _CookieJar_instances, parseCookies_fn).call(this)) {
          document.cookie = cookie.name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
        }
      };
    } else if (prop === Symbol.iterator) {
      var cookies2 = __privateMethod(this, _CookieJar_instances, parseCookies_fn).call(this);
      return cookies2[Symbol.iterator].bind(cookies2);
    } else if (typeof prop === "string") {
      if (!isNaN(prop)) {
        return __privateMethod(this, _CookieJar_instances, parseCookies_fn).call(this)[parseInt(prop)];
      }
      var match = __privateMethod(this, _CookieJar_instances, parseCookies_fn).call(this).find((c) => c.name === prop);
      return match ? match.value : void 0;
    }
  }
  set(target, prop, value) {
    var parts = [];
    if (typeof value === "string") {
      parts.push(encodeURIComponent(value));
      parts.push("samesite=lax");
    } else {
      parts.push(encodeURIComponent(value.value));
      if (value.expires) parts.push("expires=" + value.expires);
      if (value.maxAge) parts.push("max-age=" + value.maxAge);
      if (value.partitioned) parts.push("partitioned=" + value.partitioned);
      if (value.path) parts.push("path=" + value.path);
      if (value.samesite) parts.push("samesite=" + value.samesite);
      if (value.secure) parts.push("secure");
    }
    document.cookie = String(prop) + "=" + parts.join(";");
    return true;
  }
  proxy() {
    return new Proxy({}, this);
  }
};
_CookieJar_instances = new WeakSet();
parseCookies_fn = function() {
  if (!document.cookie) return [];
  return document.cookie.split("; ").map((entry) => {
    var eq = entry.indexOf("=");
    return { name: entry.slice(0, eq), value: decodeURIComponent(entry.slice(eq + 1)) };
  });
};

// src/core/runtime/collections.js
var SHOULD_AUTO_ITERATE_SYM = /* @__PURE__ */ Symbol();
var ElementCollection = class {
  constructor(css, relativeToElement, escape, runtime2) {
    this._css = css;
    this.relativeToElement = relativeToElement;
    this.escape = escape;
    this._runtime = runtime2;
    this[SHOULD_AUTO_ITERATE_SYM] = true;
  }
  get css() {
    if (this.escape) {
      return this._runtime.escapeSelector(this._css);
    } else {
      return this._css;
    }
  }
  get className() {
    return this._css.slice(1);
  }
  get id() {
    return this.className;
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
    if (match[0].length === 0) this.re.lastIndex++;
    return { value: match };
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

// src/core/runtime/reactivity.js
function _sameValue(a, b) {
  return a === b ? a !== 0 || 1 / a === 1 / b : a !== a && b !== b;
}
var objectState = /* @__PURE__ */ new WeakMap();
var globalSubscriptions = /* @__PURE__ */ new Map();
var nextId = 0;
function getObjectState(obj) {
  var state = objectState.get(obj);
  if (!state) {
    objectState.set(obj, state = {
      id: String(++nextId),
      subscriptions: null,
      propertyHandler: null,
      attributeObservers: null
    });
  }
  return state;
}
var Reactivity = class {
  constructor() {
    this._currentEffect = null;
    this._pendingEffects = /* @__PURE__ */ new Set();
    this._elementEffects = /* @__PURE__ */ new WeakMap();
    this._isRunScheduled = false;
  }
  /**
   * Whether an effect is currently evaluating its expression().
   * When true, reads (symbol/property/attribute) are recorded as dependencies.
   * @returns {boolean}
   */
  get isTracking() {
    return this._currentEffect !== null;
  }
  /**
   * Track a global variable read as a dependency.
   * @param {string} name - Variable name
   */
  trackGlobalSymbol(name) {
    this._currentEffect.dependencies.set(
      "symbol:global:" + name,
      { type: "symbol", name, scope: "global" }
    );
  }
  /**
   * Track an element-scoped variable read as a dependency.
   * @param {string} name - Variable name
   * @param {Element} element - Owning element
   */
  trackElementSymbol(name, element) {
    if (!element) return;
    var elementId = getObjectState(element).id;
    this._currentEffect.dependencies.set(
      "symbol:element:" + name + ":" + elementId,
      { type: "symbol", name, scope: "element", element }
    );
  }
  /**
   * Track a property read as a dependency.
   * @param {Object} obj - DOM element or plain JS object
   * @param {string} name - Property name
   */
  trackProperty(obj, name) {
    if (obj == null || typeof obj !== "object") return;
    this._currentEffect.dependencies.set(
      "property:" + name + ":" + getObjectState(obj).id,
      { type: "property", object: obj, name }
    );
  }
  /**
   * Track a DOM attribute read as a dependency.
   * @param {Element} element
   * @param {string} name - Attribute name
   */
  trackAttribute(element, name) {
    if (!(element instanceof Element)) return;
    this._currentEffect.dependencies.set(
      "attribute:" + name + ":" + getObjectState(element).id,
      { type: "attribute", element, name }
    );
  }
  /**
   * Notify that a global variable was written.
   * @param {string} name - Variable name
   */
  notifyGlobalSymbol(name) {
    var subs = globalSubscriptions.get(name);
    if (subs) {
      for (var effect of subs) {
        this._scheduleEffect(effect);
      }
    }
  }
  /**
   * Notify that an element-scoped variable was written.
   * @param {string} name - Variable name
   * @param {Element} element - Owning element
   */
  notifyElementSymbol(name, element) {
    if (!element) return;
    var state = getObjectState(element);
    if (state.subscriptions) {
      var subs = state.subscriptions.get(name);
      if (subs) {
        for (var effect of subs) {
          this._scheduleEffect(effect);
        }
      }
    }
  }
  /**
   * Notify that a property was written programmatically.
   * Schedules all effects watching properties on this object.
   * @param {Object} obj - DOM element or plain JS object
   */
  notifyProperty(obj) {
    if (obj == null || typeof obj !== "object") return;
    var state = objectState.get(obj);
    if (state && state.propertyHandler) {
      state.propertyHandler.queueAll();
    }
  }
  /**
   * Add an effect to the pending set.
   * Schedules a microtask to run them if one isn't already scheduled.
   * @param {Effect} effect
   */
  _scheduleEffect(effect) {
    if (effect.isStopped) return;
    this._pendingEffects.add(effect);
    if (!this._isRunScheduled) {
      this._isRunScheduled = true;
      var self2 = this;
      queueMicrotask(function() {
        self2._runPendingEffects();
      });
    }
  }
  /**
   * Run all pending effects. Called once per microtask batch.
   * Effects that re-trigger during this run are queued for the next batch.
   */
  _runPendingEffects() {
    this._isRunScheduled = false;
    var effects = Array.from(this._pendingEffects);
    this._pendingEffects.clear();
    for (var effect of effects) {
      if (effect.isStopped) continue;
      if (effect.element && !effect.element.isConnected) {
        this.stopEffect(effect);
        continue;
      }
      effect._consecutiveTriggers++;
      if (effect._consecutiveTriggers > 100) {
        console.error(
          "Reactivity loop detected: an effect triggered 100 consecutive times without settling. This usually means an effect is modifying a variable it also depends on.",
          effect.element || effect
        );
        continue;
      }
      this._runEffect(effect);
    }
    if (this._pendingEffects.size === 0) {
      for (var i = 0; i < effects.length; i++) {
        if (!effects[i].isStopped) effects[i]._consecutiveTriggers = 0;
      }
    }
  }
  /** @param {Effect} effect */
  _runEffect(effect) {
    this._unsubscribeEffect(effect);
    var oldDeps = effect.dependencies;
    effect.dependencies = /* @__PURE__ */ new Map();
    var prev = this._currentEffect;
    this._currentEffect = effect;
    var newValue;
    try {
      newValue = effect.expression();
    } catch (e) {
      console.error("Error in reactive expression:", e);
      effect.dependencies = oldDeps;
      this._currentEffect = prev;
      this._subscribeEffect(effect);
      return;
    }
    this._currentEffect = prev;
    this._subscribeEffect(effect);
    this._cleanupOrphanedDeps(oldDeps);
    if (!_sameValue(newValue, effect._lastExpressionValue)) {
      effect._lastExpressionValue = newValue;
      try {
        effect.handler(newValue);
      } catch (e) {
        console.error("Error in reactive handler:", e);
      }
    }
  }
  /**
   * Subscribe an effect to all its current deps.
   * Symbols go into subscription maps, attributes get MutationObservers,
   * properties use persistent per-element input/change listeners.
   * @param {Effect} effect
   */
  _subscribeEffect(effect) {
    var reactivity2 = this;
    for (var [depKey, dep] of effect.dependencies) {
      if (dep.type === "symbol" && dep.scope === "global") {
        if (!globalSubscriptions.has(dep.name)) {
          globalSubscriptions.set(dep.name, /* @__PURE__ */ new Set());
        }
        globalSubscriptions.get(dep.name).add(effect);
      } else if (dep.type === "symbol" && dep.scope === "element") {
        var state = getObjectState(dep.element);
        if (!state.subscriptions) {
          state.subscriptions = /* @__PURE__ */ new Map();
        }
        if (!state.subscriptions.has(dep.name)) {
          state.subscriptions.set(dep.name, /* @__PURE__ */ new Set());
        }
        state.subscriptions.get(dep.name).add(effect);
      } else if (dep.type === "attribute") {
        reactivity2._subscribeAttributeDependency(dep.element, dep.name, effect);
      } else if (dep.type === "property") {
        reactivity2._subscribePropertyDependency(dep.object, dep.name, effect);
      }
    }
  }
  /**
   * Subscribe to a DOM attribute. Sets up a persistent MutationObserver
   * per element+attribute, shared across effects and re-runs.
   * @param {Element} element
   * @param {string} attrName
   * @param {Effect} effect
   */
  _subscribeAttributeDependency(element, attrName, effect) {
    var reactivity2 = this;
    var state = getObjectState(element);
    if (!state.attributeObservers) {
      state.attributeObservers = {};
    }
    if (!state.attributeObservers[attrName]) {
      var trackedEffects = /* @__PURE__ */ new Set();
      var observer = new MutationObserver(function() {
        for (var eff of trackedEffects) {
          reactivity2._scheduleEffect(eff);
        }
      });
      observer.observe(element, {
        attributes: true,
        attributeFilter: [attrName]
      });
      state.attributeObservers[attrName] = {
        effects: trackedEffects,
        observer
      };
    }
    state.attributeObservers[attrName].effects.add(effect);
  }
  /**
   * Subscribe to a property on an object. For DOM elements, sets up
   * persistent input/change event listeners. For plain objects, only
   * the subscription map is used (notified via setProperty).
   * @param {Object} obj - DOM element or plain JS object
   * @param {string} propName
   * @param {Effect} effect
   */
  _subscribePropertyDependency(obj, propName, effect) {
    var reactivity2 = this;
    var state = getObjectState(obj);
    if (!state.propertyHandler) {
      var trackedEffects = /* @__PURE__ */ new Set();
      var queueAll = function() {
        for (var eff of trackedEffects) {
          reactivity2._scheduleEffect(eff);
        }
      };
      var remove;
      if (obj instanceof Element) {
        obj.addEventListener("input", queueAll);
        obj.addEventListener("change", queueAll);
        remove = function() {
          obj.removeEventListener("input", queueAll);
          obj.removeEventListener("change", queueAll);
        };
      } else {
        remove = function() {
        };
      }
      state.propertyHandler = {
        effects: trackedEffects,
        queueAll,
        remove
      };
    }
    state.propertyHandler.effects.add(effect);
  }
  /** @param {Effect} effect */
  _unsubscribeEffect(effect) {
    for (var [depKey, dep] of effect.dependencies) {
      if (dep.type === "symbol" && dep.scope === "global") {
        var subs = globalSubscriptions.get(dep.name);
        if (subs) {
          subs.delete(effect);
          if (subs.size === 0) {
            globalSubscriptions.delete(dep.name);
          }
        }
      } else if (dep.type === "symbol" && dep.scope === "element") {
        var state = getObjectState(dep.element);
        if (state.subscriptions) {
          var subs = state.subscriptions.get(dep.name);
          if (subs) {
            subs.delete(effect);
            if (subs.size === 0) {
              state.subscriptions.delete(dep.name);
            }
          }
        }
      } else if (dep.type === "attribute" && dep.element) {
        var state = getObjectState(dep.element);
        if (state.attributeObservers && state.attributeObservers[dep.name]) {
          state.attributeObservers[dep.name].effects.delete(effect);
        }
      } else if (dep.type === "property" && dep.object) {
        var state = getObjectState(dep.object);
        if (state.propertyHandler) {
          state.propertyHandler.effects.delete(effect);
        }
      }
    }
  }
  /**
   * Clean up MutationObservers and property listeners for deps with no remaining effects.
   * @param {Map<string, Dependency>} deps
   */
  _cleanupOrphanedDeps(deps) {
    for (var [depKey, dep] of deps) {
      if (dep.type === "attribute" && dep.element) {
        var state = getObjectState(dep.element);
        if (state.attributeObservers && state.attributeObservers[dep.name]) {
          var obs = state.attributeObservers[dep.name];
          if (obs.effects.size === 0) {
            obs.observer.disconnect();
            delete state.attributeObservers[dep.name];
          }
        }
      } else if (dep.type === "property" && dep.object) {
        var state = getObjectState(dep.object);
        if (state.propertyHandler && state.propertyHandler.effects.size === 0) {
          state.propertyHandler.remove();
          state.propertyHandler = null;
        }
      }
    }
  }
  /**
   * Create a reactive effect with automatic dependency tracking.
   * @param {() => any} expression - The watched expression
   * @param {(value: any) => void} handler - Called when the value changes
   * @param {Object} [options]
   * @param {Element} [options.element] - Auto-stop when element disconnects
   * @returns {() => void} Stop function
   */
  createEffect(expression, handler, options) {
    var effect = {
      expression,
      handler,
      dependencies: /* @__PURE__ */ new Map(),
      _lastExpressionValue: void 0,
      element: options && options.element || null,
      isStopped: false,
      _consecutiveTriggers: 0
    };
    var prev = this._currentEffect;
    this._currentEffect = effect;
    try {
      effect._lastExpressionValue = expression();
    } catch (e) {
      console.error("Error in reactive expression:", e);
    }
    this._currentEffect = prev;
    this._subscribeEffect(effect);
    if (effect.element) {
      var set = this._elementEffects.get(effect.element);
      if (!set) {
        set = /* @__PURE__ */ new Set();
        this._elementEffects.set(effect.element, set);
      }
      set.add(effect);
    }
    if (effect._lastExpressionValue != null) {
      try {
        handler(effect._lastExpressionValue);
      } catch (e) {
        console.error("Error in reactive handler:", e);
      }
    }
    var reactivity2 = this;
    return function stop() {
      reactivity2.stopEffect(effect);
    };
  }
  /** @param {Effect} effect */
  stopEffect(effect) {
    if (effect.isStopped) return;
    effect.isStopped = true;
    this._unsubscribeEffect(effect);
    this._cleanupOrphanedDeps(effect.dependencies);
    this._pendingEffects.delete(effect);
  }
  /** Stop all reactive effects owned by an element. */
  stopElementEffects(element) {
    var set = this._elementEffects.get(element);
    if (!set) return;
    for (var effect of set) {
      this.stopEffect(effect);
    }
    this._elementEffects.delete(element);
  }
};
var reactivity = new Reactivity();

// src/core/runtime/runtime.js
var cookies = new CookieJar().proxy();
function _applyWhenResults(elements, results, forwardFn, reverseFn) {
  var matched = [];
  for (var i = 0; i < elements.length; i++) {
    if (results[i]) {
      forwardFn(elements[i]);
      matched.push(elements[i]);
    } else reverseFn(elements[i]);
  }
  return matched;
}
var Context = class {
  constructor(owner, feature, hyperscriptTarget, event, runtime2, globalScope2, kernel2, tokenizer2) {
    this.meta = {
      parser: kernel2,
      tokenizer: tokenizer2,
      runtime: runtime2,
      owner,
      feature,
      iterators: {},
      ctx: this
    };
    this.locals = {
      cookies
    };
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      Object.defineProperty(this.locals, "clipboard", {
        get() {
          return navigator.clipboard.readText();
        },
        set(v) {
          navigator.clipboard.writeText(String(v));
        },
        enumerable: true,
        configurable: true
      });
    }
    if (typeof window !== "undefined" && window.getSelection) {
      Object.defineProperty(this.locals, "selection", {
        get() {
          return window.getSelection().toString();
        },
        enumerable: true,
        configurable: true
      });
    }
    this.me = hyperscriptTarget;
    this.you = void 0;
    this.result = void 0;
    this.event = event;
    this.target = event ? event.target : null;
    this.detail = event ? event.detail : null;
    this.sender = event ? event.detail ? event.detail.sender : null : null;
    this.body = "document" in globalScope2 ? document.body : null;
    runtime2.addFeatures(owner, this);
  }
};
var _kernel2, _tokenizer, _globalScope, _scriptAttrs, _Runtime_instances, isReservedWord_fn, isHyperscriptContext_fn, resolveInherited_fn, getElementScope_fn, flatGet_fn, isArrayLike_fn, isIterable_fn, getScriptAttributes_fn, getScript_fn, getScriptSelector_fn, hashScript_fn, initElement_fn;
var _Runtime = class _Runtime {
  constructor(globalScope2, kernel2, tokenizer2) {
    __privateAdd(this, _Runtime_instances);
    __publicField(this, "HALT", _Runtime.HALT);
    __privateAdd(this, _kernel2);
    __privateAdd(this, _tokenizer);
    __privateAdd(this, _globalScope);
    __privateAdd(this, _scriptAttrs, null);
    __privateSet(this, _globalScope, globalScope2);
    __privateSet(this, _kernel2, kernel2);
    __privateSet(this, _tokenizer, tokenizer2);
  }
  get globalScope() {
    return __privateGet(this, _globalScope);
  }
  // =================================================================
  // Core execution engine
  // =================================================================
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
        throw new Error("Command " + (command.type || "unknown") + " did not return a next element to execute");
      } else if (next.then) {
        next.then((resolvedNext) => {
          this.unifiedExec(resolvedNext, ctx);
        }).catch((reason) => {
          this.unifiedExec({
            resolve: function() {
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
  unifiedEval(parseElement, ctx, shortCircuitOnValue) {
    var async = false;
    var evaluatedArgs = {};
    if (parseElement.args) {
      for (var [name, argument] of Object.entries(parseElement.args)) {
        if (argument == null) {
          evaluatedArgs[name] = null;
        } else if (Array.isArray(argument)) {
          var arr = [];
          for (var j = 0; j < argument.length; j++) {
            var element = argument[j];
            if (element == null) {
              arr.push(null);
            } else if (element.evaluate) {
              var value = element.evaluate(ctx);
              if (value && value.then) {
                async = true;
              }
              arr.push(value);
            } else {
              arr.push(element);
            }
          }
          evaluatedArgs[name] = arr;
        } else if (argument.evaluate) {
          var value = argument.evaluate(ctx);
          if (value && value.then) {
            async = true;
          }
          evaluatedArgs[name] = value;
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
          evaluatedArgs[name] = argument;
        }
      }
    }
    if (async) {
      return new Promise((resolve, reject) => {
        var keys = Object.keys(evaluatedArgs);
        var values = Object.values(evaluatedArgs).map(
          (v) => Array.isArray(v) ? Promise.all(v) : v
        );
        Promise.all(values).then(function(resolved) {
          try {
            var finalArgs = {};
            keys.forEach((k, i) => finalArgs[k] = resolved[i]);
            resolve(parseElement.resolve(ctx, finalArgs));
          } catch (e) {
            reject(e);
          }
        }).catch(function(reason) {
          reject(reason);
        });
      });
    } else {
      return parseElement.resolve(ctx, evaluatedArgs);
    }
  }
  findNext(command, context) {
    if (command) {
      if (command.resolveNext) {
        return command.resolveNext(context);
      } else if (command.next) {
        return command.next;
      } else {
        return this.findNext(command.parent, context);
      }
    }
  }
  // =================================================================
  // Context and scope
  // =================================================================
  makeContext(owner, feature, hyperscriptTarget, event) {
    return new Context(owner, feature, hyperscriptTarget, event, this, __privateGet(this, _globalScope), __privateGet(this, _kernel2), __privateGet(this, _tokenizer));
  }
  getHyperscriptFeatures(elt) {
    var data = this.getInternalData(elt);
    if (!data.features) {
      data.features = {};
    }
    return data.features;
  }
  addFeatures(owner, ctx) {
    if (owner) {
      Object.assign(ctx.locals, this.getHyperscriptFeatures(owner));
      this.addFeatures(owner.parentElement, ctx);
    }
  }
  resolveSymbol(str, context, type, targetElement) {
    if (str === "me" || str === "my" || str === "I") {
      return context.me;
    }
    if (str === "it" || str === "its" || str === "result") {
      return context.result;
    }
    if (str === "you" || str === "your" || str === "yourself") {
      return context.you;
    } else {
      if (type === "global") {
        if (reactivity.isTracking) reactivity.trackGlobalSymbol(str);
        return __privateGet(this, _globalScope)[str];
      } else if (type === "element") {
        if (reactivity.isTracking) reactivity.trackElementSymbol(str, context.meta.owner);
        var elementScope = __privateMethod(this, _Runtime_instances, getElementScope_fn).call(this, context);
        return elementScope[str];
      } else if (type === "inherited") {
        var inherited = __privateMethod(this, _Runtime_instances, resolveInherited_fn).call(this, str, context, targetElement);
        if (reactivity.isTracking && inherited.element) {
          reactivity.trackElementSymbol(str, inherited.element);
        }
        return inherited.value;
      } else if (type === "local") {
        return context.locals[str];
      } else {
        if (context.meta && context.meta.context) {
          var fromMetaContext = context.meta.context[str];
          if (typeof fromMetaContext !== "undefined") {
            return fromMetaContext;
          }
          if (context.meta.context.detail) {
            fromMetaContext = context.meta.context.detail[str];
            if (typeof fromMetaContext !== "undefined") {
              return fromMetaContext;
            }
          }
        }
        if (__privateMethod(this, _Runtime_instances, isHyperscriptContext_fn).call(this, context) && !__privateMethod(this, _Runtime_instances, isReservedWord_fn).call(this, str)) {
          var fromContext = context.locals[str];
        } else {
          var fromContext = context[str];
        }
        if (typeof fromContext !== "undefined") {
          return fromContext;
        } else {
          var elementScope = __privateMethod(this, _Runtime_instances, getElementScope_fn).call(this, context);
          fromContext = elementScope[str];
          if (typeof fromContext !== "undefined") {
            if (reactivity.isTracking) reactivity.trackElementSymbol(str, context.meta.owner);
            return fromContext;
          } else {
            if (reactivity.isTracking) reactivity.trackGlobalSymbol(str);
            return __privateGet(this, _globalScope)[str];
          }
        }
      }
    }
  }
  setSymbol(str, context, type, value, targetElement) {
    if (type === "global") {
      __privateGet(this, _globalScope)[str] = value;
      reactivity.notifyGlobalSymbol(str);
    } else if (type === "element") {
      var elementScope = __privateMethod(this, _Runtime_instances, getElementScope_fn).call(this, context);
      elementScope[str] = value;
      reactivity.notifyElementSymbol(str, context.meta.owner);
    } else if (type === "inherited") {
      var inherited = __privateMethod(this, _Runtime_instances, resolveInherited_fn).call(this, str, context, targetElement);
      if (inherited.element) {
        this.getInternalData(inherited.element).elementScope[str] = value;
        reactivity.notifyElementSymbol(str, inherited.element);
      } else {
        var owner = targetElement || context.meta && context.meta.owner;
        if (owner) {
          var internalData = this.getInternalData(owner);
          if (!internalData.elementScope) internalData.elementScope = {};
          internalData.elementScope[str] = value;
          reactivity.notifyElementSymbol(str, owner);
        }
      }
    } else if (type === "local") {
      context.locals[str] = value;
    } else {
      if (__privateMethod(this, _Runtime_instances, isHyperscriptContext_fn).call(this, context) && !__privateMethod(this, _Runtime_instances, isReservedWord_fn).call(this, str) && typeof context.locals[str] !== "undefined") {
        context.locals[str] = value;
      } else {
        var elementScope = __privateMethod(this, _Runtime_instances, getElementScope_fn).call(this, context);
        var fromContext = elementScope[str];
        if (typeof fromContext !== "undefined") {
          elementScope[str] = value;
          reactivity.notifyElementSymbol(str, context.meta.owner);
        } else {
          if (__privateMethod(this, _Runtime_instances, isHyperscriptContext_fn).call(this, context) && !__privateMethod(this, _Runtime_instances, isReservedWord_fn).call(this, str)) {
            context.locals[str] = value;
          } else {
            context[str] = value;
          }
        }
      }
    }
  }
  getInternalData(elt) {
    if (!elt._hyperscript) {
      elt._hyperscript = {};
    }
    return elt._hyperscript;
  }
  resolveProperty(root, property) {
    if (reactivity.isTracking) reactivity.trackProperty(root, property);
    return __privateMethod(this, _Runtime_instances, flatGet_fn).call(this, root, property, (root2, property2) => root2[property2]);
  }
  /**
   * Set a property on an object and notify the reactivity system.
   * @param {Object} obj - DOM element or plain JS object
   * @param {string} property
   * @param {any} value
   */
  setProperty(obj, property, value) {
    obj[property] = value;
    reactivity.notifyProperty(obj);
  }
  resolveAttribute(root, property) {
    if (reactivity.isTracking) reactivity.trackAttribute(root, property);
    return __privateMethod(this, _Runtime_instances, flatGet_fn).call(this, root, property, (root2, property2) => root2.getAttribute && root2.getAttribute(property2));
  }
  resolveStyle(root, property) {
    return __privateMethod(this, _Runtime_instances, flatGet_fn).call(this, root, property, (root2, property2) => root2.style && root2.style[property2]);
  }
  resolveComputedStyle(root, property) {
    return __privateMethod(this, _Runtime_instances, flatGet_fn).call(this, root, property, (root2, property2) => getComputedStyle(root2).getPropertyValue(property2));
  }
  assignToNamespace(elt, nameSpace, name, value) {
    let root;
    if (elt == null || typeof document !== "undefined" && elt === document.body) {
      root = __privateGet(this, _globalScope);
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
  shouldAutoIterate(value) {
    return value != null && value[SHOULD_AUTO_ITERATE_SYM] || __privateMethod(this, _Runtime_instances, isArrayLike_fn).call(this, value);
  }
  forEach(value, func) {
    if (value == null) {
    } else if (__privateMethod(this, _Runtime_instances, isIterable_fn).call(this, value)) {
      for (const nth of value) {
        func(nth);
      }
    } else if (__privateMethod(this, _Runtime_instances, isArrayLike_fn).call(this, value)) {
      for (var i = 0; i < value.length; i++) {
        func(value[i]);
      }
    } else {
      func(value);
    }
  }
  implicitLoop(value, func) {
    if (this.shouldAutoIterate(value)) {
      for (const x of value) func(x);
    } else {
      func(value);
    }
  }
  /**
   * Iterate over targets with a when condition, applying forward or reverse per element.
   * Supports async conditions transparently -- returns a Promise if any condition is async.
   */
  implicitLoopWhen(targets, whenExpr, context, forwardFn, reverseFn) {
    var elements = [];
    this.implicitLoop(targets, function(elt) {
      elements.push(elt);
    });
    var conditions = elements.map(function(elt) {
      context.result = elt;
      return whenExpr.evaluate(context);
    });
    var hasPromise = conditions.some(function(c) {
      return c && typeof c.then === "function";
    });
    if (hasPromise) {
      return Promise.all(conditions).then(function(results) {
        context.result = _applyWhenResults(elements, results, forwardFn, reverseFn);
      });
    } else {
      context.result = _applyWhenResults(elements, conditions, forwardFn, reverseFn);
    }
  }
  // =================================================================
  // Type system
  // =================================================================
  convertValue(value, type) {
    var dynamicResolvers = conversions.dynamicResolvers;
    for (var i = 0; i < dynamicResolvers.length; i++) {
      var dynamicResolver = dynamicResolvers[i];
      var converted = dynamicResolver(type, value, this);
      if (converted !== void 0) {
        return converted;
      }
    }
    if (value == null) {
      return null;
    }
    var converter = conversions[type];
    if (converter) {
      return converter(value, this);
    }
    throw new Error("Unknown conversion : " + type);
  }
  evaluateNoPromise(elt, ctx) {
    let result = elt.evaluate(ctx);
    if (result && typeof result.then === "function") {
      throw new Error(elt.sourceFor() + " returned a Promise in a context that they are not allowed.");
    }
    return result;
  }
  typeCheck(value, typeString, nullOk) {
    if (value == null && nullOk) {
      return true;
    }
    var typeName = Object.prototype.toString.call(value).slice(8, -1);
    if (typeName === typeString) return true;
    var ctor = typeof globalThis !== "undefined" && globalThis[typeString];
    return typeof ctor === "function" && value instanceof ctor;
  }
  nullCheck(value, elt) {
    if (value == null) {
      throw new Error("'" + elt.sourceFor() + "' is null");
    }
  }
  isEmpty(value) {
    return value == void 0 || value.length === 0;
  }
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
  // =================================================================
  // DOM operations
  // =================================================================
  matchesSelector(elt, selector) {
    return elt.matches && elt.matches(selector);
  }
  makeEvent(eventName, detail) {
    var evt = new Event(eventName, { bubbles: true, cancelable: true, composed: true });
    evt["detail"] = detail;
    return evt;
  }
  triggerEvent(elt, eventName, detail, sender) {
    detail = detail || {};
    detail["sender"] = sender;
    var event = this.makeEvent(eventName, detail);
    if (config.logAll) {
      console.log(eventName, detail, elt);
    }
    var eventResult = elt.dispatchEvent(event);
    return eventResult;
  }
  getRootNode(node) {
    if (node && node instanceof Node) {
      var rv = node.getRootNode();
      if (rv instanceof Document || rv instanceof ShadowRoot) return rv;
    }
    return document;
  }
  escapeSelector(str) {
    return str.replace(/[:&()\[\]\/]/g, function(str2) {
      return "\\" + str2;
    });
  }
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
  cleanup(elt) {
    if (!elt._hyperscript) return;
    this.triggerEvent(elt, "hyperscript:before:cleanup");
    var data = elt._hyperscript;
    if (data.listeners) {
      for (var info of data.listeners) {
        info.target.removeEventListener(info.event, info.handler);
      }
    }
    if (data.observers) {
      for (var observer of data.observers) {
        observer.disconnect();
      }
    }
    if (data.eventState) {
      for (var state of data.eventState.values()) {
        if (state.debounced) clearTimeout(state.debounced);
      }
    }
    reactivity.stopElementEffects(elt);
    if (elt.querySelectorAll) {
      for (var child of elt.querySelectorAll("[data-hyperscript-powered]")) {
        this.cleanup(child);
      }
    }
    this.triggerEvent(elt, "hyperscript:after:cleanup");
    elt.removeAttribute("data-hyperscript-powered");
    delete elt._hyperscript;
  }
  processNode(elt) {
    var selector = __privateMethod(this, _Runtime_instances, getScriptSelector_fn).call(this);
    if (this.matchesSelector(elt, selector)) {
      __privateMethod(this, _Runtime_instances, initElement_fn).call(this, elt, elt);
    }
    if (elt instanceof HTMLScriptElement && elt.type === "text/hyperscript") {
      __privateMethod(this, _Runtime_instances, initElement_fn).call(this, elt, document.body);
    }
    if (elt.querySelectorAll) {
      this.forEach(elt.querySelectorAll(selector + ", [type='text/hyperscript']"), (elt2) => {
        __privateMethod(this, _Runtime_instances, initElement_fn).call(this, elt2, elt2 instanceof HTMLScriptElement && elt2.type === "text/hyperscript" ? document.body : elt2);
      });
    }
  }
  // =================================================================
  // Debug and tracing
  // =================================================================
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
      console.log("///_ BEEP! The expression (" + expression.sourceFor().replace("beep! ", "") + ") evaluates to:", logValue, "of type " + typeName);
    }
  }
};
_kernel2 = new WeakMap();
_tokenizer = new WeakMap();
_globalScope = new WeakMap();
_scriptAttrs = new WeakMap();
_Runtime_instances = new WeakSet();
// =================================================================
// Symbol and property resolution
// =================================================================
isReservedWord_fn = function(str) {
  return ["meta", "it", "result", "locals", "event", "target", "detail", "sender", "body"].includes(str);
};
isHyperscriptContext_fn = function(context) {
  return context instanceof Context;
};
resolveInherited_fn = function(str, context, startElement) {
  var elt = startElement || context.meta && context.meta.owner;
  while (elt) {
    var internalData = elt._hyperscript;
    if (internalData && internalData.elementScope && str in internalData.elementScope) {
      return { value: internalData.elementScope[str], element: elt };
    }
    elt = elt.parentElement;
  }
  return { value: void 0, element: null };
};
getElementScope_fn = function(context) {
  var elt = context.meta && context.meta.owner;
  if (elt) {
    var internalData = this.getInternalData(elt);
    var scopeName = "elementScope";
    if (context.meta.feature && context.meta.feature.behavior) {
      scopeName = context.meta.feature.behavior + "Scope";
    }
    var elementScope = internalData[scopeName];
    if (!elementScope) {
      elementScope = {};
      internalData[scopeName] = elementScope;
    }
    return elementScope;
  } else {
    return {};
  }
};
flatGet_fn = function(root, property, getter) {
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
};
// =================================================================
// Collection and iteration utilities
// =================================================================
isArrayLike_fn = function(value) {
  return Array.isArray(value) || typeof NodeList !== "undefined" && (value instanceof NodeList || value instanceof HTMLCollection || value instanceof FileList);
};
isIterable_fn = function(value) {
  return typeof value === "object" && Symbol.iterator in value && typeof value[Symbol.iterator] === "function";
};
// =================================================================
// DOM initialization
// =================================================================
getScriptAttributes_fn = function() {
  if (__privateGet(this, _scriptAttrs) == null) {
    __privateSet(this, _scriptAttrs, config.attributes.replace(/ /g, "").split(","));
  }
  return __privateGet(this, _scriptAttrs);
};
getScript_fn = function(elt) {
  for (var i = 0; i < __privateMethod(this, _Runtime_instances, getScriptAttributes_fn).call(this).length; i++) {
    var scriptAttribute = __privateMethod(this, _Runtime_instances, getScriptAttributes_fn).call(this)[i];
    if (elt.hasAttribute && elt.hasAttribute(scriptAttribute)) {
      return elt.getAttribute(scriptAttribute);
    }
  }
  if (elt instanceof HTMLScriptElement && elt.type === "text/hyperscript") {
    return elt.innerText;
  }
  return null;
};
getScriptSelector_fn = function() {
  return __privateMethod(this, _Runtime_instances, getScriptAttributes_fn).call(this).map(function(attribute) {
    return "[" + attribute + "]";
  }).join(", ");
};
hashScript_fn = function(str) {
  var hash = 5381;
  for (var i = 0; i < str.length; i++) {
    hash = (hash << 5) + hash + str.charCodeAt(i);
  }
  return hash;
};
initElement_fn = function(elt, target) {
  var _a;
  if (elt.closest && elt.closest(config.disableSelector)) {
    return;
  }
  var internalData = this.getInternalData(elt);
  var src = __privateMethod(this, _Runtime_instances, getScript_fn).call(this, elt);
  if (!src) return;
  var hash = __privateMethod(this, _Runtime_instances, hashScript_fn).call(this, src);
  if (internalData.initialized) {
    if (internalData.scriptHash === hash) return;
    this.cleanup(elt);
    internalData = this.getInternalData(elt);
  }
  if (!this.triggerEvent(elt, "hyperscript:before:init")) return;
  internalData.initialized = true;
  internalData.scriptHash = hash;
  try {
    var tokens = __privateGet(this, _tokenizer).tokenize(src);
    var hyperScript = __privateGet(this, _kernel2).parseHyperScript(tokens);
    if (!hyperScript) return;
    if ((_a = hyperScript.errors) == null ? void 0 : _a.length) {
      this.triggerEvent(elt, "hyperscript:parse-error", {
        errors: hyperScript.errors
      });
      console.error(
        "hyperscript: " + hyperScript.errors.length + " parse error(s) on:",
        elt,
        "\n\n" + formatErrors(hyperScript.errors)
      );
      return;
    }
    hyperScript.apply(target || elt, elt, null, this);
    elt.setAttribute("data-hyperscript-powered", "true");
    this.triggerEvent(elt, "hyperscript:after:init");
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
};
__publicField(_Runtime, "HALT", {});
var Runtime = _Runtime;

// src/parsetree/expressions/expressions.js
var expressions_exports = {};
__export(expressions_exports, {
  ArrayIndex: () => ArrayIndex,
  AsExpression: () => AsExpression,
  AttributeRefAccess: () => AttributeRefAccess,
  BeepExpression: () => BeepExpression,
  BlockLiteral: () => BlockLiteral,
  CollectionOp: () => CollectionOp,
  ComparisonOperator: () => ComparisonOperator,
  DotOrColonPath: () => DotOrColonPath,
  FunctionCall: () => FunctionCall,
  InExpression: () => InExpression,
  LogicalNot: () => LogicalNot,
  LogicalOperator: () => LogicalOperator,
  MathOperator: () => MathOperator,
  NegativeNumber: () => NegativeNumber,
  OfExpression: () => OfExpression,
  ParenthesizedExpression: () => ParenthesizedExpression,
  PossessiveExpression: () => PossessiveExpression,
  PropertyAccess: () => PropertyAccess,
  SymbolRef: () => SymbolRef
});
var _ParenthesizedExpression = class _ParenthesizedExpression extends Expression {
  constructor(expr) {
    super();
    this.expr = expr;
    this.args = { value: expr };
  }
  static parse(parser) {
    if (parser.matchOpToken("(")) {
      var follows = parser.clearFollows();
      try {
        var expr = parser.requireElement("expression");
      } finally {
        parser.restoreFollows(follows);
      }
      parser.requireOpToken(")");
      return new _ParenthesizedExpression(expr);
    }
  }
  resolve(context, { value }) {
    return value;
  }
};
__publicField(_ParenthesizedExpression, "grammarName", "parenthesized");
__publicField(_ParenthesizedExpression, "expressionType", "leaf");
var ParenthesizedExpression = _ParenthesizedExpression;
var _BlockLiteral = class _BlockLiteral extends Expression {
  constructor(params, expr) {
    super();
    this.params = params;
    this.expr = expr;
  }
  static parse(parser) {
    if (!parser.matchOpToken("\\")) return;
    var params = [];
    var arg1 = parser.matchTokenType("IDENTIFIER");
    if (arg1) {
      params.push(arg1);
      while (parser.matchOpToken(",")) {
        params.push(parser.requireTokenType("IDENTIFIER"));
      }
    }
    parser.requireOpToken("-");
    parser.requireOpToken(">");
    var expr = parser.requireElement("expression");
    return new _BlockLiteral(params, expr);
  }
  resolve(ctx) {
    var params = this.params;
    var expr = this.expr;
    return function() {
      for (var i = 0; i < params.length; i++) {
        ctx.locals[params[i].value] = arguments[i];
      }
      return expr.evaluate(ctx);
    };
  }
};
__publicField(_BlockLiteral, "grammarName", "blockLiteral");
__publicField(_BlockLiteral, "expressionType", "leaf");
var BlockLiteral = _BlockLiteral;
var _NegativeNumber = class _NegativeNumber extends Expression {
  constructor(root) {
    super();
    this.root = root;
    this.args = { value: root };
  }
  static parse(parser) {
    if (parser.matchOpToken("-")) {
      var root = parser.requireElement("negativeNumber");
      return new _NegativeNumber(root);
    } else {
      return parser.requireElement("primaryExpression");
    }
  }
  resolve(context, { value }) {
    return -1 * value;
  }
};
__publicField(_NegativeNumber, "grammarName", "negativeNumber");
var NegativeNumber = _NegativeNumber;
var _LogicalNot = class _LogicalNot extends Expression {
  constructor(root) {
    super();
    this.root = root;
    this.args = { value: root };
  }
  static parse(parser) {
    if (!parser.matchToken("not")) return;
    var root = parser.requireElement("unaryExpression");
    return new _LogicalNot(root);
  }
  resolve(context, { value: val }) {
    return !val;
  }
};
__publicField(_LogicalNot, "grammarName", "logicalNot");
__publicField(_LogicalNot, "expressionType", "unary");
var LogicalNot = _LogicalNot;
var _SymbolRef = class _SymbolRef extends Expression {
  constructor(token, scope, name, targetExpr) {
    super();
    this.token = token;
    this.scope = scope;
    this.name = name;
    this.targetExpr = targetExpr || null;
  }
  static parse(parser) {
    var scope = "default";
    if (parser.matchToken("global")) {
      scope = "global";
    } else if (parser.matchToken("element")) {
      scope = "element";
      if (parser.matchOpToken("'")) {
        parser.requireToken("s");
      }
    } else if (parser.matchToken("dom")) {
      scope = "inherited";
    } else if (parser.matchToken("local")) {
      scope = "local";
    }
    let eltPrefix = parser.matchOpToken(":");
    let caretPrefix = !eltPrefix && parser.matchOpToken("^");
    let identifier = parser.matchTokenType("IDENTIFIER");
    if (identifier && identifier.value) {
      var name = identifier.value;
      if (eltPrefix) {
        name = ":" + name;
      } else if (caretPrefix) {
        name = "^" + name;
      }
      if (scope === "default") {
        if (name.startsWith("$")) {
          scope = "global";
        } else if (name.startsWith(":")) {
          scope = "element";
        } else if (name.startsWith("^")) {
          scope = "inherited";
        }
      }
      var targetExpr = null;
      if (scope === "inherited" && parser.matchToken("on")) {
        parser.pushFollow("to");
        parser.pushFollow("into");
        parser.pushFollow("before");
        parser.pushFollow("after");
        parser.pushFollow("then");
        try {
          targetExpr = parser.requireElement("expression");
        } finally {
          parser.popFollow();
          parser.popFollow();
          parser.popFollow();
          parser.popFollow();
          parser.popFollow();
        }
      }
      return new _SymbolRef(identifier, scope, name, targetExpr);
    }
  }
  resolve(context) {
    return context.meta.runtime.resolveSymbol(
      this.name,
      context,
      this.scope,
      this.targetExpr ? this.targetExpr.evaluate(context) : null
    );
  }
  get lhs() {
    return {};
  }
  set(ctx, lhs, value) {
    ctx.meta.runtime.setSymbol(
      this.name,
      ctx,
      this.scope,
      value,
      this.targetExpr ? this.targetExpr.evaluate(ctx) : null
    );
  }
};
__publicField(_SymbolRef, "grammarName", "symbol");
__publicField(_SymbolRef, "assignable", true);
var SymbolRef = _SymbolRef;
var _BeepExpression = class _BeepExpression extends Expression {
  constructor(expression) {
    super();
    this.expression = expression;
    this.expression["booped"] = true;
    this.args = { value: expression };
  }
  static parse(parser) {
    if (!parser.matchToken("beep!")) return;
    var expression = parser.parseElement("unaryExpression");
    if (expression) {
      return new _BeepExpression(expression);
    }
  }
  resolve(ctx, { value }) {
    ctx.meta.runtime.beepValueToConsole(ctx.me, this.expression, value);
    return value;
  }
};
__publicField(_BeepExpression, "grammarName", "beepExpression");
__publicField(_BeepExpression, "expressionType", "unary");
var BeepExpression = _BeepExpression;
var _PropertyAccess = class _PropertyAccess extends Expression {
  constructor(root, prop) {
    super();
    this.root = root;
    this.prop = prop;
    this.args = { root };
  }
  static parse(parser, root) {
    if (!parser.matchOpToken(".")) return;
    var prop = parser.requireTokenType("IDENTIFIER");
    var propertyAccess = new _PropertyAccess(root, prop);
    return parser.parseElement("indirectExpression", propertyAccess);
  }
  resolve(context, { root: rootVal }) {
    var value = context.meta.runtime.resolveProperty(rootVal, this.prop.value);
    return value;
  }
  get lhs() {
    return { root: this.root };
  }
  set(ctx, lhs, value) {
    ctx.meta.runtime.nullCheck(lhs.root, this.root);
    var runtime2 = ctx.meta.runtime;
    runtime2.implicitLoop(lhs.root, (elt) => {
      runtime2.setProperty(elt, this.prop.value, value);
    });
  }
};
__publicField(_PropertyAccess, "grammarName", "propertyAccess");
__publicField(_PropertyAccess, "expressionType", "indirect");
__publicField(_PropertyAccess, "assignable", true);
var PropertyAccess = _PropertyAccess;
var _OfExpression = class _OfExpression extends Expression {
  constructor(prop, newRoot, attribute, expression, args, urRoot) {
    super();
    this.prop = prop;
    this.root = newRoot;
    this.attribute = attribute;
    this.expression = expression;
    this.args = args;
    this._urRoot = urRoot;
  }
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
      { root: newRoot },
      urRoot
    );
    if (urRoot.type === "attributeRef") {
      propertyAccess.attribute = urRoot;
    }
    if (childOfUrRoot) {
      childOfUrRoot.root = propertyAccess;
      childOfUrRoot.args = { root: propertyAccess };
    } else {
      root = propertyAccess;
    }
    return parser.parseElement("indirectExpression", root);
  }
  resolve(context, { root: rootVal }) {
    var urRoot = this._urRoot;
    var prop = urRoot.name;
    var attribute = urRoot.type === "attributeRef";
    var style = urRoot.type === "styleRef" || urRoot.type === "computedStyleRef";
    if (attribute) {
      return context.meta.runtime.resolveAttribute(rootVal, prop);
    } else if (style) {
      if (urRoot.type === "computedStyleRef") {
        return context.meta.runtime.resolveComputedStyle(rootVal, prop);
      } else {
        return context.meta.runtime.resolveStyle(rootVal, prop);
      }
    } else {
      return context.meta.runtime.resolveProperty(rootVal, prop);
    }
  }
  get lhs() {
    return { root: this.root };
  }
  set(ctx, lhs, value) {
    ctx.meta.runtime.nullCheck(lhs.root, this.root);
    var urRoot = this._urRoot;
    var prop = urRoot.name;
    if (urRoot.type === "attributeRef") {
      ctx.meta.runtime.implicitLoop(lhs.root, (elt) => {
        value == null ? elt.removeAttribute(prop) : elt.setAttribute(prop, value);
      });
    } else if (urRoot.type === "styleRef") {
      ctx.meta.runtime.implicitLoop(lhs.root, (elt) => {
        elt.style[prop] = value;
      });
    } else {
      var runtime2 = ctx.meta.runtime;
      runtime2.implicitLoop(lhs.root, (elt) => {
        runtime2.setProperty(elt, prop, value);
      });
    }
  }
};
__publicField(_OfExpression, "grammarName", "ofExpression");
__publicField(_OfExpression, "expressionType", "indirect");
__publicField(_OfExpression, "assignable", true);
var OfExpression = _OfExpression;
var _PossessiveExpression = class _PossessiveExpression extends Expression {
  constructor(root, attribute, prop) {
    super();
    this.root = root;
    this.attribute = attribute;
    this.prop = prop;
    this.args = { root };
  }
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
      return parser.parseElement("indirectExpression", propertyAccess);
    }
  }
  resolve(context, { root: rootVal }) {
    var value;
    if (this.attribute) {
      if (this.attribute.type === "computedStyleRef") {
        value = context.meta.runtime.resolveComputedStyle(rootVal, this.attribute["name"]);
      } else if (this.attribute.type === "styleRef") {
        value = context.meta.runtime.resolveStyle(rootVal, this.attribute["name"]);
      } else {
        value = context.meta.runtime.resolveAttribute(rootVal, this.attribute.name);
      }
    } else {
      value = context.meta.runtime.resolveProperty(rootVal, this.prop.value);
    }
    return value;
  }
  get lhs() {
    return { root: this.root };
  }
  set(ctx, lhs, value) {
    ctx.meta.runtime.nullCheck(lhs.root, this.root);
    if (this.attribute) {
      var name = this.attribute.name;
      if (this.attribute.type === "styleRef") {
        ctx.meta.runtime.implicitLoop(lhs.root, (elt) => {
          elt.style[name] = value;
        });
      } else {
        ctx.meta.runtime.implicitLoop(lhs.root, (elt) => {
          value == null ? elt.removeAttribute(name) : elt.setAttribute(name, value);
        });
      }
    } else {
      var runtime2 = ctx.meta.runtime;
      var prop = this.prop.value;
      runtime2.implicitLoop(lhs.root, (elt) => {
        runtime2.setProperty(elt, prop, value);
      });
    }
  }
};
__publicField(_PossessiveExpression, "grammarName", "possessive");
__publicField(_PossessiveExpression, "expressionType", "indirect");
__publicField(_PossessiveExpression, "assignable", true);
var PossessiveExpression = _PossessiveExpression;
var _InExpression = class _InExpression extends Expression {
  constructor(root, target) {
    super();
    this.root = root;
    this.target = target;
    this.args = { root, target };
  }
  static parse(parser, root) {
    if (!parser.matchToken("in")) return;
    var target = parser.requireElement("unaryExpression");
    var inExpression = new _InExpression(root, target);
    return parser.parseElement("indirectExpression", inExpression);
  }
  resolve(context, { root: rootVal, target }) {
    if (rootVal == null) return [];
    var returnArr = [];
    if (rootVal.css) {
      context.meta.runtime.implicitLoop(target, function(targetElt) {
        var results = targetElt.querySelectorAll(rootVal.css);
        for (var i = 0; i < results.length; i++) {
          returnArr.push(results[i]);
        }
      });
    } else if (rootVal instanceof Element) {
      var within = false;
      context.meta.runtime.implicitLoop(target, function(targetElt) {
        if (targetElt.contains(rootVal)) {
          within = true;
        }
      });
      if (within) {
        return rootVal;
      }
    } else {
      context.meta.runtime.implicitLoop(rootVal, function(rootElt) {
        context.meta.runtime.implicitLoop(target, function(targetElt) {
          if (rootElt === targetElt) {
            returnArr.push(rootElt);
          }
        });
      });
    }
    return returnArr;
  }
};
__publicField(_InExpression, "grammarName", "inExpression");
__publicField(_InExpression, "expressionType", "indirect");
var InExpression = _InExpression;
var _AsExpression = class _AsExpression extends Expression {
  constructor(root, conversion) {
    super();
    this.root = root;
    this.conversion = conversion;
    this.args = { root };
  }
  static parse(parser, root) {
    if (!parser.matchToken("as")) return;
    parser.matchToken("a") || parser.matchToken("an");
    var conversion = parser.requireElement("dotOrColonPath").evalStatically();
    var asExpr = new _AsExpression(root, conversion);
    while (parser.matchOpToken("|")) {
      conversion = parser.requireElement("dotOrColonPath").evalStatically();
      asExpr = new _AsExpression(asExpr, conversion);
    }
    return parser.parseElement("indirectExpression", asExpr);
  }
  resolve(context, { root: rootVal }) {
    return context.meta.runtime.convertValue(rootVal, this.conversion);
  }
};
__publicField(_AsExpression, "grammarName", "asExpression");
__publicField(_AsExpression, "expressionType", "indirect");
var AsExpression = _AsExpression;
var _FunctionCall = class _FunctionCall extends Expression {
  constructor(root, argExpressions, args, isMethodCall) {
    super();
    this.root = root;
    this.argExpressions = argExpressions;
    this.args = args;
    this._isMethodCall = isMethodCall;
    this._parseRoot = root;
  }
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
      functionCall = new _FunctionCall(root, args, { target: root.root, argVals: args }, true);
    } else {
      functionCall = new _FunctionCall(root, args, { target: root, argVals: args }, false);
    }
    return parser.parseElement("indirectExpression", functionCall);
  }
  resolve(context, { target, argVals }) {
    if (this._isMethodCall) {
      context.meta.runtime.nullCheck(target, this._parseRoot.root);
      var func = target[this._parseRoot.prop.value];
      context.meta.runtime.nullCheck(func, this._parseRoot);
      if (func.hyperfunc) {
        argVals.push(context);
      }
      return func.apply(target, argVals);
    } else {
      context.meta.runtime.nullCheck(target, this._parseRoot);
      if (target.hyperfunc) {
        argVals.push(context);
      }
      return target(...argVals);
    }
  }
};
__publicField(_FunctionCall, "grammarName", "functionCall");
__publicField(_FunctionCall, "expressionType", "indirect");
var FunctionCall = _FunctionCall;
var _AttributeRefAccess = class _AttributeRefAccess extends Expression {
  constructor(root, attribute) {
    super();
    this.root = root;
    this.attribute = attribute;
    this.args = { root };
  }
  static parse(parser, root) {
    var attribute = parser.parseElement("attributeRef");
    if (!attribute) return;
    return new _AttributeRefAccess(root, attribute);
  }
  resolve(_ctx, { root: rootVal }) {
    var value = _ctx.meta.runtime.resolveAttribute(rootVal, this.attribute.name);
    return value;
  }
  get lhs() {
    return { root: this.root };
  }
  set(ctx, lhs, value) {
    ctx.meta.runtime.nullCheck(lhs.root, this.root);
    ctx.meta.runtime.implicitLoop(lhs.root, (elt) => {
      value == null ? elt.removeAttribute(this.attribute.name) : elt.setAttribute(this.attribute.name, value);
    });
  }
};
__publicField(_AttributeRefAccess, "grammarName", "attributeRefAccess");
__publicField(_AttributeRefAccess, "expressionType", "indirect");
__publicField(_AttributeRefAccess, "assignable", true);
var AttributeRefAccess = _AttributeRefAccess;
var _ArrayIndex = class _ArrayIndex extends Expression {
  constructor(root, firstIndex, secondIndex, andBefore, andAfter) {
    super();
    this.root = root;
    this.prop = firstIndex;
    this.firstIndex = firstIndex;
    this.secondIndex = secondIndex;
    this.andBefore = andBefore;
    this.andAfter = andAfter;
    this.args = { root, firstIndex, secondIndex };
  }
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
    return parser.parseElement("indirectExpression", arrayIndex);
  }
  resolve(_ctx, { root, firstIndex, secondIndex }) {
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
  get lhs() {
    return { root: this.root, index: this.firstIndex };
  }
  set(ctx, lhs, value) {
    ctx.meta.runtime.nullCheck(lhs.root, this.root);
    lhs.root[lhs.index] = value;
  }
};
__publicField(_ArrayIndex, "grammarName", "arrayIndex");
__publicField(_ArrayIndex, "expressionType", "indirect");
__publicField(_ArrayIndex, "assignable", true);
var ArrayIndex = _ArrayIndex;
var _MathOperator = class _MathOperator extends Expression {
  constructor(lhs, operator, rhs) {
    super();
    this.lhs = lhs;
    this.rhs = rhs;
    this.operator = operator;
    this.args = { lhs, rhs };
  }
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
  resolve(context, { lhs: lhsVal, rhs: rhsVal }) {
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
};
__publicField(_MathOperator, "grammarName", "mathOperator");
var MathOperator = _MathOperator;
var _ComparisonOperator = class _ComparisonOperator extends Expression {
  constructor(lhs, operator, rhs, typeName, nullOk, ignoringCase) {
    super();
    this.operator = operator;
    this.typeName = typeName;
    this.nullOk = nullOk;
    this.ignoringCase = ignoringCase;
    this.lhs = lhs;
    this.rhs = rhs;
    this.args = { lhs, rhs };
  }
  sloppyContains(src, container, value) {
    if (container["contains"]) {
      return container.contains(value);
    } else if (container["includes"]) {
      return container.includes(value);
    } else {
      throw new Error("The value of " + src.sourceFor() + " does not have a contains or includes method on it");
    }
  }
  sloppyMatches(src, target, toMatch) {
    if (target["match"]) {
      return !!target.match(toMatch);
    } else if (target["matches"]) {
      return target.matches(toMatch);
    } else {
      throw new Error("The value of " + src.sourceFor() + " does not have a match or matches method on it");
    }
  }
  static parse(parser) {
    var expr = parser.parseElement("mathOperator");
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
        } else if (parser.matchToken("exist")) {
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
        rhs = parser.requireElement("mathOperator");
        if (operator === "match" || operator === "not match") {
          rhs = rhs.css ? rhs.css : rhs;
        }
      }
      var ignoringCase = false;
      if (parser.matchToken("ignoring")) {
        parser.requireToken("case");
        ignoringCase = true;
      }
      var lhs = expr;
      expr = new _ComparisonOperator(lhs, operator, rhs, typeName, nullOk, ignoringCase);
    }
    return expr;
  }
  resolve(context, { lhs: lhsVal, rhs: rhsVal }) {
    const operator = this.operator;
    const lhs = this.lhs;
    const rhs = this.rhs;
    const typeName = this.typeName;
    const nullOk = this.nullOk;
    if (this.ignoringCase) {
      if (typeof lhsVal === "string") lhsVal = lhsVal.toLowerCase();
      if (typeof rhsVal === "string") rhsVal = rhsVal.toLowerCase();
    }
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
      return lhsVal != null && this.sloppyMatches(lhs, lhsVal, rhsVal);
    }
    if (operator === "not match") {
      return lhsVal == null || !this.sloppyMatches(lhs, lhsVal, rhsVal);
    }
    if (operator === "in") {
      return rhsVal != null && this.sloppyContains(rhs, rhsVal, lhsVal);
    }
    if (operator === "not in") {
      return rhsVal == null || !this.sloppyContains(rhs, rhsVal, lhsVal);
    }
    if (operator === "contain") {
      return lhsVal != null && this.sloppyContains(lhs, lhsVal, rhsVal);
    }
    if (operator === "not contain") {
      return lhsVal == null || !this.sloppyContains(lhs, lhsVal, rhsVal);
    }
    if (operator === "include") {
      return lhsVal != null && this.sloppyContains(lhs, lhsVal, rhsVal);
    }
    if (operator === "not include") {
      return lhsVal == null || !this.sloppyContains(lhs, lhsVal, rhsVal);
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
      return context.meta.runtime.isEmpty(lhsVal);
    } else if (operator === "not empty") {
      return !context.meta.runtime.isEmpty(lhsVal);
    } else if (operator === "exist") {
      return context.meta.runtime.doesExist(lhsVal);
    } else if (operator === "not exist") {
      return !context.meta.runtime.doesExist(lhsVal);
    } else if (operator === "a") {
      return context.meta.runtime.typeCheck(lhsVal, typeName.value, nullOk);
    } else if (operator === "not a") {
      return !context.meta.runtime.typeCheck(lhsVal, typeName.value, nullOk);
    } else {
      throw new Error("Unknown comparison : " + operator);
    }
  }
};
__publicField(_ComparisonOperator, "grammarName", "comparisonOperator");
var ComparisonOperator = _ComparisonOperator;
var _LogicalOperator = class _LogicalOperator extends Expression {
  constructor(lhs, operator, rhs) {
    super();
    this.operator = operator;
    this.lhs = lhs;
    this.rhs = rhs;
    this.args = { lhs, rhs };
  }
  static parse(parser) {
    var expr = parser.parseElement("comparisonOperator");
    var logicalOp, initialLogicalOp = null;
    logicalOp = parser.matchToken("and") || parser.matchToken("or");
    while (logicalOp) {
      initialLogicalOp = initialLogicalOp || logicalOp;
      if (initialLogicalOp.value !== logicalOp.value) {
        parser.raiseParseError("You must parenthesize logical operations with different operators");
      }
      var rhs = parser.requireElement("comparisonOperator");
      const operator = logicalOp.value;
      expr = new _LogicalOperator(expr, operator, rhs);
      logicalOp = parser.matchToken("and") || parser.matchToken("or");
    }
    return expr;
  }
  resolve(context, { lhs: lhsVal, rhs: rhsVal }) {
    if (this.operator === "and") {
      return lhsVal && rhsVal;
    } else {
      return lhsVal || rhsVal;
    }
  }
  evaluate(context) {
    return context.meta.runtime.unifiedEval(this, context, this.operator === "or");
  }
};
__publicField(_LogicalOperator, "grammarName", "logicalOperator");
__publicField(_LogicalOperator, "expressionType", "top");
var LogicalOperator = _LogicalOperator;
var DotOrColonPathNode = class extends Expression {
  constructor(path, separator) {
    super();
    this.type = "dotOrColonPath";
    this.path = path;
    this.separator = separator;
  }
  evalStatically() {
    return this.path.join(this.separator ? this.separator : "");
  }
  resolve() {
    return this.evalStatically();
  }
};
var COLLECTION_KEYWORDS = ["where", "sorted", "mapped", "split", "joined"];
function _parseCollectionOperand(parser, keyword) {
  var follows = COLLECTION_KEYWORDS.filter((k) => k !== keyword);
  follows.forEach((f) => parser.pushFollow(f));
  try {
    return parser.requireElement("expression");
  } finally {
    follows.forEach(() => parser.popFollow());
  }
}
var CollectionOp = class extends Expression {
  static parse(parser, root) {
    if (parser.matchToken("where")) {
      var condition = _parseCollectionOperand(parser, "where");
      root = new WhereExpression(root, condition);
    } else if (parser.matchToken("sorted")) {
      parser.requireToken("by");
      var key = _parseCollectionOperand(parser, "sorted");
      var descending = parser.matchToken("descending");
      root = new SortedByExpression(root, key, !!descending);
    } else if (parser.matchToken("mapped")) {
      parser.requireToken("to");
      var projection = _parseCollectionOperand(parser, "mapped");
      root = new MappedToExpression(root, projection);
    } else if (parser.matchToken("split")) {
      parser.requireToken("by");
      var delimiter = _parseCollectionOperand(parser, "split");
      root = new SplitByExpression(root, delimiter);
    } else if (parser.matchToken("joined")) {
      parser.requireToken("by");
      var delimiter = _parseCollectionOperand(parser, "joined");
      root = new JoinedByExpression(root, delimiter);
    } else {
      return;
    }
    return parser.parseElement("indirectExpression", root);
  }
};
__publicField(CollectionOp, "grammarName", "collectionOp");
__publicField(CollectionOp, "expressionType", "indirect");
var WhereExpression = class extends Expression {
  constructor(root, condition) {
    super();
    this.root = root;
    this.condition = condition;
    this.args = { root };
  }
  resolve(context, { root: collection }) {
    var saved = context.result;
    var result = [];
    var items = Array.from(collection);
    for (var i = 0; i < items.length; i++) {
      context.result = items[i];
      if (this.condition.evaluate(context)) {
        result.push(items[i]);
      }
    }
    context.result = saved;
    return result;
  }
};
var SortedByExpression = class extends Expression {
  constructor(root, key, descending) {
    super();
    this.root = root;
    this.key = key;
    this.descending = descending;
    this.args = { root };
  }
  resolve(context, { root: collection }) {
    var saved = context.result;
    var items = Array.from(collection);
    var keys = [];
    for (var i = 0; i < items.length; i++) {
      context.result = items[i];
      keys.push(this.key.evaluate(context));
    }
    context.result = saved;
    var indices = items.map(function(_, i2) {
      return i2;
    });
    var dir = this.descending ? -1 : 1;
    indices.sort(function(a, b) {
      var ka = keys[a], kb = keys[b];
      if (ka == kb) return 0;
      return (ka < kb ? -1 : 1) * dir;
    });
    return indices.map(function(i2) {
      return items[i2];
    });
  }
};
var MappedToExpression = class extends Expression {
  constructor(root, projection) {
    super();
    this.root = root;
    this.projection = projection;
    this.args = { root };
  }
  resolve(context, { root: collection }) {
    var saved = context.result;
    var items = Array.from(collection);
    var result = [];
    for (var i = 0; i < items.length; i++) {
      context.result = items[i];
      result.push(this.projection.evaluate(context));
    }
    context.result = saved;
    return result;
  }
};
var SplitByExpression = class extends Expression {
  constructor(root, delimiter) {
    super();
    this.args = { root, delimiter };
  }
  resolve(context, { root, delimiter }) {
    return String(root).split(delimiter);
  }
};
var JoinedByExpression = class extends Expression {
  constructor(root, delimiter) {
    super();
    this.args = { root, delimiter };
  }
  resolve(context, { root, delimiter }) {
    return Array.from(root).join(delimiter);
  }
};
var DotOrColonPath = class extends Expression {
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
__publicField(DotOrColonPath, "grammarName", "dotOrColonPath");

// src/parsetree/expressions/webliterals.js
var webliterals_exports = {};
__export(webliterals_exports, {
  AttributeRef: () => AttributeRef,
  ClassRef: () => ClassRef,
  IdRef: () => IdRef,
  QueryRef: () => QueryRef,
  StyleLiteral: () => StyleLiteral,
  StyleRef: () => StyleRef
});
var _IdRef = class _IdRef extends Expression {
  constructor(variant, css, value, innerExpression) {
    super();
    this.variant = variant;
    this.type = variant === "template" ? "idRefTemplate" : "idRef";
    this.css = css;
    this.value = value;
    this.args = variant === "template" ? { expr: innerExpression } : null;
  }
  static parse(parser) {
    var elementId = parser.matchTokenType("ID_REF");
    if (!elementId) return;
    if (!elementId.value) return;
    if (elementId.template) {
      var templateValue = elementId.value.substring(2);
      var innerTokens = Tokenizer.tokenize(templateValue);
      var innerParser = parser.createChildParser(innerTokens);
      var innerExpression = innerParser.requireElement("expression");
      return new _IdRef("template", null, null, innerExpression);
    } else {
      const value = elementId.value.substring(1);
      return new _IdRef("static", elementId.value, value, null);
    }
  }
  resolve(context, { expr } = {}) {
    if (this.variant === "template") {
      return context.meta.runtime.getRootNode(context.me).getElementById(expr);
    } else {
      return context.meta.runtime.getRootNode(context.me).getElementById(this.value);
    }
  }
};
__publicField(_IdRef, "grammarName", "idRef");
__publicField(_IdRef, "expressionType", "leaf");
var IdRef = _IdRef;
var _ClassRef = class _ClassRef extends Expression {
  constructor(variant, css, className, innerExpression) {
    super();
    this.variant = variant;
    this.type = variant === "template" ? "classRefTemplate" : "classRef";
    this.css = css;
    this.className = className;
    this.args = variant === "template" ? { expr: innerExpression } : null;
  }
  static parse(parser) {
    var classRef = parser.matchTokenType("CLASS_REF");
    if (!classRef) return;
    if (!classRef.value) return;
    if (classRef.template) {
      var templateValue = classRef.value.substring(2);
      var innerTokens = Tokenizer.tokenize(templateValue);
      var innerParser = parser.createChildParser(innerTokens);
      var innerExpression = innerParser.requireElement("expression");
      return new _ClassRef("template", null, null, innerExpression);
    } else {
      const css = classRef.value;
      const className = css.slice(1);
      return new _ClassRef("static", css, className, null);
    }
  }
  resolve(context, { expr } = {}) {
    if (this.variant === "template") {
      return new ElementCollection("." + expr, context.me, true, context.meta.runtime);
    } else {
      return new ElementCollection(this.css, context.me, true, context.meta.runtime);
    }
  }
};
__publicField(_ClassRef, "grammarName", "classRef");
__publicField(_ClassRef, "expressionType", "leaf");
var ClassRef = _ClassRef;
var _QueryRef = class _QueryRef extends Expression {
  constructor(css, args, template) {
    super();
    this.css = css;
    this.templateArgs = args;
    this.args = template ? { parts: args } : null;
    this.template = template;
  }
  static parse(parser) {
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
      innerTokens = Tokenizer.tokenize(queryValue, true);
      var innerParser = parser.createChildParser(innerTokens);
      args = innerParser.parseStringTemplate();
    }
    return new _QueryRef(queryValue, args, template);
  }
  resolve(context, { parts } = {}) {
    if (this.template) {
      return new TemplatedQueryElementCollection(this.css, context.me, parts, context.meta.runtime);
    } else {
      return new ElementCollection(this.css, context.me, false, context.meta.runtime);
    }
  }
};
__publicField(_QueryRef, "grammarName", "queryRef");
__publicField(_QueryRef, "expressionType", "leaf");
var QueryRef = _QueryRef;
var _AttributeRef = class _AttributeRef extends Expression {
  constructor(name, css, value) {
    super();
    this.name = name;
    this.css = css;
    this.value = value;
  }
  static parse(parser) {
    var attributeRef = parser.matchTokenType("ATTRIBUTE_REF");
    if (!attributeRef) return;
    if (!attributeRef.value) return;
    var outerVal = attributeRef.value;
    if (outerVal.startsWith("[")) {
      var innerValue = outerVal.substring(2, outerVal.length - 1);
    } else {
      var innerValue = outerVal.substring(1);
    }
    var css = "[" + innerValue + "]";
    var split = innerValue.split("=");
    var name = split[0];
    var value = split[1];
    if (value) {
      if (value.startsWith('"') || value.startsWith("'")) {
        value = value.substring(1, value.length - 1);
      }
    }
    return new _AttributeRef(name, css, value);
  }
  resolve(context) {
    var target = context.you || context.me;
    if (target) {
      return context.meta.runtime.resolveAttribute(target, this.name);
    }
  }
  get lhs() {
    return {};
  }
  set(ctx, lhs, value) {
    var target = ctx.you || ctx.me;
    if (target) {
      value == null ? target.removeAttribute(this.name) : target.setAttribute(this.name, value);
    }
  }
};
__publicField(_AttributeRef, "grammarName", "attributeRef");
__publicField(_AttributeRef, "expressionType", "leaf");
__publicField(_AttributeRef, "assignable", true);
var AttributeRef = _AttributeRef;
var _StyleRef = class _StyleRef extends Expression {
  constructor(variant, name) {
    super();
    this.variant = variant;
    this.type = variant === "computed" ? "computedStyleRef" : "styleRef";
    this.name = name;
  }
  static parse(parser) {
    var styleRef = parser.matchTokenType("STYLE_REF");
    if (!styleRef) return;
    if (!styleRef.value) return;
    var styleProp = styleRef.value.slice(1);
    if (styleProp.startsWith("computed-")) {
      styleProp = styleProp.slice("computed-".length);
      return new _StyleRef("computed", styleProp);
    } else {
      return new _StyleRef("style", styleProp);
    }
  }
  resolve(context) {
    var target = context.you || context.me;
    if (target) {
      if (this.variant === "computed") {
        return context.meta.runtime.resolveComputedStyle(target, this.name);
      } else {
        return context.meta.runtime.resolveStyle(target, this.name);
      }
    }
  }
  get lhs() {
    return {};
  }
  set(ctx, lhs, value) {
    var target = ctx.you || ctx.me;
    if (target) {
      target.style[this.name] = value;
    }
  }
};
__publicField(_StyleRef, "grammarName", "styleRef");
__publicField(_StyleRef, "expressionType", "leaf");
__publicField(_StyleRef, "assignable", true);
var StyleRef = _StyleRef;
var _StyleLiteral = class _StyleLiteral extends Expression {
  constructor(stringParts, exprs) {
    super();
    this.stringParts = stringParts;
    this.args = { exprs };
  }
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
    return new _StyleLiteral(stringParts, exprs);
  }
  resolve(ctx, { exprs }) {
    var rv = "";
    const stringParts = this.stringParts;
    stringParts.forEach(function(part, idx) {
      rv += part;
      if (idx in exprs) rv += exprs[idx];
    });
    return rv;
  }
};
__publicField(_StyleLiteral, "grammarName", "styleLiteral");
var StyleLiteral = _StyleLiteral;

// src/parsetree/expressions/postfix.js
var postfix_exports = {};
__export(postfix_exports, {
  StringPostfixExpression: () => StringPostfixExpression,
  TimeExpression: () => TimeExpression,
  TypeCheckExpression: () => TypeCheckExpression
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
var _StringPostfixExpression = class _StringPostfixExpression extends Expression {
  constructor(root, postfix) {
    super();
    this.postfix = postfix;
    this.args = { value: root };
  }
  static parse(parser, root) {
    let stringPostfix = parser.matchAnyToken(...STRING_POSTFIXES) || parser.matchOpToken("%");
    if (!stringPostfix) return;
    return new _StringPostfixExpression(root, stringPostfix.value);
  }
  resolve(context, { value: val }) {
    return "" + val + this.postfix;
  }
};
__publicField(_StringPostfixExpression, "grammarName", "stringPostfixExpression");
__publicField(_StringPostfixExpression, "expressionType", "postfix");
var StringPostfixExpression = _StringPostfixExpression;
var _TimeExpression = class _TimeExpression extends Expression {
  constructor(root, timeFactor) {
    super();
    this.time = root;
    this.factor = timeFactor;
    this.args = { value: root };
  }
  static parse(parser, root) {
    var timeFactor = null;
    if (parser.matchToken("s") || parser.matchToken("seconds")) {
      timeFactor = 1e3;
    } else if (parser.matchToken("ms") || parser.matchToken("milliseconds")) {
      timeFactor = 1;
    }
    if (!timeFactor) return;
    return new _TimeExpression(root, timeFactor);
  }
  evalStatically() {
    return this.time.evalStatically() * this.factor;
  }
  resolve(context, { value: val }) {
    return val * this.factor;
  }
};
__publicField(_TimeExpression, "grammarName", "timeExpression");
__publicField(_TimeExpression, "expressionType", "postfix");
var TimeExpression = _TimeExpression;
var _TypeCheckExpression = class _TypeCheckExpression extends Expression {
  constructor(root, typeName, nullOk) {
    super();
    this.typeName = typeName;
    this.nullOk = nullOk;
    this.args = { value: root };
  }
  static parse(parser, root) {
    if (!parser.matchOpToken(":")) return;
    var typeName = parser.requireTokenType("IDENTIFIER");
    if (!typeName.value) return;
    var nullOk = !parser.matchOpToken("!");
    return new _TypeCheckExpression(root, typeName, nullOk);
  }
  resolve(context, { value: val }) {
    var passed = context.meta.runtime.typeCheck(val, this.typeName.value, this.nullOk);
    if (passed) {
      return val;
    } else {
      throw new Error("Typecheck failed!  Expected: " + this.typeName.value);
    }
  }
};
__publicField(_TypeCheckExpression, "grammarName", "typeCheckExpression");
__publicField(_TypeCheckExpression, "expressionType", "postfix");
var TypeCheckExpression = _TypeCheckExpression;

// src/parsetree/expressions/positional.js
var positional_exports = {};
__export(positional_exports, {
  ClosestExpr: () => ClosestExpr,
  PositionalExpression: () => PositionalExpression,
  RelativePositionalExpression: () => RelativePositionalExpression
});
var _RelativePositionalExpression = class _RelativePositionalExpression extends Expression {
  constructor(thingElt, from, forwardSearch, inSearch, wrapping, inElt, withinElt, operator) {
    super();
    this.thingElt = thingElt;
    this.from = from;
    this.forwardSearch = forwardSearch;
    this.inSearch = inSearch;
    this.wrapping = wrapping;
    this.inElt = inElt;
    this.withinElt = withinElt;
    this.operator = operator;
    this.args = { thing: thingElt, from, inElt, withinElt };
  }
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
  scanForwardQuery(start, root, match, wrap) {
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
  scanBackwardsQuery(start, root, match, wrap) {
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
  scanForwardArray(start, array, match, wrap) {
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
  scanBackwardsArray(start, array, match, wrap) {
    return this.scanForwardArray(start, Array.from(array).reverse(), match, wrap);
  }
  resolve(context, { thing, from, inElt, withinElt }) {
    var css = thing.css;
    if (css == null) {
      throw new Error("Expected a CSS value to be returned by " + this.thingElt.sourceFor());
    }
    if (this.inSearch) {
      if (inElt) {
        if (this.forwardSearch) {
          return this.scanForwardArray(from, inElt, css, this.wrapping);
        } else {
          return this.scanBackwardsArray(from, inElt, css, this.wrapping);
        }
      }
    } else {
      if (withinElt) {
        if (this.forwardSearch) {
          return this.scanForwardQuery(from, withinElt, css, this.wrapping);
        } else {
          return this.scanBackwardsQuery(from, withinElt, css, this.wrapping);
        }
      }
    }
  }
};
__publicField(_RelativePositionalExpression, "grammarName", "relativePositionalExpression");
__publicField(_RelativePositionalExpression, "expressionType", "unary");
var RelativePositionalExpression = _RelativePositionalExpression;
var _PositionalExpression = class _PositionalExpression extends Expression {
  constructor(rhs, operator) {
    super();
    this.rhs = rhs;
    this.operator = operator;
    this.args = { value: rhs };
  }
  static parse(parser) {
    var op = parser.matchAnyToken("first", "last", "random");
    if (!op) return;
    parser.matchAnyToken("in", "from", "of");
    var rhs = parser.requireElement("unaryExpression");
    return new _PositionalExpression(rhs, op.value);
  }
  resolve(context, { value: rhsVal }) {
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
};
__publicField(_PositionalExpression, "grammarName", "positionalExpression");
__publicField(_PositionalExpression, "expressionType", "unary");
var PositionalExpression = _PositionalExpression;
var ClosestExprNode = class extends Expression {
  constructor(parentSearch, expr, css, to) {
    super();
    this.type = "closestExpr";
    this.parentSearch = parentSearch;
    this.expr = expr;
    this.css = css;
    this.to = to;
    this.args = { to };
  }
  resolve(ctx, { to }) {
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
};
var ClosestExpr = class extends Expression {
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
      return new AttributeRefAccess(closestExpr, attributeRef.attribute);
    } else {
      return closestExpr;
    }
  }
};
__publicField(ClosestExpr, "grammarName", "closestExpr");
__publicField(ClosestExpr, "expressionType", "leaf");

// src/parsetree/expressions/existentials.js
var existentials_exports = {};
__export(existentials_exports, {
  NoExpression: () => NoExpression,
  SomeExpression: () => SomeExpression
});
var _NoExpression = class _NoExpression extends Expression {
  constructor(root) {
    super();
    this.root = root;
    this.args = { value: root };
  }
  static parse(parser) {
    if (!parser.matchToken("no")) return;
    var root = parser.requireElement("unaryExpression");
    return new _NoExpression(root);
  }
  resolve(context, { value: val }) {
    return context.meta.runtime.isEmpty(val);
  }
};
__publicField(_NoExpression, "grammarName", "noExpression");
__publicField(_NoExpression, "expressionType", "unary");
var NoExpression = _NoExpression;
var _SomeExpression = class _SomeExpression extends Expression {
  constructor(root) {
    super();
    this.root = root;
    this.args = { value: root };
  }
  static parse(parser) {
    if (!parser.matchToken("some")) return;
    var root = parser.requireElement("expression");
    return new _SomeExpression(root);
  }
  resolve(context, { value: val }) {
    return !context.meta.runtime.isEmpty(val);
  }
};
__publicField(_SomeExpression, "grammarName", "some");
__publicField(_SomeExpression, "expressionType", "leaf");
var SomeExpression = _SomeExpression;

// src/parsetree/expressions/targets.js
var targets_exports = {};
__export(targets_exports, {
  ImplicitMeTarget: () => ImplicitMeTarget
});
var _ImplicitMeTarget = class _ImplicitMeTarget extends Expression {
  constructor() {
    super();
  }
  static parse(parser) {
    return new _ImplicitMeTarget();
  }
  resolve(context) {
    return context.you || context.me;
  }
};
__publicField(_ImplicitMeTarget, "grammarName", "implicitMeTarget");
var ImplicitMeTarget = _ImplicitMeTarget;

// src/parsetree/expressions/pseudopossessive.js
var pseudopossessive_exports = {};
__export(pseudopossessive_exports, {
  PseudopossessiveIts: () => PseudopossessiveIts
});
var _PseudopossessiveIts = class _PseudopossessiveIts extends Expression {
  constructor(token) {
    super();
    this.token = token;
    this.name = token.value;
  }
  static parse(parser) {
    if (parser.currentToken().type === "IDENTIFIER" && parser.currentToken().value === "its") {
      return new _PseudopossessiveIts(parser.matchToken("its"));
    }
  }
  resolve(context) {
    return context.meta.runtime.resolveSymbol("it", context);
  }
};
__publicField(_PseudopossessiveIts, "grammarName", "pseudopossessiveIts");
var PseudopossessiveIts = _PseudopossessiveIts;

// src/parsetree/commands/basic.js
var basic_exports = {};
__export(basic_exports, {
  AppendCommand: () => AppendCommand,
  BeepCommand: () => BeepCommand,
  ExitCommand: () => ExitCommand,
  FetchCommand: () => FetchCommand,
  GoCommand: () => GoCommand,
  HaltCommand: () => HaltCommand,
  LogCommand: () => LogCommand,
  MakeCommand: () => MakeCommand,
  PickCommand: () => PickCommand,
  ReturnCommand: () => ReturnCommand,
  ScrollCommand: () => ScrollCommand,
  ThrowCommand: () => ThrowCommand
});
var ImplicitResultSymbol = class extends Expression {
  constructor() {
    super();
    this.type = "symbol";
  }
  resolve(context) {
    return context.meta.runtime.resolveSymbol("result", context);
  }
  get lhs() {
    return {};
  }
  set(ctx, lhs, value) {
    ctx.meta.runtime.setSymbol("result", ctx, null, value);
  }
};
var _LogCommand = class _LogCommand extends Command {
  constructor(exprs, withExpr) {
    super();
    this.exprs = exprs;
    this.withExpr = withExpr;
    this.args = { logger: withExpr, values: exprs };
  }
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
  resolve(ctx, { logger, values }) {
    if (logger) {
      logger(...values);
    } else {
      console.log(...values);
    }
    return ctx.meta.runtime.findNext(this, ctx);
  }
};
__publicField(_LogCommand, "keyword", "log");
var LogCommand = _LogCommand;
var _BeepCommand = class _BeepCommand extends Command {
  constructor(exprs) {
    super();
    this.exprs = exprs;
    this.args = { values: exprs };
  }
  static parse(parser) {
    if (!parser.matchToken("beep!")) return;
    var exprs = [parser.parseElement("expression")];
    while (parser.matchOpToken(",")) {
      exprs.push(parser.requireElement("expression"));
    }
    return new _BeepCommand(exprs);
  }
  resolve(ctx, { values }) {
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
var _ThrowCommand = class _ThrowCommand extends Command {
  constructor(expr) {
    super();
    this.expr = expr;
    this.args = { value: expr };
  }
  static parse(parser) {
    if (!parser.matchToken("throw")) return;
    var expr = parser.requireElement("expression");
    return new _ThrowCommand(expr);
  }
  resolve(ctx, { value }) {
    ctx.meta.runtime.registerHyperTrace(ctx, value);
    throw value;
  }
};
__publicField(_ThrowCommand, "keyword", "throw");
var ThrowCommand = _ThrowCommand;
var _ReturnCommand = class _ReturnCommand extends Command {
  constructor(value) {
    super();
    this.value = value;
    this.args = { value };
  }
  static parse(parser) {
    if (!parser.matchToken("return")) return;
    var value;
    if (!parser.commandBoundary(parser.currentToken())) {
      value = parser.requireElement("expression");
    }
    return new _ReturnCommand(value);
  }
  resolve(context, { value }) {
    var resolve = context.meta.resolve;
    context.meta.returned = true;
    context.meta.returnValue = value;
    if (resolve) {
      if (value) {
        resolve(value);
      } else {
        resolve();
      }
    }
    return context.meta.runtime.HALT;
  }
};
__publicField(_ReturnCommand, "keyword", "return");
var ReturnCommand = _ReturnCommand;
var _ExitCommand = class _ExitCommand extends Command {
  constructor() {
    super();
  }
  static parse(parser) {
    if (!parser.matchToken("exit")) return;
    return new _ExitCommand();
  }
  resolve(context) {
    var resolve = context.meta.resolve;
    context.meta.returned = true;
    context.meta.returnValue = null;
    if (resolve) {
      resolve();
    }
    return context.meta.runtime.HALT;
  }
};
__publicField(_ExitCommand, "keyword", "exit");
var ExitCommand = _ExitCommand;
var _HaltCommand = class _HaltCommand extends Command {
  constructor(bubbling, haltDefault, keepExecuting, exit) {
    super();
    this.keepExecuting = keepExecuting;
    this.bubbling = bubbling;
    this.haltDefault = haltDefault;
    this.exit = exit;
  }
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
    var exit = new ExitCommand();
    return new _HaltCommand(bubbling, haltDefault, keepExecuting, exit);
  }
  resolve(ctx) {
    if (ctx.event) {
      if (this.bubbling) {
        ctx.event.stopPropagation();
      } else if (this.haltDefault) {
        ctx.event.preventDefault();
      } else {
        ctx.event.stopPropagation();
        ctx.event.preventDefault();
      }
    }
    if (this.keepExecuting) {
      return ctx.meta.runtime.findNext(this, ctx);
    } else {
      return this.exit;
    }
  }
};
__publicField(_HaltCommand, "keyword", "halt");
var HaltCommand = _HaltCommand;
var _MakeCommand = class _MakeCommand extends Command {
  constructor(variant, expr, constructorArgs, target) {
    super();
    this.variant = variant;
    this.expr = expr;
    this.constructorArgs = constructorArgs;
    this.target = target;
    this.args = variant === "queryRef" ? null : { expr, constructorArgs };
  }
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
    if (expr.type === "queryRef") {
      return new _MakeCommand("queryRef", expr, null, target);
    } else {
      return new _MakeCommand("constructor", expr, args, target);
    }
  }
  resolve(ctx, { expr, constructorArgs } = {}) {
    if (this.variant === "queryRef") {
      var match, tagname = "div", id, classes = [];
      var re = /(?:(^|#|\.)([^#\. ]+))/g;
      while (match = re.exec(this.expr.css)) {
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
    } else {
      ctx.result = new expr(...constructorArgs);
    }
    if (this.target) {
      ctx.meta.runtime.setSymbol(this.target.name, ctx, this.target.scope, ctx.result);
    }
    return ctx.meta.runtime.findNext(this, ctx);
  }
};
__publicField(_MakeCommand, "keyword", "make");
var MakeCommand = _MakeCommand;
var _AppendCommand = class _AppendCommand extends Command {
  constructor(value, targetExpr, assignable) {
    super();
    this.value = value;
    this._target = targetExpr;
    this.assignable = assignable;
    if (assignable) {
      this.args = __spreadValues({ target: targetExpr, value }, targetExpr.lhs);
    } else {
      this.args = { target: targetExpr, value };
    }
  }
  static parse(parser) {
    if (!parser.matchToken("append")) return;
    var targetExpr = null;
    var value = parser.requireElement("expression");
    if (parser.matchToken("to")) {
      targetExpr = parser.requireElement("expression");
    } else {
      targetExpr = new ImplicitResultSymbol();
    }
    var checkTarget = targetExpr;
    while (checkTarget.type === "parenthesized") checkTarget = checkTarget.expr;
    var assignable = checkTarget.set != null;
    return new _AppendCommand(value, targetExpr, assignable);
  }
  resolve(context, args) {
    var _a = args, { target, value } = _a, lhs = __objRest(_a, ["target", "value"]);
    if (Array.isArray(target)) {
      target.push(value);
      return context.meta.runtime.findNext(this, context);
    } else if (target instanceof Element) {
      if (value instanceof Element) {
        target.insertAdjacentElement("beforeend", value);
      } else {
        target.insertAdjacentHTML("beforeend", value);
      }
      context.meta.runtime.processNode(target);
      return context.meta.runtime.findNext(this, context);
    } else if (this.assignable) {
      this._target.set(context, lhs, (target || "") + value);
      return context.meta.runtime.findNext(this, context);
    } else {
      throw new Error("Unable to append a value!");
    }
  }
};
__publicField(_AppendCommand, "keyword", "append");
var AppendCommand = _AppendCommand;
var _PickCommand = class _PickCommand extends Command {
  constructor(variant, root, range, re, flags, count) {
    super();
    this.variant = variant;
    this.range = range;
    this.flags = flags;
    if (variant === "range") {
      this.args = { root, from: range.from, to: range.to };
    } else if (variant === "first" || variant === "last" || variant === "random") {
      this.args = { root, count };
    } else {
      this.args = { root, re };
    }
  }
  static parsePickRange(parser) {
    parser.matchToken("at") || parser.matchToken("from");
    var rv = { includeStart: true, includeEnd: false };
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
  static parseSource(parser) {
    if (!parser.matchAnyToken("of", "from")) {
      parser.raiseParseError("Expected 'of' or 'from'");
    }
    return parser.requireElement("expression");
  }
  static parse(parser) {
    if (!parser.matchToken("pick")) return;
    parser.matchToken("the");
    if (parser.matchToken("first")) {
      parser.pushFollow("of");
      parser.pushFollow("from");
      try {
        var count = parser.requireElement("expression");
      } finally {
        parser.popFollow();
        parser.popFollow();
      }
      var root = _PickCommand.parseSource(parser);
      return new _PickCommand("first", root, null, null, null, count);
    }
    if (parser.matchToken("last")) {
      parser.pushFollow("of");
      parser.pushFollow("from");
      try {
        var count = parser.requireElement("expression");
      } finally {
        parser.popFollow();
        parser.popFollow();
      }
      var root = _PickCommand.parseSource(parser);
      return new _PickCommand("last", root, null, null, null, count);
    }
    if (parser.matchToken("random")) {
      var count = null;
      if (parser.currentToken().type === "NUMBER") {
        parser.pushFollow("of");
        parser.pushFollow("from");
        try {
          count = parser.requireElement("expression");
        } finally {
          parser.popFollow();
          parser.popFollow();
        }
      }
      var root = _PickCommand.parseSource(parser);
      return new _PickCommand("random", root, null, null, null, count);
    }
    if (parser.matchToken("item") || parser.matchToken("items") || parser.matchToken("character") || parser.matchToken("characters")) {
      parser.pushFollow("of");
      parser.pushFollow("from");
      try {
        var range = _PickCommand.parsePickRange(parser);
      } finally {
        parser.popFollow();
        parser.popFollow();
      }
      var root = _PickCommand.parseSource(parser);
      return new _PickCommand("range", root, range, null, null);
    }
    if (parser.matchToken("match")) {
      parser.matchToken("of");
      parser.pushFollow("of");
      parser.pushFollow("from");
      try {
        var re = parser.parseElement("expression");
        var flags = "";
        if (parser.matchOpToken("|")) {
          flags = parser.requireTokenType("IDENTIFIER").value;
        }
      } finally {
        parser.popFollow();
        parser.popFollow();
      }
      var root = _PickCommand.parseSource(parser);
      return new _PickCommand("match", root, null, re, flags);
    }
    if (parser.matchToken("matches")) {
      parser.matchToken("of");
      parser.pushFollow("of");
      parser.pushFollow("from");
      try {
        var re = parser.parseElement("expression");
        var flags = "gu";
        if (parser.matchOpToken("|")) {
          flags = "g" + parser.requireTokenType("IDENTIFIER").value.replace("g", "");
        }
      } finally {
        parser.popFollow();
        parser.popFollow();
      }
      var root = _PickCommand.parseSource(parser);
      return new _PickCommand("matches", root, null, re, flags);
    }
  }
  resolve(ctx, { root, from, to, re, count }) {
    if (this.variant === "first") {
      ctx.result = root.slice(0, count);
    } else if (this.variant === "last") {
      ctx.result = root.slice(-count);
    } else if (this.variant === "random") {
      if (count == null) {
        ctx.result = root[Math.floor(Math.random() * root.length)];
      } else {
        var copy = Array.from(root);
        var result = [];
        for (var i = 0; i < count && copy.length > 0; i++) {
          var idx = Math.floor(Math.random() * copy.length);
          result.push(copy.splice(idx, 1)[0]);
        }
        ctx.result = result;
      }
    } else if (this.variant === "range") {
      if (this.range.toEnd) to = root.length;
      if (!this.range.includeStart) from++;
      if (this.range.includeEnd) to++;
      if (to == null || to == void 0) to = from + 1;
      ctx.result = root.slice(from, to);
    } else if (this.variant === "match") {
      ctx.result = new RegExp(re, this.flags).exec(root);
    } else {
      ctx.result = new RegExpIterable(re, this.flags, root);
    }
    return ctx.meta.runtime.findNext(this, ctx);
  }
};
__publicField(_PickCommand, "keyword", "pick");
var PickCommand = _PickCommand;
var _FetchCommand = class _FetchCommand extends Command {
  constructor(url, argExprs, conversionType, conversion) {
    super();
    this.url = url;
    this.argExpressions = argExprs;
    this.args = { url, options: argExprs };
    this.conversionType = conversionType;
    this.conversion = conversion;
  }
  static parseConversionInfo(parser) {
    var type = "text";
    var conversion;
    parser.matchToken("a") || parser.matchToken("an");
    if (parser.matchToken("json") || parser.matchToken("JSON") || parser.matchToken("Object")) {
      type = "json";
    } else if (parser.matchToken("response")) {
      type = "response";
    } else if (parser.matchToken("html") || parser.matchToken("HTML")) {
      type = "html";
    } else if (parser.matchToken("text") || parser.matchToken("String")) {
    } else {
      conversion = parser.requireElement("dotOrColonPath").evalStatically();
    }
    return { type, conversion };
  }
  static parse(parser) {
    if (!parser.matchToken("fetch")) return;
    var url = parser.parseURLOrExpression();
    if (parser.matchToken("as")) {
      var conversionInfo = _FetchCommand.parseConversionInfo(parser);
    }
    if (parser.matchToken("with") && parser.currentToken().value !== "{") {
      var argExprs = parser.parseElement("nakedNamedArgumentList");
    } else {
      var argExprs = parser.parseElement("objectLiteral");
    }
    if (conversionInfo == null && parser.matchToken("as")) {
      conversionInfo = _FetchCommand.parseConversionInfo(parser);
    }
    var type = conversionInfo ? conversionInfo.type : "text";
    var conversion = conversionInfo ? conversionInfo.conversion : null;
    return new _FetchCommand(url, argExprs, type, conversion);
  }
  resolve(context, { url, options }) {
    const type = this.conversionType;
    const conversion = this.conversion;
    const fetchCmd = this;
    var detail = options || {};
    detail["sender"] = context.me;
    detail["headers"] = detail["headers"] || {};
    var abortController = new AbortController();
    var abortListener = function() {
      abortController.abort();
    };
    context.me.addEventListener("fetch:abort", abortListener, { once: true });
    detail["signal"] = abortController.signal;
    context.meta.runtime.triggerEvent(context.me, "hyperscript:beforeFetch", detail);
    context.meta.runtime.triggerEvent(context.me, "fetch:beforeRequest", detail);
    var finished = false;
    if (detail.timeout) {
      setTimeout(function() {
        if (!finished) {
          abortController.abort();
        }
      }, detail.timeout);
    }
    return fetch(url, detail).then(function(resp) {
      let resultDetails = { response: resp };
      context.meta.runtime.triggerEvent(context.me, "fetch:afterResponse", resultDetails);
      resp = resultDetails.response;
      if (type === "response") {
        context.result = resp;
        context.meta.runtime.triggerEvent(context.me, "fetch:afterRequest", { result: resp });
        finished = true;
        return context.meta.runtime.findNext(fetchCmd, context);
      }
      if (type === "json") {
        return resp.json().then(function(result) {
          context.result = result;
          context.meta.runtime.triggerEvent(context.me, "fetch:afterRequest", { result });
          finished = true;
          return context.meta.runtime.findNext(fetchCmd, context);
        });
      }
      return resp.text().then(function(result) {
        if (conversion) result = context.meta.runtime.convertValue(result, conversion);
        if (type === "html") result = context.meta.runtime.convertValue(result, "Fragment");
        context.result = result;
        context.meta.runtime.triggerEvent(context.me, "fetch:afterRequest", { result });
        finished = true;
        return context.meta.runtime.findNext(fetchCmd, context);
      });
    }).catch(function(reason) {
      context.meta.runtime.triggerEvent(context.me, "fetch:error", {
        reason
      });
      throw reason;
    }).finally(function() {
      context.me.removeEventListener("fetch:abort", abortListener);
    });
  }
};
__publicField(_FetchCommand, "keyword", "fetch");
var FetchCommand = _FetchCommand;
function _parseScrollModifiers(parser) {
  parser.matchToken("the");
  var verticalPosition = parser.matchAnyToken("top", "middle", "bottom");
  var horizontalPosition = parser.matchAnyToken("left", "center", "right");
  if (verticalPosition || horizontalPosition) {
    parser.requireToken("of");
  }
  var target = parser.requireElement("unaryExpression");
  var plusOrMinus = parser.matchAnyOpToken("+", "-");
  var offset;
  if (plusOrMinus) {
    parser.pushFollow("px");
    try {
      offset = parser.requireElement("expression");
    } finally {
      parser.popFollow();
    }
  }
  parser.matchToken("px");
  var smoothness = parser.matchAnyToken("smoothly", "instantly");
  var scrollOptions = { block: "start", inline: "nearest" };
  if (verticalPosition) {
    if (verticalPosition.value === "top") scrollOptions.block = "start";
    else if (verticalPosition.value === "bottom") scrollOptions.block = "end";
    else if (verticalPosition.value === "middle") scrollOptions.block = "center";
  }
  if (horizontalPosition) {
    if (horizontalPosition.value === "left") scrollOptions.inline = "start";
    else if (horizontalPosition.value === "center") scrollOptions.inline = "center";
    else if (horizontalPosition.value === "right") scrollOptions.inline = "end";
  }
  if (smoothness) {
    if (smoothness.value === "smoothly") scrollOptions.behavior = "smooth";
    else if (smoothness.value === "instantly") scrollOptions.behavior = "instant";
  }
  return { target, offset, plusOrMinus, scrollOptions };
}
function _resolveScroll(ctx, to, offset, plusOrMinus, scrollOptions) {
  ctx.meta.runtime.implicitLoop(to, function(target) {
    if (target === window) target = document.body;
    if (plusOrMinus) {
      var boundingRect = target.getBoundingClientRect();
      var scrollShim = document.createElement("div");
      var actualOffset = plusOrMinus.value === "+" ? offset : offset * -1;
      var offsetX = scrollOptions.inline == "start" || scrollOptions.inline == "end" ? actualOffset : 0;
      var offsetY = scrollOptions.block == "start" || scrollOptions.block == "end" ? actualOffset : 0;
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
var _ScrollCommand = class _ScrollCommand extends Command {
  constructor(target, offset, plusOrMinus, scrollOptions) {
    super();
    this.target = target;
    this.plusOrMinus = plusOrMinus;
    this.scrollOptions = scrollOptions;
    this.args = { target, offset };
  }
  static parse(parser) {
    if (!parser.matchToken("scroll")) return;
    parser.requireToken("to");
    var scroll = _parseScrollModifiers(parser);
    return new _ScrollCommand(scroll.target, scroll.offset, scroll.plusOrMinus, scroll.scrollOptions);
  }
  resolve(ctx, { target: to, offset }) {
    _resolveScroll(ctx, to, offset, this.plusOrMinus, this.scrollOptions);
    return ctx.meta.runtime.findNext(this, ctx);
  }
};
__publicField(_ScrollCommand, "keyword", "scroll");
var ScrollCommand = _ScrollCommand;
var _GoCommand = class _GoCommand extends Command {
  constructor(target, offset, back, newWindow, plusOrMinus, scrollOptions) {
    super();
    this.target = target;
    this.args = { target, offset };
    this.back = back;
    this.newWindow = newWindow;
    this.plusOrMinus = plusOrMinus;
    this.scrollOptions = scrollOptions;
  }
  static parse(parser) {
    if (!parser.matchToken("go")) return;
    if (parser.matchToken("back")) {
      return new _GoCommand(null, null, true);
    }
    parser.matchToken("to");
    if (parser.matchToken("url")) {
      var target = parser.requireElement("stringLike");
      var newWindow = false;
      if (parser.matchToken("in")) {
        parser.requireToken("new");
        parser.requireToken("window");
        newWindow = true;
      }
      return new _GoCommand(target, null, false, newWindow);
    }
    var cur = parser.currentToken();
    if (cur.value === "the" || cur.value === "top" || cur.value === "middle" || cur.value === "bottom" || cur.value === "left" || cur.value === "center" || cur.value === "right") {
      var scroll = _parseScrollModifiers(parser);
      return new _GoCommand(scroll.target, scroll.offset, false, false, scroll.plusOrMinus, scroll.scrollOptions);
    }
    var target = parser.parseURLOrExpression();
    var newWindow = false;
    if (parser.matchToken("in")) {
      parser.requireToken("new");
      parser.requireToken("window");
      newWindow = true;
    }
    return new _GoCommand(target, null, false, newWindow);
  }
  resolve(ctx, { target: to, offset }) {
    if (this.back) {
      window.history.back();
    } else if (this.scrollOptions) {
      _resolveScroll(ctx, to, offset, this.plusOrMinus, this.scrollOptions);
    } else if (to != null) {
      if (to instanceof Element) {
        to.scrollIntoView({ block: "start", inline: "nearest" });
      } else {
        var str = String(to);
        if (str.startsWith("#")) {
          window.location.hash = str;
        } else if (this.newWindow) {
          window.open(str);
        } else {
          window.location.href = str;
        }
      }
    }
    return ctx.meta.runtime.findNext(this, ctx);
  }
};
__publicField(_GoCommand, "keyword", "go");
var GoCommand = _GoCommand;

// src/parsetree/commands/setters.js
var setters_exports = {};
__export(setters_exports, {
  DecrementCommand: () => DecrementCommand,
  DefaultCommand: () => DefaultCommand,
  IncrementCommand: () => IncrementCommand,
  PutCommand: () => PutCommand,
  SetCommand: () => SetCommand
});
var _SetCommand = class _SetCommand extends Command {
  constructor(target, valueExpr, objectLiteral = null) {
    super();
    this.target = target;
    this.objectLiteral = objectLiteral;
    if (objectLiteral) {
      this.args = { obj: objectLiteral, setTarget: target };
    } else {
      this.args = __spreadProps(__spreadValues({}, target.lhs), { value: valueExpr });
    }
  }
  static parse(parser) {
    if (!parser.matchToken("set")) return;
    if (parser.currentToken().type === "L_BRACE") {
      var obj = parser.requireElement("objectLiteral");
      parser.requireToken("on");
      var target = parser.requireElement("expression");
      return new _SetCommand(target, null, obj);
    }
    try {
      parser.pushFollow("to");
      var target = parser.requireElement("assignableExpression");
    } finally {
      parser.popFollow();
    }
    while (target.type === "parenthesized") target = target.expr;
    parser.requireToken("to");
    var value = parser.requireElement("expression");
    return new _SetCommand(target, value);
  }
  resolve(context, args) {
    if (this.objectLiteral) {
      var { obj, setTarget } = args;
      Object.assign(setTarget, obj);
    } else {
      var _a = args, { value } = _a, lhs = __objRest(_a, ["value"]);
      this.target.set(context, lhs, value);
    }
    return context.meta.runtime.findNext(this, context);
  }
};
__publicField(_SetCommand, "keyword", "set");
var SetCommand = _SetCommand;
var _DefaultCommand = class _DefaultCommand extends Command {
  constructor(target, setter) {
    super();
    this.target = target;
    this.setter = setter;
    this.args = { targetValue: target };
  }
  static parse(parser) {
    if (!parser.matchToken("default")) return;
    try {
      parser.pushFollow("to");
      var target = parser.requireElement("assignableExpression");
    } finally {
      parser.popFollow();
    }
    while (target.type === "parenthesized") target = target.expr;
    parser.requireToken("to");
    var value = parser.requireElement("expression");
    var setter = new SetCommand(target, value);
    var defaultCmd = new _DefaultCommand(target, setter);
    setter.parent = defaultCmd;
    return defaultCmd;
  }
  resolve(context, { targetValue }) {
    if (targetValue != null && targetValue !== "") {
      return context.meta.runtime.findNext(this, context);
    } else {
      return this.setter;
    }
  }
};
__publicField(_DefaultCommand, "keyword", "default");
var DefaultCommand = _DefaultCommand;
var _IncrementCommand = class _IncrementCommand extends Command {
  constructor(target, amountExpr) {
    super();
    this.target = target;
    this.amountExpr = amountExpr;
    this.args = __spreadValues({ targetValue: target, amount: amountExpr }, target.lhs);
  }
  static parse(parser) {
    if (!parser.matchToken("increment")) return;
    var amountExpr;
    var target = parser.parseElement("assignableExpression");
    while (target.type === "parenthesized") target = target.expr;
    if (parser.matchToken("by")) {
      amountExpr = parser.requireElement("expression");
    }
    return new _IncrementCommand(target, amountExpr);
  }
  resolve(context, args) {
    var _a = args, { targetValue, amount } = _a, lhs = __objRest(_a, ["targetValue", "amount"]);
    targetValue = targetValue ? parseFloat(targetValue) : 0;
    amount = this.amountExpr ? parseFloat(amount) : 1;
    var newValue = targetValue + amount;
    context.result = newValue;
    this.target.set(context, lhs, newValue);
    return context.meta.runtime.findNext(this, context);
  }
};
__publicField(_IncrementCommand, "keyword", "increment");
var IncrementCommand = _IncrementCommand;
var _DecrementCommand = class _DecrementCommand extends Command {
  constructor(target, amountExpr) {
    super();
    this.target = target;
    this.amountExpr = amountExpr;
    this.args = __spreadValues({ targetValue: target, amount: amountExpr }, target.lhs);
  }
  static parse(parser) {
    if (!parser.matchToken("decrement")) return;
    var amountExpr;
    try {
      parser.pushFollow("by");
      var target = parser.parseElement("assignableExpression");
    } finally {
      parser.popFollow();
    }
    while (target.type === "parenthesized") target = target.expr;
    if (parser.matchToken("by")) {
      amountExpr = parser.requireElement("expression");
    }
    return new _DecrementCommand(target, amountExpr);
  }
  resolve(context, args) {
    var _a = args, { targetValue, amount } = _a, lhs = __objRest(_a, ["targetValue", "amount"]);
    targetValue = targetValue ? parseFloat(targetValue) : 0;
    amount = this.amountExpr ? parseFloat(amount) : 1;
    var newValue = targetValue - amount;
    context.result = newValue;
    this.target.set(context, lhs, newValue);
    return context.meta.runtime.findNext(this, context);
  }
};
__publicField(_DecrementCommand, "keyword", "decrement");
var DecrementCommand = _DecrementCommand;
var _PutCommand = class _PutCommand extends Command {
  constructor(target, operation, value, rootExpr) {
    super();
    this.target = target;
    this.operation = operation;
    this.value = value;
    this.rootExpr = rootExpr;
    this.symbolWrite = target.type === "symbol" && operation === "into";
    this.arrayIndex = target.type === "arrayIndex";
    this.attributeWrite = (target.type === "attributeRef" || target.attribute && target.attribute.type === "attributeRef") && operation === "into";
    this.styleWrite = (target.type === "styleRef" || target.attribute && target.attribute.type === "styleRef") && operation === "into";
    if (this.arrayIndex) {
      this.prop = target.prop;
    } else if (this.symbolWrite) {
      this.prop = target.name;
    } else if (target.type === "attributeRef" || target.type === "styleRef") {
      this.prop = target.name;
    } else if (target.attribute) {
      this.prop = target.attribute.name;
    } else if (target.prop) {
      this.prop = target.prop.value;
    } else {
      this.prop = null;
    }
    this.args = { root: rootExpr, prop: this.prop, value };
  }
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
    while (target.type === "parenthesized") target = target.expr;
    var operation = operationToken.value;
    var rootExpr;
    if (target.type === "arrayIndex" && operation === "into") {
      rootExpr = target.root;
    } else if (target.prop && target.root && operation === "into") {
      rootExpr = target.root;
    } else if (target.type === "symbol" && operation === "into") {
      rootExpr = null;
    } else if (target.type === "attributeRef" && operation === "into") {
      rootExpr = parser.requireElement("implicitMeTarget");
    } else if (target.type === "styleRef" && operation === "into") {
      rootExpr = parser.requireElement("implicitMeTarget");
    } else if (target.attribute && operation === "into") {
      rootExpr = target.root;
    } else {
      rootExpr = target;
    }
    return new _PutCommand(target, operation, value, rootExpr);
  }
  putInto(context, root, prop, valueToPut) {
    if (root == null) {
      var value = context.meta.runtime.resolveSymbol(prop, context);
    } else {
      var value = root;
    }
    if ((root == null || prop == null) && (value instanceof Element || value instanceof Document)) {
      while (value.firstChild) value.removeChild(value.firstChild);
      value.append(context.meta.runtime.convertValue(valueToPut, "Fragment"));
      context.meta.runtime.processNode(value);
    } else {
      if (root == null) {
        context.meta.runtime.setSymbol(prop, context, null, valueToPut);
      } else {
        root[prop] = valueToPut;
      }
    }
  }
  resolve(context, { root, prop, value: valueToPut }) {
    if (this.symbolWrite) {
      this.putInto(context, root, prop, valueToPut);
    } else {
      context.meta.runtime.nullCheck(root, this.rootExpr);
      if (this.operation === "into") {
        if (this.attributeWrite) {
          context.meta.runtime.implicitLoop(root, function(elt) {
            if (valueToPut == null) {
              elt.removeAttribute(prop);
            } else {
              elt.setAttribute(prop, valueToPut);
            }
          });
        } else if (this.styleWrite) {
          context.meta.runtime.implicitLoop(root, function(elt) {
            elt.style[prop] = valueToPut;
          });
        } else if (this.arrayIndex) {
          root[prop] = valueToPut;
        } else {
          var cmd = this;
          context.meta.runtime.implicitLoop(root, function(elt) {
            cmd.putInto(context, elt, prop, valueToPut);
          });
        }
      } else {
        var op = this.operation === "before" ? Element.prototype.before : this.operation === "after" ? Element.prototype.after : this.operation === "start" ? Element.prototype.prepend : this.operation === "end" ? Element.prototype.append : Element.prototype.append;
        context.meta.runtime.implicitLoop(root, function(elt) {
          op.call(
            elt,
            valueToPut instanceof Node ? valueToPut : context.meta.runtime.convertValue(valueToPut, "Fragment")
          );
          if (elt.parentElement) {
            context.meta.runtime.processNode(elt.parentElement);
          } else {
            context.meta.runtime.processNode(elt);
          }
        });
      }
    }
    return context.meta.runtime.findNext(this, context);
  }
};
__publicField(_PutCommand, "keyword", "put");
var PutCommand = _PutCommand;

// src/parsetree/commands/events.js
var events_exports = {};
__export(events_exports, {
  EventName: () => EventName,
  SendCommand: () => SendCommand,
  WaitCommand: () => WaitCommand
});
var _WaitCommand = class _WaitCommand extends Command {
  constructor(variant, events, on, time) {
    super();
    this.variant = variant;
    this.event = events;
    this.on = on;
    this.time = time;
    this.args = variant === "event" ? { on } : { time };
  }
  static parse(parser) {
    if (!parser.matchToken("wait")) return;
    if (parser.matchToken("for")) {
      parser.matchToken("a");
      var events = [];
      do {
        var lookahead = parser.token(0);
        if (lookahead.type === "NUMBER" || lookahead.type === "L_PAREN") {
          events.push(parser.requireElement("expression"));
        } else {
          events.push({
            name: parser.requireElement("dotOrColonPath", "Expected event name").evalStatically(),
            args: ParseElement.parseEventArgs(parser)
          });
        }
      } while (parser.matchToken("or"));
      if (parser.matchToken("from")) {
        var on = parser.requireElement("expression");
      }
      return new _WaitCommand("event", events, on, null);
    } else {
      var time;
      if (parser.matchToken("a")) {
        parser.requireToken("tick");
        time = 0;
      } else {
        time = parser.requireElement("expression");
      }
      return new _WaitCommand("time", null, null, time);
    }
  }
  resolve(context, { on, time }) {
    if (this.variant === "event") {
      var target = on ? on : context.me;
      if (!(target instanceof EventTarget))
        throw new Error("Not a valid event target: " + this.on.sourceFor());
      const events = this.event;
      return new Promise((resolve) => {
        var resolved = false;
        for (const eventInfo of events) {
          var listener = (evt) => {
            context.result = evt;
            if (eventInfo.name && eventInfo.args) {
              for (const arg of eventInfo.args) {
                context.locals[arg.value] = evt[arg.value] || (evt.detail ? evt.detail[arg.value] : null);
              }
            }
            if (!resolved) {
              resolved = true;
              resolve(context.meta.runtime.findNext(this, context));
            }
          };
          if (eventInfo.name) {
            target.addEventListener(eventInfo.name, listener, { once: true });
          } else {
            const timeValue = eventInfo.evaluate(context);
            setTimeout(listener, timeValue, timeValue);
          }
        }
      });
    } else {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(context.meta.runtime.findNext(this, context));
        }, time);
      });
    }
  }
};
__publicField(_WaitCommand, "keyword", "wait");
var WaitCommand = _WaitCommand;
var _SendCommand = class _SendCommand extends Command {
  constructor(eventName, details, toExpr) {
    super();
    this.eventName = eventName;
    this.details = details;
    this.to = toExpr;
    this.args = { to: toExpr, eventName, details };
    this.toExpr = toExpr;
  }
  static parse(parser) {
    var isTrigger = parser.matchToken("trigger");
    if (!isTrigger && !parser.matchToken("send")) return;
    var eventName = parser.requireElement("eventName");
    var details = parser.parseElement("namedArgumentList");
    if (parser.matchToken(isTrigger ? "on" : "to")) {
      var toExpr = parser.requireElement("expression");
    } else {
      var toExpr = parser.requireElement("implicitMeTarget");
    }
    return new _SendCommand(eventName, details, toExpr);
  }
  resolve(context, { to, eventName, details }) {
    context.meta.runtime.nullCheck(to, this.toExpr);
    context.meta.runtime.implicitLoop(to, function(target) {
      context.meta.runtime.triggerEvent(target, eventName, details, context.me);
    });
    return context.meta.runtime.findNext(this, context);
  }
};
__publicField(_SendCommand, "keyword", ["send", "trigger"]);
var SendCommand = _SendCommand;
var _EventName = class _EventName extends Expression {
  constructor(value) {
    super();
    this.value = value;
  }
  evalStatically() {
    return this.value;
  }
  resolve(context) {
    return this.value;
  }
  static parse(parser) {
    var token;
    if (token = parser.matchTokenType("STRING")) {
      return new _EventName(token.value);
    }
    return parser.parseElement("dotOrColonPath");
  }
};
__publicField(_EventName, "grammarName", "eventName");
var EventName = _EventName;

// src/parsetree/commands/controlflow.js
var controlflow_exports = {};
__export(controlflow_exports, {
  BreakCommand: () => BreakCommand,
  ContinueCommand: () => ContinueCommand,
  IfCommand: () => IfCommand,
  RepeatCommand: () => RepeatCommand,
  TellCommand: () => TellCommand
});
var WaitATick = class extends Command {
  constructor() {
    super();
    this.type = "waitATick";
  }
  resolve(context) {
    const self2 = this;
    return new Promise(function(resolve) {
      setTimeout(function() {
        resolve(context.meta.runtime.findNext(self2));
      }, 0);
    });
  }
};
var RepeatLoopCommand = class extends Command {
  constructor(config2, loop) {
    super();
    this.identifier = config2.identifier;
    this.indexIdentifier = config2.indexIdentifier;
    this.slot = config2.slot;
    this.expression = config2.expression;
    this.forever = config2.forever;
    this.times = config2.times;
    this.until = config2.until;
    this.event = config2.event;
    this.on = config2.on;
    this.whileExpr = config2.whileExpr;
    this.bottomTested = config2.bottomTested;
    this.loop = loop;
    this.args = { whileValue: config2.whileExpr, times: config2.times };
  }
  resolveNext() {
    return this;
  }
  resolve(context, { whileValue, times }) {
    var iteratorInfo = context.meta.iterators[this.slot];
    var keepLooping = false;
    var loopVal = null;
    if (this.bottomTested && iteratorInfo.index === 0) {
      keepLooping = true;
    } else if (this.forever) {
      keepLooping = true;
    } else if (this.until) {
      if (this.event) {
        keepLooping = context.meta.iterators[this.slot].eventFired === false;
      } else {
        keepLooping = whileValue !== true;
      }
    } else if (this.whileExpr) {
      keepLooping = whileValue;
    } else if (times) {
      keepLooping = iteratorInfo.index < times;
    } else {
      var nextValFromIterator = iteratorInfo.iterator.next();
      keepLooping = !nextValFromIterator.done;
      loopVal = nextValFromIterator.value;
    }
    if (keepLooping) {
      if (iteratorInfo.value) {
        context.result = context.locals[this.identifier] = loopVal;
      } else {
        context.result = iteratorInfo.index;
      }
      if (this.indexIdentifier) {
        context.locals[this.indexIdentifier] = iteratorInfo.index;
      }
      iteratorInfo.index++;
      return this.loop;
    } else {
      context.meta.iterators[this.slot] = null;
      return context.meta.runtime.findNext(this.parent, context);
    }
  }
};
var _IfCommand = class _IfCommand extends Command {
  constructor(expr, trueBranch, falseBranch) {
    super();
    this.expr = expr;
    this.trueBranch = trueBranch;
    this.falseBranch = falseBranch;
    this.args = { value: expr };
  }
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
    var ifCmd = new _IfCommand(expr, trueBranch, falseBranch);
    parser.setParent(trueBranch, ifCmd);
    parser.setParent(falseBranch, ifCmd);
    return ifCmd;
  }
  resolve(context, { value: exprValue }) {
    if (exprValue) {
      return this.trueBranch;
    } else if (this.falseBranch) {
      return this.falseBranch;
    } else {
      return context.meta.runtime.findNext(this, context);
    }
  }
};
__publicField(_IfCommand, "keyword", "if");
var IfCommand = _IfCommand;
var _RepeatCommand = class _RepeatCommand extends Command {
  constructor(expression, evt, on, slot, repeatLoopCommand) {
    super();
    this.expression = expression;
    this.evt = evt;
    this.on = on;
    this.slot = slot;
    this.repeatLoopCommand = repeatLoopCommand;
    this.args = { value: expression, event: evt, on };
  }
  static parseRepeatExpression(parser, startedWithForToken) {
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
      var waitATick = new WaitATick();
      last.next = waitATick;
    }
    var bottomTested = false;
    if (forever && parser.hasMore()) {
      if (parser.matchToken("until")) {
        forever = false;
        isUntil = true;
        bottomTested = true;
        whileExpr = parser.requireElement("expression");
      } else if (parser.matchToken("while")) {
        forever = false;
        bottomTested = true;
        whileExpr = parser.requireElement("expression");
      }
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
    const loopConfig = {
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
      bottomTested
    };
    const repeatLoopCommand = new RepeatLoopCommand(loopConfig, loop);
    const repeatCommand = new _RepeatCommand(expression, evt, on, slot, repeatLoopCommand);
    parser.setParent(loop, repeatLoopCommand);
    parser.setParent(repeatLoopCommand, repeatCommand);
    return repeatCommand;
  }
  static parse(parser) {
    if (parser.matchToken("for")) {
      return _RepeatCommand.parseRepeatExpression(parser, true);
    }
    if (parser.matchToken("repeat")) {
      return _RepeatCommand.parseRepeatExpression(parser, false);
    }
  }
  resolve(context, { value, event, on }) {
    var iteratorInfo = {
      index: 0,
      value,
      eventFired: false
    };
    context.meta.iterators[this.slot] = iteratorInfo;
    if (value) {
      if (value[Symbol.iterator]) {
        iteratorInfo.iterator = value[Symbol.iterator]();
      } else {
        iteratorInfo.iterator = Object.keys(value)[Symbol.iterator]();
      }
    }
    if (this.evt) {
      var target = on || context.me;
      const slot = this.slot;
      target.addEventListener(
        event,
        function(e) {
          context.meta.iterators[slot].eventFired = true;
        },
        { once: true }
      );
    }
    return this.repeatLoopCommand;
  }
};
__publicField(_RepeatCommand, "keyword", ["repeat", "for"]);
var RepeatCommand = _RepeatCommand;
var _ContinueCommand = class _ContinueCommand extends Command {
  static parse(parser) {
    if (!parser.matchToken("continue")) return;
    return new _ContinueCommand();
  }
  resolve(context) {
    for (var parent = this.parent; parent; parent = parent.parent) {
      if (parent.loop != void 0) {
        return parent.resolveNext(context);
      }
    }
    throw new Error("Command `continue` cannot be used outside of a `repeat` loop.");
  }
};
__publicField(_ContinueCommand, "keyword", "continue");
var ContinueCommand = _ContinueCommand;
var _BreakCommand = class _BreakCommand extends Command {
  static parse(parser) {
    if (!parser.matchToken("break")) return;
    return new _BreakCommand();
  }
  resolve(context) {
    for (var parent = this.parent; parent; parent = parent.parent) {
      if (parent.loop != void 0) {
        return context.meta.runtime.findNext(parent.parent, context);
      }
    }
    throw new Error("Command `break` cannot be used outside of a `repeat` loop.");
  }
};
__publicField(_BreakCommand, "keyword", "break");
var BreakCommand = _BreakCommand;
var _TellCommand = class _TellCommand extends Command {
  constructor(value, body, slot) {
    super();
    this.value = value;
    this.body = body;
    this.slot = slot;
    this.args = { value };
  }
  static parse(parser) {
    var startToken = parser.currentToken();
    if (!parser.matchToken("tell")) return;
    var value = parser.requireElement("expression");
    var body = parser.requireElement("commandList");
    if (parser.hasMore() && !parser.featureStart(parser.currentToken())) {
      parser.requireToken("end");
    }
    var slot = "tell_" + startToken.start;
    var tellCmd = new _TellCommand(value, body, slot);
    parser.setParent(body, tellCmd);
    return tellCmd;
  }
  resolveNext(context) {
    var iterator = context.meta.iterators[this.slot];
    if (iterator.index < iterator.value.length) {
      context.you = iterator.value[iterator.index++];
      return this.body;
    } else {
      context.you = iterator.originalYou;
      if (this.next) {
        return this.next;
      } else {
        return context.meta.runtime.findNext(this.parent, context);
      }
    }
  }
  resolve(context, { value }) {
    if (value == null) {
      value = [];
    } else if (!(Array.isArray(value) || value instanceof NodeList)) {
      value = [value];
    }
    context.meta.iterators[this.slot] = {
      originalYou: context.you,
      index: 0,
      value
    };
    return this.resolveNext(context);
  }
};
__publicField(_TellCommand, "keyword", "tell");
var TellCommand = _TellCommand;

// src/parsetree/commands/execution.js
var execution_exports = {};
__export(execution_exports, {
  GetCommand: () => GetCommand,
  JsBody: () => JsBody,
  JsCommand: () => JsCommand
});
var _JsBody = class _JsBody {
  constructor(jsSource, exposedFunctionNames) {
    this.type = "jsBody";
    this.jsSource = jsSource;
    this.exposedFunctionNames = exposedFunctionNames;
  }
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
    return new _JsBody(
      parser.source.substring(jsSourceStart, jsSourceEnd),
      funcNames
    );
  }
};
__publicField(_JsBody, "grammarName", "jsBody");
var JsBody = _JsBody;
var _JsCommand = class _JsCommand extends Command {
  constructor(jsSource, func, inputs) {
    super();
    this.jsSource = jsSource;
    this.function = func;
    this.inputs = inputs;
  }
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
    var func = new Function(...inputs, jsBody.jsSource);
    return new _JsCommand(jsBody.jsSource, func, inputs);
  }
  resolve(context) {
    var args = [];
    this.inputs.forEach((input) => {
      args.push(context.meta.runtime.resolveSymbol(input, context, "default"));
    });
    var result = this.function.apply(context.meta.runtime.globalScope, args);
    if (result && typeof result.then === "function") {
      return new Promise((resolve, reject) => {
        result.then((actualResult) => {
          context.result = actualResult;
          resolve(context.meta.runtime.findNext(this, context));
        }, reject);
      });
    } else {
      context.result = result;
      return context.meta.runtime.findNext(this, context);
    }
  }
};
__publicField(_JsCommand, "keyword", "js");
var JsCommand = _JsCommand;
var _GetCommand = class _GetCommand extends Command {
  constructor(expr) {
    super();
    this.expr = expr;
    this.args = { result: expr };
  }
  static parse(parser) {
    var isCall = parser.matchToken("call");
    if (!isCall && !parser.matchToken("get")) return;
    var expr = parser.requireElement("expression");
    if (isCall && expr && expr.type !== "functionCall") {
      parser.raiseParseError("Must be a function invocation");
    }
    return new _GetCommand(expr);
  }
  resolve(context, { result }) {
    context.result = result;
    return context.meta.runtime.findNext(this, context);
  }
};
__publicField(_GetCommand, "keyword", ["get", "call"]);
var GetCommand = _GetCommand;

// src/parsetree/commands/pseudoCommand.js
var pseudoCommand_exports = {};
__export(pseudoCommand_exports, {
  PseudoCommand: () => PseudoCommand
});
var _PseudoCommand = class _PseudoCommand extends Command {
  constructor(variant, expr, realRoot, root) {
    super();
    this.variant = variant;
    this.expr = expr;
    this._root = root;
    this._realRoot = realRoot;
    if (variant === "target") {
      this.root = realRoot;
      this.argExpressions = root.argExpressions;
      this.args = { target: realRoot, argVals: root.argExpressions };
    } else {
      this.args = { result: expr };
    }
  }
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
      return new _PseudoCommand("target", expr, realRoot, root);
    } else {
      return new _PseudoCommand("simple", expr, null, null);
    }
  }
  resolve(context, { target, argVals, result }) {
    if (this.variant === "target") {
      context.meta.runtime.nullCheck(target, this._realRoot);
      var func = target[this._root.root.name];
      context.meta.runtime.nullCheck(func, this._root);
      if (func.hyperfunc) {
        argVals.push(context);
      }
      context.result = func.apply(target, argVals);
    } else {
      context.result = result;
    }
    return context.meta.runtime.findNext(this, context);
  }
};
__publicField(_PseudoCommand, "grammarName", "pseudoCommand");
var PseudoCommand = _PseudoCommand;

// src/parsetree/commands/dom.js
var dom_exports = {};
__export(dom_exports, {
  AddCommand: () => AddCommand,
  AnswerCommand: () => AnswerCommand,
  AskCommand: () => AskCommand,
  BlurCommand: () => BlurCommand,
  CloseCommand: () => CloseCommand,
  EmptyCommand: () => EmptyCommand,
  FocusCommand: () => FocusCommand,
  HideCommand: () => HideCommand,
  MeasureCommand: () => MeasureCommand,
  OpenCommand: () => OpenCommand,
  RemoveCommand: () => RemoveCommand,
  SelectCommand: () => SelectCommand,
  ShowCommand: () => ShowCommand,
  SpeakCommand: () => SpeakCommand,
  TakeCommand: () => TakeCommand,
  ToggleCommand: () => ToggleCommand
});
var HIDE_SHOW_STRATEGIES = {
  display: function(op, element, arg, runtime2) {
    if (!arg && element instanceof HTMLDialogElement) {
      if (op === "hide") element.close();
      else if (op === "show") {
        if (!element.open) element.showModal();
      } else if (op === "toggle") {
        if (element.open) element.close();
        else element.showModal();
      }
      return;
    }
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
function _cssPropertyNames(css) {
  return css.split(";").map(function(p) {
    return p.split(":")[0].trim();
  }).filter(Boolean);
}
function _removeCssProperties(elt, propNames) {
  for (var i = 0; i < propNames.length; i++) elt.style.removeProperty(propNames[i]);
}
var VisibilityCommand = class extends Command {
  static parseShowHideTarget(parser) {
    var currentTokenValue = parser.currentToken();
    if (currentTokenValue.value === "when" || currentTokenValue.value === "with" || parser.commandBoundary(currentTokenValue)) {
      return parser.parseElement("implicitMeTarget");
    } else {
      return parser.parseElement("expression");
    }
  }
  static resolveHideShowStrategy(parser, name) {
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
};
var _AddCommand = class _AddCommand extends Command {
  constructor(variant, classRefs, attributeRef, cssDeclaration, toExpr, when) {
    super();
    this.variant = variant;
    this.classRefs = classRefs;
    this.attributeRef = attributeRef;
    this.cssDeclaration = cssDeclaration;
    this.to = toExpr;
    this.toExpr = toExpr;
    this.when = when;
    if (variant === "class") {
      this.args = { to: toExpr, classRefs };
    } else if (variant === "attribute") {
      this.args = { to: toExpr };
    } else {
      this.args = { to: toExpr, css: cssDeclaration };
    }
  }
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
      var when = parser.requireElement("expression");
    }
    if (classRefs) {
      return new _AddCommand("class", classRefs, null, null, toExpr, when);
    } else if (attributeRef) {
      return new _AddCommand("attribute", null, attributeRef, null, toExpr, when);
    } else {
      return new _AddCommand("css", null, null, cssDeclaration, toExpr, null);
    }
  }
  resolve(context, { to, classRefs, css }) {
    var runtime2 = context.meta.runtime;
    var cmd = this;
    runtime2.nullCheck(to, this.toExpr);
    var result;
    if (this.variant === "class") {
      runtime2.forEach(classRefs, function(classRef) {
        if (cmd.when) {
          result = runtime2.implicitLoopWhen(
            to,
            cmd.when,
            context,
            function(t) {
              if (t instanceof Element) t.classList.add(classRef.className);
            },
            function(t) {
              if (t instanceof Element) t.classList.remove(classRef.className);
            }
          );
        } else {
          runtime2.implicitLoop(to, function(t) {
            if (t instanceof Element) t.classList.add(classRef.className);
          });
        }
      });
    } else if (this.variant === "attribute") {
      var attributeRef = this.attributeRef;
      if (this.when) {
        result = runtime2.implicitLoopWhen(
          to,
          this.when,
          context,
          function(t) {
            t.setAttribute(attributeRef.name, attributeRef.value);
          },
          function(t) {
            t.removeAttribute(attributeRef.name);
          }
        );
      } else {
        runtime2.implicitLoop(to, function(t) {
          t.setAttribute(attributeRef.name, attributeRef.value);
        });
      }
    } else {
      if (this.when) {
        var propNames = _cssPropertyNames(css);
        result = runtime2.implicitLoopWhen(
          to,
          this.when,
          context,
          function(t) {
            t.style.cssText += css;
          },
          function(t) {
            _removeCssProperties(t, propNames);
          }
        );
      } else {
        runtime2.implicitLoop(to, function(t) {
          t.style.cssText += css;
        });
      }
    }
    if (result && result.then) {
      return result.then(function() {
        return runtime2.findNext(cmd, context);
      });
    }
    return runtime2.findNext(this, context);
  }
};
__publicField(_AddCommand, "keyword", "add");
var AddCommand = _AddCommand;
var _RemoveCommand = class _RemoveCommand extends Command {
  constructor(variant, elementExpr, classRefs, attributeRef, cssDeclaration, fromExpr, when) {
    super();
    this.variant = variant;
    this.elementExpr = elementExpr;
    this.classRefs = classRefs;
    this.attributeRef = attributeRef;
    this.cssDeclaration = cssDeclaration;
    this.from = fromExpr;
    this.fromExpr = fromExpr;
    this.when = when;
    if (variant === "element") {
      this.args = { element: elementExpr, from: fromExpr };
    } else if (variant === "css") {
      this.args = { css: cssDeclaration, from: fromExpr };
    } else {
      this.args = { classRefs, from: fromExpr };
    }
  }
  static parse(parser) {
    if (!parser.matchToken("remove")) return;
    var classRef = parser.parseElement("classRef");
    var attributeRef = null;
    var cssDeclaration = null;
    var elementExpr = null;
    if (classRef == null) {
      attributeRef = parser.parseElement("attributeRef");
      if (attributeRef == null) {
        cssDeclaration = parser.parseElement("styleLiteral");
        if (cssDeclaration == null) {
          elementExpr = parser.parseElement("expression");
          if (elementExpr == null) {
            parser.raiseParseError(
              "Expected either a class reference, attribute expression or value expression"
            );
          }
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
    if (parser.matchToken("when")) {
      if (elementExpr) {
        parser.raiseParseError("'when' clause is not supported when removing elements");
      }
      var when = parser.requireElement("expression");
    }
    if (elementExpr) {
      return new _RemoveCommand("element", elementExpr, null, null, null, fromExpr);
    } else if (cssDeclaration) {
      return new _RemoveCommand("css", null, null, null, cssDeclaration, fromExpr, when);
    } else {
      return new _RemoveCommand("classOrAttr", null, classRefs, attributeRef, null, fromExpr, when);
    }
  }
  resolve(context, { element, classRefs, css, from }) {
    var runtime2 = context.meta.runtime;
    var cmd = this;
    var result;
    if (this.variant === "element") {
      runtime2.nullCheck(element, this.elementExpr);
      runtime2.implicitLoop(element, function(target) {
        if (target.parentElement && (from == null || from.contains(target))) {
          target.parentElement.removeChild(target);
        }
      });
    } else if (this.variant === "css") {
      runtime2.nullCheck(from, this.fromExpr);
      var propNames = _cssPropertyNames(css);
      runtime2.implicitLoop(from, function(target) {
        _removeCssProperties(target, propNames);
      });
    } else {
      runtime2.nullCheck(from, this.fromExpr);
      if (classRefs) {
        runtime2.forEach(classRefs, function(classRef) {
          if (cmd.when) {
            result = runtime2.implicitLoopWhen(
              from,
              cmd.when,
              context,
              function(t) {
                t.classList.remove(classRef.className);
              },
              function(t) {
                t.classList.add(classRef.className);
              }
            );
          } else {
            runtime2.implicitLoop(from, function(t) {
              t.classList.remove(classRef.className);
            });
          }
        });
      } else {
        var attributeRef = this.attributeRef;
        if (this.when) {
          result = runtime2.implicitLoopWhen(
            from,
            this.when,
            context,
            function(t) {
              t.removeAttribute(attributeRef.name);
            },
            function(t) {
              t.setAttribute(attributeRef.name, attributeRef.value);
            }
          );
        } else {
          runtime2.implicitLoop(from, function(t) {
            t.removeAttribute(attributeRef.name);
          });
        }
      }
    }
    if (result && result.then) {
      return result.then(function() {
        return runtime2.findNext(cmd, context);
      });
    }
    return runtime2.findNext(this, context);
  }
};
__publicField(_RemoveCommand, "keyword", "remove");
var RemoveCommand = _RemoveCommand;
var _ToggleCommand = class _ToggleCommand extends VisibilityCommand {
  constructor(classRef, classRef2, classRefs, attributeRef, attributeRef2, onExpr, time, evt, from, visibility, betweenClass, betweenAttr, hideShowStrategy) {
    super();
    this.classRef = classRef;
    this.classRef2 = classRef2;
    this.classRefs = classRefs;
    this.attributeRef = attributeRef;
    this.attributeRef2 = attributeRef2;
    this.on = onExpr;
    this.time = time;
    this.evt = evt;
    this.from = from;
    this.visibility = visibility;
    this.betweenClass = betweenClass;
    this.betweenAttr = betweenAttr;
    this.hideShowStrategy = hideShowStrategy;
    this.onExpr = onExpr;
    this.args = { on: onExpr, time, evt, from, classRef, classRef2, classRefs };
  }
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
      var name = styleRef.value.slice(1);
      visibility = true;
      hideShowStrategy = VisibilityCommand.resolveHideShowStrategy(parser, name);
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
      classRef = parser.parseElement("classRef");
      if (classRef != null) {
        var betweenClass = true;
        parser.requireToken("and");
        classRef2 = parser.requireElement("classRef");
      } else {
        var betweenAttr = true;
        var attributeRef = parser.parseElement("attributeRef");
        if (attributeRef == null) {
          parser.raiseParseError("Expected either a class reference or attribute expression");
        }
        parser.requireToken("and");
        var attributeRef2 = parser.requireElement("attributeRef");
      }
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
    return new _ToggleCommand(classRef, classRef2, classRefs, attributeRef, attributeRef2, onExpr, time, evt, from, visibility, betweenClass, betweenAttr, hideShowStrategy);
  }
  toggle(context, on, classRef, classRef2, classRefs) {
    context.meta.runtime.nullCheck(on, this.onExpr);
    if (this.visibility) {
      context.meta.runtime.implicitLoop(on, (target) => {
        this.hideShowStrategy("toggle", target, null, context.meta.runtime);
      });
    } else if (this.betweenClass) {
      context.meta.runtime.implicitLoop(on, (target) => {
        if (target.classList.contains(classRef.className)) {
          target.classList.remove(classRef.className);
          target.classList.add(classRef2.className);
        } else {
          target.classList.add(classRef.className);
          target.classList.remove(classRef2.className);
        }
      });
    } else if (this.betweenAttr) {
      context.meta.runtime.implicitLoop(on, (target) => {
        if (target.hasAttribute(this.attributeRef.name) && target.getAttribute(this.attributeRef.name) === this.attributeRef.value) {
          target.removeAttribute(this.attributeRef.name);
          target.setAttribute(this.attributeRef2.name, this.attributeRef2.value);
        } else {
          if (target.hasAttribute(this.attributeRef2.name)) target.removeAttribute(this.attributeRef2.name);
          target.setAttribute(this.attributeRef.name, this.attributeRef.value);
        }
      });
    } else if (classRefs) {
      context.meta.runtime.forEach(classRefs, (classRef3) => {
        context.meta.runtime.implicitLoop(on, (target) => {
          target.classList.toggle(classRef3.className);
        });
      });
    } else {
      context.meta.runtime.implicitLoop(on, (target) => {
        if (target.hasAttribute(this.attributeRef.name)) {
          target.removeAttribute(this.attributeRef.name);
        } else {
          target.setAttribute(this.attributeRef.name, this.attributeRef.value);
        }
      });
    }
  }
  resolve(context, { on, time, evt, from, classRef, classRef2, classRefs }) {
    if (time) {
      return new Promise((resolve) => {
        this.toggle(context, on, classRef, classRef2, classRefs);
        setTimeout(() => {
          this.toggle(context, on, classRef, classRef2, classRefs);
          resolve(context.meta.runtime.findNext(this, context));
        }, time);
      });
    } else if (evt) {
      return new Promise((resolve) => {
        var target = from || context.me;
        target.addEventListener(
          evt,
          () => {
            this.toggle(context, on, classRef, classRef2, classRefs);
            resolve(context.meta.runtime.findNext(this, context));
          },
          { once: true }
        );
        this.toggle(context, on, classRef, classRef2, classRefs);
      });
    } else {
      this.toggle(context, on, classRef, classRef2, classRefs);
      return context.meta.runtime.findNext(this, context);
    }
  }
};
__publicField(_ToggleCommand, "keyword", "toggle");
var ToggleCommand = _ToggleCommand;
var _HideCommand = class _HideCommand extends VisibilityCommand {
  constructor(targetExpr, when, hideShowStrategy) {
    super();
    this.target = targetExpr;
    this.targetExpr = targetExpr;
    this.when = when;
    this.hideShowStrategy = hideShowStrategy;
    this.args = { target: targetExpr };
  }
  static parse(parser) {
    if (!parser.matchToken("hide")) return;
    var targetExpr = VisibilityCommand.parseShowHideTarget(parser);
    var name = null;
    if (parser.matchToken("with")) {
      name = parser.requireTokenType("IDENTIFIER", "STYLE_REF").value;
      if (name.startsWith("*")) {
        name = name.slice(1);
      }
    }
    if (parser.matchToken("when")) {
      var when = parser.requireElement("expression");
    }
    var hideShowStrategy = VisibilityCommand.resolveHideShowStrategy(parser, name);
    return new _HideCommand(targetExpr, when, hideShowStrategy);
  }
  resolve(ctx, { target }) {
    var runtime2 = ctx.meta.runtime;
    var cmd = this;
    runtime2.nullCheck(target, this.targetExpr);
    if (this.when) {
      var result = runtime2.implicitLoopWhen(
        target,
        this.when,
        ctx,
        function(elt) {
          cmd.hideShowStrategy("hide", elt, null, runtime2);
        },
        function(elt) {
          cmd.hideShowStrategy("show", elt, null, runtime2);
        }
      );
      if (result && result.then) {
        return result.then(function() {
          return runtime2.findNext(cmd, ctx);
        });
      }
    } else {
      runtime2.implicitLoop(target, function(elt) {
        cmd.hideShowStrategy("hide", elt, null, runtime2);
      });
    }
    return runtime2.findNext(this, ctx);
  }
};
__publicField(_HideCommand, "keyword", "hide");
var HideCommand = _HideCommand;
var _ShowCommand = class _ShowCommand extends VisibilityCommand {
  constructor(targetExpr, when, arg, hideShowStrategy) {
    super();
    this.target = targetExpr;
    this.targetExpr = targetExpr;
    this.when = when;
    this.arg = arg;
    this.hideShowStrategy = hideShowStrategy;
    this.args = { target: targetExpr };
  }
  static parse(parser) {
    if (!parser.matchToken("show")) return;
    var targetExpr = VisibilityCommand.parseShowHideTarget(parser);
    var name = null;
    if (parser.matchToken("with")) {
      name = parser.requireTokenType("IDENTIFIER", "STYLE_REF").value;
      if (name.startsWith("*")) {
        name = name.slice(1);
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
    var hideShowStrategy = VisibilityCommand.resolveHideShowStrategy(parser, name);
    return new _ShowCommand(targetExpr, when, arg, hideShowStrategy);
  }
  resolve(ctx, { target }) {
    var runtime2 = ctx.meta.runtime;
    var cmd = this;
    runtime2.nullCheck(target, this.targetExpr);
    if (this.when) {
      var result = runtime2.implicitLoopWhen(
        target,
        this.when,
        ctx,
        function(elt) {
          cmd.hideShowStrategy("show", elt, cmd.arg, runtime2);
        },
        function(elt) {
          cmd.hideShowStrategy("hide", elt, null, runtime2);
        }
      );
      if (result && result.then) {
        return result.then(function() {
          return runtime2.findNext(cmd, ctx);
        });
      }
    } else {
      runtime2.implicitLoop(target, function(elt) {
        cmd.hideShowStrategy("show", elt, cmd.arg, runtime2);
      });
    }
    return runtime2.findNext(this, ctx);
  }
};
__publicField(_ShowCommand, "keyword", "show");
var ShowCommand = _ShowCommand;
var _TakeCommand = class _TakeCommand extends Command {
  constructor(variant, classRefs, attributeRef, fromExpr, forExpr, replacementValue) {
    super();
    this.variant = variant;
    this.classRefs = classRefs;
    this.attributeRef = attributeRef;
    this.from = fromExpr;
    this.fromExpr = fromExpr;
    this.forElt = forExpr;
    this.forExpr = forExpr;
    this.replacementValue = replacementValue;
    if (variant === "class") {
      this.args = { classRefs, from: fromExpr, forElt: forExpr };
    } else {
      this.args = { from: fromExpr, forElt: forExpr, replacementValue };
    }
  }
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
        return new _TakeCommand("class", classRefs, null, fromExpr, forExpr, null);
      } else {
        return new _TakeCommand("attribute", null, attributeRef, fromExpr, forExpr, replacementValue);
      }
    }
  }
  resolve(context, { classRefs, from, forElt, replacementValue }) {
    if (this.variant === "class") {
      context.meta.runtime.nullCheck(forElt, this.forExpr);
      context.meta.runtime.implicitLoop(classRefs, (classRef) => {
        var clazz = classRef.className;
        if (from) {
          context.meta.runtime.implicitLoop(from, (target) => {
            target.classList.remove(clazz);
          });
        } else {
          context.meta.runtime.implicitLoop(classRef, (target) => {
            target.classList.remove(clazz);
          });
        }
        context.meta.runtime.implicitLoop(forElt, (target) => {
          target.classList.add(clazz);
        });
      });
    } else {
      context.meta.runtime.nullCheck(from, this.fromExpr);
      context.meta.runtime.nullCheck(forElt, this.forExpr);
      context.meta.runtime.implicitLoop(from, (target) => {
        if (!replacementValue) {
          target.removeAttribute(this.attributeRef.name);
        } else {
          target.setAttribute(this.attributeRef.name, replacementValue);
        }
      });
      context.meta.runtime.implicitLoop(forElt, (target) => {
        target.setAttribute(this.attributeRef.name, this.attributeRef.value || "");
      });
    }
    return context.meta.runtime.findNext(this, context);
  }
};
__publicField(_TakeCommand, "keyword", "take");
var TakeCommand = _TakeCommand;
var _MeasureCommand = class _MeasureCommand extends Command {
  constructor(targetExpr, propsToMeasure) {
    super();
    this.properties = propsToMeasure;
    this.targetExpr = targetExpr;
    this.args = { target: targetExpr };
  }
  static parse(parser) {
    if (!parser.matchToken("measure")) return;
    var targetExpr = Command.parsePseudopossessiveTarget(parser);
    var propsToMeasure = [];
    if (!parser.commandBoundary(parser.currentToken()))
      do {
        propsToMeasure.push(parser.matchTokenType("IDENTIFIER").value);
      } while (parser.matchOpToken(","));
    return new _MeasureCommand(targetExpr, propsToMeasure);
  }
  resolve(ctx, { target }) {
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
      else throw new Error("No such measurement as " + prop);
    });
    return ctx.meta.runtime.findNext(this, ctx);
  }
};
__publicField(_MeasureCommand, "keyword", "measure");
var MeasureCommand = _MeasureCommand;
var _FocusCommand = class _FocusCommand extends Command {
  constructor(target) {
    super();
    this.args = { target };
  }
  static parse(parser) {
    if (!parser.matchToken("focus")) return;
    var target = null;
    if (!parser.commandBoundary(parser.currentToken())) {
      target = parser.requireElement("expression");
    }
    return new _FocusCommand(target);
  }
  resolve(ctx, { target }) {
    (target || ctx.me).focus();
    return ctx.meta.runtime.findNext(this, ctx);
  }
};
__publicField(_FocusCommand, "keyword", "focus");
var FocusCommand = _FocusCommand;
var _BlurCommand = class _BlurCommand extends Command {
  constructor(target) {
    super();
    this.args = { target };
  }
  static parse(parser) {
    if (!parser.matchToken("blur")) return;
    var target = null;
    if (!parser.commandBoundary(parser.currentToken())) {
      target = parser.requireElement("expression");
    }
    return new _BlurCommand(target);
  }
  resolve(ctx, { target }) {
    (target || ctx.me).blur();
    return ctx.meta.runtime.findNext(this, ctx);
  }
};
__publicField(_BlurCommand, "keyword", "blur");
var BlurCommand = _BlurCommand;
var _EmptyCommand = class _EmptyCommand extends Command {
  constructor(target) {
    super();
    this.args = { target };
  }
  static parse(parser) {
    if (!parser.matchToken("empty")) return;
    var target = null;
    if (!parser.commandBoundary(parser.currentToken())) {
      target = parser.requireElement("expression");
    }
    return new _EmptyCommand(target);
  }
  resolve(ctx, { target }) {
    var elt = target || ctx.me;
    ctx.meta.runtime.implicitLoop(elt, function(e) {
      while (e.firstChild) e.removeChild(e.firstChild);
    });
    return ctx.meta.runtime.findNext(this, ctx);
  }
};
__publicField(_EmptyCommand, "keyword", "empty");
var EmptyCommand = _EmptyCommand;
function _openElement(elt) {
  if (elt instanceof HTMLDialogElement) {
    if (!elt.open) elt.showModal();
  } else if (elt instanceof HTMLDetailsElement) {
    elt.open = true;
  } else if (elt.hasAttribute && elt.hasAttribute("popover")) {
    elt.showPopover();
  } else if (typeof elt.open === "function") {
    elt.open();
  }
}
function _closeElement(elt) {
  if (elt instanceof HTMLDialogElement) {
    elt.close();
  } else if (elt instanceof HTMLDetailsElement) {
    elt.open = false;
  } else if (elt.hasAttribute && elt.hasAttribute("popover")) {
    elt.hidePopover();
  } else if (typeof elt.close === "function") {
    elt.close();
  }
}
var _OpenCommand = class _OpenCommand extends Command {
  constructor(target, fullscreen) {
    super();
    this.fullscreen = fullscreen;
    this.args = { target };
  }
  static parse(parser) {
    if (!parser.matchToken("open")) return;
    var fullscreen = parser.matchToken("fullscreen");
    var target = null;
    if (!parser.commandBoundary(parser.currentToken())) {
      target = parser.requireElement("expression");
    }
    return new _OpenCommand(target, !!fullscreen);
  }
  resolve(ctx, { target }) {
    var elt = target || ctx.me;
    if (this.fullscreen) {
      return elt.requestFullscreen().then(() => {
        return ctx.meta.runtime.findNext(this, ctx);
      });
    }
    ctx.meta.runtime.implicitLoop(elt, _openElement);
    return ctx.meta.runtime.findNext(this, ctx);
  }
};
__publicField(_OpenCommand, "keyword", "open");
var OpenCommand = _OpenCommand;
var _CloseCommand = class _CloseCommand extends Command {
  constructor(target, fullscreen) {
    super();
    this.fullscreen = fullscreen;
    this.args = { target };
  }
  static parse(parser) {
    if (!parser.matchToken("close")) return;
    var fullscreen = parser.matchToken("fullscreen");
    var target = null;
    if (!parser.commandBoundary(parser.currentToken())) {
      target = parser.requireElement("expression");
    }
    return new _CloseCommand(target, !!fullscreen);
  }
  resolve(ctx, { target }) {
    if (this.fullscreen) {
      return document.exitFullscreen().then(() => {
        return ctx.meta.runtime.findNext(this, ctx);
      });
    }
    var elt = target || ctx.me;
    ctx.meta.runtime.implicitLoop(elt, _closeElement);
    return ctx.meta.runtime.findNext(this, ctx);
  }
};
__publicField(_CloseCommand, "keyword", "close");
var CloseCommand = _CloseCommand;
var _SpeakCommand = class _SpeakCommand extends Command {
  constructor(text, voice, rate, pitch, volume) {
    super();
    this.voice = voice;
    this.rate = rate;
    this.pitch = pitch;
    this.volume = volume;
    this.args = { text, voice, rate, pitch, volume };
  }
  static parse(parser) {
    if (!parser.matchToken("speak")) return;
    var text = parser.requireElement("expression");
    var voice = null, rate = null, pitch = null, volume = null;
    while (parser.matchToken("with")) {
      if (parser.matchToken("voice")) {
        voice = parser.requireElement("expression");
      } else if (parser.matchToken("rate")) {
        rate = parser.requireElement("expression");
      } else if (parser.matchToken("pitch")) {
        pitch = parser.requireElement("expression");
      } else if (parser.matchToken("volume")) {
        volume = parser.requireElement("expression");
      } else {
        parser.raiseParseError("Expected voice, rate, pitch, or volume");
      }
    }
    return new _SpeakCommand(text, voice, rate, pitch, volume);
  }
  resolve(ctx, { text, voice, rate, pitch, volume }) {
    var utterance = new SpeechSynthesisUtterance(String(text));
    if (voice) {
      var voices = speechSynthesis.getVoices();
      var match = voices.find((v) => v.name === voice);
      if (match) utterance.voice = match;
    }
    if (rate != null) utterance.rate = rate;
    if (pitch != null) utterance.pitch = pitch;
    if (volume != null) utterance.volume = volume;
    var cmd = this;
    return new Promise(function(resolve) {
      utterance.onend = function() {
        resolve(ctx.meta.runtime.findNext(cmd, ctx));
      };
      speechSynthesis.speak(utterance);
    });
  }
};
__publicField(_SpeakCommand, "keyword", "speak");
var SpeakCommand = _SpeakCommand;
var _SelectCommand = class _SelectCommand extends Command {
  constructor(target) {
    super();
    this.args = { target };
  }
  static parse(parser) {
    if (!parser.matchToken("select")) return;
    var target = null;
    if (!parser.commandBoundary(parser.currentToken())) {
      target = parser.requireElement("expression");
    }
    return new _SelectCommand(target);
  }
  resolve(ctx, { target }) {
    var elt = target || ctx.me;
    if (typeof elt.select === "function") elt.select();
    return ctx.meta.runtime.findNext(this, ctx);
  }
};
__publicField(_SelectCommand, "keyword", "select");
var SelectCommand = _SelectCommand;
var _AskCommand = class _AskCommand extends Command {
  constructor(message) {
    super();
    this.args = { message };
  }
  static parse(parser) {
    if (!parser.matchToken("ask")) return;
    var message = parser.requireElement("expression");
    return new _AskCommand(message);
  }
  resolve(ctx, { message }) {
    ctx.result = prompt(String(message));
    return ctx.meta.runtime.findNext(this, ctx);
  }
};
__publicField(_AskCommand, "keyword", "ask");
var AskCommand = _AskCommand;
var _AnswerCommand = class _AnswerCommand extends Command {
  constructor(message, choiceA, choiceB) {
    super();
    this.choiceA = choiceA;
    this.choiceB = choiceB;
    this.args = { message, choiceA, choiceB };
  }
  static parse(parser) {
    if (!parser.matchToken("answer")) return;
    var message = parser.requireElement("expression");
    var choiceA = null, choiceB = null;
    if (parser.matchToken("with")) {
      parser.pushFollow("or");
      try {
        choiceA = parser.requireElement("expression");
      } finally {
        parser.popFollow();
      }
      parser.requireToken("or");
      choiceB = parser.requireElement("expression");
    }
    return new _AnswerCommand(message, choiceA, choiceB);
  }
  resolve(ctx, { message, choiceA, choiceB }) {
    if (choiceA) {
      ctx.result = confirm(String(message)) ? choiceA : choiceB;
    } else {
      alert(String(message));
    }
    return ctx.meta.runtime.findNext(this, ctx);
  }
};
__publicField(_AnswerCommand, "keyword", "answer");
var AnswerCommand = _AnswerCommand;

// src/parsetree/commands/animations.js
var animations_exports = {};
__export(animations_exports, {
  SettleCommand: () => SettleCommand,
  TransitionCommand: () => TransitionCommand
});
var StyleRefValue = class extends Expression {
  constructor(styleProp) {
    super();
    this.type = "styleRefValue";
    this.styleProp = styleProp;
  }
  evaluate(context) {
    return this.styleProp;
  }
};
var InitialLiteral = class extends Expression {
  constructor() {
    super();
    this.type = "initial_literal";
  }
  evaluate(context) {
    return "initial";
  }
};
var _SettleCommand = class _SettleCommand extends Command {
  constructor(onExpr) {
    super();
    this.onExpr = onExpr;
    this.args = { on: onExpr };
  }
  static parse(parser) {
    if (parser.matchToken("settle")) {
      if (!parser.commandBoundary(parser.currentToken())) {
        var onExpr = parser.requireElement("expression");
      } else {
        var onExpr = parser.requireElement("implicitMeTarget");
      }
      return new _SettleCommand(onExpr);
    }
  }
  resolve(context, { on }) {
    context.meta.runtime.nullCheck(on, this.onExpr);
    var cmd = this;
    var elements = on instanceof Element ? [on] : Array.from(on);
    return Promise.all(elements.map(_settleOne)).then(function() {
      return context.meta.runtime.findNext(cmd, context);
    });
  }
};
__publicField(_SettleCommand, "keyword", "settle");
var SettleCommand = _SettleCommand;
function _settleOne(elt) {
  return new Promise(function(resolve) {
    var resolved = false;
    var transitionStarted = false;
    elt.addEventListener("transitionstart", function() {
      transitionStarted = true;
    }, { once: true });
    setTimeout(function() {
      if (!transitionStarted && !resolved) {
        resolved = true;
        resolve();
      }
    }, 500);
    elt.addEventListener("transitionend", function() {
      if (!resolved) {
        resolved = true;
        resolve();
      }
    }, { once: true });
  });
}
var _TransitionCommand = class _TransitionCommand extends Command {
  constructor(targetsExpr, to, properties, from, usingExpr, over) {
    super();
    this.to = to;
    this.targetsExpr = targetsExpr;
    this.properties = properties;
    this.from = from;
    this.usingExpr = usingExpr;
    this.over = over;
    this.args = { targets: targetsExpr, properties, from, to, using: usingExpr, over };
  }
  static parse(parser) {
    if (parser.matchToken("transition")) {
      var targetsExpr = Command.parsePseudopossessiveTarget(parser);
      var properties = [];
      var from = [];
      var to = [];
      var currentToken = parser.currentToken();
      var _tLoopGuard = 0;
      while (!parser.commandBoundary(currentToken) && currentToken.value !== "over" && currentToken.value !== "using") {
        if (++_tLoopGuard > 50) {
          console.error("HANG: transition parse loop, token:", currentToken);
          debugger;
        }
        if (parser.currentToken().type === "STYLE_REF") {
          let styleRef = parser.consumeToken();
          let styleProp = styleRef.value.slice(1);
          properties.push(new StyleRefValue(styleProp));
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
          to.push(new InitialLiteral());
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
      return new _TransitionCommand(targetsExpr, to, properties, from, usingExpr, over);
    }
  }
  resolve(context, { targets, properties, from, to, using, over }) {
    context.meta.runtime.nullCheck(targets, this.targetsExpr);
    var promises = [];
    context.meta.runtime.implicitLoop(targets, (target) => {
      var promise = new Promise((resolve, reject) => {
        var initialTransition = target.style.transition;
        if (over) {
          target.style.transition = "all " + over + "ms ease-in";
        } else if (using) {
          target.style.transition = using;
        } else {
          target.style.transition = config.defaultTransition;
        }
        var internalData = context.meta.runtime.getInternalData(target);
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
        for (var i = 0; i < properties.length; i++) {
          var property = properties[i];
          var fromVal = from[i];
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
          () => {
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
          () => {
            transitionStarted = true;
          },
          { once: true }
        );
        setTimeout(() => {
          if (!resolved && !transitionStarted) {
            target.style.transition = initialTransition;
            resolved = true;
            resolve();
          }
        }, 100);
        setTimeout(() => {
          var autoProps = [];
          for (var i2 = 0; i2 < properties.length; i2++) {
            var property2 = properties[i2];
            var toVal = to[i2];
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
    return Promise.all(promises).then(() => {
      return context.meta.runtime.findNext(this, context);
    });
  }
};
__publicField(_TransitionCommand, "keyword", "transition");
var TransitionCommand = _TransitionCommand;

// src/parsetree/commands/debug.js
var debug_exports = {};
__export(debug_exports, {
  BreakpointCommand: () => BreakpointCommand
});
var _BreakpointCommand = class _BreakpointCommand extends Command {
  static parse(parser) {
    if (!parser.matchToken("breakpoint")) return;
    return new _BreakpointCommand();
  }
  resolve(ctx) {
    debugger;
    return ctx.meta.runtime.findNext(this, ctx);
  }
};
__publicField(_BreakpointCommand, "keyword", "breakpoint");
var BreakpointCommand = _BreakpointCommand;

// src/parsetree/features/on.js
var on_exports = {};
__export(on_exports, {
  OnFeature: () => OnFeature
});
var _OnFeature = class _OnFeature extends Feature {
  constructor(displayName, events, start, every, errorHandler, errorSymbol, finallyHandler, queueAll, queueFirst, queueNone, queueLast) {
    super();
    this.displayName = displayName;
    this.events = events;
    this.start = start;
    this.every = every;
    this.errorHandler = errorHandler;
    this.errorSymbol = errorSymbol;
    this.finallyHandler = finallyHandler;
    this.queueAll = queueAll;
    this.queueFirst = queueFirst;
    this.queueNone = queueNone;
    this.queueLast = queueLast;
  }
  execute(ctx) {
    const onFeature = this;
    const every = this.every;
    const queueNone = this.queueNone;
    const queueFirst = this.queueFirst;
    const queueLast = this.queueLast;
    const start = this.start;
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
  }
  install(elt, source, args, runtime2) {
    const onFeature = this;
    const displayName = this.displayName;
    const errorHandler = this.errorHandler;
    const errorSymbol = this.errorSymbol;
    const finallyHandler = this.finallyHandler;
    for (const eventSpec of onFeature.events) {
      var targets;
      if (eventSpec.elsewhere) {
        targets = [document];
      } else if (eventSpec.from) {
        targets = eventSpec.from.evaluate(runtime2.makeContext(elt, onFeature, elt, null));
      } else {
        targets = [elt];
      }
      var internalData = runtime2.getInternalData(elt);
      if (!internalData.eventState) internalData.eventState = /* @__PURE__ */ new Map();
      if (!internalData.eventState.has(eventSpec)) {
        internalData.eventState.set(eventSpec, { execCount: 0, debounced: void 0, lastExec: void 0 });
      }
      var eventState = internalData.eventState.get(eventSpec);
      runtime2.implicitLoop(targets, function(target) {
        var eventName = eventSpec.on;
        if (target == null) {
          console.warn("'%s' feature ignored because target does not exists:", displayName, elt);
          return;
        }
        var eltData = runtime2.getInternalData(elt);
        if (!eltData.listeners) eltData.listeners = [];
        if (!eltData.observers) eltData.observers = [];
        if (eventSpec.mutationSpec) {
          eventName = "hyperscript:mutation";
          const observer = new MutationObserver(function(mutationList, observer2) {
            if (!onFeature.executing) {
              runtime2.triggerEvent(target, eventName, {
                mutationList,
                observer: observer2
              });
            }
          });
          observer.observe(target, eventSpec.mutationSpec);
          eltData.observers.push(observer);
        }
        if (eventSpec.intersectionSpec) {
          eventName = "hyperscript:intersection";
          const observer = new IntersectionObserver(function(entries) {
            for (const entry of entries) {
              var detail = {
                observer
              };
              detail = Object.assign(detail, entry);
              detail["intersecting"] = entry.isIntersecting;
              runtime2.triggerEvent(target, eventName, detail);
            }
          }, eventSpec.intersectionSpec);
          observer.observe(target);
          eltData.observers.push(observer);
        }
        if (eventSpec.resizeSpec) {
          eventName = "hyperscript:resize";
          const observer = new ResizeObserver(function(entries) {
            for (const entry of entries) {
              var detail = {
                width: entry.contentRect.width,
                height: entry.contentRect.height,
                contentRect: entry.contentRect,
                entry
              };
              runtime2.triggerEvent(target, eventName, detail);
            }
          });
          observer.observe(target);
          eltData.observers.push(observer);
        }
        var addEventListener = target.addEventListener || target.on;
        var handler;
        addEventListener.call(target, eventName, handler = function listener(evt) {
          if (typeof Node !== "undefined" && elt instanceof Node && target !== elt && !elt.isConnected) {
            target.removeEventListener(eventName, listener);
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
            } else if (ctx.event.detail != null) {
              ctx.locals[arg.value] = ctx.event.detail[arg.value];
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
          eventState.execCount++;
          if (eventSpec.startCount) {
            if (eventSpec.endCount) {
              if (eventState.execCount < eventSpec.startCount || eventState.execCount > eventSpec.endCount) {
                return;
              }
            } else if (eventSpec.unbounded) {
              if (eventState.execCount < eventSpec.startCount) {
                return;
              }
            } else if (eventState.execCount !== eventSpec.startCount) {
              return;
            }
          }
          if (eventSpec.debounceTime) {
            if (eventState.debounced) {
              clearTimeout(eventState.debounced);
            }
            eventState.debounced = setTimeout(function() {
              onFeature.execute(ctx);
            }, eventSpec.debounceTime);
            return;
          }
          if (eventSpec.throttleTime) {
            if (eventState.lastExec && Date.now() < eventState.lastExec + eventSpec.throttleTime) {
              return;
            } else {
              eventState.lastExec = Date.now();
            }
          }
          onFeature.execute(ctx);
        });
        eltData.listeners.push({ target, event: eventName, handler });
      });
    }
  }
  static parse(parser) {
    if (!parser.matchToken("on")) return;
    var every = false;
    var first = false;
    if (parser.matchToken("every")) {
      every = true;
    } else if (parser.matchToken("first")) {
      first = true;
    }
    var events = [];
    var displayName = null;
    do {
      var on = parser.requireElement("eventName", "Expected event name");
      var eventName = on.evalStatically();
      if (displayName) {
        displayName = displayName + " or " + eventName;
      } else {
        displayName = "on " + eventName;
      }
      var args = ParseElement.parseEventArgs(parser);
      var filter = null;
      if (parser.matchOpToken("[")) {
        filter = parser.requireElement("expression");
        parser.requireOpToken("]");
      }
      var startCount, endCount, unbounded;
      if (first) {
        startCount = 1;
      } else if (parser.currentToken().type === "NUMBER") {
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
      var intersectionSpec, mutationSpec, resizeSpec;
      if (eventName === "resize") {
        resizeSpec = true;
      } else if (eventName === "intersection") {
        intersectionSpec = {};
        if (parser.matchToken("with")) {
          intersectionSpec["with"] = parser.requireElement("expression").evalStatically();
        }
        if (parser.matchToken("having")) {
          do {
            if (parser.matchToken("margin")) {
              intersectionSpec["rootMargin"] = parser.requireElement("stringLike").evalStatically();
            } else if (parser.matchToken("threshold")) {
              intersectionSpec["threshold"] = parser.requireElement("expression").evalStatically();
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
            } else if (parser.matchToken("subtree")) {
              mutationSpec["subtree"] = true;
            } else if (parser.matchToken("characterData")) {
              mutationSpec["characterData"] = true;
            } else if (parser.currentToken().type === "ATTRIBUTE_REF") {
              var attribute = parser.consumeToken();
              if (mutationSpec["attributeFilter"] == null) {
                mutationSpec["attributeFilter"] = [];
              }
              if (attribute.value.startsWith("@")) {
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
          if (mutationSpec["attributes"] || mutationSpec["attributeFilter"]) {
            mutationSpec["attributeOldValue"] = true;
          }
          if (mutationSpec["characterData"]) {
            mutationSpec["characterDataOldValue"] = true;
          }
        } else {
          mutationSpec["attributes"] = true;
          mutationSpec["characterData"] = true;
          mutationSpec["childList"] = true;
          mutationSpec["attributeOldValue"] = true;
          mutationSpec["characterDataOldValue"] = true;
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
        var debounceTime = timeExpr.evalStatically();
      } else if (parser.matchToken("throttled")) {
        parser.requireToken("at");
        var timeExpr = parser.requireElement("unaryExpression");
        var throttleTime = timeExpr.evalStatically();
      }
      events.push({
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
        resizeSpec
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
    var { errorHandler, errorSymbol, finallyHandler } = Feature.parseErrorAndFinally(parser);
    var onFeature = new _OnFeature(displayName, events, start, every, errorHandler, errorSymbol, finallyHandler, queueAll, queueFirst, queueNone, queueLast);
    parser.setParent(start, onFeature);
    return onFeature;
  }
};
__publicField(_OnFeature, "keyword", "on");
var OnFeature = _OnFeature;

// src/parsetree/features/def.js
var def_exports = {};
__export(def_exports, {
  DefFeature: () => DefFeature
});
var _DefFeature = class _DefFeature extends Feature {
  constructor(funcName, nameSpace, nameVal, args, start, errorHandler, errorSymbol, finallyHandler) {
    super();
    this.displayName = funcName + "(" + args.map(function(arg) {
      return arg.value;
    }).join(", ") + ")";
    this.name = funcName;
    this.args = args;
    this.start = start;
    this.errorHandler = errorHandler;
    this.errorSymbol = errorSymbol;
    this.finallyHandler = finallyHandler;
    this.nameSpace = nameSpace;
    this.nameVal = nameVal;
  }
  install(target, source, funcArgs, runtime2) {
    const args = this.args;
    const start = this.start;
    const errorHandler = this.errorHandler;
    const errorSymbol = this.errorSymbol;
    const finallyHandler = this.finallyHandler;
    const nameVal = this.nameVal;
    const nameSpace = this.nameSpace;
    const funcName = this.name;
    const functionFeature = this;
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
  static parse(parser) {
    if (!parser.matchToken("def")) return;
    var functionName = parser.requireElement("dotOrColonPath");
    var nameVal = functionName.evalStatically();
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
    var { errorHandler, errorSymbol, finallyHandler } = Feature.parseErrorAndFinally(parser);
    var functionFeature = new _DefFeature(funcName, nameSpace, nameVal, args, start, errorHandler, errorSymbol, finallyHandler);
    parser.ensureTerminated(start);
    if (errorHandler) {
      parser.ensureTerminated(errorHandler);
    }
    parser.setParent(start, functionFeature);
    return functionFeature;
  }
};
__publicField(_DefFeature, "keyword", "def");
var DefFeature = _DefFeature;

// src/parsetree/features/set.js
var set_exports = {};
__export(set_exports, {
  SetFeature: () => SetFeature
});
var _SetFeature = class _SetFeature extends Feature {
  constructor(setCmd) {
    super();
    this.start = setCmd;
  }
  install(target, source, args, runtime2) {
    this.start && this.start.execute(runtime2.makeContext(target, this, target, null));
  }
  static parse(parser) {
    let setCmd = parser.parseElement("setCommand");
    if (setCmd) {
      if (setCmd.target.scope !== "element") {
        parser.raiseParseError("variables declared at the feature level must be element scoped.");
      }
      let setFeature = new _SetFeature(setCmd);
      parser.ensureTerminated(setCmd);
      return setFeature;
    }
  }
};
__publicField(_SetFeature, "keyword", "set");
var SetFeature = _SetFeature;

// src/parsetree/features/init.js
var init_exports = {};
__export(init_exports, {
  InitFeature: () => InitFeature
});
var _InitFeature = class _InitFeature extends Feature {
  constructor(start, immediately) {
    super();
    this.start = start;
    this.immediately = immediately;
  }
  install(target, source, args, runtime2) {
    var feature = this;
    var handler = function() {
      feature.start && feature.start.execute(runtime2.makeContext(target, feature, target, null));
    };
    if (this.immediately) {
      handler();
    } else {
      queueMicrotask(handler);
    }
  }
  static parse(parser) {
    if (!parser.matchToken("init")) return;
    var immediately = parser.matchToken("immediately");
    var start = parser.requireElement("commandList");
    var initFeature = new _InitFeature(start, immediately);
    parser.ensureTerminated(start);
    parser.setParent(start, initFeature);
    return initFeature;
  }
};
__publicField(_InitFeature, "keyword", "init");
var InitFeature = _InitFeature;

// src/parsetree/features/worker.js
var worker_exports = {};
__export(worker_exports, {
  WorkerFeature: () => WorkerFeature
});
var WorkerFeature = class extends Feature {
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
var behavior_exports = {};
__export(behavior_exports, {
  BehaviorFeature: () => BehaviorFeature
});
var _BehaviorFeature = class _BehaviorFeature extends Feature {
  constructor(path, nameSpace, name, formalParams, hs) {
    super();
    this.path = path;
    this.nameSpace = nameSpace;
    this.name = name;
    this.formalParams = formalParams;
    this.hs = hs;
  }
  install(target, source, args, runtime2) {
    const path = this.path;
    const nameSpace = this.nameSpace;
    const name = this.name;
    const formalParams = this.formalParams;
    const hs = this.hs;
    runtime2.assignToNamespace(
      null,
      nameSpace,
      name,
      function(target2, source2, innerArgs) {
        var internalData = runtime2.getInternalData(target2);
        var scopeName = path + "Scope";
        var elementScope = internalData[scopeName] || (internalData[scopeName] = {});
        for (var i = 0; i < formalParams.length; i++) {
          elementScope[formalParams[i]] = innerArgs[formalParams[i]];
        }
        hs.apply(target2, source2, null, runtime2);
      }
    );
  }
  static parse(parser) {
    if (!parser.matchToken("behavior")) return;
    var path = parser.requireElement("dotOrColonPath").evalStatically();
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
    return new _BehaviorFeature(path, nameSpace, name, formalParams, hs);
  }
};
__publicField(_BehaviorFeature, "keyword", "behavior");
var BehaviorFeature = _BehaviorFeature;

// src/parsetree/features/install.js
var install_exports = {};
__export(install_exports, {
  InstallFeature: () => InstallFeature
});
var _InstallFeature = class _InstallFeature extends Feature {
  constructor(behaviorPath, behaviorNamespace, args) {
    super();
    this.behaviorPath = behaviorPath;
    this.behaviorNamespace = behaviorNamespace;
    this.behaviorArgs = args;
  }
  install(target, source, installArgs, runtime2) {
    var ctx = runtime2.makeContext(target, this, target, null);
    var behaviorArgs = this.behaviorArgs ? this.behaviorArgs.evaluate(ctx) : null;
    var behavior = runtime2.globalScope;
    for (var i = 0; i < this.behaviorNamespace.length; i++) {
      behavior = behavior[this.behaviorNamespace[i]];
      if (typeof behavior !== "object" && typeof behavior !== "function")
        throw new Error("No such behavior defined as " + this.behaviorPath);
    }
    if (!(behavior instanceof Function))
      throw new Error(this.behaviorPath + " is not a behavior");
    behavior(target, source, behaviorArgs);
  }
  static parse(parser) {
    if (!parser.matchToken("install")) return;
    var behaviorPath = parser.requireElement("dotOrColonPath").evalStatically();
    var behaviorNamespace = behaviorPath.split(".");
    var args = parser.parseElement("namedArgumentList");
    return new _InstallFeature(behaviorPath, behaviorNamespace, args);
  }
};
__publicField(_InstallFeature, "keyword", "install");
var InstallFeature = _InstallFeature;

// src/parsetree/features/js.js
var js_exports = {};
__export(js_exports, {
  JsFeature: () => JsFeature
});
var _JsFeature = class _JsFeature extends Feature {
  constructor(jsSource, func, exposedFunctionNames) {
    super();
    this.jsSource = jsSource;
    this.function = func;
    this.exposedFunctionNames = exposedFunctionNames;
  }
  install(target, source, args, runtime2) {
    Object.assign(runtime2.globalScope, this.function());
  }
  static parse(parser) {
    if (!parser.matchToken("js")) return;
    var jsBody = parser.requireElement("jsBody");
    var jsSource = jsBody.jsSource + "\nreturn { " + jsBody.exposedFunctionNames.map(function(name) {
      return name + ":" + name;
    }).join(",") + " } ";
    var func = new Function(jsSource);
    return new _JsFeature(jsSource, func, jsBody.exposedFunctionNames);
  }
};
__publicField(_JsFeature, "keyword", "js");
var JsFeature = _JsFeature;

// src/parsetree/features/when.js
var when_exports = {};
__export(when_exports, {
  WhenFeature: () => WhenFeature
});
var _WhenFeature = class _WhenFeature extends Feature {
  /**
   * Parse when feature
   * @param {Parser} parser
   * @returns {WhenFeature | undefined}
   */
  static parse(parser) {
    if (!parser.matchToken("when")) return;
    var exprs = [];
    do {
      parser.pushFollow("or");
      try {
        exprs.push(parser.requireElement("expression"));
      } finally {
        parser.popFollow();
      }
    } while (parser.matchToken("or"));
    for (var i = 0; i < exprs.length; i++) {
      var expr = exprs[i];
      if (expr.type === "symbol" && expr.scope === "default" && !expr.name.startsWith("$") && !expr.name.startsWith(":")) {
        parser.raiseParseError(
          "Cannot watch local variable '" + expr.name + "'. Local variables are not reactive. Use '$" + expr.name + "' (global) or ':" + expr.name + "' (element-scoped) instead."
        );
      }
    }
    parser.requireToken("changes");
    var start = parser.requireElement("commandList");
    parser.ensureTerminated(start);
    var feature = new _WhenFeature(exprs, start);
    parser.setParent(start, feature);
    return feature;
  }
  constructor(exprs, start) {
    super();
    this.exprs = exprs;
    this.start = start;
    this.displayName = "when ... changes";
  }
  install(target, source, args, runtime2) {
    var feature = this;
    queueMicrotask(function() {
      for (var i = 0; i < feature.exprs.length; i++) {
        (function(expr) {
          reactivity.createEffect(
            function() {
              return expr.evaluate(
                runtime2.makeContext(target, feature, target, null)
              );
            },
            function(newValue) {
              var ctx = runtime2.makeContext(target, feature, target, null);
              ctx.result = newValue;
              ctx.meta.reject = function(err) {
                console.error(err.message ? err.message : err);
                runtime2.triggerEvent(target, "exception", { error: err });
              };
              ctx.meta.onHalt = function() {
              };
              feature.start.execute(ctx);
            },
            { element: target }
          );
        })(feature.exprs[i]);
      }
    });
  }
};
__publicField(_WhenFeature, "keyword", "when");
var WhenFeature = _WhenFeature;

// src/parsetree/features/bind.js
var bind_exports = {};
__export(bind_exports, {
  BindFeature: () => BindFeature
});
var _BindFeature = class _BindFeature extends Feature {
  /**
   * Parse bind feature
   * @param {Parser} parser
   * @returns {BindFeature | undefined}
   */
  static parse(parser) {
    if (!parser.matchToken("bind")) return;
    parser.pushFollow("and");
    parser.pushFollow("with");
    parser.pushFollow("to");
    var left;
    try {
      left = parser.requireElement("expression");
    } finally {
      parser.popFollow();
      parser.popFollow();
      parser.popFollow();
    }
    var right = null;
    if (parser.matchToken("and") || parser.matchToken("with") || parser.matchToken("to")) {
      right = parser.requireElement("expression");
    }
    if (!_isAssignable(left)) {
      parser.raiseParseError("bind requires a writable expression, but '" + left.type + "' cannot be assigned to");
    }
    if (right && !_isAssignable(right)) {
      parser.raiseParseError("bind requires a writable expression, but '" + right.type + "' cannot be assigned to");
    }
    return new _BindFeature(left, right);
  }
  constructor(left, right) {
    super();
    this.left = left;
    this.right = right;
    this.displayName = right ? "bind ... and ..." : "bind (shorthand)";
  }
  install(target, source, args, runtime2) {
    var feature = this;
    queueMicrotask(function() {
      if (feature.right) {
        _twoWayBind(feature.left, feature.right, target, feature, runtime2);
      } else {
        _shorthandBind(feature.left, target, feature, runtime2);
      }
    });
  }
};
__publicField(_BindFeature, "keyword", "bind");
var BindFeature = _BindFeature;
function _registerListener(runtime2, elt, listenerTarget, event, handler) {
  var eltData = runtime2.getInternalData(elt);
  if (!eltData.listeners) eltData.listeners = [];
  eltData.listeners.push({ target: listenerTarget, event, handler });
}
function _isAssignable(expr) {
  if (expr.type === "classRef") return true;
  if (expr.type === "attributeRef") return true;
  return typeof expr.set === "function";
}
function _twoWayBind(left, right, target, feature, runtime2) {
  function read(expr) {
    if (expr.type === "classRef") {
      runtime2.resolveAttribute(target, "class");
      return target.classList.contains(expr.className);
    }
    return expr.evaluate(runtime2.makeContext(target, feature, target, null));
  }
  reactivity.createEffect(
    function() {
      return read(left);
    },
    function(newValue) {
      var ctx = runtime2.makeContext(target, feature, target, null);
      _assignTo(runtime2, right, ctx, newValue);
    },
    { element: target }
  );
  reactivity.createEffect(
    function() {
      return read(right);
    },
    function(newValue) {
      var ctx = runtime2.makeContext(target, feature, target, null);
      _assignTo(runtime2, left, ctx, newValue);
    },
    { element: target }
  );
}
function _shorthandBind(left, target, feature, runtime2) {
  var propName = _detectProperty(target);
  if (propName === "radio") {
    return _radioBind(left, target, feature, runtime2);
  }
  reactivity.createEffect(
    function() {
      return left.evaluate(runtime2.makeContext(target, feature, target, null));
    },
    function(newValue) {
      target[propName] = newValue;
    },
    { element: target }
  );
  var isNumeric = propName === "valueAsNumber";
  reactivity.createEffect(
    function() {
      var val = runtime2.resolveProperty(target, propName);
      return isNumeric && val !== val ? null : val;
    },
    function(newValue) {
      var ctx = runtime2.makeContext(target, feature, target, null);
      _assignTo(runtime2, left, ctx, newValue);
    },
    { element: target }
  );
  var form = target.closest("form");
  if (form) {
    var resetHandler = function() {
      setTimeout(function() {
        if (!target.isConnected) return;
        var val = target[propName];
        if (isNumeric && val !== val) val = null;
        var ctx = runtime2.makeContext(target, feature, target, null);
        _assignTo(runtime2, left, ctx, val);
      }, 0);
    };
    form.addEventListener("reset", resetHandler);
    _registerListener(runtime2, target, form, "reset", resetHandler);
  }
}
function _radioBind(left, target, feature, runtime2) {
  var radioValue = target.value;
  var groupName = target.getAttribute("name");
  reactivity.createEffect(
    function() {
      return left.evaluate(runtime2.makeContext(target, feature, target, null));
    },
    function(newValue) {
      target.checked = newValue === radioValue;
    },
    { element: target }
  );
  var changeHandler = function() {
    if (target.checked) {
      var ctx = runtime2.makeContext(target, feature, target, null);
      _assignTo(runtime2, left, ctx, radioValue);
    }
  };
  target.addEventListener("change", changeHandler);
  _registerListener(runtime2, target, target, "change", changeHandler);
}
function _detectProperty(element) {
  var tag = element.tagName;
  if (tag === "INPUT") {
    var type = element.getAttribute("type") || "text";
    if (type === "radio") return "radio";
    if (type === "checkbox") return "checked";
    if (type === "number" || type === "range") return "valueAsNumber";
    return "value";
  }
  if (tag === "TEXTAREA" || tag === "SELECT") return "value";
  throw new Error(
    "bind shorthand is not supported on <" + tag.toLowerCase() + "> elements. Use 'bind $var and my value' explicitly."
  );
}
function _setAttr(elt, name, value) {
  if (typeof value === "boolean") {
    if (name.startsWith("aria-")) {
      elt.setAttribute(name, String(value));
    } else if (value) {
      elt.setAttribute(name, "");
    } else {
      elt.removeAttribute(name);
    }
  } else if (value == null) {
    elt.removeAttribute(name);
  } else {
    elt.setAttribute(name, value);
  }
}
function _assignTo(runtime2, target, ctx, value) {
  if (target.type === "classRef") {
    var elt = ctx.you || ctx.me;
    if (elt) value ? elt.classList.add(target.className) : elt.classList.remove(target.className);
  } else if (target.type === "attributeRef" && typeof value === "boolean") {
    var elt = ctx.you || ctx.me;
    if (elt) _setAttr(elt, target.name, value);
  } else {
    var lhs = {};
    if (target.lhs) {
      for (var key in target.lhs) {
        var expr = target.lhs[key];
        lhs[key] = expr && expr.evaluate ? expr.evaluate(ctx) : expr;
      }
    }
    target.set(ctx, lhs, value);
  }
}

// src/parsetree/features/always.js
var always_exports = {};
__export(always_exports, {
  AlwaysFeature: () => AlwaysFeature
});
var _AlwaysFeature = class _AlwaysFeature extends Feature {
  constructor(commands) {
    super();
    this.commands = commands;
    this.displayName = "always";
  }
  static parse(parser) {
    if (!parser.matchToken("always")) return;
    var start = parser.requireElement("commandList");
    var feature = new _AlwaysFeature(start);
    parser.ensureTerminated(start);
    parser.setParent(start, feature);
    return feature;
  }
  install(target, source, args, runtime2) {
    var feature = this;
    queueMicrotask(function() {
      reactivity.createEffect(
        function() {
          feature.commands.execute(
            runtime2.makeContext(target, feature, target, null)
          );
        },
        function() {
        },
        { element: target }
      );
    });
  }
};
__publicField(_AlwaysFeature, "keyword", "always");
var AlwaysFeature = _AlwaysFeature;

// src/_hyperscript.js
var globalScope = typeof self !== "undefined" ? self : typeof global !== "undefined" ? global : void 0;
config.conversions = conversions;
var kernel = new LanguageKernel();
var tokenizer = new Tokenizer();
var runtime = new Runtime(globalScope, kernel, tokenizer);
kernel.registerModule(expressions_exports);
kernel.registerModule(literals_exports);
kernel.registerModule(webliterals_exports);
kernel.registerModule(postfix_exports);
kernel.registerModule(positional_exports);
kernel.registerModule(existentials_exports);
kernel.registerModule(targets_exports);
kernel.registerModule(pseudopossessive_exports);
kernel.registerModule(basic_exports);
kernel.registerModule(setters_exports);
kernel.registerModule(events_exports);
kernel.registerModule(controlflow_exports);
kernel.registerModule(execution_exports);
kernel.registerModule(pseudoCommand_exports);
kernel.registerModule(dom_exports);
kernel.registerModule(animations_exports);
kernel.registerModule(debug_exports);
kernel.registerModule(on_exports);
kernel.registerModule(def_exports);
kernel.registerModule(set_exports);
kernel.registerModule(init_exports);
kernel.registerModule(worker_exports);
kernel.registerModule(behavior_exports);
kernel.registerModule(install_exports);
kernel.registerModule(js_exports);
kernel.registerModule(when_exports);
kernel.registerModule(bind_exports);
kernel.registerModule(always_exports);
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
      runtime,
      reactivity,
      createParser: (tokens) => new Parser(kernel, tokens)
    },
    addFeature: kernel.addFeature.bind(kernel),
    addCommand: kernel.addCommand.bind(kernel),
    addLeafExpression: kernel.addLeafExpression.bind(kernel),
    evaluate,
    parse: (src) => kernel.parse(tokenizer, src),
    process: (elt) => runtime.processNode(elt),
    processNode: (elt) => runtime.processNode(elt),
    // deprecated alias
    cleanup: (elt) => runtime.cleanup(elt),
    version: "0.9.90"
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
        globalScope.document.addEventListener("htmx:after:process", (evt) => {
          runtime.processNode(evt.target);
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
//# sourceMappingURL=_hyperscript.esm.js.map
