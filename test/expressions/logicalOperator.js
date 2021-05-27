describe("the logicalOperator expression", function () {
	it("and works", function () {
		var result = evalHyperScript("true and false");
		result.should.equal(true && false);
	});

	it("or works", function () {
		var result = evalHyperScript("true or false");
		result.should.equal(true || false);
	});

	it("and works w/ more than one value", function () {
		var result = evalHyperScript("true and true and false");
		result.should.equal(true && true && false);
	});

	it("unparenthesized expressions with multiple operators cause an error", function () {
		var result = getParseErrorFor("true and false or true");
		result
			.indexOf(
				"You must parenthesize logical operations with different operators"
			)
			.should.equal(0);
	});

	it("parenthesized expressions with multiple operators work", function () {
		var result = evalHyperScript("true and (false or true)");
		result.should.equal(true && (false || true));
	});
});
