describe("the idRef expression", function() {

    beforeEach(function () {
        clearWorkArea();
    });
    afterEach(function () {
        clearWorkArea();
    });

    it("basic id ref works", function () {
        var div = make("<div id='d1'></div>");
        var value = _hyperscript.evaluate("#d1");
        value.should.equal(div);
    })

    it("basic id ref works w no match", function () {
        var div = make("<div></div>");
        var value = _hyperscript.evaluate("#d1");
        should.equal(value, null);
    })


});


