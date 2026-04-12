// LanguageKernel - AST parsing for _hyperscript
import { Parser } from './parser.js';
import { EmptyCommandListCommand, UnlessStatementModifier, HyperscriptProgram, FailedFeature, FailedCommand } from '../parsetree/internals.js';
import { Command, Feature } from '../parsetree/base.js';
import { ParseRecoverySentinel } from './parser.js';

export class LanguageKernel {

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
        // Top-level program structure
        this.addGrammarElement("hyperscript", this.parseHyperscriptProgram.bind(this));
        this.addGrammarElement("feature", this.parseFeature.bind(this));

        // Command structure
        this.addGrammarElement("commandList", this.parseCommandList.bind(this));
        this.addGrammarElement("command", this.parseCommand.bind(this));
        this.addGrammarElement("indirectStatement", this.parseIndirectStatement.bind(this));

        // Expression precedence chain (top to bottom)
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
            const commandElement = parser.requireElement("command");
            parser.requireOpToken(")");
            return commandElement;
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
        // symbol is last so it doesn't consume any constants
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
        parser.matchToken("the"); // optional "the"
        var result = parser.parseAnyOf(this.#unaryExpressions);
        if (result) return this.parseElement("indirectExpression", parser, result);
        return parser.parseElement("postfixExpression");
    }

    parseExpression(parser) {
        parser.matchToken("the"); // optional "the"
        return parser.parseAnyOf(this.#topExpressions);
    }

    parseAssignableExpression(parser) {
        parser.matchToken("the"); // optional "the"
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
                        parser.matchToken("end"); // optional end
                    } catch (e) {
                        if (e instanceof ParseRecoverySentinel) {
                            features.push(new FailedFeature(e.parseError, keyword));
                            this.#syncToFeature(parser);
                        } else {
                            throw e;
                        }
                    }
                } else if (parser.currentToken().value === "end") {
                    break; // scope terminator (e.g. behavior body) - leave for outer parser
                } else {
                    // Unconsumed token between features - report and sync
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
        plugin(this)
        return this
    }

    initElt(parseElement, start, tokens) {
        parseElement.startToken = start;
        parseElement.programSource = tokens.source;
    }

    parseElement(type, parser, root = undefined) {
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

        // Commands with keyword (supports string or array of strings)
        if (ElementClass.keyword && ElementClass.prototype instanceof Command) {
            var keywords = Array.isArray(ElementClass.keyword) ? ElementClass.keyword : [ElementClass.keyword];
            for (var kw of keywords) this.addCommand(kw, parse);
            return;
        }

        // Features with keyword (supports string or array of strings)
        if (ElementClass.keyword && ElementClass.prototype instanceof Feature) {
            var keywords = Array.isArray(ElementClass.keyword) ? ElementClass.keyword : [ElementClass.keyword];
            for (var kw of keywords) this.addFeature(kw, parse);
            return;
        }

        // Grammar elements with grammarName
        const name = ElementClass.grammarName;
        if (!name) return;

        switch (ElementClass.expressionType) {
            case 'leaf':     this.addLeafExpression(name, parse); break;
            case 'indirect': this.addIndirectExpression(name, parse); break;
            case 'unary':    this.addUnaryExpression(name, parse); break;
            case 'top':      this.addTopExpression(name, parse); break;
            case 'postfix':  this.addPostfixExpression(name, parse); break;
            default:         this.addGrammarElement(name, parse); break;
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
            if (typeof exported === 'function' && exported.parse) {
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
        while (parser.hasMore() &&
               !parser.featureStart(parser.currentToken()) &&
               parser.currentToken().value !== "end" &&
               parser.currentToken().type !== "EOF") {
            parser.tokens.consumeToken();
        }
    }

    #syncToCommand(parser) {
        parser.tokens.clearFollows();
        while (parser.hasMore() &&
               !parser.commandBoundary(parser.currentToken())) {
            parser.tokens.consumeToken();
        }
        // consume 'then' if that's what we landed on
        if (parser.hasMore() && parser.currentToken().value === "then") {
            parser.tokens.consumeToken();
        }
    }

    parse(tokenizer, src) {
        var tokens = tokenizer.tokenize(src);
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

}
