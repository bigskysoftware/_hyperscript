package org.hyperscript.plugin.graalvm

import com.intellij.openapi.components.Service
import com.intellij.openapi.diagnostic.Logger
import com.intellij.openapi.project.Project
import com.intellij.openapi.vfs.LocalFileSystem
import org.graalvm.polyglot.Context
import org.graalvm.polyglot.PolyglotException
import java.io.File

data class ParseError(
    val message: String,
    val line: Int?,
    val column: Int?
)

data class ParseResult(
    val success: Boolean,
    val errors: List<ParseError> = emptyList()
)

/**
 * Project-level service managing a GraalVM JS context with the hyperscript parser loaded.
 * Call parse() to check hyperscript source for syntax errors.
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
            """.trimIndent())

            ctx.eval("js", iifeSource)
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
     * Parse a hyperscript source string and return any errors.
     * Thread-safe: GraalVM contexts are thread-bound, so we synchronize.
     */
    @Synchronized
    fun parse(source: String): ParseResult {
        ensureInitialized()

        val ctx = context ?: return ParseResult(
            success = false,
            errors = listOf(ParseError(initError ?: "Parser not available", null, null))
        )

        if (source.isBlank()) return ParseResult(success = true)

        return try {
            // Escape the source for embedding in a JS string
            val escaped = source
                .replace("\\", "\\\\")
                .replace("'", "\\'")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t")

            val jsCode = """
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
            """.trimIndent()

            val result = ctx.eval("js", jsCode)
            val json = result.asString()

            parseJsonResult(json)
        } catch (e: PolyglotException) {
            ParseResult(
                success = false,
                errors = listOf(ParseError(e.message ?: "Parse error", null, null))
            )
        } catch (e: Exception) {
            ParseResult(
                success = false,
                errors = listOf(ParseError(e.message ?: "Unknown error", null, null))
            )
        }
    }

    private fun parseJsonResult(json: String): ParseResult {
        if (json.contains("\"ok\":true") || json.contains("\"ok\": true")) {
            return ParseResult(success = true)
        }

        // Extract all errors from the errors array
        val errors = mutableListOf<ParseError>()
        val errorPattern = "\"message\"\\s*:\\s*\"((?:[^\"\\\\]|\\\\.)*)\"".toRegex()
        val linePattern = "\"line\"\\s*:\\s*(\\d+)".toRegex()
        val colPattern = "\"column\"\\s*:\\s*(\\d+)".toRegex()

        // Split by error objects (simple approach: find all message fields)
        val messages = errorPattern.findAll(json).toList()
        val lines = linePattern.findAll(json).toList()
        val cols = colPattern.findAll(json).toList()

        for (i in messages.indices) {
            val msg = messages[i].groupValues[1]
                .replace("\\\"", "\"")
                .replace("\\\\", "\\")
            val line = lines.getOrNull(i)?.groupValues?.get(1)?.toIntOrNull()
            val col = cols.getOrNull(i)?.groupValues?.get(1)?.toIntOrNull()
            errors.add(ParseError(msg, line, col))
        }

        if (errors.isEmpty()) {
            errors.add(ParseError("Parse error", null, null))
        }

        return ParseResult(success = false, errors = errors)
    }

    private fun extractJsonString(json: String, key: String): String? {
        val pattern = "\"$key\"\\s*:\\s*\"((?:[^\"\\\\]|\\\\.)*)\"".toRegex()
        return pattern.find(json)?.groupValues?.get(1)
            ?.replace("\\\"", "\"")
            ?.replace("\\\\", "\\")
    }

    private fun extractJsonInt(json: String, key: String): Int? {
        val pattern = "\"$key\"\\s*:\\s*(\\d+)".toRegex()
        return pattern.find(json)?.groupValues?.get(1)?.toIntOrNull()
    }

    fun dispose() {
        context?.close()
        context = null
        initialized = false
    }
}
