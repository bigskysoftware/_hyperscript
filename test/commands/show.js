describe("the show command", function () {
	beforeEach(function () {
		clearWorkArea();
	});
	afterEach(function () {
		clearWorkArea();
	});

	it("can show element, with display:block by default", function () {
		var div = make("<div style=display:none _='on click show me'></div>");
		getComputedStyle(div).display.should.equal("none");
		div.click();
		getComputedStyle(div).display.should.equal("block");
	});

	it("can show element with display:block explicitly", function () {
		var div = make(
			"<div style=display:none _='on click show me with display'></div>"
		);
		getComputedStyle(div).display.should.equal("none");
		div.click();
		getComputedStyle(div).display.should.equal("block");
	});

	it("can show element with custom display value", function () {
		var div = make(
			"<div style=display:none _='on click show me with display: flex'></div>"
		);
		getComputedStyle(div).display.should.equal("none");
		div.click();
		getComputedStyle(div).display.should.equal("flex");
	});

	it("can show element with inline-block display value", function () {
		var div = make(
			"<div style=display:none _='on click show me with display: inline-block'></div>"
		);
		getComputedStyle(div).display.should.equal("none");
		div.click();
		getComputedStyle(div).display.should.equal("inline-block");
	});

	it("can show element with opacity:1", function () {
		var div = make(
			"<div style=opacity:0 _='on click show me with opacity'></div>"
		);
		getComputedStyle(div).opacity.should.equal("0");
		div.click();
		getComputedStyle(div).opacity.should.equal("1");
	});

	it("can show element, with visibility:visible", function () {
		var div = make(
			"<div style=visibility:hidden _='on click show me with visibility'></div>"
		);
		getComputedStyle(div).visibility.should.equal("hidden");
		div.click();
		getComputedStyle(div).visibility.should.equal("visible");
	});

	it("can show other elements", function () {
		var showme = make("<div style=display:none class=showme></div>");
		var div = make("<div _='on click show .showme'></div>");
		getComputedStyle(showme).display.should.equal("none");
		div.click();
		getComputedStyle(showme).display.should.equal("block");
	});
});
