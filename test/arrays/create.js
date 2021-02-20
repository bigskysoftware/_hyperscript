describe("array operator", function() {

    beforeEach(function () {
        clearWorkArea();
    });
    afterEach(function () {
        clearWorkArea();
    });

    it("can create an array literal", function () {
        var result = evalHyperScript("[1, 2, 3]")
        result.should.deep.equal([1,2,3])
    })

    it("can index an array value at the beginning of the array", function () {
        var d1 = make(`<div id="d1" _="on click set newVar to [10, 20, 30] then put newVar[0] into #d1.innerHTML"></div>`);
        d1.click();
        d1.innerHTML.should.equal("10");
    })

    it("can index an array value in the middle of the array", function () {
        var d1 = make(`<div id="d1" _="on click set newVar to [10, 20, 30] then put newVar[1] into #d1.innerHTML"></div>`);
        d1.click();
        d1.innerHTML.should.equal("20");
    })

    it("can index an array value at the end of the array", function () {
        var d1 = make(`<div id="d1" _="on click set newVar to [10, 20, 30] then put newVar[2] into #d1.innerHTML"></div>`);
        d1.click();
        d1.innerHTML.should.equal("30");
    })

    it("can index an array value", function () {
        var d1 = make(`<div id="d1" _="on click set newVar to [10, 20, 30] then put newVar[0] into #d1.innerHTML"></div>`);
        d1.click();
        d1.innerHTML.should.equal("10");
    })

    it("can index an array value with an expression", function () {
        var d1 = make(`<div id="d1" _="on click set newVar to ['A', 'B', 'C'] then put newVar[1+1] into #d1.innerHTML"></div>`);
        d1.click();
        d1.innerHTML.should.equal("C");
    })

    it("errors when index exceeds array length", function () {
        var d1 = make(`<div id="d1" _="on click set newVar to [10, 20, 30] then put newVar[10] into #d1.innerHTML"></div>`);
        try {
            d1.click();
        } catch(e) {
            console.log(e)
        }
    })

    it("errors when indexed value is not an array", function () {
        var d1 = make(`<div id="d1" _="on click set newVar to 'not-an-array' then put newVar[0] into #d1.innerHTML"></div>`);
        try {
            d1.click();
        } catch (e) {
            console.log(e)
        }
    })

});

