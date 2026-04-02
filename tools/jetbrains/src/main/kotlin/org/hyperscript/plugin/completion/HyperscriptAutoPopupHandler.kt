package org.hyperscript.plugin.completion

import com.intellij.codeInsight.AutoPopupController
import com.intellij.codeInsight.editorActions.TypedHandlerDelegate
import com.intellij.lang.injection.InjectedLanguageManager
import com.intellij.openapi.editor.Editor
import com.intellij.openapi.project.Project
import com.intellij.psi.PsiDocumentManager
import com.intellij.psi.PsiFile
import org.hyperscript.plugin.HyperscriptLanguage

/**
 * Triggers auto-completion popup after typing '#' in hyperscript,
 * so users get ID suggestions immediately without pressing Ctrl+Space.
 * Works for both standalone .hs files and injected hyperscript in HTML attributes.
 */
class HyperscriptAutoPopupHandler : TypedHandlerDelegate() {
    override fun checkAutoPopup(charTyped: Char, project: Project, editor: Editor, file: PsiFile): Result {
        if (charTyped != '#') return Result.CONTINUE

        // Standalone hyperscript file
        if (file.language == HyperscriptLanguage.INSTANCE) {
            AutoPopupController.getInstance(project).scheduleAutoPopup(editor)
            return Result.STOP
        }

        // Check if caret is inside an injected hyperscript fragment (e.g. HTML attribute)
        val offset = editor.caretModel.offset
        val injectedManager = InjectedLanguageManager.getInstance(project)
        val element = injectedManager.findInjectedElementAt(file, offset)
        if (element?.language == HyperscriptLanguage.INSTANCE) {
            AutoPopupController.getInstance(project).scheduleAutoPopup(editor)
            return Result.STOP
        }

        return Result.CONTINUE
    }
}
