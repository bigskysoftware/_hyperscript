declare var hyperscript_default: typeof run & {
    config: {
        attributes: string;
        defaultTransition: string;
        disableSelector: string;
        hideShowStrategies: {};
        conversions: {
            dynamicResolvers: ((str: any, value: any) => string)[];
            String: (val: any) => any;
            Int: (val: any) => number;
            Float: (val: any) => number;
            Number: (val: any) => number;
            Date: (val: any) => Date;
            Array: (val: any) => any[];
            JSON: (val: any) => string;
            Object: (val: any) => any;
        };
    };
    use(plugin: any): void;
    internals: {
        lexer: {
            /**
             * @param {string} string
             * @param {boolean} [template]
             * @returns {Tokens}
             */
            tokenize(string: string, template?: boolean): Tokens;
        };
        parser: {
            possessivesDisabled: boolean;
            use(plugin: any): /*elided*/ any;
            /**
             * @param {*} parseElement
             * @param {*} start
             * @param {Tokens} tokens
             */
            initElt(parseElement: any, start: any, tokens: Tokens): void;
            /**
             * @param {string} type
             * @param {Tokens} tokens
             * @param {ASTNode?} root
             * @returns {ASTNode}
             */
            parseElement(type: string, tokens: Tokens, root?: ASTNode | null): ASTNode;
            /**
             * @param {string} type
             * @param {Tokens} tokens
             * @param {string} [message]
             * @param {*} [root]
             * @returns {ASTNode}
             */
            requireElement(type: string, tokens: Tokens, message?: string, root?: any): ASTNode;
            /**
             * @param {string[]} types
             * @param {Tokens} tokens
             * @param {Runtime} [runtime]
             * @returns {ASTNode}
             */
            parseAnyOf(types: string[], tokens: Tokens): ASTNode;
            /**
             * @param {string} name
             * @param {ParseRule} definition
             */
            addGrammarElement(name: string, definition: ParseRule): void;
            /**
             * @param {string} keyword
             * @param {ParseRule} definition
             */
            addCommand(keyword: string, definition: ParseRule): void;
            /**
             * @param {string} keyword
             * @param {ParseRule} definition
             */
            addFeature(keyword: string, definition: ParseRule): void;
            /**
             * @param {string} name
             * @param {ParseRule} definition
             */
            addLeafExpression(name: string, definition: ParseRule): void;
            /**
             * @param {string} name
             * @param {ParseRule} definition
             */
            addIndirectExpression(name: string, definition: ParseRule): void;
            /**
             * @param {Tokens} tokens
             * @param {string} [message]
             */
            raiseParseError(tokens: Tokens, message?: string): void;
            /**
             * @param {Tokens} tokens
             * @returns {ASTNode}
             */
            parseHyperScript(tokens: Tokens): ASTNode;
            /**
             * @param {Lexer} lexer
             * @param {string} src
             * @returns {ASTNode}
             */
            parse(lexer: {
                new (): {
                    /**
                     * @param {string} string
                     * @param {boolean} [template]
                     * @returns {Tokens}
                     */
                    tokenize(string: string, template?: boolean): Tokens;
                };
                /**
                 * isValidCSSClassChar returns `true` if the provided character is valid in a CSS class.
                 * @param {string} c
                 * @returns boolean
                 */
                isValidCSSClassChar(c: string): boolean;
                /**
                 * isValidCSSIDChar returns `true` if the provided character is valid in a CSS ID
                 * @param {string} c
                 * @returns boolean
                 */
                isValidCSSIDChar(c: string): boolean;
                /**
                 * isWhitespace returns `true` if the provided character is whitespace.
                 * @param {string} c
                 * @returns boolean
                 */
                isWhitespace(c: string): c is "\n" | " " | "\t" | "\r";
                /**
                 * positionString returns a string representation of a Token's line and column details.
                 * @param {Token} token
                 * @returns string
                 */
                positionString(token: Token): string;
                /**
                 * isNewline returns `true` if the provided character is a carriage return or newline
                 * @param {string} c
                 * @returns boolean
                 */
                isNewline(c: string): c is "\n" | "\r";
                /**
                 * isNumeric returns `true` if the provided character is a number (0-9)
                 * @param {string} c
                 * @returns boolean
                 */
                isNumeric(c: string): boolean;
                /**
                 * isAlpha returns `true` if the provided character is a letter in the alphabet
                 * @param {string} c
                 * @returns boolean
                 */
                isAlpha(c: string): boolean;
                /**
                 * @param {string} c
                 * @param {boolean} [dollarIsOp]
                 * @returns boolean
                 */
                isIdentifierChar(c: string, dollarIsOp?: boolean): c is "_" | "$";
                /**
                 * @param {string} c
                 * @returns boolean
                 */
                isReservedChar(c: string): c is "`" | "^";
                /**
                 * @param {Token[]} tokens
                 * @returns {boolean}
                 */
                isValidSingleQuoteStringStart(tokens: Token[]): boolean;
                /**
                 * @param {string} string
                 * @param {boolean} [template]
                 * @returns {Tokens}
                 */
                tokenize(string: string, template?: boolean): Tokens;
            }, src: string): ASTNode;
            /**
             * @param {ASTNode | undefined} elt
             * @param {ASTNode} parent
             */
            setParent(elt: ASTNode | undefined, parent: ASTNode): void;
            /**
             * @param {Token} token
             * @returns {ParseRule}
             */
            commandStart(token: Token): ParseRule;
            /**
             * @param {Token} token
             * @returns {ParseRule}
             */
            featureStart(token: Token): ParseRule;
            /**
             * @param {Token} token
             * @returns {boolean}
             */
            commandBoundary(token: Token): boolean;
            /**
             * @param {Tokens} tokens
             * @returns {(string | ASTNode)[]}
             */
            parseStringTemplate(tokens: Tokens): (string | ASTNode)[];
            /**
             * @param {ASTNode} commandList
             */
            ensureTerminated(commandList: ASTNode): void;
        };
        runtime: {
            globalScope: any;
            /**
             * @param {HTMLElement} elt
             * @param {string} selector
             * @returns boolean
             */
            matchesSelector(elt: HTMLElement, selector: string): any;
            /**
             * @param {string} eventName
             * @param {Object} [detail]
             * @returns {Event}
             */
            makeEvent(eventName: string, detail?: any): Event;
            /**
             * @param {Element} elt
             * @param {string} eventName
             * @param {Object} [detail]
             * @param {Element} [sender]
             * @returns {boolean}
             */
            triggerEvent(elt: Element, eventName: string, detail?: any, sender?: Element): boolean;
            /**
             * isArrayLike returns `true` if the provided value is an array or
             * something close enough to being an array for our purposes.
             *
             * @param {any} value
             * @returns {value is Array | NodeList | HTMLCollection | FileList}
             */
            isArrayLike(value: any): value is any[] | NodeList | HTMLCollection | FileList;
            /**
             * isIterable returns `true` if the provided value supports the
             * iterator protocol.
             *
             * @param {any} value
             * @returns {value is Iterable}
             */
            isIterable(value: any): value is Iterable<any>;
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
            shouldAutoIterate(value: any): value is (any[] | {
                _css: any;
                relativeToElement: any;
                escape: any;
                readonly css: any;
                readonly className: any;
                readonly id: any;
                contains(elt: any): boolean;
                readonly length: number;
                selectMatches(): NodeListOf<any>;
                [Symbol.iterator](): any;
            });
            /**
             * forEach executes the provided `func` on every item in the `value` array.
             * if `value` is a single item (and not an array) then `func` is simply called
             * once.  If `value` is null, then no further actions are taken.
             *
             * @template T
             * @param {T | Iterable<T>} value
             * @param {(item: T) => void} func
             */
            forEach<T>(value: T | Iterable<T>, func: (item: T) => void): void;
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
            implicitLoop<T>(value: {
                _css: any;
                relativeToElement: any;
                escape: any;
                readonly css: any;
                readonly className: any;
                readonly id: any;
                contains(elt: any): boolean;
                readonly length: number;
                selectMatches(): NodeListOf<any>;
                [Symbol.iterator](): any;
            } | T | T[], func: (item: T) => void): void;
            wrapArrays(args: any): any[];
            unwrapAsyncs(values: any): void;
            /**
             * @param {ASTNode} command
             * @param {Context} ctx
             */
            unifiedExec(command: ASTNode, ctx: {
                meta: {
                    runtime: any;
                    owner: any;
                    feature: any;
                    iterators: {};
                    ctx: /*elided*/ any;
                };
                locals: {
                    cookies: {};
                };
                me: any;
                event: any;
                target: any;
                detail: any;
                sender: any;
                body: HTMLElement;
            }): void;
            /**
            * @param {*} parseElement
            * @param {Context} ctx
            * @param {Boolean} [shortCircuitOnValue]
            * @returns {*}
            */
            unifiedEval(parseElement: any, ctx: {
                meta: {
                    runtime: any;
                    owner: any;
                    feature: any;
                    iterators: {};
                    ctx: /*elided*/ any;
                };
                locals: {
                    cookies: {};
                };
                me: any;
                event: any;
                target: any;
                detail: any;
                sender: any;
                body: HTMLElement;
            }, shortCircuitOnValue?: boolean): any;
            /**
            * getAttributes returns the attribute name(s) to use when
            * locating hyperscript scripts in a DOM element.  If no value
            * has been configured, it defaults to config.attributes
            * @returns string[]
            */
            getScriptAttributes(): string[];
            _scriptAttrs: string[];
            /**
            * @param {Element} elt
            * @returns {string | null}
            */
            getScript(elt: Element): string | null;
            /**
            * @param {*} elt
            * @returns {Object}
            */
            getHyperscriptFeatures(elt: any): any;
            /**
            * @param {Object} owner
            * @param {Context} ctx
            */
            addFeatures(owner: any, ctx: {
                meta: {
                    runtime: any;
                    owner: any;
                    feature: any;
                    iterators: {};
                    ctx: /*elided*/ any;
                };
                locals: {
                    cookies: {};
                };
                me: any;
                event: any;
                target: any;
                detail: any;
                sender: any;
                body: HTMLElement;
            }): void;
            /**
            * @param {*} owner
            * @param {*} feature
            * @param {*} hyperscriptTarget
            * @param {*} event
            * @returns {Context}
            */
            makeContext(owner: any, feature: any, hyperscriptTarget: any, event: any): {
                meta: {
                    runtime: any;
                    owner: any;
                    feature: any;
                    iterators: {};
                    ctx: /*elided*/ any;
                };
                locals: {
                    cookies: {};
                };
                me: any;
                event: any;
                target: any;
                detail: any;
                sender: any;
                body: HTMLElement;
            };
            /**
            * @returns string
            */
            getScriptSelector(): string;
            /**
            * @param {any} value
            * @param {string} type
            * @returns {any}
            */
            convertValue(value: any, type: string): any;
            /**
             *
             * @param {ASTNode} elt
             * @param {Context} ctx
             * @returns {any}
             */
            evaluateNoPromise(elt: ASTNode, ctx: {
                meta: {
                    runtime: any;
                    owner: any;
                    feature: any;
                    iterators: {};
                    ctx: /*elided*/ any;
                };
                locals: {
                    cookies: {};
                };
                me: any;
                event: any;
                target: any;
                detail: any;
                sender: any;
                body: HTMLElement;
            }): any;
            /**
            * @param {Element} elt
            * @returns {Object}
            */
            getInternalData(elt: Element): any;
            /**
            * @param {any} value
            * @param {string} typeString
            * @param {boolean} [nullOk]
            * @returns {boolean}
            */
            typeCheck(value: any, typeString: string, nullOk?: boolean): boolean;
            getElementScope(context2: any): any;
            /**
            * @param {string} str
            * @returns {boolean}
            */
            isReservedWord(str: string): boolean;
            /**
            * @param {any} context
            * @returns {boolean}
            */
            isHyperscriptContext(context2: any): boolean;
            /**
            * @param {string} str
            * @param {Context} context
            * @returns {any}
            */
            resolveSymbol(str: string, context2: any, type: any): any;
            setSymbol(str: any, context2: any, type: any, value: any): void;
            /**
            * @param {ASTNode} command
            * @param {Context} context
            * @returns {undefined | ASTNode}
            */
            findNext(command: ASTNode, context2: any): undefined | ASTNode;
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
            flatGet(root: {
                [x: string]: any;
            }, property: string, getter: (root: {
                [x: string]: any;
            }, property: string) => any): any;
            resolveProperty(root: any, property: any): any;
            resolveAttribute(root: any, property: any): any;
            /**
             *
             * @param {Object<string, any>} root
             * @param {string} property
             * @returns {string}
             */
            resolveStyle(root: {
                [x: string]: any;
            }, property: string): string;
            /**
             *
             * @param {Object<string, any>} root
             * @param {string} property
             * @returns {string}
             */
            resolveComputedStyle(root: {
                [x: string]: any;
            }, property: string): string;
            /**
            * @param {Element} elt
            * @param {string[]} nameSpace
            * @param {string} name
            * @param {any} value
            */
            assignToNamespace(elt: Element, nameSpace: string[], name: string, value: any): void;
            getHyperTrace(ctx: any, thrown: any): any;
            registerHyperTrace(ctx: any, thrown: any): void;
            /**
            * @param {string} str
            * @returns {string}
            */
            escapeSelector(str: string): string;
            /**
            * @param {any} value
            * @param {*} elt
            */
            nullCheck(value: any, elt: any): void;
            /**
            * @param {any} value
            * @returns {boolean}
            */
            isEmpty(value: any): boolean;
            /**
            * @param {any} value
            * @returns {boolean}
            */
            doesExist(value: any): boolean;
            /**
            * @param {Node} node
            * @returns {Document|ShadowRoot}
            */
            getRootNode(node: Node): Document | ShadowRoot;
            /**
             *
             * @param {Element} elt
             * @param {ASTNode} onFeature
             * @returns {EventQueue}
             *
             * @typedef {{queue:Array, executing:boolean}} EventQueue
             */
            getEventQueueFor(elt: Element, onFeature: ASTNode): {
                queue: any[];
                executing: boolean;
            };
            beepValueToConsole(element: any, expression: any, value: any): void;
        };
        Lexer: {
            new (): {
                /**
                 * @param {string} string
                 * @param {boolean} [template]
                 * @returns {Tokens}
                 */
                tokenize(string: string, template?: boolean): Tokens;
            };
            /**
             * isValidCSSClassChar returns `true` if the provided character is valid in a CSS class.
             * @param {string} c
             * @returns boolean
             */
            isValidCSSClassChar(c: string): boolean;
            /**
             * isValidCSSIDChar returns `true` if the provided character is valid in a CSS ID
             * @param {string} c
             * @returns boolean
             */
            isValidCSSIDChar(c: string): boolean;
            /**
             * isWhitespace returns `true` if the provided character is whitespace.
             * @param {string} c
             * @returns boolean
             */
            isWhitespace(c: string): c is "\n" | " " | "\t" | "\r";
            /**
             * positionString returns a string representation of a Token's line and column details.
             * @param {Token} token
             * @returns string
             */
            positionString(token: Token): string;
            /**
             * isNewline returns `true` if the provided character is a carriage return or newline
             * @param {string} c
             * @returns boolean
             */
            isNewline(c: string): c is "\n" | "\r";
            /**
             * isNumeric returns `true` if the provided character is a number (0-9)
             * @param {string} c
             * @returns boolean
             */
            isNumeric(c: string): boolean;
            /**
             * isAlpha returns `true` if the provided character is a letter in the alphabet
             * @param {string} c
             * @returns boolean
             */
            isAlpha(c: string): boolean;
            /**
             * @param {string} c
             * @param {boolean} [dollarIsOp]
             * @returns boolean
             */
            isIdentifierChar(c: string, dollarIsOp?: boolean): c is "_" | "$";
            /**
             * @param {string} c
             * @returns boolean
             */
            isReservedChar(c: string): c is "`" | "^";
            /**
             * @param {Token[]} tokens
             * @returns {boolean}
             */
            isValidSingleQuoteStringStart(tokens: Token[]): boolean;
            /**
             * @param {string} string
             * @param {boolean} [template]
             * @returns {Tokens}
             */
            tokenize(string: string, template?: boolean): Tokens;
        };
        Tokens: {
            new (tokens: any, consumed: any, source: any): {
                tokens: any;
                consumed: any;
                source: any;
                readonly list: any;
                consumeWhitespace(): void;
                /**
                 * @param {Tokens} tokens
                 * @param {*} error
                 * @returns {never}
                 */
                raiseError(tokens: Tokens, error: any): never;
                /**
                 * @param {string} value
                 * @returns {Token}
                 */
                requireOpToken(value: string): Token;
                /**
                 * @param {...string} ops
                 * @returns {Token | void}
                 */
                matchAnyOpToken(...ops: string[]): Token | void;
                /**
                 * @param {...string} tokens
                 * @returns {Token | void}
                 */
                matchAnyToken(...tokens: string[]): Token | void;
                /**
                 * @param {string} value
                 * @returns {Token | void}
                 */
                matchOpToken(value: string): Token | void;
                /**
                 * @param {string} type1
                 * @param {string} [type2]
                 * @param {string} [type3]
                 * @param {string} [type4]
                 * @returns {Token}
                 */
                requireTokenType(type1: string, type2?: string, type3?: string, type4?: string): Token;
                /**
                 * @param {string} type1
                 * @param {string} [type2]
                 * @param {string} [type3]
                 * @param {string} [type4]
                 * @returns {Token | void}
                 */
                matchTokenType(type1: string, type2?: string, type3?: string, type4?: string): Token | void;
                /**
                 * @param {string} value
                 * @param {string} [type]
                 * @returns {Token}
                 */
                requireToken(value: string, type?: string): Token;
                peekToken(value: any, peek: any, type: any): any;
                /**
                 * @param {string} value
                 * @param {string} [type]
                 * @returns {Token | void}
                 */
                matchToken(value: string, type?: string): Token | void;
                /**
                 * @returns {Token}
                 */
                consumeToken(): Token;
                _lastConsumed: any;
                /**
                 * @param {string | null} value
                 * @param {string | null} [type]
                 * @returns {Token[]}
                 */
                consumeUntil(value: string | null, type?: string | null): Token[];
                /**
                 * @returns {string}
                 */
                lastWhitespace(): string;
                consumeUntilWhitespace(): Token[];
                /**
                 * @returns {boolean}
                 */
                hasMore(): boolean;
                /**
                 * @param {number} n
                 * @param {boolean} [dontIgnoreWhitespace]
                 * @returns {Token}
                 */
                token(n: number, dontIgnoreWhitespace?: boolean): Token;
                /**
                 * @returns {Token}
                 */
                currentToken(): Token;
                /**
                 * @returns {Token | null}
                 */
                lastMatch(): Token | null;
                pushFollow(str: any): void;
                popFollow(): void;
                clearFollows(): any;
                follows: any;
                restoreFollows(f: any): void;
            };
        };
        Parser: {
            new (): {
                possessivesDisabled: boolean;
                use(plugin: any): /*elided*/ any;
                /**
                 * @param {*} parseElement
                 * @param {*} start
                 * @param {Tokens} tokens
                 */
                initElt(parseElement: any, start: any, tokens: Tokens): void;
                /**
                 * @param {string} type
                 * @param {Tokens} tokens
                 * @param {ASTNode?} root
                 * @returns {ASTNode}
                 */
                parseElement(type: string, tokens: Tokens, root?: ASTNode | null): ASTNode;
                /**
                 * @param {string} type
                 * @param {Tokens} tokens
                 * @param {string} [message]
                 * @param {*} [root]
                 * @returns {ASTNode}
                 */
                requireElement(type: string, tokens: Tokens, message?: string, root?: any): ASTNode;
                /**
                 * @param {string[]} types
                 * @param {Tokens} tokens
                 * @param {Runtime} [runtime]
                 * @returns {ASTNode}
                 */
                parseAnyOf(types: string[], tokens: Tokens): ASTNode;
                /**
                 * @param {string} name
                 * @param {ParseRule} definition
                 */
                addGrammarElement(name: string, definition: ParseRule): void;
                /**
                 * @param {string} keyword
                 * @param {ParseRule} definition
                 */
                addCommand(keyword: string, definition: ParseRule): void;
                /**
                 * @param {string} keyword
                 * @param {ParseRule} definition
                 */
                addFeature(keyword: string, definition: ParseRule): void;
                /**
                 * @param {string} name
                 * @param {ParseRule} definition
                 */
                addLeafExpression(name: string, definition: ParseRule): void;
                /**
                 * @param {string} name
                 * @param {ParseRule} definition
                 */
                addIndirectExpression(name: string, definition: ParseRule): void;
                /**
                 * @param {Tokens} tokens
                 * @param {string} [message]
                 */
                raiseParseError(tokens: Tokens, message?: string): void;
                /**
                 * @param {Tokens} tokens
                 * @returns {ASTNode}
                 */
                parseHyperScript(tokens: Tokens): ASTNode;
                /**
                 * @param {Lexer} lexer
                 * @param {string} src
                 * @returns {ASTNode}
                 */
                parse(lexer: {
                    new (): {
                        /**
                         * @param {string} string
                         * @param {boolean} [template]
                         * @returns {Tokens}
                         */
                        tokenize(string: string, template?: boolean): Tokens;
                    };
                    /**
                     * isValidCSSClassChar returns `true` if the provided character is valid in a CSS class.
                     * @param {string} c
                     * @returns boolean
                     */
                    isValidCSSClassChar(c: string): boolean;
                    /**
                     * isValidCSSIDChar returns `true` if the provided character is valid in a CSS ID
                     * @param {string} c
                     * @returns boolean
                     */
                    isValidCSSIDChar(c: string): boolean;
                    /**
                     * isWhitespace returns `true` if the provided character is whitespace.
                     * @param {string} c
                     * @returns boolean
                     */
                    isWhitespace(c: string): c is "\n" | " " | "\t" | "\r";
                    /**
                     * positionString returns a string representation of a Token's line and column details.
                     * @param {Token} token
                     * @returns string
                     */
                    positionString(token: Token): string;
                    /**
                     * isNewline returns `true` if the provided character is a carriage return or newline
                     * @param {string} c
                     * @returns boolean
                     */
                    isNewline(c: string): c is "\n" | "\r";
                    /**
                     * isNumeric returns `true` if the provided character is a number (0-9)
                     * @param {string} c
                     * @returns boolean
                     */
                    isNumeric(c: string): boolean;
                    /**
                     * isAlpha returns `true` if the provided character is a letter in the alphabet
                     * @param {string} c
                     * @returns boolean
                     */
                    isAlpha(c: string): boolean;
                    /**
                     * @param {string} c
                     * @param {boolean} [dollarIsOp]
                     * @returns boolean
                     */
                    isIdentifierChar(c: string, dollarIsOp?: boolean): c is "_" | "$";
                    /**
                     * @param {string} c
                     * @returns boolean
                     */
                    isReservedChar(c: string): c is "`" | "^";
                    /**
                     * @param {Token[]} tokens
                     * @returns {boolean}
                     */
                    isValidSingleQuoteStringStart(tokens: Token[]): boolean;
                    /**
                     * @param {string} string
                     * @param {boolean} [template]
                     * @returns {Tokens}
                     */
                    tokenize(string: string, template?: boolean): Tokens;
                }, src: string): ASTNode;
                /**
                 * @param {ASTNode | undefined} elt
                 * @param {ASTNode} parent
                 */
                setParent(elt: ASTNode | undefined, parent: ASTNode): void;
                /**
                 * @param {Token} token
                 * @returns {ParseRule}
                 */
                commandStart(token: Token): ParseRule;
                /**
                 * @param {Token} token
                 * @returns {ParseRule}
                 */
                featureStart(token: Token): ParseRule;
                /**
                 * @param {Token} token
                 * @returns {boolean}
                 */
                commandBoundary(token: Token): boolean;
                /**
                 * @param {Tokens} tokens
                 * @returns {(string | ASTNode)[]}
                 */
                parseStringTemplate(tokens: Tokens): (string | ASTNode)[];
                /**
                 * @param {ASTNode} commandList
                 */
                ensureTerminated(commandList: ASTNode): void;
            };
            /**
             *
             * @param {Tokens} tokens
             * @returns string
             */
            createParserContext(tokens: Tokens): string;
            /**
             * @param {Tokens} tokens
             * @param {string} [message]
             * @returns {never}
             */
            raiseParseError(tokens: Tokens, message?: string): never;
        };
        Runtime: {
            new (globalScope2: any): {
                globalScope: any;
                /**
                 * @param {HTMLElement} elt
                 * @param {string} selector
                 * @returns boolean
                 */
                matchesSelector(elt: HTMLElement, selector: string): any;
                /**
                 * @param {string} eventName
                 * @param {Object} [detail]
                 * @returns {Event}
                 */
                makeEvent(eventName: string, detail?: any): Event;
                /**
                 * @param {Element} elt
                 * @param {string} eventName
                 * @param {Object} [detail]
                 * @param {Element} [sender]
                 * @returns {boolean}
                 */
                triggerEvent(elt: Element, eventName: string, detail?: any, sender?: Element): boolean;
                /**
                 * isArrayLike returns `true` if the provided value is an array or
                 * something close enough to being an array for our purposes.
                 *
                 * @param {any} value
                 * @returns {value is Array | NodeList | HTMLCollection | FileList}
                 */
                isArrayLike(value: any): value is any[] | NodeList | HTMLCollection | FileList;
                /**
                 * isIterable returns `true` if the provided value supports the
                 * iterator protocol.
                 *
                 * @param {any} value
                 * @returns {value is Iterable}
                 */
                isIterable(value: any): value is Iterable<any>;
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
                shouldAutoIterate(value: any): value is (any[] | {
                    _css: any;
                    relativeToElement: any;
                    escape: any;
                    readonly css: any;
                    readonly className: any;
                    readonly id: any;
                    contains(elt: any): boolean;
                    readonly length: number;
                    selectMatches(): NodeListOf<any>;
                    [Symbol.iterator](): any;
                });
                /**
                 * forEach executes the provided `func` on every item in the `value` array.
                 * if `value` is a single item (and not an array) then `func` is simply called
                 * once.  If `value` is null, then no further actions are taken.
                 *
                 * @template T
                 * @param {T | Iterable<T>} value
                 * @param {(item: T) => void} func
                 */
                forEach<T>(value: T | Iterable<T>, func: (item: T) => void): void;
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
                implicitLoop<T>(value: {
                    _css: any;
                    relativeToElement: any;
                    escape: any;
                    readonly css: any;
                    readonly className: any;
                    readonly id: any;
                    contains(elt: any): boolean;
                    readonly length: number;
                    selectMatches(): NodeListOf<any>;
                    [Symbol.iterator](): any;
                } | T | T[], func: (item: T) => void): void;
                wrapArrays(args: any): any[];
                unwrapAsyncs(values: any): void;
                /**
                 * @param {ASTNode} command
                 * @param {Context} ctx
                 */
                unifiedExec(command: ASTNode, ctx: {
                    meta: {
                        runtime: any;
                        owner: any;
                        feature: any;
                        iterators: {};
                        ctx: /*elided*/ any;
                    };
                    locals: {
                        cookies: {};
                    };
                    me: any;
                    event: any;
                    target: any;
                    detail: any;
                    sender: any;
                    body: HTMLElement;
                }): void;
                /**
                * @param {*} parseElement
                * @param {Context} ctx
                * @param {Boolean} [shortCircuitOnValue]
                * @returns {*}
                */
                unifiedEval(parseElement: any, ctx: {
                    meta: {
                        runtime: any;
                        owner: any;
                        feature: any;
                        iterators: {};
                        ctx: /*elided*/ any;
                    };
                    locals: {
                        cookies: {};
                    };
                    me: any;
                    event: any;
                    target: any;
                    detail: any;
                    sender: any;
                    body: HTMLElement;
                }, shortCircuitOnValue?: boolean): any;
                /**
                * getAttributes returns the attribute name(s) to use when
                * locating hyperscript scripts in a DOM element.  If no value
                * has been configured, it defaults to config.attributes
                * @returns string[]
                */
                getScriptAttributes(): string[];
                _scriptAttrs: string[];
                /**
                * @param {Element} elt
                * @returns {string | null}
                */
                getScript(elt: Element): string | null;
                /**
                * @param {*} elt
                * @returns {Object}
                */
                getHyperscriptFeatures(elt: any): any;
                /**
                * @param {Object} owner
                * @param {Context} ctx
                */
                addFeatures(owner: any, ctx: {
                    meta: {
                        runtime: any;
                        owner: any;
                        feature: any;
                        iterators: {};
                        ctx: /*elided*/ any;
                    };
                    locals: {
                        cookies: {};
                    };
                    me: any;
                    event: any;
                    target: any;
                    detail: any;
                    sender: any;
                    body: HTMLElement;
                }): void;
                /**
                * @param {*} owner
                * @param {*} feature
                * @param {*} hyperscriptTarget
                * @param {*} event
                * @returns {Context}
                */
                makeContext(owner: any, feature: any, hyperscriptTarget: any, event: any): {
                    meta: {
                        runtime: any;
                        owner: any;
                        feature: any;
                        iterators: {};
                        ctx: /*elided*/ any;
                    };
                    locals: {
                        cookies: {};
                    };
                    me: any;
                    event: any;
                    target: any;
                    detail: any;
                    sender: any;
                    body: HTMLElement;
                };
                /**
                * @returns string
                */
                getScriptSelector(): string;
                /**
                * @param {any} value
                * @param {string} type
                * @returns {any}
                */
                convertValue(value: any, type: string): any;
                /**
                 *
                 * @param {ASTNode} elt
                 * @param {Context} ctx
                 * @returns {any}
                 */
                evaluateNoPromise(elt: ASTNode, ctx: {
                    meta: {
                        runtime: any;
                        owner: any;
                        feature: any;
                        iterators: {};
                        ctx: /*elided*/ any;
                    };
                    locals: {
                        cookies: {};
                    };
                    me: any;
                    event: any;
                    target: any;
                    detail: any;
                    sender: any;
                    body: HTMLElement;
                }): any;
                /**
                * @param {Element} elt
                * @returns {Object}
                */
                getInternalData(elt: Element): any;
                /**
                * @param {any} value
                * @param {string} typeString
                * @param {boolean} [nullOk]
                * @returns {boolean}
                */
                typeCheck(value: any, typeString: string, nullOk?: boolean): boolean;
                getElementScope(context2: any): any;
                /**
                * @param {string} str
                * @returns {boolean}
                */
                isReservedWord(str: string): boolean;
                /**
                * @param {any} context
                * @returns {boolean}
                */
                isHyperscriptContext(context2: any): boolean;
                /**
                * @param {string} str
                * @param {Context} context
                * @returns {any}
                */
                resolveSymbol(str: string, context2: any, type: any): any;
                setSymbol(str: any, context2: any, type: any, value: any): void;
                /**
                * @param {ASTNode} command
                * @param {Context} context
                * @returns {undefined | ASTNode}
                */
                findNext(command: ASTNode, context2: any): undefined | ASTNode;
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
                flatGet(root: {
                    [x: string]: any;
                }, property: string, getter: (root: {
                    [x: string]: any;
                }, property: string) => any): any;
                resolveProperty(root: any, property: any): any;
                resolveAttribute(root: any, property: any): any;
                /**
                 *
                 * @param {Object<string, any>} root
                 * @param {string} property
                 * @returns {string}
                 */
                resolveStyle(root: {
                    [x: string]: any;
                }, property: string): string;
                /**
                 *
                 * @param {Object<string, any>} root
                 * @param {string} property
                 * @returns {string}
                 */
                resolveComputedStyle(root: {
                    [x: string]: any;
                }, property: string): string;
                /**
                * @param {Element} elt
                * @param {string[]} nameSpace
                * @param {string} name
                * @param {any} value
                */
                assignToNamespace(elt: Element, nameSpace: string[], name: string, value: any): void;
                getHyperTrace(ctx: any, thrown: any): any;
                registerHyperTrace(ctx: any, thrown: any): void;
                /**
                * @param {string} str
                * @returns {string}
                */
                escapeSelector(str: string): string;
                /**
                * @param {any} value
                * @param {*} elt
                */
                nullCheck(value: any, elt: any): void;
                /**
                * @param {any} value
                * @returns {boolean}
                */
                isEmpty(value: any): boolean;
                /**
                * @param {any} value
                * @returns {boolean}
                */
                doesExist(value: any): boolean;
                /**
                * @param {Node} node
                * @returns {Document|ShadowRoot}
                */
                getRootNode(node: Node): Document | ShadowRoot;
                /**
                 *
                 * @param {Element} elt
                 * @param {ASTNode} onFeature
                 * @returns {EventQueue}
                 *
                 * @typedef {{queue:Array, executing:boolean}} EventQueue
                 */
                getEventQueueFor(elt: Element, onFeature: ASTNode): {
                    queue: any[];
                    executing: boolean;
                };
                beepValueToConsole(element: any, expression: any, value: any): void;
            };
        };
    };
    ElementCollection: {
        new (css: any, relativeToElement: any, escape: any): {
            _css: any;
            relativeToElement: any;
            escape: any;
            readonly css: any;
            readonly className: any;
            readonly id: any;
            contains(elt: any): boolean;
            readonly length: number;
            selectMatches(): NodeListOf<any>;
            [Symbol.iterator](): any;
        };
        _runtime: {
            globalScope: any;
            /**
             * @param {HTMLElement} elt
             * @param {string} selector
             * @returns boolean
             */
            matchesSelector(elt: HTMLElement, selector: string): any;
            /**
             * @param {string} eventName
             * @param {Object} [detail]
             * @returns {Event}
             */
            makeEvent(eventName: string, detail?: any): Event;
            /**
             * @param {Element} elt
             * @param {string} eventName
             * @param {Object} [detail]
             * @param {Element} [sender]
             * @returns {boolean}
             */
            triggerEvent(elt: Element, eventName: string, detail?: any, sender?: Element): boolean;
            /**
             * isArrayLike returns `true` if the provided value is an array or
             * something close enough to being an array for our purposes.
             *
             * @param {any} value
             * @returns {value is Array | NodeList | HTMLCollection | FileList}
             */
            isArrayLike(value: any): value is any[] | NodeList | HTMLCollection | FileList;
            /**
             * isIterable returns `true` if the provided value supports the
             * iterator protocol.
             *
             * @param {any} value
             * @returns {value is Iterable}
             */
            isIterable(value: any): value is Iterable<any>;
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
            shouldAutoIterate(value: any): value is (any[] | {
                _css: any;
                relativeToElement: any;
                escape: any;
                readonly css: any;
                readonly className: any;
                readonly id: any;
                contains(elt: any): boolean;
                readonly length: number;
                selectMatches(): NodeListOf<any>;
                [Symbol.iterator](): any;
            });
            /**
             * forEach executes the provided `func` on every item in the `value` array.
             * if `value` is a single item (and not an array) then `func` is simply called
             * once.  If `value` is null, then no further actions are taken.
             *
             * @template T
             * @param {T | Iterable<T>} value
             * @param {(item: T) => void} func
             */
            forEach<T>(value: T | Iterable<T>, func: (item: T) => void): void;
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
            implicitLoop<T>(value: {
                _css: any;
                relativeToElement: any;
                escape: any;
                readonly css: any;
                readonly className: any;
                readonly id: any;
                contains(elt: any): boolean;
                readonly length: number;
                selectMatches(): NodeListOf<any>;
                [Symbol.iterator](): any;
            } | T | T[], func: (item: T) => void): void;
            wrapArrays(args: any): any[];
            unwrapAsyncs(values: any): void;
            /**
             * @param {ASTNode} command
             * @param {Context} ctx
             */
            unifiedExec(command: ASTNode, ctx: {
                meta: {
                    runtime: any;
                    owner: any;
                    feature: any;
                    iterators: {};
                    ctx: /*elided*/ any;
                };
                locals: {
                    cookies: {};
                };
                me: any;
                event: any;
                target: any;
                detail: any;
                sender: any;
                body: HTMLElement;
            }): void;
            /**
            * @param {*} parseElement
            * @param {Context} ctx
            * @param {Boolean} [shortCircuitOnValue]
            * @returns {*}
            */
            unifiedEval(parseElement: any, ctx: {
                meta: {
                    runtime: any;
                    owner: any;
                    feature: any;
                    iterators: {};
                    ctx: /*elided*/ any;
                };
                locals: {
                    cookies: {};
                };
                me: any;
                event: any;
                target: any;
                detail: any;
                sender: any;
                body: HTMLElement;
            }, shortCircuitOnValue?: boolean): any;
            /**
            * getAttributes returns the attribute name(s) to use when
            * locating hyperscript scripts in a DOM element.  If no value
            * has been configured, it defaults to config.attributes
            * @returns string[]
            */
            getScriptAttributes(): string[];
            _scriptAttrs: string[];
            /**
            * @param {Element} elt
            * @returns {string | null}
            */
            getScript(elt: Element): string | null;
            /**
            * @param {*} elt
            * @returns {Object}
            */
            getHyperscriptFeatures(elt: any): any;
            /**
            * @param {Object} owner
            * @param {Context} ctx
            */
            addFeatures(owner: any, ctx: {
                meta: {
                    runtime: any;
                    owner: any;
                    feature: any;
                    iterators: {};
                    ctx: /*elided*/ any;
                };
                locals: {
                    cookies: {};
                };
                me: any;
                event: any;
                target: any;
                detail: any;
                sender: any;
                body: HTMLElement;
            }): void;
            /**
            * @param {*} owner
            * @param {*} feature
            * @param {*} hyperscriptTarget
            * @param {*} event
            * @returns {Context}
            */
            makeContext(owner: any, feature: any, hyperscriptTarget: any, event: any): {
                meta: {
                    runtime: any;
                    owner: any;
                    feature: any;
                    iterators: {};
                    ctx: /*elided*/ any;
                };
                locals: {
                    cookies: {};
                };
                me: any;
                event: any;
                target: any;
                detail: any;
                sender: any;
                body: HTMLElement;
            };
            /**
            * @returns string
            */
            getScriptSelector(): string;
            /**
            * @param {any} value
            * @param {string} type
            * @returns {any}
            */
            convertValue(value: any, type: string): any;
            /**
             *
             * @param {ASTNode} elt
             * @param {Context} ctx
             * @returns {any}
             */
            evaluateNoPromise(elt: ASTNode, ctx: {
                meta: {
                    runtime: any;
                    owner: any;
                    feature: any;
                    iterators: {};
                    ctx: /*elided*/ any;
                };
                locals: {
                    cookies: {};
                };
                me: any;
                event: any;
                target: any;
                detail: any;
                sender: any;
                body: HTMLElement;
            }): any;
            /**
            * @param {Element} elt
            * @returns {Object}
            */
            getInternalData(elt: Element): any;
            /**
            * @param {any} value
            * @param {string} typeString
            * @param {boolean} [nullOk]
            * @returns {boolean}
            */
            typeCheck(value: any, typeString: string, nullOk?: boolean): boolean;
            getElementScope(context2: any): any;
            /**
            * @param {string} str
            * @returns {boolean}
            */
            isReservedWord(str: string): boolean;
            /**
            * @param {any} context
            * @returns {boolean}
            */
            isHyperscriptContext(context2: any): boolean;
            /**
            * @param {string} str
            * @param {Context} context
            * @returns {any}
            */
            resolveSymbol(str: string, context2: any, type: any): any;
            setSymbol(str: any, context2: any, type: any, value: any): void;
            /**
            * @param {ASTNode} command
            * @param {Context} context
            * @returns {undefined | ASTNode}
            */
            findNext(command: ASTNode, context2: any): undefined | ASTNode;
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
            flatGet(root: {
                [x: string]: any;
            }, property: string, getter: (root: {
                [x: string]: any;
            }, property: string) => any): any;
            resolveProperty(root: any, property: any): any;
            resolveAttribute(root: any, property: any): any;
            /**
             *
             * @param {Object<string, any>} root
             * @param {string} property
             * @returns {string}
             */
            resolveStyle(root: {
                [x: string]: any;
            }, property: string): string;
            /**
             *
             * @param {Object<string, any>} root
             * @param {string} property
             * @returns {string}
             */
            resolveComputedStyle(root: {
                [x: string]: any;
            }, property: string): string;
            /**
            * @param {Element} elt
            * @param {string[]} nameSpace
            * @param {string} name
            * @param {any} value
            */
            assignToNamespace(elt: Element, nameSpace: string[], name: string, value: any): void;
            getHyperTrace(ctx: any, thrown: any): any;
            registerHyperTrace(ctx: any, thrown: any): void;
            /**
            * @param {string} str
            * @returns {string}
            */
            escapeSelector(str: string): string;
            /**
            * @param {any} value
            * @param {*} elt
            */
            nullCheck(value: any, elt: any): void;
            /**
            * @param {any} value
            * @returns {boolean}
            */
            isEmpty(value: any): boolean;
            /**
            * @param {any} value
            * @returns {boolean}
            */
            doesExist(value: any): boolean;
            /**
            * @param {Node} node
            * @returns {Document|ShadowRoot}
            */
            getRootNode(node: Node): Document | ShadowRoot;
            /**
             *
             * @param {Element} elt
             * @param {ASTNode} onFeature
             * @returns {EventQueue}
             *
             * @typedef {{queue:Array, executing:boolean}} EventQueue
             */
            getEventQueueFor(elt: Element, onFeature: ASTNode): {
                queue: any[];
                executing: boolean;
            };
            beepValueToConsole(element: any, expression: any, value: any): void;
        };
    };
    addFeature: any;
    addCommand: any;
    addLeafExpression: any;
    addIndirectExpression: any;
    evaluate: typeof evaluate;
    parse: (src: any) => ASTNode;
    process: (elt: any) => void;
    processNode: (elt: any) => void;
    version: string;
    browserInit: typeof browserInit;
};
declare var browser_default: typeof run & {
    config: {
        attributes: string;
        defaultTransition: string;
        disableSelector: string;
        hideShowStrategies: {};
        conversions: {
            dynamicResolvers: ((str: any, value: any) => string)[];
            String: (val: any) => any;
            Int: (val: any) => number;
            Float: (val: any) => number;
            Number: (val: any) => number;
            Date: (val: any) => Date;
            Array: (val: any) => any[];
            JSON: (val: any) => string;
            Object: (val: any) => any;
        };
    };
    use(plugin: any): void;
    internals: {
        lexer: {
            /**
             * @param {string} string
             * @param {boolean} [template]
             * @returns {Tokens}
             */
            tokenize(string: string, template?: boolean): Tokens;
        };
        parser: {
            possessivesDisabled: boolean;
            use(plugin: any): /*elided*/ any;
            /**
             * @param {*} parseElement
             * @param {*} start
             * @param {Tokens} tokens
             */
            initElt(parseElement: any, start: any, tokens: Tokens): void;
            /**
             * @param {string} type
             * @param {Tokens} tokens
             * @param {ASTNode?} root
             * @returns {ASTNode}
             */
            parseElement(type: string, tokens: Tokens, root?: ASTNode | null): ASTNode;
            /**
             * @param {string} type
             * @param {Tokens} tokens
             * @param {string} [message]
             * @param {*} [root]
             * @returns {ASTNode}
             */
            requireElement(type: string, tokens: Tokens, message?: string, root?: any): ASTNode;
            /**
             * @param {string[]} types
             * @param {Tokens} tokens
             * @param {Runtime} [runtime]
             * @returns {ASTNode}
             */
            parseAnyOf(types: string[], tokens: Tokens): ASTNode;
            /**
             * @param {string} name
             * @param {ParseRule} definition
             */
            addGrammarElement(name: string, definition: ParseRule): void;
            /**
             * @param {string} keyword
             * @param {ParseRule} definition
             */
            addCommand(keyword: string, definition: ParseRule): void;
            /**
             * @param {string} keyword
             * @param {ParseRule} definition
             */
            addFeature(keyword: string, definition: ParseRule): void;
            /**
             * @param {string} name
             * @param {ParseRule} definition
             */
            addLeafExpression(name: string, definition: ParseRule): void;
            /**
             * @param {string} name
             * @param {ParseRule} definition
             */
            addIndirectExpression(name: string, definition: ParseRule): void;
            /**
             * @param {Tokens} tokens
             * @param {string} [message]
             */
            raiseParseError(tokens: Tokens, message?: string): void;
            /**
             * @param {Tokens} tokens
             * @returns {ASTNode}
             */
            parseHyperScript(tokens: Tokens): ASTNode;
            /**
             * @param {Lexer} lexer
             * @param {string} src
             * @returns {ASTNode}
             */
            parse(lexer: {
                new (): {
                    /**
                     * @param {string} string
                     * @param {boolean} [template]
                     * @returns {Tokens}
                     */
                    tokenize(string: string, template?: boolean): Tokens;
                };
                /**
                 * isValidCSSClassChar returns `true` if the provided character is valid in a CSS class.
                 * @param {string} c
                 * @returns boolean
                 */
                isValidCSSClassChar(c: string): boolean;
                /**
                 * isValidCSSIDChar returns `true` if the provided character is valid in a CSS ID
                 * @param {string} c
                 * @returns boolean
                 */
                isValidCSSIDChar(c: string): boolean;
                /**
                 * isWhitespace returns `true` if the provided character is whitespace.
                 * @param {string} c
                 * @returns boolean
                 */
                isWhitespace(c: string): c is "\n" | " " | "\t" | "\r";
                /**
                 * positionString returns a string representation of a Token's line and column details.
                 * @param {Token} token
                 * @returns string
                 */
                positionString(token: Token): string;
                /**
                 * isNewline returns `true` if the provided character is a carriage return or newline
                 * @param {string} c
                 * @returns boolean
                 */
                isNewline(c: string): c is "\n" | "\r";
                /**
                 * isNumeric returns `true` if the provided character is a number (0-9)
                 * @param {string} c
                 * @returns boolean
                 */
                isNumeric(c: string): boolean;
                /**
                 * isAlpha returns `true` if the provided character is a letter in the alphabet
                 * @param {string} c
                 * @returns boolean
                 */
                isAlpha(c: string): boolean;
                /**
                 * @param {string} c
                 * @param {boolean} [dollarIsOp]
                 * @returns boolean
                 */
                isIdentifierChar(c: string, dollarIsOp?: boolean): c is "_" | "$";
                /**
                 * @param {string} c
                 * @returns boolean
                 */
                isReservedChar(c: string): c is "`" | "^";
                /**
                 * @param {Token[]} tokens
                 * @returns {boolean}
                 */
                isValidSingleQuoteStringStart(tokens: Token[]): boolean;
                /**
                 * @param {string} string
                 * @param {boolean} [template]
                 * @returns {Tokens}
                 */
                tokenize(string: string, template?: boolean): Tokens;
            }, src: string): ASTNode;
            /**
             * @param {ASTNode | undefined} elt
             * @param {ASTNode} parent
             */
            setParent(elt: ASTNode | undefined, parent: ASTNode): void;
            /**
             * @param {Token} token
             * @returns {ParseRule}
             */
            commandStart(token: Token): ParseRule;
            /**
             * @param {Token} token
             * @returns {ParseRule}
             */
            featureStart(token: Token): ParseRule;
            /**
             * @param {Token} token
             * @returns {boolean}
             */
            commandBoundary(token: Token): boolean;
            /**
             * @param {Tokens} tokens
             * @returns {(string | ASTNode)[]}
             */
            parseStringTemplate(tokens: Tokens): (string | ASTNode)[];
            /**
             * @param {ASTNode} commandList
             */
            ensureTerminated(commandList: ASTNode): void;
        };
        runtime: {
            globalScope: any;
            /**
             * @param {HTMLElement} elt
             * @param {string} selector
             * @returns boolean
             */
            matchesSelector(elt: HTMLElement, selector: string): any;
            /**
             * @param {string} eventName
             * @param {Object} [detail]
             * @returns {Event}
             */
            makeEvent(eventName: string, detail?: any): Event;
            /**
             * @param {Element} elt
             * @param {string} eventName
             * @param {Object} [detail]
             * @param {Element} [sender]
             * @returns {boolean}
             */
            triggerEvent(elt: Element, eventName: string, detail?: any, sender?: Element): boolean;
            /**
             * isArrayLike returns `true` if the provided value is an array or
             * something close enough to being an array for our purposes.
             *
             * @param {any} value
             * @returns {value is Array | NodeList | HTMLCollection | FileList}
             */
            isArrayLike(value: any): value is any[] | NodeList | HTMLCollection | FileList;
            /**
             * isIterable returns `true` if the provided value supports the
             * iterator protocol.
             *
             * @param {any} value
             * @returns {value is Iterable}
             */
            isIterable(value: any): value is Iterable<any>;
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
            shouldAutoIterate(value: any): value is (any[] | {
                _css: any;
                relativeToElement: any;
                escape: any;
                readonly css: any;
                readonly className: any;
                readonly id: any;
                contains(elt: any): boolean;
                readonly length: number;
                selectMatches(): NodeListOf<any>;
                [Symbol.iterator](): any;
            });
            /**
             * forEach executes the provided `func` on every item in the `value` array.
             * if `value` is a single item (and not an array) then `func` is simply called
             * once.  If `value` is null, then no further actions are taken.
             *
             * @template T
             * @param {T | Iterable<T>} value
             * @param {(item: T) => void} func
             */
            forEach<T>(value: T | Iterable<T>, func: (item: T) => void): void;
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
            implicitLoop<T>(value: {
                _css: any;
                relativeToElement: any;
                escape: any;
                readonly css: any;
                readonly className: any;
                readonly id: any;
                contains(elt: any): boolean;
                readonly length: number;
                selectMatches(): NodeListOf<any>;
                [Symbol.iterator](): any;
            } | T | T[], func: (item: T) => void): void;
            wrapArrays(args: any): any[];
            unwrapAsyncs(values: any): void;
            /**
             * @param {ASTNode} command
             * @param {Context} ctx
             */
            unifiedExec(command: ASTNode, ctx: {
                meta: {
                    runtime: any;
                    owner: any;
                    feature: any;
                    iterators: {};
                    ctx: /*elided*/ any;
                };
                locals: {
                    cookies: {};
                };
                me: any;
                event: any;
                target: any;
                detail: any;
                sender: any;
                body: HTMLElement;
            }): void;
            /**
            * @param {*} parseElement
            * @param {Context} ctx
            * @param {Boolean} [shortCircuitOnValue]
            * @returns {*}
            */
            unifiedEval(parseElement: any, ctx: {
                meta: {
                    runtime: any;
                    owner: any;
                    feature: any;
                    iterators: {};
                    ctx: /*elided*/ any;
                };
                locals: {
                    cookies: {};
                };
                me: any;
                event: any;
                target: any;
                detail: any;
                sender: any;
                body: HTMLElement;
            }, shortCircuitOnValue?: boolean): any;
            /**
            * getAttributes returns the attribute name(s) to use when
            * locating hyperscript scripts in a DOM element.  If no value
            * has been configured, it defaults to config.attributes
            * @returns string[]
            */
            getScriptAttributes(): string[];
            _scriptAttrs: string[];
            /**
            * @param {Element} elt
            * @returns {string | null}
            */
            getScript(elt: Element): string | null;
            /**
            * @param {*} elt
            * @returns {Object}
            */
            getHyperscriptFeatures(elt: any): any;
            /**
            * @param {Object} owner
            * @param {Context} ctx
            */
            addFeatures(owner: any, ctx: {
                meta: {
                    runtime: any;
                    owner: any;
                    feature: any;
                    iterators: {};
                    ctx: /*elided*/ any;
                };
                locals: {
                    cookies: {};
                };
                me: any;
                event: any;
                target: any;
                detail: any;
                sender: any;
                body: HTMLElement;
            }): void;
            /**
            * @param {*} owner
            * @param {*} feature
            * @param {*} hyperscriptTarget
            * @param {*} event
            * @returns {Context}
            */
            makeContext(owner: any, feature: any, hyperscriptTarget: any, event: any): {
                meta: {
                    runtime: any;
                    owner: any;
                    feature: any;
                    iterators: {};
                    ctx: /*elided*/ any;
                };
                locals: {
                    cookies: {};
                };
                me: any;
                event: any;
                target: any;
                detail: any;
                sender: any;
                body: HTMLElement;
            };
            /**
            * @returns string
            */
            getScriptSelector(): string;
            /**
            * @param {any} value
            * @param {string} type
            * @returns {any}
            */
            convertValue(value: any, type: string): any;
            /**
             *
             * @param {ASTNode} elt
             * @param {Context} ctx
             * @returns {any}
             */
            evaluateNoPromise(elt: ASTNode, ctx: {
                meta: {
                    runtime: any;
                    owner: any;
                    feature: any;
                    iterators: {};
                    ctx: /*elided*/ any;
                };
                locals: {
                    cookies: {};
                };
                me: any;
                event: any;
                target: any;
                detail: any;
                sender: any;
                body: HTMLElement;
            }): any;
            /**
            * @param {Element} elt
            * @returns {Object}
            */
            getInternalData(elt: Element): any;
            /**
            * @param {any} value
            * @param {string} typeString
            * @param {boolean} [nullOk]
            * @returns {boolean}
            */
            typeCheck(value: any, typeString: string, nullOk?: boolean): boolean;
            getElementScope(context2: any): any;
            /**
            * @param {string} str
            * @returns {boolean}
            */
            isReservedWord(str: string): boolean;
            /**
            * @param {any} context
            * @returns {boolean}
            */
            isHyperscriptContext(context2: any): boolean;
            /**
            * @param {string} str
            * @param {Context} context
            * @returns {any}
            */
            resolveSymbol(str: string, context2: any, type: any): any;
            setSymbol(str: any, context2: any, type: any, value: any): void;
            /**
            * @param {ASTNode} command
            * @param {Context} context
            * @returns {undefined | ASTNode}
            */
            findNext(command: ASTNode, context2: any): undefined | ASTNode;
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
            flatGet(root: {
                [x: string]: any;
            }, property: string, getter: (root: {
                [x: string]: any;
            }, property: string) => any): any;
            resolveProperty(root: any, property: any): any;
            resolveAttribute(root: any, property: any): any;
            /**
             *
             * @param {Object<string, any>} root
             * @param {string} property
             * @returns {string}
             */
            resolveStyle(root: {
                [x: string]: any;
            }, property: string): string;
            /**
             *
             * @param {Object<string, any>} root
             * @param {string} property
             * @returns {string}
             */
            resolveComputedStyle(root: {
                [x: string]: any;
            }, property: string): string;
            /**
            * @param {Element} elt
            * @param {string[]} nameSpace
            * @param {string} name
            * @param {any} value
            */
            assignToNamespace(elt: Element, nameSpace: string[], name: string, value: any): void;
            getHyperTrace(ctx: any, thrown: any): any;
            registerHyperTrace(ctx: any, thrown: any): void;
            /**
            * @param {string} str
            * @returns {string}
            */
            escapeSelector(str: string): string;
            /**
            * @param {any} value
            * @param {*} elt
            */
            nullCheck(value: any, elt: any): void;
            /**
            * @param {any} value
            * @returns {boolean}
            */
            isEmpty(value: any): boolean;
            /**
            * @param {any} value
            * @returns {boolean}
            */
            doesExist(value: any): boolean;
            /**
            * @param {Node} node
            * @returns {Document|ShadowRoot}
            */
            getRootNode(node: Node): Document | ShadowRoot;
            /**
             *
             * @param {Element} elt
             * @param {ASTNode} onFeature
             * @returns {EventQueue}
             *
             * @typedef {{queue:Array, executing:boolean}} EventQueue
             */
            getEventQueueFor(elt: Element, onFeature: ASTNode): {
                queue: any[];
                executing: boolean;
            };
            beepValueToConsole(element: any, expression: any, value: any): void;
        };
        Lexer: {
            new (): {
                /**
                 * @param {string} string
                 * @param {boolean} [template]
                 * @returns {Tokens}
                 */
                tokenize(string: string, template?: boolean): Tokens;
            };
            /**
             * isValidCSSClassChar returns `true` if the provided character is valid in a CSS class.
             * @param {string} c
             * @returns boolean
             */
            isValidCSSClassChar(c: string): boolean;
            /**
             * isValidCSSIDChar returns `true` if the provided character is valid in a CSS ID
             * @param {string} c
             * @returns boolean
             */
            isValidCSSIDChar(c: string): boolean;
            /**
             * isWhitespace returns `true` if the provided character is whitespace.
             * @param {string} c
             * @returns boolean
             */
            isWhitespace(c: string): c is "\n" | " " | "\t" | "\r";
            /**
             * positionString returns a string representation of a Token's line and column details.
             * @param {Token} token
             * @returns string
             */
            positionString(token: Token): string;
            /**
             * isNewline returns `true` if the provided character is a carriage return or newline
             * @param {string} c
             * @returns boolean
             */
            isNewline(c: string): c is "\n" | "\r";
            /**
             * isNumeric returns `true` if the provided character is a number (0-9)
             * @param {string} c
             * @returns boolean
             */
            isNumeric(c: string): boolean;
            /**
             * isAlpha returns `true` if the provided character is a letter in the alphabet
             * @param {string} c
             * @returns boolean
             */
            isAlpha(c: string): boolean;
            /**
             * @param {string} c
             * @param {boolean} [dollarIsOp]
             * @returns boolean
             */
            isIdentifierChar(c: string, dollarIsOp?: boolean): c is "_" | "$";
            /**
             * @param {string} c
             * @returns boolean
             */
            isReservedChar(c: string): c is "`" | "^";
            /**
             * @param {Token[]} tokens
             * @returns {boolean}
             */
            isValidSingleQuoteStringStart(tokens: Token[]): boolean;
            /**
             * @param {string} string
             * @param {boolean} [template]
             * @returns {Tokens}
             */
            tokenize(string: string, template?: boolean): Tokens;
        };
        Tokens: {
            new (tokens: any, consumed: any, source: any): {
                tokens: any;
                consumed: any;
                source: any;
                readonly list: any;
                consumeWhitespace(): void;
                /**
                 * @param {Tokens} tokens
                 * @param {*} error
                 * @returns {never}
                 */
                raiseError(tokens: Tokens, error: any): never;
                /**
                 * @param {string} value
                 * @returns {Token}
                 */
                requireOpToken(value: string): Token;
                /**
                 * @param {...string} ops
                 * @returns {Token | void}
                 */
                matchAnyOpToken(...ops: string[]): Token | void;
                /**
                 * @param {...string} tokens
                 * @returns {Token | void}
                 */
                matchAnyToken(...tokens: string[]): Token | void;
                /**
                 * @param {string} value
                 * @returns {Token | void}
                 */
                matchOpToken(value: string): Token | void;
                /**
                 * @param {string} type1
                 * @param {string} [type2]
                 * @param {string} [type3]
                 * @param {string} [type4]
                 * @returns {Token}
                 */
                requireTokenType(type1: string, type2?: string, type3?: string, type4?: string): Token;
                /**
                 * @param {string} type1
                 * @param {string} [type2]
                 * @param {string} [type3]
                 * @param {string} [type4]
                 * @returns {Token | void}
                 */
                matchTokenType(type1: string, type2?: string, type3?: string, type4?: string): Token | void;
                /**
                 * @param {string} value
                 * @param {string} [type]
                 * @returns {Token}
                 */
                requireToken(value: string, type?: string): Token;
                peekToken(value: any, peek: any, type: any): any;
                /**
                 * @param {string} value
                 * @param {string} [type]
                 * @returns {Token | void}
                 */
                matchToken(value: string, type?: string): Token | void;
                /**
                 * @returns {Token}
                 */
                consumeToken(): Token;
                _lastConsumed: any;
                /**
                 * @param {string | null} value
                 * @param {string | null} [type]
                 * @returns {Token[]}
                 */
                consumeUntil(value: string | null, type?: string | null): Token[];
                /**
                 * @returns {string}
                 */
                lastWhitespace(): string;
                consumeUntilWhitespace(): Token[];
                /**
                 * @returns {boolean}
                 */
                hasMore(): boolean;
                /**
                 * @param {number} n
                 * @param {boolean} [dontIgnoreWhitespace]
                 * @returns {Token}
                 */
                token(n: number, dontIgnoreWhitespace?: boolean): Token;
                /**
                 * @returns {Token}
                 */
                currentToken(): Token;
                /**
                 * @returns {Token | null}
                 */
                lastMatch(): Token | null;
                pushFollow(str: any): void;
                popFollow(): void;
                clearFollows(): any;
                follows: any;
                restoreFollows(f: any): void;
            };
        };
        Parser: {
            new (): {
                possessivesDisabled: boolean;
                use(plugin: any): /*elided*/ any;
                /**
                 * @param {*} parseElement
                 * @param {*} start
                 * @param {Tokens} tokens
                 */
                initElt(parseElement: any, start: any, tokens: Tokens): void;
                /**
                 * @param {string} type
                 * @param {Tokens} tokens
                 * @param {ASTNode?} root
                 * @returns {ASTNode}
                 */
                parseElement(type: string, tokens: Tokens, root?: ASTNode | null): ASTNode;
                /**
                 * @param {string} type
                 * @param {Tokens} tokens
                 * @param {string} [message]
                 * @param {*} [root]
                 * @returns {ASTNode}
                 */
                requireElement(type: string, tokens: Tokens, message?: string, root?: any): ASTNode;
                /**
                 * @param {string[]} types
                 * @param {Tokens} tokens
                 * @param {Runtime} [runtime]
                 * @returns {ASTNode}
                 */
                parseAnyOf(types: string[], tokens: Tokens): ASTNode;
                /**
                 * @param {string} name
                 * @param {ParseRule} definition
                 */
                addGrammarElement(name: string, definition: ParseRule): void;
                /**
                 * @param {string} keyword
                 * @param {ParseRule} definition
                 */
                addCommand(keyword: string, definition: ParseRule): void;
                /**
                 * @param {string} keyword
                 * @param {ParseRule} definition
                 */
                addFeature(keyword: string, definition: ParseRule): void;
                /**
                 * @param {string} name
                 * @param {ParseRule} definition
                 */
                addLeafExpression(name: string, definition: ParseRule): void;
                /**
                 * @param {string} name
                 * @param {ParseRule} definition
                 */
                addIndirectExpression(name: string, definition: ParseRule): void;
                /**
                 * @param {Tokens} tokens
                 * @param {string} [message]
                 */
                raiseParseError(tokens: Tokens, message?: string): void;
                /**
                 * @param {Tokens} tokens
                 * @returns {ASTNode}
                 */
                parseHyperScript(tokens: Tokens): ASTNode;
                /**
                 * @param {Lexer} lexer
                 * @param {string} src
                 * @returns {ASTNode}
                 */
                parse(lexer: {
                    new (): {
                        /**
                         * @param {string} string
                         * @param {boolean} [template]
                         * @returns {Tokens}
                         */
                        tokenize(string: string, template?: boolean): Tokens;
                    };
                    /**
                     * isValidCSSClassChar returns `true` if the provided character is valid in a CSS class.
                     * @param {string} c
                     * @returns boolean
                     */
                    isValidCSSClassChar(c: string): boolean;
                    /**
                     * isValidCSSIDChar returns `true` if the provided character is valid in a CSS ID
                     * @param {string} c
                     * @returns boolean
                     */
                    isValidCSSIDChar(c: string): boolean;
                    /**
                     * isWhitespace returns `true` if the provided character is whitespace.
                     * @param {string} c
                     * @returns boolean
                     */
                    isWhitespace(c: string): c is "\n" | " " | "\t" | "\r";
                    /**
                     * positionString returns a string representation of a Token's line and column details.
                     * @param {Token} token
                     * @returns string
                     */
                    positionString(token: Token): string;
                    /**
                     * isNewline returns `true` if the provided character is a carriage return or newline
                     * @param {string} c
                     * @returns boolean
                     */
                    isNewline(c: string): c is "\n" | "\r";
                    /**
                     * isNumeric returns `true` if the provided character is a number (0-9)
                     * @param {string} c
                     * @returns boolean
                     */
                    isNumeric(c: string): boolean;
                    /**
                     * isAlpha returns `true` if the provided character is a letter in the alphabet
                     * @param {string} c
                     * @returns boolean
                     */
                    isAlpha(c: string): boolean;
                    /**
                     * @param {string} c
                     * @param {boolean} [dollarIsOp]
                     * @returns boolean
                     */
                    isIdentifierChar(c: string, dollarIsOp?: boolean): c is "_" | "$";
                    /**
                     * @param {string} c
                     * @returns boolean
                     */
                    isReservedChar(c: string): c is "`" | "^";
                    /**
                     * @param {Token[]} tokens
                     * @returns {boolean}
                     */
                    isValidSingleQuoteStringStart(tokens: Token[]): boolean;
                    /**
                     * @param {string} string
                     * @param {boolean} [template]
                     * @returns {Tokens}
                     */
                    tokenize(string: string, template?: boolean): Tokens;
                }, src: string): ASTNode;
                /**
                 * @param {ASTNode | undefined} elt
                 * @param {ASTNode} parent
                 */
                setParent(elt: ASTNode | undefined, parent: ASTNode): void;
                /**
                 * @param {Token} token
                 * @returns {ParseRule}
                 */
                commandStart(token: Token): ParseRule;
                /**
                 * @param {Token} token
                 * @returns {ParseRule}
                 */
                featureStart(token: Token): ParseRule;
                /**
                 * @param {Token} token
                 * @returns {boolean}
                 */
                commandBoundary(token: Token): boolean;
                /**
                 * @param {Tokens} tokens
                 * @returns {(string | ASTNode)[]}
                 */
                parseStringTemplate(tokens: Tokens): (string | ASTNode)[];
                /**
                 * @param {ASTNode} commandList
                 */
                ensureTerminated(commandList: ASTNode): void;
            };
            /**
             *
             * @param {Tokens} tokens
             * @returns string
             */
            createParserContext(tokens: Tokens): string;
            /**
             * @param {Tokens} tokens
             * @param {string} [message]
             * @returns {never}
             */
            raiseParseError(tokens: Tokens, message?: string): never;
        };
        Runtime: {
            new (globalScope2: any): {
                globalScope: any;
                /**
                 * @param {HTMLElement} elt
                 * @param {string} selector
                 * @returns boolean
                 */
                matchesSelector(elt: HTMLElement, selector: string): any;
                /**
                 * @param {string} eventName
                 * @param {Object} [detail]
                 * @returns {Event}
                 */
                makeEvent(eventName: string, detail?: any): Event;
                /**
                 * @param {Element} elt
                 * @param {string} eventName
                 * @param {Object} [detail]
                 * @param {Element} [sender]
                 * @returns {boolean}
                 */
                triggerEvent(elt: Element, eventName: string, detail?: any, sender?: Element): boolean;
                /**
                 * isArrayLike returns `true` if the provided value is an array or
                 * something close enough to being an array for our purposes.
                 *
                 * @param {any} value
                 * @returns {value is Array | NodeList | HTMLCollection | FileList}
                 */
                isArrayLike(value: any): value is any[] | NodeList | HTMLCollection | FileList;
                /**
                 * isIterable returns `true` if the provided value supports the
                 * iterator protocol.
                 *
                 * @param {any} value
                 * @returns {value is Iterable}
                 */
                isIterable(value: any): value is Iterable<any>;
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
                shouldAutoIterate(value: any): value is (any[] | {
                    _css: any;
                    relativeToElement: any;
                    escape: any;
                    readonly css: any;
                    readonly className: any;
                    readonly id: any;
                    contains(elt: any): boolean;
                    readonly length: number;
                    selectMatches(): NodeListOf<any>;
                    [Symbol.iterator](): any;
                });
                /**
                 * forEach executes the provided `func` on every item in the `value` array.
                 * if `value` is a single item (and not an array) then `func` is simply called
                 * once.  If `value` is null, then no further actions are taken.
                 *
                 * @template T
                 * @param {T | Iterable<T>} value
                 * @param {(item: T) => void} func
                 */
                forEach<T>(value: T | Iterable<T>, func: (item: T) => void): void;
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
                implicitLoop<T>(value: {
                    _css: any;
                    relativeToElement: any;
                    escape: any;
                    readonly css: any;
                    readonly className: any;
                    readonly id: any;
                    contains(elt: any): boolean;
                    readonly length: number;
                    selectMatches(): NodeListOf<any>;
                    [Symbol.iterator](): any;
                } | T | T[], func: (item: T) => void): void;
                wrapArrays(args: any): any[];
                unwrapAsyncs(values: any): void;
                /**
                 * @param {ASTNode} command
                 * @param {Context} ctx
                 */
                unifiedExec(command: ASTNode, ctx: {
                    meta: {
                        runtime: any;
                        owner: any;
                        feature: any;
                        iterators: {};
                        ctx: /*elided*/ any;
                    };
                    locals: {
                        cookies: {};
                    };
                    me: any;
                    event: any;
                    target: any;
                    detail: any;
                    sender: any;
                    body: HTMLElement;
                }): void;
                /**
                * @param {*} parseElement
                * @param {Context} ctx
                * @param {Boolean} [shortCircuitOnValue]
                * @returns {*}
                */
                unifiedEval(parseElement: any, ctx: {
                    meta: {
                        runtime: any;
                        owner: any;
                        feature: any;
                        iterators: {};
                        ctx: /*elided*/ any;
                    };
                    locals: {
                        cookies: {};
                    };
                    me: any;
                    event: any;
                    target: any;
                    detail: any;
                    sender: any;
                    body: HTMLElement;
                }, shortCircuitOnValue?: boolean): any;
                /**
                * getAttributes returns the attribute name(s) to use when
                * locating hyperscript scripts in a DOM element.  If no value
                * has been configured, it defaults to config.attributes
                * @returns string[]
                */
                getScriptAttributes(): string[];
                _scriptAttrs: string[];
                /**
                * @param {Element} elt
                * @returns {string | null}
                */
                getScript(elt: Element): string | null;
                /**
                * @param {*} elt
                * @returns {Object}
                */
                getHyperscriptFeatures(elt: any): any;
                /**
                * @param {Object} owner
                * @param {Context} ctx
                */
                addFeatures(owner: any, ctx: {
                    meta: {
                        runtime: any;
                        owner: any;
                        feature: any;
                        iterators: {};
                        ctx: /*elided*/ any;
                    };
                    locals: {
                        cookies: {};
                    };
                    me: any;
                    event: any;
                    target: any;
                    detail: any;
                    sender: any;
                    body: HTMLElement;
                }): void;
                /**
                * @param {*} owner
                * @param {*} feature
                * @param {*} hyperscriptTarget
                * @param {*} event
                * @returns {Context}
                */
                makeContext(owner: any, feature: any, hyperscriptTarget: any, event: any): {
                    meta: {
                        runtime: any;
                        owner: any;
                        feature: any;
                        iterators: {};
                        ctx: /*elided*/ any;
                    };
                    locals: {
                        cookies: {};
                    };
                    me: any;
                    event: any;
                    target: any;
                    detail: any;
                    sender: any;
                    body: HTMLElement;
                };
                /**
                * @returns string
                */
                getScriptSelector(): string;
                /**
                * @param {any} value
                * @param {string} type
                * @returns {any}
                */
                convertValue(value: any, type: string): any;
                /**
                 *
                 * @param {ASTNode} elt
                 * @param {Context} ctx
                 * @returns {any}
                 */
                evaluateNoPromise(elt: ASTNode, ctx: {
                    meta: {
                        runtime: any;
                        owner: any;
                        feature: any;
                        iterators: {};
                        ctx: /*elided*/ any;
                    };
                    locals: {
                        cookies: {};
                    };
                    me: any;
                    event: any;
                    target: any;
                    detail: any;
                    sender: any;
                    body: HTMLElement;
                }): any;
                /**
                * @param {Element} elt
                * @returns {Object}
                */
                getInternalData(elt: Element): any;
                /**
                * @param {any} value
                * @param {string} typeString
                * @param {boolean} [nullOk]
                * @returns {boolean}
                */
                typeCheck(value: any, typeString: string, nullOk?: boolean): boolean;
                getElementScope(context2: any): any;
                /**
                * @param {string} str
                * @returns {boolean}
                */
                isReservedWord(str: string): boolean;
                /**
                * @param {any} context
                * @returns {boolean}
                */
                isHyperscriptContext(context2: any): boolean;
                /**
                * @param {string} str
                * @param {Context} context
                * @returns {any}
                */
                resolveSymbol(str: string, context2: any, type: any): any;
                setSymbol(str: any, context2: any, type: any, value: any): void;
                /**
                * @param {ASTNode} command
                * @param {Context} context
                * @returns {undefined | ASTNode}
                */
                findNext(command: ASTNode, context2: any): undefined | ASTNode;
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
                flatGet(root: {
                    [x: string]: any;
                }, property: string, getter: (root: {
                    [x: string]: any;
                }, property: string) => any): any;
                resolveProperty(root: any, property: any): any;
                resolveAttribute(root: any, property: any): any;
                /**
                 *
                 * @param {Object<string, any>} root
                 * @param {string} property
                 * @returns {string}
                 */
                resolveStyle(root: {
                    [x: string]: any;
                }, property: string): string;
                /**
                 *
                 * @param {Object<string, any>} root
                 * @param {string} property
                 * @returns {string}
                 */
                resolveComputedStyle(root: {
                    [x: string]: any;
                }, property: string): string;
                /**
                * @param {Element} elt
                * @param {string[]} nameSpace
                * @param {string} name
                * @param {any} value
                */
                assignToNamespace(elt: Element, nameSpace: string[], name: string, value: any): void;
                getHyperTrace(ctx: any, thrown: any): any;
                registerHyperTrace(ctx: any, thrown: any): void;
                /**
                * @param {string} str
                * @returns {string}
                */
                escapeSelector(str: string): string;
                /**
                * @param {any} value
                * @param {*} elt
                */
                nullCheck(value: any, elt: any): void;
                /**
                * @param {any} value
                * @returns {boolean}
                */
                isEmpty(value: any): boolean;
                /**
                * @param {any} value
                * @returns {boolean}
                */
                doesExist(value: any): boolean;
                /**
                * @param {Node} node
                * @returns {Document|ShadowRoot}
                */
                getRootNode(node: Node): Document | ShadowRoot;
                /**
                 *
                 * @param {Element} elt
                 * @param {ASTNode} onFeature
                 * @returns {EventQueue}
                 *
                 * @typedef {{queue:Array, executing:boolean}} EventQueue
                 */
                getEventQueueFor(elt: Element, onFeature: ASTNode): {
                    queue: any[];
                    executing: boolean;
                };
                beepValueToConsole(element: any, expression: any, value: any): void;
            };
        };
    };
    ElementCollection: {
        new (css: any, relativeToElement: any, escape: any): {
            _css: any;
            relativeToElement: any;
            escape: any;
            readonly css: any;
            readonly className: any;
            readonly id: any;
            contains(elt: any): boolean;
            readonly length: number;
            selectMatches(): NodeListOf<any>;
            [Symbol.iterator](): any;
        };
        _runtime: {
            globalScope: any;
            /**
             * @param {HTMLElement} elt
             * @param {string} selector
             * @returns boolean
             */
            matchesSelector(elt: HTMLElement, selector: string): any;
            /**
             * @param {string} eventName
             * @param {Object} [detail]
             * @returns {Event}
             */
            makeEvent(eventName: string, detail?: any): Event;
            /**
             * @param {Element} elt
             * @param {string} eventName
             * @param {Object} [detail]
             * @param {Element} [sender]
             * @returns {boolean}
             */
            triggerEvent(elt: Element, eventName: string, detail?: any, sender?: Element): boolean;
            /**
             * isArrayLike returns `true` if the provided value is an array or
             * something close enough to being an array for our purposes.
             *
             * @param {any} value
             * @returns {value is Array | NodeList | HTMLCollection | FileList}
             */
            isArrayLike(value: any): value is any[] | NodeList | HTMLCollection | FileList;
            /**
             * isIterable returns `true` if the provided value supports the
             * iterator protocol.
             *
             * @param {any} value
             * @returns {value is Iterable}
             */
            isIterable(value: any): value is Iterable<any>;
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
            shouldAutoIterate(value: any): value is (any[] | {
                _css: any;
                relativeToElement: any;
                escape: any;
                readonly css: any;
                readonly className: any;
                readonly id: any;
                contains(elt: any): boolean;
                readonly length: number;
                selectMatches(): NodeListOf<any>;
                [Symbol.iterator](): any;
            });
            /**
             * forEach executes the provided `func` on every item in the `value` array.
             * if `value` is a single item (and not an array) then `func` is simply called
             * once.  If `value` is null, then no further actions are taken.
             *
             * @template T
             * @param {T | Iterable<T>} value
             * @param {(item: T) => void} func
             */
            forEach<T>(value: T | Iterable<T>, func: (item: T) => void): void;
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
            implicitLoop<T>(value: {
                _css: any;
                relativeToElement: any;
                escape: any;
                readonly css: any;
                readonly className: any;
                readonly id: any;
                contains(elt: any): boolean;
                readonly length: number;
                selectMatches(): NodeListOf<any>;
                [Symbol.iterator](): any;
            } | T | T[], func: (item: T) => void): void;
            wrapArrays(args: any): any[];
            unwrapAsyncs(values: any): void;
            /**
             * @param {ASTNode} command
             * @param {Context} ctx
             */
            unifiedExec(command: ASTNode, ctx: {
                meta: {
                    runtime: any;
                    owner: any;
                    feature: any;
                    iterators: {};
                    ctx: /*elided*/ any;
                };
                locals: {
                    cookies: {};
                };
                me: any;
                event: any;
                target: any;
                detail: any;
                sender: any;
                body: HTMLElement;
            }): void;
            /**
            * @param {*} parseElement
            * @param {Context} ctx
            * @param {Boolean} [shortCircuitOnValue]
            * @returns {*}
            */
            unifiedEval(parseElement: any, ctx: {
                meta: {
                    runtime: any;
                    owner: any;
                    feature: any;
                    iterators: {};
                    ctx: /*elided*/ any;
                };
                locals: {
                    cookies: {};
                };
                me: any;
                event: any;
                target: any;
                detail: any;
                sender: any;
                body: HTMLElement;
            }, shortCircuitOnValue?: boolean): any;
            /**
            * getAttributes returns the attribute name(s) to use when
            * locating hyperscript scripts in a DOM element.  If no value
            * has been configured, it defaults to config.attributes
            * @returns string[]
            */
            getScriptAttributes(): string[];
            _scriptAttrs: string[];
            /**
            * @param {Element} elt
            * @returns {string | null}
            */
            getScript(elt: Element): string | null;
            /**
            * @param {*} elt
            * @returns {Object}
            */
            getHyperscriptFeatures(elt: any): any;
            /**
            * @param {Object} owner
            * @param {Context} ctx
            */
            addFeatures(owner: any, ctx: {
                meta: {
                    runtime: any;
                    owner: any;
                    feature: any;
                    iterators: {};
                    ctx: /*elided*/ any;
                };
                locals: {
                    cookies: {};
                };
                me: any;
                event: any;
                target: any;
                detail: any;
                sender: any;
                body: HTMLElement;
            }): void;
            /**
            * @param {*} owner
            * @param {*} feature
            * @param {*} hyperscriptTarget
            * @param {*} event
            * @returns {Context}
            */
            makeContext(owner: any, feature: any, hyperscriptTarget: any, event: any): {
                meta: {
                    runtime: any;
                    owner: any;
                    feature: any;
                    iterators: {};
                    ctx: /*elided*/ any;
                };
                locals: {
                    cookies: {};
                };
                me: any;
                event: any;
                target: any;
                detail: any;
                sender: any;
                body: HTMLElement;
            };
            /**
            * @returns string
            */
            getScriptSelector(): string;
            /**
            * @param {any} value
            * @param {string} type
            * @returns {any}
            */
            convertValue(value: any, type: string): any;
            /**
             *
             * @param {ASTNode} elt
             * @param {Context} ctx
             * @returns {any}
             */
            evaluateNoPromise(elt: ASTNode, ctx: {
                meta: {
                    runtime: any;
                    owner: any;
                    feature: any;
                    iterators: {};
                    ctx: /*elided*/ any;
                };
                locals: {
                    cookies: {};
                };
                me: any;
                event: any;
                target: any;
                detail: any;
                sender: any;
                body: HTMLElement;
            }): any;
            /**
            * @param {Element} elt
            * @returns {Object}
            */
            getInternalData(elt: Element): any;
            /**
            * @param {any} value
            * @param {string} typeString
            * @param {boolean} [nullOk]
            * @returns {boolean}
            */
            typeCheck(value: any, typeString: string, nullOk?: boolean): boolean;
            getElementScope(context2: any): any;
            /**
            * @param {string} str
            * @returns {boolean}
            */
            isReservedWord(str: string): boolean;
            /**
            * @param {any} context
            * @returns {boolean}
            */
            isHyperscriptContext(context2: any): boolean;
            /**
            * @param {string} str
            * @param {Context} context
            * @returns {any}
            */
            resolveSymbol(str: string, context2: any, type: any): any;
            setSymbol(str: any, context2: any, type: any, value: any): void;
            /**
            * @param {ASTNode} command
            * @param {Context} context
            * @returns {undefined | ASTNode}
            */
            findNext(command: ASTNode, context2: any): undefined | ASTNode;
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
            flatGet(root: {
                [x: string]: any;
            }, property: string, getter: (root: {
                [x: string]: any;
            }, property: string) => any): any;
            resolveProperty(root: any, property: any): any;
            resolveAttribute(root: any, property: any): any;
            /**
             *
             * @param {Object<string, any>} root
             * @param {string} property
             * @returns {string}
             */
            resolveStyle(root: {
                [x: string]: any;
            }, property: string): string;
            /**
             *
             * @param {Object<string, any>} root
             * @param {string} property
             * @returns {string}
             */
            resolveComputedStyle(root: {
                [x: string]: any;
            }, property: string): string;
            /**
            * @param {Element} elt
            * @param {string[]} nameSpace
            * @param {string} name
            * @param {any} value
            */
            assignToNamespace(elt: Element, nameSpace: string[], name: string, value: any): void;
            getHyperTrace(ctx: any, thrown: any): any;
            registerHyperTrace(ctx: any, thrown: any): void;
            /**
            * @param {string} str
            * @returns {string}
            */
            escapeSelector(str: string): string;
            /**
            * @param {any} value
            * @param {*} elt
            */
            nullCheck(value: any, elt: any): void;
            /**
            * @param {any} value
            * @returns {boolean}
            */
            isEmpty(value: any): boolean;
            /**
            * @param {any} value
            * @returns {boolean}
            */
            doesExist(value: any): boolean;
            /**
            * @param {Node} node
            * @returns {Document|ShadowRoot}
            */
            getRootNode(node: Node): Document | ShadowRoot;
            /**
             *
             * @param {Element} elt
             * @param {ASTNode} onFeature
             * @returns {EventQueue}
             *
             * @typedef {{queue:Array, executing:boolean}} EventQueue
             */
            getEventQueueFor(elt: Element, onFeature: ASTNode): {
                queue: any[];
                executing: boolean;
            };
            beepValueToConsole(element: any, expression: any, value: any): void;
        };
    };
    addFeature: any;
    addCommand: any;
    addLeafExpression: any;
    addIndirectExpression: any;
    evaluate: typeof evaluate;
    parse: (src: any) => ASTNode;
    process: (elt: any) => void;
    processNode: (elt: any) => void;
    version: string;
    browserInit: typeof browserInit;
};
declare function run(src: any, ctx: any): any;
declare function evaluate(src: any, ctx: any, args: any): any;
declare function browserInit(): void;
export { hyperscript_default as _hyperscript, browser_default as default };
