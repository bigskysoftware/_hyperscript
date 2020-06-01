describe("the string expression", function () {

    it("handles strings properly", function () {
        var result = _hyperscript.evaluate('"foo"');
        result.should.equal("foo");


        var result = _hyperscript.evaluate('"fo\'o"');
        result.should.equal("fo'o");


        var result = _hyperscript.evaluate('"fo\\"o"');
        result.should.equal('fo"o');


        var result = _hyperscript.evaluate("'foo'");
        result.should.equal("foo");


        var result = _hyperscript.evaluate("'fo\"o'");
        result.should.equal('fo"o');


        var result = _hyperscript.evaluate("'fo\\'o'");
        result.should.equal("fo'o");
    });

});
