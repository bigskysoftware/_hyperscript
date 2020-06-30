describe("the mathOperator expression", function () {

    it("addition works", function () {
        var result = evalHyperScript("1 + 1")
        result.should.equal(1 + 1);
    });

    it("string concat works", function () {
        var result = evalHyperScript("'a' + 'b'")
        result.should.equal("ab");
    });

    it("subtraction works", function () {
        var result = evalHyperScript("1 - 1")
        result.should.equal(1 - 1);
    });

    it("multiplication works", function () {
        var result = evalHyperScript("1 * 2")
        result.should.equal(1 * 2);
    });

    it("division works", function () {
        var result = evalHyperScript("1 / 2")
        result.should.equal(1 / 2);
    });

    it("addition works w/ more than one value", function () {
        var result = evalHyperScript("1 + 2 + 3")
        result.should.equal(1 + 2 + 3);
    });

    it("unparenthesized expressions with multiple operators cause an error", function () {
        var result = getParseErrorFor("1 + 2 * 3")
        result.indexOf("You must parenthesize math operations with different operators").should.equal(0);
    });

    it("parenthesized expressions with multiple operators work", function () {
        var result = evalHyperScript("1 + (2 * 3)")
        result.should.equal(1 + (2 * 3));
    });

});
