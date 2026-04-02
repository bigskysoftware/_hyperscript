package org.hyperscript.plugin.completion

import com.intellij.codeInsight.completion.*
import com.intellij.codeInsight.lookup.LookupElementBuilder
import com.intellij.icons.AllIcons
import com.intellij.patterns.PlatformPatterns
import com.intellij.psi.PsiFile
import com.intellij.psi.util.PsiTreeUtil
import com.intellij.psi.xml.XmlAttribute
import com.intellij.psi.xml.XmlTag
import com.intellij.util.ProcessingContext
import org.hyperscript.plugin.HyperscriptLanguage
import org.hyperscript.plugin.lexer.HyperscriptLexer
import org.hyperscript.plugin.lexer.HyperscriptTokenTypes

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
 * Uses the lexer to tokenize text before the cursor and determines
 * which completions are appropriate based on the preceding tokens.
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

    /** Determine the completion context from tokens before cursor */
    private fun determineContext(tokens: List<Pair<String, String>>): CompletionContext {
        if (tokens.isEmpty()) return CompletionContext.FEATURE_START

        val last = tokens.last()
        val lastVal = last.second
        val lastType = last.first
        val secondLast = tokens.getOrNull(tokens.size - 2)

        // After '.' (CSS class ref) → offer CSS classes from page
        if (lastType == "OPERATOR" && lastVal == ".") return CompletionContext.CSS_CLASS
        if (lastType == "CSS_CLASS") return CompletionContext.CSS_CLASS

        // After '#' (CSS id ref) → offer IDs from page
        if (lastType == "OPERATOR" && lastVal == "#") return CompletionContext.CSS_ID
        if (lastType == "CSS_ID") return CompletionContext.CSS_ID

        // After 'on' → event names
        if (lastVal == "on" && lastType == "KEYWORD") {
            return CompletionContext.EVENT_NAME
        }

        // After 'then' → commands
        if (lastVal == "then") {
            return CompletionContext.COMMAND
        }

        // After 'end' → new feature or more commands
        if (lastVal == "end") {
            return CompletionContext.FEATURE_START
        }

        // After event name (previous token was 'on') → event modifiers or commands
        if (secondLast?.second == "on" && secondLast.first == "KEYWORD") {
            return CompletionContext.POST_EVENT
        }

        // After target modifiers (from, in, to, into, on, at) → target expressions
        if (lastVal in setOf("from", "in", "to", "into", "at", "of", "over", "before", "after")) {
            return CompletionContext.TARGET
        }

        // After 'as' → type names
        if (lastVal == "as") {
            return CompletionContext.TYPE_NAME
        }

        // After 'wait' → time or 'for'
        if (lastVal == "wait") {
            return CompletionContext.WAIT_ARG
        }

        // After 'repeat' → loop modifiers
        if (lastVal == "repeat") {
            return CompletionContext.REPEAT_ARG
        }

        // After 'if' or 'else if' or 'when' → expressions
        if (lastVal == "if" || lastVal == "when" || lastVal == "unless" || lastVal == "while" || lastVal == "until") {
            return CompletionContext.EXPRESSION
        }

        // After 'toggle', 'add', 'remove', 'take' → class/attribute targets
        if (lastVal in setOf("toggle", "add", "remove", "take")) {
            return CompletionContext.CLASS_OR_ATTRIBUTE
        }

        // After 'put', 'set', 'get' → expressions
        if (lastVal in setOf("put", "set", "get")) {
            return CompletionContext.EXPRESSION
        }

        // After 'send', 'trigger' → event name to send
        if (lastVal in setOf("send", "trigger")) {
            return CompletionContext.EVENT_NAME
        }

        // After 'make' → 'a' or 'an'
        if (lastVal == "make") {
            return CompletionContext.MAKE_ARG
        }

        // After 'go' → 'to', 'back', 'forward'
        if (lastVal == "go") {
            return CompletionContext.GO_ARG
        }

        // After 'fetch' → expects URL (no completions)
        if (lastVal == "fetch") {
            return CompletionContext.NONE
        }

        // After 'log' → expression
        if (lastVal == "log") {
            return CompletionContext.EXPRESSION
        }

        // After 'is' → type checks or comparisons
        if (lastVal == "is") {
            return CompletionContext.IS_CHECK
        }

        // After a command that takes expressions (most identifiers after a command)
        // Check if we're mid-command (look back for a command keyword)
        val commandIdx = tokens.indexOfLast { it.first == "KEYWORD" && it.second in COMMAND_NAMES }
        if (commandIdx >= 0) {
            return CompletionContext.MID_COMMAND
        }

        // Default: probably at start of a new command
        return CompletionContext.COMMAND
    }

    override fun addCompletions(
        parameters: CompletionParameters,
        context: ProcessingContext,
        result: CompletionResultSet
    ) {
        val text = parameters.position.containingFile?.text ?: return
        val offset = parameters.offset

        // Tokenize everything before cursor (excluding the IntelliJ dummy identifier)
        val beforeCursor = text.substring(0, minOf(offset, text.length))
        val tokens = tokenize(beforeCursor)
        val ctx = determineContext(tokens)

        when (ctx) {
            CompletionContext.FEATURE_START -> {
                addAll(result, FEATURES, "feature", bold = true, priority = 100.0)
                addAll(result, COMMANDS, "command", priority = 50.0)
            }
            CompletionContext.EVENT_NAME -> {
                addEvents(result, priority = 100.0)
            }
            CompletionContext.POST_EVENT -> {
                // After "on click" — event modifiers, then commands
                addKeywords(result, listOf(
                    "from" to "filter by source element",
                    "elsewhere" to "only if target is not me",
                    "debounced at" to "debounce event",
                    "throttled at" to "throttle event",
                    "queue" to "queue strategy (all/first/last/none)",
                ), "modifier", priority = 100.0)
                addAll(result, COMMANDS, "command", priority = 80.0)
            }
            CompletionContext.COMMAND -> {
                addAll(result, COMMANDS, "command", bold = true, priority = 100.0)
                addAll(result, CONTROL_FLOW, "control", priority = 90.0)
            }
            CompletionContext.TARGET -> {
                addAll(result, TARGETS, "target", bold = true, priority = 100.0)
                addAll(result, BUILTINS, "value", priority = 80.0)
            }
            CompletionContext.EXPRESSION -> {
                addAll(result, BUILTINS, "value", bold = true, priority = 100.0)
                addAll(result, TARGETS, "target", priority = 80.0)
                addAll(result, EXPRESSION_KW, "keyword", priority = 70.0)
            }
            CompletionContext.TYPE_NAME -> {
                addKeywords(result, TYPE_NAMES, "type", priority = 100.0)
            }
            CompletionContext.WAIT_ARG -> {
                addKeywords(result, listOf(
                    "for" to "wait for an event",
                ), "keyword", priority = 100.0)
                // Time units will be typed as numbers
            }
            CompletionContext.REPEAT_ARG -> {
                addKeywords(result, listOf(
                    "forever" to "repeat indefinitely",
                    "for" to "repeat for each item",
                    "while" to "repeat while condition",
                    "until" to "repeat until condition",
                    "in" to "repeat for items in collection",
                ), "modifier", priority = 100.0)
            }
            CompletionContext.CLASS_OR_ATTRIBUTE -> {
                // Offer CSS classes/IDs from the page, plus modifiers
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
                    "on" to "target element",
                    "from" to "source element",
                    "to" to "target element",
                ), "modifier", priority = 50.0)
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
                ), "keyword", priority = 100.0)
            }
            CompletionContext.GO_ARG -> {
                addKeywords(result, listOf(
                    "to" to "navigate to URL",
                    "back" to "go back in history",
                    "forward" to "go forward in history",
                    "to url" to "navigate to URL",
                ), "modifier", priority = 100.0)
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
                ), "check", priority = 100.0)
            }
            CompletionContext.MID_COMMAND -> {
                // In the middle of a command — offer modifiers, targets, values
                addAll(result, MID_COMMAND_MODIFIERS, "modifier", priority = 80.0)
                addAll(result, BUILTINS, "value", priority = 70.0)
                addAll(result, TARGETS, "target", priority = 60.0)
                addKeywords(result, listOf("then" to "chain next command"), "flow", priority = 90.0)
            }
            CompletionContext.NONE -> { /* no completions */ }
        }
    }

    private fun addAll(result: CompletionResultSet, items: List<Pair<String, String>>, category: String, bold: Boolean = false, priority: Double = 0.0) {
        for ((kw, desc) in items) {
            var el = LookupElementBuilder.create(kw).withTypeText(desc)
            if (bold) el = el.bold()
            result.addElement(PrioritizedLookupElement.withPriority(el, priority))
        }
    }

    private fun addKeywords(result: CompletionResultSet, items: List<Pair<String, String>>, category: String, bold: Boolean = false, priority: Double = 0.0) {
        addAll(result, items, category, bold, priority)
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
    FEATURE_START,   // beginning of text or after 'end' — offer features
    EVENT_NAME,      // after 'on' — offer event names
    POST_EVENT,      // after 'on click' — offer event modifiers then commands
    COMMAND,         // command position — offer commands
    TARGET,          // after from/in/to/etc — offer target expressions
    EXPRESSION,      // expression position — offer values and targets
    TYPE_NAME,       // after 'as' — offer type names
    WAIT_ARG,        // after 'wait' — offer 'for' or time
    REPEAT_ARG,      // after 'repeat' — offer loop modifiers
    CLASS_OR_ATTRIBUTE, // after toggle/add/remove — .class or @attr
    MAKE_ARG,        // after 'make' — offer 'a'/'an'
    GO_ARG,          // after 'go' — offer 'to'/'back'/'forward'
    IS_CHECK,        // after 'is' — offer type checks/comparisons
    MID_COMMAND,     // mid-command — offer modifiers and values
    CSS_CLASS,       // after '.' — offer CSS classes from HTML
    CSS_ID,          // after '#' — offer IDs from HTML
    NONE,            // no completions
}
