describe("the string expression", function () {

    it("handles strings properly", function () {
        var result = evalHyperScript('"foo"');
        result.should.equal("foo");


        var result = evalHyperScript('"fo\'o"');
        result.should.equal("fo'o");


        var result = evalHyperScript("'foo'");
        result.should.equal("foo");

    });

});
