describe("the typecheck expression", function () {
	it("can do basic string typecheck", function () {
		var result = evalHyperScript("'foo' : String");
		result.should.equal("foo");
	});

	it("can do null as string typecheck", function () {
		var result = evalHyperScript("null : String");
		should.equal(result, null);
	});

	it("can do basic non-string typecheck failure", function () {
		try {
			var result = evalHyperScript("true : String");
			throw new Error("should not reach");
		} catch (e) {
			console.log(e.message);
			e.message.indexOf("Typecheck failed!").should.equal(0);
		}
	});

	it("can do basic string non-null typecheck", function () {
		var result = evalHyperScript("'foo' : String!");
		result.should.equal("foo");
	});

	it("null causes null safe string check to fail", function () {
		try {
			var result = evalHyperScript("null : String!");
			throw new Error("should not reach");
		} catch (e) {
			console.log(e.message);
			e.message.indexOf("Typecheck failed!").should.equal(0);
		}
	});
});
