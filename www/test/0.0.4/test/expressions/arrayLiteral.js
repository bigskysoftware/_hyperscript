describe("the arrayLiteral expression", function () {

    it("empty array literals work", function () {
        var result = evalHyperScript("[]")
        result.should.deep.equal([]);
    });

    it("one element array literal works", function () {
        var result = evalHyperScript("[true]")
        result.should.deep.equal([true]);
    });

    it("multi element array literal works", function () {
        var result = evalHyperScript("[true, false]")
        result.should.deep.equal([true, false]);
    });

});
