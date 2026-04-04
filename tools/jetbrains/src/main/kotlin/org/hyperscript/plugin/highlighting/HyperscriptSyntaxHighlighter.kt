package org.hyperscript.plugin.highlighting

import com.intellij.lexer.Lexer
import com.intellij.openapi.editor.DefaultLanguageHighlighterColors
import com.intellij.openapi.editor.HighlighterColors
import com.intellij.openapi.editor.colors.TextAttributesKey
import com.intellij.openapi.editor.colors.TextAttributesKey.createTextAttributesKey
import com.intellij.openapi.fileTypes.SyntaxHighlighterBase
import com.intellij.psi.tree.IElementType
import org.hyperscript.plugin.lexer.HyperscriptLexer
import org.hyperscript.plugin.lexer.HyperscriptTokenTypes

class HyperscriptSyntaxHighlighter : SyntaxHighlighterBase() {

    companion object {
        val KEYWORD = createTextAttributesKey("HS_KEYWORD", DefaultLanguageHighlighterColors.KEYWORD)
        val MODIFIER = createTextAttributesKey("HS_MODIFIER", DefaultLanguageHighlighterColors.KEYWORD)
        val BUILTIN = createTextAttributesKey("HS_BUILTIN", DefaultLanguageHighlighterColors.PREDEFINED_SYMBOL)
        val STRING = createTextAttributesKey("HS_STRING", DefaultLanguageHighlighterColors.STRING)
        val TEMPLATE_STRING = createTextAttributesKey("HS_TEMPLATE_STRING", DefaultLanguageHighlighterColors.STRING)
        val NUMBER = createTextAttributesKey("HS_NUMBER", DefaultLanguageHighlighterColors.NUMBER)
        val LINE_COMMENT = createTextAttributesKey("HS_LINE_COMMENT", DefaultLanguageHighlighterColors.LINE_COMMENT)
        val BLOCK_COMMENT = createTextAttributesKey("HS_BLOCK_COMMENT", DefaultLanguageHighlighterColors.BLOCK_COMMENT)
        val CSS_SELECTOR = createTextAttributesKey("HS_CSS_SELECTOR", DefaultLanguageHighlighterColors.INSTANCE_FIELD)
        val CSS_CLASS = createTextAttributesKey("HS_CSS_CLASS", DefaultLanguageHighlighterColors.INSTANCE_FIELD)
        val CSS_ID = createTextAttributesKey("HS_CSS_ID", DefaultLanguageHighlighterColors.INSTANCE_FIELD)
        val ATTRIBUTE_REF = createTextAttributesKey("HS_ATTRIBUTE_REF", DefaultLanguageHighlighterColors.METADATA)
        val OPERATOR = createTextAttributesKey("HS_OPERATOR", DefaultLanguageHighlighterColors.OPERATION_SIGN)
        val PUNCTUATION = createTextAttributesKey("HS_PUNCTUATION", DefaultLanguageHighlighterColors.PARENTHESES)
        val BOOLEAN = createTextAttributesKey("HS_BOOLEAN", DefaultLanguageHighlighterColors.KEYWORD)
        val IDENTIFIER = createTextAttributesKey("HS_IDENTIFIER", DefaultLanguageHighlighterColors.IDENTIFIER)
        val BAD_CHARACTER = createTextAttributesKey("HS_BAD_CHARACTER", HighlighterColors.BAD_CHARACTER)

        private val TOKEN_MAP = mapOf(
            HyperscriptTokenTypes.KEYWORD to arrayOf(KEYWORD),
            HyperscriptTokenTypes.MODIFIER to arrayOf(MODIFIER),
            HyperscriptTokenTypes.BUILTIN to arrayOf(BUILTIN),
            HyperscriptTokenTypes.STRING to arrayOf(STRING),
            HyperscriptTokenTypes.TEMPLATE_STRING to arrayOf(TEMPLATE_STRING),
            HyperscriptTokenTypes.NUMBER to arrayOf(NUMBER),
            HyperscriptTokenTypes.LINE_COMMENT to arrayOf(LINE_COMMENT),
            HyperscriptTokenTypes.BLOCK_COMMENT to arrayOf(BLOCK_COMMENT),
            HyperscriptTokenTypes.CSS_SELECTOR to arrayOf(CSS_SELECTOR),
            HyperscriptTokenTypes.CSS_CLASS to arrayOf(CSS_CLASS),
            HyperscriptTokenTypes.CSS_ID to arrayOf(CSS_ID),
            HyperscriptTokenTypes.ATTRIBUTE_REF to arrayOf(ATTRIBUTE_REF),
            HyperscriptTokenTypes.OPERATOR to arrayOf(OPERATOR),
            HyperscriptTokenTypes.PUNCTUATION to arrayOf(PUNCTUATION),
            HyperscriptTokenTypes.BOOLEAN to arrayOf(BOOLEAN),
            HyperscriptTokenTypes.IDENTIFIER to arrayOf(IDENTIFIER),
            HyperscriptTokenTypes.BAD_CHARACTER to arrayOf(BAD_CHARACTER),
        )
    }

    override fun getHighlightingLexer(): Lexer = HyperscriptLexer()

    override fun getTokenHighlights(tokenType: IElementType?): Array<TextAttributesKey> =
        TOKEN_MAP[tokenType] ?: emptyArray()
}
