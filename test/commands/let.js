describe("the let command", function () {
	beforeEach(function () {
		clearWorkArea();
	});
	afterEach(function () {
		clearWorkArea();
	});

	it("can let local variables", function () {
		var d1 = make(
			"<div id='d1' _='on click let newVar be \"foo\" then" +
				"                             put newVar into #d1.innerHTML'></div>"
		);
		d1.click();
		d1.innerHTML.should.equal("foo");
	});

	it("can use = w/ let", function () {
		var d1 = make(
			"<div id='d1' _='on click let newVar = \"foo\" then" +
				"                             put newVar into #d1.innerHTML'></div>"
		);
		d1.click();
		d1.innerHTML.should.equal("foo");
	});

	it("can let element variables", function () {
		var d1 = make(
			"<div id='d1' _='on click let :newVar be \"foo\" then" +
				"                             put :newVar into #d1.innerHTML'></div>"
		);
		d1.click();
		d1.innerHTML.should.equal("foo");
	});

	it("can let global variables", function () {
		var d1 = make(
			"<div id='d1' _='on click let $newVar be \"foo\" then" +
				"                             put $newVar into #d1.innerHTML'></div>"
		);
		d1.click();
		d1.innerHTML.should.equal("foo");
		window.$newVar.should.equal("foo");
		delete window.$newVar;
	});

	it("let defaults to local scope", function () {
		window.newVar = "bar";
		var d1 = make(
			"<div id='d1' _='on click let newVar be \"foo\" then" +
			"                             put newVar into #d1.innerHTML'></div>"
		);
		d1.click();
		d1.innerHTML.should.equal("foo");
		window.newVar.should.equal("bar");
		delete window.newVar;
	});


});
