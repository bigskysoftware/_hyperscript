describe("the string expression", function () {
	it("handles strings properly", function () {
		var result = evalHyperScript('"foo"');
		result.should.equal("foo");

		var result = evalHyperScript('"fo\'o"');
		result.should.equal("fo'o");

		var result = evalHyperScript("'foo'");
		result.should.equal("foo");
	});

	it("string templates work properly", function () {
		var result = evalHyperScript("`$1`");
		result.should.equal("1");
	});

	it("string templates work w/ props", function () {
		window.foo = "foo";
		var result = evalHyperScript("`$window.foo`");
		result.should.equal("foo");
		delete window.foo;
	});

	it("string templates work w/ props w/ braces", function () {
		window.foo = "foo";
		var result = evalHyperScript("`${window.foo}`");
		result.should.equal("foo");
		delete window.foo;
	});

	it("string templates work properly w braces", function () {
		var result = evalHyperScript("`${1 + 2}`");
		result.should.equal("3");
	});

	it("string templates preserve white space", function () {
		var result = evalHyperScript("` ${1 + 2} ${1 + 2} `");
		result.should.equal(" 3 3 ");
		var result = evalHyperScript("`${1 + 2} ${1 + 2} `");
		result.should.equal("3 3 ");
		var result = evalHyperScript("`${1 + 2}${1 + 2} `");
		result.should.equal("33 ");
		var result = evalHyperScript("`${1 + 2} ${1 + 2}`");
		result.should.equal("3 3");
	});

	it("should handle strings with tags and quotes", function () {
		var record = {
			name: "John Connor",
			age: 21,
			favouriteColour: "bleaux",
		};
		var result = evalHyperScript(
			'`<div age="${record.age}" style="color:${record.favouriteColour}">${record.name}</div>`',
			{ locals: { record: record } }
		);
		result.should.equal('<div age="21" style="color:bleaux">John Connor</div>');
	});

	it("should handle back slashes in non-template content", function () {
		var result = evalHyperScript("`https://${foo}`", {locals:{foo:'bar'}});
		result.should.equal('https://bar');
	});
});
