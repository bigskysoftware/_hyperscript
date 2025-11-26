// Browser entry point - imports ES module and sets up global
import _hyperscript from './_hyperscript.js';

// Auto-initialize in browser
if (typeof document !== 'undefined') {
    _hyperscript.browserInit();
}

// Export for module users
export default _hyperscript;
export { _hyperscript };

// Also set on global for script tag usage
if (typeof self !== 'undefined') {
    self._hyperscript = _hyperscript;
}
