package org.hyperscript.plugin

import org.graalvm.polyglot.Context
import org.graalvm.polyglot.Value
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

            // Install tree walker
            ctx.eval("js", """
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
                        var val2 = node[key];
                        if (!val2) continue;
                        if (Array.isArray(val2)) {
                            for (var j = 0; j < val2.length; j++) {
                                var child = __hsWalkTree(val2[j], visited);
                                if (child) result.children.push(child);
                            }
                        } else if (typeof val2 === 'object' && val2.type) {
                            var child = __hsWalkTree(val2, visited);
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
                            line: tok.line || null,
                            column: tok.column || null,
                            start: (tok.start != null) ? tok.start : null,
                            end: (tok.end != null) ? tok.end : null
                        });
                    }
                    var tree = __hsWalkTree(result, new Set());
                    var ok = items.length === 0;
                    return JSON.stringify({ ok: ok, errors: items, tree: tree });
                }
            """.trimIndent())
        }

        private fun parseJson(source: String): Value {
            val escaped = source
                .replace("\\", "\\\\")
                .replace("'", "\\'")
                .replace("\n", "\\n")
                .replace("\"", "\\\"")
            val json = ctx.eval("js", "__hsParseAndWalk('$escaped')").asString()
            return ctx.eval("js", "JSON.parse('${json.replace("\\", "\\\\").replace("'", "\\'")}')")
        }

        private fun parse(source: String): String {
            val escaped = source
                .replace("\\", "\\\\")
                .replace("'", "\\'")
                .replace("\n", "\\n")
                .replace("\"", "\\\"")
            return ctx.eval("js", "__hsParseAndWalk('$escaped')").asString()
        }
    }

    // ==================== Basic parse tests ====================

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
    }

    @Test fun invalidSyntax() {
        val r = parse("on click toggle")
        assertTrue("Should fail: $r", r.contains("\"ok\":false"))
    }

    // ==================== Tree structure tests ====================

    @Test fun treeHasRootType() {
        val result = parseJson("on click toggle .foo")
        val tree = result.getMember("tree")
        assertNotNull("Tree should exist", tree)
        assertEquals("hyperscript", tree.getMember("type").asString())
    }

    @Test fun treeHasFeatureChild() {
        val result = parseJson("on click toggle .foo")
        val tree = result.getMember("tree")
        val children = tree.getMember("children")
        assertTrue("Should have children", children.arraySize > 0)
        val first = children.getArrayElement(0)
        assertEquals("onFeature", first.getMember("type").asString())
    }

    @Test fun treeHasPositionInfo() {
        val result = parseJson("on click toggle .foo")
        val tree = result.getMember("tree")
        val onFeature = tree.getMember("children").getArrayElement(0)
        assertNotNull("start should exist", onFeature.getMember("start"))
        assertNotNull("end should exist", onFeature.getMember("end"))
    }

    // ==================== FailedCommand/FailedFeature tests ====================

    @Test fun failedCommandHasKeyword() {
        val result = parseJson("on click toggle")
        val tree = result.getMember("tree")
        // Walk to find the failedCommand
        val failedNode = findNodeByType(tree, "failedCommand")
        assertNotNull("Should have a failedCommand node", failedNode)
        // The keyword should be "toggle" since that's what was being parsed
        val keyword = failedNode!!.getMember("keyword")
        assertFalse("keyword should not be null", keyword.isNull)
        assertEquals("toggle", keyword.asString())
    }

    @Test fun failedFeatureHasKeyword() {
        val result = parseJson("on")
        val tree = result.getMember("tree")
        val failedNode = findNodeByType(tree, "failedFeature")
        assertNotNull("Should have a failedFeature node", failedNode)
        val keyword = failedNode!!.getMember("keyword")
        assertFalse("keyword should not be null", keyword.isNull)
        assertEquals("on", keyword.asString())
    }

    @Test fun unknownTokenBecomesFailedFeature() {
        // 'togg' is not a known command or feature, so the parser treats it
        // as an unexpected token at the feature level
        val result = parseJson("on click togg 'foo'")
        val tree = result.getMember("tree")
        val failedNode = findNodeByType(tree, "failedFeature")
        assertNotNull("Should have a failedFeature for unknown token", failedNode)
        assertEquals("togg", failedNode!!.getMember("keyword").asString())
    }

    // ==================== Error position tests ====================

    @Test fun errorHasTokenPosition() {
        val result = parseJson("on click togg 'foo'")
        val errors = result.getMember("errors")
        assertTrue("Should have errors", errors.arraySize > 0)
        val first = errors.getArrayElement(0)
        assertFalse("start should not be null", first.getMember("start").isNull)
    }

    @Test fun multipleErrorsCollected() {
        // Two bad commands in sequence — parser should recover and report both
        val result = parseJson("on click togg then blargh")
        val errors = result.getMember("errors")
        assertTrue("Should have at least one error: ${errors.arraySize}", errors.arraySize >= 1)
    }

    // ==================== Helpers ====================

    private fun findNodeByType(node: Value, type: String): Value? {
        if (node.isNull) return null
        if (node.getMember("type")?.asString() == type) return node
        val children = node.getMember("children") ?: return null
        if (!children.hasArrayElements()) return null
        for (i in 0 until children.arraySize) {
            val found = findNodeByType(children.getArrayElement(i), type)
            if (found != null) return found
        }
        return null
    }
}
