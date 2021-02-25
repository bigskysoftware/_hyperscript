describe("the no expression", function () {

    it("no returns true for null", function () {
        var result = evalHyperScript("no null")
        result.should.equal(true);
    });

    it("no returns false for non-null", function () {
        var result = evalHyperScript("no 'thing'")
        result.should.equal(false);
    });

});
