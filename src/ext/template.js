import { Command, Expression } from '../parsetree/base.js';
import _hyperscript from "../_hyperscript.js";

function escapeHTML(html) {
	return String(html)
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/\x22/g, "&quot;")
		.replace(/\x27/g, "&#039;");
}

class TemplateTextCommand extends Command {
	constructor(parts) {
		super();
		this.parts = parts;
	}

	static parse(parser) {
		var tok = parser.currentToken();
		if (tok.type !== "TEMPLATE_LINE") return;
		parser.consumeToken();

		var parts = [];
		var raw = tok.content;
		var i = 0;

		while (i < raw.length) {
			var nextDollar = raw.indexOf('${', i);
			if (nextDollar === -1) {
				if (i < raw.length) parts.push({ type: 'literal', value: raw.slice(i) });
				break;
			}
			if (nextDollar > i) {
				parts.push({ type: 'literal', value: raw.slice(i, nextDollar) });
			}
			var depth = 1;
			var j = nextDollar + 2;
			while (j < raw.length && depth > 0) {
				if (raw[j] === '{') depth++;
				else if (raw[j] === '}') depth--;
				j++;
			}
			var exprStr = raw.slice(nextDollar + 2, j - 1);
			var escape = true;
			var trimmed = exprStr.trimStart();
			if (trimmed.startsWith('unescaped ')) {
				escape = false;
				exprStr = trimmed.slice('unescaped '.length).trim();
			}

			// Parse conditional syntax: ${value if condition} or ${value if condition else elseValue}
			var conditionalMatch = exprStr.match(/^(.+?)\s+if\s+(.+?)(?:\s+else\s+(.+))?$/);
			if (conditionalMatch) {
				var valueStr = conditionalMatch[1].trim();
				var conditionStr = conditionalMatch[2].trim();
				var elseStr = conditionalMatch[3] ? conditionalMatch[3].trim() : null;

				var valueTokens = _hyperscript.internals.tokenizer.tokenize(valueStr);
				var valueParser = _hyperscript.internals.createParser(valueTokens);
				var valueNode = valueParser.requireElement("expression");

				var conditionTokens = _hyperscript.internals.tokenizer.tokenize(conditionStr);
				var conditionParser = _hyperscript.internals.createParser(conditionTokens);
				var conditionNode = conditionParser.requireElement("expression");

				var elseNode = null;
				if (elseStr) {
					var elseTokens = _hyperscript.internals.tokenizer.tokenize(elseStr);
					var elseParser = _hyperscript.internals.createParser(elseTokens);
					elseNode = elseParser.requireElement("expression");
				}

				parts.push({
					type: 'conditional',
					valueNode,
					conditionNode,
					elseNode,
					escape
				});
			} else {
				var exprTokens = _hyperscript.internals.tokenizer.tokenize(exprStr);
				var exprParser = _hyperscript.internals.createParser(exprTokens);
				var node = exprParser.requireElement("expression");
				parts.push({ type: 'expr', node, escape });
			}
			i = j;
		}

		return new TemplateTextCommand(parts);
	}

	resolve(ctx) {
		var vals = this.parts.map(part => {
            if (part.type === 'literal') return part.value;
            if (part.type === 'conditional') {
                var condition = part.conditionNode.evaluate(ctx);
                if (condition) {
                    return part.valueNode.evaluate(ctx);
                } else if (part.elseNode) {
                    return part.elseNode.evaluate(ctx);
                } else {
                    return undefined;
                }
            }
            return part.node.evaluate(ctx);

        });

        var stringify = (val, part) => {
            if (part.type === 'literal') return val;
            if (val === undefined || val === null) return '';
            if (part.escape) return escapeHTML(String(val));
            return String(val);
        };

        if (vals.some(v => v && v.then)) {
            return Promise.all(vals).then(resolved => {
                ctx.meta.__ht_template_result.push(
                    resolved.map((val, i) => stringify(val, this.parts[i])).join('')
                );
                return ctx.meta.runtime.findNext(this, ctx);
            });
        }

        ctx.meta.__ht_template_result.push(
            vals.map((val, i) => stringify(val, this.parts[i])).join('')
        );
        return ctx.meta.runtime.findNext(this, ctx);
    //     if (val === undefined || val === null) return '';
    //     if (part.escape) return escapeHTML(String(val));
    //     return String(val);
    // }).join('');
	// 	ctx.meta.__ht_template_result.push(result);
	// 	return ctx.meta.runtime.findNext(this, ctx);
	}
}

class RenderCommand extends Command {
	static keyword = "render";

	constructor(template_, templateArgs) {
		super();
		this.template_ = template_;
		this.args = { template: template_, templateArgs };
	}

	static parse(parser) {
		if (!parser.matchToken("render")) return;
		var template_ = parser.requireElement("expression");
		var templateArgs = {};
		if (parser.matchToken("with")) {
			templateArgs = parser.parseElement("nakedNamedArgumentList");
		}
		return new RenderCommand(template_, templateArgs);
	}

	resolve(ctx, { template, templateArgs }) {
		if (!(template instanceof Element)) throw new Error(this.template_.sourceFor() + " is not an element");

		var buf = [];
		const renderCtx = ctx.meta.runtime.makeContext(ctx.me, null, ctx.me, null);
		renderCtx.locals = Object.assign({}, ctx.locals, templateArgs);
		renderCtx.meta.__ht_template_result = buf;

		var tokens = _hyperscript.internals.tokenizer.tokenize(template.innerHTML, "lines");
		var parser = _hyperscript.internals.createParser(tokens);
		var commandList = parser.parseElement("commandList");
		parser.ensureTerminated(commandList);

		var resolve, reject;
		var promise = new Promise(function(res, rej) { resolve = res; reject = rej; });

		commandList.execute(renderCtx);

		if (renderCtx.meta.returned) {
			ctx.result = buf.join("");
			return ctx.meta.runtime.findNext(this, ctx);
		}

		renderCtx.meta.resolve = resolve;
		renderCtx.meta.reject = reject;
		return promise.then(() => {
			ctx.result = buf.join("");
			return ctx.meta.runtime.findNext(this, ctx);
		});
	}
}

class EscapeExpression extends Expression {
	static grammarName = "escape";
	static expressionType = "leaf";

	constructor(arg, unescaped, escapeType) {
		super();
		this.unescaped = unescaped;
		this.escapeType = escapeType;
		this.args = { value: arg };
	}

	static parse(parser) {
		if (!parser.matchToken("escape")) return;
		var escapeType = parser.matchTokenType("IDENTIFIER").value;

		// hidden! for use in templates
		var unescaped = parser.matchToken("unescaped");

		var arg = parser.requireElement("expression");

		return new EscapeExpression(arg, unescaped, escapeType);
	}

	resolve(ctx, { value }) {
		if (this.unescaped) return value;
		if (value === undefined) return "";
		switch (this.escapeType) {
			case "html":
				return escapeHTML(value);
			default:
				throw new Error("Unknown escape: " + this.escapeType);
		}
	}
}

/**
 * TemplateForLoopCommand - The actual loop iteration logic for template for loops
 */
class TemplateForLoopCommand extends Command {
	constructor(identifier, slot, loopBody, elseBranch) {
		super();
		this.identifier = identifier;
		this.slot = slot;
		this.loop = loopBody; // Named 'loop' for continue/break compatibility
		this.elseBranch = elseBranch;
	}

	resolveNext() {
		return this;
	}

	resolve(context) {
		var iterator = context.meta.iterators[this.slot];

		// If iterator was already cleaned up, we're done
		if (!iterator) {
			return context.meta.runtime.findNext(this.parent, context);
		}

		var nextVal = iterator.iterator.next();

		if (!nextVal.done) {
			// Mark that we've iterated at least once
			iterator.didIterate = true;
			// Set the loop variable
			context.locals[iterator.identifier] = nextVal.value;
			context.result = nextVal.value;
			// Execute loop body
			return this.loop;
		} else {
			// Loop is done
			var didIterate = iterator.didIterate;
			context.meta.iterators[this.slot] = null;

			// Execute else branch only if loop never ran
			if (!didIterate && this.elseBranch) {
				return this.elseBranch;
			}

			return context.meta.runtime.findNext(this.parent, context);
		}
	}
}

/**
 * TemplateForCommand - For loop with optional else clause for templates
 *
 * Extends the standard for loop to support Python-style for...else:
 * The else block executes if the loop collection was empty (never iterated)
 */
class TemplateForCommand extends Command {
	static keyword = "for";

	constructor(expression, identifier, slot, loopCommand) {
		super();
		this.expression = expression;
		this.identifier = identifier;
		this.slot = slot;
		this.loopCommand = loopCommand;
	}

	static parse(parser) {
		var startToken = parser.currentToken();
		if (!parser.matchToken("for")) return;

		// Parse: for <identifier> in <expression>
		var identifierToken = parser.requireTokenType("IDENTIFIER");
		var identifier = identifierToken.value;
		parser.requireToken("in");
		var expression = parser.requireElement("expression");

		// Parse the loop body
		var loopBody = parser.parseElement("commandList");

		// Check for else clause
		var elseBranch = null;
		if (parser.matchToken("else")) {
			elseBranch = parser.parseElement("commandList");
		}

		// Require end token
		if (parser.hasMore()) {
			parser.requireToken("end");
		}

		var slot = "template_for_" + startToken.start;

		var loopCommand = new TemplateForLoopCommand(identifier, slot, loopBody, elseBranch);
		var cmd = new TemplateForCommand(expression, identifier, slot, loopCommand);

		parser.setParent(loopBody, loopCommand);
		if (elseBranch) {
			parser.setParent(elseBranch, loopCommand);
		}
		parser.setParent(loopCommand, cmd);

		return cmd;
	}

	resolve(context) {
		var collection = this.expression.evaluate(context);

		// Initialize iterator info
		var iteratorInfo = {
			identifier: this.identifier,
			iterator: null,
			didIterate: false
		};

		// Handle different collection types
		if (collection && collection[Symbol.iterator]) {
			iteratorInfo.iterator = collection[Symbol.iterator]();
		} else if (collection && typeof collection === 'object') {
			// For plain objects, iterate over keys
			iteratorInfo.iterator = Object.keys(collection)[Symbol.iterator]();
		} else {
			// Empty or null collection - will trigger else
			iteratorInfo.iterator = [][Symbol.iterator]();
		}

		context.meta.iterators[this.slot] = iteratorInfo;

		return this.loopCommand;
	}
}

/**
 * @param {import('../dist/_hyperscript').Hyperscript} _hyperscript
 */
export default function templatePlugin(_hyperscript) {
	_hyperscript.addCommand(RenderCommand.keyword, RenderCommand.parse.bind(RenderCommand));
	_hyperscript.addLeafExpression(EscapeExpression.grammarName, EscapeExpression.parse.bind(EscapeExpression));
	_hyperscript.addCommand("TEMPLATE_LINE", TemplateTextCommand.parse.bind(TemplateTextCommand));
	_hyperscript.addCommand(TemplateForCommand.keyword, TemplateForCommand.parse.bind(TemplateForCommand));
}

// Auto-register when imported
if (typeof self !== 'undefined' && self._hyperscript) {
	self._hyperscript.use(templatePlugin);
}
