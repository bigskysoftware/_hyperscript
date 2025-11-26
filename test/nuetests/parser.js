// Standalone parser tests that work in both Node.js and browser
// Node.js: npx mocha test/nuetests/parser.js
// Browser: Add <script src="nuetests/parser.js"></script> to test/index.html
// IntelliJ: Run directly with Mocha runner

// Detect environment and setup accordingly
let lexer, parser, runtime, _hyperscript, assert;

if (typeof window === 'undefined') {
    // Node.js environment - import ES modules and chai
    const chai = await import('chai');
    assert = chai.assert;

    const { Lexer } = await import('../../src/core/lexer.js');
    const { Parser } = await import('../../src/core/parser.js');
    const { Runtime } = await import('../../src/core/runtime.js');
    const hyperscriptCoreGrammar = (await import('../../src/grammars/core.js')).default;
    const hyperscriptWebGrammar = (await import('../../src/grammars/web.js')).default;

    lexer = new Lexer();
    runtime = new Runtime(globalThis);
    parser = new Parser();
    parser.runtime = runtime;

    hyperscriptCoreGrammar(parser, runtime);
    hyperscriptWebGrammar(parser);
} else {
    // Browser environment - use globals
    _hyperscript = window._hyperscript;
    lexer = _hyperscript.internals.lexer;
    parser = _hyperscript.internals.parser;
    runtime = _hyperscript.internals.runtime;
    assert = window.chai.assert;
}

// Helper function to parse code
function parse(code) {
    return parser.parse(lexer, code);
}

describe("Parser Tests (standalone)", function() {

    describe("Basic commands", function() {

        it("should parse 'set x to 1 + 2'", function() {
            const result = parse('set x to 1 + 2');

            assert.strictEqual(result.type, 'setCommand');
            assert.property(result, 'args');
            assert.strictEqual(result.args.length, 3);

            // The expression is in args[2]
            const expr = result.args[2];
            assert.exists(expr);
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
            assert.exists(expr);
        });

    });

});
