/**
 * Shared completion logic for hyperscript tools.
 * Evaluate in the same context as the IIFE and tree-walker.
 * Requires __hsParseAndWalk to be available.
 *
 * Provides: __hsGetCompletions(source, offset, cssClasses, cssIds)
 * Returns: [{ label, detail, kind }]
 *   kind is one of: "keyword", "function", "value", "event", "class", "property", "type"
 */

var __HS_FEATURES = [
  ['on', 'event handler'], ['def', 'define a function'], ['init', 'run on initialization'],
  ['set', 'set a property'], ['behavior', 'reusable behavior'], ['install', 'install a behavior'],
  ['bind', 'bind a variable'], ['live', 'live-binding'], ['when', 'conditional feature'],
  ['js', 'inline JavaScript'], ['worker', 'web worker'],
  ['eventsource', 'SSE connection'], ['socket', 'WebSocket connection'],
];

var __HS_COMMANDS = [
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

var __HS_CONTROL_FLOW = [
  ['if', 'conditional block'], ['else', 'else branch'], ['else if', 'else-if branch'],
  ['repeat', 'loop'], ['for', 'for loop'], ['continue', 'continue loop'],
  ['break', 'break loop'], ['end', 'end block'], ['then', 'chain command'],
];

var __HS_TARGETS = [
  ['me', 'current element'], ['my', 'my property'], ['it', 'implicit result'],
  ['its', 'its property'], ['the', 'the <expression>'], ['closest', 'closest ancestor'],
  ['first', 'first match'], ['last', 'last match'],
  ['next', 'next sibling'], ['previous', 'previous sibling'],
];

var __HS_BUILTINS = [
  ['me', 'current element'], ['it', 'implicit result'], ['result', 'last result'],
  ['event', 'current event'], ['target', 'event target'], ['detail', 'event detail'],
  ['body', 'document body'], ['true', 'boolean true'], ['false', 'boolean false'],
  ['null', 'null value'],
];

var __HS_EXPRESSION_KW = [
  ['not', 'negation'], ['no', 'negation'], ['the', 'the <expression>'],
  ['closest', 'closest ancestor'], ['first', 'first match'], ['last', 'last match'],
  ['next', 'next sibling'], ['previous', 'previous sibling'], ['exists', 'existence check'],
];

var __HS_MID_COMMAND_MODIFIERS = [
  ['from', 'source element'], ['in', 'target scope'], ['to', 'destination'],
  ['into', 'destination'], ['with', 'with modifier'], ['at', 'position'],
  ['on', 'target element'], ['as', 'type conversion'], ['by', 'amount'],
  ['of', 'property of'], ['over', 'iterate over'],
  ['before', 'position before'], ['after', 'position after'],
];

var __HS_TYPE_NAMES = [
  ['String', 'convert to String'], ['Number', 'convert to Number'],
  ['Int', 'convert to Int'], ['Float', 'convert to Float'],
  ['Date', 'convert to Date'], ['Array', 'convert to Array'],
  ['Object', 'convert to Object'], ['JSON', 'convert to JSON'],
  ['HTML', 'convert to HTML Fragment'], ['Fragment', 'convert to Fragment'],
  ['Values', 'convert to Values'], ['Fixed:2', 'fixed decimal (2 places)'],
];

var __HS_EVENTS = [
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

var __HS_COMMAND_NAMES = {};
for (var i = 0; i < __HS_COMMANDS.length; i++) __HS_COMMAND_NAMES[__HS_COMMANDS[i][0]] = true;

var __HS_KEYWORDS = {
  on:1, def:1, set:1, init:1, behavior:1, install:1, bind:1, live:1, when:1,
  js:1, worker:1, eventsource:1, socket:1, if:1, else:1, repeat:1, for:1,
  continue:1, break:1, end:1, then:1, from:1, in:1, to:1, into:1, with:1,
  at:1, as:1, by:1, of:1, the:1, my:1, its:1, me:1, it:1, result:1,
  not:1, no:1, and:1, or:1
};
for (var k in __HS_COMMAND_NAMES) __HS_KEYWORDS[k] = 1;

function __hsTokenize(text) {
  var tokens = [], i = 0;
  while (i < text.length) {
    if (/\s/.test(text[i])) { i++; continue; }
    if (text[i] === '-' && text[i+1] === '-') { while (i < text.length && text[i] !== '\n') i++; continue; }
    if (text[i] === '\'' || text[i] === '"' || text[i] === '`') {
      var q = text[i]; i++;
      while (i < text.length && text[i] !== q) { if (text[i] === '\\') i++; i++; }
      i++; tokens.push(['STRING', '']); continue;
    }
    if (text[i] === '#') {
      var j = i + 1;
      while (j < text.length && /[\w\-$]/.test(text[j])) j++;
      tokens.push(['CSS_ID', text.substring(i, j)]); i = j; continue;
    }
    if (text[i] === '.' && i+1 < text.length && /[a-zA-Z]/.test(text[i+1])) {
      var j = i + 1;
      while (j < text.length && /[\w\-$]/.test(text[j])) j++;
      tokens.push(['CSS_CLASS', text.substring(i, j)]); i = j; continue;
    }
    if (/[a-zA-Z_$]/.test(text[i])) {
      var j = i;
      while (j < text.length && /[\w$]/.test(text[j])) j++;
      var word = text.substring(i, j);
      tokens.push([__HS_KEYWORDS[word] ? 'KEYWORD' : 'IDENTIFIER', word]); i = j; continue;
    }
    tokens.push(['OPERATOR', text[i]]); i++;
  }
  return tokens;
}

function __hsContextFromTokens(tokens) {
  if (!tokens.length) return 'FEATURE_START';
  var last = tokens[tokens.length - 1], prev = tokens[tokens.length - 2];
  var lt = last[0], lv = last[1];

  if (lt === 'CSS_CLASS') return 'CSS_CLASS';
  if (lt === 'CSS_ID') return 'CSS_ID';
  if (lt === 'OPERATOR' && lv === '#') return 'CSS_ID';

  if (lv === 'on' && lt === 'KEYWORD') return 'EVENT_NAME';
  if (lv === 'then') return 'COMMAND';
  if (lv === 'end') return 'FEATURE_START';
  if (prev && prev[1] === 'on' && prev[0] === 'KEYWORD') return 'POST_EVENT';

  if (['from','in','to','into','at','of','over','before','after'].indexOf(lv) >= 0) return 'TARGET';
  if (lv === 'as') return 'TYPE_NAME';
  if (lv === 'wait') return 'WAIT_ARG';
  if (lv === 'repeat') return 'REPEAT_ARG';
  if (['if','when','unless','while','until'].indexOf(lv) >= 0) return 'EXPRESSION';
  if (['toggle','add','remove','take'].indexOf(lv) >= 0) return 'CLASS_OR_ATTRIBUTE';
  if (['put','set','get','log'].indexOf(lv) >= 0) return 'EXPRESSION';
  if (['send','trigger'].indexOf(lv) >= 0) return 'EVENT_NAME';
  if (lv === 'make') return 'MAKE_ARG';
  if (lv === 'go') return 'GO_ARG';
  if (lv === 'fetch') return 'NONE';
  if (lv === 'is') return 'IS_CHECK';

  for (var i = tokens.length - 1; i >= 0; i--) {
    if (tokens[i][0] === 'KEYWORD' && __HS_COMMAND_NAMES[tokens[i][1]]) return 'MID_COMMAND';
  }
  return 'COMMAND';
}

function __hsFindDeepest(node, offset) {
  if (!node) return null;
  for (var i = 0; i < (node.children || []).length; i++) {
    var c = node.children[i];
    if (c.start != null && c.end != null && offset >= c.start && offset <= c.end) {
      return __hsFindDeepest(c, offset);
    }
  }
  return node;
}

function __hsContextFromTree(tree, offset, errors) {
  if (!tree) return null;
  var node = __hsFindDeepest(tree, offset);
  if (!node) return null;

  if (node.type === 'failedCommand' || node.type === 'failedFeature') {
    if (errors && errors.length && errors[0].expected) {
      return { type: 'EXPECTED_TOKENS', tokens: errors[0].expected };
    }
  }

  var failedCmdMap = {
    toggle:'CLASS_OR_ATTRIBUTE', add:'CLASS_OR_ATTRIBUTE', remove:'CLASS_OR_ATTRIBUTE', take:'CLASS_OR_ATTRIBUTE',
    put:'EXPRESSION', set:'EXPRESSION', get:'EXPRESSION', call:'EXPRESSION',
    send:'EVENT_NAME', trigger:'EVENT_NAME', fetch:'NONE', go:'GO_ARG', make:'MAKE_ARG',
    wait:'WAIT_ARG', repeat:'REPEAT_ARG', 'for':'REPEAT_ARG',
    'if':'EXPRESSION', unless:'EXPRESSION', 'while':'EXPRESSION', until:'EXPRESSION',
    when:'EXPRESSION', tell:'EXPRESSION', transition:'EXPRESSION', log:'EXPRESSION',
    show:'EXPRESSION', hide:'EXPRESSION', as:'TYPE_NAME', 'default':'EXPRESSION',
    increment:'EXPRESSION', decrement:'EXPRESSION'
  };

  if (node.type === 'failedCommand') return failedCmdMap[node.keyword] || 'COMMAND';
  if (node.type === 'failedFeature') {
    var featMap = { on:'EVENT_NAME', set:'EXPRESSION', init:'COMMAND' };
    return featMap[node.keyword] || 'FEATURE_START';
  }
  if (node.type === 'onFeature' || node.type === 'defFeature' || node.type === 'initFeature') return 'COMMAND';
  if (node.type === 'emptyCommandListCommand') return 'COMMAND';
  if (node.type === 'hyperscript') return 'FEATURE_START';
  return null;
}

function __hsGetCompletions(source, offset, cssClasses, cssIds) {
  var beforeCursor = source.substring(0, offset);
  var result = [];

  // Try tree-based context
  var ctx = null, parseResult = null;
  try {
    parseResult = __hsParseAndWalk(beforeCursor);
    if (parseResult.tree) ctx = __hsContextFromTree(parseResult.tree, beforeCursor.length, parseResult.errors);
  } catch(e) {}

  // Fallback to tokens
  if (!ctx) {
    var tokens = __hsTokenize(beforeCursor);
    ctx = __hsContextFromTokens(tokens);
  }

  // CSS override via tokens
  var tokens = __hsTokenize(beforeCursor);
  var lastTok = tokens[tokens.length - 1];
  if (lastTok) {
    if (lastTok[0] === 'CSS_CLASS') ctx = 'CSS_CLASS';
    else if (lastTok[0] === 'CSS_ID' || (lastTok[0] === 'OPERATOR' && lastTok[1] === '#')) ctx = 'CSS_ID';
  }

  function add(list, kind) { for (var i = 0; i < list.length; i++) result.push({label:list[i][0], detail:list[i][1], kind:kind}); }

  // Expected tokens from parser (most precise)
  if (ctx && typeof ctx === 'object' && ctx.type === 'EXPECTED_TOKENS') {
    for (var i = 0; i < ctx.tokens.length; i++) result.push({label:ctx.tokens[i], detail:'expected', kind:'keyword'});
    return result;
  }

  switch (ctx) {
    case 'FEATURE_START': add(__HS_FEATURES, 'keyword'); add(__HS_COMMANDS, 'function'); break;
    case 'EVENT_NAME': for (var i=0;i<__HS_EVENTS.length;i++) result.push({label:__HS_EVENTS[i], detail:'event', kind:'event'}); break;
    case 'POST_EVENT':
      add([['from','filter by source'],['elsewhere','click-away'],['debounced at','debounce'],['throttled at','throttle'],['queue','queue strategy']], 'keyword');
      add(__HS_COMMANDS, 'function'); break;
    case 'COMMAND': add(__HS_COMMANDS, 'function'); add(__HS_CONTROL_FLOW, 'keyword'); break;
    case 'TARGET': add(__HS_TARGETS, 'keyword'); add(__HS_BUILTINS, 'value'); break;
    case 'EXPRESSION': add(__HS_BUILTINS, 'value'); add(__HS_TARGETS, 'keyword'); add(__HS_EXPRESSION_KW, 'keyword'); break;
    case 'TYPE_NAME': add(__HS_TYPE_NAMES, 'type'); break;
    case 'WAIT_ARG': add([['for','wait for an event']], 'keyword'); break;
    case 'REPEAT_ARG': add([['forever','indefinitely'],['for','each item'],['while','while condition'],['until','until condition'],['in','items in collection']], 'keyword'); break;
    case 'CLASS_OR_ATTRIBUTE':
      for (var i=0;i<cssClasses.length;i++) result.push({label:'.'+cssClasses[i], detail:'class', kind:'class'});
      for (var i=0;i<cssIds.length;i++) result.push({label:'#'+cssIds[i], detail:'id', kind:'property'});
      add([['between','toggle between'],['on','target'],['from','source'],['to','target']], 'keyword'); break;
    case 'CSS_CLASS': for (var i=0;i<cssClasses.length;i++) result.push({label:cssClasses[i], detail:'class', kind:'class'}); break;
    case 'CSS_ID': for (var i=0;i<cssIds.length;i++) result.push({label:'#'+cssIds[i], detail:'id', kind:'property'}); break;
    case 'MAKE_ARG': add([['a','make a <tag/>'],['an','make an <tag/>']], 'keyword'); break;
    case 'GO_ARG': add([['to','navigate to URL'],['back','go back'],['forward','go forward']], 'keyword'); break;
    case 'IS_CHECK': add([['a','type check'],['an','type check'],['not','negated'],['empty','emptiness check'],['less than','comparison'],['greater than','comparison']], 'keyword'); break;
    case 'MID_COMMAND':
      add(__HS_MID_COMMAND_MODIFIERS, 'keyword'); add(__HS_BUILTINS, 'value');
      add([['then','chain next command']], 'keyword'); break;
    case 'NONE': break;
  }
  return result;
}
