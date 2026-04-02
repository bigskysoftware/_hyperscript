package org.hyperscript.plugin

import org.graalvm.polyglot.Context
import org.junit.Assert.*
import org.junit.BeforeClass
import org.junit.Test

/**
 * Tests GraalVM parser integration without launching IntelliJ.
 * Run with: ./gradlew test
 */
class GraalParserTest {

    companion object {
        private lateinit var ctx: Context

        @BeforeClass
        @JvmStatic
        fun setup() {
            val iifeSource = GraalParserTest::class.java.getResource("/hyperscript/_hyperscript.iife.js")?.readText()
                ?: error("Could not load IIFE")

            ctx = Context.newBuilder("js")
                .allowAllAccess(false)
                .option("engine.WarnInterpreterOnly", "false")
                .build()

            ctx.eval("js", """
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
            """.trimIndent())

            ctx.eval("js", iifeSource)
        }

        private fun parse(source: String): String {
            val escaped = source
                .replace("\\", "\\\\")
                .replace("'", "\\'")
                .replace("\n", "\\n")
                .replace("\"", "\\\"")
            return ctx.eval("js", """
                (function() {
                    var result = self._hyperscript.parse('$escaped');
                    if (!result || (result.errors && result.errors.length > 0)) {
                        var errors = (result && result.errors) || [];
                        var items = [];
                        for (var i = 0; i < errors.length; i++) {
                            var e = errors[i];
                            items.push({
                                message: e.message || 'Parse error',
                                line: e.token ? e.token.line : null,
                                column: e.token ? e.token.column : null
                            });
                        }
                        return JSON.stringify({ ok: false, errors: items });
                    }
                    return JSON.stringify({ ok: true });
                })()
            """.trimIndent()).asString()
        }
    }

    @Test fun validToggle() {
        val r = parse("on click toggle .foo")
        assertTrue("Should parse: $r", r.contains("\"ok\":true"))
    }

    @Test fun validLog() {
        val r = parse("on click log 'hello'")
        assertTrue("Should parse: $r", r.contains("\"ok\":true"))
    }

    @Test fun validMultiCommand() {
        val r = parse("on click log 'hello' then toggle .active")
        assertTrue("Should parse: $r", r.contains("\"ok\":true"))
    }

    @Test fun validDef() {
        val r = parse("def foo() return 42 end")
        assertTrue("Should parse: $r", r.contains("\"ok\":true"))
    }

    @Test fun invalidCommand() {
        val r = parse("on click togg 'foo'")
        assertTrue("Should fail: $r", r.contains("\"ok\":false"))
        assertTrue("Should mention togg: $r", r.lowercase().contains("togg"))
    }

    @Test fun invalidSyntax() {
        val r = parse("on click toggle")
        assertTrue("Should fail: $r", r.contains("\"ok\":false"))
    }

    @Test fun errorHasPosition() {
        val r = parse("on click togg 'foo'")
        assertTrue("Should have column: $r", r.contains("\"column\""))
        assertTrue("Should have line: $r", r.contains("\"line\""))
    }
}
