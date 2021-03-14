describe("the boolean literal expression", function () {

    it("true boolean literals work", function () {
        var result = evalHyperScript("true")
        result.should.equal(true);
    });

    it("false boolean literals work", function () {
        var result = evalHyperScript("false")
        result.should.equal(false);
    });

});
