package org.hyperscript.plugin.documentation

import com.intellij.lang.documentation.AbstractDocumentationProvider
import com.intellij.openapi.diagnostic.Logger
import com.intellij.openapi.editor.Editor
import com.intellij.psi.PsiElement
import com.intellij.psi.PsiFile
import com.intellij.psi.PsiManager
import org.hyperscript.plugin.HyperscriptLanguage

/**
 * Provides hover documentation for hyperscript keywords.
 * Documentation is extracted from www/commands/, www/features/, and www/expressions/.
 */
class HyperscriptDocumentationProvider : AbstractDocumentationProvider() {

    private val log = Logger.getInstance(HyperscriptDocumentationProvider::class.java)

    override fun getCustomDocumentationElement(
        editor: Editor,
        file: PsiFile,
        contextElement: PsiElement?,
        targetOffset: Int
    ): PsiElement? {
        if (contextElement == null) return null
        // Check if this is a hyperscript element (direct or injected)
        if (contextElement.language == HyperscriptLanguage.INSTANCE) {
            val word = contextElement.text?.trim() ?: return null
            if (HyperscriptDocs.get(word) != null) {
                return contextElement
            }
        }
        return null
    }

    override fun generateDoc(element: PsiElement?, originalElement: PsiElement?): String? {
        val target = originalElement ?: element ?: return null

        val word = target.text?.trim() ?: return null
        if (word.isBlank() || word.length > 50) return null

        log.info("generateDoc called for: '$word'")

        val entry = HyperscriptDocs.get(word) ?: return null
        return buildHtml(word, entry)
    }

    override fun generateHoverDoc(element: PsiElement, originalElement: PsiElement?): String? {
        return generateDoc(element, originalElement)
    }

    override fun getQuickNavigateInfo(element: PsiElement?, originalElement: PsiElement?): String? {
        val target = originalElement ?: element ?: return null
        val word = target.text?.trim() ?: return null
        val entry = HyperscriptDocs.get(word) ?: return null
        return "${entry.category}: $word"
    }

    private fun buildHtml(keyword: String, entry: HyperscriptDocs.DocEntry): String {
        val sb = StringBuilder()
        sb.append("<div>")
        sb.append("<h3><code>$keyword</code> <small>(${entry.category})</small></h3>")

        if (entry.syntax != null) {
            sb.append("<pre><code>")
            sb.append(escapeHtml(entry.syntax))
            sb.append("</code></pre>")
        }

        if (entry.description != null) {
            sb.append("<p>")
            val desc = entry.description
                .replace(Regex("`([^`]+)`")) { "<code>${escapeHtml(it.groupValues[1])}</code>" }
                .replace("\n", " ")
            sb.append(desc)
            sb.append("</p>")
        }

        sb.append("<p><small><a href=\"https://hyperscript.org/${entry.category}/$keyword\">hyperscript.org docs</a></small></p>")
        sb.append("</div>")
        return sb.toString()
    }

    private fun escapeHtml(text: String): String =
        text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
}
