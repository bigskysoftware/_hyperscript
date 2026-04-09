"use strict";
(() => {
  var __defProp = Object.defineProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };

  // src/core/tokenizer.js
  var Tokens = class {
    #tokens;
    #consumed = [];
    #lastConsumed = null;
    #follows = [];
    source;
    constructor(tokens, source) {
      this.#tokens = tokens;
      this.source = source;
      this.consumeWhitespace();
    }
    get list() {
      return this.#tokens;
    }
    get consumed() {
      return this.#consumed;
    }
    // ----- Debug -----
    toString() {
      var cur = this.currentToken();
      var lines = this.source.split("\n");
      var lineIdx = cur?.line ? cur.line - 1 : lines.length - 1;
      var col = cur?.line ? cur.column : 0;
      var contextLine = lines[lineIdx] || "";
      var tokenLen = Math.max(1, cur?.value?.length || 1);
      var gutter = String(lineIdx + 1).length;
      var out = "Tokens(";
      out += this.#consumed.filter((t) => t.type !== "WHITESPACE").length + " consumed, ";
      out += this.#tokens.filter((t) => t.type !== "WHITESPACE").length + " remaining";
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
          while (this.#tokens[i] && this.#tokens[i].type === "WHITESPACE") {
            i++;
          }
        }
        token = this.#tokens[i];
        n--;
        i++;
      } while (n > -1);
      return token || { type: "EOF", value: "<<<EOF>>>" };
    }
    hasMore() {
      return this.#tokens.length > 0;
    }
    lastMatch() {
      return this.#lastConsumed;
    }
    // ----- Token matching -----
    matchToken(value, type) {
      if (this.#follows.includes(value)) return;
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
    // ----- Token consuming -----
    consumeToken() {
      var match = this.#tokens.shift();
      this.#consumed.push(match);
      this.#lastConsumed = match;
      this.consumeWhitespace();
      return match;
    }
    consumeWhitespace() {
      while (this.token(0, true).type === "WHITESPACE") {
        this.#consumed.push(this.#tokens.shift());
      }
    }
    consumeUntil(value, type) {
      var tokenList = [];
      var currentToken = this.token(0, true);
      while ((type == null || currentToken.type !== type) && (value == null || currentToken.value !== value) && currentToken.type !== "EOF") {
        var match = this.#tokens.shift();
        this.#consumed.push(match);
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
      if (this.#tokens[peek] && this.#tokens[peek].value === value && this.#tokens[peek].type === type) {
        return this.#tokens[peek];
      }
    }
    // ----- Whitespace -----
    lastWhitespace() {
      var last = this.#consumed.at(-1);
      return last && last.type === "WHITESPACE" ? last.value : "";
    }
    // ----- Follow set management -----
    pushFollow(str) {
      this.#follows.push(str);
    }
    popFollow() {
      this.#follows.pop();
    }
    pushFollows(...strs) {
      for (var i = 0; i < strs.length; i++) this.#follows.push(strs[i]);
      return strs.length;
    }
    popFollows(count) {
      for (var i = 0; i < count; i++) this.#follows.pop();
    }
    clearFollows() {
      var tmp = this.#follows;
      this.#follows = [];
      return tmp;
    }
    restoreFollows(f) {
      this.#follows = f;
    }
  };
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
  var Tokenizer = class _Tokenizer {
    // ----- Instance state -----
    #source = "";
    #position = 0;
    #column = 0;
    #line = 1;
    #lastToken = "<START>";
    #templateBraceCount = 0;
    #tokens = [];
    #template = false;
    #templateMode;
    // ----- Character classification -----
    #isAlpha(c) {
      return c >= "a" && c <= "z" || c >= "A" && c <= "Z";
    }
    #isNumeric(c) {
      return c >= "0" && c <= "9";
    }
    #isWhitespace(c) {
      return c === " " || c === "	" || c === "\r" || c === "\n";
    }
    #isNewline(c) {
      return c === "\r" || c === "\n";
    }
    #isValidCSSChar(c) {
      return this.#isAlpha(c) || this.#isNumeric(c) || c === "-" || c === "_" || c === ":";
    }
    #isIdentifierChar(c) {
      return c === "_" || c === "$";
    }
    #isReservedChar(c) {
      return c === "`";
    }
    static tokenize(string, template) {
      return new _Tokenizer().tokenize(string, template);
    }
    tokenize(string, template) {
      this.#source = string;
      this.#position = 0;
      this.#column = 0;
      this.#line = 1;
      this.#lastToken = "<START>";
      this.#templateBraceCount = 0;
      this.#tokens = [];
      this.#template = template || false;
      this.#templateMode = "indeterminant";
      return this.#tokenize();
    }
    // ----- Character access -----
    #currentChar() {
      return this.#source.charAt(this.#position);
    }
    #nextChar() {
      return this.#source.charAt(this.#position + 1);
    }
    #charAt(offset = 1) {
      return this.#source.charAt(this.#position + offset);
    }
    #consumeChar() {
      this.#lastToken = this.#currentChar();
      this.#position++;
      if (this.#lastToken === "\n") {
        this.#line++;
        this.#column = 0;
      } else {
        this.#column++;
      }
      return this.#lastToken;
    }
    // ----- Context checks -----
    #inTemplate() {
      return this.#template && this.#templateBraceCount === 0;
    }
    #inCommandMode() {
      return !this.#inTemplate() || this.#templateMode === "command";
    }
    #possiblePrecedingSymbol() {
      return this.#isAlpha(this.#lastToken) || this.#isNumeric(this.#lastToken) || this.#lastToken === ")" || this.#lastToken === '"' || this.#lastToken === "'" || this.#lastToken === "`" || this.#lastToken === "}" || this.#lastToken === "]";
    }
    #isValidSingleQuoteStringStart() {
      if (this.#tokens.length > 0) {
        var prev = this.#tokens.at(-1);
        if (prev.type === "IDENTIFIER" || prev.type === "CLASS_REF" || prev.type === "ID_REF") {
          return false;
        }
        if (prev.op && (prev.value === ">" || prev.value === ")")) {
          return false;
        }
      }
      return true;
    }
    // ----- Token constructors -----
    #makeToken(type, value) {
      return {
        type,
        value: value || "",
        start: this.#position,
        end: this.#position + 1,
        column: this.#column,
        line: this.#line
      };
    }
    #makeOpToken(type, value) {
      var token = this.#makeToken(type, value);
      token.op = true;
      return token;
    }
    // ----- Consume methods -----
    #consumeComment() {
      while (this.#currentChar() && !this.#isNewline(this.#currentChar())) {
        this.#consumeChar();
      }
      this.#consumeChar();
    }
    #consumeWhitespace() {
      var ws = this.#makeToken("WHITESPACE");
      var value = "";
      while (this.#currentChar() && this.#isWhitespace(this.#currentChar())) {
        if (this.#isNewline(this.#currentChar())) {
          this.#templateMode = "indeterminant";
        }
        value += this.#consumeChar();
      }
      ws.value = value;
      ws.end = this.#position;
      return ws;
    }
    #consumeClassReference() {
      var token = this.#makeToken("CLASS_REF");
      var value = this.#consumeChar();
      if (this.#currentChar() === "{") {
        token.template = true;
        value += this.#consumeChar();
        while (this.#currentChar() && this.#currentChar() !== "}") {
          value += this.#consumeChar();
        }
        if (this.#currentChar() !== "}") {
          throw new Error("Unterminated class reference");
        } else {
          value += this.#consumeChar();
        }
      } else {
        while (this.#isValidCSSChar(this.#currentChar()) || this.#currentChar() === "\\") {
          if (this.#currentChar() === "\\") this.#consumeChar();
          value += this.#consumeChar();
        }
      }
      token.value = value;
      token.end = this.#position;
      return token;
    }
    #consumeIdReference() {
      var token = this.#makeToken("ID_REF");
      var value = this.#consumeChar();
      if (this.#currentChar() === "{") {
        token.template = true;
        value += this.#consumeChar();
        while (this.#currentChar() && this.#currentChar() !== "}") {
          value += this.#consumeChar();
        }
        if (this.#currentChar() !== "}") {
          throw new Error("Unterminated id reference");
        } else {
          this.#consumeChar();
        }
      } else {
        while (this.#isValidCSSChar(this.#currentChar())) {
          value += this.#consumeChar();
        }
      }
      token.value = value;
      token.end = this.#position;
      return token;
    }
    #consumeAttributeReference() {
      var token = this.#makeToken("ATTRIBUTE_REF");
      var value = this.#consumeChar();
      while (this.#position < this.#source.length && this.#currentChar() !== "]") {
        value += this.#consumeChar();
      }
      if (this.#currentChar() === "]") {
        value += this.#consumeChar();
      }
      token.value = value;
      token.end = this.#position;
      return token;
    }
    #consumeShortAttributeReference() {
      var token = this.#makeToken("ATTRIBUTE_REF");
      var value = this.#consumeChar();
      while (this.#isValidCSSChar(this.#currentChar())) {
        value += this.#consumeChar();
      }
      if (this.#currentChar() === "=") {
        value += this.#consumeChar();
        if (this.#currentChar() === '"' || this.#currentChar() === "'") {
          value += this.#consumeString().value;
        } else if (this.#isAlpha(this.#currentChar()) || this.#isNumeric(this.#currentChar()) || this.#isIdentifierChar(this.#currentChar())) {
          value += this.#consumeIdentifier().value;
        }
      }
      token.value = value;
      token.end = this.#position;
      return token;
    }
    #consumeStyleReference() {
      var token = this.#makeToken("STYLE_REF");
      var value = this.#consumeChar();
      while (this.#isAlpha(this.#currentChar()) || this.#currentChar() === "-") {
        value += this.#consumeChar();
      }
      token.value = value;
      token.end = this.#position;
      return token;
    }
    #consumeTemplateLogic() {
      var token = this.#makeToken("IDENTIFIER");
      this.#consumeChar();
      var value = "";
      while (this.#isAlpha(this.#currentChar())) {
        value += this.#consumeChar();
      }
      token.value = value;
      token.end = this.#position;
      return token;
    }
    #consumeTemplateLine() {
      var token = this.#makeToken("TEMPLATE_LINE");
      token.value = "TEMPLATE_LINE";
      var content = "";
      while (this.#currentChar() && !this.#isNewline(this.#currentChar())) {
        content += this.#consumeChar();
      }
      if (this.#currentChar() && this.#isNewline(this.#currentChar())) {
        this.#consumeChar();
        content += "\n";
        this.#templateMode = "indeterminant";
      }
      token.content = content;
      token.end = this.#position;
      return token;
    }
    #consumeTemplateIdentifier() {
      var token = this.#makeToken("IDENTIFIER");
      var value = this.#consumeChar();
      var escaped = value === "\\";
      if (escaped) value = "";
      while (this.#isAlpha(this.#currentChar()) || this.#isNumeric(this.#currentChar()) || this.#isIdentifierChar(this.#currentChar()) || this.#currentChar() === "\\" || this.#currentChar() === "{" || this.#currentChar() === "}") {
        if (this.#currentChar() === "$" && !escaped) {
          break;
        } else if (this.#currentChar() === "\\") {
          escaped = true;
          this.#consumeChar();
        } else {
          escaped = false;
          value += this.#consumeChar();
        }
      }
      if (this.#currentChar() === "!" && value === "beep") {
        value += this.#consumeChar();
      }
      token.value = value;
      token.end = this.#position;
      return token;
    }
    #consumeIdentifier() {
      var token = this.#makeToken("IDENTIFIER");
      var value = this.#consumeChar();
      while (this.#isAlpha(this.#currentChar()) || this.#isNumeric(this.#currentChar()) || this.#isIdentifierChar(this.#currentChar())) {
        value += this.#consumeChar();
      }
      if (this.#currentChar() === "!" && value === "beep") {
        value += this.#consumeChar();
      }
      token.value = value;
      token.end = this.#position;
      return token;
    }
    #consumeNumber() {
      var token = this.#makeToken("NUMBER");
      var value = this.#consumeChar();
      while (this.#isNumeric(this.#currentChar())) {
        value += this.#consumeChar();
      }
      if (this.#currentChar() === "." && this.#isNumeric(this.#nextChar())) {
        value += this.#consumeChar();
      }
      while (this.#isNumeric(this.#currentChar())) {
        value += this.#consumeChar();
      }
      if (this.#currentChar() === "e" || this.#currentChar() === "E") {
        if (this.#isNumeric(this.#nextChar())) {
          value += this.#consumeChar();
        } else if (this.#nextChar() === "-") {
          value += this.#consumeChar();
          value += this.#consumeChar();
        }
      }
      while (this.#isNumeric(this.#currentChar())) {
        value += this.#consumeChar();
      }
      token.value = value;
      token.end = this.#position;
      return token;
    }
    #consumeOp() {
      var token = this.#makeOpToken();
      var value = this.#consumeChar();
      while (this.#currentChar() && OP_TABLE[value + this.#currentChar()]) {
        value += this.#consumeChar();
      }
      token.type = OP_TABLE[value];
      token.value = value;
      token.end = this.#position;
      return token;
    }
    #consumeString() {
      var token = this.#makeToken("STRING");
      var startChar = this.#consumeChar();
      token.template = startChar === "`";
      var value = "";
      while (this.#currentChar() && this.#currentChar() !== startChar) {
        if (this.#currentChar() === "\\") {
          this.#consumeChar();
          let next = this.#consumeChar();
          if (next === "b") value += "\b";
          else if (next === "f") value += "\f";
          else if (next === "n") value += "\n";
          else if (next === "r") value += "\r";
          else if (next === "t") value += "	";
          else if (next === "v") value += "\v";
          else if (token.template && next === "$") value += "\\$";
          else if (next === "x") {
            const hex = this.#consumeHexEscape();
            if (Number.isNaN(hex)) {
              throw new Error("Invalid hexadecimal escape at [Line: " + token.line + ", Column: " + token.column + "]");
            }
            value += String.fromCharCode(hex);
          } else value += next;
        } else {
          value += this.#consumeChar();
        }
      }
      if (this.#currentChar() !== startChar) {
        throw new Error("Unterminated string at [Line: " + token.line + ", Column: " + token.column + "]");
      } else {
        this.#consumeChar();
      }
      token.value = value;
      token.end = this.#position;
      return token;
    }
    #consumeHexEscape() {
      if (!this.#currentChar()) return NaN;
      let result = 16 * Number.parseInt(this.#consumeChar(), 16);
      if (!this.#currentChar()) return NaN;
      result += Number.parseInt(this.#consumeChar(), 16);
      return result;
    }
    // ----- Main tokenization loop -----
    #isLineComment() {
      var c = this.#currentChar(), n = this.#nextChar(), n2 = this.#charAt(2);
      return c === "-" && n === "-" && (this.#isWhitespace(n2) || n2 === "" || n2 === "-") || c === "/" && n === "/" && (this.#isWhitespace(n2) || n2 === "" || n2 === "/");
    }
    #tokenize() {
      while (this.#position < this.#source.length) {
        if (this.#isLineComment()) {
          this.#consumeComment();
        } else if (this.#isWhitespace(this.#currentChar())) {
          this.#tokens.push(this.#consumeWhitespace());
        } else if (!this.#possiblePrecedingSymbol() && this.#currentChar() === "." && (this.#isAlpha(this.#nextChar()) || this.#nextChar() === "{" || this.#nextChar() === "-")) {
          this.#tokens.push(this.#consumeClassReference());
        } else if (!this.#possiblePrecedingSymbol() && this.#currentChar() === "#" && (this.#isAlpha(this.#nextChar()) || this.#nextChar() === "{")) {
          if (this.#template === "lines" && this.#templateMode === "indeterminant") {
            this.#templateMode = "command";
            this.#tokens.push(this.#consumeTemplateLogic());
          } else {
            this.#tokens.push(this.#consumeIdReference());
          }
        } else if (this.#template === "lines" && this.#templateMode === "indeterminant" && this.#templateBraceCount === 0) {
          this.#templateMode = "template";
          this.#tokens.push(this.#consumeTemplateLine());
        } else if (this.#currentChar() === "[" && this.#nextChar() === "@") {
          this.#tokens.push(this.#consumeAttributeReference());
        } else if (this.#currentChar() === "@") {
          this.#tokens.push(this.#consumeShortAttributeReference());
        } else if (this.#currentChar() === "*" && this.#isAlpha(this.#nextChar())) {
          this.#tokens.push(this.#consumeStyleReference());
        } else if (this.#inTemplate() && (this.#isAlpha(this.#currentChar()) || this.#currentChar() === "\\") && this.#templateMode !== "command") {
          this.#tokens.push(this.#consumeTemplateIdentifier());
        } else if (this.#inCommandMode() && (this.#isAlpha(this.#currentChar()) || this.#isIdentifierChar(this.#currentChar()))) {
          this.#tokens.push(this.#consumeIdentifier());
        } else if (this.#isNumeric(this.#currentChar())) {
          this.#tokens.push(this.#consumeNumber());
        } else if (this.#inCommandMode() && (this.#currentChar() === '"' || this.#currentChar() === "`")) {
          this.#tokens.push(this.#consumeString());
        } else if (this.#inCommandMode() && this.#currentChar() === "'") {
          if (this.#isValidSingleQuoteStringStart()) {
            this.#tokens.push(this.#consumeString());
          } else {
            this.#tokens.push(this.#consumeOp());
          }
        } else if (OP_TABLE[this.#currentChar()]) {
          if (this.#lastToken === "$" && this.#currentChar() === "{") {
            this.#templateBraceCount++;
          }
          if (this.#currentChar() === "}") {
            this.#templateBraceCount--;
          }
          this.#tokens.push(this.#consumeOp());
        } else if (this.#inTemplate() || this.#isReservedChar(this.#currentChar())) {
          this.#tokens.push(this.#makeToken("RESERVED", this.#consumeChar()));
        } else {
          if (this.#position < this.#source.length) {
            throw new Error("Unknown token: " + this.#currentChar() + " ");
          }
        }
      }
      return new Tokens(this.#tokens, this.#source);
    }
  };

  // src/parsetree/base.js
  var ParseElement = class _ParseElement {
    errors = [];
    collectErrors(visited) {
      if (!visited) visited = /* @__PURE__ */ new Set();
      if (visited.has(this)) return [];
      visited.add(this);
      var all = [...this.errors];
      for (var key of Object.keys(this)) {
        for (var item of [this[key]].flat()) {
          if (item instanceof _ParseElement) {
            all.push(...item.collectErrors(visited));
          }
        }
      }
      return all;
    }
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
    findNext(context) {
      return context.meta.runtime.findNext(this, context);
    }
  };
  var Feature = class extends ParseElement {
    isFeature = true;
    constructor() {
      super();
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
      return this.findNext(context);
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
  var HyperscriptProgram = class extends ParseElement {
    constructor(features) {
      super();
      this.type = "hyperscript";
      this.features = features;
    }
    apply(target, source, args, runtime2) {
      for (const feature of this.features) {
        feature.install(target, source, args, runtime2);
      }
    }
  };
  var FailedFeature = class extends Feature {
    constructor(error, keyword) {
      super();
      this.type = "failedFeature";
      this.keyword = keyword;
      this.errors.push(error);
    }
    install() {
    }
  };
  var FailedCommand = class extends Command {
    constructor(error, keyword) {
      super();
      this.type = "failedCommand";
      this.keyword = keyword;
      this.errors.push(error);
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
  var NakedString = class _NakedString extends Expression {
    static grammarName = "nakedString";
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
  var BooleanLiteral = class _BooleanLiteral extends Expression {
    static grammarName = "boolean";
    static expressionType = "leaf";
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
  var NullLiteral = class _NullLiteral extends Expression {
    static grammarName = "null";
    static expressionType = "leaf";
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
  var NumberLiteral = class _NumberLiteral extends Expression {
    static grammarName = "number";
    static expressionType = "leaf";
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
  var StringLiteral = class _StringLiteral extends Expression {
    static grammarName = "string";
    static expressionType = "leaf";
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
  var ArrayLiteral = class _ArrayLiteral extends Expression {
    static grammarName = "arrayLiteral";
    static expressionType = "leaf";
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
  var ObjectKey = class _ObjectKey extends Expression {
    static grammarName = "objectKey";
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
  var ObjectLiteral = class _ObjectLiteral extends Expression {
    static grammarName = "objectLiteral";
    static expressionType = "leaf";
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
  var NamedArgumentList = class _NamedArgumentList extends Expression {
    static grammarName = "namedArgumentList";
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
  var NakedNamedArgumentList = class extends Expression {
    static grammarName = "nakedNamedArgumentList";
    static parse = NamedArgumentList.parseNaked;
  };
  var StringLike = class extends Expression {
    static grammarName = "stringLike";
    static parse(parser) {
      return parser.parseAnyOf(["string", "nakedString"]);
    }
  };

  // src/core/parser.js
  var ParseError = class {
    constructor(message, token, source, expected) {
      this.message = message;
      this.token = token;
      this.source = source;
      this.expected = expected || null;
      this.line = token?.line ?? null;
      this.column = token?.column ?? null;
    }
  };
  var ParseRecoverySentinel = class extends Error {
    constructor(parseError) {
      super(parseError.message);
      this.parseError = parseError;
    }
  };
  var Parser = class _Parser {
    #kernel;
    constructor(kernel2, tokens) {
      this.#kernel = kernel2;
      this.tokens = tokens;
    }
    toString() {
      this.tokens.matched;
    }
    static formatErrors(errors) {
      if (!errors.length) return "";
      var source = errors[0].source;
      var lines = source.split("\n");
      var byLine = /* @__PURE__ */ new Map();
      for (var e of errors) {
        var lineIdx = e.token?.line ? e.token.line - 1 : lines.length - 1;
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
          var col = e.token?.line ? e.token.column : Math.max(0, contextLine.length - 1);
          var len = Math.max(1, e.token?.value?.length || 1);
          for (var i = 0; i < len; i++) underlineChars[col + i] = "^";
        }
        out += pad + underlineChars.join("").trimEnd() + "\n";
        for (var e of lineErrors) {
          var col = e.token?.line ? e.token.column : 0;
          out += pad + " ".repeat(col) + e.message + "\n";
        }
      }
      return out;
    }
    // ===========================
    // Token delegation methods
    // ===========================
    consumeWhitespace() {
      return this.tokens.consumeWhitespace();
    }
    requireOpToken(value) {
      var token = this.matchOpToken(value);
      if (token) return token;
      this.raiseExpected(value);
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
      var token = this.matchTokenType(...types);
      if (token) return token;
      this.raiseExpected(...types);
    }
    matchTokenType(...types) {
      return this.tokens.matchTokenType(...types);
    }
    requireToken(value, type) {
      var token = this.matchToken(value, type);
      if (token) return token;
      this.raiseExpected(value);
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
    pushFollows(...strs) {
      return this.tokens.pushFollows(...strs);
    }
    popFollows(count) {
      return this.tokens.popFollows(count);
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
      return new _Parser(this.#kernel, tokens);
    }
    // ===========================
    // Kernel delegation methods
    // ===========================
    parseElement(type, root = null) {
      return this.#kernel.parseElement(type, this, root);
    }
    requireElement(type, message, root) {
      return this.#kernel.requireElement(type, this, message, root);
    }
    parseAnyOf(types) {
      return this.#kernel.parseAnyOf(types, this);
    }
    raiseError(message, expected) {
      message = message || "Unexpected Token : " + this.currentToken().value;
      var parseError = new ParseError(message, this.currentToken(), this.source, expected);
      throw new ParseRecoverySentinel(parseError);
    }
    raiseExpected(...expected) {
      var msg = expected.length === 1 ? "Expected '" + expected[0] + "' but found '" + this.currentToken().value + "'" : "Expected one of: " + expected.map((e) => "'" + e + "'").join(", ");
      this.raiseError(msg, expected);
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
      return this.#kernel.commandStart(token);
    }
    featureStart(token) {
      return this.#kernel.featureStart(token);
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

  // src/core/kernel.js
  var LanguageKernel = class {
    #grammar = {};
    #commands = {};
    #features = {};
    #leafExpressions = [];
    #indirectExpressions = [];
    #postfixExpressions = [];
    #unaryExpressions = [];
    #topExpressions = [];
    #assignableExpressions = [];
    constructor() {
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
      var featureDefinition = this.#features[parser.currentToken().value || ""];
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
      var commandDefinition = this.#commands[parser.currentToken().value || ""];
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
        var keyword = parser.currentToken().value;
        var cmd;
        try {
          cmd = parser.parseElement("command");
        } catch (e) {
          if (e instanceof ParseRecoverySentinel) {
            cmd = new FailedCommand(e.parseError, keyword);
            this.#syncToCommand(parser);
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
      var result = parser.parseAnyOf(this.#leafExpressions);
      if (result == null) {
        return parser.parseElement("symbol");
      }
      return result;
    }
    parseIndirectExpression(parser, root) {
      for (var i = 0; i < this.#indirectExpressions.length; i++) {
        var indirect = this.#indirectExpressions[i];
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
      for (var i = 0; i < this.#postfixExpressions.length; i++) {
        var postfixType = this.#postfixExpressions[i];
        var result = this.parseElement(postfixType, parser, root);
        if (result) {
          return result;
        }
      }
      return root;
    }
    parseUnaryExpression(parser) {
      parser.matchToken("the");
      var result = parser.parseAnyOf(this.#unaryExpressions);
      if (result) return this.parseElement("indirectExpression", parser, result);
      return parser.parseElement("postfixExpression");
    }
    parseExpression(parser) {
      parser.matchToken("the");
      return parser.parseAnyOf(this.#topExpressions);
    }
    parseAssignableExpression(parser) {
      parser.matchToken("the");
      var expr = parser.parseElement("primaryExpression");
      var checkExpr = expr;
      while (checkExpr && checkExpr.type === "parenthesized") {
        checkExpr = checkExpr.expr;
      }
      if (checkExpr && this.#assignableExpressions.includes(checkExpr.type)) {
        return expr;
      } else {
        parser.raiseError(
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
      parser.raiseError("Unexpected value: " + parser.currentToken().value);
    }
    parseHyperscriptProgram(parser) {
      var features = [];
      if (parser.hasMore()) {
        while (parser.currentToken().type !== "EOF") {
          var keyword = parser.currentToken().value;
          if (parser.featureStart(parser.currentToken()) || parser.currentToken().value === "(") {
            try {
              var feature = parser.requireElement("feature");
              features.push(feature);
              parser.matchToken("end");
            } catch (e) {
              if (e instanceof ParseRecoverySentinel) {
                features.push(new FailedFeature(e.parseError, keyword));
                this.#syncToFeature(parser);
              } else {
                throw e;
              }
            }
          } else if (parser.currentToken().value === "end") {
            break;
          } else {
            try {
              parser.raiseError();
            } catch (e) {
              if (e instanceof ParseRecoverySentinel) {
                features.push(new FailedFeature(e.parseError, keyword));
                this.#syncToFeature(parser);
              } else {
                throw e;
              }
            }
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
      var elementDefinition = this.#grammar[type];
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
      if (!result) parser.raiseError(message || "Expected " + type);
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
      if (this.#grammar[name]) {
        throw new Error(`Grammar element '${name}' already exists`);
      }
      this.#grammar[name] = definition;
    }
    addCommand(keyword, definition) {
      var commandGrammarType = keyword + "Command";
      this.#grammar[commandGrammarType] = definition;
      this.#commands[keyword] = definition;
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
      this.#grammar[featureGrammarType] = definition;
      this.#features[keyword] = definition;
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
        this.#assignableExpressions.push(name);
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
      this.#leafExpressions.push(name);
      this.addGrammarElement(name, definition);
    }
    addIndirectExpression(name, definition) {
      this.#indirectExpressions.push(name);
      this.addGrammarElement(name, definition);
    }
    addPostfixExpression(name, definition) {
      this.#postfixExpressions.push(name);
      this.addGrammarElement(name, definition);
    }
    addUnaryExpression(name, definition) {
      this.#unaryExpressions.push(name);
      this.addGrammarElement(name, definition);
    }
    addTopExpression(name, definition) {
      this.#topExpressions.push(name);
      this.addGrammarElement(name, definition);
    }
    commandStart(token) {
      return this.#commands[token.value || ""];
    }
    featureStart(token) {
      return this.#features[token.value || ""];
    }
    parseHyperScript(tokens) {
      var parser = new Parser(this, tokens);
      var result;
      var lastError = null;
      try {
        result = parser.parseElement("hyperscript");
        if (tokens.hasMore()) parser.raiseError();
      } catch (e) {
        if (!(e instanceof ParseRecoverySentinel)) throw e;
        lastError = e.parseError;
      }
      if (!result) result = new HyperscriptProgram([]);
      result.errors = result.collectErrors();
      if (lastError) result.errors.push(lastError);
      return result;
    }
    #syncToFeature(parser) {
      parser.tokens.clearFollows();
      while (parser.hasMore() && !parser.featureStart(parser.currentToken()) && parser.currentToken().value !== "end" && parser.currentToken().type !== "EOF") {
        parser.tokens.consumeToken();
      }
    }
    #syncToCommand(parser) {
      parser.tokens.clearFollows();
      while (parser.hasMore() && !parser.commandBoundary(parser.currentToken())) {
        parser.tokens.consumeToken();
      }
      if (parser.hasMore() && parser.currentToken().value === "then") {
        parser.tokens.consumeToken();
      }
    }
    parse(tokenizer2, src) {
      var tokens = tokenizer2.tokenize(src);
      var parser = new Parser(this, tokens);
      var result, lastError;
      try {
        if (parser.commandStart(tokens.currentToken())) {
          result = this.requireElement("commandList", parser);
          if (tokens.hasMore()) parser.raiseError();
          parser.ensureTerminated(result);
        } else if (parser.featureStart(tokens.currentToken())) {
          result = this.requireElement("hyperscript", parser);
          if (tokens.hasMore()) parser.raiseError();
        } else {
          result = this.requireElement("expression", parser);
          if (tokens.hasMore()) parser.raiseError();
        }
      } catch (e) {
        if (!(e instanceof ParseRecoverySentinel)) throw e;
        lastError = e.parseError;
      }
      if (!result && lastError) {
        result = { type: "empty", errors: [lastError] };
      } else if (result) {
        result.errors = result.collectErrors();
        if (lastError) result.errors.push(lastError);
      }
      return result;
    }
  };

  // src/core/config.js
  var config = {
    attributes: "_, script, data-script",
    defaultTransition: "all 500ms ease-in",
    disableSelector: "[disable-scripting], [data-disable-scripting]",
    fetchThrowsOn: [/4.*/, /5.*/],
    hideShowStrategies: {},
    logAll: false,
    mutatingMethods: {
      Array: ["push", "pop", "shift", "unshift", "splice", "sort", "reverse", "fill", "copyWithin"],
      Set: ["add", "delete", "clear"],
      Map: ["set", "delete", "clear"]
    }
  };

  // src/core/runtime/conversions.js
  var HyperscriptFormData = class {
    result = {};
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
  function _toHTML(value) {
    if (value instanceof Array) {
      return value.map((item) => _toHTML(item)).join("");
    }
    if (value instanceof HTMLElement) {
      return value.outerHTML;
    }
    if (value instanceof NodeList) {
      var result = "";
      for (var i = 0; i < value.length; i++) {
        if (value[i] instanceof HTMLElement) {
          result += value[i].outerHTML;
        }
      }
      return result;
    }
    if (value.toString) {
      return value.toString();
    }
    return "";
  }
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
      if (typeof Response !== "undefined" && val instanceof Response) return val.json();
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
    Set: function(val) {
      return new Set(val);
    },
    Map: function(val) {
      return new Map(Object.entries(val));
    },
    Keys: function(val) {
      if (val instanceof Map) return Array.from(val.keys());
      return Object.keys(val);
    },
    Entries: function(val) {
      if (val instanceof Map) return Array.from(val.entries());
      return Object.entries(val);
    },
    Reversed: function(val) {
      return Array.from(val).reverse();
    },
    Unique: function(val) {
      return [...new Set(val)];
    },
    Flat: function(val) {
      return Array.from(val).flat();
    },
    HTML: _toHTML,
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
  var CookieJar = class {
    #parseCookies() {
      if (!document.cookie) return [];
      return document.cookie.split("; ").map((entry) => {
        var eq = entry.indexOf("=");
        return { name: entry.slice(0, eq), value: decodeURIComponent(entry.slice(eq + 1)) };
      });
    }
    get(target, prop) {
      if (prop === "then") {
        return null;
      } else if (prop === "length") {
        return this.#parseCookies().length;
      } else if (prop === "clear") {
        return (name) => {
          document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
        };
      } else if (prop === "clearAll") {
        return () => {
          for (const cookie of this.#parseCookies()) {
            document.cookie = cookie.name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
          }
        };
      } else if (prop === Symbol.iterator) {
        var cookies2 = this.#parseCookies();
        return cookies2[Symbol.iterator].bind(cookies2);
      } else if (typeof prop === "string") {
        if (!isNaN(prop)) {
          return this.#parseCookies()[parseInt(prop)];
        }
        var match = this.#parseCookies().find((c) => c.name === prop);
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

  // src/core/runtime/runtime.js
  var cookies = new CookieJar().proxy();
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
          enumerable: false,
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
      this.beingTested = null;
      this.event = event;
      this.target = event?.target ?? null;
      this.detail = event?.detail ?? null;
      this.sender = event?.detail?.sender ?? null;
      this.body = "document" in globalScope2 ? document.body : null;
      runtime2.addFeatures(owner, this);
    }
  };
  var Runtime = class _Runtime {
    static HALT = {};
    HALT = _Runtime.HALT;
    #kernel;
    #tokenizer;
    #globalScope;
    #reactivity;
    #morphEngine;
    #scriptAttrs = null;
    constructor(globalScope2, kernel2, tokenizer2, reactivity2, morphEngine2) {
      this.#globalScope = globalScope2;
      this.#kernel = kernel2;
      this.#tokenizer = tokenizer2;
      this.#reactivity = reactivity2;
      this.#morphEngine = morphEngine2;
    }
    get globalScope() {
      return this.#globalScope;
    }
    get reactivity() {
      return this.#reactivity;
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
    unifiedEval(parseElement, ctx) {
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
      return new Context(owner, feature, hyperscriptTarget, event, this, this.#globalScope, this.#kernel, this.#tokenizer);
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
    // =================================================================
    // Symbol and property resolution
    // =================================================================
    #isReservedWord(str) {
      return ["meta", "it", "result", "locals", "event", "target", "detail", "sender", "body"].includes(str);
    }
    #isHyperscriptContext(context) {
      return context instanceof Context;
    }
    resolveSymbol(str, context, type, targetElement) {
      if (str === "me" || str === "my" || str === "I") return context.me;
      if (str === "it" || str === "its") return context.beingTested ?? context.result;
      if (str === "result") return context.result;
      if (str === "you" || str === "your" || str === "yourself") return context.you;
      if (type === "global") {
        if (this.reactivity.isTracking) this.reactivity.trackGlobalSymbol(str);
        var val = this.#globalScope[str];
        this.#trackMutation(val);
        return val;
      }
      if (type === "element") {
        if (this.reactivity.isTracking) this.reactivity.trackElementSymbol(str, context.meta.owner);
        var val = this.#getElementScope(context)[str];
        this.#trackMutation(val);
        return val;
      }
      if (type === "inherited") {
        var inherited = this.#resolveInherited(str, context, targetElement);
        if (this.reactivity.isTracking) {
          var trackElement = inherited.element || targetElement || context.meta?.owner;
          if (trackElement) {
            this.reactivity.trackElementSymbol(str, trackElement);
          }
        }
        this.#trackMutation(inherited.value);
        return inherited.value;
      }
      if (type === "local") return context.locals[str];
      if (context.meta?.context) {
        var fromMetaContext = context.meta.context[str];
        if (typeof fromMetaContext !== "undefined") return fromMetaContext;
        if (context.meta.context.detail) {
          fromMetaContext = context.meta.context.detail[str];
          if (typeof fromMetaContext !== "undefined") return fromMetaContext;
        }
      }
      var fromContext = this.#isHyperscriptContext(context) && !this.#isReservedWord(str) ? context.locals[str] : context[str];
      if (typeof fromContext !== "undefined") return fromContext;
      var elementScope = this.#getElementScope(context);
      fromContext = elementScope[str];
      if (typeof fromContext !== "undefined") {
        if (this.reactivity.isTracking) this.reactivity.trackElementSymbol(str, context.meta.owner);
        this.#trackMutation(fromContext);
        return fromContext;
      }
      if (this.reactivity.isTracking) this.reactivity.trackGlobalSymbol(str);
      var val = this.#globalScope[str];
      this.#trackMutation(val);
      return val;
    }
    setSymbol(str, context, type, value, targetElement) {
      if (type === "global") {
        this.#globalScope[str] = value;
        this.reactivity.notifyGlobalSymbol(str);
        return;
      }
      if (type === "element") {
        this.#getElementScope(context)[str] = value;
        this.reactivity.notifyElementSymbol(str, context.meta.owner);
        return;
      }
      if (type === "inherited") {
        var inherited = this.#resolveInherited(str, context, targetElement);
        if (inherited.element) {
          this.getInternalData(inherited.element).elementScope[str] = value;
          this.reactivity.notifyElementSymbol(str, inherited.element);
        } else {
          var owner = targetElement || context.meta?.owner;
          if (owner) {
            var internalData = this.getInternalData(owner);
            if (!internalData.elementScope) internalData.elementScope = {};
            internalData.elementScope[str] = value;
            this.reactivity.notifyElementSymbol(str, owner);
          }
        }
        return;
      }
      if (type === "local") {
        context.locals[str] = value;
        return;
      }
      if (this.#isHyperscriptContext(context) && !this.#isReservedWord(str) && typeof context.locals[str] !== "undefined") {
        context.locals[str] = value;
        return;
      }
      var elementScope = this.#getElementScope(context);
      if (typeof elementScope[str] !== "undefined") {
        elementScope[str] = value;
        this.reactivity.notifyElementSymbol(str, context.meta.owner);
      } else if (this.#isHyperscriptContext(context) && !this.#isReservedWord(str)) {
        context.locals[str] = value;
      } else {
        context[str] = value;
      }
    }
    getInternalData(elt) {
      if (!elt._hyperscript) {
        elt._hyperscript = {};
      }
      return elt._hyperscript;
    }
    #resolveInherited(str, context, startElement) {
      var elt = startElement || context.meta && context.meta.owner;
      while (elt) {
        var internalData = elt._hyperscript;
        if (internalData && internalData.elementScope && str in internalData.elementScope) {
          return { value: internalData.elementScope[str], element: elt };
        }
        var domScope = elt.getAttribute && elt.getAttribute("dom-scope");
        if (domScope) {
          if (domScope === "isolated") {
            return { value: void 0, element: null };
          }
          var match = domScope.match(/^closest\s+(.+)/);
          if (match) {
            elt = elt.parentElement && elt.parentElement.closest(match[1]);
            continue;
          }
          match = domScope.match(/^parent\s+of\s+(.+)/);
          if (match) {
            var target = elt.closest(match[1]);
            elt = target && target.parentElement;
            continue;
          }
        }
        elt = elt.parentElement;
      }
      return { value: void 0, element: null };
    }
    #getElementScope(context) {
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
    }
    #flatGet(root, property, getter) {
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
      if (this.reactivity.isTracking) this.reactivity.trackProperty(root, property);
      return this.#flatGet(root, property, (root2, property2) => root2[property2]);
    }
    /**
     * Set a property on an object and notify the reactivity system.
     * @param {Object} obj - DOM element or plain JS object
     * @param {string} property
     * @param {any} value
     */
    setProperty(obj, property, value) {
      obj[property] = value;
      this.reactivity.notifyProperty(obj);
    }
    /**
     * Notify the reactivity system that an object was mutated in-place.
     * Call this after operations like push, splice, append, etc.
     * @param {Object} obj - The mutated object
     */
    notifyMutation(obj) {
      this.reactivity.notifyProperty(obj);
    }
    morph(elt, content) {
      this.#morphEngine.morph(elt, content, {
        beforeNodeRemoved: (node) => {
          if (node.nodeType === 1) this.cleanup(node);
        },
        afterNodeAdded: (node) => {
          if (node.nodeType === 1) this.processNode(node);
        },
        afterNodeMorphed: (node) => {
          if (node.nodeType === 1) this.processNode(node);
        }
      });
    }
    replaceInDom(target, value) {
      this.implicitLoop(target, (elt) => {
        var parent = elt.parentElement;
        if (value instanceof Node) {
          elt.replaceWith(value.cloneNode(true));
        } else {
          elt.replaceWith(this.convertValue(value, "Fragment"));
        }
        if (parent) this.processNode(parent);
      });
    }
    /**
     * Check if a method call is known to mutate its receiver, and notify if so.
     * @param {Object} target - The object the method was called on
     * @param {string} methodName - The method name
     */
    maybeNotify(target, methodName) {
      if (target == null || typeof target !== "object") return;
      var typeName = target.constructor && target.constructor.name;
      var methods = typeName && config.mutatingMethods[typeName];
      if (methods && methods.includes(methodName)) {
        this.notifyMutation(target);
      }
    }
    #trackMutation(val) {
      if (this.reactivity.isTracking && val != null && typeof val === "object") {
        this.reactivity.trackProperty(val, "__mutation__");
      }
    }
    resolveAttribute(root, property) {
      if (this.reactivity.isTracking) this.reactivity.trackAttribute(root, property);
      return this.#flatGet(root, property, (root2, property2) => root2.getAttribute && root2.getAttribute(property2));
    }
    resolveStyle(root, property) {
      return this.#flatGet(root, property, (root2, property2) => root2.style && root2.style[property2]);
    }
    resolveComputedStyle(root, property) {
      return this.#flatGet(root, property, (root2, property2) => getComputedStyle(root2).getPropertyValue(property2));
    }
    assignToNamespace(elt, nameSpace, name, value) {
      let root;
      if (elt == null || typeof document !== "undefined" && elt === document.body) {
        root = this.#globalScope;
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
    // =================================================================
    // Collection and iteration utilities
    // =================================================================
    #isArrayLike(value) {
      return Array.isArray(value) || typeof NodeList !== "undefined" && (value instanceof NodeList || value instanceof HTMLCollection || value instanceof FileList);
    }
    #isIterable(value) {
      return typeof value === "object" && Symbol.iterator in value && typeof value[Symbol.iterator] === "function";
    }
    shouldAutoIterate(value) {
      return value != null && value[SHOULD_AUTO_ITERATE_SYM] || this.#isArrayLike(value);
    }
    forEach(value, func) {
      if (value == null) {
      } else if (this.#isIterable(value)) {
        for (const nth of value) {
          func(nth);
        }
      } else if (this.#isArrayLike(value)) {
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
        context.beingTested = elt;
        return whenExpr.evaluate(context);
      });
      context.beingTested = null;
      var hasPromise = conditions.some(function(c) {
        return c && typeof c.then === "function";
      });
      if (hasPromise) {
        return Promise.all(conditions).then((results) => {
          context.result = this.#applyWhenResults(elements, results, forwardFn, reverseFn);
        });
      } else {
        context.result = this.#applyWhenResults(elements, conditions, forwardFn, reverseFn);
      }
    }
    #applyWhenResults(elements, results, forwardFn, reverseFn) {
      var matched = [];
      for (var i = 0; i < elements.length; i++) {
        if (results[i]) {
          forwardFn(elements[i]);
          matched.push(elements[i]);
        } else reverseFn(elements[i]);
      }
      return matched;
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
    // =================================================================
    // DOM initialization
    // =================================================================
    #getScriptAttributes() {
      if (this.#scriptAttrs == null) {
        this.#scriptAttrs = config.attributes.replaceAll(" ", "").split(",");
      }
      return this.#scriptAttrs;
    }
    #getScript(elt) {
      var attrs = this.#getScriptAttributes();
      for (var i = 0; i < attrs.length; i++) {
        var scriptAttribute = attrs[i];
        if (elt.hasAttribute && elt.hasAttribute(scriptAttribute)) {
          return elt.getAttribute(scriptAttribute);
        }
      }
      if (elt instanceof HTMLScriptElement && elt.type === "text/hyperscript") {
        return elt.innerText;
      }
      return null;
    }
    #scriptSelector;
    #getScriptSelector() {
      if (!this.#scriptSelector) {
        this.#scriptSelector = this.#getScriptAttributes().map((a) => "[" + a + "]").join(", ");
      }
      return this.#scriptSelector;
    }
    #hashScript(str) {
      var hash = 5381;
      for (var i = 0; i < str.length; i++) {
        hash = (hash << 5) + hash + str.charCodeAt(i);
      }
      return hash;
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
      this.reactivity.stopElementEffects(elt);
      if (elt.querySelectorAll) {
        for (var child of elt.querySelectorAll("[data-hyperscript-powered]")) {
          this.cleanup(child);
        }
      }
      this.triggerEvent(elt, "hyperscript:after:cleanup");
      elt.removeAttribute("data-hyperscript-powered");
      delete elt._hyperscript;
    }
    #initElement(elt, target) {
      if (elt.closest && elt.closest(config.disableSelector)) {
        return;
      }
      var internalData = this.getInternalData(elt);
      var src = this.#getScript(elt);
      if (!src) return;
      var hash = this.#hashScript(src);
      if (internalData.initialized) {
        if (internalData.scriptHash === hash) return;
        this.cleanup(elt);
        internalData = this.getInternalData(elt);
      }
      if (!this.triggerEvent(elt, "hyperscript:before:init")) return;
      internalData.initialized = true;
      internalData.scriptHash = hash;
      try {
        var tokens = this.#tokenizer.tokenize(src);
        var hyperScript = this.#kernel.parseHyperScript(tokens);
        if (!hyperScript) return;
        if (hyperScript.errors?.length) {
          this.triggerEvent(elt, "hyperscript:parse-error", {
            errors: hyperScript.errors
          });
          console.error(
            "hyperscript: " + hyperScript.errors.length + " parse error(s) on:",
            elt,
            "\n\n" + Parser.formatErrors(hyperScript.errors)
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
    }
    #beforeProcessHooks = [];
    #afterProcessHooks = [];
    addBeforeProcessHook(fn) {
      this.#beforeProcessHooks.push(fn);
    }
    addAfterProcessHook(fn) {
      this.#afterProcessHooks.push(fn);
    }
    processNode(elt) {
      for (var fn of this.#beforeProcessHooks) fn(elt);
      var selector = this.#getScriptSelector();
      if (this.matchesSelector(elt, selector)) {
        this.#initElement(elt, elt);
      }
      if (elt instanceof HTMLScriptElement && elt.type === "text/hyperscript") {
        this.#initElement(elt, document.body);
      }
      if (elt.querySelectorAll) {
        this.forEach(elt.querySelectorAll(selector + ", [type='text/hyperscript']"), (elt2) => {
          this.#initElement(elt2, elt2 instanceof HTMLScriptElement && elt2.type === "text/hyperscript" ? document.body : elt2);
        });
      }
      for (var fn of this.#afterProcessHooks) fn(elt);
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
        var typeName = !value ? "object (null)" : value instanceof ElementCollection ? "ElementCollection" : value.constructor?.name || "unknown";
        var logValue = typeName === "String" ? '"' + value + '"' : value instanceof ElementCollection ? Array.from(value) : value;
        console.log("///_ BEEP! The expression (" + expression.sourceFor().replace("beep! ", "") + ") evaluates to:", logValue, "of type " + typeName);
      }
    }
  };

  // src/core/runtime/reactivity.js
  function _sameValue(a, b) {
    return a === b ? a !== 0 || 1 / a === 1 / b : a !== a && b !== b;
  }
  var Effect = class {
    /**
     * @param {() => any} expression - The watched expression
     * @param {(v: any) => void} handler - Called when value changes
     * @param {Element|null} element - Owner element; auto-stops when disconnected
     * @param {Reactivity} reactivity - The owning reactivity system
     */
    constructor(expression, handler, element, reactivity2) {
      this.expression = expression;
      this.handler = handler;
      this.element = element;
      this._reactivity = reactivity2;
      this.dependencies = /* @__PURE__ */ new Map();
      this._lastValue = void 0;
      this._isStopped = false;
      this._consecutiveTriggers = 0;
    }
    /**
     * First evaluation: track deps, subscribe, call handler if non-null.
     * Both undefined and null are treated as "no value yet" to support
     * left-side-wins initialization in bind.
     */
    initialize() {
      var reactivity2 = this._reactivity;
      var prev = reactivity2._currentEffect;
      reactivity2._currentEffect = this;
      try {
        this._lastValue = this.expression();
      } catch (e) {
        console.error("Error in reactive expression:", e);
      }
      reactivity2._currentEffect = prev;
      reactivity2._subscribeEffect(this);
      if (this._lastValue != null) {
        try {
          this.handler(this._lastValue);
        } catch (e) {
          console.error("Error in reactive handler:", e);
        }
      }
    }
    /**
     * Re-evaluate expression with dependency tracking, compare with last
     * value, and call handler if changed. Returns false if circular
     * guard tripped (caller should skip this effect).
     * @returns {boolean} Whether the effect ran successfully
     */
    run() {
      this._consecutiveTriggers++;
      if (this._consecutiveTriggers > 100) {
        console.error(
          "Reactivity loop detected: an effect triggered 100 consecutive times without settling. This usually means an effect is modifying a variable it also depends on.",
          this.element || this
        );
        return false;
      }
      var reactivity2 = this._reactivity;
      reactivity2._unsubscribeEffect(this);
      var oldDeps = this.dependencies;
      this.dependencies = /* @__PURE__ */ new Map();
      var prev = reactivity2._currentEffect;
      reactivity2._currentEffect = this;
      var newValue;
      try {
        newValue = this.expression();
      } catch (e) {
        console.error("Error in reactive expression:", e);
        this.dependencies = oldDeps;
        reactivity2._currentEffect = prev;
        reactivity2._subscribeEffect(this);
        return true;
      }
      reactivity2._currentEffect = prev;
      reactivity2._subscribeEffect(this);
      reactivity2._cleanupOrphanedDeps(oldDeps);
      if (!_sameValue(newValue, this._lastValue)) {
        this._lastValue = newValue;
        try {
          this.handler(newValue);
        } catch (e) {
          console.error("Error in reactive handler:", e);
        }
      }
      return true;
    }
    /** Reset circular guard after cascade settles. */
    resetTriggerCount() {
      this._consecutiveTriggers = 0;
    }
    /** Stop this effect and clean up all subscriptions. */
    stop() {
      if (this._isStopped) return;
      this._isStopped = true;
      this._reactivity._unsubscribeEffect(this);
      this._reactivity._cleanupOrphanedDeps(this.dependencies);
      this._reactivity._pendingEffects.delete(this);
    }
  };
  var Reactivity = class {
    constructor() {
      this._objectState = /* @__PURE__ */ new WeakMap();
      this._globalSubscriptions = /* @__PURE__ */ new Map();
      this._nextId = 0;
      this._currentEffect = null;
      this._pendingEffects = /* @__PURE__ */ new Set();
      this._isRunScheduled = false;
    }
    /**
     * Get or create the reactive state object for any object.
     * Assigns a stable unique ID on first access.
     * @param {Object} obj - DOM element or plain JS object
     * @returns {{ id: string, subscriptions: Map|null, propertyHandler: Object|null }}
     */
    _getObjectState(obj) {
      var state = this._objectState.get(obj);
      if (!state) {
        this._objectState.set(obj, state = {
          id: String(++this._nextId),
          subscriptions: null,
          propertyHandler: null,
          attributeObservers: null
        });
      }
      return state;
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
      var elementId = this._getObjectState(element).id;
      this._currentEffect.dependencies.set(
        "symbol:element:" + name + ":" + elementId,
        { type: "symbol", name, scope: "element", element }
      );
    }
    /**
     * Track a property read as a dependency.
     * Subscription is coarse-grained (one handler per object, not per property),
     * so the dep key uses "*" rather than the property name.
     * @param {Object} obj - DOM element or plain JS object
     * @param {string} name - Property name
     */
    trackProperty(obj, name) {
      if (obj == null || typeof obj !== "object" || obj._hsSkipTracking) return;
      this._currentEffect.dependencies.set(
        "property:" + this._getObjectState(obj).id,
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
        "attribute:" + name + ":" + this._getObjectState(element).id,
        { type: "attribute", element, name }
      );
    }
    /**
     * Notify that a global variable was written.
     * @param {string} name - Variable name
     */
    notifyGlobalSymbol(name) {
      var subs = this._globalSubscriptions.get(name);
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
      var state = this._getObjectState(element);
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
      if (obj == null || typeof obj !== "object" || obj._hsSkipTracking) return;
      var state = this._objectState.get(obj);
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
      if (effect._isStopped) return;
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
      for (var i = 0; i < effects.length; i++) {
        var effect = effects[i];
        if (effect._isStopped) continue;
        if (effect.element && !effect.element.isConnected) {
          effect.stop();
          continue;
        }
        effect.run();
      }
      if (this._pendingEffects.size === 0) {
        for (var i = 0; i < effects.length; i++) {
          if (!effects[i]._isStopped) effects[i].resetTriggerCount();
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
          if (!reactivity2._globalSubscriptions.has(dep.name)) {
            reactivity2._globalSubscriptions.set(dep.name, /* @__PURE__ */ new Set());
          }
          reactivity2._globalSubscriptions.get(dep.name).add(effect);
        } else if (dep.type === "symbol" && dep.scope === "element") {
          var state = reactivity2._getObjectState(dep.element);
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
      var state = reactivity2._getObjectState(element);
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
      var state = reactivity2._getObjectState(obj);
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
      var reactivity2 = this;
      for (var [depKey, dep] of effect.dependencies) {
        if (dep.type === "symbol" && dep.scope === "global") {
          var subs = reactivity2._globalSubscriptions.get(dep.name);
          if (subs) {
            subs.delete(effect);
            if (subs.size === 0) {
              reactivity2._globalSubscriptions.delete(dep.name);
            }
          }
        } else if (dep.type === "symbol" && dep.scope === "element") {
          var state = reactivity2._getObjectState(dep.element);
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
          var state = reactivity2._getObjectState(dep.element);
          if (state.attributeObservers && state.attributeObservers[dep.name]) {
            state.attributeObservers[dep.name].effects.delete(effect);
          }
        } else if (dep.type === "property" && dep.object) {
          var state = reactivity2._getObjectState(dep.object);
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
      var reactivity2 = this;
      for (var [depKey, dep] of deps) {
        if (dep.type === "attribute" && dep.element) {
          var state = reactivity2._getObjectState(dep.element);
          if (state.attributeObservers && state.attributeObservers[dep.name]) {
            var obs = state.attributeObservers[dep.name];
            if (obs.effects.size === 0) {
              obs.observer.disconnect();
              delete state.attributeObservers[dep.name];
            }
          }
        } else if (dep.type === "property" && dep.object) {
          var state = reactivity2._getObjectState(dep.object);
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
      var effect = new Effect(
        expression,
        handler,
        options && options.element || null,
        this
      );
      effect.initialize();
      if (effect.element) {
        var data = effect.element._hyperscript ??= {};
        data.effects ??= /* @__PURE__ */ new Set();
        data.effects.add(effect);
      }
      return function() {
        effect.stop();
      };
    }
    /** Stop all reactive effects owned by an element. */
    stopElementEffects(element) {
      var data = element._hyperscript;
      if (!data || !data.effects) return;
      for (var effect of data.effects) {
        effect.stop();
      }
      delete data.effects;
    }
  };

  // src/core/runtime/morph.js
  var Morph = class {
    /**
     * Morph oldNode to match content.
     * @param {Element} oldNode - The existing DOM element to morph
     * @param {string|Element|DocumentFragment} content - The new content
     * @param {MorphCallbacks} [callbacks] - Optional lifecycle callbacks
     */
    morph(oldNode, content, callbacks = {}) {
      var fragment;
      if (typeof content === "string") {
        var temp = document.createElement("template");
        temp.innerHTML = content;
        fragment = temp.content;
      } else if (content instanceof DocumentFragment) {
        fragment = content;
      } else if (content instanceof Element) {
        fragment = document.createDocumentFragment();
        fragment.append(content.cloneNode(true));
      } else {
        throw new Error("morph requires an HTML string, element, or document fragment");
      }
      var newRoot = fragment.firstElementChild;
      if (newRoot && !newRoot.nextElementSibling && newRoot.tagName === oldNode.tagName) {
        _copyAttributes(oldNode, newRoot);
        fragment = newRoot;
      }
      var { persistentIds, idMap } = _createIdMaps(oldNode, fragment);
      var pantry = document.createElement("div");
      pantry.hidden = true;
      (document.body || oldNode.parentElement).after(pantry);
      var ctx = { target: oldNode, idMap, persistentIds, pantry, futureMatches: /* @__PURE__ */ new WeakSet(), callbacks };
      _morphChildren(ctx, oldNode, fragment);
      callbacks.beforeNodeRemoved?.(pantry);
      pantry.remove();
    }
  };
  function _morphChildren(ctx, oldParent, newParent, insertionPoint = null, endPoint = null) {
    if (oldParent instanceof HTMLTemplateElement && newParent instanceof HTMLTemplateElement) {
      oldParent = oldParent.content;
      newParent = newParent.content;
    }
    insertionPoint ||= oldParent.firstChild;
    let newChild = newParent.firstChild;
    while (newChild) {
      let matchedNode;
      if (insertionPoint && insertionPoint !== endPoint) {
        matchedNode = _findBestMatch(ctx, newChild, insertionPoint, endPoint);
        if (matchedNode && matchedNode !== insertionPoint) {
          let cursor = insertionPoint;
          while (cursor && cursor !== matchedNode) {
            let tempNode = cursor;
            cursor = cursor.nextSibling;
            if (tempNode instanceof Element && (ctx.idMap.has(tempNode) || _matchesUpcomingSibling(ctx, tempNode, newChild))) {
              _moveBefore(oldParent, tempNode, endPoint);
            } else {
              _removeNode(ctx, tempNode);
            }
          }
        }
      }
      if (!matchedNode && newChild instanceof Element && ctx.persistentIds.has(newChild.id)) {
        let escapedId = CSS.escape(newChild.id);
        matchedNode = ctx.target.id === newChild.id && ctx.target || ctx.target.querySelector('[id="' + escapedId + '"]') || ctx.pantry.querySelector('[id="' + escapedId + '"]');
        let element = matchedNode;
        while (element = element.parentNode) {
          let idSet = ctx.idMap.get(element);
          if (idSet) {
            idSet.delete(matchedNode.id);
            if (!idSet.size) ctx.idMap.delete(element);
          }
        }
        _moveBefore(oldParent, matchedNode, insertionPoint);
      }
      if (matchedNode) {
        _morphNode(matchedNode, newChild, ctx);
        insertionPoint = matchedNode.nextSibling;
        newChild = newChild.nextSibling;
        continue;
      }
      let nextNewChild = newChild.nextSibling;
      if (ctx.idMap.has(newChild)) {
        let placeholder = document.createElement(newChild.tagName);
        oldParent.insertBefore(placeholder, insertionPoint);
        _morphNode(placeholder, newChild, ctx);
        insertionPoint = placeholder.nextSibling;
      } else {
        oldParent.insertBefore(newChild, insertionPoint);
        ctx.callbacks.afterNodeAdded?.(newChild);
        insertionPoint = newChild.nextSibling;
      }
      newChild = nextNewChild;
    }
    while (insertionPoint && insertionPoint !== endPoint) {
      let tempNode = insertionPoint;
      insertionPoint = insertionPoint.nextSibling;
      _removeNode(ctx, tempNode);
    }
  }
  function _morphNode(oldNode, newNode, ctx) {
    if (!(oldNode instanceof Element)) return;
    _copyAttributes(oldNode, newNode);
    if (oldNode instanceof HTMLTextAreaElement && oldNode.defaultValue !== newNode.defaultValue) {
      oldNode.value = newNode.value;
    }
    if (!oldNode.isEqualNode(newNode) || newNode.tagName === "TEMPLATE" || newNode.querySelector?.("template")) {
      _morphChildren(ctx, oldNode, newNode);
    }
    ctx.callbacks.afterNodeMorphed?.(oldNode);
  }
  function _findBestMatch(ctx, node, startPoint, endPoint) {
    if (!(node instanceof Element)) return null;
    var softMatch = null, displaceMatchCount = 0, scanLimit = 10;
    var newSet = ctx.idMap.get(node), nodeMatchCount = newSet?.size || 0;
    if (node.id && !newSet) return null;
    var cursor = startPoint;
    while (cursor && cursor !== endPoint) {
      var oldSet = ctx.idMap.get(cursor);
      if (_isSoftMatch(cursor, node)) {
        if (oldSet && newSet && [...oldSet].some((id) => newSet.has(id))) return cursor;
        if (!oldSet) {
          if (scanLimit > 0 && cursor.isEqualNode(node)) return cursor;
          if (!softMatch) softMatch = cursor;
        }
      }
      displaceMatchCount += oldSet?.size || 0;
      if (displaceMatchCount > nodeMatchCount) break;
      if (cursor.contains(document.activeElement)) break;
      if (--scanLimit < 1 && nodeMatchCount === 0) break;
      cursor = cursor.nextSibling;
    }
    if (softMatch && _matchesUpcomingSibling(ctx, softMatch, node)) return null;
    return softMatch;
  }
  function _matchesUpcomingSibling(ctx, oldElt, startNode) {
    if (ctx.futureMatches.has(oldElt)) return true;
    for (var sibling = startNode.nextSibling, i = 0; sibling && i < 10; sibling = sibling.nextSibling, i++) {
      if (sibling instanceof Element && oldElt.isEqualNode(sibling)) {
        ctx.futureMatches.add(oldElt);
        return true;
      }
    }
    return false;
  }
  function _removeNode(ctx, node) {
    if (ctx.idMap.has(node)) {
      _moveBefore(ctx.pantry, node, null);
    } else {
      ctx.callbacks.beforeNodeRemoved?.(node);
      node.remove();
    }
  }
  function _moveBefore(parentNode, element, after) {
    if (parentNode.moveBefore) {
      try {
        parentNode.moveBefore(element, after);
        return;
      } catch (e) {
      }
    }
    parentNode.insertBefore(element, after);
  }
  function _copyAttributes(destination, source) {
    for (var attr of source.attributes) {
      if (destination.getAttribute(attr.name) !== attr.value) {
        destination.setAttribute(attr.name, attr.value);
        if (attr.name === "value" && destination instanceof HTMLInputElement && destination.type !== "file") {
          destination.value = attr.value;
        }
      }
    }
    for (var i = destination.attributes.length - 1; i >= 0; i--) {
      var attr = destination.attributes[i];
      if (attr && !source.hasAttribute(attr.name)) {
        destination.removeAttribute(attr.name);
      }
    }
  }
  function _isSoftMatch(oldNode, newNode) {
    if (!(oldNode instanceof Element) || oldNode.tagName !== newNode.tagName) return false;
    if (oldNode.tagName === "SCRIPT" && !oldNode.isEqualNode(newNode)) return false;
    return !oldNode.id || oldNode.id === newNode.id;
  }
  function _createIdMaps(oldNode, newContent) {
    var oldIdElements = _queryEltAndDescendants(oldNode, "[id]");
    var newIdElements = newContent.querySelectorAll("[id]");
    var persistentIds = _createPersistentIds(oldIdElements, newIdElements);
    var idMap = /* @__PURE__ */ new Map();
    _populateIdMapWithTree(idMap, persistentIds, oldNode.parentElement, oldIdElements);
    _populateIdMapWithTree(idMap, persistentIds, newContent, newIdElements);
    return { persistentIds, idMap };
  }
  function _createPersistentIds(oldIdElements, newIdElements) {
    var duplicateIds = /* @__PURE__ */ new Set(), oldIdTagNameMap = /* @__PURE__ */ new Map();
    for (var { id, tagName } of oldIdElements) {
      if (oldIdTagNameMap.has(id)) duplicateIds.add(id);
      else if (id) oldIdTagNameMap.set(id, tagName);
    }
    var persistentIds = /* @__PURE__ */ new Set();
    for (var { id, tagName } of newIdElements) {
      if (persistentIds.has(id)) duplicateIds.add(id);
      else if (oldIdTagNameMap.get(id) === tagName) persistentIds.add(id);
    }
    for (var id of duplicateIds) persistentIds.delete(id);
    return persistentIds;
  }
  function _populateIdMapWithTree(idMap, persistentIds, root, elements) {
    for (var elt of elements) {
      if (persistentIds.has(elt.id)) {
        var current = elt;
        while (current && current !== root) {
          var idSet = idMap.get(current);
          if (idSet == null) {
            idSet = /* @__PURE__ */ new Set();
            idMap.set(current, idSet);
          }
          idSet.add(elt.id);
          current = current.parentElement;
        }
      }
    }
  }
  function _queryEltAndDescendants(elt, selector) {
    var results = [...elt.querySelectorAll?.(selector) ?? []];
    if (elt.matches?.(selector)) results.unshift(elt);
    return results;
  }

  // src/core/runtime/htmx-compat.js
  var HtmxCompat = class _HtmxCompat {
    #processingFromHtmx = false;
    constructor(globalScope2, hyperscript) {
      this.globalScope = globalScope2;
      this.hyperscript = hyperscript;
    }
    init() {
      var self2 = this;
      var globalScope2 = this.globalScope;
      var _hyperscript2 = this.hyperscript;
      globalScope2.document.addEventListener("htmx:load", function(evt) {
        self2.#processingFromHtmx = true;
        _hyperscript2.process(evt.detail.elt);
        self2.#processingFromHtmx = false;
      });
      globalScope2.document.addEventListener("htmx:after:process", function(evt) {
        self2.#processingFromHtmx = true;
        _hyperscript2.process(evt.target);
        self2.#processingFromHtmx = false;
      });
      if (typeof htmx !== "undefined") {
        _hyperscript2.addAfterProcessHook(function(elt) {
          if (!self2.#processingFromHtmx) htmx.process(elt);
        });
        if (htmx.version?.startsWith("4")) {
          htmx.registerExtension("hs-include", {
            htmx_config_request: function(elt, detail) {
              var ctx = detail?.ctx;
              if (!ctx) return;
              var sourceElt = ctx.sourceElement || elt;
              var found = _HtmxCompat.#findHsInclude(sourceElt);
              if (!found) return;
              var vars = _HtmxCompat.#resolveSpecifiers(found.value, found.scopeElt);
              var body = ctx.request?.body;
              if (body instanceof FormData) {
                for (var k in vars) body.set(k, vars[k]);
              }
            }
          });
        }
      }
    }
    // ----- hs-include helpers -----
    static #findHsInclude(sourceElt) {
      var attr = sourceElt.getAttribute("hs-include");
      if (attr !== null) return { value: attr, scopeElt: sourceElt };
      var elt = sourceElt.parentElement;
      while (elt) {
        attr = elt.getAttribute("hs-include:inherited");
        if (attr !== null) return { value: attr, scopeElt: elt };
        elt = elt.parentElement;
      }
      return null;
    }
    static #readScope(elt) {
      return elt?._hyperscript?.elementScope || {};
    }
    static #serialize(value) {
      if (value == null) return "";
      if (typeof value === "object") {
        try {
          return JSON.stringify(value);
        } catch (_) {
          return "";
        }
      }
      return String(value);
    }
    static #resolveInherited(scopeKey, startElt) {
      var elt = startElt;
      while (elt) {
        var scope = elt._hyperscript?.elementScope;
        if (scope && scopeKey in scope) return scope[scopeKey];
        elt = elt.parentElement;
      }
    }
    static #resolveSpecifiers(attrValue, scopeElt) {
      var result = {};
      var raw = attrValue.trim();
      if (raw === "*") {
        var scope = this.#readScope(scopeElt);
        for (var k in scope) {
          if (Object.prototype.hasOwnProperty.call(scope, k)) {
            result[k[0] === ":" ? k.slice(1) : k] = this.#serialize(scope[k]);
          }
        }
        return result;
      }
      var self2 = this;
      raw.split(",").forEach(function(part) {
        part = part.trim();
        if (!part) return;
        if (part[0] === ":") {
          var name = part.slice(1);
          var scope2 = self2.#readScope(scopeElt);
          var scopeKey = ":" + name;
          if (scopeKey in scope2) result[name] = self2.#serialize(scope2[scopeKey]);
        } else if (part[0] === "^") {
          var name = part.slice(1);
          var val = self2.#resolveInherited(":" + name, scopeElt);
          if (val !== void 0) result[name] = self2.#serialize(val);
        } else if (part[0] === "#") {
          var colonIdx = part.lastIndexOf(":");
          if (colonIdx > 0) {
            var selector = part.slice(0, colonIdx);
            var name = part.slice(colonIdx + 1);
            var targetElt = document.querySelector(selector);
            if (targetElt) {
              var scope2 = self2.#readScope(targetElt);
              var scopeKey = ":" + name;
              if (scopeKey in scope2) result[name] = self2.#serialize(scope2[scopeKey]);
            }
          }
        }
      });
      return result;
    }
  };

  // src/parsetree/expressions/expressions.js
  var expressions_exports = {};
  __export(expressions_exports, {
    ArrayIndex: () => ArrayIndex,
    AsExpression: () => AsExpression,
    AttributeRefAccess: () => AttributeRefAccess,
    BeepExpression: () => BeepExpression,
    BlockLiteral: () => BlockLiteral,
    CollectionExpression: () => CollectionExpression,
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
  var ParenthesizedExpression = class _ParenthesizedExpression extends Expression {
    static grammarName = "parenthesized";
    static expressionType = "leaf";
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
  var BlockLiteral = class _BlockLiteral extends Expression {
    static grammarName = "blockLiteral";
    static expressionType = "leaf";
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
  var NegativeNumber = class _NegativeNumber extends Expression {
    static grammarName = "negativeNumber";
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
      return -value;
    }
  };
  var LogicalNot = class _LogicalNot extends Expression {
    static grammarName = "logicalNot";
    static expressionType = "unary";
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
  var SymbolRef = class _SymbolRef extends Expression {
    static grammarName = "symbol";
    static assignable = true;
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
          var follows = parser.pushFollows("to", "into", "before", "after", "then");
          try {
            targetExpr = parser.requireElement("expression");
          } finally {
            parser.popFollows(follows);
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
  var BeepExpression = class _BeepExpression extends Expression {
    static grammarName = "beepExpression";
    static expressionType = "unary";
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
  var PropertyAccess = class _PropertyAccess extends Expression {
    static grammarName = "propertyAccess";
    static expressionType = "indirect";
    static assignable = true;
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
      return context.meta.runtime.resolveProperty(rootVal, this.prop.value);
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
  var OfExpression = class _OfExpression extends Expression {
    static grammarName = "ofExpression";
    static expressionType = "indirect";
    static assignable = true;
    constructor(prop, newRoot, attribute, expression, args, urRoot) {
      super();
      this.prop = prop;
      this.root = newRoot;
      this.attribute = attribute;
      this.expression = expression;
      this.args = args;
      this._urRoot = urRoot;
      this._prop = urRoot.name;
      this._isAttribute = urRoot.type === "attributeRef";
      this._isStyle = urRoot.type === "styleRef";
      this._isComputed = urRoot.type === "computedStyleRef";
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
      var validOfRoots = ["symbol", "attributeRef", "styleRef", "computedStyleRef"];
      if (!validOfRoots.includes(urRoot.type)) {
        parser.raiseError("Cannot take a property of a non-symbol: " + urRoot.type);
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
      if (this._isAttribute) {
        return context.meta.runtime.resolveAttribute(rootVal, this._prop);
      } else if (this._isComputed) {
        return context.meta.runtime.resolveComputedStyle(rootVal, this._prop);
      } else if (this._isStyle) {
        return context.meta.runtime.resolveStyle(rootVal, this._prop);
      } else {
        return context.meta.runtime.resolveProperty(rootVal, this._prop);
      }
    }
    get lhs() {
      return { root: this.root };
    }
    set(ctx, lhs, value) {
      ctx.meta.runtime.nullCheck(lhs.root, this.root);
      if (this._isAttribute) {
        ctx.meta.runtime.implicitLoop(lhs.root, (elt) => {
          value == null ? elt.removeAttribute(this._prop) : elt.setAttribute(this._prop, value);
        });
      } else if (this._isStyle) {
        ctx.meta.runtime.implicitLoop(lhs.root, (elt) => {
          elt.style[this._prop] = value;
        });
      } else {
        var runtime2 = ctx.meta.runtime;
        runtime2.implicitLoop(lhs.root, (elt) => {
          runtime2.setProperty(elt, this._prop, value);
        });
      }
    }
  };
  var PossessiveExpression = class _PossessiveExpression extends Expression {
    static grammarName = "possessive";
    static expressionType = "indirect";
    static assignable = true;
    constructor(root, attribute, prop) {
      super();
      this.root = root;
      this.attribute = attribute;
      this.prop = prop;
      this.args = { root };
    }
    static parse(parser, root) {
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
  var InExpression = class _InExpression extends Expression {
    static grammarName = "inExpression";
    static expressionType = "indirect";
    static assignable = true;
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
    get lhs() {
      return { root: this.root, target: this.target };
    }
    set(ctx, lhs, value) {
      var targets = this.resolve(ctx, lhs);
      ctx.meta.runtime.replaceInDom(targets, value);
    }
  };
  var AsExpression = class _AsExpression extends Expression {
    static grammarName = "asExpression";
    static expressionType = "indirect";
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
  var FunctionCall = class _FunctionCall extends Expression {
    static grammarName = "functionCall";
    static expressionType = "indirect";
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
        var methodName = this._parseRoot.prop.value;
        var func = target[methodName];
        context.meta.runtime.nullCheck(func, this._parseRoot);
        if (func.hyperfunc) {
          argVals.push(context);
        }
        var result = func.apply(target, argVals);
        context.meta.runtime.maybeNotify(target, methodName);
        return result;
      } else {
        context.meta.runtime.nullCheck(target, this._parseRoot);
        if (target.hyperfunc) {
          argVals.push(context);
        }
        return target(...argVals);
      }
    }
  };
  var AttributeRefAccess = class _AttributeRefAccess extends Expression {
    static grammarName = "attributeRefAccess";
    static expressionType = "indirect";
    static assignable = true;
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
      return _ctx.meta.runtime.resolveAttribute(rootVal, this.attribute.name);
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
  var ArrayIndex = class _ArrayIndex extends Expression {
    static grammarName = "arrayIndex";
    static expressionType = "indirect";
    static assignable = true;
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
  var MathOperator = class _MathOperator extends Expression {
    static grammarName = "mathOperator";
    constructor(lhs, operator, rhs) {
      super();
      this.lhs = lhs;
      this.rhs = rhs;
      this.operator = operator;
      this.args = { lhs, rhs };
    }
    static parse(parser) {
      var expr = parser.parseElement("collectionExpression");
      var mathOp, initialMathOp = null;
      mathOp = parser.matchAnyOpToken("+", "-", "*", "/") || parser.matchToken("mod");
      while (mathOp) {
        initialMathOp = initialMathOp || mathOp;
        var operator = mathOp.value;
        if (initialMathOp.value !== operator) {
          parser.raiseError("You must parenthesize math operations with different operators");
        }
        var rhs = parser.parseElement("collectionExpression");
        expr = new _MathOperator(expr, operator, rhs);
        mathOp = parser.matchAnyOpToken("+", "-", "*", "/") || parser.matchToken("mod");
      }
      return expr;
    }
    resolve(context, { lhs: lhsVal, rhs: rhsVal }) {
      if (this.operator === "+") {
        if (Array.isArray(lhsVal)) return lhsVal.concat(rhsVal);
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
  var ComparisonOperator = class _ComparisonOperator extends Expression {
    static grammarName = "comparisonOperator";
    constructor(lhs, operator, rhs, typeName, nullOk, ignoringCase, rhs2) {
      super();
      this.operator = operator;
      this.typeName = typeName;
      this.nullOk = nullOk;
      this.ignoringCase = ignoringCase;
      this.lhs = lhs;
      this.rhs = rhs;
      this.rhs2 = rhs2;
      this.args = { lhs, rhs, rhs2 };
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
            } else if (parser.matchToken("between")) {
              operator = "not between";
            } else if (parser.matchToken("really")) {
              operator = "!==";
              if (parser.matchToken("equal")) parser.matchToken("to");
            } else if (parser.matchToken("equal")) {
              parser.matchToken("to");
              operator = "!=";
            } else {
              operator = "is not";
            }
          } else if (parser.matchToken("in")) {
            operator = "in";
          } else if (parser.matchToken("a") || parser.matchToken("an")) {
            operator = "a";
            typeCheck = true;
          } else if (parser.matchToken("empty")) {
            operator = "empty";
            hasRightValue = false;
          } else if (parser.matchToken("between")) {
            operator = "between";
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
          } else if (parser.matchToken("really")) {
            operator = "===";
            if (parser.matchToken("equal")) parser.matchToken("to");
          } else if (parser.matchToken("equal")) {
            parser.matchToken("to");
            operator = "==";
          } else {
            operator = "is";
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
        } else if (parser.matchToken("starts")) {
          parser.requireToken("with");
          operator = "start with";
        } else if (parser.matchToken("ends")) {
          parser.requireToken("with");
          operator = "end with";
        } else if (parser.matchToken("precedes") || parser.matchToken("precede")) {
          operator = "precede";
        } else if (parser.matchToken("follows") || parser.matchToken("follow")) {
          operator = "follow";
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
          } else if (parser.matchToken("start")) {
            parser.requireToken("with");
            operator = "not start with";
          } else if (parser.matchToken("end")) {
            parser.requireToken("with");
            operator = "not end with";
          } else if (parser.matchToken("precede")) {
            operator = "not precede";
          } else if (parser.matchToken("follow")) {
            operator = "not follow";
          } else {
            parser.raiseExpected("matches", "contains", "starts with", "ends with", "precede", "follow");
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
        var rhs2 = null;
        if (operator === "between" || operator === "not between") {
          parser.requireToken("and");
          rhs2 = parser.requireElement("mathOperator");
        }
        var ignoringCase = false;
        if (parser.matchToken("ignoring")) {
          parser.requireToken("case");
          ignoringCase = true;
        }
        var lhs = expr;
        expr = new _ComparisonOperator(lhs, operator, rhs, typeName, nullOk, ignoringCase, rhs2);
      }
      return expr;
    }
    resolve(context, { lhs: lhsVal, rhs: rhsVal, rhs2: rhs2Val }) {
      const operator = this.operator;
      const lhs = this.lhs;
      const rhs = this.rhs;
      const typeName = this.typeName;
      const nullOk = this.nullOk;
      if (this.ignoringCase) {
        if (typeof lhsVal === "string") lhsVal = lhsVal.toLowerCase();
        if (typeof rhsVal === "string") rhsVal = rhsVal.toLowerCase();
      }
      if (operator === "is") {
        if (rhsVal === void 0 && rhs.type === "symbol" && rhs.scope === "default" && rhs.name !== "undefined" && rhs.name !== "null") {
          return !!context.meta.runtime.resolveProperty(lhsVal, rhs.name);
        }
        return lhsVal == rhsVal;
      }
      if (operator === "is not") {
        if (rhsVal === void 0 && rhs.type === "symbol" && rhs.scope === "default" && rhs.name !== "undefined" && rhs.name !== "null") {
          return !context.meta.runtime.resolveProperty(lhsVal, rhs.name);
        }
        return lhsVal != rhsVal;
      }
      if (operator === "==") return lhsVal == rhsVal;
      if (operator === "!=") return lhsVal != rhsVal;
      if (operator === "===") return lhsVal === rhsVal;
      if (operator === "!==") return lhsVal !== rhsVal;
      if (operator === "<") return lhsVal < rhsVal;
      if (operator === ">") return lhsVal > rhsVal;
      if (operator === "<=") return lhsVal <= rhsVal;
      if (operator === ">=") return lhsVal >= rhsVal;
      if (operator === "match") return lhsVal != null && this.sloppyMatches(lhs, lhsVal, rhsVal);
      if (operator === "not match") return lhsVal == null || !this.sloppyMatches(lhs, lhsVal, rhsVal);
      if (operator === "in") return rhsVal != null && this.sloppyContains(rhs, rhsVal, lhsVal);
      if (operator === "not in") return rhsVal == null || !this.sloppyContains(rhs, rhsVal, lhsVal);
      if (operator === "contain" || operator === "include") return lhsVal != null && this.sloppyContains(lhs, lhsVal, rhsVal);
      if (operator === "not contain" || operator === "not include") return lhsVal == null || !this.sloppyContains(lhs, lhsVal, rhsVal);
      if (operator === "start with") return lhsVal != null && String(lhsVal).startsWith(rhsVal);
      if (operator === "not start with") return lhsVal == null || !String(lhsVal).startsWith(rhsVal);
      if (operator === "end with") return lhsVal != null && String(lhsVal).endsWith(rhsVal);
      if (operator === "not end with") return lhsVal == null || !String(lhsVal).endsWith(rhsVal);
      if (operator === "between") return lhsVal >= rhsVal && lhsVal <= rhs2Val;
      if (operator === "not between") return lhsVal < rhsVal || lhsVal > rhs2Val;
      if (operator === "precede") return lhsVal != null && rhsVal != null && (lhsVal.compareDocumentPosition(rhsVal) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;
      if (operator === "not precede") return lhsVal == null || rhsVal == null || (lhsVal.compareDocumentPosition(rhsVal) & Node.DOCUMENT_POSITION_FOLLOWING) === 0;
      if (operator === "follow") return lhsVal != null && rhsVal != null && (lhsVal.compareDocumentPosition(rhsVal) & Node.DOCUMENT_POSITION_PRECEDING) !== 0;
      if (operator === "not follow") return lhsVal == null || rhsVal == null || (lhsVal.compareDocumentPosition(rhsVal) & Node.DOCUMENT_POSITION_PRECEDING) === 0;
      if (operator === "empty") return context.meta.runtime.isEmpty(lhsVal);
      if (operator === "not empty") return !context.meta.runtime.isEmpty(lhsVal);
      if (operator === "exist") return context.meta.runtime.doesExist(lhsVal);
      if (operator === "not exist") return !context.meta.runtime.doesExist(lhsVal);
      if (operator === "a") return context.meta.runtime.typeCheck(lhsVal, typeName.value, nullOk);
      if (operator === "not a") return !context.meta.runtime.typeCheck(lhsVal, typeName.value, nullOk);
      throw new Error("Unknown comparison : " + operator);
    }
  };
  var LogicalOperator = class _LogicalOperator extends Expression {
    static grammarName = "logicalOperator";
    static expressionType = "top";
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
          parser.raiseError("You must parenthesize logical operations with different operators");
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
    // override to handle promise-compatible and/or short-circuiting
    evaluate(context) {
      var self2 = this;
      var shortCircuitValue = this.operator === "or";
      var lhsVal = this.lhs.evaluate(context);
      var continueWith = function(resolvedLhs) {
        if (!!resolvedLhs === shortCircuitValue) {
          return resolvedLhs;
        }
        var rhsVal = self2.rhs.evaluate(context);
        if (rhsVal && rhsVal.then) {
          return rhsVal.then((r) => self2.resolve(context, { lhs: resolvedLhs, rhs: r }));
        }
        return self2.resolve(context, { lhs: resolvedLhs, rhs: rhsVal });
      };
      if (lhsVal && lhsVal.then) {
        return lhsVal.then(continueWith);
      }
      return continueWith(lhsVal);
    }
  };
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
  var CollectionExpression = class extends Expression {
    static grammarName = "collectionExpression";
    static KEYWORDS = ["where", "sorted", "mapped", "split", "joined"];
    static parseOperand(parser) {
      var count = parser.pushFollows(...this.KEYWORDS);
      try {
        return parser.requireElement("expression");
      } finally {
        parser.popFollows(count);
      }
    }
    static parse(parser) {
      var root = parser.parseElement("unaryExpression");
      var changed = true;
      while (changed) {
        changed = false;
        if (parser.matchToken("where")) {
          root = new WhereExpression(root, this.parseOperand(parser));
          changed = true;
        } else if (parser.matchToken("sorted")) {
          parser.requireToken("by");
          var key = this.parseOperand(parser);
          var descending = parser.matchToken("descending");
          root = new SortedByExpression(root, key, !!descending);
          changed = true;
        } else if (parser.matchToken("mapped")) {
          parser.requireToken("to");
          root = new MappedToExpression(root, this.parseOperand(parser));
          changed = true;
        } else if (parser.matchToken("split")) {
          parser.requireToken("by");
          root = new SplitByExpression(root, this.parseOperand(parser));
          changed = true;
        } else if (parser.matchToken("joined")) {
          parser.requireToken("by");
          root = new JoinedByExpression(root, this.parseOperand(parser));
          changed = true;
        }
      }
      return root;
    }
  };
  var WhereExpression = class extends Expression {
    constructor(root, condition) {
      super();
      this.root = root;
      this.condition = condition;
      this.args = { root };
    }
    resolve(context, { root: collection }) {
      var result = [];
      var items = Array.from(collection);
      for (var i = 0; i < items.length; i++) {
        context.beingTested = items[i];
        if (this.condition.evaluate(context)) {
          result.push(items[i]);
        }
      }
      context.beingTested = null;
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
      var items = Array.from(collection);
      var keys = [];
      for (var i = 0; i < items.length; i++) {
        context.beingTested = items[i];
        keys.push(this.key.evaluate(context));
      }
      context.beingTested = null;
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
      var items = Array.from(collection);
      var result = [];
      for (var i = 0; i < items.length; i++) {
        context.beingTested = items[i];
        result.push(this.projection.evaluate(context));
      }
      context.beingTested = null;
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
    static grammarName = "dotOrColonPath";
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
  var IdRef = class _IdRef extends Expression {
    static grammarName = "idRef";
    static expressionType = "leaf";
    static assignable = true;
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
    get lhs() {
      return {};
    }
    set(ctx, lhs, value) {
      var target = this.resolve(ctx);
      if (target) ctx.meta.runtime.replaceInDom(target, value);
    }
  };
  var ClassRef = class _ClassRef extends Expression {
    static grammarName = "classRef";
    static expressionType = "leaf";
    static assignable = true;
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
    get lhs() {
      return {};
    }
    set(ctx, lhs, value) {
      var targets = Array.from(this.resolve(ctx));
      ctx.meta.runtime.replaceInDom(targets, value);
    }
  };
  var QueryRef = class _QueryRef extends Expression {
    static grammarName = "queryRef";
    static expressionType = "leaf";
    static assignable = true;
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
    get lhs() {
      return this.template ? { parts: this.templateArgs } : {};
    }
    set(ctx, lhs, value) {
      var targets = Array.from(this.resolve(ctx, lhs));
      ctx.meta.runtime.replaceInDom(targets, value);
    }
  };
  var AttributeRef = class _AttributeRef extends Expression {
    static grammarName = "attributeRef";
    static expressionType = "leaf";
    static assignable = true;
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
  var StyleRef = class _StyleRef extends Expression {
    static grammarName = "styleRef";
    static expressionType = "leaf";
    static assignable = true;
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
  var StyleLiteral = class _StyleLiteral extends Expression {
    static grammarName = "styleLiteral";
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
  var StringPostfixExpression = class _StringPostfixExpression extends Expression {
    static grammarName = "stringPostfixExpression";
    static expressionType = "postfix";
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
  var TimeExpression = class _TimeExpression extends Expression {
    static grammarName = "timeExpression";
    static expressionType = "postfix";
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
  var TypeCheckExpression = class _TypeCheckExpression extends Expression {
    static grammarName = "typeCheckExpression";
    static expressionType = "postfix";
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

  // src/parsetree/expressions/positional.js
  var positional_exports = {};
  __export(positional_exports, {
    ClosestExpr: () => ClosestExpr,
    PositionalExpression: () => PositionalExpression,
    RelativePositionalExpression: () => RelativePositionalExpression
  });
  var RelativePositionalExpression = class _RelativePositionalExpression extends Expression {
    static grammarName = "relativePositionalExpression";
    static expressionType = "unary";
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
      var thingElt = parser.parseElement("leaf");
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
        withinElt = null;
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
        var root = withinElt ?? document.body;
        if (this.forwardSearch) {
          return this.scanForwardQuery(from, root, css, this.wrapping);
        } else {
          return this.scanBackwardsQuery(from, root, css, this.wrapping);
        }
      }
    }
  };
  var PositionalExpression = class _PositionalExpression extends Expression {
    static grammarName = "positionalExpression";
    static expressionType = "unary";
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
      if (to == null) return null;
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
      return ctx.meta.runtime.shouldAutoIterate(to) ? result : result[0];
    }
    get lhs() {
      return { to: this.to };
    }
    set(ctx, lhs, value) {
      var target = this.resolve(ctx, lhs);
      if (target) ctx.meta.runtime.replaceInDom(target, value);
    }
  };
  var ClosestExpr = class extends Expression {
    static grammarName = "closestExpr";
    static expressionType = "leaf";
    static assignable = true;
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
        var expr = parser.requireElement("unaryExpression");
        if (expr.css == null) {
          parser.raiseError("Expected a CSS expression");
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

  // src/parsetree/expressions/existentials.js
  var existentials_exports = {};
  __export(existentials_exports, {
    NoExpression: () => NoExpression,
    SomeExpression: () => SomeExpression
  });
  var NoExpression = class _NoExpression extends Expression {
    static grammarName = "noExpression";
    static expressionType = "unary";
    constructor(root) {
      super();
      this.root = root;
      this.args = { value: root };
    }
    static parse(parser) {
      if (!parser.matchToken("no")) return;
      var root = parser.requireElement("collectionExpression");
      return new _NoExpression(root);
    }
    resolve(context, { value: val }) {
      return context.meta.runtime.isEmpty(val);
    }
  };
  var SomeExpression = class _SomeExpression extends Expression {
    static grammarName = "some";
    static expressionType = "leaf";
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

  // src/parsetree/expressions/targets.js
  var targets_exports = {};
  __export(targets_exports, {
    ImplicitMeTarget: () => ImplicitMeTarget
  });
  var ImplicitMeTarget = class _ImplicitMeTarget extends Expression {
    static grammarName = "implicitMeTarget";
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
  var LogCommand = class _LogCommand extends Command {
    static keyword = "log";
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
      return this.findNext(ctx);
    }
  };
  var BeepCommand = class _BeepCommand extends Command {
    static keyword = "beep!";
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
      return this.findNext(ctx);
    }
  };
  var ThrowCommand = class _ThrowCommand extends Command {
    static keyword = "throw";
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
  var ReturnCommand = class _ReturnCommand extends Command {
    static keyword = "return";
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
      if (resolve) resolve(value);
      return context.meta.runtime.HALT;
    }
  };
  var ExitCommand = class _ExitCommand extends Command {
    static keyword = "exit";
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
  var HaltCommand = class _HaltCommand extends Command {
    static keyword = "halt";
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
        return this.findNext(ctx);
      } else {
        return this.exit;
      }
    }
  };
  var MakeCommand = class _MakeCommand extends Command {
    static keyword = "make";
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
        result.classList.add(...classes);
        ctx.result = result;
      } else {
        ctx.result = new expr(...constructorArgs);
      }
      if (this.target) {
        ctx.meta.runtime.setSymbol(this.target.name, ctx, this.target.scope, ctx.result);
      }
      return this.findNext(ctx);
    }
  };
  var AppendCommand = class _AppendCommand extends Command {
    static keyword = "append";
    constructor(value, targetExpr, assignable) {
      super();
      this.value = value;
      this._target = targetExpr;
      this.assignable = assignable;
      if (assignable) {
        this.args = { target: targetExpr, value, ...targetExpr.lhs };
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
      var { target, value, ...lhs } = args;
      if (Array.isArray(target)) {
        target.push(value);
        context.meta.runtime.notifyMutation(target);
      } else if (target instanceof Set) {
        target.add(value);
        context.meta.runtime.notifyMutation(target);
      } else if (target instanceof Element) {
        if (value instanceof Element) {
          target.insertAdjacentElement("beforeend", value);
        } else {
          target.insertAdjacentHTML("beforeend", value);
        }
        context.meta.runtime.processNode(target);
      } else if (this.assignable) {
        this._target.set(context, lhs, (target || "") + value);
      } else {
        throw new Error("Unable to append a value!");
      }
      return this.findNext(context);
    }
  };
  var PickCommand = class _PickCommand extends Command {
    static keyword = "pick";
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
        parser.raiseExpected("of", "from");
      }
      return parser.requireElement("expression");
    }
    static parse(parser) {
      if (!parser.matchToken("pick")) return;
      parser.matchToken("the");
      if (parser.matchToken("first")) {
        var follows = parser.pushFollows("of", "from");
        try {
          var count = parser.requireElement("expression");
        } finally {
          parser.popFollows(follows);
        }
        var root = _PickCommand.parseSource(parser);
        return new _PickCommand("first", root, null, null, null, count);
      }
      if (parser.matchToken("last")) {
        var follows = parser.pushFollows("of", "from");
        try {
          var count = parser.requireElement("expression");
        } finally {
          parser.popFollows(follows);
        }
        var root = _PickCommand.parseSource(parser);
        return new _PickCommand("last", root, null, null, null, count);
      }
      if (parser.matchToken("random")) {
        var count = null;
        if (parser.currentToken().type === "NUMBER") {
          var follows = parser.pushFollows("of", "from");
          try {
            count = parser.requireElement("expression");
          } finally {
            parser.popFollows(follows);
          }
        }
        var root = _PickCommand.parseSource(parser);
        return new _PickCommand("random", root, null, null, null, count);
      }
      if (parser.matchToken("item") || parser.matchToken("items") || parser.matchToken("character") || parser.matchToken("characters")) {
        var follows = parser.pushFollows("of", "from");
        try {
          var range = _PickCommand.parsePickRange(parser);
        } finally {
          parser.popFollows(follows);
        }
        var root = _PickCommand.parseSource(parser);
        return new _PickCommand("range", root, range, null, null);
      }
      if (parser.matchToken("match")) {
        parser.matchToken("of");
        var follows = parser.pushFollows("of", "from");
        try {
          var re = parser.parseElement("expression");
          var flags = "";
          if (parser.matchOpToken("|")) {
            flags = parser.requireTokenType("IDENTIFIER").value;
          }
        } finally {
          parser.popFollows(follows);
        }
        var root = _PickCommand.parseSource(parser);
        return new _PickCommand("match", root, null, re, flags);
      }
      if (parser.matchToken("matches")) {
        parser.matchToken("of");
        var follows = parser.pushFollows("of", "from");
        try {
          var re = parser.parseElement("expression");
          var flags = "gu";
          if (parser.matchOpToken("|")) {
            flags = "g" + parser.requireTokenType("IDENTIFIER").value.replace("g", "");
          }
        } finally {
          parser.popFollows(follows);
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
        if (to == null) to = from + 1;
        ctx.result = root.slice(from, to);
      } else if (this.variant === "match") {
        ctx.result = new RegExp(re, this.flags).exec(root);
      } else {
        ctx.result = new RegExpIterable(re, this.flags, root);
      }
      return this.findNext(ctx);
    }
  };
  var FetchCommand = class _FetchCommand extends Command {
    static keyword = "fetch";
    constructor(url, argExprs, conversionType, conversion, dontThrow) {
      super();
      this.url = url;
      this.argExpressions = argExprs;
      this.args = { url, options: argExprs };
      this.conversionType = conversionType;
      this.conversion = conversion;
      this.dontThrow = dontThrow;
    }
    static parseConversionInfo(parser) {
      var type = "text";
      var conversion;
      parser.matchToken("a") || parser.matchToken("an");
      if (parser.matchToken("json") || parser.matchToken("JSON") || parser.matchToken("Object")) {
        type = "json";
      } else if (parser.matchToken("response") || parser.matchToken("Response")) {
        type = "response";
      } else if (parser.matchToken("html") || parser.matchToken("HTML")) {
        type = "html";
      } else if (parser.matchToken("text") || parser.matchToken("Text") || parser.matchToken("String")) {
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
      var dontThrow = false;
      if (parser.matchToken("do")) {
        parser.requireToken("not");
        parser.requireToken("throw");
        dontThrow = true;
      } else if (parser.currentToken().value === "don" && parser.token(1).value === "'" && parser.token(2).value === "t" && parser.token(1).start === parser.currentToken().end && parser.token(2).start === parser.token(1).end) {
        parser.consumeToken();
        parser.consumeToken();
        parser.consumeToken();
        parser.requireToken("throw");
        dontThrow = true;
      }
      var type = conversionInfo ? conversionInfo.type : "text";
      var conversion = conversionInfo ? conversionInfo.conversion : null;
      return new _FetchCommand(url, argExprs, type, conversion, dontThrow);
    }
    resolve(context, { url, options }) {
      var detail = options || {};
      detail.sender = context.me;
      detail.headers = detail.headers || {};
      var abortController = new AbortController();
      var abortListener = () => abortController.abort();
      context.me.addEventListener("fetch:abort", abortListener, { once: true });
      detail.signal = abortController.signal;
      context.meta.runtime.triggerEvent(context.me, "hyperscript:beforeFetch", detail);
      context.meta.runtime.triggerEvent(context.me, "fetch:beforeRequest", detail);
      var finished = false;
      if (detail.timeout) {
        setTimeout(() => {
          if (!finished) abortController.abort();
        }, detail.timeout);
      }
      var complete = (result) => {
        context.result = result;
        context.meta.runtime.triggerEvent(context.me, "fetch:afterRequest", { result });
        finished = true;
        return this.findNext(context);
      };
      var checkThrow = !this.dontThrow && this.conversionType !== "response";
      return fetch(url, detail).then((resp) => {
        var resultDetails = { response: resp };
        context.meta.runtime.triggerEvent(context.me, "fetch:afterResponse", resultDetails);
        resp = resultDetails.response;
        if (checkThrow) {
          var statusStr = String(resp.status);
          var patterns = config.fetchThrowsOn || [];
          for (var i = 0; i < patterns.length; i++) {
            if (patterns[i].test(statusStr)) {
              var err = new Error("fetch failed: " + resp.status + " " + resp.statusText + " (" + url + ")");
              err.response = resp;
              err.status = resp.status;
              throw err;
            }
          }
        }
        if (this.conversionType === "response") return complete(resp);
        if (this.conversionType === "json") return resp.json().then(complete);
        return resp.text().then((result) => {
          if (this.conversion) result = context.meta.runtime.convertValue(result, this.conversion);
          if (this.conversionType === "html") result = context.meta.runtime.convertValue(result, "Fragment");
          return complete(result);
        });
      }).catch((reason) => {
        context.meta.runtime.triggerEvent(context.me, "fetch:error", { reason });
        throw reason;
      }).finally(() => {
        context.me.removeEventListener("fetch:abort", abortListener);
      });
    }
  };
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
    var container;
    if (parser.matchToken("in")) {
      container = parser.requireElement("unaryExpression");
    }
    var smoothness = parser.matchAnyToken("smoothly", "instantly");
    var scrollOptions = { block: "start", inline: "nearest" };
    var blockMap = { top: "start", bottom: "end", middle: "center" };
    var inlineMap = { left: "start", center: "center", right: "end" };
    var behaviorMap = { smoothly: "smooth", instantly: "instant" };
    if (verticalPosition) scrollOptions.block = blockMap[verticalPosition.value];
    if (horizontalPosition) scrollOptions.inline = inlineMap[horizontalPosition.value];
    if (smoothness) scrollOptions.behavior = behaviorMap[smoothness.value];
    return { target, offset, plusOrMinus, scrollOptions, container };
  }
  function _parseSmoothness(parser) {
    var smoothness = parser.matchAnyToken("smoothly", "instantly");
    if (!smoothness) return void 0;
    return smoothness.value === "smoothly" ? "smooth" : "instant";
  }
  function _resolveScroll(ctx, to, offset, plusOrMinus, scrollOptions, container) {
    ctx.meta.runtime.implicitLoop(to, function(target) {
      if (target === window) target = document.body;
      if (container) {
        var ctr = container instanceof Element ? container : container;
        var top = target.offsetTop - ctr.offsetTop;
        var left = target.offsetLeft - ctr.offsetLeft;
        if (plusOrMinus) {
          var adj = plusOrMinus.value === "+" ? offset : offset * -1;
          top += adj;
        }
        ctr.scrollTo({ top, left, behavior: scrollOptions.behavior || "auto" });
        return;
      }
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
  var ScrollCommand = class _ScrollCommand extends Command {
    static keyword = "scroll";
    constructor(target, offset, plusOrMinus, scrollOptions, container, byMode) {
      super();
      this.target = target;
      this.plusOrMinus = plusOrMinus;
      this.scrollOptions = scrollOptions;
      this.byMode = byMode;
      this.args = { target, offset, container };
    }
    static parse(parser) {
      if (!parser.matchToken("scroll")) return;
      if (parser.matchToken("to")) {
        var scroll = _parseScrollModifiers(parser);
        return new _ScrollCommand(scroll.target, scroll.offset, scroll.plusOrMinus, scroll.scrollOptions, scroll.container);
      }
      var direction = parser.matchAnyToken("up", "down", "left", "right");
      var target;
      if (!direction && parser.currentToken().value !== "by") {
        target = parser.requireElement("unaryExpression");
        direction = parser.matchAnyToken("up", "down", "left", "right");
      }
      parser.requireToken("by");
      parser.pushFollow("px");
      var offset;
      try {
        offset = parser.requireElement("expression");
      } finally {
        parser.popFollow();
      }
      parser.matchToken("px");
      var behavior = _parseSmoothness(parser);
      var scrollOptions = {};
      if (behavior) scrollOptions.behavior = behavior;
      var byMode = { direction: direction ? direction.value : "down" };
      return new _ScrollCommand(target, offset, null, scrollOptions, null, byMode);
    }
    resolve(ctx, { target, offset, container }) {
      if (this.byMode) {
        var el = target || document.documentElement;
        var dir = this.byMode.direction;
        var top = 0, left = 0;
        if (dir === "up") top = -offset;
        else if (dir === "down") top = offset;
        else if (dir === "left") left = -offset;
        else if (dir === "right") left = offset;
        var opts = { top, left };
        if (this.scrollOptions.behavior) opts.behavior = this.scrollOptions.behavior;
        el.scrollBy(opts);
      } else {
        _resolveScroll(ctx, target, offset, this.plusOrMinus, this.scrollOptions, container);
      }
      return this.findNext(ctx);
    }
  };
  var GoCommand = class _GoCommand extends Command {
    static keyword = "go";
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
      return this.findNext(ctx);
    }
  };

  // src/parsetree/commands/setters.js
  var setters_exports = {};
  __export(setters_exports, {
    DecrementCommand: () => DecrementCommand,
    DefaultCommand: () => DefaultCommand,
    IncrementCommand: () => IncrementCommand,
    PutCommand: () => PutCommand,
    SetCommand: () => SetCommand,
    SwapCommand: () => SwapCommand
  });
  var SetCommand = class _SetCommand extends Command {
    static keyword = "set";
    constructor(target, valueExpr, objectLiteral = null) {
      super();
      this.target = target;
      this.objectLiteral = objectLiteral;
      if (objectLiteral) {
        this.args = { obj: objectLiteral, setTarget: target };
      } else {
        this.args = { ...target.lhs, value: valueExpr };
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
        var { value, ...lhs } = args;
        this.target.set(context, lhs, value);
      }
      return this.findNext(context);
    }
  };
  var DefaultCommand = class _DefaultCommand extends Command {
    static keyword = "default";
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
        return this.findNext(context);
      } else {
        return this.setter;
      }
    }
  };
  var IncrementCommand = class _IncrementCommand extends Command {
    static keyword = "increment";
    constructor(target, amountExpr) {
      super();
      this.target = target;
      this.amountExpr = amountExpr;
      this.args = { targetValue: target, amount: amountExpr, ...target.lhs };
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
      var { targetValue, amount, ...lhs } = args;
      targetValue = targetValue ? parseFloat(targetValue) : 0;
      amount = this.amountExpr ? parseFloat(amount) : 1;
      var newValue = targetValue + amount;
      context.result = newValue;
      this.target.set(context, lhs, newValue);
      return this.findNext(context);
    }
  };
  var DecrementCommand = class _DecrementCommand extends Command {
    static keyword = "decrement";
    constructor(target, amountExpr) {
      super();
      this.target = target;
      this.amountExpr = amountExpr;
      this.args = { targetValue: target, amount: amountExpr, ...target.lhs };
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
      var { targetValue, amount, ...lhs } = args;
      targetValue = targetValue ? parseFloat(targetValue) : 0;
      amount = this.amountExpr ? parseFloat(amount) : 1;
      var newValue = targetValue - amount;
      context.result = newValue;
      this.target.set(context, lhs, newValue);
      return this.findNext(context);
    }
  };
  var SwapCommand = class _SwapCommand extends Command {
    static keyword = "swap";
    constructor(target1, target2) {
      super();
      this.target1 = target1;
      this.target2 = target2;
      this.args = {
        value1: target1,
        value2: target2,
        root1: target1.lhs.root,
        index1: target1.lhs.index,
        root2: target2.lhs.root,
        index2: target2.lhs.index
      };
    }
    static parse(parser) {
      if (!parser.matchToken("swap")) return;
      try {
        parser.pushFollow("with");
        var target1 = parser.requireElement("assignableExpression");
      } finally {
        parser.popFollow();
      }
      while (target1.type === "parenthesized") target1 = target1.expr;
      parser.requireToken("with");
      var target2 = parser.requireElement("assignableExpression");
      while (target2.type === "parenthesized") target2 = target2.expr;
      return new _SwapCommand(target1, target2);
    }
    resolve(context, { value1, value2, root1, index1, root2, index2 }) {
      if (value1 instanceof Element && value2 instanceof Element) {
        var placeholder = document.createComment("");
        value1.replaceWith(placeholder);
        value2.replaceWith(value1);
        placeholder.replaceWith(value2);
      } else {
        this.target1.set(context, { root: root1, index: index1 }, value2);
        this.target2.set(context, { root: root2, index: index2 }, value1);
      }
      return this.findNext(context);
    }
  };
  var PutCommand = class _PutCommand extends Command {
    static keyword = "put";
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
        parser.raiseExpected("into", "before", "at start of", "at end of", "after");
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
        } else if (Array.isArray(root)) {
          if (this.operation === "start") {
            root.unshift(valueToPut);
          } else {
            root.push(valueToPut);
          }
          context.meta.runtime.notifyMutation(root);
        } else {
          var ops = {
            before: Element.prototype.before,
            after: Element.prototype.after,
            start: Element.prototype.prepend,
            end: Element.prototype.append
          };
          var op = ops[this.operation] || Element.prototype.append;
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
      return this.findNext(context);
    }
  };

  // src/parsetree/commands/events.js
  var events_exports = {};
  __export(events_exports, {
    EventName: () => EventName,
    SendCommand: () => SendCommand,
    WaitCommand: () => WaitCommand
  });
  var WaitCommand = class _WaitCommand extends Command {
    static keyword = "wait";
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
                resolve(this.findNext(context));
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
            resolve(this.findNext(context));
          }, time);
        });
      }
    }
  };
  var SendCommand = class _SendCommand extends Command {
    static keyword = ["send", "trigger"];
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
      return this.findNext(context);
    }
  };
  var EventName = class _EventName extends Expression {
    static grammarName = "eventName";
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
      return new Promise((resolve) => {
        setTimeout(() => resolve(context.meta.runtime.findNext(this)), 0);
      });
    }
  };
  var RepeatLoopCommand = class extends Command {
    constructor(config2, loop, elseBranch) {
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
      this.elseBranch = elseBranch;
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
      } else if (iteratorInfo.iterator) {
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
        iteratorInfo.didIterate = true;
        iteratorInfo.index++;
        return this.loop;
      } else {
        var didIterate = iteratorInfo.didIterate;
        context.meta.iterators[this.slot] = null;
        if (!didIterate && this.elseBranch) {
          return this.elseBranch;
        }
        return context.meta.runtime.findNext(this.parent, context);
      }
    }
  };
  var IfCommand = class _IfCommand extends Command {
    static keyword = "if";
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
        return this.findNext(context);
      }
    }
  };
  var RepeatCommand = class _RepeatCommand extends Command {
    static keyword = ["repeat", "for"];
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
      var elseBranch = null;
      if (parser.matchToken("else")) {
        elseBranch = parser.parseElement("commandList");
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
      const repeatLoopCommand = new RepeatLoopCommand(loopConfig, loop, elseBranch);
      const repeatCommand = new _RepeatCommand(expression, evt, on, slot, repeatLoopCommand);
      parser.setParent(loop, repeatLoopCommand);
      if (elseBranch) {
        parser.setParent(elseBranch, repeatCommand);
      }
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
      } else if (this.repeatLoopCommand.elseBranch) {
        iteratorInfo.iterator = [][Symbol.iterator]();
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
  var ContinueCommand = class _ContinueCommand extends Command {
    static keyword = "continue";
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
  var BreakCommand = class _BreakCommand extends Command {
    static keyword = "break";
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
  var TellCommand = class _TellCommand extends Command {
    static keyword = "tell";
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

  // src/parsetree/commands/execution.js
  var execution_exports = {};
  __export(execution_exports, {
    GetCommand: () => GetCommand,
    JsBody: () => JsBody,
    JsCommand: () => JsCommand
  });
  var JsBody = class _JsBody {
    static grammarName = "jsBody";
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
  var JsCommand = class _JsCommand extends Command {
    static keyword = "js";
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
      var args = this.inputs.map((input) => context.meta.runtime.resolveSymbol(input, context, "default"));
      var result = this.function.apply(context.meta.runtime.globalScope, args);
      if (result && typeof result.then === "function") {
        return result.then((actualResult) => {
          context.result = actualResult;
          return this.findNext(context);
        });
      } else {
        context.result = result;
        return this.findNext(context);
      }
    }
  };
  var GetCommand = class _GetCommand extends Command {
    static keyword = ["get", "call"];
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
        parser.raiseError("Must be a function invocation");
      }
      return new _GetCommand(expr);
    }
    resolve(context, { result }) {
      context.result = result;
      return this.findNext(context);
    }
  };

  // src/parsetree/commands/pseudoCommand.js
  var pseudoCommand_exports = {};
  __export(pseudoCommand_exports, {
    PseudoCommand: () => PseudoCommand
  });
  var PseudoCommand = class _PseudoCommand extends Command {
    static grammarName = "pseudoCommand";
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
        parser.raiseError("Pseudo-commands must be function calls");
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
        var methodName = this._root.root.name;
        var func = target[methodName];
        context.meta.runtime.nullCheck(func, this._root);
        if (func.hyperfunc) {
          argVals.push(context);
        }
        context.result = func.apply(target, argVals);
        context.meta.runtime.maybeNotify(target, methodName);
      } else {
        context.result = result;
      }
      return this.findNext(context);
    }
  };

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
    MorphCommand: () => MorphCommand,
    OpenCommand: () => OpenCommand,
    RemoveCommand: () => RemoveCommand,
    ResetCommand: () => ResetCommand,
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
        parser.raiseError("Unknown show/hide strategy : " + name);
      }
      return value;
    }
  };
  var AddCommand = class _AddCommand extends Command {
    static keyword = "add";
    constructor(variant, classRefs, attributeRef, cssDeclaration, toExpr, when, valueExpr) {
      super();
      this.variant = variant;
      this.classRefs = classRefs;
      this.attributeRef = attributeRef;
      this.cssDeclaration = cssDeclaration;
      this.to = toExpr;
      this.toExpr = toExpr;
      this.when = when;
      this.valueExpr = valueExpr;
      if (variant === "class") {
        this.args = { to: toExpr, classRefs };
      } else if (variant === "attribute") {
        this.args = { to: toExpr };
      } else if (variant === "collection") {
        this.args = { to: toExpr, value: valueExpr };
      } else {
        this.args = { to: toExpr, css: cssDeclaration };
      }
    }
    static parse(parser) {
      if (!parser.matchToken("add")) return;
      var classRef = parser.parseElement("classRef");
      var attributeRef = null;
      var cssDeclaration = null;
      var valueExpr = null;
      if (classRef == null) {
        attributeRef = parser.parseElement("attributeRef");
        if (attributeRef == null) {
          cssDeclaration = parser.parseElement("styleLiteral");
          if (cssDeclaration == null) {
            parser.pushFollow("to");
            try {
              valueExpr = parser.parseElement("expression");
            } finally {
              parser.popFollow();
            }
            if (valueExpr == null || !parser.currentToken() || parser.currentToken().value !== "to") {
              parser.raiseError("Expected either a class reference or attribute expression");
            }
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
      } else if (cssDeclaration) {
        return new _AddCommand("css", null, null, cssDeclaration, toExpr, null);
      } else {
        return new _AddCommand("collection", null, null, null, toExpr, null, valueExpr);
      }
    }
    resolve(context, { to, classRefs, css, value }) {
      var runtime2 = context.meta.runtime;
      var cmd = this;
      runtime2.nullCheck(to, this.toExpr);
      var result;
      if (this.variant === "collection") {
        if (Array.isArray(to)) {
          to.push(value);
        } else if (to instanceof Set) {
          to.add(value);
        } else if (to instanceof Map) {
          throw new Error("Use 'set myMap[key] to value' for Maps");
        } else {
          throw new Error("Cannot add to " + typeof to);
        }
        runtime2.notifyMutation(to);
        return runtime2.findNext(this, context);
      } else if (this.variant === "class") {
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
  var RemoveCommand = class _RemoveCommand extends Command {
    static keyword = "remove";
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
              parser.raiseError(
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
          parser.raiseError("'when' clause is not supported when removing elements");
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
        if (from != null && Array.isArray(from)) {
          var idx = from.indexOf(element);
          if (idx > -1) from.splice(idx, 1);
          runtime2.notifyMutation(from);
        } else if (from instanceof Set) {
          from.delete(element);
          runtime2.notifyMutation(from);
        } else if (from instanceof Map) {
          from.delete(element);
          runtime2.notifyMutation(from);
        } else {
          runtime2.implicitLoop(element, function(target) {
            if (target.parentElement && (from == null || from.contains(target))) {
              target.parentElement.removeChild(target);
            }
          });
        }
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
  var ToggleCommand = class _ToggleCommand extends VisibilityCommand {
    static keyword = "toggle";
    constructor(classRef, classRef2, classRefs, attributeRef, attributeRef2, onExpr, time, evt, from, visibility, betweenClass, betweenAttr, hideShowStrategy, betweenValues, toggleExpr, styleProp) {
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
      this.betweenValues = betweenValues;
      this.toggleExpr = toggleExpr;
      this.styleProp = styleProp;
      this.onExpr = onExpr;
      this.args = { on: onExpr, time, evt, from, classRef, classRef2, classRefs, betweenValues };
    }
    static parse(parser) {
      if (!parser.matchToken("toggle")) return;
      parser.matchAnyToken("the", "my");
      var visibility = false;
      var hideShowStrategy = null;
      var onExpr = null;
      var classRef = null;
      var classRef2 = null;
      var classRefs = null;
      var attributeRef = null;
      var attributeRef2 = null;
      var betweenClass = false;
      var betweenAttr = false;
      var toggleExpr = null;
      var styleProp = null;
      if (parser.currentToken().type === "STYLE_REF") {
        let styleRef = parser.consumeToken();
        styleProp = styleRef.value.slice(1);
        visibility = true;
        hideShowStrategy = VisibilityCommand.resolveHideShowStrategy(parser, styleProp);
        if (parser.matchToken("of")) {
          var follows = parser.pushFollows("with", "between");
          try {
            onExpr = parser.requireElement("expression");
          } finally {
            parser.popFollows(follows);
          }
        } else {
          onExpr = parser.requireElement("implicitMeTarget");
        }
      } else if (parser.matchToken("between")) {
        classRef = parser.parseElement("classRef");
        if (classRef != null) {
          betweenClass = true;
          parser.requireToken("and");
          classRef2 = parser.requireElement("classRef");
        } else {
          betweenAttr = true;
          attributeRef = parser.parseElement("attributeRef");
          if (attributeRef == null) {
            parser.raiseError("Expected either a class reference or attribute expression");
          }
          parser.requireToken("and");
          attributeRef2 = parser.requireElement("attributeRef");
        }
      } else if (classRef = parser.parseElement("classRef")) {
        classRefs = [classRef];
        while (classRef = parser.parseElement("classRef")) {
          classRefs.push(classRef);
        }
      } else if (attributeRef = parser.parseElement("attributeRef")) {
      } else {
        parser.pushFollow("between");
        toggleExpr = parser.parseElement("assignableExpression");
        parser.popFollow();
        if (toggleExpr == null) {
          parser.raiseError("Expected a class reference, attribute, style property, or settable expression");
        }
      }
      if (!visibility && !toggleExpr) {
        if (parser.matchToken("on")) {
          onExpr = parser.requireElement("expression");
        } else {
          onExpr = parser.requireElement("implicitMeTarget");
        }
      }
      var betweenValues = null;
      if (parser.matchToken("between")) {
        parser.pushFollow("and");
        betweenValues = [parser.requireElement("expression")];
        while (parser.matchOpToken(",")) {
          betweenValues.push(parser.requireElement("expression"));
        }
        parser.popFollow();
        parser.requireToken("and");
        betweenValues.push(parser.requireElement("expression"));
      }
      if (toggleExpr && !betweenValues) {
        parser.raiseError("toggle <expression> requires 'between' with values");
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
      return new _ToggleCommand(classRef, classRef2, classRefs, attributeRef, attributeRef2, onExpr, time, evt, from, visibility, betweenClass, betweenAttr, hideShowStrategy, betweenValues, toggleExpr, styleProp);
    }
    toggle(context, on, classRef, classRef2, classRefs, betweenValues) {
      if (this.betweenValues) {
        if (this.visibility) {
          context.meta.runtime.implicitLoop(on, (target) => {
            var current2 = target.style[this.styleProp] || getComputedStyle(target)[this.styleProp];
            var idx2 = betweenValues.findIndex((v) => v == current2);
            target.style[this.styleProp] = betweenValues[(idx2 + 1) % betweenValues.length];
          });
        } else {
          var current = this.toggleExpr.evaluate(context);
          var idx = betweenValues.findIndex((v) => v == current);
          var next = betweenValues[(idx + 1) % betweenValues.length];
          var lhsValues = {};
          for (var key in this.toggleExpr.lhs) {
            var val = this.toggleExpr.lhs[key];
            lhsValues[key] = val && val.evaluate ? val.evaluate(context) : val;
          }
          this.toggleExpr.set(context, lhsValues, next);
        }
        return;
      }
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
    resolve(context, { on, time, evt, from, classRef, classRef2, classRefs, betweenValues }) {
      if (time) {
        return new Promise((resolve) => {
          this.toggle(context, on, classRef, classRef2, classRefs, betweenValues);
          setTimeout(() => {
            this.toggle(context, on, classRef, classRef2, classRefs, betweenValues);
            resolve(this.findNext(context));
          }, time);
        });
      } else if (evt) {
        return new Promise((resolve) => {
          var target = from || context.me;
          target.addEventListener(
            evt,
            () => {
              this.toggle(context, on, classRef, classRef2, classRefs, betweenValues);
              resolve(this.findNext(context));
            },
            { once: true }
          );
          this.toggle(context, on, classRef, classRef2, classRefs, betweenValues);
        });
      } else {
        this.toggle(context, on, classRef, classRef2, classRefs, betweenValues);
        return this.findNext(context);
      }
    }
  };
  var HideCommand = class _HideCommand extends VisibilityCommand {
    static keyword = "hide";
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
  var ShowCommand = class _ShowCommand extends VisibilityCommand {
    static keyword = "show";
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
  var TakeCommand = class _TakeCommand extends Command {
    static keyword = "take";
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
            parser.raiseError("Expected either a class reference or attribute expression");
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
      return this.findNext(context);
    }
  };
  var MeasureCommand = class _MeasureCommand extends Command {
    static keyword = "measure";
    constructor(targetExpr, propsToMeasure) {
      super();
      this.properties = propsToMeasure;
      this.targetExpr = targetExpr;
      this.args = { target: targetExpr };
    }
    static parse(parser) {
      if (!parser.matchToken("measure")) return;
      var targetExpr;
      var propsToMeasure = [];
      var MEASURE_PROPS = [
        "x",
        "y",
        "left",
        "top",
        "right",
        "bottom",
        "width",
        "height",
        "bounds",
        "scrollLeft",
        "scrollTop",
        "scrollLeftMax",
        "scrollTopMax",
        "scrollWidth",
        "scrollHeight",
        "scroll"
      ];
      if (parser.commandBoundary(parser.currentToken())) {
        targetExpr = parser.parseElement("implicitMeTarget");
      } else {
        var expr = parser.requireElement("expression");
        if (expr.type === "symbol" && MEASURE_PROPS.includes(expr.name)) {
          targetExpr = parser.parseElement("implicitMeTarget");
          propsToMeasure.push(expr.name);
        } else if (expr.type === "possessive" && expr.prop) {
          targetExpr = expr.root;
          propsToMeasure.push(expr.prop.value);
        } else if (expr.type === "ofExpression" && expr.prop) {
          targetExpr = expr.root;
          propsToMeasure.push(expr.prop.value);
        } else {
          targetExpr = expr;
        }
      }
      while (parser.matchOpToken(",")) {
        propsToMeasure.push(parser.requireTokenType("IDENTIFIER").value);
      }
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
      return this.findNext(ctx);
    }
  };
  var FocusCommand = class _FocusCommand extends Command {
    static keyword = "focus";
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
      return this.findNext(ctx);
    }
  };
  var BlurCommand = class _BlurCommand extends Command {
    static keyword = "blur";
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
      return this.findNext(ctx);
    }
  };
  var EmptyCommand = class _EmptyCommand extends Command {
    static keyword = ["empty", "clear"];
    constructor(target) {
      super();
      this.args = { target };
    }
    static parse(parser) {
      if (!parser.matchToken("empty") && !parser.matchToken("clear")) return;
      var target = null;
      if (!parser.commandBoundary(parser.currentToken())) {
        target = parser.requireElement("expression");
      }
      return new _EmptyCommand(target);
    }
    resolve(ctx, { target }) {
      var elt = target || ctx.me;
      if (Array.isArray(elt)) {
        elt.splice(0);
        ctx.meta.runtime.notifyMutation(elt);
      } else if (elt instanceof Set || elt instanceof Map) {
        elt.clear();
        ctx.meta.runtime.notifyMutation(elt);
      } else {
        ctx.meta.runtime.implicitLoop(elt, function(e) {
          var tag = e.tagName;
          if (tag === "INPUT") {
            if (e.type === "checkbox" || e.type === "radio") e.checked = false;
            else e.value = "";
          } else if (tag === "TEXTAREA") {
            e.value = "";
          } else if (tag === "SELECT") {
            e.selectedIndex = -1;
          } else if (tag === "FORM") {
            e.querySelectorAll("input, textarea, select").forEach(function(inp) {
              if (inp.tagName === "INPUT") {
                if (inp.type === "checkbox" || inp.type === "radio") inp.checked = false;
                else inp.value = "";
              } else if (inp.tagName === "TEXTAREA") {
                inp.value = "";
              } else if (inp.tagName === "SELECT") {
                inp.selectedIndex = -1;
              }
            });
          } else {
            e.replaceChildren();
          }
        });
      }
      return this.findNext(ctx);
    }
  };
  var ResetCommand = class _ResetCommand extends Command {
    static keyword = "reset";
    constructor(target) {
      super();
      this.args = { target };
    }
    static parse(parser) {
      if (!parser.matchToken("reset")) return;
      var target = null;
      if (!parser.commandBoundary(parser.currentToken())) {
        target = parser.requireElement("expression");
      }
      return new _ResetCommand(target);
    }
    resolve(ctx, { target }) {
      var elt = target || ctx.me;
      ctx.meta.runtime.implicitLoop(elt, function(e) {
        var tag = e.tagName;
        if (tag === "FORM") {
          e.reset();
        } else if (tag === "INPUT") {
          if (e.type === "checkbox" || e.type === "radio") e.checked = e.defaultChecked;
          else e.value = e.defaultValue;
        } else if (tag === "TEXTAREA") {
          e.value = e.defaultValue;
        } else if (tag === "SELECT") {
          for (var i = 0; i < e.options.length; i++) e.options[i].selected = e.options[i].defaultSelected;
        }
      });
      return this.findNext(ctx);
    }
  };
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
  var OpenCommand = class _OpenCommand extends Command {
    static keyword = "open";
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
        return (target || document.documentElement).requestFullscreen().then(() => {
          return this.findNext(ctx);
        });
      }
      ctx.meta.runtime.implicitLoop(elt, _openElement);
      return this.findNext(ctx);
    }
  };
  var CloseCommand = class _CloseCommand extends Command {
    static keyword = "close";
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
          return this.findNext(ctx);
        });
      }
      var elt = target || ctx.me;
      ctx.meta.runtime.implicitLoop(elt, _closeElement);
      return this.findNext(ctx);
    }
  };
  var SpeakCommand = class _SpeakCommand extends Command {
    static keyword = "speak";
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
          parser.raiseExpected("voice", "rate", "pitch", "volume");
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
  var SelectCommand = class _SelectCommand extends Command {
    static keyword = "select";
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
      return this.findNext(ctx);
    }
  };
  var AskCommand = class _AskCommand extends Command {
    static keyword = "ask";
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
      return this.findNext(ctx);
    }
  };
  var AnswerCommand = class _AnswerCommand extends Command {
    static keyword = "answer";
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
      return this.findNext(ctx);
    }
  };
  var MorphCommand = class _MorphCommand extends Command {
    static keyword = "morph";
    constructor(target, content) {
      super();
      this.args = { target, content };
    }
    static parse(parser) {
      if (!parser.matchToken("morph")) return;
      var target = parser.requireElement("expression");
      parser.requireToken("to");
      var content = parser.requireElement("expression");
      return new _MorphCommand(target, content);
    }
    resolve(ctx, { target, content }) {
      ctx.meta.runtime.implicitLoop(target, function(elt) {
        ctx.meta.runtime.morph(elt, content);
      });
      return this.findNext(ctx);
    }
  };

  // src/parsetree/commands/animations.js
  var animations_exports = {};
  __export(animations_exports, {
    SettleCommand: () => SettleCommand,
    TransitionCommand: () => TransitionCommand,
    ViewTransitionCommand: () => ViewTransitionCommand
  });
  var SettleCommand = class _SettleCommand extends Command {
    static keyword = "settle";
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
  var TransitionCommand = class _TransitionCommand extends Command {
    static keyword = "transition";
    constructor(propExprs, from, to, usingExpr, over) {
      super();
      this.propExprs = propExprs;
      this.from = from;
      this.to = to;
      this.usingExpr = usingExpr;
      this.over = over;
      this.args = { from, to, using: usingExpr, over };
    }
    static parse(parser) {
      if (!parser.matchToken("transition")) return;
      var propExprs = [];
      var from = [];
      var to = [];
      do {
        var follows = parser.pushFollows("from", "to");
        try {
          propExprs.push(parser.requireElement("expression"));
        } finally {
          parser.popFollows(follows);
        }
        from.push(parser.matchToken("from") ? parser.requireElement("expression") : null);
        parser.requireToken("to");
        to.push(parser.matchToken("initial") ? "initial" : parser.requireElement("expression"));
      } while (!parser.commandBoundary(parser.currentToken()) && parser.currentToken().value !== "over" && parser.currentToken().value !== "using");
      var over, usingExpr;
      if (parser.matchToken("over")) {
        over = parser.requireElement("expression");
      } else if (parser.matchToken("using")) {
        usingExpr = parser.requireElement("expression");
      }
      return new _TransitionCommand(propExprs, from, to, usingExpr, over);
    }
    resolve(context, { from, to, using, over }) {
      var cmd = this;
      var runtime2 = context.meta.runtime;
      var target;
      if (this.propExprs[0].root) {
        target = this.propExprs[0].root.evaluate(context);
        runtime2.nullCheck(target, this.propExprs[0].root);
      } else {
        target = context.me;
      }
      var promises = [];
      runtime2.implicitLoop(target, function(target2) {
        promises.push(new Promise(function(resolve) {
          var initialTransition = target2.style.transition;
          if (over) {
            target2.style.transition = "all " + over + "ms ease-in";
          } else if (using) {
            target2.style.transition = using;
          } else {
            target2.style.transition = config.defaultTransition;
          }
          var internalData = runtime2.getInternalData(target2);
          if (!internalData.transitionInitials) internalData.transitionInitials = {};
          var initialValues = internalData.transitionInitials;
          for (var j = 0; j < cmd.propExprs.length; j++) {
            if (!(j in initialValues)) {
              initialValues[j] = cmd.propExprs[j].evaluate(context);
            }
          }
          for (var j = 0; j < cmd.propExprs.length; j++) {
            if (from[j] != null) {
              var lhs = {};
              for (var key in cmd.propExprs[j].lhs) {
                var e = cmd.propExprs[j].lhs[key];
                lhs[key] = e && e.evaluate ? e.evaluate(context) : e;
              }
              cmd.propExprs[j].set(context, lhs, from[j]);
            }
          }
          var transitionStarted = false;
          var resolved = false;
          target2.addEventListener("transitionend", function() {
            if (!resolved) {
              target2.style.transition = initialTransition;
              resolved = true;
              resolve();
            }
          }, { once: true });
          target2.addEventListener("transitionstart", function() {
            transitionStarted = true;
          }, { once: true });
          setTimeout(function() {
            if (!resolved && !transitionStarted) {
              target2.style.transition = initialTransition;
              resolved = true;
              resolve();
            }
          }, 100);
          setTimeout(function() {
            for (var j2 = 0; j2 < cmd.propExprs.length; j2++) {
              var lhs2 = {};
              for (var key2 in cmd.propExprs[j2].lhs) {
                var e2 = cmd.propExprs[j2].lhs[key2];
                lhs2[key2] = e2 && e2.evaluate ? e2.evaluate(context) : e2;
              }
              var val = to[j2] === "initial" ? initialValues[j2] : to[j2];
              cmd.propExprs[j2].set(context, lhs2, val);
            }
          }, 0);
        }));
      });
      return Promise.all(promises).then(function() {
        return cmd.findNext(context);
      });
    }
  };
  var AbortViewTransition = class extends Command {
    constructor() {
      super();
      this.type = "abortViewTransition";
    }
    resolve(context) {
      var vt = context.meta.viewTransition;
      if (vt) {
        console.warn("hyperscript: view transition skipped due to early exit (return, halt, or break)");
        context.meta.viewTransition = null;
        vt.finished.catch(function() {
        });
        vt.transition.skipTransition();
        vt.bodyDone();
      }
      return context.meta.runtime.findNext(this);
    }
  };
  var ESCAPE_TYPES = /* @__PURE__ */ new Set(["returnCommand", "exitCommand", "haltCommand", "breakCommand", "continueCommand"]);
  var LOOP_TYPES = /* @__PURE__ */ new Set(["breakCommand", "continueCommand"]);
  function insertAborts(cmd, inLoop, visited) {
    if (!visited) visited = /* @__PURE__ */ new Set();
    if (!cmd || visited.has(cmd)) return;
    visited.add(cmd);
    var childInLoop = inLoop || cmd.loop !== void 0;
    for (var key of Object.keys(cmd)) {
      if (key === "parent") continue;
      var val = cmd[key];
      if (val instanceof ParseElement && ESCAPE_TYPES.has(val.type)) {
        if (!LOOP_TYPES.has(val.type) || !inLoop) {
          var abort = new AbortViewTransition();
          abort.next = val;
          cmd[key] = abort;
          visited.add(abort);
        }
      }
      for (var item of [val].flat()) {
        if (item instanceof ParseElement) {
          insertAborts(item, childInLoop, visited);
        }
      }
    }
  }
  var ViewTransitionTick = class extends Command {
    constructor() {
      super();
      this.type = "viewTransitionTick";
    }
    resolve(context) {
      return new Promise((resolve) => {
        setTimeout(() => resolve(context.meta.runtime.findNext(this)), 0);
      });
    }
  };
  var ViewTransitionEnd = class extends Command {
    constructor() {
      super();
      this.type = "viewTransitionEnd";
    }
    resolve(context) {
      var vt = context.meta.viewTransition;
      if (!vt) return context.meta.runtime.findNext(this.parent, context);
      vt.bodyDone();
      return vt.finished.then(() => {
        context.meta.viewTransition = null;
        return context.meta.runtime.findNext(this.parent, context);
      });
    }
  };
  var ViewTransitionCommand = class _ViewTransitionCommand extends Command {
    static keyword = "start";
    constructor(body, transitionType) {
      super();
      this.body = body;
      this.transitionType = transitionType;
      this.args = { type: transitionType };
    }
    static parse(parser) {
      if (!parser.matchToken("start")) return;
      parser.matchToken("a");
      parser.requireToken("view");
      parser.requireToken("transition");
      parser.matchToken("using");
      var typeToken = parser.matchTokenType("STRING");
      var transitionType = typeToken ? typeToken.value : null;
      var body = parser.requireElement("commandList");
      var tick = new ViewTransitionTick();
      tick.next = body;
      var endCmd = new ViewTransitionEnd();
      var last = body;
      while (last.next) last = last.next;
      last.next = endCmd;
      if (parser.hasMore()) {
        parser.requireToken("end");
      }
      insertAborts(body, false);
      var cmd = new _ViewTransitionCommand(tick, transitionType);
      parser.setParent(tick, cmd);
      parser.setParent(body, cmd);
      endCmd.parent = cmd;
      return cmd;
    }
    resolve(context, { type }) {
      if (!document.startViewTransition) {
        return this.body;
      }
      if (context.meta.viewTransition) {
        throw new Error("A view transition is already in progress");
      }
      var bodyDone;
      var bodyPromise = new Promise(function(r) {
        bodyDone = r;
      });
      var options = function() {
        return bodyPromise;
      };
      if (type) {
        options = { update: function() {
          return bodyPromise;
        }, types: [type] };
      }
      var transition = document.startViewTransition(options);
      context.meta.viewTransition = { bodyDone, finished: transition.finished, transition };
      return this.body;
    }
  };

  // src/parsetree/commands/debug.js
  var debug_exports = {};
  __export(debug_exports, {
    BreakpointCommand: () => BreakpointCommand
  });
  var BreakpointCommand = class _BreakpointCommand extends Command {
    static keyword = "breakpoint";
    static parse(parser) {
      if (!parser.matchToken("breakpoint")) return;
      return new _BreakpointCommand();
    }
    resolve(ctx) {
      debugger;
      return this.findNext(ctx);
    }
  };

  // src/parsetree/features/on.js
  var on_exports = {};
  __export(on_exports, {
    OnFeature: () => OnFeature
  });
  var OnFeature = class _OnFeature extends Feature {
    static keyword = "on";
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
                if (!value) return;
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
                parser.raiseError("Unknown intersection config specification");
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
                  parser.raiseError(
                    "Only shorthand attribute references are allowed here"
                  );
                }
              } else {
                parser.raiseError("Unknown mutation config specification");
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
              parser.raiseError('Expected either target value or "elsewhere".');
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

  // src/parsetree/features/def.js
  var def_exports = {};
  __export(def_exports, {
    DefFeature: () => DefFeature
  });
  var DefFeature = class _DefFeature extends Feature {
    static keyword = "def";
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
        var resolve, reject;
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

  // src/parsetree/features/set.js
  var set_exports = {};
  __export(set_exports, {
    SetFeature: () => SetFeature
  });
  var SetFeature = class _SetFeature extends Feature {
    static keyword = "set";
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
        if (setCmd.target.scope !== "element" && setCmd.target.scope !== "inherited") {
          parser.raiseError("variables declared at the feature level must be element or DOM scoped.");
        }
        let setFeature = new _SetFeature(setCmd);
        parser.ensureTerminated(setCmd);
        return setFeature;
      }
    }
  };

  // src/parsetree/features/init.js
  var init_exports = {};
  __export(init_exports, {
    InitFeature: () => InitFeature
  });
  var InitFeature = class _InitFeature extends Feature {
    static keyword = "init";
    constructor(start, immediately) {
      super();
      this.start = start;
      this.immediately = immediately;
    }
    install(target, source, args, runtime2) {
      var handler = () => {
        this.start?.execute(runtime2.makeContext(target, this, target, null));
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

  // src/parsetree/features/worker.js
  var worker_exports = {};
  __export(worker_exports, {
    WorkerFeature: () => WorkerFeature
  });
  var WorkerFeature = class extends Feature {
    static keyword = "worker";
    static parse(parser) {
      if (parser.matchToken("worker")) {
        parser.raiseError(
          "In order to use the 'worker' feature, include the _hyperscript worker plugin. See https://hyperscript.org/features/worker/ for more info."
        );
        return void 0;
      }
    }
  };

  // src/parsetree/features/behavior.js
  var behavior_exports = {};
  __export(behavior_exports, {
    BehaviorFeature: () => BehaviorFeature
  });
  var BehaviorFeature = class _BehaviorFeature extends Feature {
    static keyword = "behavior";
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

  // src/parsetree/features/install.js
  var install_exports = {};
  __export(install_exports, {
    InstallFeature: () => InstallFeature
  });
  var InstallFeature = class _InstallFeature extends Feature {
    static keyword = "install";
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

  // src/parsetree/features/js.js
  var js_exports = {};
  __export(js_exports, {
    JsFeature: () => JsFeature
  });
  var JsFeature = class _JsFeature extends Feature {
    static keyword = "js";
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

  // src/parsetree/features/when.js
  var when_exports = {};
  __export(when_exports, {
    WhenFeature: () => WhenFeature
  });
  var WhenFeature = class _WhenFeature extends Feature {
    static keyword = "when";
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
          parser.raiseError(
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
            runtime2.reactivity.createEffect(
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

  // src/parsetree/features/bind.js
  var bind_exports = {};
  __export(bind_exports, {
    BindFeature: () => BindFeature
  });
  var BindFeature = class _BindFeature extends Feature {
    static keyword = "bind";
    /**
     * Parse bind feature
     * @param {Parser} parser
     * @returns {BindFeature | undefined}
     */
    static parse(parser) {
      if (!parser.matchToken("bind")) return;
      var follows = parser.pushFollows("and", "with", "to");
      var left;
      try {
        left = parser.requireElement("expression");
      } finally {
        parser.popFollows(follows);
      }
      if (!parser.matchToken("and") && !parser.matchToken("with") && !parser.matchToken("to")) {
        parser.raiseExpected("and", "with", "to");
      }
      var right = parser.requireElement("expression");
      return new _BindFeature(left, right);
    }
    constructor(left, right) {
      super();
      this.left = left;
      this.right = right;
      this.displayName = "bind";
    }
    install(target, source, args, runtime2) {
      var feature = this;
      queueMicrotask(function() {
        try {
          _bind(feature.left, feature.right, target, feature, runtime2);
        } catch (e) {
          console.error(e.message || e);
        }
      });
    }
  };
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
  function _bind(left, right, target, feature, runtime2) {
    var ctx = runtime2.makeContext(target, feature, target, null);
    var leftSide = _resolveSide(left, target, feature, runtime2, ctx);
    var rightSide = _resolveSide(right, target, feature, runtime2, ctx);
    var leftWritable = leftSide.element || _isAssignable(left);
    var rightWritable = rightSide.element || _isAssignable(right);
    if (!leftWritable && !rightWritable) {
      throw new Error("bind requires at least one writable side");
    }
    if (leftWritable) {
      runtime2.reactivity.createEffect(
        function() {
          return rightSide.read();
        },
        function(newValue) {
          leftSide.write(newValue);
        },
        { element: target }
      );
    }
    if (rightWritable) {
      runtime2.reactivity.createEffect(
        function() {
          return leftSide.read();
        },
        function(newValue) {
          rightSide.write(newValue);
        },
        { element: target }
      );
    }
    _setupFormReset(leftSide, rightSide, target, runtime2);
  }
  function _resolveSide(expr, target, feature, runtime2, ctx) {
    var value = expr.evaluate(ctx);
    if (value instanceof Element) {
      return _createElementSide(value, runtime2);
    }
    return _createExpressionSide(expr, target, feature, runtime2);
  }
  var _bindProperty = {
    "INPUT:checkbox": "checked",
    "INPUT:number": "valueAsNumber",
    "INPUT:range": "valueAsNumber",
    "INPUT": "value",
    "TEXTAREA": "value",
    "SELECT": "value"
  };
  function _createElementSide(element, runtime2) {
    var tag = element.tagName;
    var type = tag === "INPUT" ? element.getAttribute("type") || "text" : null;
    if (tag === "INPUT" && type === "radio") {
      var radioValue = element.value;
      return {
        element,
        read: function() {
          var checked = runtime2.resolveProperty(element, "checked");
          return checked ? radioValue : void 0;
        },
        write: function(value) {
          element.checked = value === radioValue;
        }
      };
    }
    var prop = _bindProperty[tag + ":" + type] || _bindProperty[tag];
    if (!prop && element.hasAttribute("contenteditable") && element.getAttribute("contenteditable") !== "false") {
      prop = "textContent";
    }
    if (!prop && tag.includes("-") && "value" in element) {
      prop = "value";
    }
    if (!prop) {
      throw new Error(
        "bind cannot auto-detect a property for <" + tag.toLowerCase() + ">. Use an explicit property (e.g. 'bind $var to #el's value')."
      );
    }
    var isNumeric = prop === "valueAsNumber";
    return {
      element,
      read: function() {
        var val = runtime2.resolveProperty(element, prop);
        return isNumeric && val !== val ? null : val;
      },
      write: function(value) {
        element[prop] = value;
      }
    };
  }
  function _createExpressionSide(expr, target, feature, runtime2) {
    if (expr.type === "classRef") {
      return {
        read: function() {
          runtime2.resolveAttribute(target, "class");
          return target.classList.contains(expr.className);
        },
        write: function(value) {
          if (value) {
            target.classList.add(expr.className);
          } else {
            target.classList.remove(expr.className);
          }
        }
      };
    }
    return {
      read: function() {
        return expr.evaluate(runtime2.makeContext(target, feature, target, null));
      },
      write: function(value) {
        var ctx = runtime2.makeContext(target, feature, target, null);
        _assignTo(runtime2, expr, ctx, value);
      }
    };
  }
  function _setupFormReset(leftSide, rightSide, target, runtime2) {
    _addResetListener(leftSide, rightSide, target, runtime2);
    _addResetListener(rightSide, leftSide, target, runtime2);
  }
  function _addResetListener(source, dest, target, runtime2) {
    if (!source.element) return;
    var form = source.element.closest("form");
    if (!form) return;
    var resetHandler = () => {
      setTimeout(() => {
        if (!target.isConnected) return;
        dest.write(source.read());
      }, 0);
    };
    form.addEventListener("reset", resetHandler);
    _registerListener(runtime2, target, form, "reset", resetHandler);
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

  // src/parsetree/features/live.js
  var live_exports = {};
  __export(live_exports, {
    LiveFeature: () => LiveFeature
  });
  var LiveFeature = class _LiveFeature extends Feature {
    static keyword = "live";
    constructor(commands) {
      super();
      this.commands = commands;
      this.displayName = "live";
    }
    static parse(parser) {
      if (!parser.matchToken("live")) return;
      var start = parser.requireElement("commandList");
      var feature = new _LiveFeature(start);
      parser.ensureTerminated(start);
      parser.setParent(start, feature);
      return feature;
    }
    install(target, source, args, runtime2) {
      var feature = this;
      queueMicrotask(function() {
        runtime2.reactivity.createEffect(
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

  // src/parsetree/commands/template.js
  var template_exports = {};
  __export(template_exports, {
    EscapeExpression: () => EscapeExpression,
    RenderCommand: () => RenderCommand,
    TemplateTextCommand: () => TemplateTextCommand
  });
  function _stringifyTemplatePart(val, part) {
    if (part.type === "literal") return val;
    if (val === void 0 || val === null) return "";
    if (part.escape) return escapeHTML(String(val));
    return String(val);
  }
  function escapeHTML(html) {
    return String(html).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
  }
  var TemplateTextCommand = class _TemplateTextCommand extends Command {
    static keyword = "TEMPLATE_LINE";
    constructor(parts, errors) {
      super();
      this.parts = parts;
      this.errors = errors;
    }
    static parse(parser) {
      var tok = parser.currentToken();
      if (tok.type !== "TEMPLATE_LINE") return;
      parser.consumeToken();
      var parts = [];
      var errors = [];
      var raw = tok.content;
      var i = 0;
      while (i < raw.length) {
        var nextDollar = raw.indexOf("${", i);
        if (nextDollar === -1) {
          if (i < raw.length) parts.push({ type: "literal", value: raw.slice(i) });
          break;
        }
        if (nextDollar > i) {
          parts.push({ type: "literal", value: raw.slice(i, nextDollar) });
        }
        var depth = 1;
        var j = nextDollar + 2;
        while (j < raw.length && depth > 0) {
          if (raw[j] === "{") depth++;
          else if (raw[j] === "}") depth--;
          j++;
        }
        if (depth > 0) {
          errors.push({ line: tok.line, message: "Unterminated ${} expression", expr: raw.slice(nextDollar) });
          parts.push({ type: "literal", value: "" });
          break;
        }
        var exprStr = raw.slice(nextDollar + 2, j - 1);
        var escape = true;
        try {
          var exprTokens = new Tokenizer().tokenize(exprStr);
          var exprParser = parser.createChildParser(exprTokens);
          if (exprParser.matchToken("unescaped")) escape = false;
          var valueNode = exprParser.requireElement("expression");
          if (exprParser.matchToken("if")) {
            var conditionNode = exprParser.requireElement("expression");
            var elseNode = exprParser.matchToken("else") ? exprParser.requireElement("expression") : null;
            parts.push({ type: "conditional", valueNode, conditionNode, elseNode, escape });
          } else {
            parts.push({ type: "expr", node: valueNode, escape });
          }
        } catch (e) {
          errors.push({
            line: tok.line,
            column: tok.column + nextDollar,
            message: e.message || String(e),
            expr: exprStr
          });
          parts.push({ type: "literal", value: "" });
        }
        i = j;
      }
      return new _TemplateTextCommand(parts, errors);
    }
    resolve(ctx) {
      var parts = this.parts;
      var vals = parts.map((part) => {
        if (part.type === "literal") return part.value;
        if (part.type === "conditional") {
          var condition = part.conditionNode.evaluate(ctx);
          if (condition) {
            return part.valueNode.evaluate(ctx);
          } else if (part.elseNode) {
            return part.elseNode.evaluate(ctx);
          } else {
            return void 0;
          }
        }
        return part.node.evaluate(ctx);
      });
      if (vals.some((v) => v && v.then)) {
        return Promise.all(vals).then((resolved) => {
          ctx.meta.__ht_template_result.push(
            resolved.map((val, i) => _stringifyTemplatePart(val, parts[i])).join("")
          );
          return this.findNext(ctx);
        });
      }
      ctx.meta.__ht_template_result.push(
        vals.map((val, i) => _stringifyTemplatePart(val, parts[i])).join("")
      );
      return this.findNext(ctx);
    }
  };
  var RenderCommand = class _RenderCommand extends Command {
    static keyword = "render";
    constructor(template_, templateArgs) {
      super();
      this.template_ = template_;
      this.args = { template: template_, templateArgs };
    }
    static parse(parser) {
      if (!parser.matchToken("render")) return;
      var template_ = parser.requireElement("expression");
      var templateArgs = {};
      if (parser.matchToken("with")) {
        templateArgs = parser.parseElement("nakedNamedArgumentList");
      }
      var cmd = new _RenderCommand(template_, templateArgs);
      cmd._parser = parser;
      return cmd;
    }
    resolve(ctx, { template, templateArgs }) {
      if (!(template instanceof Element)) throw new Error(this.template_.sourceFor() + " is not an element");
      var buf = [];
      var runtime2 = ctx.meta.runtime;
      var renderCtx = runtime2.makeContext(ctx.me, null, ctx.me, null);
      renderCtx.locals = Object.assign({}, ctx.locals, templateArgs);
      renderCtx.meta.__ht_template_result = buf;
      var tokens = new Tokenizer().tokenize(template.innerHTML, "lines");
      var parser = this._parser.createChildParser(tokens);
      var commandList;
      try {
        commandList = parser.parseElement("commandList");
        parser.ensureTerminated(commandList);
      } catch (e) {
        console.error("hyperscript template parse error:", e.parseError?.message || e.message || e);
        ctx.result = "";
        return runtime2.findNext(this, ctx);
      }
      var errors = commandList.collectErrors();
      if (errors.length) {
        for (var err of errors) {
          console.error("hyperscript template error (line " + err.line + "): " + err.message + (err.expr ? " in ${" + err.expr + "}" : ""));
        }
      }
      var resolve, reject;
      var promise = new Promise(function(res, rej) {
        resolve = res;
        reject = rej;
      });
      commandList.execute(renderCtx);
      if (renderCtx.meta.returned) {
        ctx.result = buf.join("");
        return runtime2.findNext(this, ctx);
      }
      renderCtx.meta.resolve = resolve;
      renderCtx.meta.reject = reject;
      return promise.then(() => {
        ctx.result = buf.join("");
        return runtime2.findNext(this, ctx);
      });
    }
  };
  var EscapeExpression = class _EscapeExpression extends Expression {
    static grammarName = "escape";
    static expressionType = "leaf";
    constructor(arg, unescaped, escapeType) {
      super();
      this.unescaped = unescaped;
      this.escapeType = escapeType;
      this.args = { value: arg };
    }
    static parse(parser) {
      if (!parser.matchToken("escape")) return;
      var escapeType = parser.matchTokenType("IDENTIFIER").value;
      var unescaped = parser.matchToken("unescaped");
      var arg = parser.requireElement("expression");
      return new _EscapeExpression(arg, unescaped, escapeType);
    }
    resolve(ctx, { value }) {
      if (this.unescaped) return value;
      if (value === void 0) return "";
      switch (this.escapeType) {
        case "html":
          return escapeHTML(value);
        default:
          throw new Error("Unknown escape: " + this.escapeType);
      }
    }
  };

  // src/_hyperscript.js
  var globalScope = typeof self !== "undefined" ? self : typeof global !== "undefined" ? global : void 0;
  config.conversions = conversions;
  var kernel = new LanguageKernel();
  var tokenizer = new Tokenizer();
  var reactivity = new Reactivity();
  var morphEngine = new Morph();
  var runtime = new Runtime(globalScope, kernel, tokenizer, reactivity, morphEngine);
  kernel.registerModule(expressions_exports);
  kernel.registerModule(literals_exports);
  kernel.registerModule(webliterals_exports);
  kernel.registerModule(postfix_exports);
  kernel.registerModule(positional_exports);
  kernel.registerModule(existentials_exports);
  kernel.registerModule(targets_exports);
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
  kernel.registerModule(live_exports);
  kernel.registerModule(template_exports);
  var liveTemplatesProcessed = /* @__PURE__ */ new WeakSet();
  runtime.addBeforeProcessHook(function(elt) {
    if (!elt || !elt.querySelectorAll) return;
    elt.querySelectorAll("template[live]").forEach(function(tmpl) {
      if (liveTemplatesProcessed.has(tmpl)) return;
      liveTemplatesProcessed.add(tmpl);
      var source = tmpl.innerHTML;
      var script = tmpl.getAttribute("_") || tmpl.getAttribute("data-script") || "";
      tmpl.removeAttribute("_");
      tmpl.removeAttribute("data-script");
      var wrapper = document.createElement("div");
      wrapper.style.display = "contents";
      wrapper.setAttribute("data-live-template", "");
      tmpl.after(wrapper);
      if (script) {
        wrapper.setAttribute("_", script);
        runtime.processNode(wrapper);
      }
      var stamped = false;
      function stamp(html) {
        if (!stamped) {
          wrapper.innerHTML = html;
          runtime.processNode(wrapper);
          stamped = true;
        } else {
          runtime.morph(wrapper, html);
        }
      }
      function render() {
        var ctx = runtime.makeContext(wrapper, null, wrapper, null);
        var buf = [];
        ctx.meta.__ht_template_result = buf;
        var tokens = tokenizer.tokenize(source, "lines");
        var parser = new Parser(kernel, tokens);
        var cmds;
        try {
          cmds = parser.parseElement("commandList");
          parser.ensureTerminated(cmds);
        } catch (e) {
          console.error("live-template parse error:", e.message || e);
          return "";
        }
        cmds.execute(ctx);
        if (ctx.meta.returned || !ctx.meta.resolve) return buf.join("");
        var resolve;
        var promise = new Promise(function(r) {
          resolve = r;
        });
        ctx.meta.resolve = resolve;
        return promise.then(function() {
          return buf.join("");
        });
      }
      queueMicrotask(function() {
        var result = render();
        if (result && result.then) {
          result.then(function(html) {
            stamp(html);
            setupEffect();
          });
        } else {
          stamp(result);
          setupEffect();
        }
      });
      function setupEffect() {
        reactivity.createEffect(render, stamp, { element: wrapper });
      }
    });
  });
  function evaluate(src, ctx, args) {
    let body;
    if ("document" in globalScope) {
      body = globalScope.document.body;
    } else {
      body = new HyperscriptModule(args && args.module);
    }
    ctx = Object.assign(runtime.makeContext(body, null, body, null), ctx || {});
    let element = kernel.parse(tokenizer, src);
    if (element && element.errors && element.errors.length > 0) {
      throw new Error(element.errors[0].message + "\n\n" + Parser.formatErrors(element.errors));
    }
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
      addBeforeProcessHook: (fn) => runtime.addBeforeProcessHook(fn),
      addAfterProcessHook: (fn) => runtime.addAfterProcessHook(fn),
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
    (async function() {
      mergeMetaConfig();
      let scriptNodes = globalScope.document.querySelectorAll("script[type='text/hyperscript'][src]");
      const scripts = Array.from(scriptNodes);
      const scriptTexts = await Promise.all(
        scripts.map(async (script) => {
          const res = await fetch(script.src);
          return res.text();
        })
      );
      scriptTexts.forEach((sc) => _hyperscript(sc));
      ready(() => {
        _hyperscript.process(document.documentElement);
        document.dispatchEvent(new Event("hyperscript:ready"));
        new HtmxCompat(globalScope, _hyperscript).init();
      });
    })();
  }
  if (typeof self !== "undefined") {
    self._hyperscript = _hyperscript;
  }
  var hyperscript_default = _hyperscript;
})();
//# sourceMappingURL=_hyperscript.js.map
