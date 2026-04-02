/**
 * Hover documentation provider.
 * Loads docs.json and returns markdown hover content for hyperscript keywords.
 */
const path = require('path');
const docs = require(path.join(__dirname, '..', '..', 'common', 'docs.json'));

const ALIASES = {
  'else': 'if', 'otherwise': 'if', 'end': null,
  'then': null, 'the': null, 'a': null, 'an': null,
  'my': 'possessive', 'its': 'possessive', 'your': 'you',
  'yourself': 'you', 'I': 'me',
};

/**
 * Get hover content for a word.
 * @param {string} word
 * @returns {{ kind: string, value: string }|null}
 */
function getHover(word) {
  const lower = word.toLowerCase();
  let entry = docs[lower] || docs[word];

  if (!entry && ALIASES[word] !== undefined) {
    const alias = ALIASES[word];
    if (!alias) return null;
    entry = docs[alias];
  }

  if (!entry) return null;

  const lines = [];
  lines.push(`### ${word}`);
  if (entry.syntax) {
    lines.push('```hyperscript');
    lines.push(entry.syntax);
    lines.push('```');
  }
  lines.push(entry.description);
  lines.push(`\n[Documentation](https://hyperscript.org/${entry.category}/${lower}/)`);

  return { kind: 'markdown', value: lines.join('\n') };
}

module.exports = { getHover };
