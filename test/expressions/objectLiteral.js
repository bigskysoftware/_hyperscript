describe("the objectLiteral expression", function () {
	it("empty object literals work", function () {
		var result = evalHyperScript("{}");
		result.should.deep.equal({});
	});

	it("one field object literal works", function () {
		var result = evalHyperScript("{foo:true}");
		result.should.deep.equal({ foo: true });
	});

	it("multi-field object literal works", function () {
		var result = evalHyperScript("{foo:true, bar:false}");
		result.should.deep.equal({ foo: true, bar: false });
	});

	it("strings work in object literal field names", function () {
		var result = evalHyperScript('{"foo":true, "bar":false}');
		result.should.deep.equal({ foo: true, bar: false });
	});

	it("hyphens work in object literal field names", function () {
		var result = evalHyperScript("{-foo:true, bar-baz:false}");
		result.should.deep.equal({ "-foo": true, "bar-baz": false });
	});

	it("expressions work in object literal field names", function () {
		window.foo = "bar";
		window.bar = function () {
			return "foo";
		};
		var result = evalHyperScript("{[foo]:true, [bar()]:false}");
		result.should.deep.equal({ bar: true, foo: false });
		delete window.foo;
		delete window.bar;
	});
});
