package org.hyperscript.plugin.lexer

import com.intellij.lexer.LexerBase
import com.intellij.psi.tree.IElementType

/**
 * Hand-written lexer for hyperscript syntax highlighting.
 * Recognizes keywords, strings, numbers, comments, CSS refs, operators, etc.
 */
class HyperscriptLexer : LexerBase() {

    private var buffer: CharSequence = ""
    private var startOffset = 0
    private var endOffset = 0
    private var position = 0
    private var tokenStart = 0
    private var tokenEnd = 0
    private var tokenType: IElementType? = null

    override fun start(buffer: CharSequence, startOffset: Int, endOffset: Int, initialState: Int) {
        this.buffer = buffer
        this.startOffset = startOffset
        this.endOffset = endOffset
        this.position = startOffset
        this.tokenStart = startOffset
        this.tokenEnd = startOffset
        this.tokenType = null
        advance()
    }

    override fun getState() = 0

    override fun getTokenType() = tokenType

    override fun getTokenStart() = tokenStart

    override fun getTokenEnd() = tokenEnd

    override fun getBufferSequence() = buffer

    override fun getBufferEnd() = endOffset

    override fun advance() {
        if (position >= endOffset) {
            tokenType = null
            return
        }

        tokenStart = position
        val c = buffer[position]

        when {
            // Whitespace
            c.isWhitespace() -> readWhitespace()

            // Line comment: --
            c == '-' && peek(1) == '-' -> readLineComment()

            // Block comment: /* ... */
            c == '/' && peek(1) == '*' -> readBlockComment()

            // Strings
            c == '\'' || c == '"' -> readString(c)

            // Template strings
            c == '`' -> readTemplateString()

            // CSS selector: <tag/>
            c == '<' && peekIsAlpha(1) -> readCssSelector()

            // Attribute ref: @name
            c == '@' -> readAttributeRef()

            // CSS id: #name or just # (for completion)
            c == '#' && (peekIsAlphaOrDash(1) || peek(1) == null || peek(1)?.isWhitespace() == true || peek(1) == '"' || peek(1) == '\'') -> readCssId()

            // Numbers
            c.isDigit() -> readNumber()

            // Dot followed by alpha = CSS class ref
            c == '.' && peekIsAlpha(1) -> readCssClass()

            // Identifiers and keywords
            c.isLetter() || c == '_' || c == '$' -> readWord()

            // Punctuation
            c in "(){}[],:;?&" -> {
                position++
                tokenEnd = position
                tokenType = HyperscriptTokenTypes.PUNCTUATION
            }

            // Multi-char operators
            c == '!' && peek(1) == '=' && peek(2) == '=' -> { position += 3; tokenEnd = position; tokenType = HyperscriptTokenTypes.OPERATOR }
            c == '=' && peek(1) == '=' && peek(2) == '=' -> { position += 3; tokenEnd = position; tokenType = HyperscriptTokenTypes.OPERATOR }
            c == '!' && peek(1) == '=' -> { position += 2; tokenEnd = position; tokenType = HyperscriptTokenTypes.OPERATOR }
            c == '=' && peek(1) == '=' -> { position += 2; tokenEnd = position; tokenType = HyperscriptTokenTypes.OPERATOR }
            c == '<' && peek(1) == '=' -> { position += 2; tokenEnd = position; tokenType = HyperscriptTokenTypes.OPERATOR }
            c == '>' && peek(1) == '=' -> { position += 2; tokenEnd = position; tokenType = HyperscriptTokenTypes.OPERATOR }
            c == '-' && peek(1) == '>' -> { position += 2; tokenEnd = position; tokenType = HyperscriptTokenTypes.OPERATOR }
            c == '.' && peek(1) == '.' -> { position += 2; tokenEnd = position; tokenType = HyperscriptTokenTypes.OPERATOR }

            // Single-char operators
            c in "+-*/%=<>|\\!~^.\$" -> {
                position++
                tokenEnd = position
                tokenType = HyperscriptTokenTypes.OPERATOR
            }

            // Anything else
            else -> {
                position++
                tokenEnd = position
                tokenType = HyperscriptTokenTypes.BAD_CHARACTER
            }
        }
    }

    private fun peek(offset: Int): Char? {
        val idx = position + offset
        return if (idx < endOffset) buffer[idx] else null
    }

    private fun peekIsAlpha(offset: Int): Boolean {
        val ch = peek(offset) ?: return false
        return ch.isLetter()
    }

    private fun peekIsAlphaOrDash(offset: Int): Boolean {
        val ch = peek(offset) ?: return false
        return ch.isLetter() || ch == '-' || ch == '_'
    }

    private fun readWhitespace() {
        while (position < endOffset && buffer[position].isWhitespace()) position++
        tokenEnd = position
        tokenType = HyperscriptTokenTypes.WHITESPACE
    }

    private fun readLineComment() {
        // Skip --
        position += 2
        while (position < endOffset && buffer[position] != '\n') position++
        tokenEnd = position
        tokenType = HyperscriptTokenTypes.LINE_COMMENT
    }

    private fun readBlockComment() {
        // Skip /*
        position += 2
        while (position < endOffset) {
            if (buffer[position] == '*' && peek(1) == '/') {
                position += 2
                break
            }
            position++
        }
        tokenEnd = position
        tokenType = HyperscriptTokenTypes.BLOCK_COMMENT
    }

    private fun readString(quote: Char) {
        position++ // skip opening quote
        while (position < endOffset) {
            val ch = buffer[position]
            if (ch == '\\') {
                position += 2 // skip escape
                continue
            }
            if (ch == quote) {
                position++
                break
            }
            if (ch == '\n') break // hyperscript strings don't span lines
            position++
        }
        tokenEnd = position
        tokenType = HyperscriptTokenTypes.STRING
    }

    private fun readTemplateString() {
        position++ // skip opening backtick
        while (position < endOffset) {
            val ch = buffer[position]
            if (ch == '\\') {
                position += 2
                continue
            }
            if (ch == '`') {
                position++
                break
            }
            position++
        }
        tokenEnd = position
        tokenType = HyperscriptTokenTypes.TEMPLATE_STRING
    }

    private fun readCssSelector() {
        // <tagName/>  or  <tagName />
        position++ // skip <
        while (position < endOffset) {
            val ch = buffer[position]
            if (ch == '>') {
                position++
                break
            }
            if (ch == '/' && peek(1) == '>') {
                position += 2
                break
            }
            if (ch.isWhitespace() && ch == '\n') break
            position++
        }
        tokenEnd = position
        tokenType = HyperscriptTokenTypes.CSS_SELECTOR
    }

    private fun readAttributeRef() {
        position++ // skip @
        while (position < endOffset && (buffer[position].isLetterOrDigit() || buffer[position] in "-_")) position++
        tokenEnd = position
        tokenType = HyperscriptTokenTypes.ATTRIBUTE_REF
    }

    private fun readCssId() {
        position++ // skip #
        while (position < endOffset && (buffer[position].isLetterOrDigit() || buffer[position] in "-_$")) position++
        tokenEnd = position
        tokenType = HyperscriptTokenTypes.CSS_ID
    }

    private fun readCssClass() {
        position++ // skip .
        while (position < endOffset && (buffer[position].isLetterOrDigit() || buffer[position] in "-_$")) position++
        tokenEnd = position
        tokenType = HyperscriptTokenTypes.CSS_CLASS
    }

    private fun readNumber() {
        while (position < endOffset && buffer[position].isDigit()) position++
        // Decimal part
        if (position < endOffset && buffer[position] == '.' && peek(1)?.isDigit() == true) {
            position++ // skip .
            while (position < endOffset && buffer[position].isDigit()) position++
        }
        // Time suffixes: s, ms
        if (position < endOffset) {
            if (buffer[position] == 'm' && peek(1) == 's') {
                position += 2
            } else if (buffer[position] == 's' && peek(1)?.isLetter() != true) {
                position++
            }
        }
        tokenEnd = position
        tokenType = HyperscriptTokenTypes.NUMBER
    }

    private fun readWord() {
        while (position < endOffset && (buffer[position].isLetterOrDigit() || buffer[position] == '_' || buffer[position] == '$')) {
            position++
        }
        tokenEnd = position
        val word = buffer.subSequence(tokenStart, tokenEnd).toString()

        tokenType = when {
            word in HyperscriptTokenTypes.BOOLEANS -> HyperscriptTokenTypes.BOOLEAN
            word in HyperscriptTokenTypes.KEYWORDS -> HyperscriptTokenTypes.KEYWORD
            word in HyperscriptTokenTypes.BUILTINS -> HyperscriptTokenTypes.BUILTIN
            word in HyperscriptTokenTypes.MODIFIERS -> HyperscriptTokenTypes.MODIFIER
            else -> HyperscriptTokenTypes.IDENTIFIER
        }
    }
}
