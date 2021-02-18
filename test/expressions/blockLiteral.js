describe("the blockLiteral expression", function () {

    it("basic block literals work", function () {
        var result = evalHyperScript("\\-> true")
        result().should.equal(true);
    });

    it("basic identity works", function () {
        var result = evalHyperScript("\\ x -> x")
        result(true).should.equal(true);
    });

    it("basic two arg identity works", function () {
        var result = evalHyperScript("\\ x, y -> y")
        result(false, true).should.equal(true);
    });

    it("can map an array", function () {
        var result = evalHyperScript("['a', 'ab', 'abc'].map(\\ s -> s.length )")
        result.should.deep.equal([1, 2, 3]);
    });


});
