describe("the classRef expression", function() {

    beforeEach(function () {
        clearWorkArea();
    });
    afterEach(function () {
        clearWorkArea();
    });

    it("basic classRef works", function () {
        var div = make("<div class='c1'></div>");
        var value = parseAndTranspile("classRef", ".c1");
        value[0].should.equal(div);
    })

    it("basic classRef works w no match", function () {
        var value = parseAndTranspile("classRef", ".badClassThatDoesNotHaveAnyElements");
        value.length.should.equal(0);
    })


});


