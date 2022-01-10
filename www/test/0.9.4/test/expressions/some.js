describe("the some expression", function () {
	it("some returns false for null", function () {
		var result = evalHyperScript("some null");
		result.should.equal(false);
	});

	it("some returns true for non-null", function () {
		var result = evalHyperScript("some 'thing'");
		result.should.equal(true);
	});

	it("some returns false for empty array", function () {
		var result = evalHyperScript("some []");
		result.should.equal(false);
	});

	it("some returns false for empty selector", function () {
		var result = evalHyperScript("some .aClassThatDoesNotExist");
		result.should.equal(false);
	});

	it("some returns true for nonempty selector", function () {
		var result = evalHyperScript("some <html/>");
		result.should.equal(true);
	});

	it("some returns true for filled array", function () {
		var result = evalHyperScript("some ['thing']");
		result.should.equal(true);
	});
});
