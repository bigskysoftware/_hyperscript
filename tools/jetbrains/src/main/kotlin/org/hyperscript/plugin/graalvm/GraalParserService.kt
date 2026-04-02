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
    val end: Int?,
    val expected: List<String>? = null
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

            // Load shared browser stubs, IIFE, and tree walker from resources
            val stubs = javaClass.getResourceAsStream("/hyperscript/browser-stubs.js")?.bufferedReader()?.readText()
                ?: error("Could not load browser-stubs.js")
            val walker = javaClass.getResourceAsStream("/hyperscript/tree-walker.js")?.bufferedReader()?.readText()
                ?: error("Could not load tree-walker.js")

            ctx.eval("js", stubs)
            ctx.eval("js", iifeSource)
            ctx.eval("js", walker)

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
            // Pass source via a global to avoid escaping issues
            ctx.getBindings("js").putMember("__src", source)
            val result = ctx.eval("js", "__hsParseAndWalk(__src)")
            readParseResult(result)
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

    private fun readParseResult(parsed: org.graalvm.polyglot.Value): ParseResult {
        val ok = parsed.getMember("ok")?.asBoolean() ?: false

        val errors = mutableListOf<ParseError>()
        val errorsArr = parsed.getMember("errors")
        if (errorsArr != null && errorsArr.hasArrayElements()) {
            for (i in 0 until errorsArr.arraySize) {
                val e = errorsArr.getArrayElement(i)
                val expectedArr = e.getMember("expected")?.let { exp ->
                    if (exp.isNull || !exp.hasArrayElements()) null
                    else (0 until exp.arraySize).map { i -> exp.getArrayElement(i).asString() }
                }
                errors.add(ParseError(
                    message = e.getMember("message")?.asString() ?: "Parse error",
                    line = e.getMember("line")?.let { if (it.isNull) null else it.asInt() },
                    column = e.getMember("column")?.let { if (it.isNull) null else it.asInt() },
                    start = e.getMember("start")?.let { if (it.isNull) null else it.asInt() },
                    end = e.getMember("end")?.let { if (it.isNull) null else it.asInt() },
                    expected = expectedArr
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

}
