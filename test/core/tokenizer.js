describe("hypescript tokenizer", function() {

    it("handles basic token types", function () {
        var tokens = hyperscript.tokenize("foo");
        tokens[0].type.should.equal("IDENTIFIER");

        var tokens = hyperscript.tokenize("1");
        tokens[0].type.should.equal("NUMBER");

        var tokens = hyperscript.tokenize("1.1");
        tokens[0].type.should.equal("NUMBER");

        var tokens = hyperscript.tokenize(".a");
        tokens[0].type.should.equal("CLASS_REF");

        var tokens = hyperscript.tokenize("#a");
        tokens[0].type.should.equal("ID_REF");

        var tokens = hyperscript.tokenize("\"asdf\"");
        tokens[0].type.should.equal("STRING");
    });

    it("handles identifiers properly", function () {
        var tokens = hyperscript.tokenize("foo");
        tokens[0].type.should.equal("IDENTIFIER");

        var tokens = hyperscript.tokenize("     foo   ");
        tokens[0].type.should.equal("IDENTIFIER");

        var tokens = hyperscript.tokenize("     foo   bar");
        tokens[0].type.should.equal("IDENTIFIER");
        tokens[0].value.should.equal("foo");
        tokens[1].type.should.equal("IDENTIFIER");
        tokens[1].value.should.equal("bar");

        var tokens = hyperscript.tokenize("     foo\n -- a comment\n   bar");
        tokens[0].type.should.equal("IDENTIFIER");
        tokens[0].value.should.equal("foo");
        tokens[1].type.should.equal("IDENTIFIER");
        tokens[1].value.should.equal("bar");
    });

    it("handles syntax properly", function () {
        var tokens = hyperscript.tokenize("foo.bar");
        tokens[0].type.should.equal("IDENTIFIER");
        tokens[0].value.should.equal("foo");
        tokens[1].type.should.equal("PERIOD");
        tokens[2].type.should.equal("IDENTIFIER");
        tokens[2].value.should.equal("bar");

    });

});