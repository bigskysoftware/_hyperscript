describe("the number expression", function () {

    it("handles numbers properly", function () {
        var result = parseAndTranspile("number", '1');
        result.should.equal(1);

        var result =  parseAndTranspile("number",'1.1');
        result.should.equal(1.1);

        var result =  parseAndTranspile("number",'1234567890.1234567890');
        result.should.equal(1234567890.1234567890);
    });

});
