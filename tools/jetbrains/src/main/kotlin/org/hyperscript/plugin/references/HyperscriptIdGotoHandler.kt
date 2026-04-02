package org.hyperscript.plugin.references

import com.intellij.codeInsight.navigation.actions.GotoDeclarationHandler
import com.intellij.openapi.editor.Editor
import com.intellij.psi.PsiElement
import com.intellij.psi.PsiFile
import com.intellij.psi.impl.source.tree.injected.InjectedLanguageUtil
import com.intellij.psi.util.PsiTreeUtil
import com.intellij.psi.xml.XmlAttribute
import com.intellij.psi.xml.XmlTag
import org.hyperscript.plugin.HyperscriptLanguage
import org.hyperscript.plugin.lexer.HyperscriptTokenTypes

/**
 * Cmd-B / Cmd-click handler for #id references in hyperscript.
 * Jumps to the HTML element with the matching id attribute.
 */
class HyperscriptIdGotoHandler : GotoDeclarationHandler {

    override fun getGotoDeclarationTargets(
        sourceElement: PsiElement?,
        offset: Int,
        editor: Editor?
    ): Array<PsiElement>? {
        if (sourceElement == null) return null
        if (sourceElement.language != HyperscriptLanguage.INSTANCE) return null

        // Check if this is a CSS_ID token
        val node = sourceElement.node ?: return null
        if (node.elementType != HyperscriptTokenTypes.CSS_ID) return null

        val text = sourceElement.text
        if (text.length < 2 || text[0] != '#') return null
        val idValue = text.substring(1)

        // Find the host HTML file
        val hostFile = getHostFile(sourceElement) ?: return null

        // Find the element with this id
        val attrs = PsiTreeUtil.findChildrenOfType(hostFile, XmlAttribute::class.java)
        for (attr in attrs) {
            if (attr.name == "id" && attr.value == idValue) {
                val tag = attr.parent as? XmlTag ?: return arrayOf(attr)
                return arrayOf(tag)
            }
        }

        return null
    }

    private fun getHostFile(element: PsiElement): PsiFile? {
        val injectedFile = element.containingFile ?: return null
        val hostFile = InjectedLanguageUtil.getTopLevelFile(injectedFile)
        return if (hostFile !== injectedFile) hostFile else null
    }
}
