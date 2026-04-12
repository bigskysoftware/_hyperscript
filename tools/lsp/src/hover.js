/**
 * Hover documentation provider - thin wrapper around shared hover.js
 */
const parser = require('./parser');

/**
 * Get hover content for a word.
 * @param {string} word
 * @returns {{ kind: string, value: string }|null}
 */
function getHover(word) {
  const entry = parser.getHover(word);
  if (!entry) return null;

  const lines = [];
  lines.push('### ' + entry.keyword);
  if (entry.syntax) {
    lines.push('```hyperscript');
    lines.push(entry.syntax);
    lines.push('```');
  }
  lines.push(entry.description);
  lines.push('\n[Documentation](https://hyperscript.org/' + entry.category + '/' + entry.keyword + '/)');

  return { kind: 'markdown', value: lines.join('\n') };
}

module.exports = { getHover };
