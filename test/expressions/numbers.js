describe("the number expression", function () {
	it("handles numbers properly", function () {
		var result = evalHyperScript("-1");
		result.should.equal(-1);

		var result = evalHyperScript("1");
		result.should.equal(1);

		var result = evalHyperScript("1.1");
		result.should.equal(1.1);

		var result = evalHyperScript("1e6");
		result.should.equal(1e6);

		var result = evalHyperScript("1e-6");
		result.should.equal(1e-6);

		var result = evalHyperScript("1.1e6");
		result.should.equal(1.1e6);

		var result = evalHyperScript("1.1e-6");
		result.should.equal(1.1e-6);

		var result = evalHyperScript("1234567890.1234567890");
		result.should.equal(1234567890.123456789);
	});
});
