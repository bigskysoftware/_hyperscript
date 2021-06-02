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

	it("setting an element scoped variable spans features", function () {
		var div = make(
			"<div id='d1' _='on click 1 default element x to 0" +
			"                       on click 2 set x to 10 " +
			"                       on click 3 set @out to x'></div>"
		);
		div.click();
		div.click();
		div.click();
		div.getAttribute("out").should.equal("10");
	});

	it("setting a global scoped variable spans features", function () {
		var div = make(
			"<div id='d1' _='on click 1 default global x to 0" +
			"                       on click 2 set x to 10 " +
			"                       on click 3 set @out to x'></div>"
		);
		div.click();
		div.click();
		div.click();
		div.getAttribute("out").should.equal("10");
		delete window.x
	});

	it("basic behavior scoping works", function() {
		make(
			"" +
			"<script type=text/hyperscript>" +
			"behavior Behave(foo) on click set @out to foo" +
			"</script>"
		);
		var div = make("<div id='d1' _='install Behave(foo:10)'></div>")
		div.click();
		div.getAttribute("out").should.equal("10");
		delete window.Behave;
	});

	it("behavior scoping is at the element level", function() {
		make(
			"" +
			"<script type=text/hyperscript>" +
			"behavior Behave(foo) " +
			"  on click 1 set foo to foo + 10" +
			"  on click 2 set @out to foo" +
			"</script>"
		);
		var div = make("<div id='d1' _='install Behave(foo:10)'></div>")
		div.click();
		div.click();
		div.getAttribute("out").should.equal("20");
		delete window.Behave;
	});

	it("behavior scoping is isolated from the core element scope", function() {
		make(
			"" +
			"<script type=text/hyperscript>" +
			"behavior Behave(foo) " +
			"  on click 1 set foo to foo + 10" +
			"  on click 3 set @out to foo" +
			"</script>"
		);
		var div = make("<div id='d1' _='install Behave(foo:10) on click 2 set element foo to 1 on click 4 set @out2 to foo'></div>")
		div.click();
		div.click();
		div.click();
		div.click();
		div.getAttribute("out").should.equal("20");
		div.getAttribute("out2").should.equal("1");
		delete window.Behave;
	});

	it("behavior scoping is isolated from other behaviors", function() {
		make(
			"" +
			"<script type=text/hyperscript>" +
			"behavior Behave(foo) " +
			"  on click 1 set foo to foo + 10" +
			"  on click 3 set @out to foo" +
			" behavior BehaveTwo(foo) " +
			"  on click 2 set element foo to 1 " +
			"  on click 4 set @out2 to foo" +
			"</script>"
		);
		var div = make("<div id='d1' _='install Behave(foo:10) install BehaveTwo(foo:42)'></div>")
		div.click();
		div.click();
		div.click();
		div.click();
		div.getAttribute("out").should.equal("20");
		div.getAttribute("out2").should.equal("1");
		delete window.Behave;
		delete window.BehaveTwo;
	});

	it("variables are hoisted", function() {
		var div = make("<div id='d1' _='on click if true set foo to 10 end set @out to foo'></div>")
		div.click();
		div.getAttribute("out").should.equal("10");
	});

	it("local variables can override element variables", function() {
		var div = make("<div id='d1' _='on click 1 set element foo to 20" +
			"                                  on click 2 set local foo to 10 then set @out to foo" +
			"                                  on click 3 set @out to foo'></div>")
		div.click();
		div.click();
		div.getAttribute("out").should.equal("10");
		div.click();
		div.getAttribute("out").should.equal("20");
	});

	it("explicit element variable references works", function() {
		var div = make("<div id='d1' _='on click 1 set element foo to 20" +
			"                                  on click 2 set local foo to 10 then set @out to foo then set @out2 to element foo'></div>")
		div.click();
		div.click();
		div.getAttribute("out").should.equal("10");
		div.getAttribute("out2").should.equal("20");
	});


});
