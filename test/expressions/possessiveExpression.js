describe("possessiveExpression", function () {

    it("can access basic properties", function () {
        var result = evalHyperScript("foo's foo", {foo:{foo: 'foo'}});
        result.should.equal("foo");
    });

    it("is null safe", function () {
        var result = evalHyperScript("foo's foo" );
        should.equal(result, undefined);
    });

    it("can access my properties", function () {
        var result = evalHyperScript('my foo', {me:{foo: 'foo'}});
        result.should.equal("foo");
    });

    it("my property is null safe", function () {
        var result = evalHyperScript('my foo' );
        should.equal(result, undefined);
    });

    it("can access its properties", function () {
        var result = evalHyperScript('its foo', {result:{foo: 'foo'}});
        result.should.equal("foo");
    });

    it("its property is null safe", function () {
        var result = evalHyperScript('its foo' );
        should.equal(result, undefined);
    });


});
