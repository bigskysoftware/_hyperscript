/**
 * Tree-sitter grammar for _hyperscript.
 *
 * Highlighting-focused: identifies token types for correct coloring
 * without trying to fully parse the language structure.
 * The real parser (IIFE via LSP/GraalVM) handles structural parsing.
 */
module.exports = grammar({
  name: 'hyperscript',

  extras: $ => [/\s/],

  rules: {
    program: $ => repeat($._token),

    _token: $ => choice(
      $.comment,
      $.string,
      $.template_string,
      $.number,
      $.boolean,
      $.css_class,
      $.css_id,
      $.css_selector,
      $.attribute_ref,
      $.style_ref,
      $.feature_keyword,
      $.command_keyword,
      $.control_keyword,
      $.modifier,
      $.type_name,
      $.operator,
      $.punctuation,
      $.identifier,
    ),

    // Comments
    comment: $ => choice(
      seq('--', /[^\n]*/),
      seq('/*', /[^*]*\*+([^/*][^*]*\*+)*/, '/'),
    ),

    // Strings
    string: $ => choice(
      seq("'", optional(/[^'\\]*(\\.?[^'\\]*)*/), "'"),
      seq('"', optional(/[^"\\]*(\\.?[^"\\]*)*/), '"'),
    ),

    template_string: $ => seq('`', repeat(choice(
      /[^`\\$]+/,
      /\\./,
      seq('${', /[^}]*/, '}'),
      seq('$', /[a-zA-Z_]\w*/),
    )), '`'),

    // Numbers (with optional time suffixes)
    number: $ => /\d+(\.\d+)?(ms|s|milliseconds|seconds)?/,

    // Booleans and null
    boolean: $ => choice('true', 'false', 'null'),

    // CSS references
    css_class: $ => token(seq('.', /[a-zA-Z][a-zA-Z0-9_\-$]*/)),
    css_id: $ => token(seq('#', /[a-zA-Z][a-zA-Z0-9_\-$]*/)),
    css_selector: $ => token(seq('<', /[a-zA-Z][^>]*/, '/>')),
    attribute_ref: $ => token(seq('@', /[a-zA-Z][a-zA-Z0-9_\-]*/)),
    style_ref: $ => token(seq('*', /[a-zA-Z][a-zA-Z0-9_\-]*/)),

    // Feature keywords
    feature_keyword: $ => choice(
      'on', 'def', 'init', 'behavior', 'install', 'js', 'worker',
      'eventsource', 'socket', 'catch',
    ),

    // Command keywords
    command_keyword: $ => choice(
      'add', 'remove', 'toggle', 'set', 'get', 'put', 'call',
      'send', 'trigger', 'take', 'log', 'return', 'throw',
      'fetch', 'go', 'hide', 'show', 'wait', 'halt', 'exit',
      'tell', 'transition', 'settle', 'make', 'append', 'pick',
      'default', 'increment', 'decrement', 'measure', 'focus',
      'blur', 'swap', 'morph', 'open', 'close', 'render',
      'empty', 'answer', 'ask', 'speak', 'select', 'scroll', 'beep',
    ),

    // Control flow keywords
    control_keyword: $ => choice(
      'if', 'else', 'otherwise', 'then', 'end',
      'repeat', 'for', 'while', 'until',
      'break', 'continue', 'async',
    ),

    // Modifiers (contextual keywords)
    modifier: $ => choice(
      'from', 'in', 'to', 'with', 'over', 'into', 'before', 'after',
      'at', 'is', 'am', 'as', 'and', 'or', 'not', 'no', 'of', 'the',
      'closest', 'first', 'last', 'next', 'previous', 'random',
      'when', 'where', 'unless', 'between', 'forever', 'every',
      'queue', 'debounced', 'throttled', 'elsewhere', 'called',
      'its', 'my', 'me', 'it', 'I', 'result', 'you', 'your', 'yourself',
      'by',
    ),

    // Built-in type names
    type_name: $ => choice(
      'String', 'Number', 'Int', 'Float', 'Date', 'Array',
      'HTML', 'Fragment', 'JSON', 'Object', 'Values', 'Boolean', 'Fixed',
    ),

    // Operators
    operator: $ => choice(
      '+', '-', '/', '%', '=', '==', '===', '!=', '!==',
      '<=', '>=', '..', '->', '|', '!', '\\',
    ),

    // Punctuation
    punctuation: $ => choice('(', ')', '{', '}', '[', ']', ',', ':', ';', '?', '&'),

    // Identifiers (catch-all for unrecognized words)
    identifier: $ => /[a-zA-Z_$][a-zA-Z0-9_$]*/,
  },
});
