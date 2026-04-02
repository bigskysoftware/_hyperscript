/**
 * Browser API stubs for loading the hyperscript IIFE in non-browser environments.
 * Used by both the JetBrains plugin (GraalVM) and the LSP server (Node VM).
 * Evaluate this before loading the IIFE.
 */
var self = this;
var window = this;
var document = {
  addEventListener: function() {},
  removeEventListener: function() {},
  querySelector: function() { return null; },
  querySelectorAll: function() { return []; },
  createElement: function() { return { style: {} }; },
  body: { addEventListener: function() {} },
  readyState: 'complete'
};
var setTimeout = function() { return 0; };
var clearTimeout = function() {};
var setInterval = function() { return 0; };
var clearInterval = function() {};
var requestAnimationFrame = function(fn) { fn(); return 0; };
var cancelAnimationFrame = function() {};
var fetch = function() { return Promise.resolve({ text: function() { return Promise.resolve(''); } }); };
var MutationObserver = function() { this.observe = function() {}; this.disconnect = function() {}; };
var IntersectionObserver = function() { this.observe = function() {}; this.disconnect = function() {}; };
var ResizeObserver = function() { this.observe = function() {}; this.disconnect = function() {}; };
var CustomEvent = function(name, opts) { this.type = name; this.detail = opts ? opts.detail : null; };
var Event = function(name) { this.type = name; };
var EventTarget = function() {};
EventTarget.prototype.addEventListener = function() {};
EventTarget.prototype.removeEventListener = function() {};
EventTarget.prototype.dispatchEvent = function() {};
var Node = function() {};
var Element = function() {};
Element.prototype = Object.create(EventTarget.prototype);
var HTMLElement = function() {};
HTMLElement.prototype = Object.create(Element.prototype);
var getComputedStyle = function() { return {}; };
var navigator = { userAgent: '' };
var location = { href: '', protocol: 'https:', host: 'localhost' };
var console = { log: function(){}, warn: function(){}, error: function(){}, debug: function(){}, info: function(){} };
