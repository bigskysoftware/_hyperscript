/*********************************
Interfaces

This file defines all of the interfaces and types used in Hyperscript.  
No runnable code should go here.
*/

// Function signatures for the public API
// TODO: updated "any" references with actual types
interface Hyperscript {
	lexer: Lexer
	parser: Parser
	runtime: Runtime
	evaluate: (str:string) => any
	init: (elt:Element) => void
	start: (scriptAttrs:any) => boolean
}


// Function signatures for _lexer object.
// TODO: updated "any" references with actual types
interface Lexer {
	tokenize: (string:string) => Tokens
}

interface Token {
    type: string
    value?: string
    op?: boolean
    line?: number
    col?: number
    start?: number
    end?: number
    column?: number
}

interface Tokens {
    matchAnyOpToken: any
    matchOpToken: any
    requireOpToken: any
    matchTokenType: any
    requireTokenType: any
    consumeToken: any
    matchToken: any
    requireToken: any
    list: any
    source: any
    hasMore: any
    currentToken: any
    consumeUntilWhitespace: any
}

// Function signatures for _parser object.
// TODO: updated "any" references with actual types
interface Parser {
    parseElement: (type:any, tokens?:any, root?:any) => any
    parseAnyOf: (types:any, tokens:any) => any
    parseHyperScript: (tokens:any) => any
    raiseParseError: (tokens:any, message?:string) => any
    addGrammarElement: (name:string, definition:GrammarElement) => any
    transpile: (node:any, defaultVal?:any) => string
}

interface GrammarElement {
    (parser:Parser, tokens:Tokens, root?:any): (GrammarElementResult | undefined)
}

// TODO: updated "any" references with actual types
interface GrammarElementResult {
	type: string
	target?: any
	op?: any
	symbolWrite?: boolean
	value?: any
	classRef?: any
	attributeRef?: any
	on?:any
    fields?: GrammarElementField[]
    transpile: () => (string | number | undefined)
}


interface GrammarElementField {
	name: any
	value: any
}

// Function signatures for _runtime object.  
// TODO: updated "any" references with actual types
interface Runtime {
		typeCheck: (value:any, typeString:string, nullOk:boolean) => any
		forEach: (arr:any[], func:any) => void
		evalTarget: (root:any, path:any) => any
		triggerEvent: (elt:Element, eventName:string, detail:Object) => boolean
		matchesSelector: (elt:Element, selector:string) => boolean
		getScript: (elt:Element) => (string | null)
		applyEventListeners: (hypeScript, elt:Element) => void
		setScriptAttrs: (values:string[]) => void
		initElement: (elt:Element) => any
		evaluate: (typeOrSrc:any, srcOrCtx?:any, ctxArg?:any) => any
		getScriptSelector: () => any
		ajax: (method:string, url:string, callback:any, data:any) => any
}
