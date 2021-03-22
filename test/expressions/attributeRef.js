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

    it("attributeRef can be set", function () {
        var div = make("<div data-foo='red'></div>");
        var value = _hyperscript("set x[@data-foo] to 'blue'", {x: div});
        div.getAttribute('data-foo').should.equal('blue');
    })

    it("attributeRef can be set through possessive", function () {
        var div = make("<div _='on click set my [@data-foo] to \"blue\"' data-foo='red'></div>");
        div.click();
        div.getAttribute('data-foo').should.equal('blue');
    })

    it("attributeRef can be set indirectly", function () {
        var div = make("<div data-foo='red'></div>");
        var value = _hyperscript("set [@data-foo] of x to 'blue'", {x: div});
        div.getAttribute('data-foo').should.equal('blue');
    })


});


