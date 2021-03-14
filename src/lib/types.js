/*********************************************************
 * This file defines many of the types used in hyperscript.
 * There should be NO CODE in this file, only comments
 * that are removed during the uglify/minify step.
 *********************************************************/

/**
 * THIS IS A WORK IN PROGRESS.  THESE DEFINITIONS ARE NOT ACCURATE OR FINAL.
 * 
 * PUBLIC API
 * @typedef HyperscriptObject
 * @property {HyperscriptInternalsObject} internals
 * @property {(keyword:string, definition:FeatureDefinition) => any } addFeature
 * @property {(keyword:string, definition:CommandDefinition) => any } addCommand
 * @property {(keyword:string, definition:ExpressionDefinition) => any } addLeafExpression
 * @property {(keyword:string, definition:ExpressionDefinition) => any } addIndirectExpression
 * @property {(str:string, ctx:Context) => *} evaluate
 * @property {(str:string) => *} parse
 * @property {(elt:HTMLElement) => void} processNode
 * @property {HyperscriptConfigObject} config
 * 
 * @typedef HyperscriptInternalsObject
 * @property {*} lexer
 * @property {ParserObject} parser
 * @property {RuntimeObject} runtime
 * 
 * @typedef HyperscriptConfigObject
 * @property {string} attributes
 * @property {string} defaultTransition
 * @property {HyperscriptConversionsObject} conversions
 * 
 * @typedef {Object<string,(val:any) => any>} HyperscriptConversionsObject
 * @property {any[(name:string, value:any) => any]} dynamicResolvers
 * 
 * 
 * TOKENS *************************
 * 
 * @typedef LexerObject
 * @property {(string:string, noDollarStart?:boolean) => TokensObject} tokenize
 * @property {(tokens:Token[], consumed:Token[], source:string) => TokensObject} makeTokensObject
 * 
 * @typedef TokensObject
 * @property {(token:string) => [Token]} matchAnyToken
 * @property {(token:string) => [Token]} matchAnyOpToken
 * @property {(token:string) => [Token]} matchOpToken
 * @property {(token:string) => Token} requireOpToken
 * @property {(token:string) => [Token]} matchTokenType
 * @property {(token:string) => Token} requireTokenType
 * @property {() => Token} consumeToken
 * @property {(token:string) => [Token]} matchToken
 * @property {(token:string) => Token} requireToken
 * @property {*} list
 * @property {*} consumed
 * @property {*} source
 * @property {*} hasMore
 * @property {() => Token} currentToken
 * @property {*} lastMatch
 * @property {(n:number, dontIgnoreWhitespace?:boolean) => Token} token
 * @property {(value:string, type?:string) => Token[]} consumeUntil
 * @property {() => Token[]} consumeUntilWhitespace
 * @property {() => string} lastWhitespace
 * @property {() => string} sourceFor
 * @property {() => string} lineFor
 * 
 * @typedef {object} Token 
 * @property {string} [type]
 * @property {string} [value]
 * @property {boolean} [op] // `true` if this token represents an operator
 * @property {number} [start]
 * @property {number} [end]
 * @property {number} [col]
 * @property {number} [line]
 * 
 * 
 * PARSER *************************
 * 
 * @typedef ParserObject
 * @property {*} setParent
 * @property {*} requireElement
 * @property {*} parseElement
 * @property {*} featureStart
 * @property {*} commandStart
 * @property {*} commandBoundary
 * @property {*} parseAnyOf
 * @property {*} parseHyperScript
 * @property {*} raiseParseError
 * @property {*} addGrammarElement
 * @property {*} addCommand
 * @property {*} addFeature
 * @property {*} addLeafExpression
 * @property {*} addIndirectExpression
 * @property {*} parseStringTemplate
 * 
 * @typedef {(parser:ParserObject, runtime:RuntimeObject, tokens:TokensObject) => Feature} GrammarDefinition
 * @typedef {(parser:ParserObject, runtime:RuntimeObject, tokens:TokensObject) => Feature} FeatureDefinition
 * @typedef {(parser:ParserObject, runtime:RuntimeObject, tokens:TokensObject) => Command} CommandDefinition
 * @typedef {(parser:ParserObject, runtime:RuntimeObject, tokens:TokensObject) => Expression} ExpressionDefinition
 *
 * @typedef GrammarElement
 * @property {string} type
 * @property {string} keyword
 * @property {string} name
 * @property {EventSource} eventSource
 * @property {() => void} install
 * 
 * @typedef Feature
 * @property {string} type
 * @property {string} keyword
 * @property {string} name
 * @property {EventSource} eventSource
 * @property {() => void} install
 * 
 * @typedef Command
 * @property {string} type
 * @property {string} keyword
 * @property {string} name
 * @property {(context:Context) => any} execute
 * @property {EventSource} eventSource
 * @property {() => void} install
 * @property {Command} [parent]
 * @property {Command} [next]
 * @property {(context:Context) => Command} [resolveNext]
 * 
 * @typedef Expression
 * @property {string} type
 * @property {string} keyword
 * @property {string} name
 * @property {EventSource} eventSource
 * @property {() => void} install
 * 
 * RUNTIME **********************
 * 
 * @typedef {{}} RuntimeObject
 * 
 * @typedef {{meta: object, me: Element, event:Event, target: Element, detail: any, body: Document}} Context
 * @property {ContextMetaData} meta
 * @property {*} me
 * @property {*} event
 * @property {*} target
 * @property {*} detail
 * @property {*} body
 *
 * @typedef ContextMetaData
 * @property {ParserObject} parser
 * @property {LexerObject} lexer
 * @property {RuntimeObject} runtime
 * @property {*} owner
 * @property {*} feature
 * @property {*} iterators
 * @property {ContextMetaData} ctx
 */