describe("the take command", function() {

    beforeEach(function () {
        clearWorkArea();
    });
    afterEach(function () {
        clearWorkArea();
    });

    it("can take a class from other elements", function(){
        var d1 = make("<div class='div foo'></div>");
        var d2 = make("<div class='div' _='on click take .foo from .div'></div>");
        var d3 = make("<div class='div'></div>");
        d1.classList.contains("foo").should.equal(true);
        d2.classList.contains("foo").should.equal(false);
        d3.classList.contains("foo").should.equal(false);
        d2.click();
        d1.classList.contains("foo").should.equal(false);
        d2.classList.contains("foo").should.equal(true);
        d3.classList.contains("foo").should.equal(false);
    })

});

