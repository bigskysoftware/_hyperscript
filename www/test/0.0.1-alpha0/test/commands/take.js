describe("the take command", function() {

    beforeEach(function () {
        this.server = makeServer();
        clearWorkArea();
    });
    afterEach(function () {
        this.server.restore();
        clearWorkArea();
    });

    it("can take a class from other elements", function(){
        var d1 = make("<div class='foo'></div>");
        var d2 = make("<div _='on click take .foo from div'></div>");
        var d3 = make("<div></div>");
        d1.classList.contains("foo").should.equal(true);
        d2.classList.contains("foo").should.equal(false);
        d3.classList.contains("foo").should.equal(false);
        d2.click();
        d1.classList.contains("foo").should.equal(false);
        d2.classList.contains("foo").should.equal(true);
        d3.classList.contains("foo").should.equal(false);
    })

});

