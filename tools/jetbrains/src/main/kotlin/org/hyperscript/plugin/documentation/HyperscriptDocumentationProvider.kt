package org.hyperscript.plugin.documentation

import com.intellij.lang.documentation.AbstractDocumentationProvider
import com.intellij.openapi.components.service
import com.intellij.openapi.editor.Editor
import com.intellij.psi.PsiElement
import com.intellij.psi.PsiFile
import org.hyperscript.plugin.HyperscriptLanguage
import org.hyperscript.plugin.graalvm.GraalParserService

/**
 * Provides hover documentation for hyperscript keywords.
 * Delegates to the shared hover.js logic via GraalParserService.
 */
class HyperscriptDocumentationProvider : AbstractDocumentationProvider() {

    override fun getCustomDocumentationElement(
        editor: Editor,
        file: PsiFile,
        contextElement: PsiElement?,
        targetOffset: Int
    ): PsiElement? {
        if (contextElement == null) return null
        if (contextElement.language != HyperscriptLanguage.INSTANCE) return null
        val word = contextElement.text?.trim() ?: return null
        if (word.isBlank() || word.length > 50) return null

        val service = contextElement.project.service<GraalParserService>()
        return if (service.getHover(word) != null) contextElement else null
    }

    override fun generateDoc(element: PsiElement?, originalElement: PsiElement?): String? {
        val target = originalElement ?: element ?: return null
        val word = target.text?.trim() ?: return null
        if (word.isBlank() || word.length > 50) return null

        val service = target.project.service<GraalParserService>()
        val hover = service.getHover(word) ?: return null
        return buildHtml(hover)
    }

    override fun generateHoverDoc(element: PsiElement, originalElement: PsiElement?): String? {
        return generateDoc(element, originalElement)
    }

    override fun getQuickNavigateInfo(element: PsiElement?, originalElement: PsiElement?): String? {
        val target = originalElement ?: element ?: return null
        val word = target.text?.trim() ?: return null
        val service = target.project.service<GraalParserService>()
        val hover = service.getHover(word) ?: return null
        return "${hover.category}: ${hover.keyword}"
    }

    private fun buildHtml(hover: GraalParserService.HoverResult): String {
        val sb = StringBuilder()
        sb.append("<div>")
        sb.append("<h3><code>${hover.keyword}</code> <small>(${hover.category})</small></h3>")

        if (hover.syntax != null) {
            sb.append("<pre><code>")
            sb.append(escapeHtml(hover.syntax))
            sb.append("</code></pre>")
        }

        val desc = hover.description
            .replace(Regex("`([^`]+)`")) { "<code>${escapeHtml(it.groupValues[1])}</code>" }
            .replace("\n", " ")
        sb.append("<p>$desc</p>")

        sb.append("<p><small><a href=\"https://hyperscript.org/${hover.category}/${hover.keyword}\">hyperscript.org docs</a></small></p>")
        sb.append("</div>")
        return sb.toString()
    }

    private fun escapeHtml(text: String): String =
        text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
}
