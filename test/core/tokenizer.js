describe("hypescript tokenizer", function() {

    it("handles basic token types", function () {
        var tokenizer = hypescript.tokenize("foo");
        tokenizer.tokens[0].type.should.equal("IDENTIFIER");

        var tokenizer = hypescript.tokenize("1");
        tokenizer.tokens[0].type.should.equal("NUMBER");

        var tokenizer = hypescript.tokenize("1.1");
        tokenizer.tokens[0].type.should.equal("NUMBER");

        var tokenizer = hypescript.tokenize(".a");
        tokenizer.tokens[0].type.should.equal("CLASS_REF");

        var tokenizer = hypescript.tokenize("#a");
        tokenizer.tokens[0].type.should.equal("ID_REF");

        var tokenizer = hypescript.tokenize("\"asdf\"");
        tokenizer.tokens[0].type.should.equal("STRING");
    });

    it("handles identifiers properly", function () {
        var tokenizer = hypescript.tokenize("foo");
        tokenizer.tokens[0].type.should.equal("IDENTIFIER");

        var tokenizer = hypescript.tokenize("     foo   ");
        tokenizer.tokens[0].type.should.equal("IDENTIFIER");

        var tokenizer = hypescript.tokenize("     foo   bar");
        tokenizer.tokens[0].type.should.equal("IDENTIFIER");
        tokenizer.tokens[0].value.should.equal("foo");
        tokenizer.tokens[1].type.should.equal("IDENTIFIER");
        tokenizer.tokens[1].value.should.equal("bar");

        var tokenizer = hypescript.tokenize("     foo\n -- a comment\n   bar");
        tokenizer.tokens[0].type.should.equal("IDENTIFIER");
        tokenizer.tokens[0].value.should.equal("foo");
        tokenizer.tokens[1].type.should.equal("IDENTIFIER");
        tokenizer.tokens[1].value.should.equal("bar");
    });

    it("handles syntax properly", function () {
        var tokenizer = hypescript.tokenize("foo.bar");
        tokenizer.tokens[0].type.should.equal("IDENTIFIER");
        tokenizer.tokens[0].value.should.equal("foo");
        tokenizer.tokens[1].type.should.equal("PERIOD");
        tokenizer.tokens[2].type.should.equal("IDENTIFIER");
        tokenizer.tokens[2].value.should.equal("bar");

    });

});