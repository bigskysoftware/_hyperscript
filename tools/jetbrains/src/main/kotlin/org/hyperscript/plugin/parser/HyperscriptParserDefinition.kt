package org.hyperscript.plugin.parser

import com.intellij.lang.ASTNode
import com.intellij.lang.ParserDefinition
import com.intellij.lang.PsiParser
import com.intellij.lexer.Lexer
import com.intellij.openapi.project.Project
import com.intellij.psi.FileViewProvider
import com.intellij.psi.PsiElement
import com.intellij.psi.PsiFile
import com.intellij.psi.tree.IFileElementType
import com.intellij.psi.tree.TokenSet
import org.hyperscript.plugin.HyperscriptLanguage
import org.hyperscript.plugin.lexer.HyperscriptLexer
import org.hyperscript.plugin.lexer.HyperscriptTokenTypes

class HyperscriptParserDefinition : ParserDefinition {

    companion object {
        val FILE = IFileElementType(HyperscriptLanguage.INSTANCE)
        val COMMENTS = TokenSet.create(HyperscriptTokenTypes.LINE_COMMENT, HyperscriptTokenTypes.BLOCK_COMMENT)
        val STRINGS = TokenSet.create(HyperscriptTokenTypes.STRING, HyperscriptTokenTypes.TEMPLATE_STRING)
    }

    override fun createLexer(project: Project?): Lexer = HyperscriptLexer()

    override fun createParser(project: Project?): PsiParser = HyperscriptParser()

    override fun getFileNodeType(): IFileElementType = FILE

    override fun getCommentTokens(): TokenSet = COMMENTS

    override fun getStringLiteralElements(): TokenSet = STRINGS

    override fun createElement(node: ASTNode): PsiElement =
        com.intellij.psi.impl.source.tree.LeafPsiElement(node.elementType, node.text)

    override fun createFile(viewProvider: FileViewProvider): PsiFile =
        HyperscriptFile(viewProvider)
}
