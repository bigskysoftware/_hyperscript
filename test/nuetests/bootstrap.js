// Standalone parser tests that can run in Node.js without a browser
// Can be executed directly via: node test/nuetests/bootstrap.js
// Or run via IntelliJ's Mocha test runner for easier debugging

import { Lexer } from '../../src/core/lexer.js';
import { Parser } from '../../src/core/parser.js';
import { Runtime } from '../../src/core/runtime.js';
import hyperscriptCoreGrammar from '../../src/grammars/core.js';
import hyperscriptWebGrammar from '../../src/grammars/web.js';
import assert from 'assert';

// Set up parser with grammars
const lexer = new Lexer();
const runtime = new Runtime(globalThis);
const parser = new Parser();
parser.runtime = runtime;

// Load grammars
hyperscriptCoreGrammar(parser, runtime);
hyperscriptWebGrammar(parser);

// Helper function to parse code
function parse(code) {
    return parser.parse(lexer, code);
}

describe("Parser Tests", function() {

    describe("Basic commands", function() {

        it("should parse 'set x to 1 + 2'", function() {
            const result = parse('set x to 1 + 2');

            assert.strictEqual(result.type, 'setCommand');
            assert(result.args);
            assert.strictEqual(result.args.length, 3);

            // The expression is in args[2]
            const expr = result.args[2];
            assert(expr);
            assert.strictEqual(expr.type, 'mathOperator');
        });

        it("should parse 'put its id into x'", function() {
            const result = parse('put its id into x');
            assert.strictEqual(result.type, 'putCommand');
        });

        it("should parse 'set x to 1'", function() {
            const result = parse('set x to 1');
            assert.strictEqual(result.type, 'setCommand');
        });

    });

    describe("Expression parsing", function() {

        it("should parse 'its id'", function() {
            const result = parse('set x to its id');
            assert.strictEqual(result.type, 'setCommand');
            const expr = result.args[2];
            assert(expr, 'Expression should exist');
        });

    });

});
