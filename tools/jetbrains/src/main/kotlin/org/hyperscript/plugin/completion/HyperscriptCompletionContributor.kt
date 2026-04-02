package org.hyperscript.plugin.completion

import com.intellij.codeInsight.completion.*
import com.intellij.codeInsight.lookup.LookupElementBuilder
import com.intellij.openapi.components.service
import com.intellij.patterns.PlatformPatterns
import com.intellij.psi.PsiFile
import com.intellij.psi.util.PsiTreeUtil
import com.intellij.psi.xml.XmlAttribute
import com.intellij.util.ProcessingContext
import org.hyperscript.plugin.HyperscriptLanguage
import org.hyperscript.plugin.graalvm.GraalParserService
import org.hyperscript.plugin.graalvm.TreeNode
import org.hyperscript.plugin.lexer.HyperscriptLexer

class HyperscriptCompletionContributor : CompletionContributor() {
    init {
        extend(
            CompletionType.BASIC,
            PlatformPatterns.psiElement().withLanguage(HyperscriptLanguage.INSTANCE),
            HyperscriptCompletionProvider()
        )
    }
}

/**
 * Context-sensitive completion provider.
 *
 * Primary strategy: parse the text before cursor via GraalVM, walk the
 * parse tree to find the deepest node at cursor, use FailedCommand/FailedFeature
 * keyword and node types for context.
 *
 * Fallback: lexer-based heuristics when the tree doesn't give a clear answer.
 */
private class HyperscriptCompletionProvider : CompletionProvider<CompletionParameters>() {

    /** Tokenize text and return non-whitespace tokens as (type, value) pairs */
    private fun tokenize(text: String): List<Pair<String, String>> {
        val lexer = HyperscriptLexer()
        val tokens = mutableListOf<Pair<String, String>>()
        lexer.start(text, 0, text.length, 0)
        while (lexer.tokenType != null) {
            val type = lexer.tokenType!!.toString()
            if (type != "WHITESPACE") {
                tokens.add(type to text.substring(lexer.tokenStart, lexer.tokenEnd))
            }
            lexer.advance()
        }
        return tokens
    }

    /** Extract CSS classes from the host HTML file */
    private fun extractCssClasses(hostFile: PsiFile?): Set<String> {
        if (hostFile == null) return emptySet()
        val classes = mutableSetOf<String>()
        PsiTreeUtil.findChildrenOfType(hostFile, XmlAttribute::class.java).forEach { attr ->
            if (attr.name == "class") {
                attr.value?.split(Regex("\\s+"))?.filter { it.isNotBlank() }?.forEach { classes.add(it) }
            }
        }
        return classes
    }

    /** Extract element IDs from the host HTML file */
    private fun extractIds(hostFile: PsiFile?): Set<String> {
        if (hostFile == null) return emptySet()
        val ids = mutableSetOf<String>()
        PsiTreeUtil.findChildrenOfType(hostFile, XmlAttribute::class.java).forEach { attr ->
            if (attr.name == "id") {
                attr.value?.let { if (it.isNotBlank()) ids.add(it) }
            }
        }
        return ids
    }

    /** Get the host HTML file from an injected hyperscript context */
    private fun getHostFile(parameters: CompletionParameters): PsiFile? {
        val injectedFile = parameters.position.containingFile ?: return null
        val injectionHost = com.intellij.psi.impl.source.tree.injected.InjectedLanguageUtil
            .getTopLevelFile(injectedFile)
        return if (injectionHost !== injectedFile) injectionHost else null
    }

    // ================================================================
    // Tree-based context detection
    // ================================================================

    /**
     * Find the deepest node in the tree that contains the given offset.
     * Returns the path from root to deepest node.
     */
    private fun findNodePath(node: TreeNode, offset: Int): List<TreeNode> {
        val path = mutableListOf(node)

        // Find deepest child that contains offset
        for (child in node.children) {
            val childStart = child.start ?: continue
            val childEnd = child.end ?: continue
            if (offset in childStart..childEnd) {
                path.addAll(findNodePath(child, offset))
                return path
            }
        }

        // Also check: if offset is past the last child's end, we're at the end
        // of this node — still in its scope
        return path
    }

    /**
     * Determine completion context from the parse tree at cursor position.
     * Returns null if the tree doesn't give a clear enough answer (fall back to lexer).
     */
    private fun contextFromTree(tree: TreeNode, cursorOffset: Int): CompletionContext? {
        val path = findNodePath(tree, cursorOffset)
        if (path.isEmpty()) return null

        val deepest = path.last()
        val parentType = if (path.size >= 2) path[path.size - 2].type else null

        // FailedCommand — the keyword tells us what command was being parsed
        if (deepest.type == "failedCommand") {
            return contextForFailedCommand(deepest.keyword, path)
        }

        // FailedFeature — the keyword tells us what feature was being parsed
        if (deepest.type == "failedFeature") {
            return contextForFailedFeature(deepest.keyword)
        }

        // At the end of a successfully parsed feature — offer commands
        // Check if cursor is past all children in an on/init/def feature
        if (deepest.type in setOf("onFeature", "defFeature", "initFeature")) {
            return CompletionContext.COMMAND
        }

        // Inside a command list — offer commands
        if (deepest.type == "emptyCommandListCommand") {
            return CompletionContext.COMMAND
        }

        // At root level (hyperscript program) — offer features
        if (deepest.type == "hyperscript") {
            return CompletionContext.FEATURE_START
        }

        return null
    }

    /** Map a failed command keyword to the appropriate completion context */
    private fun contextForFailedCommand(keyword: String?, path: List<TreeNode>): CompletionContext {
        return when (keyword) {
            // Commands that failed while parsing — offer their grammar continuations
            "toggle", "add", "remove", "take" -> CompletionContext.CLASS_OR_ATTRIBUTE
            "put" -> CompletionContext.EXPRESSION  // put <expr> into/after/before...
            "set" -> CompletionContext.EXPRESSION
            "get", "call" -> CompletionContext.EXPRESSION
            "send", "trigger" -> CompletionContext.EVENT_NAME
            "fetch" -> CompletionContext.NONE  // expects URL
            "go" -> CompletionContext.GO_ARG
            "make" -> CompletionContext.MAKE_ARG
            "wait" -> CompletionContext.WAIT_ARG
            "repeat", "for" -> CompletionContext.REPEAT_ARG
            "if", "unless", "while", "until", "when" -> CompletionContext.EXPRESSION
            "tell" -> CompletionContext.EXPRESSION
            "transition" -> CompletionContext.EXPRESSION
            "log" -> CompletionContext.EXPRESSION
            "show", "hide" -> CompletionContext.EXPRESSION
            "as" -> CompletionContext.TYPE_NAME
            "default" -> CompletionContext.EXPRESSION
            "increment", "decrement" -> CompletionContext.EXPRESSION
            // Unknown command keyword — probably a typo, offer commands
            else -> CompletionContext.COMMAND
        }
    }

    /** Map a failed feature keyword to the appropriate completion context */
    private fun contextForFailedFeature(keyword: String?): CompletionContext {
        return when (keyword) {
            "on" -> CompletionContext.EVENT_NAME
            "def" -> CompletionContext.NONE  // expects function name
            "behavior" -> CompletionContext.NONE  // expects behavior name
            "set" -> CompletionContext.EXPRESSION
            "init" -> CompletionContext.COMMAND
            else -> CompletionContext.FEATURE_START
        }
    }

    // ================================================================
    // Lexer-based context detection (fallback)
    // ================================================================

    /** Determine the completion context from tokens before cursor */
    private fun contextFromLexer(tokens: List<Pair<String, String>>): CompletionContext {
        if (tokens.isEmpty()) return CompletionContext.FEATURE_START

        val last = tokens.last()
        val lastVal = last.second
        val lastType = last.first
        val secondLast = tokens.getOrNull(tokens.size - 2)

        if (lastType == "OPERATOR" && lastVal == ".") return CompletionContext.CSS_CLASS
        if (lastType == "CSS_CLASS") return CompletionContext.CSS_CLASS
        if (lastType == "OPERATOR" && lastVal == "#") return CompletionContext.CSS_ID
        if (lastType == "CSS_ID") return CompletionContext.CSS_ID

        if (lastVal == "on" && lastType == "KEYWORD") return CompletionContext.EVENT_NAME
        if (lastVal == "then") return CompletionContext.COMMAND
        if (lastVal == "end") return CompletionContext.FEATURE_START
        if (secondLast?.second == "on" && secondLast.first == "KEYWORD") return CompletionContext.POST_EVENT

        if (lastVal in setOf("from", "in", "to", "into", "at", "of", "over", "before", "after")) {
            return CompletionContext.TARGET
        }
        if (lastVal == "as") return CompletionContext.TYPE_NAME
        if (lastVal == "wait") return CompletionContext.WAIT_ARG
        if (lastVal == "repeat") return CompletionContext.REPEAT_ARG
        if (lastVal in setOf("if", "when", "unless", "while", "until")) return CompletionContext.EXPRESSION
        if (lastVal in setOf("toggle", "add", "remove", "take")) return CompletionContext.CLASS_OR_ATTRIBUTE
        if (lastVal in setOf("put", "set", "get", "log")) return CompletionContext.EXPRESSION
        if (lastVal in setOf("send", "trigger")) return CompletionContext.EVENT_NAME
        if (lastVal == "make") return CompletionContext.MAKE_ARG
        if (lastVal == "go") return CompletionContext.GO_ARG
        if (lastVal == "fetch") return CompletionContext.NONE
        if (lastVal == "is") return CompletionContext.IS_CHECK

        val commandIdx = tokens.indexOfLast { it.first == "KEYWORD" && it.second in COMMAND_NAMES }
        if (commandIdx >= 0) return CompletionContext.MID_COMMAND

        return CompletionContext.COMMAND
    }

    // ================================================================
    // Completion generation
    // ================================================================

    override fun addCompletions(
        parameters: CompletionParameters,
        context: ProcessingContext,
        result: CompletionResultSet
    ) {
        val text = parameters.position.containingFile?.text ?: return
        val offset = parameters.offset
        val beforeCursor = text.substring(0, minOf(offset, text.length))

        // Try tree-based context first
        var ctx: CompletionContext? = null
        var expectedTokens: List<String>? = null
        try {
            val project = parameters.position.project
            val service = project.service<GraalParserService>()
            val parseResult = service.parse(beforeCursor)
            // Check for structured expected tokens from parse errors
            if (parseResult.errors.isNotEmpty()) {
                expectedTokens = parseResult.errors.first().expected
            }
            if (parseResult.tree != null) {
                ctx = contextFromTree(parseResult.tree, beforeCursor.length)
            }
        } catch (_: Exception) {
            // Fall through to lexer-based
        }

        // Fall back to lexer-based heuristics
        if (ctx == null) {
            val tokens = tokenize(beforeCursor)
            ctx = contextFromLexer(tokens)
        }

        // Also check for CSS class/ID via lexer (tree won't help with these)
        val tokens = tokenize(beforeCursor)
        val lastToken = tokens.lastOrNull()
        if (lastToken != null) {
            if (lastToken.first == "CSS_CLASS" ||
                lastToken.first == "OPERATOR" && lastToken.second == ".") {
                ctx = CompletionContext.CSS_CLASS
            } else if (lastToken.first == "CSS_ID" ||
                lastToken.first == "OPERATOR" && lastToken.second == "#" ||
                lastToken.first == "BAD_CHARACTER" && lastToken.second == "#") {
                ctx = CompletionContext.CSS_ID
            }
        }

        // If the parser gave us structured expected tokens, use those directly
        if (expectedTokens != null && ctx != CompletionContext.CSS_CLASS && ctx != CompletionContext.CSS_ID) {
            for (token in expectedTokens) {
                val el = LookupElementBuilder.create(token).withTypeText("expected").bold()
                result.addElement(PrioritizedLookupElement.withPriority(el, 200.0))
            }
            return
        }

        when (ctx) {
            CompletionContext.FEATURE_START -> {
                addAll(result, FEATURES, bold = true, priority = 100.0)
                addAll(result, COMMANDS, priority = 50.0)
            }
            CompletionContext.EVENT_NAME -> {
                addEvents(result, priority = 100.0)
            }
            CompletionContext.POST_EVENT -> {
                addKeywords(result, listOf(
                    "from" to "filter by source element",
                    "elsewhere" to "only if target is not me",
                    "debounced at" to "debounce event",
                    "throttled at" to "throttle event",
                    "queue" to "queue strategy (all/first/last/none)",
                ), priority = 100.0)
                addAll(result, COMMANDS, priority = 80.0)
            }
            CompletionContext.COMMAND -> {
                addAll(result, COMMANDS, bold = true, priority = 100.0)
                addAll(result, CONTROL_FLOW, priority = 90.0)
            }
            CompletionContext.TARGET -> {
                addAll(result, TARGETS, bold = true, priority = 100.0)
                addAll(result, BUILTINS, priority = 80.0)
            }
            CompletionContext.EXPRESSION -> {
                addAll(result, BUILTINS, bold = true, priority = 100.0)
                addAll(result, TARGETS, priority = 80.0)
                addAll(result, EXPRESSION_KW, priority = 70.0)
            }
            CompletionContext.TYPE_NAME -> {
                addKeywords(result, TYPE_NAMES, priority = 100.0)
            }
            CompletionContext.WAIT_ARG -> {
                addKeywords(result, listOf("for" to "wait for an event"), priority = 100.0)
            }
            CompletionContext.REPEAT_ARG -> {
                addKeywords(result, listOf(
                    "forever" to "repeat indefinitely",
                    "for" to "repeat for each item",
                    "while" to "repeat while condition",
                    "until" to "repeat until condition",
                    "in" to "repeat for items in collection",
                ), priority = 100.0)
            }
            CompletionContext.CLASS_OR_ATTRIBUTE -> {
                val hostFile = getHostFile(parameters)
                for (cls in extractCssClasses(hostFile)) {
                    val el = LookupElementBuilder.create(".$cls").withTypeText("class").bold()
                    result.addElement(PrioritizedLookupElement.withPriority(el, 100.0))
                }
                for (id in extractIds(hostFile)) {
                    val el = LookupElementBuilder.create("#$id").withTypeText("id").bold()
                    result.addElement(PrioritizedLookupElement.withPriority(el, 90.0))
                }
                addKeywords(result, listOf(
                    "between" to "toggle between two values",
                    "on" to "target element",
                    "from" to "source element",
                    "to" to "target element",
                ), priority = 50.0)
            }
            CompletionContext.CSS_CLASS -> {
                val hostFile = getHostFile(parameters)
                for (cls in extractCssClasses(hostFile)) {
                    val el = LookupElementBuilder.create(cls).withTypeText("class").bold()
                    result.addElement(PrioritizedLookupElement.withPriority(el, 100.0))
                }
            }
            CompletionContext.CSS_ID -> {
                val hostFile = getHostFile(parameters)
                for (id in extractIds(hostFile)) {
                    val el = LookupElementBuilder.create(id).withTypeText("id").bold()
                    result.addElement(PrioritizedLookupElement.withPriority(el, 100.0))
                }
            }
            CompletionContext.MAKE_ARG -> {
                addKeywords(result, listOf(
                    "a" to "make a <tag/>",
                    "an" to "make an <tag/>",
                ), priority = 100.0)
            }
            CompletionContext.GO_ARG -> {
                addKeywords(result, listOf(
                    "to" to "navigate to URL",
                    "back" to "go back in history",
                    "forward" to "go forward in history",
                    "to url" to "navigate to URL",
                ), priority = 100.0)
            }
            CompletionContext.IS_CHECK -> {
                addKeywords(result, listOf(
                    "a" to "type check (is a String)",
                    "an" to "type check (is an Array)",
                    "not" to "negated check",
                    "empty" to "emptiness check",
                    "less than" to "comparison",
                    "greater than" to "comparison",
                    "less than or equal to" to "comparison",
                    "greater than or equal to" to "comparison",
                ), priority = 100.0)
            }
            CompletionContext.MID_COMMAND -> {
                addAll(result, MID_COMMAND_MODIFIERS, priority = 80.0)
                addAll(result, BUILTINS, priority = 70.0)
                addAll(result, TARGETS, priority = 60.0)
                addKeywords(result, listOf("then" to "chain next command"), priority = 90.0)
            }
            CompletionContext.NONE -> { /* no completions */ }
        }
    }

    private fun addAll(result: CompletionResultSet, items: List<Pair<String, String>>, bold: Boolean = false, priority: Double = 0.0) {
        for ((kw, desc) in items) {
            var el = LookupElementBuilder.create(kw).withTypeText(desc)
            if (bold) el = el.bold()
            result.addElement(PrioritizedLookupElement.withPriority(el, priority))
        }
    }

    private fun addKeywords(result: CompletionResultSet, items: List<Pair<String, String>>, bold: Boolean = false, priority: Double = 0.0) {
        addAll(result, items, bold, priority)
    }

    private fun addEvents(result: CompletionResultSet, priority: Double = 0.0) {
        for (event in EVENTS) {
            val el = LookupElementBuilder.create(event).withTypeText("event").bold()
            result.addElement(PrioritizedLookupElement.withPriority(el, priority))
        }
    }

    companion object {
        val COMMAND_NAMES = setOf(
            "add", "remove", "toggle", "set", "get", "put", "call", "send", "trigger",
            "take", "log", "return", "throw", "fetch", "go", "hide", "show", "wait",
            "halt", "exit", "tell", "transition", "settle", "make", "append", "pick",
            "default", "increment", "decrement", "measure", "focus", "blur", "swap",
            "morph", "continue", "break", "async",
        )

        val FEATURES = listOf(
            "on" to "event handler",
            "def" to "define a function",
            "init" to "run on initialization",
            "set" to "set a property",
            "behavior" to "reusable behavior",
            "install" to "install a behavior",
            "bind" to "bind a variable",
            "live" to "live-binding",
            "when" to "conditional feature",
            "js" to "inline JavaScript",
            "worker" to "web worker",
            "eventsource" to "SSE connection",
            "socket" to "WebSocket connection",
        )

        val COMMANDS = listOf(
            "add" to "add class/attribute",
            "remove" to "remove class/attribute",
            "toggle" to "toggle class/attribute",
            "set" to "set variable/property",
            "get" to "get a value",
            "put" to "put value into target",
            "call" to "call a function",
            "send" to "send an event",
            "trigger" to "trigger an event",
            "take" to "take class from siblings",
            "log" to "log to console",
            "return" to "return from function",
            "throw" to "throw an error",
            "fetch" to "fetch a URL",
            "go" to "navigate",
            "hide" to "hide element",
            "show" to "show element",
            "wait" to "wait for time/event",
            "halt" to "halt processing",
            "exit" to "exit handler",
            "tell" to "set target for commands",
            "transition" to "CSS transition",
            "settle" to "wait for transitions",
            "make" to "create element/object",
            "append" to "append to target",
            "pick" to "pick a value",
            "default" to "set default value",
            "increment" to "increment value",
            "decrement" to "decrement value",
            "measure" to "measure dimensions",
            "focus" to "focus element",
            "blur" to "blur element",
            "swap" to "swap content",
            "morph" to "morph content",
            "async" to "run asynchronously",
        )

        val CONTROL_FLOW = listOf(
            "if" to "conditional block",
            "else" to "else branch",
            "else if" to "else-if branch",
            "repeat" to "loop",
            "for" to "for loop",
            "continue" to "continue loop",
            "break" to "break loop",
            "end" to "end block",
            "then" to "chain command",
        )

        val TARGETS = listOf(
            "me" to "current element",
            "my" to "my property",
            "it" to "implicit result",
            "its" to "its property",
            "the" to "the <expression>",
            "closest" to "closest ancestor",
            "first" to "first match",
            "last" to "last match",
            "next" to "next sibling",
            "previous" to "previous sibling",
        )

        val BUILTINS = listOf(
            "me" to "current element",
            "it" to "implicit result",
            "result" to "last result",
            "event" to "current event",
            "target" to "event target",
            "detail" to "event detail",
            "body" to "document body",
            "true" to "boolean true",
            "false" to "boolean false",
            "null" to "null value",
        )

        val EXPRESSION_KW = listOf(
            "not" to "negation",
            "no" to "negation",
            "the" to "the <expression>",
            "closest" to "closest ancestor",
            "first" to "first match",
            "last" to "last match",
            "next" to "next sibling",
            "previous" to "previous sibling",
            "exists" to "existence check",
        )

        val MID_COMMAND_MODIFIERS = listOf(
            "from" to "source element",
            "in" to "target scope",
            "to" to "destination",
            "into" to "destination",
            "with" to "with modifier",
            "at" to "position",
            "on" to "target element",
            "as" to "type conversion",
            "by" to "amount",
            "of" to "property of",
            "over" to "iterate over",
            "before" to "position before",
            "after" to "position after",
        )

        val TYPE_NAMES = listOf(
            "String" to "convert to String",
            "Number" to "convert to Number",
            "Int" to "convert to Int",
            "Float" to "convert to Float",
            "Date" to "convert to Date",
            "Array" to "convert to Array",
            "Object" to "convert to Object",
            "JSON" to "convert to JSON",
            "HTML" to "convert to HTML Fragment",
            "Fragment" to "convert to Fragment",
            "Values" to "convert to Values",
            "Fixed:2" to "fixed decimal (2 places)",
        )

        val EVENTS = listOf(
            "click", "dblclick", "mousedown", "mouseup", "mouseover", "mouseout",
            "mousemove", "mouseenter", "mouseleave", "contextmenu",
            "keydown", "keyup", "keypress",
            "change", "input", "submit", "focus", "blur", "reset", "select",
            "load", "scroll", "resize",
            "touchstart", "touchend", "touchmove",
            "dragstart", "drag", "dragend", "dragover", "dragenter", "dragleave", "drop",
            "mutation", "intersection",
            "every", "htmx:afterSwap", "htmx:beforeRequest", "htmx:afterRequest",
            "htmx:configRequest", "htmx:beforeSwap",
        )
    }
}

private enum class CompletionContext {
    FEATURE_START,
    EVENT_NAME,
    POST_EVENT,
    COMMAND,
    TARGET,
    EXPRESSION,
    TYPE_NAME,
    WAIT_ARG,
    REPEAT_ARG,
    CLASS_OR_ATTRIBUTE,
    MAKE_ARG,
    GO_ARG,
    IS_CHECK,
    MID_COMMAND,
    CSS_CLASS,
    CSS_ID,
    NONE,
}
