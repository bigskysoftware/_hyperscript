describe("the objectLiteral expression", function () {

    it("empty object literals work", function () {
        var result = evalHyperScript("{}")
        result.should.deep.equal({});
    });

    it("one field object literal works", function () {
        var result = evalHyperScript("{foo:true}")
        result.should.deep.equal({foo:true});
    });

    it("multi-field object literal works", function () {
        var result = evalHyperScript("{foo:true, bar:false}")
        result.should.deep.equal({foo:true, bar:false});
    });

});
