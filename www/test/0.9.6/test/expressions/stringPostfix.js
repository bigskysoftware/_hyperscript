describe("the string postfix expression", function () {

	it("handles basic postfix strings properly", function () {

		var result = evalHyperScript("1em");
		result.should.equal("1em");

		var result = evalHyperScript("1px");
		result.should.equal("1px");

		var result = evalHyperScript("100%");
		result.should.equal("100%");
	});

	it("handles basic postfix strings with spaces properly", function () {

		var result = evalHyperScript("1 em");
		result.should.equal("1em");

		var result = evalHyperScript("1 px");
		result.should.equal("1px");

		var result = evalHyperScript("100 %");
		result.should.equal("100%");
	});

	it("handles expression roots properly", function () {

		var result = evalHyperScript("(0 + 1) em");
		result.should.equal("1em");

		var result = evalHyperScript("(0 + 1) px");
		result.should.equal("1px");

		var result = evalHyperScript("(100 + 0) %");
		result.should.equal("100%");
	});

});
