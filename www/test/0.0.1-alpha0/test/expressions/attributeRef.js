describe("the attributeRef expression", function() {

    beforeEach(function () {
        clearWorkArea();
    });
    afterEach(function () {
        clearWorkArea();
    });

    it("attributeRef with no value works", function () {
        var value = parseAndTranspile("attributeRef","[foo]");
        value.name.should.equal("foo");
        should.equal(value.value, undefined);
    })


    it("attributeRef with literal value works", function () {
        var value = parseAndTranspile("attributeRef","[foo='red']");
        value.name.should.equal("foo");
        value.value.should.equal("red");
    })



});


