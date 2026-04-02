package org.hyperscript.plugin.graalvm

import com.intellij.openapi.components.Service
import com.intellij.openapi.diagnostic.Logger
import com.intellij.openapi.project.Project
import java.io.File
import org.graalvm.polyglot.Context
import org.graalvm.polyglot.PolyglotException

data class ParseError(
    val message: String,
    val line: Int?,
    val column: Int?,
    val start: Int?,
    val end: Int?
)

data class TreeNode(
    val type: String,
    val keyword: String?,
    val start: Int?,
    val end: Int?,
    val children: List<TreeNode> = emptyList()
)

data class ParseResult(
    val success: Boolean,
    val errors: List<ParseError> = emptyList(),
    val tree: TreeNode? = null
)

/**
 * Project-level service managing a GraalVM JS context with the hyperscript parser loaded.
 * Call parse() to check hyperscript source for syntax errors and get parse tree info.
 */
@Service(Service.Level.PROJECT)
class GraalParserService(private val project: Project) {

    private val log = Logger.getInstance(GraalParserService::class.java)

    private var context: Context? = null
    private var initialized = false
    private var initError: String? = null

    @Synchronized
    private fun ensureInitialized() {
        if (initialized) return
        initialized = true

        try {
            val iifeSource = loadIifeSource()
            if (iifeSource == null) {
                initError = "Could not load hyperscript IIFE"
                return
            }

            val ctx = Context.newBuilder("js")
                .allowAllAccess(false)
                .option("engine.WarnInterpreterOnly", "false")
                .build()

            // Provide browser API stubs so the IIFE can load without a real DOM
            ctx.eval("js", BROWSER_STUBS)
            ctx.eval("js", iifeSource)

            // Install the tree-walking helper
            ctx.eval("js", TREE_WALKER_JS)

            context = ctx
            log.info("Hyperscript parser initialized successfully")
        } catch (e: Exception) {
            initError = e.message
            log.warn("Failed to initialize hyperscript parser", e)
        }
    }

    private fun loadIifeSource(): String? {
        // Check for .hsrc in project root
        val projectBase = project.basePath
        if (projectBase != null) {
            val hsrc = File(projectBase, ".hsrc")
            if (hsrc.exists()) {
                val customPath = hsrc.readText().trim()
                val customFile = if (File(customPath).isAbsolute) {
                    File(customPath)
                } else {
                    File(projectBase, customPath)
                }
                if (customFile.exists()) {
                    log.info("Loading hyperscript from .hsrc: ${customFile.absolutePath}")
                    return customFile.readText()
                }
                log.warn(".hsrc points to non-existent file: $customPath")
            }
        }

        // Fall back to bundled IIFE
        val stream = javaClass.getResourceAsStream("/hyperscript/_hyperscript.iife.js")
        return stream?.bufferedReader()?.readText()
    }

    /**
     * Parse a hyperscript source string and return errors + parse tree info.
     * Thread-safe: GraalVM contexts are thread-bound, so we synchronize.
     */
    @Synchronized
    fun parse(source: String): ParseResult {
        ensureInitialized()

        val ctx = context ?: return ParseResult(
            success = false,
            errors = listOf(ParseError(initError ?: "Parser not available", null, null, null, null))
        )

        if (source.isBlank()) return ParseResult(success = true)

        return try {
            val escaped = source
                .replace("\\", "\\\\")
                .replace("'", "\\'")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t")

            val jsCode = "__hsParseAndWalk('$escaped')"
            val result = ctx.eval("js", jsCode)
            val json = result.asString()
            parseJsonResult(json)
        } catch (e: PolyglotException) {
            ParseResult(
                success = false,
                errors = listOf(ParseError(e.message ?: "Parse error", null, null, null, null))
            )
        } catch (e: Exception) {
            ParseResult(
                success = false,
                errors = listOf(ParseError(e.message ?: "Unknown error", null, null, null, null))
            )
        }
    }

    private fun parseJsonResult(json: String): ParseResult {
        // Use GraalVM to parse JSON properly
        val ctx = context ?: return ParseResult(success = false)
        val parsed = ctx.eval("js", "JSON.parse('${json.replace("\\", "\\\\").replace("'", "\\'")}')")

        val ok = parsed.getMember("ok")?.asBoolean() ?: false

        val errors = mutableListOf<ParseError>()
        val errorsArr = parsed.getMember("errors")
        if (errorsArr != null && errorsArr.hasArrayElements()) {
            for (i in 0 until errorsArr.arraySize) {
                val e = errorsArr.getArrayElement(i)
                errors.add(ParseError(
                    message = e.getMember("message")?.asString() ?: "Parse error",
                    line = e.getMember("line")?.let { if (it.isNull) null else it.asInt() },
                    column = e.getMember("column")?.let { if (it.isNull) null else it.asInt() },
                    start = e.getMember("start")?.let { if (it.isNull) null else it.asInt() },
                    end = e.getMember("end")?.let { if (it.isNull) null else it.asInt() }
                ))
            }
        }

        val tree = parsed.getMember("tree")?.let { parseTreeNode(it) }

        return ParseResult(success = ok, errors = errors, tree = tree)
    }

    private fun parseTreeNode(node: org.graalvm.polyglot.Value): TreeNode? {
        if (node.isNull) return null
        val type = node.getMember("type")?.asString() ?: return null
        val keyword = node.getMember("keyword")?.let { if (it.isNull) null else it.asString() }
        val start = node.getMember("start")?.let { if (it.isNull) null else it.asInt() }
        val end = node.getMember("end")?.let { if (it.isNull) null else it.asInt() }

        val children = mutableListOf<TreeNode>()
        val childrenArr = node.getMember("children")
        if (childrenArr != null && childrenArr.hasArrayElements()) {
            for (i in 0 until childrenArr.arraySize) {
                parseTreeNode(childrenArr.getArrayElement(i))?.let { children.add(it) }
            }
        }

        return TreeNode(type, keyword, start, end, children)
    }

    fun dispose() {
        context?.close()
        context = null
        initialized = false
    }

    companion object {
        private const val BROWSER_STUBS = """
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
            var setTimeout = function(fn) { return 0; };
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
            var Promise = this.Promise || (function() {
                function P(fn) { fn(function(){}, function(){}); }
                P.resolve = function(v) { return new P(function(r){ r(v); }); };
                P.reject = function(v) { return new P(function(_, r){ r(v); }); };
                P.prototype.then = function(f) { return P.resolve(f()); };
                P.prototype.catch = function() { return this; };
                return P;
            })();
        """

        /**
         * JS function that parses source and walks the tree, returning a JSON
         * object with errors and a simplified tree structure.
         *
         * The tree includes node types, positions, and — critically — the
         * `keyword` field from FailedCommand/FailedFeature nodes which tells
         * the plugin what command/feature was being parsed when it failed.
         */
        private const val TREE_WALKER_JS = """
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

                // Walk known child properties
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

                // Walk the command chain via .next
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
        """
    }
}
