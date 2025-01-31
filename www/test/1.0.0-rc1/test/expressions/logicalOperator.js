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
		result.indexOf("You must parenthesize logical operations with different operators").should.equal(0);
	});

	it("parenthesized expressions with multiple operators work", function () {
		var result = evalHyperScript("true and (false or true)");
		result.should.equal(true && (false || true));
	});

	it("should short circuit with and expression", function () {
		var func1Called = false;
		var func1 = () => {func1Called = true; return false;}
		var func2Called = false;
		var func2 = () => {func2Called = true; return false;}
		var result = evalHyperScript("func1() and func2()", {locals: {func1, func2}});
		result.should.equal(false);
		func1Called.should.equal(true);
		func2Called.should.equal(false);
	});

	it("should short circuit with or expression", function () {
		var func1Called = false;
		var func1 = () => {func1Called = true; return true;}
		var func2Called = false;
		var func2 = () => {func2Called = true; return true;}
		var result = evalHyperScript("func1() or func2()", {locals: {func1, func2}});
		result.should.equal(true);
		func1Called.should.equal(true);
		func2Called.should.equal(false);
	});


});
