/**
 * Shared hover documentation logic for hyperscript tools.
 * Call __hsInitDocs(docsObject) first, then __hsGetHover(word).
 *
 * Provides: __hsGetHover(word)
 * Returns: { syntax, description, category, keyword } or null
 */

var __hsDocs = null;

var __HS_ALIASES = {
  'else': 'if', 'otherwise': 'if', 'end': null,
  'then': null, 'the': null, 'a': null, 'an': null,
  'my': 'possessive', 'its': 'possessive', 'your': 'you',
  'yourself': 'you', 'I': 'me',
};

function __hsInitDocs(docs) {
  __hsDocs = docs;
}

function __hsGetHover(word) {
  if (!__hsDocs) return null;
  var lower = word.toLowerCase();
  var entry = __hsDocs[lower] || __hsDocs[word];

  if (!entry && __HS_ALIASES[word] !== undefined) {
    var alias = __HS_ALIASES[word];
    if (!alias) return null;
    entry = __hsDocs[alias];
  }

  if (!entry) return null;

  return {
    keyword: lower,
    syntax: entry.syntax || null,
    description: entry.description || '',
    category: entry.category || 'commands'
  };
}
