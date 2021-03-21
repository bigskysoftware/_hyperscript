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
 * @property {(keyword:string, definition:GrammarDefinition) => any } addFeature
 * @property {(keyword:string, definition:GrammarDefinition) => any } addCommand
 * @property {(keyword:string, definition:GrammarDefinition) => any } addLeafExpression
 * @property {(keyword:string, definition:GrammarDefinition) => any } addIndirectExpression
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
 * @property {(token:string) => undefined | Token} matchAnyToken
 * @property {(token:string) => undefined | Token} matchAnyOpToken
 * @property {(token:string) => undefined | Token} matchOpToken
 * @property {(token:string) => Token} requireOpToken
 * @property {(token:string) => undefined | Token} matchTokenType
 * @property {(token:string) => Token} requireTokenType
 * @property {() => Token} consumeToken
 * @property {(token:string) => undefined | Token} matchToken
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
 * @property {number} [start]
 * @property {number} [end]
 * @property {number} [column]
 * @property {number} [line]
 * @property {boolean} [op] // `true` if this token represents an operator
 * 
 * 
 * PARSER *************************
 * 
 * @typedef ParserObject
 * @property {*} setParent
 * @property {(type:string, tokens:TokensObject, message?:string, root?:any) => GrammarElement} requireElement
 * @property {*} parseElement
 * @property {*} featureStart
 * @property {*} commandStart
 * @property {*} commandBoundary
 * @property {(types:string[], tokens:TokensObject) => GrammarElement} parseAnyOf
 * @property {*} parseHyperScript
 * @property {*} raiseParseError
 * @property {(name:string, definition:GrammarDefinition) => void} addGrammarElement
 * @property {(name:string, definition:GrammarDefinition) => void} addCommand
 * @property {(name:string, definition:GrammarDefinition) => void} addFeature
 * @property {(name:string, definition:GrammarDefinition) => void} addLeafExpression
 * @property {(name:string, definition:GrammarDefinition) => void} addIndirectExpression
 * @property {(TokensObject) => (string | Token)[] } parseStringTemplate
 * 
 * @typedef {(parser:ParserObject, runtime:RuntimeObject, tokens:TokensObject, root:any) => GrammarElement} GrammarDefinition
 *
 * @typedef {Object} GrammarElement
 * @property {string} type
 * @property {(context:Context) => any} evaluate
 * @property {GrammarElement} [parent]
 * @property {GrammarElement} [next]
 * @property {(context:Context) => GrammarElement} [resolveNext]
 * @property {EventSource} [eventSource]
 * @property {() => void} [install]
 * @property {(context:Context) => void} [execute]
 * 
 * 
 * RUNTIME **********************
 * 
 * @typedef RuntimeObject
 * @property {(value:any, typeString:string, nullOk?:boolean) => boolean } typeCheck
 * @property {(value:any, func:(item:any) => void) => void } forEach
 * @property {(elt:HTMLElement, eventName:string, detail:{}) => boolean } triggerEvent
 * @property {(elt:HTMLElement, selector:string) => boolean } matchesSelector
 * @property {(elt:HTMLElement) => string | null } getScript
 * @property {(elt:HTMLElement) => void } processNode
 * @property {(src:string, ctx:Context) => any } evaluate
 * @property {(src:string) => GrammarElement } parse
 * @property {() => string } getScriptSelector
 * @property {(str:string, ctx:Context) => any } resolveSymbol
 * @property {(owner:*, feature:*, hyperscriptTarget:*, event:*) => Context } makeContext
 * @property {(command:GrammarElement, ctx:Context) => undefined | GrammarElement } findNext
 * @property {(parseElement:*, ctx:Context) => * } unifiedEval
 * @property {(value:any, type:string) => any } convertValue
 * @property {(command: GrammarDefinition, ctx:Context) => void } unifiedExec
 * @property {(root:Object<string,any>, property:string) => any } resolveProperty
 * @property {(namespace:string[], name:string, value:any) => void } assignToNamespace
 * @property {() => void } registerHyperTrace
 * @property {() => void } getHyperTrace
 * @property {() => void } getInternalData
 * @property {(str:string) => string } escapeSelector
 * @property {(value:any, elt:*) => void } nullCheck
 * @property {(value:any) => boolean} isEmpty
 * @property {string | null} hyperscriptUrl
 * @property {Object} HALT
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