describe("scoping", function () {
	beforeEach(function () {
		clearWorkArea();
	});
	afterEach(function () {
		clearWorkArea();
	});

	it("locally scoped variables work", function () {
		var div = make(
			"<div id='d1' _='on click set x to 10 then set @out to x'></div>"
		);
		div.click();
		div.getAttribute("out").should.equal("10");
	});

	it("locally scoped variables do not span features", function () {
		var div = make(
			"<div id='d1' _='on click 1 set x to 10 " +
			"                       on click 2 set @out to x'></div>"
		);
		div.click();
		div.click();
		should.equal(null, div.getAttribute("out"));
	});

	it("element scoped variables work", function () {
		var div = make(
			"<div id='d1' _='on click set element x to 10 then set @out to x'></div>"
		);
		div.click();
		div.getAttribute("out").should.equal("10");
	});

	it("element scoped variables span features", function () {
		var div = make(
			"<div id='d1' _='on click 1 set element x to 10 " +
			"                       on click 2 set @out to x'></div>"
		);
		div.click();
		div.click();
		div.getAttribute("out").should.equal("10");
	});

	it("element scoped variables are local only to element", function () {
		var div1 = make(
			"<div id='d1' _='on click set element x to 10'>" +
			"         <div id='d2' _='on click set @out to x'>" +
			"       </div>"
		);
		div1.click();
		var div2 = byId("d2");
		div2.click();
		should.equal(null, div1.getAttribute("out"));
		should.equal(null, div2.getAttribute("out"));
	});

	it("global scoped variables work", function () {
		var div = make(
			"<div id='d1' _='on click set global x to 10 then set @out to x'></div>"
		);
		div.click();
		div.getAttribute("out").should.equal("10");
		delete window.x
	});

	it("setting an element scoped variable spans features", function (finish) {
		var div = make(
			"<div id='d1' _='init default element x to 0" +
			"                       on click 1 set x to 10 " +
			"                       on click 2 set @out to x'></div>"
		);
		setTimeout(function () {
			div.click();
			div.click();
			div.getAttribute("out").should.equal("10");
			finish();
		}, 5);
	});

	it("setting a global scoped variable spans features", function (finish) {
		var div = make(
			"<div id='d1' _='init default global x to 0" +
			"                       on click 1 set x to 10 " +
			"                       on click 2 set @out to x'></div>"
		);
		setTimeout(function () {
			div.click();
			div.click();
			div.getAttribute("out").should.equal("10");
			delete window.x
			finish();
		}, 5);
	});



});
