/**
 * Hyperscript parser wrapper.
 * Loads the IIFE in a Node VM context with shared browser stubs and tree walker.
 * Provides parse() that returns { ok, errors, tree }.
 */
const vm = require('vm');
const fs = require('fs');
const path = require('path');

const COMMON = path.join(__dirname, '..', '..', 'common');

let context = null;

/**
 * Initialize the parser.
 * @param {string|null} workspaceRoot - workspace root path for .hsrc lookup
 */
function init(workspaceRoot) {
  const iifeSource = loadIife(workspaceRoot);
  if (!iifeSource) throw new Error('Could not load hyperscript IIFE');

  const stubs = fs.readFileSync(path.join(COMMON, 'browser-stubs.js'), 'utf8');
  const walker = fs.readFileSync(path.join(COMMON, 'tree-walker.js'), 'utf8');

  context = vm.createContext({});
  vm.runInContext(stubs, context);
  vm.runInContext(iifeSource, context);
  vm.runInContext(walker, context);
}

function loadIife(workspaceRoot) {
  // Check .hsrc
  if (workspaceRoot) {
    const hsrcPath = path.join(workspaceRoot, '.hsrc');
    if (fs.existsSync(hsrcPath)) {
      const customPath = fs.readFileSync(hsrcPath, 'utf8').trim();
      const resolved = path.isAbsolute(customPath)
        ? customPath
        : path.join(workspaceRoot, customPath);
      if (fs.existsSync(resolved)) return fs.readFileSync(resolved, 'utf8');
    }
  }

  const bundled = path.join(COMMON, '_hyperscript.iife.js');
  if (fs.existsSync(bundled)) return fs.readFileSync(bundled, 'utf8');

  return null;
}

/**
 * Parse hyperscript source.
 * @param {string} source
 * @returns {{ ok: boolean, errors: Array, tree: object|null }}
 */
function parse(source) {
  if (!context) throw new Error('Parser not initialized');
  if (!source || !source.trim()) return { ok: true, errors: [], tree: null };

  try {
    // Pass source via a global to avoid escaping issues
    context.__src = source;
    const result = vm.runInContext('__hsParseAndWalk(__src)', context);
    delete context.__src;
    return result;
  } catch (e) {
    return { ok: false, errors: [{ message: e.message, line: null, column: null, start: null, end: null }], tree: null };
  }
}

module.exports = { init, parse };
