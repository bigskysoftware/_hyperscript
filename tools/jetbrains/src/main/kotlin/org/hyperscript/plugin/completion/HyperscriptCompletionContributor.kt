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
 * Completion provider that delegates to the shared JS completion logic
 * via GraalParserService. The JS handles parsing, tree-walking, context
 * detection, and expected token extraction.
 */
private class HyperscriptCompletionProvider : CompletionProvider<CompletionParameters>() {

    private fun extractCssClasses(hostFile: PsiFile?): List<String> {
        if (hostFile == null) return emptyList()
        val classes = mutableSetOf<String>()
        PsiTreeUtil.findChildrenOfType(hostFile, XmlAttribute::class.java).forEach { attr ->
            if (attr.name == "class") {
                attr.value?.split(Regex("\\s+"))?.filter { it.isNotBlank() }?.forEach { classes.add(it) }
            }
        }
        return classes.toList()
    }

    private fun extractIds(hostFile: PsiFile?): List<String> {
        if (hostFile == null) return emptyList()
        val ids = mutableSetOf<String>()
        PsiTreeUtil.findChildrenOfType(hostFile, XmlAttribute::class.java).forEach { attr ->
            if (attr.name == "id") {
                attr.value?.let { if (it.isNotBlank()) ids.add(it) }
            }
        }
        return ids.toList()
    }

    private fun getHostFile(parameters: CompletionParameters): PsiFile? {
        val injectedFile = parameters.position.containingFile ?: return null
        val injectionHost = com.intellij.psi.impl.source.tree.injected.InjectedLanguageUtil
            .getTopLevelFile(injectedFile)
        return if (injectionHost !== injectedFile) injectionHost else null
    }

    override fun addCompletions(
        parameters: CompletionParameters,
        context: ProcessingContext,
        result: CompletionResultSet
    ) {
        val text = parameters.position.containingFile?.text ?: return
        val offset = parameters.offset
        val beforeCursor = text.substring(0, minOf(offset, text.length))

        val hostFile = getHostFile(parameters)
        val cssClasses = extractCssClasses(hostFile)
        val cssIds = extractIds(hostFile)

        try {
            val service = parameters.position.project.service<GraalParserService>()
            val items = service.getCompletions(beforeCursor, beforeCursor.length, cssClasses, cssIds)

            for (item in items) {
                val bold = item.kind in setOf("keyword", "function", "event")
                var el = LookupElementBuilder.create(item.label).withTypeText(item.detail)
                if (bold) el = el.bold()
                val priority = if (item.detail == "expected") 200.0 else 100.0
                result.addElement(PrioritizedLookupElement.withPriority(el, priority))
            }
        } catch (_: Exception) {
            // Silently fail — no completions is better than crashing
        }
    }
}
