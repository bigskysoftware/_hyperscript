package org.hyperscript.plugin.documentation

import com.intellij.openapi.diagnostic.Logger

/**
 * Loads documentation entries from the bundled docs.json resource.
 * Generated from www/commands/, www/features/, and www/expressions/.
 */
object HyperscriptDocs {

    private val log = Logger.getInstance(HyperscriptDocs::class.java)

    data class DocEntry(
        val category: String,
        val syntax: String?,
        val description: String?
    )

    private val entries: Map<String, DocEntry> by lazy { loadDocs() }

    // Map common keyword aliases to their doc entry names
    private val ALIASES = mapOf(
        "else" to "if",
        "else if" to "if",
    )

    fun get(keyword: String): DocEntry? {
        entries[keyword]?.let { return it }

        if (keyword in ALIASES) {
            val target = ALIASES[keyword] ?: return null
            return entries[target]
        }

        // Try hyphenated version (e.g., "event-source" for "eventsource")
        entries[keyword.replace(" ", "-")]?.let { return it }

        return null
    }

    private fun loadDocs(): Map<String, DocEntry> {
        val result = mutableMapOf<String, DocEntry>()
        try {
            val json = javaClass.getResourceAsStream("/hyperscript/docs.json")
                ?.bufferedReader()?.readText() ?: return result

            // Simple state-machine JSON parser for our known structure:
            // { "name": { "category": "...", "syntax": "..." | null, "description": "..." | null }, ... }
            // We know the structure, so we can parse it simply.

            var pos = 0
            fun skipWs() { while (pos < json.length && json[pos].isWhitespace()) pos++ }
            fun expect(c: Char) { skipWs(); if (pos < json.length && json[pos] == c) pos++ }
            fun readString(): String {
                skipWs()
                if (pos >= json.length || json[pos] != '"') return ""
                pos++ // skip opening quote
                val sb = StringBuilder()
                while (pos < json.length) {
                    val ch = json[pos]
                    if (ch == '\\' && pos + 1 < json.length) {
                        pos++
                        when (json[pos]) {
                            'n' -> sb.append('\n')
                            't' -> sb.append('\t')
                            '"' -> sb.append('"')
                            '\\' -> sb.append('\\')
                            '/' -> sb.append('/')
                            else -> { sb.append('\\'); sb.append(json[pos]) }
                        }
                    } else if (ch == '"') {
                        pos++
                        return sb.toString()
                    } else {
                        sb.append(ch)
                    }
                    pos++
                }
                return sb.toString()
            }
            fun readNullableString(): String? {
                skipWs()
                if (pos + 3 < json.length && json.substring(pos, pos + 4) == "null") {
                    pos += 4
                    return null
                }
                return readString()
            }

            expect('{')
            while (pos < json.length) {
                skipWs()
                if (pos >= json.length || json[pos] == '}') break

                val name = readString()
                expect(':')
                expect('{')

                var category = ""
                var syntax: String? = null
                var description: String? = null

                // Read 3 fields: category, syntax, description
                for (i in 0 until 3) {
                    skipWs()
                    if (pos >= json.length || json[pos] == '}') break
                    val key = readString()
                    expect(':')
                    when (key) {
                        "category" -> category = readString()
                        "syntax" -> syntax = readNullableString()
                        "description" -> description = readNullableString()
                    }
                    skipWs()
                    if (pos < json.length && json[pos] == ',') pos++
                }

                expect('}')
                skipWs()
                if (pos < json.length && json[pos] == ',') pos++

                result[name] = DocEntry(category, syntax, description)
            }

            log.info("Loaded ${result.size} documentation entries")
        } catch (e: Exception) {
            log.warn("Failed to load documentation", e)
        }
        return result
    }
}
