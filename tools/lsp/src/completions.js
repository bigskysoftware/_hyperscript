/**
 * Completion provider — thin wrapper around shared completions.js
 */
const parser = require('./parser');

const KIND_MAP = {
  keyword: 14, function: 3, value: 12, event: 23,
  class: 7, property: 10, type: 13,
};

/**
 * Get LSP CompletionItems for a position in a hyperscript region.
 * @param {string} source
 * @param {number} offset
 * @param {Set<string>} cssClasses
 * @param {Set<string>} cssIds
 * @returns {Array}
 */
function getCompletions(source, offset, cssClasses, cssIds) {
  const items = parser.getCompletions(source, offset, [...cssClasses], [...cssIds]);
  return items.map(item => ({
    label: item.label,
    detail: item.detail,
    kind: KIND_MAP[item.kind] || 14,
  }));
}

module.exports = { getCompletions };
