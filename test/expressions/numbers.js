describe("the number expression", function () {

    it("handles numbers properly", function () {
        var result = _hyperscript.evaluate('1');
        result.should.equal(1);

        var result = _hyperscript.evaluate('1.1');
        result.should.equal(1.1);

        var result = _hyperscript.evaluate('1234567890.1234567890');
        result.should.equal(1234567890.1234567890);
    });
    
});
