package org.hyperscript.plugin.injection

import com.intellij.lang.injection.MultiHostInjector
import com.intellij.lang.injection.MultiHostRegistrar
import com.intellij.psi.PsiElement
import com.intellij.psi.PsiLanguageInjectionHost
import com.intellij.psi.xml.XmlAttributeValue
import com.intellij.psi.xml.XmlTag
import com.intellij.psi.xml.XmlText
import com.intellij.openapi.util.TextRange
import org.hyperscript.plugin.HyperscriptLanguage

/**
 * Injects Hyperscript language into:
 * - HTML attributes: _="...", hs="...", data-hs="..."
 * - Script tags: <script type="text/hyperscript">...</script>
 */
class HyperscriptLanguageInjector : MultiHostInjector {

    companion object {
        private val HS_ATTRIBUTES = setOf("_", "hs", "data-hs")
    }

    override fun getLanguagesToInject(registrar: MultiHostRegistrar, context: PsiElement) {
        when (context) {
            is XmlAttributeValue -> injectInAttribute(registrar, context)
            is XmlText -> injectInScriptTag(registrar, context)
        }
    }

    private fun injectInAttribute(registrar: MultiHostRegistrar, attrValue: XmlAttributeValue) {
        val attr = attrValue.parent as? com.intellij.psi.xml.XmlAttribute ?: return
        if (attr.name !in HS_ATTRIBUTES) return

        val text = attrValue.value
        if (text.isNullOrBlank()) return

        // The value range excludes the surrounding quotes
        val valueRange = attrValue.valueTextRange
        val localRange = TextRange(
            valueRange.startOffset - attrValue.textRange.startOffset,
            valueRange.endOffset - attrValue.textRange.startOffset
        )

        registrar.startInjecting(HyperscriptLanguage.INSTANCE)
        registrar.addPlace(null, null, attrValue as PsiLanguageInjectionHost, localRange)
        registrar.doneInjecting()
    }

    private fun injectInScriptTag(registrar: MultiHostRegistrar, xmlText: XmlText) {
        val tag = xmlText.parentTag ?: return
        if (!tag.name.equals("script", ignoreCase = true)) return

        val typeAttr = tag.getAttributeValue("type") ?: return
        if (!typeAttr.equals("text/hyperscript", ignoreCase = true)) return

        val text = xmlText.text
        if (text.isNullOrBlank()) return

        registrar.startInjecting(HyperscriptLanguage.INSTANCE)
        registrar.addPlace(null, null, xmlText as PsiLanguageInjectionHost, TextRange(0, text.length))
        registrar.doneInjecting()
    }

    override fun elementsToInjectIn(): List<Class<out PsiElement>> =
        listOf(XmlAttributeValue::class.java, XmlText::class.java)
}
