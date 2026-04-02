/**
 * Parse tree walker for hyperscript.
 * Used by both the JetBrains plugin (GraalVM) and the LSP server (Node VM).
 * Evaluate this after loading the IIFE.
 *
 * Provides __hsParseAndWalk(src) which returns:
 *   { ok: boolean, errors: [...], tree: { type, keyword, start, end, children } }
 *
 * The tree includes FailedCommand/FailedFeature nodes with their .keyword field,
 * which tells you what command/feature was being parsed when it failed.
 */
function __hsWalkTree(node, visited) {
  if (!node || typeof node !== 'object') return null;
  if (visited.has(node)) return null;
  visited.add(node);
  var result = {
    type: node.type || 'unknown',
    keyword: node.keyword || null,
    start: (node.startToken && node.startToken.start != null) ? node.startToken.start : null,
    end: (node.endToken && node.endToken.end != null) ? node.endToken.end : null,
    children: []
  };
  var childKeys = ['features', 'commands', 'start', 'root', 'next', 'body',
                   'conditional', 'thenBranch', 'elseBranch',
                   'args', 'expr', 'left', 'right', 'target'];
  for (var i = 0; i < childKeys.length; i++) {
    var key = childKeys[i];
    var val = node[key];
    if (!val) continue;
    if (Array.isArray(val)) {
      for (var j = 0; j < val.length; j++) {
        var child = __hsWalkTree(val[j], visited);
        if (child) result.children.push(child);
      }
    } else if (typeof val === 'object' && val.type) {
      var child = __hsWalkTree(val, visited);
      if (child) result.children.push(child);
    }
  }
  if (node.next && !visited.has(node.next)) {
    var nextChild = __hsWalkTree(node.next, visited);
    if (nextChild) result.children.push(nextChild);
  }
  return result;
}

function __hsParseAndWalk(src) {
  var result = self._hyperscript.parse(src);
  var errors = (result && result.errors) || [];
  var items = [];
  for (var i = 0; i < errors.length; i++) {
    var e = errors[i];
    var tok = e.token || {};
    items.push({
      message: e.message || 'Parse error',
      expected: e.expected || null,
      line: tok.line || null,
      column: tok.column || null,
      start: (tok.start != null) ? tok.start : null,
      end: (tok.end != null) ? tok.end : null
    });
  }
  var tree = __hsWalkTree(result, new Set());
  var ok = items.length === 0;
  return { ok: ok, errors: items, tree: tree };
}
