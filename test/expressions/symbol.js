describe("the symbol expression", function () {
	it("resolves local context properly", function () {
		var result = evalHyperScript("foo", { locals: { foo: 42 } });
		result.should.equal(42);
	});

	it("resolves global context properly", function () {
		var result = evalHyperScript("document", { locals : { foo: 42 } });
		result.should.equal(document);
	});
});
