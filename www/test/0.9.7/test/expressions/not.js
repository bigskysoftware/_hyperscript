describe("the not expression", function () {
	it("not inverts true", function () {
		var result = evalHyperScript("not true");
		result.should.equal(false);
	});

	it("not inverts false", function () {
		var result = evalHyperScript("not false");
		result.should.equal(true);
	});

	it("two nots make a true", function () {
		var result = evalHyperScript("not not true");
		result.should.equal(true);
	});
});
