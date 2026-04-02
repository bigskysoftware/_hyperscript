package org.hyperscript.plugin.html

import com.intellij.psi.xml.XmlTag
import com.intellij.xml.XmlAttributeDescriptor
import com.intellij.xml.XmlAttributeDescriptorsProvider
import com.intellij.xml.impl.BasicXmlAttributeDescriptor

private val HS_ATTRIBUTES = arrayOf("_", "hs", "data-hs")

class HyperscriptHtmlAttributeDescriptorProvider : XmlAttributeDescriptorsProvider {

    override fun getAttributeDescriptors(tag: XmlTag?): Array<XmlAttributeDescriptor> =
        HS_ATTRIBUTES.map { HyperscriptAttributeDescriptor(it) }.toTypedArray()

    override fun getAttributeDescriptor(attributeName: String?, tag: XmlTag?): XmlAttributeDescriptor? {
        if (attributeName in HS_ATTRIBUTES) return HyperscriptAttributeDescriptor(attributeName!!)
        return null
    }
}

private class HyperscriptAttributeDescriptor(private val name: String) : BasicXmlAttributeDescriptor() {
    override fun getName() = name
    override fun isRequired() = false
    override fun isFixed() = false
    override fun hasIdType() = false
    override fun hasIdRefType() = false
    override fun isEnumerated() = false
    override fun getDefaultValue(): String? = null
    override fun getEnumeratedValues(): Array<String>? = null
    override fun init(element: com.intellij.psi.PsiElement?) {}
    override fun getDeclaration() = null
}
