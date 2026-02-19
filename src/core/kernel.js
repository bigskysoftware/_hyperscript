// LanguageKernel - AST parsing for _hyperscript
import { Tokens, Tokenizer } from './tokenizer.js';
import { Runtime } from './runtime.js';
import { Parser } from './parser.js';

/**
 * @callback ParseRule
 * @param {LanguageKernel} parser
 * @param {Runtime} runtime
 * @param {Tokens} tokens
 * @param {*} [root]
 * @returns {ASTNode | undefined}
 *
 * @typedef {Object} ASTNode
 * @member {boolean} isFeature
 * @member {string} type
 * @member {any[]} args
 * @member {(this: ASTNode, ctx:Context, root:any, ...args:any) => any} op
 * @member {(this: ASTNode, context?:Context) => any} evaluate
 * @member {ASTNode} parent
 * @member {Set<ASTNode>} children
 * @member {ASTNode} root
 * @member {String} keyword
 * @member {Token} endToken
 * @member {ASTNode} next
 * @member {(context:Context) => ASTNode} resolveNext
 * @member {EventSource} eventSource
 * @member {(this: ASTNode) => void} install
 * @member {(this: ASTNode, context:Context) => void} execute
 * @member {(this: ASTNode, target: object, source: object, args?: Object) => void} apply
 *
 *
 */

export class LanguageKernel {
    static Tokenizer = Tokenizer;

    constructor() {
        /* ============================================================================================ */
        /* Core hyperscript Grammar Elements                                                            */
        /* ============================================================================================ */
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

        // all parse elements that are not following the correct patter, want them to all look the same
        this.addGrammarElement("command", (parser) => {
            if (parser.matchOpToken("(")) {
                const commandElement = parser.requireElement("command");
                parser.requireOpToken(")");
                return commandElement;
            }

            var commandDefinition = parser.COMMANDS[parser.currentToken().value || ""];
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
                op: function(context){
                    return context.meta.runtime.findNext(this, context);
                },
                execute: function (context) {
                    return context.meta.runtime.unifiedExec(this, context);
                }
            }
        });

        this.addGrammarElement("leaf", (parser) => {
            var result = parser.parseAnyOf(parser.LEAF_EXPRESSIONS);
            // symbol is last so it doesn't consume any constants
            if (result == null) {
                return parser.parseElement("symbol");
            }

            return result;
        });

        this.addGrammarElement("indirectExpression", (parser, root) => {
            for (var i = 0; i < this.INDIRECT_EXPRESSIONS.length; i++) {
                var indirect = this.INDIRECT_EXPRESSIONS[i];
                root.endToken = parser.lastMatch();
                var result = this.parseElement(indirect, parser, root);
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
                var result = this.parseElement(postfixType, parser, root);
                if (result) {
                    return result;
                }
            }
            return root;
        });

        this.addGrammarElement("unaryExpression", (parser) => {
            parser.matchToken("the"); // optional "the"
            return parser.parseAnyOf(this.UNARY_EXPRESSIONS);
        });

        this.addGrammarElement("expression", (parser) => {
            parser.matchToken("the"); // optional "the"
            return parser.parseAnyOf(this.TOP_EXPRESSIONS);
        });

        this.addGrammarElement("assignableExpression", (parser) => {
            parser.matchToken("the"); // optional "the"
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
                    op: function (context, conditional) {
                        if (conditional) {
                            return this.next;
                        } else {
                            return root;
                        }
                    },
                    execute: function (context) {
                        return context.meta.runtime.unifiedExec(this, context);
                    },
                };
                root.parent = unless;
                return unless;
            }
            return root;
        });

        this.addGrammarElement("primaryExpression", (parser) => {
            var leaf = parser.parseElement("leaf");
            if (leaf) {
                return this.parseElement("indirectExpression", parser, leaf);
            }
            parser.raiseParseError("Unexpected value: " + parser.currentToken().value);
        });

        this.addGrammarElement("hyperscript", (parser) => {
            var features = [];
            if (parser.hasMore()) {
                while (parser.featureStart(parser.currentToken()) || parser.currentToken().value === "(") {
                    var feature = parser.requireElement("feature");
                    features.push(feature);
                    parser.matchToken("end"); // optional end
                }
            }
            return {
                type: "hyperscript",
                features: features,
                apply: function (target, source, args, runtime) {
                    // no op
                    for (const feature of features) {
                        feature.install(target, source, args, runtime);
                    }
                },
            };
        });
    }

    use(plugin) {
        plugin(this)
        return this
    }

    /** @type {Object<string,ParseRule>} */
    GRAMMAR = {};

    /** @type {Object<string,ParseRule>} */
    COMMANDS = {};

    /** @type {Object<string,ParseRule>} */
    FEATURES = {};

    /** @type {string[]} */
    LEAF_EXPRESSIONS = [];

    /** @type {string[]} */
    INDIRECT_EXPRESSIONS = [];

    /** @type {string[]} */
    POSTFIX_EXPRESSIONS = [];

    /** @type {string[]} */
    UNARY_EXPRESSIONS = [];

    /** @type {string[]} */
    TOP_EXPRESSIONS = [];

    /** @type {string[]} */
    ASSIGNABLE_EXPRESSIONS = [];

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
     * @param {Parser} parser
     * @param {ASTNode?} root
     * @returns {ASTNode}
     */
    parseElement(type, parser, root = undefined) {
        var elementDefinition = this.GRAMMAR[type];
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

    /**
     * @param {string} type
     * @param {Parser} parser
     * @param {string} [message]
     * @param {*} [root]
     * @returns {ASTNode}
     */
    requireElement(type, parser, message, root) {
        var result = this.parseElement(type, parser, root);
        if (!result) LanguageKernel.raiseParseError(parser.tokens, message || "Expected " + type);
        return result;
    }

    /**
     * @param {string[]} types
     * @param {Parser} parser
     * @returns {ASTNode}
     */
    parseAnyOf(types, parser) {
        for (var i = 0; i < types.length; i++) {
            var type = types[i];
            var expression = this.parseElement(type, parser);
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
        var commandDefinitionWrapper = function (parser) {
            const commandElement = definition(parser);
            if (commandElement) {
                commandElement.type = commandGrammarType;
                commandElement.execute = function (context) {
                    context.meta.command = commandElement;
                    return context.meta.runtime.unifiedExec(this, context);
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

        /** @type {ParseRule} */
        var featureDefinitionWrapper = function (parser) {
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
        var offset = /** @type {number} */ (
            currentToken && currentToken.line ? currentToken.column : contextLine.length - 1);
        return contextLine + "\n" + " ".repeat(offset) + "^^\n\n";
    }

    /**
     * @param {Tokens} tokens
     * @param {string} [message]
     * @returns {never}
     */
    static raiseParseError(tokens, message) {
        message =
            (message || "Unexpected Token : " + tokens.currentToken().value) + "\n\n" + LanguageKernel.createParserContext(tokens);
        var error = new Error(message);
        error["tokens"] = tokens;
        throw error;
    }

    /**
     * @param {Tokens} tokens
     * @param {string} [message]
     */
    raiseParseError(tokens, message) {
        LanguageKernel.raiseParseError(tokens, message)
    }

    /**
     * @param {Tokens} tokens
     * @returns {ASTNode}
     */
    parseHyperScript(tokens) {
        var parser = new Parser(this, tokens);
        var result = this.parseElement("hyperscript", parser);
        if (tokens.hasMore()) this.raiseParseError(tokens);
        if (result) return result;
    }

    /**
     * @param {Tokenizer} tokenizer
     * @param {string} src
     * @returns {ASTNode}
     */
    parse(tokenizer, src) {
        var tokens = tokenizer.tokenize(src);
        var parser = new Parser(this, tokens);
        if (this.commandStart(tokens.currentToken())) {
            var commandList = this.requireElement("commandList", parser);
            if (tokens.hasMore()) LanguageKernel.raiseParseError(tokens);
            this.ensureTerminated(commandList);
            return commandList;
        } else if (this.featureStart(tokens.currentToken())) {
            var hyperscript = this.requireElement("hyperscript", parser);
            if (tokens.hasMore()) LanguageKernel.raiseParseError(tokens);
            return hyperscript;
        } else {
            var expression = this.requireElement("expression", parser);
            if (tokens.hasMore()) LanguageKernel.raiseParseError(tokens);
            return expression;
        }
    }

    /**
     * @param {ASTNode | undefined} elt
     * @param {ASTNode} parent
     */
    setParent(elt, parent) {
        if (typeof elt === 'object') {
            elt.parent = parent;
            if (typeof parent === 'object') {
                parent.children = (parent.children || new Set());
                parent.children.add(elt)
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
        if (
            token.value == "end" ||
            token.value == "then" ||
            token.value == "else" ||
            token.value == "otherwise" ||
            token.value == ")" ||
            this.commandStart(token) ||
            this.featureStart(token) ||
            token.type == "EOF"
        ) {
            return true;
        }
        return false;
    }

    /**
     * @param {Parser} parser
     * @returns {(string | ASTNode)[]}
     */
    parseStringTemplate(parser) {
        var tokens = parser.tokens;
        /** @type {(string | ASTNode)[]} */
        var returnArr = [""];
        do {
            returnArr.push(tokens.lastWhitespace());
            if (tokens.currentToken().value === "$") {
                tokens.consumeToken();
                var startingBrace = tokens.matchOpToken("{");
                returnArr.push(this.requireElement("expression", parser));
                if (startingBrace) {
                    tokens.requireOpToken("}");
                }
                returnArr.push("");
            } else if (tokens.currentToken().value === "\\") {
                tokens.consumeToken(); // skip next
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
            op: function (context) {
                context.meta.returned = true;
                if (context.meta.resolve) {
                    context.meta.resolve();
                }
                return Runtime.HALT;
            },
            execute: function (ctx) {
                // do nothing
            },
        };

        var end = commandList;
        while (end.next) {
            end = end.next;
        }
        end.next = implicitReturn;
    }
}
