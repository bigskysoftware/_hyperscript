describe("pseudoCommands", function () {
	beforeEach(function () {
		clearWorkArea();
	});
	afterEach(function () {
		clearWorkArea();
	});

	it("Basic instance function with expression", function () {
		var d1 = make(
			"<div id='d1' _='on click getElementById(\"d1\") of the document " +
				"                                          put the result into window.results'></div>"
		);
		d1.click();
		var value = window.results;
		delete window.results;
		value.should.equal(d1);
	});

	it("Basic instance function with expression and with", function () {
		var d1 = make(
			"<div id='d1' _='on click getElementById(\"d1\") with the document " +
				"                                          put result into window.results'></div>"
		);
		d1.click();
		var value = window.results;
		delete window.results;
		value.should.equal(d1);
	});

	it("Basic instance function with expression and on", function () {
		var d1 = make(
			"<div id='d1' _='on click getElementById(\"d1\") on the document " +
				"                                          put result into window.results'></div>"
		);
		d1.click();
		var value = window.results;
		delete window.results;
		value.should.equal(d1);
	});

	it("Basic instance function with me target", function () {
		var d1 = make(
			"<div id='d1' _='on click foo() on me " +
				"                                          put result into my.bar'></div>"
		);
		d1.foo = function () {
			return "foo";
		};
		d1.click();
		d1.bar.should.equal("foo");
	});

	it("Can use functions defined outside of the current element", function () {
		window.foo = function() {
			return "foo";
		}
		var d1 = make(
			"<div id='d1' _='on click foo() then" +
				"                                          put result into my.bar'></div>"
		);
		d1.click();
		d1.bar.should.equal("foo");
		delete window.foo;
	});

	it("Basic instance function with me target no preposition", function () {
		var d1 = make(
			"<div id='d1' _='on click foo() me " +
			"                                          put result into my.bar'></div>"
		);
		d1.foo = function () {
			return "foo";
		};
		d1.click();
		d1.bar.should.equal("foo");
	});

	it("functions defined alongside can be invoked", function () {
		var d1 = make(
			"<div id='d1' _='def foo() return \"foo\" end on click foo() then put result into my.bar'></div>"
		);
		d1.click();
		d1.bar.should.equal("foo");
	});

});
