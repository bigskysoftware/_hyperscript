package org.hyperscript.plugin.annotator

import com.intellij.lang.annotation.AnnotationHolder
import com.intellij.lang.annotation.Annotator
import com.intellij.lang.annotation.HighlightSeverity
import com.intellij.openapi.components.service
import com.intellij.openapi.util.TextRange
import com.intellij.psi.PsiElement
import com.intellij.psi.PsiFile
import org.hyperscript.plugin.HyperscriptLanguage
import org.hyperscript.plugin.graalvm.GraalParserService

/**
 * Annotator that runs the hyperscript parser via GraalVM and surfaces
 * parse errors as editor diagnostics. Works for both standalone .hs files
 * and injected hyperscript in HTML attributes.
 *
 * Only runs on the root PsiFile element to avoid re-parsing on every child.
 */
class HyperscriptAnnotator : Annotator {

    override fun annotate(element: PsiElement, holder: AnnotationHolder) {
        // Only annotate the file-level element, not every token
        if (element !is PsiFile) return
        if (element.language != HyperscriptLanguage.INSTANCE) return

        val source = element.text
        if (source.isNullOrBlank()) return

        val service = element.project.service<GraalParserService>()
        val result = service.parse(source)

        if (result.success) return

        for (error in result.errors) {
            val offset = computeOffset(source, error.line, error.column)
            val startOffset = offset.coerceIn(0, source.length)
            val endOffset = findTokenEnd(source, startOffset).coerceIn(startOffset, source.length)

            if (startOffset >= source.length) {
                holder.newAnnotation(HighlightSeverity.ERROR, error.message)
                    .range(element)
                    .create()
            } else {
                holder.newAnnotation(HighlightSeverity.ERROR, error.message)
                    .range(TextRange(startOffset, maxOf(endOffset, startOffset + 1)))
                    .create()
            }
        }
    }

    private fun computeOffset(source: String, line: Int?, column: Int?): Int {
        if (line == null) return 0
        var offset = 0
        var currentLine = 1
        while (offset < source.length && currentLine < line) {
            if (source[offset] == '\n') currentLine++
            offset++
        }
        if (column != null && column > 0) {
            offset += column
        }
        return offset.coerceIn(0, source.length)
    }

    private fun findTokenEnd(source: String, start: Int): Int {
        if (start >= source.length) return start
        var end = start
        if (source[end].isLetterOrDigit() || source[end] == '_') {
            while (end < source.length && (source[end].isLetterOrDigit() || source[end] == '_')) end++
        } else {
            end++
        }
        return end
    }
}
