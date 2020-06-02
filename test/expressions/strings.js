describe("the string expression", function () {

    it("handles strings properly", function () {
        var result = parseAndEval("string",'"foo"');
        result.should.equal("foo");


        var result = parseAndEval("string",'"fo\'o"');
        result.should.equal("fo'o");


        var result = parseAndEval("string","'foo'");
        result.should.equal("foo");

    });

});
