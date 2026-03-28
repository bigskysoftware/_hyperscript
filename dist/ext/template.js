(() => {
  var __defProp = Object.defineProperty;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

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

  // src/ext/template.js
  function compileTemplate(template) {
    return template.replace(/(?:^|\n)([^@]*)@?/gm, function(match, p1) {
      var templateStr = (" " + p1).replace(/([^\\])\$\{/g, "$1$${escape html ").substring(1);
      return "\ncall meta.__ht_template_result.push(`" + templateStr + "`)\n";
    });
  }
  function renderTemplate(template, ctx) {
    var buf = [];
    const renderCtx = Object.assign({}, ctx);
    renderCtx.meta = Object.assign({ __ht_template_result: buf }, ctx.meta);
    self._hyperscript.evaluate(template, renderCtx);
    return buf.join("");
  }
  function escapeHTML(html) {
    return String(html).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\x22/g, "&quot;").replace(/\x27/g, "&#039;");
  }
  var _RenderCommand = class _RenderCommand extends Command {
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
      return new _RenderCommand(template_, templateArgs);
    }
    resolve(ctx, { template, templateArgs }) {
      if (!(template instanceof Element)) throw new Error(this.template_.sourceFor() + " is not an element");
      const renderCtx = Object.assign({}, ctx);
      renderCtx.locals = Object.assign({}, ctx.locals, templateArgs);
      ctx.result = renderTemplate(compileTemplate(template.innerHTML), renderCtx);
      return ctx.meta.runtime.findNext(this, ctx);
    }
  };
  __publicField(_RenderCommand, "keyword", "render");
  var RenderCommand = _RenderCommand;
  var _EscapeExpression = class _EscapeExpression extends Expression {
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
  __publicField(_EscapeExpression, "grammarName", "escape");
  __publicField(_EscapeExpression, "expressionType", "leaf");
  var EscapeExpression = _EscapeExpression;
  function templatePlugin(_hyperscript) {
    _hyperscript.addCommand(RenderCommand.keyword, RenderCommand.parse.bind(RenderCommand));
    _hyperscript.addLeafExpression(EscapeExpression.grammarName, EscapeExpression.parse.bind(EscapeExpression));
  }
  if (typeof self !== "undefined" && self._hyperscript) {
    self._hyperscript.use(templatePlugin);
  }
})();
//# sourceMappingURL=template.js.map
