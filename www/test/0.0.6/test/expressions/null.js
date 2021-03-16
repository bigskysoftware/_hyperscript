describe("the null literal expression", function () {

    it("null literal work", function () {
        var result = evalHyperScript("null")
        should.equal(result, null);
    });


});
