///=========================================================================
/// This module provides the core runtime and grammar for hyperscript
///=========================================================================

import {getOrInitObject, mergeObjects, parseJSON, varargConstructor} from "./utils.js";
import * as lexer from "./lexer/lexer.js"

/**
 * @type {HyperscriptObject}
 */
let _hyperscript

var globalScope = globalThis;

//====================================================================
// Standard library
//====================================================================

class ElementCollection {
	constructor(css, relativeToElement) {
		this._css = css;
		this.relativeToElement = relativeToElement;
	}

	get css() {
		return _runtime.escapeSelector(this._css);
	}

	get className() {
		return this._css.substr(1);
	}

	get id() {
		return this.className();
	}

	contains(elt) {
		for (let element of this) {
			if (element.contains(elt)) {
				return true;
			}
		}
		return false;
	}

	[Symbol.iterator]() {
		return _runtime.getRootNode(this.relativeToElement)
			.querySelectorAll(this.css)
			[Symbol.iterator]();
	}
}

//====================================================================
// Parser
//====================================================================

/** @type ParserObject */
var _parser = (function () {
	/** @type {Object<string,GrammarDefinition>} */
	var GRAMMAR = {};

	/** @type {Object<string,GrammarDefinition>} */
	var COMMANDS = {};

	/** @type {Object<string,GrammarDefinition>} */
	var FEATURES = {};

	var LEAF_EXPRESSIONS = [];
	var INDIRECT_EXPRESSIONS = [];

	/**
	 * @param {*} parseElement
	 * @param {*} start
	 * @param {Tokens} tokens
	 */
	function initElt(parseElement, start, tokens) {
		parseElement.startToken = start;
		parseElement.sourceFor = lexer.sourceFor;
		parseElement.lineFor = lexer.lineFor;
		parseElement.programSource = tokens.source;
	}

	/**
	 * @param {string} type
	 * @param {Tokens} tokens
	 * @param {GrammarElement?} root
	 * @returns GrammarElement
	 */
	function parseElement(type, tokens, root = undefined) {
		var elementDefinition = GRAMMAR[type];
		if (elementDefinition) {
			var start = lexer.currentToken(tokens);
			var parseElement = elementDefinition(_parser, _runtime, tokens, root);
			if (parseElement) {
				initElt(parseElement, start, tokens);
				parseElement.endToken = parseElement.endToken || lexer.lastMatch(tokens);
				var root = parseElement.root;
				while (root != null) {
					initElt(root, start, tokens);
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
	 * @returns {GrammarElement}
	 */
	function requireElement(type, tokens, message, root) {
		var result = parseElement(type, tokens, root);
		if (!result) lexer.raiseParseError(tokens, message || "Expected " + type);
		// @ts-ignore
		return result;
	}

	/**
	 * @param {string[]} types
	 * @param {Tokens} tokens
	 * @returns {GrammarElement}
	 */
	function parseAnyOf(types, tokens) {
		for (var i = 0; i < types.length; i++) {
			var type = types[i];
			var expression = parseElement(type, tokens);
			if (expression) {
				return expression;
			}
		}
	}

	/**
	 * @param {string} name
	 * @param {GrammarDefinition} definition
	 */
	function addGrammarElement(name, definition) {
		GRAMMAR[name] = definition;
	}

	/**
	 * @param {string} keyword
	 * @param {GrammarDefinition} definition
	 */
	function addCommand(keyword, definition) {
		var commandGrammarType = keyword + "Command";
		var commandDefinitionWrapper = function (parser, runtime, tokens) {
			const commandElement = definition(parser, runtime, tokens);
			if (commandElement) {
				commandElement.type = commandGrammarType;
				commandElement.execute = function (context) {
					context.meta.command = commandElement;
					return runtime.unifiedExec(this, context);
				};
				return commandElement;
			}
		};
		GRAMMAR[commandGrammarType] = commandDefinitionWrapper;
		COMMANDS[keyword] = commandDefinitionWrapper;
	}

	/**
	 * @param {string} keyword
	 * @param {GrammarDefinition} definition
	 */
	function addFeature(keyword, definition) {
		var featureGrammarType = keyword + "Feature";

		/** @type {GrammarDefinition} */
		var featureDefinitionWrapper = function (parser, runtime, tokens) {
			var featureElement = definition(parser, runtime, tokens);
			if (featureElement) {
				featureElement.keyword = keyword;
				featureElement.type = featureGrammarType;
				return featureElement;
			}
		};
		GRAMMAR[featureGrammarType] = featureDefinitionWrapper;
		FEATURES[keyword] = featureDefinitionWrapper;
	}

	/**
	 * @param {string} name
	 * @param {GrammarDefinition} definition
	 */
	function addLeafExpression(name, definition) {
		LEAF_EXPRESSIONS.push(name);
		addGrammarElement(name, definition);
	}

	/**
	 * @param {string} name
	 * @param {GrammarDefinition} definition
	 */
	function addIndirectExpression(name, definition) {
		INDIRECT_EXPRESSIONS.push(name);
		addGrammarElement(name, definition);
	}

	/* ============================================================================================ */
	/* Core hyperscript Grammar Elements                                                            */
	/* ============================================================================================ */
	addGrammarElement("feature", function (parser, runtime, tokens) {
		if (lexer.matchOpToken(tokens, "(")) {
			var featureElement = parser.requireElement("feature", tokens);
			lexer.requireOpToken(tokens, ")");
			return featureElement;
		}

		var featureDefinition = FEATURES[lexer.currentToken(tokens).value];
		if (featureDefinition) {
			return featureDefinition(parser, runtime, tokens);
		}
	});

	addGrammarElement("command", function (parser, runtime, tokens) {
		if (lexer.matchOpToken(tokens, "(")) {
			const commandElement = parser.requireElement("command", tokens);
			lexer.requireOpToken(tokens, ")");
			return commandElement;
		}

		var commandDefinition = COMMANDS[lexer.currentToken(tokens).value];
		let commandElement;
		if (commandDefinition) {
			commandElement = commandDefinition(parser, runtime, tokens);
		} else if (lexer.currentToken(tokens).type === "IDENTIFIER" && lexer.token(tokens, 1).value === "(") {
			commandElement = parser.requireElement("pseudoCommand", tokens);
		}
		if (commandElement) {
			return parser.parseElement("indirectStatement", tokens, commandElement);
		}

		return commandElement;
	});

	addGrammarElement("commandList", function (parser, runtime, tokens) {
		var cmd = parser.parseElement("command", tokens);
		if (cmd) {
			lexer.matchToken(tokens, "then");
			const next = parser.parseElement("commandList", tokens);
			if (next) cmd.next = next;
			return cmd;
		}
	});

	addGrammarElement("leaf", function (parser, runtime, tokens) {
		var result = parseAnyOf(LEAF_EXPRESSIONS, tokens);
		// symbol is last so it doesn't consume any constants
		if (result == null) {
			return parseElement("symbol", tokens);
		}

		return result;
	});

	addGrammarElement("indirectExpression", function (parser, runtime, tokens, root) {
		for (var i = 0; i < INDIRECT_EXPRESSIONS.length; i++) {
			var indirect = INDIRECT_EXPRESSIONS[i];
			root.endToken = lexer.lastMatch(tokens);
			var result = parser.parseElement(indirect, tokens, root);
			if (result) {
				return result;
			}
		}
		return root;
	});

	addGrammarElement("indirectStatement", function (parser, runtime, tokens, root) {
		if (lexer.matchToken(tokens, "unless")) {
			root.endToken = lexer.lastMatch(tokens);
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
					return runtime.unifiedExec(this, context);
				},
			};
			root.parent = unless;
			return unless;
		}
		return root;
	});

	addGrammarElement("primaryExpression", function (parser, runtime, tokens) {
		var leaf = parser.parseElement("leaf", tokens);
		if (leaf) {
			return parser.parseElement("indirectExpression", tokens, leaf);
		}
		lexer.raiseParseError(tokens, "Unexpected value: " + lexer.currentToken(tokens).value);
	});

	/* ============================================================================================ */
	/* END Core hyperscript Grammar Elements                                                        */

	/* ============================================================================================ */



	/**
	 * @param {Tokens} tokens
	 * @returns {GrammarElement}
	 */
	function parseHyperScript(tokens) {
		var result = parseElement("hyperscript", tokens);
		if (lexer.hasMore(tokens)) lexer.raiseParseError(tokens);
		if (result) return result;
	}

	/**
	 * @param {GrammarElement} elt
	 * @param {GrammarElement} parent
	 */
	function setParent(elt, parent) {
		if (elt) {
			elt.parent = parent;
			setParent(elt.next, parent);
		}
	}

	/**
	 * @param {Token} token
	 * @returns {GrammarDefinition}
	 */
	function commandStart(token) {
		return COMMANDS[token.value];
	}

	/**
	 * @param {Token} token
	 * @returns {GrammarDefinition}
	 */
	function featureStart(token) {
		return FEATURES[token.value];
	}

	/**
	 * @param {Token} token
	 * @returns {boolean}
	 */
	function commandBoundary(token) {
		if (
			token.value == "end" ||
			token.value == "then" ||
			token.value == "else" ||
			token.value == "otherwise" ||
			token.value == ")" ||
			commandStart(token) ||
			featureStart(token) ||
			token.type == "EOF"
		) {
			return true;
		}
		return false;
	}

	/**
	 * @param {Tokens} tokens
	 * @returns {(string | GrammarElement)[]}
	 */
	function parseStringTemplate(tokens) {
		/** @type {(string | GrammarElement)[]} */
		var returnArr = [""];
		do {
			returnArr.push(lexer.lastWhitespace(tokens));
			if (lexer.currentToken(tokens).value === "$") {
				lexer.consumeToken(tokens);
				var startingBrace = lexer.matchOpToken(tokens, "{");
				returnArr.push(requireElement("expression", tokens));
				if (startingBrace) {
					lexer.requireOpToken(tokens, "}");
				}
				returnArr.push("");
			} else if (lexer.currentToken(tokens).value === "\\") {
				lexer.consumeToken(tokens); // skip next
				lexer.consumeToken(tokens);
			} else {
				var token = lexer.consumeToken(tokens);
				returnArr[returnArr.length - 1] += token ? token.value : "";
			}
		} while (lexer.hasMore(tokens));
		returnArr.push(lexer.lastWhitespace(tokens));
		return returnArr;
	}

	// parser API
	return {
		setParent: setParent,
		requireElement: requireElement,
		parseElement: parseElement,
		featureStart: featureStart,
		commandStart: commandStart,
		commandBoundary: commandBoundary,
		parseAnyOf: parseAnyOf,
		parseHyperScript: parseHyperScript,
		addGrammarElement: addGrammarElement,
		addCommand: addCommand,
		addFeature: addFeature,
		addLeafExpression: addLeafExpression,
		addIndirectExpression: addIndirectExpression,
		parseStringTemplate: parseStringTemplate,
	};
})();

//====================================================================
// Runtime
//====================================================================

var CONVERSIONS = {
	dynamicResolvers: /** @type DynamicConversionFunction[] */ [],
	String: function (val) {
		if (val.toString) {
			return val.toString();
		} else {
			return "" + val;
		}
	},
	Int: function (val) {
		return parseInt(val);
	},
	Float: function (val) {
		return parseFloat(val);
	},
	Number: function (val) {
		console.log(val);
		return Number(val);
	},
	Date: function (val) {
		return new Date(val);
	},
	Array: function (val) {
		return Array.from(val);
	},
	JSON: function (val) {
		return JSON.stringify(val);
	},
	Object: function (val) {
		if (val instanceof String) {
			val = val.toString();
		}
		if (typeof val === "string") {
			return JSON.parse(val);
		} else {
			return mergeObjects({}, val);
		}
	},
};

/********************************************
 * RUNTIME OBJECT
 ********************************************/

/** @type {RuntimeObject} */
var _runtime = (function () {
	/**
	 * @param {HTMLElement} elt
	 * @param {string} selector
	 * @returns boolean
	 */
	function matchesSelector(elt, selector) {
		// noinspection JSUnresolvedVariable
		var matchesFunction =
			// @ts-ignore
			elt.matches || elt.matchesSelector || elt.msMatchesSelector || elt.mozMatchesSelector || elt.webkitMatchesSelector || elt.oMatchesSelector;
		return matchesFunction && matchesFunction.call(elt, selector);
	}

	/**
	 * @param {string} eventName
	 * @param {Object} [detail]
	 * @returns {Event}
	 */
	function makeEvent(eventName, detail) {
		var evt;
		if (globalScope.Event && typeof globalScope.Event === "function") {
			evt = new Event(eventName, {
				bubbles: true,
				cancelable: true,
			});
			evt['detail'] = detail;
		} else {
			evt = document.createEvent("CustomEvent");
			evt.initCustomEvent(eventName, true, true, detail);
		}
		return evt;
	}

	/**
	 * @param {Element} elt
	 * @param {string} eventName
	 * @param {Object} [detail]
	 * @returns {boolean}
	 */
	function triggerEvent(elt, eventName, detail) {
		detail = detail || {};
		detail["sentBy"] = elt;
		var event = makeEvent(eventName, detail);
		var eventResult = elt.dispatchEvent(event);
		return eventResult;
	}

	/**
	 * isArrayLike returns `true` if the provided value is an array or
	 * a NodeList (which is close enough to being an array for our purposes).
	 *
	 * @param {any} value
	 * @returns {value is Array | NodeList}
	 */
	function isArrayLike(value) {
		return Array.isArray(value) || (typeof NodeList !== 'undefined' && value instanceof NodeList);
	}

	/**
	 * isIterable returns `true` if the provided value supports the
	 * iterator protocol.
	 *
	 * @param {any} value
	 * @returns {value is Iterable}
	 */
	function isIterable(value) {
		return typeof value === 'object'
			&& Symbol.iterator in value
			&& typeof value[Symbol.iterator] === 'function';
	}

	/**
	 * shouldAutoIterate returns `true` if the provided value
	 * should be implicitly iterated over when accessing properties,
	 * and as the target of some commands.
	 *
	 * Currently, this is when the value is an {ElementCollection}
	 * or {isArrayLike} returns true.
	 *
	 * @param {any} value
	 * @returns {value is any[] | NodeList | ElementCollection}
	 */
	function shouldAutoIterate(value) {
		return value instanceof ElementCollection || isArrayLike(value);
	}

	/**
	 * forEach executes the provided `func` on every item in the `value` array.
	 * if `value` is a single item (and not an array) then `func` is simply called
	 * once.  If `value` is null, then no further actions are taken.
	 *
	 * @template T
	 * @param {T | Iterable<T>} value
	 * @param {(item: T) => void} func
	 */
	function forEach(value, func) {
		if (value == null) {
			// do nothing
		} else if (isIterable(value)) {
			for (const nth of value) {
				func(nth);
			}
		} else if (isArrayLike(value)) {
			for (var i = 0; i < value.length; i++) {
				func(value[i]);
			}
		} else {
			func(value);
		}
	}

	/**
	 * implicitLoop executes the provided `func` on:
	 * - every item of {value}, if {value} should be auto-iterated
	 *   (see {shouldAutoIterate})
	 * - {value} otherwise
	 *
	 * @template T
	 * @param {NodeList | T | T[]} value
	 * @param {(item:Node | T) => void} func
	 */
	function implicitLoop(value, func) {
		if (shouldAutoIterate(value)) {
			for (const x of value) func(x);
		} else {
			func(value);
		}
	}

	var ARRAY_SENTINEL = { array_sentinel: true };

	function linearize(args) {
		var arr = [];
		for (var i = 0; i < args.length; i++) {
			var arg = args[i];
			if (Array.isArray(arg)) {
				arr.push(ARRAY_SENTINEL);
				for (var j = 0; j < arg.length; j++) {
					arr.push(arg[j]);
				}
				arr.push(ARRAY_SENTINEL);
			} else {
				arr.push(arg);
			}
		}
		return arr;
	}

	function delinearize(values) {
		var arr = [];
		for (var i = 0; i < values.length; i++) {
			var value = values[i];
			if (value === ARRAY_SENTINEL) {
				value = values[++i];
				var valueArray = [];
				arr.push(valueArray);
				while (value !== ARRAY_SENTINEL) {
					valueArray.push(value);
					value = values[++i];
				}
			} else {
				arr.push(value);
			}
		}
		return arr;
	}

	function unwrapAsyncs(values) {
		for (var i = 0; i < values.length; i++) {
			var value = values[i];
			if (value.asyncWrapper) {
				values[i] = value.value;
			}
			if (Array.isArray(value)) {
				for (var j = 0; j < value.length; j++) {
					var valueElement = value[j];
					if (valueElement.asyncWrapper) {
						value[j] = valueElement.value;
					}
				}
			}
		}
	}

	var HALT = {};

	/**
	 * @param {GrammarElement} command
	 * @param {Context} ctx
	 */
	function unifiedExec(command, ctx) {
		while (true) {
			try {
				var next = unifiedEval(command, ctx);
			} catch (e) {
				_runtime.registerHyperTrace(ctx, e);
				if (ctx.meta.errorHandler && !ctx.meta.handlingError) {
					ctx.meta.handlingError = true;
					ctx[ctx.meta.errorSymmbol] = e;
					command = ctx.meta.errorHandler;
					continue;
				} else if (ctx.meta.reject) {
					ctx.meta.reject(e);
					next = HALT;
				} else {
					throw e;
				}
			}
			if (next == null) {
				console.error(command, " did not return a next element to execute! context: ", ctx);
				return;
			} else if (next.then) {
				next.then(function (resolvedNext) {
					unifiedExec(resolvedNext, ctx);
				}).catch(function (reason) {
					_runtime.registerHyperTrace(ctx, reason);
					if (ctx.meta.errorHandler && !ctx.meta.handlingError) {
						ctx.meta.handlingError = true;
						ctx[ctx.meta.errorSymmbol] = reason;
						unifiedExec(ctx.meta.errorHandler, ctx);
					} else if (ctx.meta.reject) {
						ctx.meta.reject(reason);
					} else {
						throw reason;
					}
				});
				return;
			} else if (next === HALT) {
				// done
				return;
			} else {
				command = next; // move to the next command
			}
		}
	}

	/**
	* @param {*} parseElement
	* @param {Context} ctx
	* @returns {*}
	*/
	function unifiedEval(parseElement, ctx) {
		/** @type any[] */
		var args = [ctx];
		var async = false;
		var wrappedAsyncs = false;

		if (parseElement.args) {
			for (var i = 0; i < parseElement.args.length; i++) {
				var argument = parseElement.args[i];
				if (argument == null) {
					args.push(null);
				} else if (Array.isArray(argument)) {
					var arr = [];
					for (var j = 0; j < argument.length; j++) {
						var element = argument[j];
						var value = element ? element.evaluate(ctx) : null; // OK
						if (value) {
							if (value.then) {
								async = true;
							} else if (value.asyncWrapper) {
								wrappedAsyncs = true;
							}
						}
						arr.push(value);
					}
					args.push(arr);
				} else if (argument.evaluate) {
					var value = argument.evaluate(ctx); // OK
					if (value) {
						if (value.then) {
							async = true;
						} else if (value.asyncWrapper) {
							wrappedAsyncs = true;
						}
					}
					args.push(value);
				} else {
					args.push(argument);
				}
			}
		}
		if (async) {
			return new Promise(function (resolve, reject) {
				var linearized = linearize(args);
				Promise.all(linearized)
					.then(function (values) {
						values = delinearize(values);
						if (wrappedAsyncs) {
							unwrapAsyncs(values);
						}
						try {
							var apply = parseElement.op.apply(parseElement, values);
							resolve(apply);
						} catch (e) {
							reject(e);
						}
					})
					.catch(function (reason) {
						if (ctx.meta.errorHandler && !ctx.meta.handlingError) {
							ctx.meta.handlingError = true;
							ctx[ctx.meta.errorSymmbol] = reason;
							unifiedExec(ctx.meta.errorHandler, ctx);
						} else if (ctx.meta.reject) {
							ctx.meta.reject(reason);
						} else {
							// TODO: no meta context to reject with, trigger event?
						}
					});
			});
		} else {
			if (wrappedAsyncs) {
				unwrapAsyncs(args);
			}
			return parseElement.op.apply(parseElement, args);
		}
	}

	let _scriptAttrs = null;

	/**
	* getAttributes returns the attribute name(s) to use when
	* locating hyperscript scripts in a DOM element.  If no value
	* has been configured, it defaults to _hyperscript.config.attributes
	* @returns string[]
	*/
	function getScriptAttributes() {
		if (_scriptAttrs == null) {
			_scriptAttrs = _hyperscript.config.attributes.replace(/ /g, "").split(",");
		}
		return _scriptAttrs;
	}

	/**
	* @param {Element} elt
	* @returns {string | null}
	*/
	function getScript(elt) {
		for (var i = 0; i < getScriptAttributes().length; i++) {
			var scriptAttribute = getScriptAttributes()[i];
			if (elt.hasAttribute && elt.hasAttribute(scriptAttribute)) {
				return elt.getAttribute(scriptAttribute);
			}
		}
		if (elt instanceof HTMLScriptElement && elt.type === "text/hyperscript") {
			return elt.innerText;
		}
		return null;
	}

	var hyperscriptFeaturesMap = new WeakMap

	/**
	* @param {*} elt
	* @returns {Object}
	*/
	function getHyperscriptFeatures(elt) {
		var hyperscriptFeatures = hyperscriptFeaturesMap.get(elt);
		if (typeof hyperscriptFeatures === 'undefined') {
			hyperscriptFeaturesMap.set(elt, hyperscriptFeatures = {});
		}
		return hyperscriptFeatures;
	}

	/**
	* @param {Object} owner
	* @param {Context} ctx
	*/
	function addFeatures(owner, ctx) {
		if (owner) {
			mergeObjects(ctx, getHyperscriptFeatures(owner));
			addFeatures(owner.parentElement, ctx);
		}
	}

	/**
	* @param {*} owner
	* @param {*} feature
	* @param {*} hyperscriptTarget
	* @param {*} event
	* @returns {Context}
	*/
	function makeContext(owner, feature, hyperscriptTarget, event) {
		/** @type {Context} */
		var ctx = {
			meta: {
				parser: _parser,
				runtime: _runtime,
				owner: owner,
				feature: feature,
				iterators: {},
			},
			me: hyperscriptTarget,
			event: event,
			target: event ? event.target : null,
			detail: event ? event.detail : null,
			body: "document" in globalScope ? document.body : null,
		};
		ctx.meta.ctx = ctx;
		addFeatures(owner, ctx);
		return ctx;
	}

	/**
	* @returns string
	*/
	function getScriptSelector() {
		return getScriptAttributes()
			.map(function (attribute) {
				return "[" + attribute + "]";
			})
			.join(", ");
	}

	/**
	* @param {any} value
	* @param {string} type
	* @returns {any}
	*/
	function convertValue(value, type) {
		var dynamicResolvers = CONVERSIONS.dynamicResolvers;
		for (var i = 0; i < dynamicResolvers.length; i++) {
			var dynamicResolver = dynamicResolvers[i];
			var converted = dynamicResolver(type, value);
			if (converted !== undefined) {
				return converted;
			}
		}

		if (value == null) {
			return null;
		}
		var converter = CONVERSIONS[type];
		if (converter) {
			return converter(value);
		}

		throw "Unknown conversion : " + type;
	}

	// TODO: There do not seem to be any references to this function.
	// Is it still in use, or can it be removed?
	function isType(o, type) {
		return Object.prototype.toString.call(o) === "[object " + type + "]";
	}

	/**
	* @param {string} src
	* @returns {GrammarElement}
	*/
	function parse(src) {
		var tokens = lexer.tokenize(src);
		if (_parser.commandStart(lexer.currentToken(tokens))) {
			var commandList = _parser.requireElement("commandList", tokens);
			var last = commandList;
			while (last.next) {
				last = last.next;
			}
			last.next = {
				op: function () {
					return HALT;
				},
			};
			return commandList;
		} else if (_parser.featureStart(lexer.currentToken(tokens))) {
			var hyperscript = _parser.requireElement("hyperscript", tokens);
			return hyperscript;
		} else {
			var expression = _parser.requireElement("expression", tokens);
			return expression;
		}
	}

	function evaluateNoPromise(elt, ctx) {
		let result = elt.evaluate(ctx);
		if (result.next) {
			throw new Error(elt.sourceFor() + " returned a Promise in a context that they are not allowed.");
		}
		return result;
	}

	/**
	* @param {string} src
	* @param {Context} [ctx]
	* @param {Object} [args]
	* @returns {any}
	*/
	function evaluate(src, ctx, args) {
		class HyperscriptModule extends EventTarget {
			constructor(mod) {
				super();
				this.module = mod;
			}
			toString() {
				return this.module.id;
			}
		}

		var body = 'document' in globalScope
			? globalScope.document.body
			: new HyperscriptModule(args && args.module);
		ctx = mergeObjects(makeContext(body, null, body, null), ctx || {});
		var element = parse(src);
		if (element.execute) {
			element.execute(ctx);
			return ctx.result;
		} else if (element.apply) {
			element.apply(body, body, args);
			return getHyperscriptFeatures(body);
		} else {
			return element.evaluate(ctx);
		}

		function makeModule() {
			return {}
		}
	}

	/**
	* @param {HTMLElement} elt
	*/
	function processNode(elt) {
		var selector = _runtime.getScriptSelector();
		if (matchesSelector(elt, selector)) {
			initElement(elt, elt);
		}
		if (elt instanceof HTMLScriptElement && elt.type === "text/hyperscript") {
			initElement(elt, document.body);
		}
		if (elt.querySelectorAll) {
			forEach(elt.querySelectorAll(selector + ", [type='text/hyperscript']"), function (elt) {
				initElement(elt, elt instanceof HTMLScriptElement && elt.type === "text/hyperscript" ? document.body : elt);
			});
		}
	}

	/**
	* @param {Element} elt
	* @param {Element} [target]
	*/
	function initElement(elt, target) {
		if (elt.closest && elt.closest(_hyperscript.config.disableSelector)) {
			return;
		}
		var internalData = getInternalData(elt);
		if (!internalData.initialized) {
			var src = getScript(elt);
			if (src) {
				try {
					internalData.initialized = true;
					internalData.script = src;
					var tokens = lexer.tokenize(src);
					var hyperScript = _parser.parseHyperScript(tokens);
					if (!hyperScript) return;
					hyperScript.apply(target || elt, elt);
					setTimeout(function () {
						triggerEvent(target || elt, "load", {
							hyperscript: true,
						});
					}, 1);
				} catch (e) {
					_runtime.triggerEvent(elt, "exception", {
						error: e,
					});
					console.error(
						"hyperscript errors were found on the following element:",
						elt,
						"\n\n",
						e.message,
						e.stack
					);
				}
			}
		}
	}

	var internalDataMap = new WeakMap

	/**
	* @param {Element} elt
	* @returns {Object}
	*/
	function getInternalData(elt) {
		var internalData = internalDataMap.get(elt);
		if (typeof internalData === 'undefined') {
			internalDataMap.set(elt, internalData = {});
		}
		return internalData;
	}

	/**
	* @param {any} value
	* @param {string} typeString
	* @param {boolean} [nullOk]
	* @returns {boolean}
	*/
	function typeCheck(value, typeString, nullOk) {
		if (value == null && nullOk) {
			return true;
		}
		var typeName = Object.prototype.toString.call(value).slice(8, -1);
		return typeName === typeString;
	}

	function getElementScope(context) {
		var elt = context.meta && context.meta.owner;
		if (elt) {
			var internalData = getInternalData(elt);
			var scopeName = "elementScope";
			if (context.meta.feature && context.meta.feature.behavior) {
				scopeName = context.meta.feature.behavior + "Scope";
			}
			var elementScope = getOrInitObject(internalData, scopeName);
			return elementScope;
		} else {
			return {}; // no element, return empty scope
		}
	}

	/**
	* @param {string} str
	* @param {Context} context
	* @returns {any}
	*/
	function resolveSymbol(str, context, type) {
		if (str === "me" || str === "my" || str === "I") {
			return context["me"];
		}
		if (str === "it" || str === "its") {
			return context["result"];
		}
		if (str === "you" || str === "your" || str === "yourself") {
			return context["beingTold"];
		} else {
			if (type === "global") {
				return globalScope[str];
			} else if (type === "element") {
				var elementScope = getElementScope(context);
				return elementScope[str];
			} else if (type === "local") {
				return context[str];
			} else {
				// meta scope (used for event conditionals)
				if (context.meta && context.meta.context) {
					var fromMetaContext = context.meta.context[str];
					if (typeof fromMetaContext !== "undefined") {
						return fromMetaContext;
					}
				}
				// local scope
				var fromContext = context[str];
				if (typeof fromContext !== "undefined") {
					return fromContext;
				} else {
					// element scope
					var elementScope = getElementScope(context);
					fromContext = elementScope[str];
					if (typeof fromContext !== "undefined") {
						return fromContext;
					} else {
						// global scope
						return globalScope[str];
					}
				}
			}
		}
	}

	function setSymbol(str, context, type, value) {
		if (type === "global") {
			globalScope[str] = value;
		} else if (type === "element") {
			var elementScope = getElementScope(context);
			elementScope[str] = value;
		} else if (type === "local") {
			context[str] = value;
		} else {
			// local scope
			var fromContext = context[str];
			if (typeof fromContext !== "undefined") {
				context[str] = value;
			} else {
				// element scope
				var elementScope = getElementScope(context);
				fromContext = elementScope[str];
				if (typeof fromContext !== "undefined") {
					elementScope[str] = value;
				} else {
					context[str] = value;
				}
			}
		}
	}

	/**
	* @param {GrammarElement} command
	* @param {Context} context
	* @returns {undefined | GrammarElement}
	*/
	function findNext(command, context) {
		if (command) {
			if (command.resolveNext) {
				return command.resolveNext(context);
			} else if (command.next) {
				return command.next;
			} else {
				return findNext(command.parent, context);
			}
		}
	}

	/**
	* @param {Object<string,any>} root
	* @param {string} property
	* @param {boolean} attribute
	* @returns {any}
	*/
	function resolveProperty(root, property, attribute) {
		if (root != null) {
			var val = attribute && root.getAttribute ? root.getAttribute(property) : root[property];
			if (typeof val !== "undefined") {
				return val;
			}

			if (shouldAutoIterate(root)) {
				// flat map
				var result = [];
				for (var component of root) {
					var componentValue = attribute ? component.getAttribute(property) : component[property];
					if (componentValue) {
						result.push(componentValue);
					}
				}
				return result;
			}
		}
	}

	/**
	* @param {Element} elt
	* @param {string[]} nameSpace
	* @param {string} name
	* @param {any} value
	*/
	function assignToNamespace(elt, nameSpace, name, value) {
		let root
		if (typeof document !== "undefined" && elt === document.body) {
			root = globalScope;
		} else {
			root = getHyperscriptFeatures(elt);
		}
		while (nameSpace.length > 0) {
			var propertyName = nameSpace.shift();
			var newRoot = root[propertyName];
			if (newRoot == null) {
				newRoot = {};
				root[propertyName] = newRoot;
			}
			root = newRoot;
		}

		root[name] = value;
	}

	function getHyperTrace(ctx, thrown) {
		var trace = [];
		var root = ctx;
		while (root.meta.caller) {
			root = root.meta.caller;
		}
		if (root.meta.traceMap) {
			return root.meta.traceMap.get(thrown, trace);
		}
	}

	function registerHyperTrace(ctx, thrown) {
		var trace = [];
		var root = null;
		while (ctx != null) {
			trace.push(ctx);
			root = ctx;
			ctx = ctx.meta.caller;
		}
		if (root.meta.traceMap == null) {
			root.meta.traceMap = new Map(); // TODO - WeakMap?
		}
		if (!root.meta.traceMap.get(thrown)) {
			var traceEntry = {
				trace: trace,
				print: function (logger) {
					logger = logger || console.error;
					logger("hypertrace /// ");
					var maxLen = 0;
					for (var i = 0; i < trace.length; i++) {
						maxLen = Math.max(maxLen, trace[i].meta.feature.displayName.length);
					}
					for (var i = 0; i < trace.length; i++) {
						var traceElt = trace[i];
						logger(
							"  ->",
							traceElt.meta.feature.displayName.padEnd(maxLen + 2),
							"-",
							traceElt.meta.owner
						);
					}
				},
			};
			root.meta.traceMap.set(thrown, traceEntry);
		}
	}

	/**
	* @param {string} str
	* @returns {string}
	*/
	function escapeSelector(str) {
		return str.replace(/:/g, function (str) {
			return "\\" + str;
		});
	}

	/**
	* @param {any} value
	* @param {*} elt
	*/
	function nullCheck(value, elt) {
		if (value == null) {
			throw new Error(elt.sourceFor() + " is null");
		}
	}

	/**
	* @param {any} value
	* @returns {boolean}
	*/
	function isEmpty(value) {
		return value == undefined || value.length === 0;
	}

	/**
	* @param {Node} node
	* @returns {Document|ShadowRoot}
	*/
	function getRootNode(node) {
		var rv = node.getRootNode();
		if (rv instanceof Document || rv instanceof ShadowRoot) return rv;
		else return document;
	}

	/** @type string | null */
	// @ts-ignore
	var hyperscriptUrl = "document" in globalScope ? import.meta.url : null;

	/** @type {RuntimeObject} */
	return {
		typeCheck,
		forEach,
		implicitLoop,
		triggerEvent,
		matchesSelector,
		getScript,
		processNode,
		evaluate,
		evaluateNoPromise,
		parse,
		getScriptSelector,
		resolveSymbol,
		setSymbol,
		makeContext,
		findNext,
		unifiedEval,
		convertValue,
		unifiedExec,
		resolveProperty,
		assignToNamespace,
		registerHyperTrace,
		getHyperTrace,
		getInternalData,
		getHyperscriptFeatures,
		escapeSelector,
		nullCheck,
		isEmpty,
		getRootNode,
		hyperscriptUrl,
		HALT,
	};
})();

//====================================================================
// Grammar
//====================================================================
{
	_parser.addLeafExpression("parenthesized", function (parser, _runtime, tokens) {
		if (lexer.matchOpToken(tokens, "(")) {
			var follows = lexer.clearFollows(tokens);
			try {
				var expr = parser.requireElement("expression", tokens);
			} finally {
				lexer.restoreFollows(tokens, follows);
			}
			lexer.requireOpToken(tokens, ")");
			return expr;
		}
	});

	_parser.addLeafExpression("string", function (parser, runtime, tokens) {
		var stringToken = lexer.matchTokenType(tokens, "STRING");
		if (!stringToken) return;
		var rawValue = stringToken.value;
		/** @type {any[]} */
		var args;
		if (stringToken.template) {
			var innerTokens = lexer.tokenize(rawValue, true);
			args = parser.parseStringTemplate(innerTokens);
		} else {
			args = [];
		}
		return {
			type: "string",
			token: stringToken,
			args: args,
			op: function (context) {
				var returnStr = "";
				for (var i = 1; i < arguments.length; i++) {
					var val = arguments[i];
					if (val !== undefined) {
						returnStr += val;
					}
				}
				return returnStr;
			},
			evaluate: function (context) {
				if (args.length === 0) {
					return rawValue;
				} else {
					return runtime.unifiedEval(this, context);
				}
			},
		};
	});

	_parser.addGrammarElement("nakedString", function (parser, runtime, tokens) {
		if (lexer.hasMore(tokens)) {
			var tokenArr = lexer.consumeUntilWhitespace(tokens);
			lexer.matchTokenType(tokens, "WHITESPACE");
			return {
				type: "nakedString",
				tokens: tokenArr,
				evaluate: function (context) {
					return tokenArr
						.map(function (t) {
							return t.value;
						})
						.join("");
				},
			};
		}
	});

	_parser.addLeafExpression("number", function (parser, runtime, tokens) {
		var number = lexer.matchTokenType(tokens, "NUMBER");
		if (!number) return;
		var numberToken = number;
		var value = parseFloat(number.value);
		return {
			type: "number",
			value: value,
			numberToken: numberToken,
			evaluate: function () {
				return value;
			},
		};
	});

	_parser.addLeafExpression("idRef", function (parser, runtime, tokens) {
		var elementId = lexer.matchTokenType(tokens, "ID_REF");
		if (!elementId) return;
		// TODO - unify these two expression types
		if (elementId.template) {
			var templateValue = elementId.value.substr(2, elementId.value.length - 2);
			var innerTokens = lexer.tokenize(templateValue);
			var innerExpression = parser.requireElement("expression", innerTokens);
			return {
				type: "idRefTemplate",
				args: [innerExpression],
				op: function (context, arg) {
					return runtime.getRootNode(context.me).getElementById(arg);
				},
				evaluate: function (context) {
					return runtime.unifiedEval(this, context);
				},
			};
		} else {
			const value = elementId.value.substr(1);
			return {
				type: "idRef",
				css: elementId.value,
				value: value,
				evaluate: function (context) {
					return (
						runtime.getRootNode(context.me).getElementById(value)
					);
				},
			};
		}
	});

	_parser.addLeafExpression("classRef", function (parser, runtime, tokens) {
		var classRef = lexer.matchTokenType(tokens, "CLASS_REF");

		if (!classRef) return;

		// TODO - unify these two expression types
		if (classRef.template) {
			var templateValue = classRef.value.substr(2, classRef.value.length - 2);
			var innerTokens = lexer.tokenize(templateValue);
			var innerExpression = parser.requireElement("expression", innerTokens);
			return {
				type: "classRefTemplate",
				args: [innerExpression],
				op: function (context, arg) {
					return new ElementCollection("." + arg, context.me)
				},
				evaluate: function (context) {
					return runtime.unifiedEval(this, context);
				},
			};
		} else {
			const css = classRef.value;
			return {
				type: "classRef",
				css: css,
				evaluate: function (context) {
					return new ElementCollection(css, context.me)
				},
			};
		}
	});

	class TemplatedQueryElementCollection extends ElementCollection {
		constructor(css, relativeToElement, templateParts) {
			super(css, relativeToElement);
			this.templateParts = templateParts;
			this.elements = templateParts.filter(elt => elt instanceof Element);
		}

		get css() {
			let rv = "", i = 0
			for (const val of this.templateParts) {
				if (val instanceof Element) {
					rv += "[data-hs-query-id='" + i++ + "']";
				} else rv += val;
			}
			return rv;
		}

		[Symbol.iterator]() {
			this.elements.forEach((el, i) => el.dataset.hsQueryId = i);
			const rv = super[Symbol.iterator]();
			this.elements.forEach(el => el.removeAttribute('data-hs-query-id'));
			return rv;
		}
	}

	_parser.addLeafExpression("queryRef", function (parser, runtime, tokens) {
		var queryStart = lexer.matchOpToken(tokens, "<");
		if (!queryStart) return;
		var queryTokens = lexer.consumeUntil(tokens, "/");
		lexer.requireOpToken(tokens, "/");
		lexer.requireOpToken(tokens, ">");
		var queryValue = queryTokens
			.map(function (t) {
				if (t.type === "STRING") {
					return '"' + t.value + '"';
				} else {
					return t.value;
				}
			})
			.join("");

		if (queryValue.indexOf("$") >= 0) {
			var template = true;
			var innerTokens = lexer.tokenize(queryValue, true);
			var args = parser.parseStringTemplate(innerTokens);
		}

		return {
			type: "queryRef",
			css: queryValue,
			args: args,
			op: function (context, ...args) {
				if (template) {
					return new TemplatedQueryElementCollection(queryValue, context.me, args)
				} else {
					return new ElementCollection(queryValue, context.me)
				}
			},
			evaluate: function (context) {
				return runtime.unifiedEval(this, context);
			},
		};
	});

	_parser.addLeafExpression("attributeRef", function (parser, runtime, tokens) {
		var attributeRef = lexer.matchTokenType(tokens, "ATTRIBUTE_REF");
		if (!attributeRef) return;
		var outerVal = attributeRef.value;
		if (outerVal.indexOf("[") === 0) {
			var innerValue = outerVal.substring(2, outerVal.length - 1);
		} else {
			var innerValue = outerVal.substring(1);
		}
		var css = "[" + innerValue + "]";
		var split = innerValue.split("=");
		var name = split[0];
		var value = split[1];
		if (value) {
			// strip quotes
			if (value.indexOf('"') === 0) {
				value = value.substring(1, value.length - 1);
			}
		}
		return {
			type: "attributeRef",
			name: name,
			css: css,
			value: value,
			op: function (context) {
				var target = context.beingTold || context.me;
				if (target) {
					return target.getAttribute(name);
				}
			},
			evaluate: function (context) {
				return runtime.unifiedEval(this, context);
			},
		};
	});

	_parser.addGrammarElement("objectKey", function (parser, runtime, tokens) {
		var token;
		if ((token = lexer.matchTokenType(tokens, "STRING"))) {
			return {
				type: "objectKey",
				key: token.value,
				evaluate: function () {
					return token.value;
				},
			};
		} else if (lexer.matchOpToken(tokens, "[")) {
			var expr = parser.parseElement("expression", tokens);
			lexer.requireOpToken(tokens, "]");
			return {
				type: "objectKey",
				expr: expr,
				args: [expr],
				op: function (ctx, expr) {
					return expr;
				},
				evaluate: function (context) {
					return runtime.unifiedEval(this, context);
				},
			};
		} else {
			var key = "";
			do {
				token = lexer.matchTokenType(tokens, "IDENTIFIER") || lexer.matchOpToken(tokens, "-");
				if (token) key += token.value;
			} while (token);
			return {
				type: "objectKey",
				key: key,
				evaluate: function () {
					return key;
				},
			};
		}
	});

	_parser.addLeafExpression("objectLiteral", function (parser, runtime, tokens) {
		if (!lexer.matchOpToken(tokens, "{")) return;
		var keyExpressions = [];
		var valueExpressions = [];
		if (!lexer.matchOpToken(tokens, "}")) {
			do {
				var name = parser.requireElement("objectKey", tokens);
				lexer.requireOpToken(tokens, ":");
				var value = parser.requireElement("expression", tokens);
				valueExpressions.push(value);
				keyExpressions.push(name);
			} while (lexer.matchOpToken(tokens, ","));
			lexer.requireOpToken(tokens, "}");
		}
		return {
			type: "objectLiteral",
			args: [keyExpressions, valueExpressions],
			op: function (context, keys, values) {
				var returnVal = {};
				for (var i = 0; i < keys.length; i++) {
					returnVal[keys[i]] = values[i];
				}
				return returnVal;
			},
			evaluate: function (context) {
				return runtime.unifiedEval(this, context);
			},
		};
	});

	_parser.addGrammarElement("nakedNamedArgumentList", function (parser, runtime, tokens) {
		var fields = [];
		var valueExpressions = [];
		if (lexer.currentToken(tokens).type === "IDENTIFIER") {
			do {
				var name = lexer.requireTokenType(tokens, "IDENTIFIER");
				lexer.requireOpToken(tokens, ":");
				var value = parser.requireElement("expression", tokens);
				valueExpressions.push(value);
				fields.push({ name: name, value: value });
			} while (lexer.matchOpToken(tokens, ","));
		}
		return {
			type: "namedArgumentList",
			fields: fields,
			args: [valueExpressions],
			op: function (context, values) {
				var returnVal = { _namedArgList_: true };
				for (var i = 0; i < values.length; i++) {
					var field = fields[i];
					returnVal[field.name.value] = values[i];
				}
				return returnVal;
			},
			evaluate: function (context) {
				return runtime.unifiedEval(this, context);
			},
		};
	});

	_parser.addGrammarElement("namedArgumentList", function (parser, runtime, tokens) {
		if (!lexer.matchOpToken(tokens, "(")) return;
		var elt = parser.requireElement("nakedNamedArgumentList", tokens);
		lexer.requireOpToken(tokens, ")");
		return elt;
	});

	_parser.addGrammarElement("symbol", function (parser, runtime, tokens) {
		/** @scope {SymbolScope} */
		var scope = "default";
		if (lexer.matchToken(tokens, "global")) {
			scope = "global";
		} else if (lexer.matchToken(tokens, "element") || lexer.matchToken(tokens, "module")) {
			scope = "element";
			// optional possessive
			if (lexer.matchOpToken(tokens, "'")) {
				lexer.requireToken(tokens, "s");
			}
		} else if (lexer.matchToken(tokens, "local")) {
			scope = "local";
		}

		// TODO better look ahead here
		let eltPrefix = lexer.matchOpToken(tokens, ":");
		let identifier = lexer.matchTokenType(tokens, "IDENTIFIER");
		if (identifier) {
			var name = identifier.value;
			if (eltPrefix) {
				name = ":" + name;
			}
			if (scope === "default") {
				if (name.indexOf("$") === 0) {
					scope = "global";
				}
				if (name.indexOf(":") === 0) {
					scope = "element";
				}
			}
			return {
				type: "symbol",
				token: identifier,
				scope: scope,
				name: name,
				evaluate: function (context) {
					return runtime.resolveSymbol(name, context, scope);
				},
			};
		}
	});

	_parser.addGrammarElement("implicitMeTarget", function (parser, runtime, tokens) {
		return {
			type: "implicitMeTarget",
			evaluate: function (context) {
				return context.beingTold || context.me;
			},
		};
	});

	_parser.addLeafExpression("boolean", function (parser, runtime, tokens) {
		var booleanLiteral = lexer.matchToken(tokens, "true") || lexer.matchToken(tokens, "false");
		if (!booleanLiteral) return;
		const value = booleanLiteral.value === "true";
		return {
			type: "boolean",
			evaluate: function (context) {
				return value;
			},
		};
	});

	_parser.addLeafExpression("null", function (parser, runtime, tokens) {
		if (lexer.matchToken(tokens, "null")) {
			return {
				type: "null",
				evaluate: function (context) {
					return null;
				},
			};
		}
	});

	_parser.addLeafExpression("arrayLiteral", function (parser, runtime, tokens) {
		if (!lexer.matchOpToken(tokens, "[")) return;
		var values = [];
		if (!lexer.matchOpToken(tokens, "]")) {
			do {
				var expr = parser.requireElement("expression", tokens);
				values.push(expr);
			} while (lexer.matchOpToken(tokens, ","));
			lexer.requireOpToken(tokens, "]");
		}
		return {
			type: "arrayLiteral",
			values: values,
			args: [values],
			op: function (context, values) {
				return values;
			},
			evaluate: function (context) {
				return runtime.unifiedEval(this, context);
			},
		};
	});

	_parser.addLeafExpression("blockLiteral", function (parser, runtime, tokens) {
		if (!lexer.matchOpToken(tokens, "\\")) return;
		var args = [];
		var arg1 = lexer.matchTokenType(tokens, "IDENTIFIER");
		if (arg1) {
			args.push(arg1);
			while (lexer.matchOpToken(tokens, ",")) {
				args.push(lexer.requireTokenType(tokens, "IDENTIFIER"));
			}
		}
		// TODO compound op token
		lexer.requireOpToken(tokens, "-");
		lexer.requireOpToken(tokens, ">");
		var expr = parser.requireElement("expression", tokens);
		return {
			type: "blockLiteral",
			args: args,
			expr: expr,
			evaluate: function (ctx) {
				var returnFunc = function () {
					//TODO - push scope
					for (var i = 0; i < args.length; i++) {
						ctx[args[i].value] = arguments[i];
					}
					return expr.evaluate(ctx); //OK
				};
				return returnFunc;
			},
		};
	});

	_parser.addGrammarElement("timeExpression", function (parser, runtime, tokens) {
		var time = parser.requireElement("expression", tokens);
		var factor = 1;
		if (lexer.matchToken(tokens, "s") || lexer.matchToken(tokens, "seconds")) {
			factor = 1000;
		} else if (lexer.matchToken(tokens, "ms") || lexer.matchToken(tokens, "milliseconds")) {
			// do nothing
		}
		return {
			type: "timeExpression",
			time: time,
			factor: factor,
			args: [time],
			op: function (_context, val) {
				return val * factor;
			},
			evaluate: function (context) {
				return runtime.unifiedEval(this, context);
			},
		};
	});

	_parser.addIndirectExpression("propertyAccess", function (parser, runtime, tokens, root) {
		if (!lexer.matchOpToken(tokens, ".")) return;
		var prop = lexer.requireTokenType(tokens, "IDENTIFIER");
		var propertyAccess = {
			type: "propertyAccess",
			root: root,
			prop: prop,
			args: [root],
			op: function (_context, rootVal) {
				var value = runtime.resolveProperty(rootVal, prop.value, false);
				return value;
			},
			evaluate: function (context) {
				return runtime.unifiedEval(this, context);
			},
		};
		return parser.parseElement("indirectExpression", tokens, propertyAccess);
	});

	_parser.addIndirectExpression("of", function (parser, runtime, tokens, root) {
		if (!lexer.matchToken(tokens, "of")) return;
		var newRoot = parser.requireElement("expression", tokens);
		// find the urroot
		var childOfUrRoot = null;
		var urRoot = root;
		while (urRoot.root) {
			childOfUrRoot = urRoot;
			urRoot = urRoot.root;
		}
		if (urRoot.type !== "symbol" && urRoot.type !== "attributeRef") {
			lexer.raiseParseError(tokens, "Cannot take a property of a non-symbol: " + urRoot.type);
		}
		var attribute = urRoot.type === "attributeRef";
		var prop = urRoot.name;
		var propertyAccess = {
			type: "ofExpression",
			prop: urRoot.token,
			root: newRoot,
			attribute: attribute,
			expression: root,
			args: [newRoot],
			op: function (context, rootVal) {
				return runtime.resolveProperty(rootVal, prop, attribute);
			},
			evaluate: function (context) {
				return runtime.unifiedEval(this, context);
			},
		};

		if (urRoot.type === "attributeRef") {
			propertyAccess.attribute = urRoot;
		}
		if (childOfUrRoot) {
			childOfUrRoot.root = propertyAccess;
			childOfUrRoot.args = [propertyAccess];
		} else {
			root = propertyAccess;
		}

		return parser.parseElement("indirectExpression", tokens, root);
	});

	_parser.addIndirectExpression("possessive", function (parser, runtime, tokens, root) {
		if (parser.possessivesDisabled) {
			return;
		}
		var apostrophe = lexer.matchOpToken(tokens, "'");
		if (
			apostrophe ||
			(root.type === "symbol" &&
				(root.name === "my" || root.name === "its" || root.name === "your") &&
				lexer.currentToken(tokens).type === "IDENTIFIER")
		) {
			if (apostrophe) {
				lexer.requireToken(tokens, "s");
			}
			var attribute = parser.parseElement("attributeRef", tokens);
			if (attribute == null) {
				var prop = lexer.requireTokenType(tokens, "IDENTIFIER");
			}
			var propertyAccess = {
				type: "possessive",
				root: root,
				attribute: attribute,
				prop: prop,
				args: [root],
				op: function (context, rootVal) {
					if (attribute) {
						// @ts-ignore
						var value = runtime.resolveProperty(rootVal, attribute.name, true);
					} else {
						var value = runtime.resolveProperty(rootVal, prop.value, false);
					}
					return value;
				},
				evaluate: function (context) {
					return runtime.unifiedEval(this, context);
				},
			};
			return parser.parseElement("indirectExpression", tokens, propertyAccess);
		}
	});

	_parser.addIndirectExpression("inExpression", function (parser, runtime, tokens, root) {
		if (!lexer.matchToken(tokens, "in")) return;
		if ((root.type !== "idRef" && root.type === "queryRef") || root.type === "classRef") {
			var query = true;
		}
		var target = parser.requireElement("expression", tokens);
		var propertyAccess = {
			type: "inExpression",
			root: root,
			args: [query ? null : root, target],
			op: function (context, rootVal, target) {
				var returnArr = [];
				if (query) {
					runtime.forEach(target, function (targetElt) {
						var results = targetElt.querySelectorAll(root.css);
						for (var i = 0; i < results.length; i++) {
							returnArr.push(results[i]);
						}
					});
				} else {
					runtime.forEach(rootVal, function (rootElt) {
						runtime.forEach(target, function (targetElt) {
							if (rootElt === targetElt) {
								returnArr.push(rootElt);
							}
						});
					});
				}
				if (returnArr.length > 0) {
					return returnArr;
				} else {
					return null;
				}
			},
			evaluate: function (context) {
				return runtime.unifiedEval(this, context);
			},
		};
		return parser.parseElement("indirectExpression", tokens, propertyAccess);
	});

	_parser.addIndirectExpression("asExpression", function (parser, runtime, tokens, root) {
		if (!lexer.matchToken(tokens, "as")) return;
		lexer.matchToken(tokens, "a") || lexer.matchToken(tokens, "an");
		var conversion = parser.requireElement("dotOrColonPath", tokens).evaluate(); // OK No promise
		var propertyAccess = {
			type: "asExpression",
			root: root,
			args: [root],
			op: function (context, rootVal) {
				return runtime.convertValue(rootVal, conversion);
			},
			evaluate: function (context) {
				return runtime.unifiedEval(this, context);
			},
		};
		return parser.parseElement("indirectExpression", tokens, propertyAccess);
	});

	_parser.addIndirectExpression("functionCall", function (parser, runtime, tokens, root) {
		if (!lexer.matchOpToken(tokens, "(")) return;
		var args = [];
		if (!lexer.matchOpToken(tokens, ")")) {
			do {
				args.push(parser.requireElement("expression", tokens));
			} while (lexer.matchOpToken(tokens, ","));
			lexer.requireOpToken(tokens, ")");
		}

		if (root.root) {
			var functionCall = {
				type: "functionCall",
				root: root,
				argExressions: args,
				args: [root.root, args],
				op: function (context, rootRoot, args) {
					runtime.nullCheck(rootRoot, root.root);
					var func = rootRoot[root.prop.value];
					runtime.nullCheck(func, root);
					if (func.hyperfunc) {
						args.push(context);
					}
					return func.apply(rootRoot, args);
				},
				evaluate: function (context) {
					return runtime.unifiedEval(this, context);
				},
			};
		} else {
			var functionCall = {
				type: "functionCall",
				root: root,
				argExressions: args,
				args: [root, args],
				op: function (context, func, argVals) {
					runtime.nullCheck(func, root);
					if (func.hyperfunc) {
						argVals.push(context);
					}
					var apply = func.apply(null, argVals);
					return apply;
				},
				evaluate: function (context) {
					return runtime.unifiedEval(this, context);
				},
			};
		}
		return parser.parseElement("indirectExpression", tokens, functionCall);
	});

	_parser.addIndirectExpression("attributeRefAccess", function (parser, runtime, tokens, root) {
		var attribute = parser.parseElement("attributeRef", tokens);
		if (!attribute) return;
		var attributeAccess = {
			type: "attributeRefAccess",
			root: root,
			attribute: attribute,
			args: [root],
			op: function (_ctx, rootVal) {
				// @ts-ignore
				var value = runtime.resolveProperty(rootVal, attribute.name, true);
				return value;
			},
			evaluate: function (context) {
				return _runtime.unifiedEval(this, context);
			},
		};
		return attributeAccess;
	});

	_parser.addIndirectExpression("arrayIndex", function (parser, runtime, tokens, root) {
		if (!lexer.matchOpToken(tokens, "[")) return;
		var andBefore = false;
		var andAfter = false;
		var firstIndex = null;
		var secondIndex = null;

		if (lexer.matchOpToken(tokens, "..")) {
			andBefore = true;
			firstIndex = parser.requireElement("expression", tokens);
		} else {
			firstIndex = parser.requireElement("expression", tokens);

			if (lexer.matchOpToken(tokens, "..")) {
				andAfter = true;
				var current = lexer.currentToken(tokens);
				if (current.type !== "R_BRACKET") {
					secondIndex = parser.parseElement("expression", tokens);
				}
			}
		}
		lexer.requireOpToken(tokens, "]");

		var arrayIndex = {
			type: "arrayIndex",
			root: root,
			firstIndex: firstIndex,
			secondIndex: secondIndex,
			args: [root, firstIndex, secondIndex],
			op: function (_ctx, root, firstIndex, secondIndex) {
				if (andBefore) {
					return root.slice(0, firstIndex + 1); // returns all items from beginning to firstIndex (inclusive)
				} else if (andAfter) {
					if (secondIndex != null) {
						return root.slice(firstIndex, secondIndex + 1); // returns all items from firstIndex to secondIndex (inclusive)
					} else {
						return root.slice(firstIndex); // returns from firstIndex to end of array
					}
				} else {
					return root[firstIndex];
				}
			},
			evaluate: function (context) {
				return _runtime.unifiedEval(this, context);
			},
		};

		return _parser.parseElement("indirectExpression", tokens, arrayIndex);
	});

	_parser.addGrammarElement("postfixExpression", function (parser, runtime, tokens) {
		var root = parser.parseElement("primaryExpression", tokens);
		if (lexer.matchOpToken(tokens, ":")) {
			var typeName = lexer.requireTokenType(tokens, "IDENTIFIER");
			var nullOk = !lexer.matchOpToken(tokens, "!");
			return {
				type: "typeCheck",
				typeName: typeName,
				nullOk: nullOk,
				args: [root],
				op: function (context, val) {
					var passed = runtime.typeCheck(val, typeName.value, nullOk);
					if (passed) {
						return val;
					} else {
						throw new Error("Typecheck failed!  Expected: " + typeName.value);
					}
				},
				evaluate: function (context) {
					return runtime.unifiedEval(this, context);
				},
			};
		} else {
			return root;
		}
	});

	_parser.addGrammarElement("logicalNot", function (parser, runtime, tokens) {
		if (!lexer.matchToken(tokens, "not")) return;
		var root = parser.requireElement("unaryExpression", tokens);
		return {
			type: "logicalNot",
			root: root,
			args: [root],
			op: function (context, val) {
				return !val;
			},
			evaluate: function (context) {
				return runtime.unifiedEval(this, context);
			},
		};
	});

	_parser.addGrammarElement("noExpression", function (parser, runtime, tokens) {
		if (!lexer.matchToken(tokens, "no")) return;
		var root = parser.requireElement("unaryExpression", tokens);
		return {
			type: "noExpression",
			root: root,
			args: [root],
			op: function (_context, val) {
				return runtime.isEmpty(val);
			},
			evaluate: function (context) {
				return runtime.unifiedEval(this, context);
			},
		};
	});

	_parser.addGrammarElement("negativeNumber", function (parser, runtime, tokens) {
		if (!lexer.matchOpToken(tokens, "-")) return;
		var root = parser.requireElement("unaryExpression", tokens);
		return {
			type: "negativeNumber",
			root: root,
			args: [root],
			op: function (context, value) {
				return -1 * value;
			},
			evaluate: function (context) {
				return runtime.unifiedEval(this, context);
			},
		};
	});

	_parser.addGrammarElement("unaryExpression", function (parser, runtime, tokens) {
		return parser.parseAnyOf(
			["logicalNot", "relativePositionalExpression", "positionalExpression", "noExpression", "negativeNumber", "postfixExpression"],
			tokens
		);
	});

	var scanForwardQuery = function(start, root, match, wrap) {
		var results = root.querySelectorAll(match);
		for (var i = 0; i < results.length; i++) {
			var elt = results[i];
			if (elt.compareDocumentPosition(start) === Node.DOCUMENT_POSITION_PRECEDING) {
				return elt;
			}
		}
		if (wrap) {
			return results[0];
		}
	}

	var scanBackwardsQuery = function(start, root, match, wrap) {
		var results = root.querySelectorAll(match);
		for (var i = results.length - 1; i >= 0; i--) {
			var elt = results[i];
			if (elt.compareDocumentPosition(start) === Node.DOCUMENT_POSITION_FOLLOWING) {
				return elt;
			}
		}
		if (wrap) {
			return results[results.length - 1];
		}
	}

	var scanForwardArray = function(start, array, match, wrap) {
		var matches = [];
		_runtime.forEach(array, function(elt){
			if (elt.matches(match) || elt === start) {
				matches.push(elt);
			}
		})
		for (var i = 0; i < matches.length - 1; i++) {
			var elt = matches[i];
			if (elt === start) {
				return matches[i + 1];
			}
		}
		if (wrap) {
			var first = matches[0];
			if (first && first.matches(match)) {
				return first;
			}
		}
	}

	var scanBackwardsArray = function(start, array, match, wrap) {
		return scanForwardArray(start, Array.from(array).reverse(), match, wrap);
	}

	_parser.addGrammarElement("relativePositionalExpression", function (parser, runtime, tokens) {
		var op = lexer.matchAnyToken(tokens, "next", "previous");
		if (!op) return;
		if (op.value === "next") {
			var forwardSearch = true;
		}

		var thing = parser.parseElement("expression", tokens);

		if (lexer.matchToken(tokens, "from")) {
			lexer.pushFollow(tokens, "in");
			try {
				var from = parser.requireElement("expression", tokens);
			} finally {
				lexer.popFollow(tokens);
			}
		} else {
			var from = parser.requireElement("implicitMeTarget", tokens);
		}

		var inSearch = false;
		var withinElt;
		if (lexer.matchToken(tokens, "in")) {
			inSearch = true;
			var inElt = parser.requireElement("expression", tokens);
		} else if (lexer.matchToken(tokens, "within")) {
			withinElt = parser.requireElement("expression", tokens);
		} else {
			withinElt = document.body;
		}

		var wrapping = false;
		if (lexer.matchToken(tokens, "with")) {
			lexer.requireToken(tokens, "wrapping")
			wrapping = true;
		}

		return {
			type: "relativePositionalExpression",
			from: from,
			forwardSearch: forwardSearch,
			inSearch: inSearch,
			wrapping: wrapping,
			inElt: inElt,
			withinElt: withinElt,
			operator: op.value,
			args: [thing, from, inElt, withinElt],
			op: function (context, thing, from, inElt, withinElt) {

				var css = thing.css;
				if (css == null) {
					throw "Expected a CSS value";
				}

				if(inSearch) {
					if (inElt) {
						if (forwardSearch) {
							return scanForwardArray(from, inElt, css, wrapping);
						} else {
							return scanBackwardsArray(from, inElt, css, wrapping);
						}
					}
				} else {
					if (withinElt) {
						if (forwardSearch) {
							return scanForwardQuery(from, withinElt, css, wrapping);
						} else {
							return scanBackwardsQuery(from, withinElt, css, wrapping);
						}
					}
				}
			},
			evaluate: function (context) {
				return runtime.unifiedEval(this, context);
			},
		}

	});

	_parser.addGrammarElement("positionalExpression", function (parser, runtime, tokens) {
		var op = lexer.matchAnyToken(tokens, "first", "last", "random");
		if (!op) return;
		lexer.matchAnyToken(tokens, "in", "from", "of");
		var rhs = parser.requireElement("unaryExpression", tokens);
		const operator = op.value;
		return {
			type: "positionalExpression",
			rhs: rhs,
			operator: op.value,
			args: [rhs],
			op: function (context, rhsVal) {
				if (rhsVal && !Array.isArray(rhsVal)) {
					if (rhsVal.children) {
						rhsVal = rhsVal.children;
					} else {
						rhsVal = Array.from(rhsVal);
					}
				}
				if (rhsVal) {
					if (operator === "first") {
						return rhsVal[0];
					} else if (operator === "last") {
						return rhsVal[rhsVal.length - 1];
					} else if (operator === "random") {
						return rhsVal[Math.floor(Math.random() * rhsVal.length)];
					}
				}
			},
			evaluate: function (context) {
				return runtime.unifiedEval(this, context);
			},
		};
	});

	_parser.addGrammarElement("mathOperator", function (parser, runtime, tokens) {
		var expr = parser.parseElement("unaryExpression", tokens);
		var mathOp,
			initialMathOp = null;
		mathOp = lexer.matchAnyOpToken(tokens, "+", "-", "*", "/", "%");
		while (mathOp) {
			initialMathOp = initialMathOp || mathOp;
			var operator = mathOp.value;
			if (initialMathOp.value !== operator) {
				lexer.raiseParseError(tokens, "You must parenthesize math operations with different operators");
			}
			var rhs = parser.parseElement("unaryExpression", tokens);
			expr = {
				type: "mathOperator",
				lhs: expr,
				rhs: rhs,
				operator: operator,
				args: [expr, rhs],
				op: function (context, lhsVal, rhsVal) {
					if (operator === "+") {
						return lhsVal + rhsVal;
					} else if (operator === "-") {
						return lhsVal - rhsVal;
					} else if (operator === "*") {
						return lhsVal * rhsVal;
					} else if (operator === "/") {
						return lhsVal / rhsVal;
					} else if (operator === "%") {
						return lhsVal % rhsVal;
					}
				},
				evaluate: function (context) {
					return runtime.unifiedEval(this, context);
				},
			};
			mathOp = lexer.matchAnyOpToken(tokens, "+", "-", "*", "/", "%");
		}
		return expr;
	});

	_parser.addGrammarElement("mathExpression", function (parser, runtime, tokens) {
		return parser.parseAnyOf(["mathOperator", "unaryExpression"], tokens);
	});

	function sloppyContains(src, container, value){
		if (container['contains']) {
			return container.contains(value);
		} else if (container['includes']) {
			return container.includes(value);
		} else {
			throw Error("The value of " + src.sourceFor() + " does not have a contains or includes method on it");
		}
	}
	function sloppyMatches(src, target, toMatch){
		if (target['match']) {
			return !!target.match(toMatch);
		} else if (target['matches']) {
			return target.matches(toMatch);
		} else {
			throw Error("The value of " + src.sourceFor() + " does not have a match or matches method on it");
		}
	}

	_parser.addGrammarElement("comparisonOperator", function (parser, runtime, tokens) {
		var expr = parser.parseElement("mathExpression", tokens);
		var comparisonToken = lexer.matchAnyOpToken(tokens, "<", ">", "<=", ">=", "==", "===", "!=", "!==");
		var operator = comparisonToken ? comparisonToken.value : null;
		var hasRightValue = true; // By default, most comparisons require two values, but there are some exceptions.
		var typeCheck = false;

		if (operator == null) {
			if (lexer.matchToken(tokens, "is") || lexer.matchToken(tokens, "am")) {
				if (lexer.matchToken(tokens, "not")) {
					if (lexer.matchToken(tokens, "in")) {
						operator = "not in";
					} else if (lexer.matchToken(tokens, "a")) {
						operator = "not a";
						typeCheck = true;
					} else if (lexer.matchToken(tokens, "empty")) {
						operator = "not empty";
						hasRightValue = false;
					} else {
						operator = "!=";
					}
				} else if (lexer.matchToken(tokens, "in")) {
					operator = "in";
				} else if (lexer.matchToken(tokens, "a")) {
					operator = "a";
					typeCheck = true;
				} else if (lexer.matchToken(tokens, "empty")) {
					operator = "empty";
					hasRightValue = false;
				} else if (lexer.matchToken(tokens, "less")) {
					lexer.requireToken(tokens, "than");
					if (lexer.matchToken(tokens, "or")) {
						lexer.requireToken(tokens, "equal");
						lexer.requireToken(tokens, "to");
						operator = "<=";
					} else {
						operator = "<";
					}
				} else if (lexer.matchToken(tokens, "greater")) {
					lexer.requireToken(tokens, "than");
					if (lexer.matchToken(tokens, "or")) {
						lexer.requireToken(tokens, "equal");
						lexer.requireToken(tokens, "to");
						operator = ">=";
					} else {
						operator = ">";
					}
				} else {
					operator = "==";
				}
			} else if (lexer.matchToken(tokens, "matches") || lexer.matchToken(tokens, "match")) {
				operator = "match";
			} else if (lexer.matchToken(tokens, "contains") || lexer.matchToken(tokens, "contain")) {
				operator = "contain";
			} else if (lexer.matchToken(tokens, "includes") || lexer.matchToken(tokens, "include")) {
				operator = "include";
			} else if (lexer.matchToken(tokens, "do") || lexer.matchToken(tokens, "does")) {
				lexer.requireToken(tokens, "not");
				if (lexer.matchToken(tokens, "matches") || lexer.matchToken(tokens, "match")) {
					operator = "not match";
				} else if (lexer.matchToken(tokens, "contains") || lexer.matchToken(tokens, "contain")) {
					operator = "not contain";
				} else if (lexer.matchToken(tokens, "include")) {
					operator = "not include";
				} else {
					lexer.raiseParseError(tokens, "Expected matches or contains");
				}
			}
		}

		if (operator) {
			// Do not allow chained comparisons, which is dumb
			if (typeCheck) {
				var typeName = lexer.requireTokenType(tokens, "IDENTIFIER");
				var nullOk = !lexer.matchOpToken(tokens, "!");
			} else if (hasRightValue) {
				var rhs = parser.requireElement("mathExpression", tokens);
				if (operator === "match" || operator === "not match") {
					rhs = rhs.css ? rhs.css : rhs;
				}
			}
			var lhs = expr;
			expr = {
				type: "comparisonOperator",
				operator: operator,
				typeName: typeName,
				nullOk: nullOk,
				lhs: expr,
				rhs: rhs,
				args: [expr, rhs],
				op: function (context, lhsVal, rhsVal) {
					if (operator === "==") {
						return lhsVal == rhsVal;
					} else if (operator === "!=") {
						return lhsVal != rhsVal;
					}
					if (operator === "match") {
						return lhsVal != null && sloppyMatches(lhs, lhsVal, rhsVal);
					}
					if (operator === "not match") {
						return lhsVal == null || !sloppyMatches(lhs, lhsVal, rhsVal);
					}
					if (operator === "in") {
						return rhsVal != null && sloppyContains(rhs, rhsVal, lhsVal);
					}
					if (operator === "not in") {
						return rhsVal == null || !sloppyContains(rhs, rhsVal, lhsVal);
					}
					if (operator === "contain") {
						return lhsVal != null && sloppyContains(lhs, lhsVal, rhsVal);
					}
					if (operator === "not contain") {
						return lhsVal == null || !sloppyContains(lhs, lhsVal, rhsVal);
					}
					if (operator === "include") {
						return lhsVal != null && sloppyContains(lhs, lhsVal, rhsVal);
					}
					if (operator === "not include") {
						return lhsVal == null || !sloppyContains(lhs, lhsVal, rhsVal);
					}
					if (operator === "===") {
						return lhsVal === rhsVal;
					} else if (operator === "!==") {
						return lhsVal !== rhsVal;
					} else if (operator === "<") {
						return lhsVal < rhsVal;
					} else if (operator === ">") {
						return lhsVal > rhsVal;
					} else if (operator === "<=") {
						return lhsVal <= rhsVal;
					} else if (operator === ">=") {
						return lhsVal >= rhsVal;
					} else if (operator === "empty") {
						return runtime.isEmpty(lhsVal);
					} else if (operator === "not empty") {
						return !runtime.isEmpty(lhsVal);
					} else if (operator === "a") {
						return runtime.typeCheck(lhsVal, typeName.value, nullOk);
					} else if (operator === "not a") {
						return !runtime.typeCheck(lhsVal, typeName.value, nullOk);
					} else {
						throw "Unknown comparison : " + operator;
					}
				},
				evaluate: function (context) {
					return runtime.unifiedEval(this, context);
				},
			};
		}
		return expr;
	});

	_parser.addGrammarElement("comparisonExpression", function (parser, runtime, tokens) {
		return parser.parseAnyOf(["comparisonOperator", "mathExpression"], tokens);
	});

	_parser.addGrammarElement("logicalOperator", function (parser, runtime, tokens) {
		var expr = parser.parseElement("comparisonExpression", tokens);
		var logicalOp,
			initialLogicalOp = null;
		logicalOp = lexer.matchToken(tokens, "and") || lexer.matchToken(tokens, "or");
		while (logicalOp) {
			initialLogicalOp = initialLogicalOp || logicalOp;
			if (initialLogicalOp.value !== logicalOp.value) {
				lexer.raiseParseError(tokens, "You must parenthesize logical operations with different operators");
			}
			var rhs = parser.requireElement("comparisonExpression", tokens);
			const operator = logicalOp.value;
			expr = {
				type: "logicalOperator",
				operator: operator,
				lhs: expr,
				rhs: rhs,
				args: [expr, rhs],
				op: function (context, lhsVal, rhsVal) {
					if (operator === "and") {
						return lhsVal && rhsVal;
					} else {
						return lhsVal || rhsVal;
					}
				},
				evaluate: function (context) {
					return runtime.unifiedEval(this, context);
				},
			};
			logicalOp = lexer.matchToken(tokens, "and") || lexer.matchToken(tokens, "or");
		}
		return expr;
	});

	_parser.addGrammarElement("logicalExpression", function (parser, runtime, tokens) {
		return parser.parseAnyOf(["logicalOperator", "mathExpression"], tokens);
	});

	_parser.addGrammarElement("asyncExpression", function (parser, runtime, tokens) {
		if (lexer.matchToken(tokens, "async")) {
			var value = parser.requireElement("logicalExpression", tokens);
			var expr = {
				type: "asyncExpression",
				value: value,
				evaluate: function (context) {
					return {
						asyncWrapper: true,
						value: this.value.evaluate(context), //OK
					};
				},
			};
			return expr;
		} else {
			return parser.parseElement("logicalExpression", tokens);
		}
	});

	_parser.addGrammarElement("expression", function (parser, runtime, tokens) {
		lexer.matchToken(tokens, "the"); // optional the
		return parser.parseElement("asyncExpression", tokens);
	});

	_parser.addGrammarElement("assignableExpression", function (parser, runtime, tokens) {
		lexer.matchToken(tokens, "the"); // optional the

		// TODO obviously we need to generalize this as a left hand side / targetable concept
		var expr = parser.parseElement("primaryExpression", tokens);
		if (expr && (
			expr.type === "symbol" ||
			expr.type === "ofExpression" ||
			expr.type === "propertyAccess" ||
			expr.type === "attributeRefAccess" ||
			expr.type === "attributeRef" ||
			expr.type === "possessive")
		) {
			return expr;
		} else {
			lexer.raiseParseError(
				tokens,
				"A target expression must be writable.  The expression type '" + (expr && expr.type) + "' is not."
			);
		}
		return expr;
	});

	_parser.addGrammarElement("hyperscript", function (parser, runtime, tokens) {
		var features = [];

		if (lexer.hasMore(tokens)) {
			while (parser.featureStart(lexer.currentToken(tokens)) || lexer.currentToken(tokens).value === "(") {
				var feature = parser.requireElement("feature", tokens);
				features.push(feature);
				lexer.matchToken(tokens, "end"); // optional end
			}
		}
		return {
			type: "hyperscript",
			features: features,
			apply: function (target, source, args) {
				// no op
				for (const feature of features) {
					feature.install(target, source, args);
				}
			},
		};
	});

	var parseEventArgs = function (tokens) {
		var args = [];
		// handle argument list (look ahead 3)
		if (
			lexer.token(tokens, 0).value === "(" &&
			(lexer.token(tokens, 1).value === ")" || lexer.token(tokens, 2).value === "," || lexer.token(tokens, 2).value === ")")
		) {
			lexer.matchOpToken(tokens, "(");
			do {
				args.push(lexer.requireTokenType(tokens, "IDENTIFIER"));
			} while (lexer.matchOpToken(tokens, ","));
			lexer.requireOpToken(tokens, ")");
		}
		return args;
	};

	_parser.addFeature("on", function (parser, runtime, tokens) {
		if (!lexer.matchToken(tokens, "on")) return;
		var every = false;
		if (lexer.matchToken(tokens, "every")) {
			every = true;
		}
		var events = [];
		var displayName = null;
		do {
			var on = parser.requireElement("eventName", tokens, "Expected event name");

			var eventName = on.evaluate(); // OK No Promise

			if (displayName) {
				displayName = displayName + " or " + eventName;
			} else {
				displayName = "on " + eventName;
			}
			var args = parseEventArgs(tokens);

			var filter = null;
			if (lexer.matchOpToken(tokens, "[")) {
				filter = parser.requireElement("expression", tokens);
				lexer.requireOpToken(tokens, "]");
			}

			if (lexer.currentToken(tokens).type === "NUMBER") {
				var startCountToken = lexer.consumeToken(tokens);
				var startCount = parseInt(startCountToken.value);
				if (lexer.matchToken(tokens, "to")) {
					var endCountToken = lexer.consumeToken(tokens);
					var endCount = parseInt(endCountToken.value);
				} else if (lexer.matchToken(tokens, "and")) {
					var unbounded = true;
					lexer.requireToken(tokens, "on");
				}
			}

			if (eventName === "intersection") {
				var intersectionSpec = {};
				if (lexer.matchToken(tokens, "with")) {
					intersectionSpec["with"] = parser.requireElement("expression", tokens).evaluate();
				}
				if (lexer.matchToken(tokens, "having")) {
					do {
						if (lexer.matchToken(tokens, "margin")) {
							intersectionSpec["rootMargin"] = parser.requireElement("stringLike", tokens).evaluate();
						} else if (lexer.matchToken(tokens, "threshold")) {
							intersectionSpec["threshold"] = parser.requireElement("expression", tokens).evaluate();
						} else {
							lexer.raiseParseError(tokens, "Unknown intersection config specification");
						}
					} while (lexer.matchToken(tokens, "and"));
				}
			} else if (eventName === "mutation") {
				var mutationSpec = {};
				if (lexer.matchToken(tokens, "of")) {
					do {
						if (lexer.matchToken(tokens, "anything")) {
							mutationSpec["attributes"] = true;
							mutationSpec["subtree"] = true;
							mutationSpec["characterData"] = true;
							mutationSpec["childList"] = true;
						} else if (lexer.matchToken(tokens, "childList")) {
							mutationSpec["childList"] = true;
						} else if (lexer.matchToken(tokens, "attributes")) {
							mutationSpec["attributes"] = true;
							mutationSpec["attributeOldValue"] = true;
						} else if (lexer.matchToken(tokens, "subtree")) {
							mutationSpec["subtree"] = true;
						} else if (lexer.matchToken(tokens, "characterData")) {
							mutationSpec["characterData"] = true;
							mutationSpec["characterDataOldValue"] = true;
						} else if (lexer.currentToken(tokens).type === "ATTRIBUTE_REF") {
							var attribute = lexer.consumeToken(tokens);
							if (mutationSpec["attributeFilter"] == null) {
								mutationSpec["attributeFilter"] = [];
							}
							if (attribute.value.indexOf("@") == 0) {
								mutationSpec["attributeFilter"].push(attribute.value.substring(1));
							} else {
								lexer.raiseParseError(
									tokens,
									"Only shorthand attribute references are allowed here"
								);
							}
						} else {
							lexer.raiseParseError(tokens, "Unknown mutation config specification");
						}
					} while (lexer.matchToken(tokens, "or"));
				} else {
					mutationSpec["attributes"] = true;
					mutationSpec["characterData"] = true;
					mutationSpec["childList"] = true;
				}
			}

			var from = null;
			var elsewhere = false;
			if (lexer.matchToken(tokens, "from")) {
				if (lexer.matchToken(tokens, "elsewhere")) {
					elsewhere = true;
				} else {
					from = parser.parseElement("expression", tokens);
					if (!from) {
						lexer.raiseParseError(tokens, 'Expected either target value or "elsewhere".');
					}
				}
			}
			// support both "elsewhere" and "from elsewhere"
			if (from === null && elsewhere === false && lexer.matchToken(tokens, "elsewhere")) {
				elsewhere = true;
			}

			if (lexer.matchToken(tokens, "in")) {
				var inExpr = parser.parseAnyOf(["idRef", "queryRef", "classRef"], tokens);
			}

			if (lexer.matchToken(tokens, "debounced")) {
				lexer.requireToken(tokens, "at");
				var timeExpr = parser.requireElement("timeExpression", tokens);
				// @ts-ignore
				var debounceTime = timeExpr.evaluate({}); // OK No promise TODO make a literal time expr
			} else if (lexer.matchToken(tokens, "throttled")) {
				lexer.requireToken(tokens, "at");
				var timeExpr = parser.requireElement("timeExpression", tokens);
				// @ts-ignore
				var throttleTime = timeExpr.evaluate({}); // OK No promise TODO make a literal time expr
			}

			events.push({
				execCount: 0,
				every: every,
				on: eventName,
				args: args,
				filter: filter,
				from: from,
				inExpr: inExpr,
				elsewhere: elsewhere,
				startCount: startCount,
				endCount: endCount,
				unbounded: unbounded,
				debounceTime: debounceTime,
				throttleTime: throttleTime,
				mutationSpec: mutationSpec,
				intersectionSpec: intersectionSpec,
				debounced: undefined,
				lastExec: undefined,
			});
		} while (lexer.matchToken(tokens, "or"));

		var queue = [];
		var queueLast = true;
		if (!every) {
			if (lexer.matchToken(tokens, "queue")) {
				if (lexer.matchToken(tokens, "all")) {
					var queueAll = true;
					var queueLast = false;
				} else if (lexer.matchToken(tokens, "first")) {
					var queueFirst = true;
				} else if (lexer.matchToken(tokens, "none")) {
					var queueNone = true;
				} else {
					lexer.requireToken(tokens, "last");
				}
			}
		}

		var commandList = parser.parseElement("commandList", tokens);

		var implicitReturn = {
			type: "implicitReturn",
			op: function (context) {
				// automatically resolve at the end of an event handler if nothing else does
				context.meta.resolve();
				return runtime.HALT;
			},
			execute: function (ctx) {
				// do nothing
			},
		};

		if (commandList) {
			/** @type {GrammarElement} */
			var start = commandList;

			var end = start;
			while (end.next) {
				end = end.next;
			}
			end.next = implicitReturn;
		} else {
			start = implicitReturn;
		}

		var onFeature = {
			displayName: displayName,
			events: events,
			start: start,
			every: every,
			executing: false,
			execCount: 0,
			queue: queue,
			execute: function (/** @type {Context} */ ctx) {
				if (this.executing && every === false) {
					if (queueNone || (queueFirst && queue.length > 0)) {
						return;
					}
					if (queueLast) {
						onFeature.queue.length = 0;
					}
					onFeature.queue.push(ctx);
					return;
				}
				onFeature.execCount++;
				this.executing = true;
				ctx.meta.resolve = function () {
					onFeature.executing = false;
					var queued = onFeature.queue.shift();
					if (queued) {
						setTimeout(function () {
							onFeature.execute(queued);
						}, 1);
					}
				};
				ctx.meta.reject = function (err) {
					console.error(err.message ? err.message : err);
					var hypertrace = runtime.getHyperTrace(ctx, err);
					if (hypertrace) {
						hypertrace.print();
					}
					runtime.triggerEvent(ctx.me, "exception", {
						error: err,
					});
					onFeature.executing = false;
					var queued = onFeature.queue.shift();
					if (queued) {
						setTimeout(function () {
							onFeature.execute(queued);
						}, 1);
					}
				};
				start.execute(ctx);
			},
			install: function (elt, source) {
				for (const eventSpec of onFeature.events) {
					var targets;
					if (eventSpec.elsewhere) {
						targets = [document];
					} else if (eventSpec.from) {
						targets = eventSpec.from.evaluate(runtime.makeContext(elt, onFeature, elt, null));
					} else {
						targets = [elt];
					}
					runtime.forEach(targets, function (target) {
						// OK NO PROMISE

						var eventName = eventSpec.on;
						if (eventSpec.mutationSpec) {
							eventName = "hyperscript:mutation";
							const observer = new MutationObserver(function (mutationList, observer) {
								console.log(target, mutationList);
								if (!onFeature.executing) {
									_runtime.triggerEvent(target, eventName, {
										mutationList: mutationList,
										observer: observer,
									});
								}
							});
							observer.observe(target, eventSpec.mutationSpec);
						}

						if (eventSpec.intersectionSpec) {
							eventName = "hyperscript:insersection";
							const observer = new IntersectionObserver(function (entries) {
								for (const entry of entries) {
									var detail = {
										observer: observer,
									};
									detail = mergeObjects(detail, entry);
									detail["intersecting"] = entry.isIntersecting;
									_runtime.triggerEvent(target, eventName, detail);
								}
							}, eventSpec.intersectionSpec);
							observer.observe(target);
						}

						var addEventListener = target.addEventListener || target.on;
						addEventListener.call(target, eventName, function listener(evt) {
							// OK NO PROMISE
							if (typeof Node !== 'undefined' && elt instanceof Node && target !== elt && !elt.isConnected) {
								target.removeEventListener(eventName, listener);
								return;
							}

							var ctx = runtime.makeContext(elt, onFeature, elt, evt);
							if (eventSpec.elsewhere && elt.contains(evt.target)) {
								return;
							}
							if (eventSpec.from) {
								ctx.result = target;
							}

							// establish context
							for (const arg of eventSpec.args) {
								ctx[arg.value] =
									ctx.event[arg.value] || ('detail' in ctx.event ? ctx.event['detail'][arg.value] : null);
							}

							// apply filter
							if (eventSpec.filter) {
								var initialCtx = ctx.meta.context;
								ctx.meta.context = ctx.event;
								try {
									var value = eventSpec.filter.evaluate(ctx); //OK NO PROMISE
									if (value) {
										// match the javascript semantics for if statements
									} else {
										return;
									}
								} finally {
									ctx.meta.context = initialCtx;
								}
							}

							if (eventSpec.inExpr) {
								var inElement = evt.target;
								while (true) {
									if (inElement.matches && inElement.matches(eventSpec.inExpr.css)) {
										ctx.result = inElement;
										break;
									} else {
										inElement = inElement.parentElement;
										if (inElement == null) {
											return; // no match found
										}
									}
								}
							}

							// verify counts
							eventSpec.execCount++;
							if (eventSpec.startCount) {
								if (eventSpec.endCount) {
									if (
										eventSpec.execCount < eventSpec.startCount ||
										eventSpec.execCount > eventSpec.endCount
									) {
										return;
									}
								} else if (eventSpec.unbounded) {
									if (eventSpec.execCount < eventSpec.startCount) {
										return;
									}
								} else if (eventSpec.execCount !== eventSpec.startCount) {
									return;
								}
							}

							//debounce
							if (eventSpec.debounceTime) {
								if (eventSpec.debounced) {
									clearTimeout(eventSpec.debounced);
								}
								eventSpec.debounced = setTimeout(function () {
									onFeature.execute(ctx);
								}, eventSpec.debounceTime);
								return;
							}

							// throttle
							if (eventSpec.throttleTime) {
								if (
									eventSpec.lastExec &&
									Date.now() < eventSpec.lastExec + eventSpec.throttleTime
								) {
									return;
								} else {
									eventSpec.lastExec = Date.now();
								}
							}

							// apply execute
							onFeature.execute(ctx);
						});
					});
				}
			},
		};
		parser.setParent(start, onFeature);
		return onFeature;
	});

	_parser.addFeature("def", function (parser, runtime, tokens) {
		if (!lexer.matchToken(tokens, "def")) return;
		var functionName = parser.requireElement("dotOrColonPath", tokens);
		var nameVal = functionName.evaluate(); // OK
		var nameSpace = nameVal.split(".");
		var funcName = nameSpace.pop();

		var args = [];
		if (lexer.matchOpToken(tokens, "(")) {
			if (lexer.matchOpToken(tokens, ")")) {
				// emtpy args list
			} else {
				do {
					args.push(lexer.requireTokenType(tokens, "IDENTIFIER"));
				} while (lexer.matchOpToken(tokens, ","));
				lexer.requireOpToken(tokens, ")");
			}
		}

		var start = parser.requireElement("commandList", tokens);
		if (lexer.matchToken(tokens, "catch")) {
			var errorSymbol = lexer.requireTokenType(tokens, "IDENTIFIER").value;
			var errorHandler = parser.parseElement("commandList", tokens);
		}
		var functionFeature = {
			displayName:
				funcName +
				"(" +
				args
					.map(function (arg) {
						return arg.value;
					})
					.join(", ") +
				")",
			name: funcName,
			args: args,
			start: start,
			errorHandler: errorHandler,
			errorSymbol: errorSymbol,
			install: function (target, source) {
				var func = function () {
					// null, worker
					var ctx = runtime.makeContext(source, functionFeature, target, null);

					// install error handler if any
					ctx.meta.errorHandler = errorHandler;
					ctx.meta.errorSymmbol = errorSymbol;

					for (var i = 0; i < args.length; i++) {
						var name = args[i];
						var argumentVal = arguments[i];
						if (name) {
							ctx[name.value] = argumentVal;
						}
					}
					ctx.meta.caller = arguments[args.length];
					if (ctx.meta.caller) {
						ctx.meta.callingCommand = ctx.meta.caller.meta.command;
					}
					var resolve,
						reject = null;
					var promise = new Promise(function (theResolve, theReject) {
						resolve = theResolve;
						reject = theReject;
					});
					start.execute(ctx);
					if (ctx.meta.returned) {
						return ctx.meta.returnValue;
					} else {
						ctx.meta.resolve = resolve;
						ctx.meta.reject = reject;
						return promise;
					}
				};
				func.hyperfunc = true;
				func.hypername = nameVal;
				runtime.assignToNamespace(target, nameSpace, funcName, func);
			},
		};

		var implicitReturn = {
			type: "implicitReturn",
			op: function (context) {
				// automatically return at the end of the function if nothing else does
				context.meta.returned = true;
				if (context.meta.resolve) {
					context.meta.resolve();
				}
				return runtime.HALT;
			},
			execute: function (context) {
				// do nothing
			},
		};
		// terminate body
		if (start) {
			var end = start;
			while (end.next) {
				end = end.next;
			}
			end.next = implicitReturn;
		} else {
			functionFeature.start = implicitReturn;
		}

		// terminate error handler
		if (errorHandler) {
			var end = errorHandler;
			while (end.next) {
				end = end.next;
			}
			end.next = implicitReturn;
		}

		parser.setParent(start, functionFeature);
		return functionFeature;
	});

	_parser.addFeature("set", function (parser, runtime, tokens) {
		let setCmd = parser.parseElement("setCommand", tokens);

		var implicitReturn = {
			type: "implicitReturn",
			op: function (context) {
				return runtime.HALT;
			},
			execute: function (context) {
			},
		};

		if (setCmd) {
			if (setCmd.target.scope !== "element") {
				lexer.raiseParseError(tokens, "variables declared at the feature level must be element scoped.");
			}
			let setFeature = {
				start: setCmd,
				install: function (target, source) {
					setCmd && setCmd.execute(runtime.makeContext(target, setFeature, target, null));
				},
			};
			setCmd.next = implicitReturn;
			return setFeature;
		}
	});

	_parser.addFeature("init", function (parser, runtime, tokens) {
		if (!lexer.matchToken(tokens, "init")) return;

		var start = parser.parseElement("commandList", tokens);
		var initFeature = {
			start: start,
			install: function (target, source) {
				setTimeout(function () {
					start && start.execute(runtime.makeContext(target, initFeature, target, null));
				}, 0);
			},
		};

		var implicitReturn = {
			type: "implicitReturn",
			op: function (context) {
				return runtime.HALT;
			},
			execute: function (context) {
				// do nothing
			},
		};
		// terminate body
		if (start) {
			var end = start;
			while (end.next) {
				end = end.next;
			}
			end.next = implicitReturn;
		} else {
			initFeature.start = implicitReturn;
		}
		parser.setParent(start, initFeature);
		return initFeature;
	});

	_parser.addFeature("worker", function (parser, runtime, tokens) {
		if (lexer.matchToken(tokens, "worker")) {
			lexer.raiseParseError(
				tokens,
				"In order to use the 'worker' feature, include " +
					"the _hyperscript worker plugin. See " +
					"https://hyperscript.org/features/worker/ for " +
					"more info."
			);
		}
	});

	_parser.addFeature("behavior", function (parser, runtime, tokens) {
		if (!lexer.matchToken(tokens, "behavior")) return;
		var path = parser.requireElement("dotOrColonPath", tokens).evaluate();
		var nameSpace = path.split(".");
		var name = nameSpace.pop();

		var formalParams = [];
		if (lexer.matchOpToken(tokens, "(") && !lexer.matchOpToken(tokens, ")")) {
			do {
				formalParams.push(lexer.requireTokenType(tokens, "IDENTIFIER").value);
			} while (lexer.matchOpToken(tokens, ","));
			lexer.requireOpToken(tokens, ")");
		}
		var hs = parser.requireElement("hyperscript", tokens);
		for (var i = 0; i < hs.features.length; i++) {
			var feature = hs.features[i];
			feature.behavior = path;
		}

		return {
			install: function (target, source) {
				runtime.assignToNamespace(
					globalScope.document && globalScope.document.body,
					nameSpace,
					name,
					function (target, source, innerArgs) {
						var internalData = runtime.getInternalData(target);
						var elementScope = getOrInitObject(internalData, path + "Scope");
						for (var i = 0; i < formalParams.length; i++) {
							elementScope[formalParams[i]] = innerArgs[formalParams[i]];
						}
						hs.apply(target, source);
					}
				);
			},
		};
	});

	_parser.addFeature("install", function (parser, runtime, tokens) {
		if (!lexer.matchToken(tokens, "install")) return;
		var behaviorPath = parser.requireElement("dotOrColonPath", tokens).evaluate();
		var behaviorNamespace = behaviorPath.split(".");
		var args = parser.parseElement("namedArgumentList", tokens);

		var installFeature;
		return (installFeature = {
			install: function (target, source) {
				runtime.unifiedEval(
					{
						args: [args],
						op: function (ctx, args) {
							var behavior = globalScope;
							for (var i = 0; i < behaviorNamespace.length; i++) {
								behavior = behavior[behaviorNamespace[i]];
								if (typeof behavior !== "object" && typeof behavior !== "function")
									throw new Error("No such behavior defined as " + behaviorPath);
							}

							if (!(behavior instanceof Function))
								throw new Error(behaviorPath + " is not a behavior");

							behavior(target, source, args);
						},
					},
					runtime.makeContext(target, installFeature, target)
				);
			},
		});
	});

	_parser.addGrammarElement("jsBody", function (parser, runtime, tokens) {
		var jsSourceStart = lexer.currentToken(tokens).start;
		var jsLastToken = lexer.currentToken(tokens);

		var funcNames = [];
		var funcName = "";
		var expectFunctionDeclaration = false;
		while (lexer.hasMore(tokens)) {
			jsLastToken = lexer.consumeToken(tokens);
			var peek = lexer.token(tokens, 0, true);
			if (peek.type === "IDENTIFIER" && peek.value === "end") {
				break;
			}
			if (expectFunctionDeclaration) {
				if (jsLastToken.type === "IDENTIFIER" || jsLastToken.type === "NUMBER") {
					funcName += jsLastToken.value;
				} else {
					if (funcName !== "") funcNames.push(funcName);
					funcName = "";
					expectFunctionDeclaration = false;
				}
			} else if (jsLastToken.type === "IDENTIFIER" && jsLastToken.value === "function") {
				expectFunctionDeclaration = true;
			}
		}
		var jsSourceEnd = jsLastToken.end + 1;

		return {
			type: "jsBody",
			exposedFunctionNames: funcNames,
			jsSource: tokens.source.substring(jsSourceStart, jsSourceEnd),
		};
	});

	_parser.addFeature("js", function (parser, runtime, tokens) {
		if (!lexer.matchToken(tokens, "js")) return;
		var jsBody = parser.requireElement("jsBody", tokens);

		var jsSource =
			jsBody.jsSource +
			"\nreturn { " +
			jsBody.exposedFunctionNames
				.map(function (name) {
					return name + ":" + name;
				})
				.join(",") +
			" } ";
		var func = new Function(jsSource);

		return {
			jsSource: jsSource,
			function: func,
			exposedFunctionNames: jsBody.exposedFunctionNames,
			install: function () {
				mergeObjects(globalScope, func());
			},
		};
	});

	_parser.addCommand("js", function (parser, runtime, tokens) {
		if (!lexer.matchToken(tokens, "js")) return;
		// Parse inputs
		var inputs = [];
		if (lexer.matchOpToken(tokens, "(")) {
			if (lexer.matchOpToken(tokens, ")")) {
				// empty input list
			} else {
				do {
					var inp = lexer.requireTokenType(tokens, "IDENTIFIER");
					inputs.push(inp.value);
				} while (lexer.matchOpToken(tokens, ","));
				lexer.requireOpToken(tokens, ")");
			}
		}

		var jsBody = parser.requireElement("jsBody", tokens);
		lexer.matchToken(tokens, "end");

		var func = varargConstructor(Function, inputs.concat([jsBody.jsSource]));

		var command = {
			jsSource: jsBody.jsSource,
			function: func,
			inputs: inputs,
			op: function (context) {
				var args = [];
				inputs.forEach(function (input) {
					args.push(runtime.resolveSymbol(input, context, 'default'));
				});
				var result = func.apply(globalScope, args);
				if (result && typeof result.then === "function") {
					return new Promise(function (resolve) {
						result.then(function (actualResult) {
							context.result = actualResult;
							resolve(runtime.findNext(this, context));
						});
					});
				} else {
					context.result = result;
					return runtime.findNext(this, context);
				}
			},
		};
		return command;
	});

	_parser.addCommand("async", function (parser, runtime, tokens) {
		if (!lexer.matchToken(tokens, "async")) return;
		if (lexer.matchToken(tokens, "do")) {
			var body = parser.requireElement("commandList", tokens);

			// Append halt
			var end = body;
			while (end.next) end = end.next;
			end.next = runtime.HALT;

			lexer.requireToken(tokens, "end");
		} else {
			var body = parser.requireElement("command", tokens);
		}
		var command = {
			body: body,
			op: function (context) {
				setTimeout(function () {
					body.execute(context);
				});
				return runtime.findNext(this, context);
			},
		};
		return command;
	});

	_parser.addCommand("tell", function (parser, runtime, tokens) {
		var startToken = lexer.currentToken(tokens);
		if (!lexer.matchToken(tokens, "tell")) return;
		var value = parser.requireElement("expression", tokens);
		var body = parser.requireElement("commandList", tokens);
		if (lexer.hasMore(tokens) && !parser.featureStart(lexer.currentToken(tokens))) {
			lexer.requireToken(tokens, "end");
		}
		var slot = "tell_" + startToken.start;
		var tellCmd = {
			value: value,
			body: body,
			args: [value],
			resolveNext: function (context) {
				var iterator = context.meta.iterators[slot];
				if (iterator.index < iterator.value.length) {
					context.beingTold = iterator.value[iterator.index++];
					return body;
				} else {
					// restore original me
					context.beingTold = iterator.originalBeingTold;
					if (this.next) {
						return this.next;
					} else {
						return runtime.findNext(this.parent, context);
					}
				}
			},
			op: function (context, value) {
				if (value == null) {
					value = [];
				} else if (!(Array.isArray(value) || value instanceof NodeList)) {
					value = [value];
				}
				context.meta.iterators[slot] = {
					originalBeingTold: context.beingTold,
					index: 0,
					value: value,
				};
				return this.resolveNext(context);
			},
		};
		parser.setParent(body, tellCmd);
		return tellCmd;
	});

	_parser.addCommand("wait", function (parser, runtime, tokens) {
		if (!lexer.matchToken(tokens, "wait")) return;
		var command;

		// wait on event
		if (lexer.matchToken(tokens, "for")) {
			lexer.matchToken(tokens, "a"); // optional "a"
			var events = [];
			do {
				var lookahead = lexer.token(tokens, 0);
				if (lookahead.type === 'NUMBER' || lookahead.type === 'L_PAREN') {
					events.push({
						time: parser.requireElement('timeExpression', tokens).evaluate() // TODO: do we want to allow async here?
					})
				} else {
					events.push({
						name: _parser.requireElement("dotOrColonPath", tokens, "Expected event name").evaluate(),
						args: parseEventArgs(tokens),
					});
				}
			} while (lexer.matchToken(tokens, "or"));

			if (lexer.matchToken(tokens, "from")) {
				var on = parser.requireElement("expression", tokens);
			}

			// wait on event
			command = {
				event: events,
				on: on,
				args: [on],
				op: function (context, on) {
					var target = on ? on : context.me;
					if (!(target instanceof EventTarget))
						throw new Error("Not a valid event target: " + this.on.sourceFor());
					return new Promise((resolve) => {
						var resolved = false;
						for (const eventInfo of events) {
							var listener = (event) => {
								context.result = event;
								for (const arg of eventInfo.args) {
									context[arg.value] =
										event[arg.value] || (event.detail ? event.detail[arg.value] : null);
								}
								if (!resolved) {
									resolved = true;
									resolve(runtime.findNext(this, context));
								}
							};
							if (eventInfo.name) target.addEventListener(eventInfo.name, listener, { once: true });
							else if (eventInfo.time) setTimeout(listener, eventInfo.time, eventInfo.time)
						}
					});
				},
			};
			return command;
		} else {
			var time;
			if (lexer.matchToken(tokens, "a")) {
				lexer.requireToken(tokens, "tick");
				time = 0;
			} else {
				time = _parser.requireElement("timeExpression", tokens);
			}

			command = {
				type: "waitCmd",
				time: time,
				args: [time],
				op: function (context, timeValue) {
					return new Promise((resolve) => {
						setTimeout(() => {
							resolve(runtime.findNext(this, context));
						}, timeValue);
					});
				},
				execute: function (context) {
					return runtime.unifiedExec(this, context);
				},
			};
			return command;
		}
	});

	// TODO  - colon path needs to eventually become part of ruby-style symbols
	_parser.addGrammarElement("dotOrColonPath", function (parser, runtime, tokens) {
		var root = lexer.matchTokenType(tokens, "IDENTIFIER");
		if (root) {
			var path = [root.value];

			var separator = lexer.matchOpToken(tokens, ".") || lexer.matchOpToken(tokens, ":");
			if (separator) {
				do {
					path.push(lexer.requireTokenType(tokens, "IDENTIFIER").value);
				} while (lexer.matchOpToken(tokens, separator.value));
			}

			return {
				type: "dotOrColonPath",
				path: path,
				evaluate: function () {
					return path.join(separator ? separator.value : "");
				},
			};
		}
	});


	_parser.addGrammarElement("eventName", function (parser, runtime, tokens) {
		var token;
		if ((token = lexer.matchTokenType(tokens, "STRING"))) {
			return {
				evaluate: function() {
					return token.value;
				},
			};
		}

		return parser.parseElement("dotOrColonPath", tokens);
	});

	function parseSendCmd(cmdType, parser, runtime, tokens) {
		var eventName = parser.requireElement("eventName", tokens);

		var details = parser.parseElement("namedArgumentList", tokens);
		if ((cmdType === "send" && lexer.matchToken(tokens, "to")) ||
			(cmdType === "trigger" && lexer.matchToken(tokens, "on"))) {
			var to = parser.requireElement("expression", tokens);
		} else {
			var to = parser.requireElement("implicitMeTarget", tokens);
		}

		var sendCmd = {
			eventName: eventName,
			details: details,
			to: to,
			args: [to, eventName, details],
			op: function (context, to, eventName, details) {
				runtime.forEach(to, function (target) {
					runtime.triggerEvent(target, eventName, details ? details : {});
				});
				return runtime.findNext(sendCmd, context);
			},
		};
		return sendCmd;
	}

	_parser.addCommand("trigger", function (parser, runtime, tokens) {
		if (lexer.matchToken(tokens, "trigger")) {
			return parseSendCmd("trigger", parser, runtime, tokens);
		}
	});

	_parser.addCommand("send", function (parser, runtime, tokens) {
		if (lexer.matchToken(tokens, "send")) {
			return parseSendCmd("send", parser, runtime, tokens);
		}
	});

	var parseReturnFunction = function (parser, runtime, tokens, returnAValue) {
		if (returnAValue) {
			if (parser.commandBoundary(lexer.currentToken(tokens))) {
				lexer.raiseParseError(tokens, "'return' commands must return a value.  If you do not wish to return a value, use 'exit' instead.");
			} else {
				var value = parser.requireElement("expression", tokens);
			}
		}

		var returnCmd = {
			value: value,
			args: [value],
			op: function (context, value) {
				var resolve = context.meta.resolve;
				context.meta.returned = true;
				if (resolve) {
					if (value) {
						resolve(value);
					} else {
						resolve();
					}
				} else {
					context.meta.returned = true;
					context.meta.returnValue = value;
				}
				return runtime.HALT;
			},
		};
		return returnCmd;
	};

	_parser.addCommand("return", function (parser, runtime, tokens) {
		if (lexer.matchToken(tokens, "return")) {
			return parseReturnFunction(parser, runtime, tokens, true);
		}
	});

	_parser.addCommand("exit", function (parser, runtime, tokens) {
		if (lexer.matchToken(tokens, "exit")) {
			return parseReturnFunction(parser, runtime, tokens, false);
		}
	});

	_parser.addCommand("halt", function (parser, runtime, tokens) {
		if (lexer.matchToken(tokens, "halt")) {
			if (lexer.matchToken(tokens, "the")) {
				lexer.requireToken(tokens, "event");
				// optional possessive
				if (lexer.matchOpToken(tokens, "'")) {
					lexer.requireToken(tokens, "s");
				}
				var keepExecuting = true;
			}
			if (lexer.matchToken(tokens, "bubbling")) {
				var bubbling = true;
			} else if (lexer.matchToken(tokens, "default")) {
				var haltDefault = true;
			}
			var exit = parseReturnFunction(parser, runtime, tokens, false);

			var haltCmd = {
				keepExecuting: true,
				bubbling: bubbling,
				haltDefault: haltDefault,
				exit: exit,
				op: function (ctx) {
					if (ctx.event) {
						if (bubbling) {
							ctx.event.stopPropagation();
						} else if (haltDefault) {
							ctx.event.preventDefault();
						} else {
							ctx.event.stopPropagation();
							ctx.event.preventDefault();
						}
						if (keepExecuting) {
							return runtime.findNext(this, ctx);
						} else {
							return exit;
						}
					}
				},
			};
			return haltCmd;
		}
	});

	_parser.addCommand("log", function (parser, runtime, tokens) {
		if (!lexer.matchToken(tokens, "log")) return;
		var exprs = [parser.parseElement("expression", tokens)];
		while (lexer.matchOpToken(tokens, ",")) {
			exprs.push(parser.requireElement("expression", tokens));
		}
		if (lexer.matchToken(tokens, "with")) {
			var withExpr = parser.requireElement("expression", tokens);
		}
		var logCmd = {
			exprs: exprs,
			withExpr: withExpr,
			args: [withExpr, exprs],
			op: function (ctx, withExpr, values) {
				if (withExpr) {
					withExpr.apply(null, values);
				} else {
					console.log.apply(null, values);
				}
				return runtime.findNext(this, ctx);
			},
		};
		return logCmd;
	});

	_parser.addCommand("throw", function (parser, runtime, tokens) {
		if (!lexer.matchToken(tokens, "throw")) return;
		var expr = parser.requireElement("expression", tokens);
		var throwCmd = {
			expr: expr,
			args: [expr],
			op: function (ctx, expr) {
				runtime.registerHyperTrace(ctx, expr);
				var reject = ctx.meta && ctx.meta.reject;
				if (reject) {
					reject(expr);
					return runtime.HALT;
				} else {
					throw expr;
				}
			},
		};
		return throwCmd;
	});

	var parseCallOrGet = function (parser, runtime, tokens) {
		var expr = parser.requireElement("expression", tokens);
		var callCmd = {
			expr: expr,
			args: [expr],
			op: function (context, result) {
				context.result = result;
				return runtime.findNext(callCmd, context);
			},
		};
		return callCmd;
	};
	_parser.addCommand("call", function (parser, runtime, tokens) {
		if (!lexer.matchToken(tokens, "call")) return;
		var call = parseCallOrGet(parser, runtime, tokens);
		if (call.expr && call.expr.type !== "functionCall") {
			lexer.raiseParseError(tokens, "Must be a function invocation");
		}
		return call;
	});
	_parser.addCommand("get", function (parser, runtime, tokens) {
		if (lexer.matchToken(tokens, "get")) {
			return parseCallOrGet(parser, runtime, tokens);
		}
	});

	_parser.addCommand("make", function (parser, runtime, tokens) {
		if (!lexer.matchToken(tokens, "make")) return;
		lexer.matchToken(tokens, "a") || lexer.matchToken(tokens, "an");

		var expr = parser.requireElement("expression", tokens);

		var args = [];
		if (expr.type !== "queryRef" && lexer.matchToken(tokens, "from")) {
			do {
				args.push(parser.requireElement("expression", tokens));
			} while (lexer.matchOpToken(tokens, ","));
		}

		if (lexer.matchToken(tokens, "called")) {
			var name = lexer.requireTokenType(tokens, "IDENTIFIER").value;
		}

		var command;
		if (expr.type === "queryRef") {
			command = {
				op: function (ctx) {
					var match,
						tagname = "div",
						id,
						classes = [];
					var re = /(?:(^|#|\.)([^#\. ]+))/g;
					while ((match = re.exec(expr.css))) {
						if (match[1] === "") tagname = match[2].trim();
						else if (match[1] === "#") id = match[2].trim();
						else classes.push(match[2].trim());
					}

					var result = document.createElement(tagname);
					if (id !== undefined) result.id = id;
					for (var i = 0; i < classes.length; i++) {
						var cls = classes[i];
						result.classList.add(cls)
					}

					ctx.result = result;
					if (name) ctx[name] = result;

					return runtime.findNext(this, ctx);
				},
			};
			return command;
		} else {
			command = {
				args: [expr, args],
				op: function (ctx, expr, args) {
					ctx.result = varargConstructor(expr, args);
					if (name) ctx[name] = ctx.result;

					return runtime.findNext(this, ctx);
				},
			};
			return command;
		}
	});

	_parser.addGrammarElement("pseudoCommand", function (parser, runtime, tokens) {

		try {
			var expr = parser.requireElement("primaryExpression", tokens);
		} finally {
			lexer.popFollow(tokens);
		}
		if (expr.type !== "functionCall" && expr.root.type !== "symbol" && expr.root.root != null) {
			lexer.raiseParseError(tokens, "Implicit function calls must start with a simple function");
		}

		var functionName = expr.root.name;

		if (lexer.matchAnyToken(tokens, "the", "to", "on", "with", "into", "from", "at")) {
			var target = parser.requireElement("expression", tokens);
		} else if (lexer.matchToken(tokens, "me")) {
			var target = parser.requireElement("implicitMeTarget", tokens);
		}
		var functionArgs = expr.argExressions;

		/** @type {GrammarElement} */
		var pseudoCommand = {
			type: "pseudoCommand",
			expr: expr,
			args: [target, functionArgs],
			op: function (context, target, args) {
				if (target) {
					var func = target[functionName];
				} else {
					var func = runtime.resolveSymbol(functionName, context);
				}
				if (func.hyperfunc) {
					args.push(context);
				}
				var result = func.apply(target, args);
				context.result = result;
				return runtime.findNext(pseudoCommand, context);
			},
			execute: function (context) {
				return runtime.unifiedExec(this, context);
			},
		};

		return pseudoCommand;
	});

	/**
	* @param {ParserObject} parser
	* @param {RuntimeObject} runtime
	* @param {Tokens} tokens
	* @param {*} target
	* @param {*} value
	* @returns
	*/
	var makeSetter = function (parser, runtime, tokens, target, value) {
		var symbolWrite = target.type === "symbol";
		var attributeWrite = target.type === "attributeRef";
		if (!attributeWrite && !symbolWrite && target.root == null) {
			lexer.raiseParseError(tokens, "Can only put directly into symbols, not references");
		}

		var root = null;
		var prop = null;
		if (symbolWrite) {
			// root is null
		} else if (attributeWrite) {
			root = parser.requireElement("implicitMeTarget", tokens);
			var attribute = target;
		} else {
			prop = target.prop ? target.prop.value : null;
			var attribute = target.attribute;
			root = target.root;
		}

		/** @type {GrammarElement} */
		var setCmd = {
			target: target,
			symbolWrite: symbolWrite,
			value: value,
			args: [root, value],
			op: function (context, root, valueToSet) {
				if (symbolWrite) {
					runtime.setSymbol(target.name, context, target.scope, valueToSet);
				} else {
					runtime.implicitLoop(root, function (elt) {
						if (attribute) {
							if (valueToSet == null) {
								elt.removeAttribute(attribute.name);
							} else {
								elt.setAttribute(attribute.name, valueToSet);
							}
						} else {
							elt[prop] = valueToSet;
						}
					});
				}
				return runtime.findNext(this, context);
			},
		};
		return setCmd;
	};

	_parser.addCommand("default", function (parser, runtime, tokens) {
		if (!lexer.matchToken(tokens, "default")) return;
		var target = parser.requireElement("assignableExpression", tokens);
		lexer.requireToken(tokens, "to");

		var value = parser.requireElement("expression", tokens);

		/** @type {GrammarElement} */
		var setter = makeSetter(parser, runtime, tokens, target, value);
		var defaultCmd = {
			target: target,
			value: value,
			setter: setter,
			args: [target],
			op: function (context, target) {
				if (target) {
					return runtime.findNext(this, context);
				} else {
					return setter;
				}
			},
		};
		setter.parent = defaultCmd;
		return defaultCmd;
	});

	_parser.addCommand("set", function (parser, runtime, tokens) {
		if (!lexer.matchToken(tokens, "set")) return;
		if (lexer.currentToken(tokens).type === "L_BRACE") {
			var obj = parser.requireElement("objectLiteral", tokens);
			lexer.requireToken(tokens, "on");
			var target = parser.requireElement("expression", tokens);

			var command = {
				objectLiteral: obj,
				target: target,
				args: [obj, target],
				op: function (ctx, obj, target) {
					mergeObjects(target, obj);
					return runtime.findNext(this, ctx);
				},
			};
			return command;
		}

		try {
			lexer.pushFollow(tokens, "to");
			var target = parser.requireElement("assignableExpression", tokens);
		} finally {
			lexer.popFollow(tokens);
		}
		lexer.requireToken(tokens, "to");
		var value = parser.requireElement("expression", tokens);
		return makeSetter(parser, runtime, tokens, target, value);
	});

	_parser.addCommand("if", function (parser, runtime, tokens) {
		if (!lexer.matchToken(tokens, "if")) return;
		var expr = parser.requireElement("expression", tokens);
		lexer.matchToken(tokens, "then"); // optional 'then'
		var trueBranch = parser.parseElement("commandList", tokens);
		if (lexer.matchToken(tokens, "else") || lexer.matchToken(tokens, "otherwise")) {
			var falseBranch = parser.parseElement("commandList", tokens);
		}
		if (lexer.hasMore(tokens)) {
			lexer.requireToken(tokens, "end");
		}

		/** @type {GrammarElement} */
		var ifCmd = {
			expr: expr,
			trueBranch: trueBranch,
			falseBranch: falseBranch,
			args: [expr],
			op: function (context, exprValue) {
				if (exprValue) {
					return trueBranch;
				} else if (falseBranch) {
					return falseBranch;
				} else {
					return runtime.findNext(this, context);
				}
			},
		};
		parser.setParent(trueBranch, ifCmd);
		parser.setParent(falseBranch, ifCmd);
		return ifCmd;
	});

	var parseRepeatExpression = function (parser, tokens, runtime, startedWithForToken) {
		var innerStartToken = lexer.currentToken(tokens);
		var identifier;
		if (lexer.matchToken(tokens, "for") || startedWithForToken) {
			var identifierToken = lexer.requireTokenType(tokens, "IDENTIFIER");
			identifier = identifierToken.value;
			lexer.requireToken(tokens, "in");
			var expression = parser.requireElement("expression", tokens);
		} else if (lexer.matchToken(tokens, "in")) {
			identifier = "it";
			var expression = parser.requireElement("expression", tokens);
		} else if (lexer.matchToken(tokens, "while")) {
			var whileExpr = parser.requireElement("expression", tokens);
		} else if (lexer.matchToken(tokens, "until")) {
			var isUntil = true;
			if (lexer.matchToken(tokens, "event")) {
				var evt = _parser.requireElement("dotOrColonPath", tokens, "Expected event name");
				if (lexer.matchToken(tokens, "from")) {
					var on = parser.requireElement("expression", tokens);
				}
			} else {
				var whileExpr = parser.requireElement("expression", tokens);
			}
		} else if (lexer.matchTokenType(tokens, "NUMBER")) {
			var times = parseFloat(innerStartToken.value);
			lexer.requireToken(tokens, "times");
		} else {
			lexer.matchToken(tokens, "forever"); // consume optional forever
			var forever = true;
		}

		if (lexer.matchToken(tokens, "index")) {
			var identifierToken = lexer.requireTokenType(tokens, "IDENTIFIER");
			var indexIdentifier = identifierToken.value;
		}

		var loop = parser.parseElement("commandList", tokens);
		if (loop && evt) {
			// if this is an event based loop, wait a tick at the end of the loop so that
			// events have a chance to trigger in the loop condition o_O)))
			var last = loop;
			while (last.next) {
				last = last.next;
			}
			var waitATick = {
				type: "waitATick",
				op: function () {
					return new Promise(function (resolve) {
						setTimeout(function () {
							resolve(runtime.findNext(waitATick));
						}, 0);
					});
				},
			};
			last.next = waitATick;
		}
		if (lexer.hasMore(tokens)) {
			lexer.requireToken(tokens, "end");
		}

		if (identifier == null) {
			identifier = "_implicit_repeat_" + innerStartToken.start;
			var slot = identifier;
		} else {
			var slot = identifier + "_" + innerStartToken.start;
		}

		var repeatCmd = {
			identifier: identifier,
			indexIdentifier: indexIdentifier,
			slot: slot,
			expression: expression,
			forever: forever,
			times: times,
			until: isUntil,
			event: evt,
			on: on,
			whileExpr: whileExpr,
			resolveNext: function () {
				return this;
			},
			loop: loop,
			args: [whileExpr],
			op: function (context, whileValue) {
				var iteratorInfo = context.meta.iterators[slot];
				var keepLooping = false;
				var loopVal = null;
				if (this.forever) {
					keepLooping = true;
				} else if (this.until) {
					if (evt) {
						keepLooping = context.meta.iterators[slot].eventFired === false;
					} else {
						keepLooping = whileValue !== true;
					}
				} else if (whileExpr) {
					keepLooping = whileValue;
				} else if (times) {
					keepLooping = iteratorInfo.index < this.times;
				} else {
					var nextValFromIterator = iteratorInfo.iterator.next();
					keepLooping = !nextValFromIterator.done;
					loopVal = nextValFromIterator.value;
				}

				if (keepLooping) {
					if (iteratorInfo.value) {
						context.result = context[identifier] = loopVal;
					} else {
						context.result = iteratorInfo.index;
					}
					if (indexIdentifier) {
						context[indexIdentifier] = iteratorInfo.index;
					}
					iteratorInfo.index++;
					return loop;
				} else {
					context.meta.iterators[slot] = null;
					return runtime.findNext(this.parent, context);
				}
			},
		};
		parser.setParent(loop, repeatCmd);
		var repeatInit = {
			name: "repeatInit",
			args: [expression, evt, on],
			op: function (context, value, event, on) {
				var iteratorInfo = {
					index: 0,
					value: value,
					eventFired: false,
				};
				context.meta.iterators[slot] = iteratorInfo;
				if (value && value[Symbol.iterator]) {
					iteratorInfo.iterator = value[Symbol.iterator]();
				}
				if (evt) {
					var target = on || context.me;
					target.addEventListener(
						event,
						function (e) {
							context.meta.iterators[slot].eventFired = true;
						},
						{ once: true }
					);
				}
				return repeatCmd; // continue to loop
			},
			execute: function (context) {
				return runtime.unifiedExec(this, context);
			},
		};
		parser.setParent(repeatCmd, repeatInit);
		return repeatInit;
	};

	_parser.addCommand("repeat", function (parser, runtime, tokens) {
		if (lexer.matchToken(tokens, "repeat")) {
			return parseRepeatExpression(parser, tokens, runtime, false);
		}
	});

	_parser.addCommand("for", function (parser, runtime, tokens) {
		if (lexer.matchToken(tokens, "for")) {
			return parseRepeatExpression(parser, tokens, runtime, true);
		}
	});

  _parser.addCommand("continue", function (parser, runtime, tokens) {

    if (!lexer.matchToken(tokens, "continue")) return;

    var command = {
      op: function (context) {

        // scan for the closest repeat statement
        for (var parent = this.parent ; true ; parent = parent.parent) {

          if (parent == undefined) {
            lexer.raiseParseError(tokens, "Command `continue` cannot be used outside of a `repeat` loop.")
          }
          if (parent.loop != undefined) {
            return parent.resolveNext(context)
          }
        }
      }
    };
    return command;
  });

	_parser.addGrammarElement("stringLike", function (parser, runtime, tokens) {
		return _parser.parseAnyOf(["string", "nakedString"], tokens);
	});

	_parser.addCommand("append", function (parser, runtime, tokens) {
		if (!lexer.matchToken(tokens, "append")) return;
		var target = null;
		var prop = null;

		var value = parser.requireElement("expression", tokens);

		if (lexer.matchToken(tokens, "to")) {
			target = parser.requireElement("expression", tokens);
		}

		if (target == null) {
			prop = "result";
		} else if (target.type === "symbol") {
			prop = target.name;
		} else if (target.type === "propertyAccess") {
			prop = target.prop.value;
		} else {
			throw "Unable to append to " + target.type;
		}

		var command = {
			value: value,
			target: target,
			args: [value],
			op: function (context, value) {
				if (Array.isArray(context[prop])) {
					context[prop].push(value);
				} else if (context[prop] instanceof Element) {
					if (typeof value == "string") {
						context[prop].innerHTML += value;
					} else {
						throw "Don't know how to append non-strings to an HTML Element yet.";
					}
				} else {
					context[prop] += value;
				}

				return runtime.findNext(this, context);
			},
			execute: function (context) {
				return runtime.unifiedExec(this, context/*, value, target*/);
			},
		};
		return command;
	});

	_parser.addCommand("increment", function (parser, runtime, tokens) {
		if (!lexer.matchToken(tokens, "increment")) return;
		var amount;

		// This is optional.  Defaults to "result"
		var target = parser.parseElement("assignableExpression", tokens);

		// This is optional. Defaults to 1.
		if (lexer.matchToken(tokens, "by")) {
			amount = parser.requireElement("expression", tokens);
		}

		var command = {
			target: target,
			args: [target, amount],
			op: function (context, targetValue, amount) {
				targetValue = targetValue ? parseFloat(targetValue) : 0;
				amount = amount ? parseFloat(amount) : 1;
				var newValue = targetValue + amount;
				var setter = makeSetter(parser, runtime, tokens, target, newValue);
				context.result = newValue;
				setter.parent = this;
				return setter;
			},
			execute: function (context) {
				return runtime.unifiedExec(this, context/* , target, amount */);
			},
		};
		return command;
	});

	_parser.addCommand("decrement", function (parser, runtime, tokens) {
		if (!lexer.matchToken(tokens, "decrement")) return;
		var amount;

		// This is optional.  Defaults to "result"
		var target = parser.parseElement("assignableExpression", tokens);

		// This is optional. Defaults to 1.
		if (lexer.matchToken(tokens, "by")) {
			amount = parser.requireElement("expression", tokens);
		}

		var command = {
			target: target,
			args: [target, amount],
			op: function (context, targetValue, amount) {
				targetValue = targetValue ? parseFloat(targetValue) : 0;
				amount = amount ? parseFloat(amount) : 1;
				var newValue = targetValue - amount;
				var setter = makeSetter(parser, runtime, tokens, target, newValue);
				context.result = newValue;
				setter.parent = this;
				return setter;
			},
			execute: function (context) {
				return runtime.unifiedExec(this, context/*, target, amount*/);
			},
		};
		return command;
	});

	_parser.addCommand("fetch", function (parser, runtime, tokens) {
		if (!lexer.matchToken(tokens, "fetch")) return;
		var url = parser.requireElement("stringLike", tokens);

		if (lexer.matchToken(tokens, "with")) {
			var args = parser.parseElement("nakedNamedArgumentList", tokens);
		} else {
			var args = parser.parseElement("objectLiteral", tokens);
		}

		var type = "text";
		var conversion;
		if (lexer.matchToken(tokens, "as")) {
			lexer.matchToken(tokens, "a") || lexer.matchToken(tokens, "an");
			if (lexer.matchToken(tokens, "json") || lexer.matchToken(tokens, "Object")) {
				type = "json";
			} else if (lexer.matchToken(tokens, "response")) {
				type = "response";
			} else if (lexer.matchToken(tokens, "html")) {
				type = "html";
			} else if (lexer.matchToken(tokens, "text")) {
				// default, ignore
			} else {
				conversion = parser.requireElement("dotOrColonPath", tokens).evaluate();
			}
		}

		/** @type {GrammarElement} */
		var fetchCmd = {
			url: url,
			argExpressions: args,
			args: [url, args],
			op: function (context, url, args) {
				var detail = args || {};
				detail["sentBy"] = context.me;
				runtime.triggerEvent(context.me, "hyperscript:beforeFetch", detail);
				args = detail;
				return fetch(url, args)
					.then(function (resp) {
						if (type === "response") {
							context.result = resp;
							return runtime.findNext(fetchCmd, context);
						}
						if (type === "json") {
							return resp.json().then(function (result) {
								context.result = result;
								return runtime.findNext(fetchCmd, context);
							});
						}
						return resp.text().then(function (result) {
							if (conversion) result = runtime.convertValue(result, conversion);

							if (type === "html") result = runtime.convertValue(result, "Fragment");

							context.result = result;
							return runtime.findNext(fetchCmd, context);
						});
					})
					.catch(function (reason) {
						runtime.triggerEvent(context.me, "fetch:error", {
							reason: reason,
						});
						throw reason;
					});
			},
		};
		return fetchCmd;
	});
}

//====================================================================
// Initialization
//====================================================================
function ready(fn) {
	if (document.readyState !== "loading") {
		setTimeout(fn);
	} else {
		document.addEventListener("DOMContentLoaded", fn);
	}
}

function getMetaConfig() {
	/** @type {HTMLMetaElement} */
	var element = document.querySelector('meta[name="htmx-config"]');
	if (element) {
		return parseJSON(element.content);
	} else {
		return null;
	}
}

function mergeMetaConfig() {
	var metaConfig = getMetaConfig();
	if (metaConfig) {
		_hyperscript.config = mergeObjects(_hyperscript.config, metaConfig);
	}
}

if ("document" in globalScope) {
	/** @type {HTMLScriptElement[]} */
	var scripts = Array.from(document.querySelectorAll("script[type='text/hyperscript'][src]"))
	Promise.all(
		scripts.map(function (script) {
			return fetch(script.src)
				.then(function (res) {
					return res.text();
				})
				.then(function (code) {
					return _runtime.evaluate(code);
				});
		})
	).then(function () {
		ready(function () {
			mergeMetaConfig();
			_runtime.processNode(document.documentElement);
			document.addEventListener("htmx:load", function (/** @type {CustomEvent} */ evt) {
				_runtime.processNode(evt.detail.elt);
			});
		});
	});
}

//====================================================================
// API
//====================================================================
/** @type {HyperscriptObject} */
export default _hyperscript = mergeObjects(
	function (str, ctx) {
		return _runtime.evaluate(str, ctx); //OK
	},
	{
		internals: {
			parser: _parser,
			runtime: _runtime,
		},
		ElementCollection: ElementCollection,
		addFeature: function (keyword, definition) {
			_parser.addFeature(keyword, definition);
		},
		addCommand: function (keyword, definition) {
			_parser.addCommand(keyword, definition);
		},
		addLeafExpression: function (name, definition) {
			_parser.addLeafExpression(name, definition);
		},
		addIndirectExpression: function (name, definition) {
			_parser.addIndirectExpression(name, definition);
		},
		evaluate: _runtime.evaluate.bind(_runtime),
		parse: _runtime.parse.bind(_runtime),
		processNode: _runtime.processNode.bind(_runtime),
		config: {
			attributes: "_, script, data-script",
			defaultTransition: "all 500ms ease-in",
			disableSelector: "[disable-scripting], [data-disable-scripting]",
			conversions: CONVERSIONS,
		},
	}
);
