describe("the comparisonOperator expression", function () {

    it("less than works", function () {
        var result = evalHyperScript("1 < 2")
        result.should.equal(true);

        var result = evalHyperScript("2 < 1")
        result.should.equal(false);

        var result = evalHyperScript("2 < 2")
        result.should.equal(false);
    });

    it("less than or equal works", function () {
        var result = evalHyperScript("1 <= 2")
        result.should.equal(true);

        var result = evalHyperScript("2 <= 1")
        result.should.equal(false);

        var result = evalHyperScript("2 <= 2")
        result.should.equal(true);
    });

    it("greater than works", function () {
        var result = evalHyperScript("1 > 2")
        result.should.equal(false);

        var result = evalHyperScript("2 > 1")
        result.should.equal(true);

        var result = evalHyperScript("2 > 2")
        result.should.equal(false);
    });

    it("greater than or equal works", function () {
        var result = evalHyperScript("1 >= 2")
        result.should.equal(false);

        var result = evalHyperScript("2 >= 1")
        result.should.equal(true);

        var result = evalHyperScript("2 >= 2")
        result.should.equal(true);
    });


    it("equal works", function () {
        var result = evalHyperScript("1 == 2")
        result.should.equal(false);

        var result = evalHyperScript("2 == 1")
        result.should.equal(false);

        var result = evalHyperScript("2 == 2")
        result.should.equal(true);
    });


    it("triple equal works", function () {
        var result = evalHyperScript("1 === 2")
        result.should.equal(false);

        var result = evalHyperScript("2 === 1")
        result.should.equal(false);

        var result = evalHyperScript("2 === 2")
        result.should.equal(true);
    });



});
