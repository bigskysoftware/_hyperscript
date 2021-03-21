describe("the _hyperscript tokenizer", function () {

    it("handles basic token types", function () {
        var lexer = _hyperscript.internals.lexer;

        var token = lexer.tokenize("foo").consumeToken();
        token.type.should.equal("IDENTIFIER");

        var token = lexer.tokenize("1").consumeToken();
        token.type.should.equal("NUMBER");

        var tokens = lexer.tokenize("1.1");
        var token = tokens.consumeToken();
        token.type.should.equal("NUMBER");
        tokens.hasMore().should.equal(false);

        var token = lexer.tokenize(".a").consumeToken();
        token.type.should.equal("CLASS_REF");

        var token = lexer.tokenize("#a").consumeToken();
        token.type.should.equal("ID_REF");

        var token = lexer.tokenize('"asdf"').consumeToken();
        token.type.should.equal("STRING");
    });

    it('handles whitespace properly', function () {
        var lexer = _hyperscript.internals.lexer;
        lexer.tokenize('   ').list.length.should.equal(0);
        lexer.tokenize('  asdf').list.length.should.equal(1);
        lexer.tokenize('  asdf  ').list.length.should.equal(2);
        lexer.tokenize('asdf  ').list.length.should.equal(2);
        lexer.tokenize('\n').list.length.should.equal(0);
        lexer.tokenize('\nasdf').list.length.should.equal(1);
        lexer.tokenize('\nasdf\n').list.length.should.equal(2);
        lexer.tokenize('asdf\n').list.length.should.equal(2);
        lexer.tokenize('\r').list.length.should.equal(0);
        lexer.tokenize('\rasdf').list.length.should.equal(1);
        lexer.tokenize('\rasdf\r').list.length.should.equal(2);
        lexer.tokenize('asdf\r').list.length.should.equal(2);
        lexer.tokenize('\t').list.length.should.equal(0);
        lexer.tokenize('\tasdf').list.length.should.equal(1);
        lexer.tokenize('\tasdf\t').list.length.should.equal(2);
        lexer.tokenize('asdf\t').list.length.should.equal(2);
    })

    it('handles comments properly', function () {
        var lexer = _hyperscript.internals.lexer;
        lexer.tokenize('--').list.length.should.equal(0);
        lexer.tokenize('asdf--').list.length.should.equal(1);
        lexer.tokenize('--asdf').list.length.should.equal(0);
        lexer.tokenize('--\nasdf').list.length.should.equal(1);
        lexer.tokenize('--\nasdf--').list.length.should.equal(1);
    })

    it('handles class identifiers properly', function () {
        var lexer = _hyperscript.internals.lexer;

        var token = lexer.tokenize('.a').consumeToken();
        token.type.should.equal("CLASS_REF");
        token.value.should.equal(".a");

        var token = lexer.tokenize('  .a').consumeToken();
        token.type.should.equal("CLASS_REF");
        token.value.should.equal(".a");

        var token = lexer.tokenize('a.a').consumeToken();
        token.type.should.equal("IDENTIFIER");
        token.value.should.equal("a");

        var token = lexer.tokenize('(a).a').list[4];
        token.type.should.equal("IDENTIFIER");
        token.value.should.equal("a");

        var token = lexer.tokenize('{a}.a').list[4];
        token.type.should.equal("IDENTIFIER");
        token.value.should.equal("a");


        var token = lexer.tokenize('[a].a').list[4];
        token.type.should.equal("IDENTIFIER");
        token.value.should.equal("a");

        var token = lexer.tokenize('(a(.a').list[3];
        token.type.should.equal("CLASS_REF");
        token.value.should.equal(".a");

        var token = lexer.tokenize('{a{.a').list[3];
        token.type.should.equal("CLASS_REF");
        token.value.should.equal(".a");


        var token = lexer.tokenize('[a[.a').list[3];
        token.type.should.equal("CLASS_REF");
        token.value.should.equal(".a");
    })

    it('handles id references properly', function () {
        var lexer = _hyperscript.internals.lexer;

        var token = lexer.tokenize('#a').consumeToken();
        token.type.should.equal("ID_REF");
        token.value.should.equal("#a");

        var token = lexer.tokenize('  #a').consumeToken();
        token.type.should.equal("ID_REF");
        token.value.should.equal("#a");

        var token = lexer.tokenize('a#a').consumeToken();
        token.type.should.equal("IDENTIFIER");
        token.value.should.equal("a");

        var token = lexer.tokenize('(a)#a').list[4];
        token.type.should.equal("IDENTIFIER");
        token.value.should.equal("a");

        var token = lexer.tokenize('{a}#a').list[4];
        token.type.should.equal("IDENTIFIER");
        token.value.should.equal("a");


        var token = lexer.tokenize('[a]#a').list[4];
        token.type.should.equal("IDENTIFIER");
        token.value.should.equal("a");

        var token = lexer.tokenize('(a(#a').list[3];
        token.type.should.equal("ID_REF");
        token.value.should.equal("#a");

        var token = lexer.tokenize('{a{#a').list[3];
        token.type.should.equal("ID_REF");
        token.value.should.equal("#a");


        var token = lexer.tokenize('[a[#a').list[3];
        token.type.should.equal("ID_REF");
        token.value.should.equal("#a");
    })

    it("handles identifiers properly", function () {
        var lexer = _hyperscript.internals.lexer;

        var token = lexer.tokenize("foo").consumeToken();
        token.type.should.equal("IDENTIFIER");
        token.value.should.equal("foo");

        var token = lexer.tokenize("     foo    ").consumeToken();
        token.type.should.equal("IDENTIFIER");
        token.value.should.equal("foo");

        var tokens = lexer.tokenize("     foo    bar");
        var token = tokens.consumeToken();
        token.type.should.equal("IDENTIFIER");
        token.value.should.equal("foo");

        var token = tokens.consumeToken();
        token.type.should.equal("IDENTIFIER");
        token.value.should.equal("bar");

        var tokens = lexer.tokenize("     foo\n-- a comment\n    bar");
        var token = tokens.consumeToken();
        token.type.should.equal("IDENTIFIER");
        token.value.should.equal("foo");

        var token = tokens.consumeToken();
        token.type.should.equal("IDENTIFIER");
        token.value.should.equal("bar");
    })


    it("handles numbers properly", function () {
        var lexer = _hyperscript.internals.lexer;

        var token = lexer.tokenize("1").consumeToken();
        token.type.should.equal("NUMBER");
        token.value.should.equal("1");

        var token = lexer.tokenize("1.1").consumeToken();
        token.type.should.equal("NUMBER");
        token.value.should.equal("1.1");

        var token = lexer.tokenize("1234567890.1234567890").consumeToken();
        token.type.should.equal("NUMBER");
        token.value.should.equal("1234567890.1234567890");

        var tokens = lexer.tokenize("1.1.1").list;
        tokens[0].type.should.equal("NUMBER");
        tokens[1].type.should.equal("PERIOD");
        tokens[2].type.should.equal("NUMBER");
        tokens.length.should.equal(3);
    })

    it("handles strings properly", function () {
        var lexer = _hyperscript.internals.lexer;
        var token = lexer.tokenize('"foo"').consumeToken();
        token.type.should.equal("STRING");
        token.value.should.equal("foo");

        var lexer = _hyperscript.internals.lexer;
        var token = lexer.tokenize('"fo\'o"').consumeToken();
        token.type.should.equal("STRING");
        token.value.should.equal("fo'o");

        var lexer = _hyperscript.internals.lexer;
        var token = lexer.tokenize('"fo\\"o"').consumeToken();
        token.type.should.equal("STRING");
        token.value.should.equal('fo"o');

        var lexer = _hyperscript.internals.lexer;
        var token = lexer.tokenize("'foo'").consumeToken();
        token.type.should.equal("STRING");
        token.value.should.equal("foo");

        var lexer = _hyperscript.internals.lexer;
        var token = lexer.tokenize("'fo\"o'").consumeToken();
        token.type.should.equal("STRING");
        token.value.should.equal('fo"o');

        var lexer = _hyperscript.internals.lexer;
        var token = lexer.tokenize("'fo\\'o'").consumeToken();
        token.type.should.equal("STRING");
        token.value.should.equal("fo'o");

        try {
            lexer.tokenize("'").consumeToken();
        } catch (e) {
            e.message.indexOf("Unterminated string").should.equal(0)
        }

        try {
            lexer.tokenize('"').consumeToken();
        } catch (e) {
            e.message.indexOf("Unterminated string").should.equal(0)
        }
    })

    it("handles strings properly 2", function () {
        var lexer = _hyperscript.internals.lexer;
        var token = lexer.tokenize("'foo'").consumeToken();
        token.type.should.equal("STRING");
        token.value.should.equal("foo");
    })

    it("handles operators properly", function () {
        var lexer = _hyperscript.internals.lexer;

        var optable = {
            '+': 'PLUS', '-': 'MINUS', '*': 'MULTIPLY', '.': 'PERIOD', '\\': 'BACKSLASH', ':': 'COLON',
            '%': 'PERCENT', '|': 'PIPE', '!': 'EXCLAMATION', '?': 'QUESTION', '#': 'POUND', '&': 'AMPERSAND',
            ';': 'SEMI', ',': 'COMMA', '(': 'L_PAREN', ')': 'R_PAREN', '<': 'L_ANG', '>': 'R_ANG', '{': 'L_BRACE',
            '}': 'R_BRACE', '[': 'L_BRACKET', ']': 'R_BRACKET', '=': 'EQUALS', '<=': 'LTE_ANG', '>=': 'GTE_ANG',
            '==': 'EQ', '===': 'EQQ'
        };

        Object.keys(optable).forEach(function (key) {
            var consumeToken = lexer.tokenize(key).consumeToken();
            consumeToken.op.should.equal(true);
            consumeToken.value.should.equal(key);
        })

    })

    it ("handles look ahead property", function() {
        var lexer = _hyperscript.internals.lexer;
        var tokenize = lexer.tokenize("a 1 + 1");
        tokenize.token(0).value.should.equal("a");
        tokenize.token(1).value.should.equal("1");
        tokenize.token(2).value.should.equal("+");
        tokenize.token(3).value.should.equal("1");
        tokenize.token(4).value.should.equal("<<<EOF>>>");
    });


    it ("handles template boostrap properly", function() {
        var lexer = _hyperscript.internals.lexer;
        var tokenize = lexer.tokenize("\"", true);
        tokenize.token(0).value.should.equal("\"");

        var tokenize = lexer.tokenize("\"$", true);
        tokenize.token(0).value.should.equal("\"");
        tokenize.token(1).value.should.equal("$");

        var tokenize = lexer.tokenize("\"${", true);
        tokenize.token(0).value.should.equal("\"");
        tokenize.token(1).value.should.equal("$");
        tokenize.token(2).value.should.equal("{");

        var tokenize = lexer.tokenize("\"${\"asdf\"", true);
        tokenize.token(0).value.should.equal("\"");
        tokenize.token(1).value.should.equal("$");
        tokenize.token(2).value.should.equal("{");
        tokenize.token(3).value.should.equal("asdf");

        var tokenize = lexer.tokenize("\"${\"asdf\"}\"", true);
        tokenize.token(0).value.should.equal("\"");
        tokenize.token(1).value.should.equal("$");
        tokenize.token(2).value.should.equal("{");
        tokenize.token(3).value.should.equal("asdf");
        tokenize.token(4).value.should.equal("}");
        tokenize.token(5).value.should.equal("\"");
    });


    it ("handles $ in template properly", function() {
        var lexer = _hyperscript.internals.lexer;
        var tokenize = lexer.tokenize("\"", true);
        tokenize.token(0).value.should.equal("\"");
    });



});