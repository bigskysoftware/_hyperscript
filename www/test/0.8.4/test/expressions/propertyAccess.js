describe("propertyAccess", function () {
	it("can access basic properties", function () {
		var result = evalHyperScript("foo.foo", { foo: { foo: "foo" } });
		result.should.equal("foo");
	});

	it("is null safe", function () {
		var result = evalHyperScript("foo.foo");
		should.equal(result, undefined);
	});

	it("of form works", function () {
		var result = evalHyperScript("foo of foo", { foo: { foo: "foo" } });
		result.should.equal("foo");
	});

	it("of form works w/ complex left side", function () {
		var result = evalHyperScript("bar.doh of foo", {
			foo: { bar: { doh: "foo" } },
		});
		result.should.equal("foo");
	});

	it("of form works w/ complex right side", function () {
		var result = evalHyperScript("doh of foo.bar", {
			foo: { bar: { doh: "foo" } },
		});
		result.should.equal("foo");
	});
});
