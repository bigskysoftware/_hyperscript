describe("the symbol expression", function () {

    it("resolves local context properly", function () {
        var result = parseAndTranspile("expression", "foo", {foo:42})
        result.should.equal(42);
    });

    it("resolves global context properly", function () {
        var result = parseAndTranspile("expression", "document", {foo:42})
        result.should.equal(document);
    });

});
