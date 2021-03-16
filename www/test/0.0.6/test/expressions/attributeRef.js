describe("the attributeRef expression", function() {

    beforeEach(function () {
        clearWorkArea();
    });
    afterEach(function () {
        clearWorkArea();
    });

    it("attributeRef with no value works", function () {
        var tokens = _hyperscript.internals.lexer.tokenize("[foo]");
        var expr = _hyperscript.internals.parser.parseElement("attributeRef", tokens);
        var value = expr.evaluate({});
        value.name.should.equal("foo");
        should.equal(value.value, undefined);
    })


    it("attributeRef with literal value works", function () {
        var tokens = _hyperscript.internals.lexer.tokenize("[foo='red']");
        var expr = _hyperscript.internals.parser.parseElement("attributeRef", tokens);
        var value = expr.evaluate({});
        value.name.should.equal("foo");
        value.value.should.equal("red");
    })

    it("attributeRef with dashes name works", function () {
        var tokens = _hyperscript.internals.lexer.tokenize("[foo-bar='red']");
        var expr = _hyperscript.internals.parser.parseElement("attributeRef", tokens);
        var value = expr.evaluate({});
        value.name.should.equal("foo-bar");
        value.value.should.equal("red");
    })



});


