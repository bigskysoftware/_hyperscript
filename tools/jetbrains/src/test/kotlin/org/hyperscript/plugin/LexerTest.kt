package org.hyperscript.plugin

import org.hyperscript.plugin.lexer.HyperscriptLexer
import org.hyperscript.plugin.lexer.HyperscriptTokenTypes
import org.junit.Assert.*
import org.junit.Test

class LexerTest {

    private fun tokenize(input: String): List<Pair<String, String>> {
        val lexer = HyperscriptLexer()
        val tokens = mutableListOf<Pair<String, String>>()
        lexer.start(input, 0, input.length, 0)
        while (lexer.tokenType != null) {
            tokens.add(lexer.tokenType!!.toString() to input.substring(lexer.tokenStart, lexer.tokenEnd))
            lexer.advance()
        }
        return tokens
    }

    @Test fun keywords() {
        val tokens = tokenize("on click toggle")
        val types = tokens.filter { it.first != "WHITESPACE" }.map { it.first }
        assertEquals(listOf("KEYWORD", "IDENTIFIER", "KEYWORD"), types)
    }

    @Test fun strings() {
        val tokens = tokenize("log 'hello'")
        val nonWs = tokens.filter { it.first != "WHITESPACE" }
        assertEquals("KEYWORD", nonWs[0].first)
        assertEquals("STRING", nonWs[1].first)
        assertEquals("'hello'", nonWs[1].second)
    }

    @Test fun numbers() {
        val tokens = tokenize("wait 500ms")
        val nonWs = tokens.filter { it.first != "WHITESPACE" }
        assertEquals("KEYWORD", nonWs[0].first)
        assertEquals("NUMBER", nonWs[1].first)
        assertEquals("500ms", nonWs[1].second)
    }

    @Test fun cssClass() {
        val tokens = tokenize("toggle .active")
        val nonWs = tokens.filter { it.first != "WHITESPACE" }
        assertEquals("KEYWORD", nonWs[0].first)
        assertEquals("CSS_CLASS", nonWs[1].first)
        assertEquals(".active", nonWs[1].second)
    }

    @Test fun cssId() {
        val tokens = tokenize("put 'x' into #output")
        val nonWs = tokens.filter { it.first != "WHITESPACE" }
        assertEquals("CSS_ID", nonWs.last().first)
        assertEquals("#output", nonWs.last().second)
    }

    @Test fun lineComment() {
        val tokens = tokenize("on click -- do stuff")
        val nonWs = tokens.filter { it.first != "WHITESPACE" }
        assertEquals("LINE_COMMENT", nonWs.last().first)
    }

    @Test fun operators() {
        val tokens = tokenize("x + y == z")
        val ops = tokens.filter { it.first == "OPERATOR" }
        assertEquals(2, ops.size)
        assertEquals("+", ops[0].second)
        assertEquals("==", ops[1].second)
    }

    @Test fun coversFullInput() {
        val input = "on click toggle .foo then log 'done'"
        val tokens = tokenize(input)
        val reconstructed = tokens.joinToString("") { it.second }
        assertEquals(input, reconstructed)
    }
}
