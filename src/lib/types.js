/*********************************************************
 * This file defines many of the types used in hyperscript.
 * There should be NO CODE in this file, only comments
 * that are removed during the uglify/minify step.
 *********************************************************/

/**
 * TODO: description of Tokens
 * @typedef {object} Token 
 * @property {string} type
 * @property {string} [value]
 * @property {boolean} [op] // `true` if this token represents an operator
 * @property {number} [start]
 * @property {number} [end]
 * @property {number} [col]
 * @property {number} [line]
 * 
 * THIS IS A WORK IN PROGRESS.  THESE DEFINITIONS ARE NOT ACCURATE OR FINAL.
 * 
 * TOKENS *************************
 * 
 * @typedef TokensObject
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
 * @property {*} token
 * @property {*} consumeUntil
 * @property {*} consumeUntilWhitespace
 * @property {*} lastWhitespace
 * 
 * PARSER *************************
 * 
 * @typedef {(parser:any, runtime:any, tokens:TokensObject) => Feature} GrammarDefinition
 * @typedef {(parser:any, runtime:any, tokens:TokensObject) => Feature} FeatureDefinition
 * @typedef {(parser:any, runtime:any, tokens:TokensObject) => Command} CommandDefinition
 * @typedef {(parser:any, runtime:any, tokens:TokensObject) => Expression} ExpressionDefinition
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
 * @typedef {{meta: object, me: Element, event:Event, target: Element, detail: any, body: Document}} Context
 */