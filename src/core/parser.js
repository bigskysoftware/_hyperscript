// Parser - AST parsing for _hyperscript
import { Tokens } from './tokens.js';
import { Runtime } from './runtime.js';

/**
 * @callback ParseRule
 * @param {Parser} parser
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

export class Parser {
    constructor() {
        this.possessivesDisabled = false

        /* ============================================================================================ */
        /* Core hyperscript Grammar Elements                                                            */
        /* ============================================================================================ */
        this.addGrammarElement("feature", function (parser, tokens) {
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

        this.addGrammarElement("command", function (parser, tokens) {
            if (tokens.matchOpToken("(")) {
                const commandElement = parser.requireElement("command", tokens);
                tokens.requireOpToken(")");
                return commandElement;
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

        this.addGrammarElement("commandList", function (parser, tokens) {
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
                op: function(context){
                    return context.meta.runtime.findNext(this, context);
                },
                execute: function (context) {
                    return context.meta.runtime.unifiedExec(this, context);
                }
            }
        });

        this.addGrammarElement("leaf", function (parser, tokens) {
            var result = parser.parseAnyOf(parser.LEAF_EXPRESSIONS, tokens);
            // symbol is last so it doesn't consume any constants
            if (result == null) {
                return parser.parseElement("symbol", tokens);
            }

            return result;
        });

        this.addGrammarElement("indirectExpression", function (parser, tokens, root) {
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

        this.addGrammarElement("indirectStatement", function (parser, tokens, root) {
            if (tokens.matchToken("unless")) {
                root.endToken = tokens.lastMatch();
                var conditional = parser.requireElement("expression", tokens);
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

        this.addGrammarElement("primaryExpression", function (parser, tokens) {
            var leaf = parser.parseElement("leaf", tokens);
            if (leaf) {
                return parser.parseElement("indirectExpression", tokens, leaf);
            }
            parser.raiseParseError(tokens, "Unexpected value: " + tokens.currentToken().value);
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
    parseElement(type, tokens, root = undefined) {
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
        if (!result) Parser.raiseParseError(tokens, message || "Expected " + type);
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
        var commandDefinitionWrapper = function (parser, tokens) {
            const commandElement = definition(parser, tokens);
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
     * @param {string} keyword
     * @param {ParseRule} definition
     */
    addFeature(keyword, definition) {
        var featureGrammarType = keyword + "Feature";

        /** @type {ParseRule} */
        var featureDefinitionWrapper = function (parser, tokens) {
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
            (message || "Unexpected Token : " + tokens.currentToken().value) + "\n\n" + Parser.createParserContext(tokens);
        var error = new Error(message);
        error["tokens"] = tokens;
        throw error;
    }

    /**
     * @param {Tokens} tokens
     * @param {string} [message]
     */
    raiseParseError(tokens, message) {
        Parser.raiseParseError(tokens, message)
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
            if (tokens.hasMore()) Parser.raiseParseError(tokens);
            this.ensureTerminated(commandList);
            return commandList;
        } else if (this.featureStart(tokens.currentToken())) {
            var hyperscript = this.requireElement("hyperscript", tokens);
            if (tokens.hasMore()) Parser.raiseParseError(tokens);
            return hyperscript;
        } else {
            var expression = this.requireElement("expression", tokens);
            if (tokens.hasMore()) Parser.raiseParseError(tokens);
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
     * @param {Tokens} tokens
     * @returns {(string | ASTNode)[]}
     */
    parseStringTemplate(tokens) {
        /** @type {(string | ASTNode)[]} */
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
