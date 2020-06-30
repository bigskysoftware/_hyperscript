describe("the millisecondLiteral expression", function () {

    it("number works", function () {
        var result = evalHyperScript( "millisecondLiteral", "1")
        result.should.equal(1);
    });

    it("second syntax works", function () {
        var result = evalHyperScript( "millisecondLiteral", "1s")
        result.should.equal(1000);
    });

    it("millisecond syntax works", function () {
        var result = evalHyperScript( "millisecondLiteral", "100ms")
        result.should.equal(100);
    });


});
