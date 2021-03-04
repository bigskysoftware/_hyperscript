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


    it("not equal works", function () {
        var result = evalHyperScript("1 != 2")
        result.should.equal(true);

        var result = evalHyperScript("2 != 1")
        result.should.equal(true);

        var result = evalHyperScript("2 != 2")
        result.should.equal(false);
    });


    it("triple not equal works", function () {
        var result = evalHyperScript("1 !== 2")
        result.should.equal(true);

        var result = evalHyperScript("2 !== 1")
        result.should.equal(true);

        var result = evalHyperScript("2 !== 2")
        result.should.equal(false);
    });



    it("is works", function () {
        var result = evalHyperScript("1 is 2")
        result.should.equal(false);

        var result = evalHyperScript("2 is 1")
        result.should.equal(false);

        var result = evalHyperScript("2 is 2")
        result.should.equal(true);
    });

    it("is not works", function () {
        var result = evalHyperScript("1 is not 2")
        result.should.equal(true);

        var result = evalHyperScript("2 is not 1")
        result.should.equal(true);

        var result = evalHyperScript("2 is not 2")
        result.should.equal(false);
    });

    it("is in works", function () {
        var result = evalHyperScript("1 is in [1, 2]")
        result.should.equal(true);

        var result = evalHyperScript("2 is in [1, 2]")
        result.should.equal(true);

        var result = evalHyperScript("3 is in [1, 2]")
        result.should.equal(false);

        var result = evalHyperScript("3 is in null")
        result.should.equal(false);
    });

    it("is not in works", function () {
        var result = evalHyperScript("1 is not in [1, 2]")
        result.should.equal(false);

        var result = evalHyperScript("2 is not in [1, 2]")
        result.should.equal(false);

        var result = evalHyperScript("3 is not in [1, 2]")
        result.should.equal(true);

        var result = evalHyperScript("3 is not in null")
        result.should.equal(true);
    });

});
