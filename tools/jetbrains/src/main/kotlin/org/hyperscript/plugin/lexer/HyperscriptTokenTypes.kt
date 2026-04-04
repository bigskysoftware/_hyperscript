package org.hyperscript.plugin.lexer

import com.intellij.psi.tree.IElementType
import org.hyperscript.plugin.HyperscriptLanguage

object HyperscriptTokenTypes {
    @JvmField val KEYWORD = HyperscriptElementType("KEYWORD")
    @JvmField val MODIFIER = HyperscriptElementType("MODIFIER")
    @JvmField val BUILTIN = HyperscriptElementType("BUILTIN")
    @JvmField val IDENTIFIER = HyperscriptElementType("IDENTIFIER")
    @JvmField val STRING = HyperscriptElementType("STRING")
    @JvmField val TEMPLATE_STRING = HyperscriptElementType("TEMPLATE_STRING")
    @JvmField val NUMBER = HyperscriptElementType("NUMBER")
    @JvmField val LINE_COMMENT = HyperscriptElementType("LINE_COMMENT")
    @JvmField val BLOCK_COMMENT = HyperscriptElementType("BLOCK_COMMENT")
    @JvmField val CSS_CLASS = HyperscriptElementType("CSS_CLASS")
    @JvmField val CSS_ID = HyperscriptElementType("CSS_ID")
    @JvmField val CSS_SELECTOR = HyperscriptElementType("CSS_SELECTOR")
    @JvmField val ATTRIBUTE_REF = HyperscriptElementType("ATTRIBUTE_REF")
    @JvmField val OPERATOR = HyperscriptElementType("OPERATOR")
    @JvmField val PUNCTUATION = HyperscriptElementType("PUNCTUATION")
    @JvmField val BOOLEAN = HyperscriptElementType("BOOLEAN")
    @JvmField val WHITESPACE = HyperscriptElementType("WHITESPACE")
    @JvmField val BAD_CHARACTER = HyperscriptElementType("BAD_CHARACTER")

    val KEYWORDS = setOf(
        "on", "def", "set", "get", "put", "add", "remove", "toggle", "if", "else",
        "end", "then", "repeat", "for", "call", "send", "trigger", "take", "log",
        "return", "throw", "fetch", "go", "hide", "show", "wait", "halt", "exit",
        "tell", "transition", "settle", "make", "append", "pick", "default", "init",
        "install", "behavior", "js", "worker", "eventsource", "socket", "catch",
        "async", "measure", "while", "until", "swap", "morph", "focus", "blur",
        "empty", "open", "close", "render", "increment", "decrement", "continue",
        "break", "bind", "live", "when"
    )

    val MODIFIERS = setOf(
        "from", "in", "to", "with", "at", "as", "into", "by", "of", "the",
        "its", "my", "me", "it", "result", "no", "not", "and", "or", "is",
        "do", "closest", "first", "last", "next", "previous", "random",
        "local", "element", "global", "over", "before", "after", "am",
        "an", "a", "seconds", "milliseconds"
    )

    val BUILTINS = setOf(
        "I", "me", "my", "it", "its", "result", "event", "target", "detail",
        "body", "you", "your", "yourself", "String", "Number", "Int", "Float",
        "Date", "Array", "HTML", "Fragment", "JSON", "Object", "Values"
    )

    val BOOLEANS = setOf("true", "false", "null")
}

class HyperscriptElementType(debugName: String) :
    IElementType(debugName, HyperscriptLanguage.INSTANCE)
