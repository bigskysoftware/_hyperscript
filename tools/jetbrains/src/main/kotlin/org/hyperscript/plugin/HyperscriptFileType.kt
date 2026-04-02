package org.hyperscript.plugin

import com.intellij.openapi.fileTypes.LanguageFileType
import javax.swing.Icon

class HyperscriptFileType private constructor() : LanguageFileType(HyperscriptLanguage.INSTANCE) {

    override fun getName() = "Hyperscript"
    override fun getDescription() = "Hyperscript language file"
    override fun getDefaultExtension() = "hs"
    override fun getIcon(): Icon = HyperscriptIcons.FILE

    companion object {
        @JvmStatic
        val INSTANCE = HyperscriptFileType()
    }
}
