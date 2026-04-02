package org.hyperscript.plugin.config

import com.intellij.openapi.components.Service
import com.intellij.openapi.diagnostic.Logger
import com.intellij.openapi.project.Project
import java.io.File

/**
 * Reads .hsrc config from the project root.
 * The file contains a path (absolute or relative to project root)
 * pointing to an alternative hyperscript IIFE build.
 */
@Service(Service.Level.PROJECT)
class HsrcConfigService(private val project: Project) {

    private val log = Logger.getInstance(HsrcConfigService::class.java)

    /**
     * Returns the custom IIFE path from .hsrc, or null if not configured.
     */
    fun getCustomIifePath(): String? {
        val projectBase = project.basePath ?: return null
        val hsrc = File(projectBase, ".hsrc")
        if (!hsrc.exists()) return null

        val path = hsrc.readText().trim()
        if (path.isBlank()) return null

        val resolved = if (File(path).isAbsolute) File(path) else File(projectBase, path)
        if (!resolved.exists()) {
            log.warn(".hsrc references non-existent file: ${resolved.absolutePath}")
            return null
        }

        return resolved.absolutePath
    }
}
