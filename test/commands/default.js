describe("the default command", function () {
	beforeEach(function () {
		clearWorkArea();
	});
	afterEach(function () {
		clearWorkArea();
	});

	it("can default variables", function () {
		var d1 = make(
			"<div id='d1' _='on click default x to \"foo\" then put x into me'></div>"
		);
		d1.click();
		d1.innerHTML.should.equal("foo");
	});

	it("can default attributes", function () {
		var d1 = make(
			"<div id='d1' _='on click default @foo to \"foo\" then put @foo into me'></div>"
		);
		d1.click();
		d1.innerHTML.should.equal("foo");
	});

	it("can default properties", function () {
		var d1 = make(
			"<div id='d1' _='on click default me.foo to \"foo\" then put me.foo into me'></div>"
		);
		d1.click();
		d1.innerHTML.should.equal("foo");
	});

	it("default variables respect existing values", function () {
		var d1 = make(
			"<div id='d1' _='on click set x to \"bar\" then default x to \"foo\" then put x into me'></div>"
		);
		d1.click();
		d1.innerHTML.should.equal("bar");
	});

	it("default attributes respect existing values", function () {
		var d1 = make(
			"<div foo='bar' id='d1' _='on click default @foo to \"foo\" then put @foo into me'></div>"
		);
		d1.click();
		d1.innerHTML.should.equal("bar");
	});

	it("default properties respect existing values", function () {
		var d1 = make(
			"<div id='d1' _='on click set me.foo to \"bar\" then default me.foo to \"foo\" then put me.foo into me'></div>"
		);
		d1.click();
		d1.innerHTML.should.equal("bar");
	});
});
