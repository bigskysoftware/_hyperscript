/**
 * Context-sensitive completion provider.
 * Port of HyperscriptCompletionContributor.kt.
 */
const parser = require('./parser');

const FEATURES = [
  ['on', 'event handler'], ['def', 'define a function'], ['init', 'run on initialization'],
  ['set', 'set a property'], ['behavior', 'reusable behavior'], ['install', 'install a behavior'],
  ['bind', 'bind a variable'], ['live', 'live-binding'], ['when', 'conditional feature'],
  ['js', 'inline JavaScript'], ['worker', 'web worker'],
  ['eventsource', 'SSE connection'], ['socket', 'WebSocket connection'],
];

const COMMANDS = [
  ['add', 'add class/attribute'], ['remove', 'remove class/attribute'],
  ['toggle', 'toggle class/attribute'], ['set', 'set variable/property'],
  ['get', 'get a value'], ['put', 'put value into target'],
  ['call', 'call a function'], ['send', 'send an event'],
  ['trigger', 'trigger an event'], ['take', 'take class from siblings'],
  ['log', 'log to console'], ['return', 'return from function'],
  ['throw', 'throw an error'], ['fetch', 'fetch a URL'],
  ['go', 'navigate'], ['hide', 'hide element'], ['show', 'show element'],
  ['wait', 'wait for time/event'], ['halt', 'halt processing'],
  ['exit', 'exit handler'], ['tell', 'set target for commands'],
  ['transition', 'CSS transition'], ['settle', 'wait for transitions'],
  ['make', 'create element/object'], ['append', 'append to target'],
  ['pick', 'pick a value'], ['default', 'set default value'],
  ['increment', 'increment value'], ['decrement', 'decrement value'],
  ['measure', 'measure dimensions'], ['focus', 'focus element'],
  ['blur', 'blur element'], ['swap', 'swap content'],
  ['morph', 'morph content'], ['async', 'run asynchronously'],
];

const CONTROL_FLOW = [
  ['if', 'conditional block'], ['else', 'else branch'], ['else if', 'else-if branch'],
  ['repeat', 'loop'], ['for', 'for loop'], ['continue', 'continue loop'],
  ['break', 'break loop'], ['end', 'end block'], ['then', 'chain command'],
];

const TARGETS = [
  ['me', 'current element'], ['my', 'my property'], ['it', 'implicit result'],
  ['its', 'its property'], ['the', 'the <expression>'], ['closest', 'closest ancestor'],
  ['first', 'first match'], ['last', 'last match'],
  ['next', 'next sibling'], ['previous', 'previous sibling'],
];

const BUILTINS = [
  ['me', 'current element'], ['it', 'implicit result'], ['result', 'last result'],
  ['event', 'current event'], ['target', 'event target'], ['detail', 'event detail'],
  ['body', 'document body'], ['true', 'boolean true'], ['false', 'boolean false'],
  ['null', 'null value'],
];

const EXPRESSION_KW = [
  ['not', 'negation'], ['no', 'negation'], ['the', 'the <expression>'],
  ['closest', 'closest ancestor'], ['first', 'first match'], ['last', 'last match'],
  ['next', 'next sibling'], ['previous', 'previous sibling'], ['exists', 'existence check'],
];

const MID_COMMAND_MODIFIERS = [
  ['from', 'source element'], ['in', 'target scope'], ['to', 'destination'],
  ['into', 'destination'], ['with', 'with modifier'], ['at', 'position'],
  ['on', 'target element'], ['as', 'type conversion'], ['by', 'amount'],
  ['of', 'property of'], ['over', 'iterate over'],
  ['before', 'position before'], ['after', 'position after'],
];

const TYPE_NAMES = [
  ['String', 'convert to String'], ['Number', 'convert to Number'],
  ['Int', 'convert to Int'], ['Float', 'convert to Float'],
  ['Date', 'convert to Date'], ['Array', 'convert to Array'],
  ['Object', 'convert to Object'], ['JSON', 'convert to JSON'],
  ['HTML', 'convert to HTML Fragment'], ['Fragment', 'convert to Fragment'],
  ['Values', 'convert to Values'], ['Fixed:2', 'fixed decimal (2 places)'],
];

const EVENTS = [
  'click', 'dblclick', 'mousedown', 'mouseup', 'mouseover', 'mouseout',
  'mousemove', 'mouseenter', 'mouseleave', 'contextmenu',
  'keydown', 'keyup', 'keypress',
  'change', 'input', 'submit', 'focus', 'blur', 'reset', 'select',
  'load', 'scroll', 'resize',
  'touchstart', 'touchend', 'touchmove',
  'dragstart', 'drag', 'dragend', 'dragover', 'dragenter', 'dragleave', 'drop',
  'mutation', 'intersection',
  'every', 'htmx:afterSwap', 'htmx:beforeRequest', 'htmx:afterRequest',
  'htmx:configRequest', 'htmx:beforeSwap',
];

const COMMAND_NAMES = new Set(COMMANDS.map(c => c[0]));

const KEYWORDS = new Set([
  'on', 'def', 'set', 'init', 'behavior', 'install', 'bind', 'live', 'when',
  'js', 'worker', 'eventsource', 'socket',
  ...COMMAND_NAMES,
  'if', 'else', 'repeat', 'for', 'continue', 'break', 'end', 'then',
  'from', 'in', 'to', 'into', 'with', 'at', 'as', 'by', 'of',
  'on', 'the', 'my', 'its', 'me', 'it', 'result', 'not', 'no', 'and', 'or',
]);

/** Simple tokenizer — splits text into [type, value] pairs */
function tokenize(text) {
  const tokens = [];
  let i = 0;
  while (i < text.length) {
    if (/\s/.test(text[i])) { i++; continue; }
    if (text[i] === '-' && text[i + 1] === '-') {
      while (i < text.length && text[i] !== '\n') i++;
      continue;
    }
    if (text[i] === '\'' || text[i] === '"' || text[i] === '`') {
      const q = text[i]; i++;
      while (i < text.length && text[i] !== q) { if (text[i] === '\\') i++; i++; }
      i++;
      tokens.push(['STRING', '']);
      continue;
    }
    if (text[i] === '#') {
      let j = i + 1;
      while (j < text.length && /[\w\-$]/.test(text[j])) j++;
      tokens.push(['CSS_ID', text.substring(i, j)]);
      i = j;
      continue;
    }
    if (text[i] === '.' && i + 1 < text.length && /[a-zA-Z]/.test(text[i + 1])) {
      let j = i + 1;
      while (j < text.length && /[\w\-$]/.test(text[j])) j++;
      tokens.push(['CSS_CLASS', text.substring(i, j)]);
      i = j;
      continue;
    }
    if (/[a-zA-Z_$]/.test(text[i])) {
      let j = i;
      while (j < text.length && /[\w$]/.test(text[j])) j++;
      const word = text.substring(i, j);
      tokens.push([KEYWORDS.has(word) ? 'KEYWORD' : 'IDENTIFIER', word]);
      i = j;
      continue;
    }
    tokens.push(['OPERATOR', text[i]]);
    i++;
  }
  return tokens;
}

/** Determine context from tokens (fallback) */
function contextFromTokens(tokens) {
  if (!tokens.length) return 'FEATURE_START';

  const last = tokens[tokens.length - 1];
  const [lastType, lastVal] = last;
  const prev = tokens[tokens.length - 2];

  if (lastType === 'CSS_CLASS') return 'CSS_CLASS';
  if (lastType === 'CSS_ID' && lastVal === '#') return 'CSS_ID';
  if (lastType === 'CSS_ID') return 'CSS_ID';
  if (lastType === 'OPERATOR' && lastVal === '#') return 'CSS_ID';

  if (lastVal === 'on' && lastType === 'KEYWORD') return 'EVENT_NAME';
  if (lastVal === 'then') return 'COMMAND';
  if (lastVal === 'end') return 'FEATURE_START';
  if (prev && prev[1] === 'on' && prev[0] === 'KEYWORD') return 'POST_EVENT';

  if (['from', 'in', 'to', 'into', 'at', 'of', 'over', 'before', 'after'].includes(lastVal)) return 'TARGET';
  if (lastVal === 'as') return 'TYPE_NAME';
  if (lastVal === 'wait') return 'WAIT_ARG';
  if (lastVal === 'repeat') return 'REPEAT_ARG';
  if (['if', 'when', 'unless', 'while', 'until'].includes(lastVal)) return 'EXPRESSION';
  if (['toggle', 'add', 'remove', 'take'].includes(lastVal)) return 'CLASS_OR_ATTRIBUTE';
  if (['put', 'set', 'get', 'log'].includes(lastVal)) return 'EXPRESSION';
  if (['send', 'trigger'].includes(lastVal)) return 'EVENT_NAME';
  if (lastVal === 'make') return 'MAKE_ARG';
  if (lastVal === 'go') return 'GO_ARG';
  if (lastVal === 'fetch') return 'NONE';
  if (lastVal === 'is') return 'IS_CHECK';

  if (tokens.some(t => t[0] === 'KEYWORD' && COMMAND_NAMES.has(t[1]))) return 'MID_COMMAND';

  return 'COMMAND';
}

/**
 * Get expected tokens from the first parse error, if available.
 * Uses the structured `expected` array on ParseError (not message parsing).
 * @param {Array} errors
 * @returns {string[]|null}
 */
function getExpectedTokens(errors) {
  if (!errors || !errors.length) return null;
  return errors[0].expected || null;
}

/** Determine context from parse tree */
function contextFromTree(tree, offset, errors) {
  if (!tree) return null;
  const node = findDeepest(tree, offset);
  if (!node) return null;

  // If we have a failed node with extractable expected tokens, use those directly
  if (node.type === 'failedCommand' || node.type === 'failedFeature') {
    const expected = getExpectedTokens(errors);
    if (expected) return { type: 'EXPECTED_TOKENS', tokens: expected };
  }

  if (node.type === 'failedCommand') return contextForFailedCommand(node.keyword);
  if (node.type === 'failedFeature') return contextForFailedFeature(node.keyword);
  if (['onFeature', 'defFeature', 'initFeature'].includes(node.type)) return 'COMMAND';
  if (node.type === 'emptyCommandListCommand') return 'COMMAND';
  if (node.type === 'hyperscript') return 'FEATURE_START';

  return null;
}

function findDeepest(node, offset) {
  for (const child of (node.children || [])) {
    if (child.start != null && child.end != null && offset >= child.start && offset <= child.end) {
      return findDeepest(child, offset);
    }
  }
  return node;
}

function contextForFailedCommand(keyword) {
  const map = {
    toggle: 'CLASS_OR_ATTRIBUTE', add: 'CLASS_OR_ATTRIBUTE',
    remove: 'CLASS_OR_ATTRIBUTE', take: 'CLASS_OR_ATTRIBUTE',
    put: 'EXPRESSION', set: 'EXPRESSION', get: 'EXPRESSION', call: 'EXPRESSION',
    send: 'EVENT_NAME', trigger: 'EVENT_NAME', fetch: 'NONE',
    go: 'GO_ARG', make: 'MAKE_ARG', wait: 'WAIT_ARG',
    repeat: 'REPEAT_ARG', for: 'REPEAT_ARG',
    if: 'EXPRESSION', unless: 'EXPRESSION', while: 'EXPRESSION', until: 'EXPRESSION',
    when: 'EXPRESSION', tell: 'EXPRESSION', transition: 'EXPRESSION',
    log: 'EXPRESSION', show: 'EXPRESSION', hide: 'EXPRESSION',
    as: 'TYPE_NAME', default: 'EXPRESSION',
    increment: 'EXPRESSION', decrement: 'EXPRESSION',
  };
  return map[keyword] || 'COMMAND';
}

function contextForFailedFeature(keyword) {
  const map = { on: 'EVENT_NAME', set: 'EXPRESSION', init: 'COMMAND' };
  return map[keyword] || 'FEATURE_START';
}

/** Build LSP CompletionItem list */
function items(label, detail, kind) {
  return { label, detail, kind };
}

/**
 * Get completions for a position in a hyperscript region.
 * @param {string} source - the hyperscript source text
 * @param {number} offset - cursor offset within the source
 * @param {Set<string>} cssClasses - CSS classes from the HTML document
 * @param {Set<string>} cssIds - element IDs from the HTML document
 * @returns {Array} LSP CompletionItem[]
 */
function getCompletions(source, offset, cssClasses, cssIds) {
  const beforeCursor = source.substring(0, offset);
  const CompletionItemKind = { Keyword: 14, Property: 10, Value: 12, Event: 23, Class: 7, Enum: 13, Function: 3 };

  // Try tree-based context
  let ctx = null;
  try {
    const result = parser.parse(beforeCursor);
    if (result.tree) ctx = contextFromTree(result.tree, beforeCursor.length, result.errors);
  } catch (_) {}

  // Fallback to token-based
  if (!ctx) {
    const tokens = tokenize(beforeCursor);
    ctx = contextFromTokens(tokens);
  }

  // Override for CSS class/ID (lexer is better at detecting these)
  const tokens = tokenize(beforeCursor);
  const lastTok = tokens[tokens.length - 1];
  if (lastTok) {
    if (lastTok[0] === 'CSS_CLASS') ctx = 'CSS_CLASS';
    else if (lastTok[0] === 'CSS_ID' || (lastTok[0] === 'OPERATOR' && lastTok[1] === '#')) ctx = 'CSS_ID';
  }

  const result = [];
  const add = (list, kind) => list.forEach(([l, d]) => result.push(items(l, d, kind)));
  const addEvents = () => EVENTS.forEach(e => result.push(items(e, 'event', CompletionItemKind.Event)));
  const addCssClasses = () => cssClasses.forEach(c => result.push(items(c, 'class', CompletionItemKind.Class)));
  const addCssIds = () => cssIds.forEach(id => result.push(items(id, 'id', CompletionItemKind.Property)));

  // Handle parser-derived expected tokens (most precise)
  if (ctx && typeof ctx === 'object' && ctx.type === 'EXPECTED_TOKENS') {
    for (const tok of ctx.tokens) {
      result.push(items(tok, 'expected', CompletionItemKind.Keyword));
    }
    return result;
  }

  switch (ctx) {
    case 'FEATURE_START':
      add(FEATURES, CompletionItemKind.Keyword);
      add(COMMANDS, CompletionItemKind.Function);
      break;
    case 'EVENT_NAME': addEvents(); break;
    case 'POST_EVENT':
      add([['from', 'filter by source'], ['elsewhere', 'click-away'],
           ['debounced at', 'debounce'], ['throttled at', 'throttle'],
           ['queue', 'queue strategy']], CompletionItemKind.Keyword);
      add(COMMANDS, CompletionItemKind.Function);
      break;
    case 'COMMAND':
      add(COMMANDS, CompletionItemKind.Function);
      add(CONTROL_FLOW, CompletionItemKind.Keyword);
      break;
    case 'TARGET': add(TARGETS, CompletionItemKind.Keyword); add(BUILTINS, CompletionItemKind.Value); break;
    case 'EXPRESSION': add(BUILTINS, CompletionItemKind.Value); add(TARGETS, CompletionItemKind.Keyword); add(EXPRESSION_KW, CompletionItemKind.Keyword); break;
    case 'TYPE_NAME': add(TYPE_NAMES, CompletionItemKind.Enum); break;
    case 'WAIT_ARG': add([['for', 'wait for an event']], CompletionItemKind.Keyword); break;
    case 'REPEAT_ARG': add([['forever', 'indefinitely'], ['for', 'each item'], ['while', 'while condition'], ['until', 'until condition'], ['in', 'items in collection']], CompletionItemKind.Keyword); break;
    case 'CLASS_OR_ATTRIBUTE':
      cssClasses.forEach(c => result.push(items('.' + c, 'class', CompletionItemKind.Class)));
      cssIds.forEach(id => result.push(items('#' + id, 'id', CompletionItemKind.Property)));
      add([['between', 'toggle between'], ['on', 'target'], ['from', 'source'], ['to', 'target']], CompletionItemKind.Keyword);
      break;
    case 'CSS_CLASS': addCssClasses(); break;
    case 'CSS_ID':
      cssIds.forEach(id => result.push({
        label: '#' + id,
        detail: 'id',
        kind: CompletionItemKind.Property,
      }));
      break;
    case 'MAKE_ARG': add([['a', 'make a <tag/>'], ['an', 'make an <tag/>']], CompletionItemKind.Keyword); break;
    case 'GO_ARG': add([['to', 'navigate to URL'], ['back', 'go back'], ['forward', 'go forward']], CompletionItemKind.Keyword); break;
    case 'IS_CHECK': add([['a', 'type check'], ['an', 'type check'], ['not', 'negated'], ['empty', 'emptiness check'], ['less than', 'comparison'], ['greater than', 'comparison']], CompletionItemKind.Keyword); break;
    case 'MID_COMMAND':
      add(MID_COMMAND_MODIFIERS, CompletionItemKind.Keyword);
      add(BUILTINS, CompletionItemKind.Value);
      add([['then', 'chain next command']], CompletionItemKind.Keyword);
      break;
    case 'NONE': break;
  }

  return result;
}

module.exports = { getCompletions };
