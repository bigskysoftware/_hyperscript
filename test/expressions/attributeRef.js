describe("the attributeRef expression", function() {

    beforeEach(function () {
        clearWorkArea();
    });
    afterEach(function () {
        clearWorkArea();
    });

    it("attributeRef with no value works", function () {
        var div = make("<div foo='c1'></div>");
        var value = _hyperscript("[@foo]");
        value[0].should.equal(div);
    })


    it("attributeRef with value works", function () {
        var div = make("<div foo='red'></div>");
        var value = _hyperscript("[@foo='red']");
        value[0].should.equal(div);
    })

    it("attributeRef with dashes name works", function () {
        var div = make("<div data-foo='red'></div>");
        var value = _hyperscript("[@data-foo='red']");
        value[0].should.equal(div);
    })

});


