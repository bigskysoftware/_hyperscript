package org.hyperscript.plugin

import com.intellij.lang.Language

class HyperscriptLanguage private constructor() : Language("Hyperscript") {
    companion object {
        @JvmStatic
        val INSTANCE = HyperscriptLanguage()
    }
}
