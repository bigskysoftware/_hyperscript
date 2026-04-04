package org.hyperscript.plugin.parser

import com.intellij.extapi.psi.PsiFileBase
import com.intellij.openapi.fileTypes.FileType
import com.intellij.psi.FileViewProvider
import org.hyperscript.plugin.HyperscriptFileType
import org.hyperscript.plugin.HyperscriptLanguage

class HyperscriptFile(viewProvider: FileViewProvider) :
    PsiFileBase(viewProvider, HyperscriptLanguage.INSTANCE) {

    override fun getFileType(): FileType = HyperscriptFileType.INSTANCE

    override fun toString(): String = "Hyperscript File"
}
