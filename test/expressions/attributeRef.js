describe("the attributeRef expression", function() {

    beforeEach(function () {
        this.server = makeServer();
        clearWorkArea();
    });
    afterEach(function () {
        this.server.restore();
        clearWorkArea();
    });

    it("attributeRef with no value works", function () {
        var value = _hyperscript.parser.parseExpression("attributeRef", _hyperscript.lexer.tokenize("[foo]" ) ).evaluate({});
        value.name.should.equal("foo");
        should.equal(value.value, null);
    })


    it("attributeRef with literal value works", function () {
        var value = _hyperscript.parser.parseExpression("attributeRef", _hyperscript.lexer.tokenize("[foo='red']" ) ).evaluate({});
        value.name.should.equal("foo");
        value.value.should.equal("red");
    })



});


