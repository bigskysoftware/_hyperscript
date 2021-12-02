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
 * @property {(keyword:string, definition:GrammarDefinition) => void | GrammarElement } addFeature
 * @property {(keyword:string, definition:GrammarDefinition) => void | GrammarElement } addCommand
 * @property {(keyword:string, definition:GrammarDefinition) => void | GrammarElement } addLeafExpression
 * @property {(keyword:string, definition:GrammarDefinition) => void | GrammarElement } addIndirectExpression
 * @property {(str:string, ctx?:Object, args?:Object) => *} evaluate
 * @property {(str:string) => *} parse
 * @property {(elt:HTMLElement) => void} processNode
 * @property {HyperscriptConfigObject} config
 *
 * @typedef HyperscriptInternalsObject
 * @property {ParserObject} parser
 * @property {RuntimeObject} runtime
 *
 * @typedef HyperscriptConfigObject
 * @property {string} attributes
 * @property {string} defaultTransition
 * @property {HyperscriptConversionsObject} conversions
 * @property {string} [disableSelector]
 *
 * @typedef {Object<string,(val:any) => any>} HyperscriptConversionsObject
 * @property {any[(name:string, value:any) => any]} dynamicResolvers
 *
 *
 * TOKENS *************************
 *
 * @typedef {object} Token
 * @property {string} [type]
 * @property {string} [value]
 * @property {number} [start]
 * @property {number} [end]
 * @property {number} [column]
 * @property {number} [line]
 * @property {boolean} [op] `true` if this token represents an operator
 * @property {boolean} [template] `true` if this token is a template, for class refs, id refs, strings
 *
 * @typedef {Object} Tokens
 * @property {Token[]} tokens
 * @property {Token[]} consumed
 * @property {string} source
 * @property {Token} _lastConsumed
 * @property {string[]} _follows
 *
 * PARSER *************************
 *
 * @typedef ParserObject
 * @property {(elt:GrammarElement | void, parent:GrammarElement) => void} setParent
 * @property {(type:string, tokens:Tokens, message?:string, root?:any) => GrammarElement} requireElement
 * @property {(type:string, tokens:Tokens, root?:any) => GrammarElement | void} parseElement
 * @property {(token:Token) => GrammarDefinition} featureStart
 * @property {(token:Token) => GrammarDefinition} commandStart
 * @property {(token:Token) => boolean} commandBoundary
 * @property {(types:string[], tokens:Tokens) => GrammarElement} parseAnyOf
 * @property {(tokens:Tokens) => GrammarElement | void} parseHyperScript
 * @property {(name:string, definition:GrammarDefinition) => void} addGrammarElement
 * @property {(name:string, definition:GrammarDefinition) => void} addCommand
 * @property {(name:string, definition:GrammarDefinition) => void} addFeature
 * @property {(name:string, definition:GrammarDefinition) => void} addLeafExpression
 * @property {(name:string, definition:GrammarDefinition) => void} addIndirectExpression
 * @property {(tokens:Tokens) => (string | GrammarElement)[] } parseStringTemplate
 * @property {boolean} [possessivesDisabled]
 *
 *
 * @typedef {_GrammarElement} GrammarElement
 * 
 * @callback GrammarDefinition
 * @param {ParserObject} parser
 * @param {RuntimeObject} runtime
 * @param {Tokens} tokens
 * @param {*} root
 * @returns {GrammarElement | void}
 *
 * RUNTIME **********************
 *
 * @typedef RuntimeObject
 * @property {(value:any, typeString:string, nullOk?:boolean) => boolean } typeCheck
 * @property {(value:any, func:(item:any) => void) => void } forEach
 * @property {(value:any, func:(item:any) => void) => void } implicitLoop
 * @property {(elt:Element, eventName:string, detail:{}) => boolean } triggerEvent
 * @property {(elt:HTMLElement, selector:string) => boolean } matchesSelector
 * @property {(elt:HTMLElement) => string | null } getScript
 * @property {(elt:HTMLElement) => void } processNode
 * @property {(src:string, ctx?:Context) => any } evaluate
 * @property {(src:string) => GrammarElement } parse
 * @property {() => string } getScriptSelector
 * @property {(str:string, ctx:Context, type?: SymbolScope) => any } resolveSymbol
 * @property {(str:string, ctx:Context, type: SymbolScope, value: any) => void} setSymbol
 * @property {(owner:*, feature:*, hyperscriptTarget:*, event:*) => Context } makeContext
 * @property {(command:GrammarElement, ctx:Context) => GrammarElement | undefined } findNext
 * @property {(parseElement:*, ctx:Context) => * } unifiedEval
 * @property {(value:any, type:string) => any } convertValue
 * @property {(command: GrammarElement, ctx:Context) => void } unifiedExec
 * @property {(root:Object<string,any>, property:string, attribute:boolean) => any } resolveProperty
 * @property {(elt:Element, namespace:string[], name:string, value:any) => void } assignToNamespace
 * @property {(ctx: Context, thrown: any) => void } registerHyperTrace
 * @property {(ctx: Context, thrown: any) => any } getHyperTrace
 * @property {(elt:HTMLElement) => Object } getInternalData
 * @property {(str:string) => string } escapeSelector
 * @property {(value:any, elt:*) => void } nullCheck
 * @property {(value:any) => boolean} isEmpty
 * @property {(node: Node) => Document | ShadowRoot} getRootNode
 * @property {string | null} hyperscriptUrl
 * @property {Object} HALT
 *
 * @typedef {_Context} Context
 * 
 * @typedef {_ContextMetaData} ContextMetaData
 *
 * @typedef {'local'|'element'|'global'|'default'} SymbolScope
 *
 * @typedef {_ConversionMap} ConversionMap
 *
 * @typedef {(value:any) => any} ConversionFunction
 * @typedef {(conversionName:string, value:any) => any} DynamicConversionFunction
 *
 */
