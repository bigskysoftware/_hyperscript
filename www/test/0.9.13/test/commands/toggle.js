describe("the toggle command", function () {
	beforeEach(function () {
		clearWorkArea();
	});
	afterEach(function () {
		clearWorkArea();
	});

	it("can toggle class ref on a single div", function () {
		var div = make("<div _='on click toggle .foo'></div>");
		div.classList.contains("foo").should.equal(false);
		div.click();
		div.classList.contains("foo").should.equal(true);
		div.click();
		div.classList.contains("foo").should.equal(false);
	});

	it("can toggle class ref on a single form", function () {
		var form = make("<form _='on click toggle .foo'></form>");
		form.classList.contains("foo").should.equal(false);
		form.click();
		form.classList.contains("foo").should.equal(true);
		form.click();
		form.classList.contains("foo").should.equal(false);
	});

	it("can target another div for class ref toggle", function () {
		var bar = make("<div id='bar'></div>");
		var div = make("<div _='on click toggle .foo on #bar'></div>");
		bar.classList.contains("foo").should.equal(false);
		div.classList.contains("foo").should.equal(false);
		div.click();
		bar.classList.contains("foo").should.equal(true);
		div.classList.contains("foo").should.equal(false);
		div.click();
		bar.classList.contains("foo").should.equal(false);
		div.classList.contains("foo").should.equal(false);
	});

	it("can toggle non-class attributes", function () {
		var div = make("<div _='on click toggle [@foo=\"bar\"]'></div>");
		div.hasAttribute("foo").should.equal(false);
		div.click();
		div.getAttribute("foo").should.equal("bar");
		div.click();
		div.hasAttribute("foo").should.equal(false);
	});

	it("can toggle non-class attributes on selects", function () {
		var select = make("<select _='on click toggle [@foo=\"bar\"]'></select>");
		select.hasAttribute("foo").should.equal(false);
		select.click();
		select.getAttribute("foo").should.equal("bar");
		select.click();
		select.hasAttribute("foo").should.equal(false);
	});

	it("can toggle for a fixed amount of time", function (done) {
		var div = make("<div _='on click toggle .foo for 10ms'></div>");
		div.classList.contains("foo").should.equal(false);
		div.click();
		div.classList.contains("foo").should.equal(true);
		setTimeout(function () {
			div.classList.contains("foo").should.equal(false);
			done();
		}, 20);
	});

	it("can toggle until an event on another element", function (done) {
		var d1 = make("<div id='d1'></div>");
		var div = make("<div _='on click toggle .foo until foo from #d1'></div>");
		div.classList.contains("foo").should.equal(false);
		div.click();
		div.classList.contains("foo").should.equal(true);
		d1.dispatchEvent(new CustomEvent("foo"));
		setTimeout(function () {
			div.classList.contains("foo").should.equal(false);
			done();
		}, 1);
	});

	it("can toggle between two classes", function () {
		var div = make("<div class='foo' _='on click toggle between .foo and .bar'></div>");
		div.classList.contains("foo").should.equal(true);
		div.classList.contains("bar").should.equal(false);
		div.click();
		div.classList.contains("foo").should.equal(false);
		div.classList.contains("bar").should.equal(true);
		div.click();
		div.classList.contains("foo").should.equal(true);
		div.classList.contains("bar").should.equal(false);
	});

	it("can toggle multiple class refs", function () {
		var div = make("<div class='bar' _='on click toggle .foo .bar'></div>");
		div.classList.contains("foo").should.equal(false);
		div.classList.contains("bar").should.equal(true);
		div.click();
		div.classList.contains("foo").should.equal(true);
		div.classList.contains("bar").should.equal(false);
		div.click();
		div.classList.contains("foo").should.equal(false);
		div.classList.contains("bar").should.equal(true);
	});

	it("can toggle display", function () {
		var div = make("<div _='on click toggle *display'></div>");
		getComputedStyle(div).display.should.equal("block");
		div.click();
		getComputedStyle(div).display.should.equal("none");
		div.click();
		getComputedStyle(div).display.should.equal("block");
	});

	it("can toggle opacity", function () {
		var div = make("<div _='on click toggle *opacity'></div>");
		getComputedStyle(div).opacity.should.equal("1");
		div.click();
		getComputedStyle(div).opacity.should.equal("0");
		div.click();
		getComputedStyle(div).opacity.should.equal("1");
	});

	it("can toggle opacity", function () {
		var div = make("<div _='on click toggle *visibility'></div>");
		getComputedStyle(div).visibility.should.equal("visible");
		div.click();
		getComputedStyle(div).visibility.should.equal("hidden");
		div.click();
		getComputedStyle(div).visibility.should.equal("visible");
	});

	it("can toggle display w/ my", function () {
		var div = make("<div _='on click toggle my *display'></div>");
		getComputedStyle(div).display.should.equal("block");
		div.click();
		getComputedStyle(div).display.should.equal("none");
		div.click();
		getComputedStyle(div).display.should.equal("block");
	});

	it("can toggle display w/ my", function () {
		var div = make("<div _='on click toggle my *opacity'></div>");
		getComputedStyle(div).opacity.should.equal("1");
		div.click();
		getComputedStyle(div).opacity.should.equal("0");
		div.click();
		getComputedStyle(div).opacity.should.equal("1");
	});

	it("can toggle display w/ my", function () {
		var div = make("<div _='on click toggle my *visibility'></div>");
		getComputedStyle(div).visibility.should.equal("visible");
		div.click();
		getComputedStyle(div).visibility.should.equal("hidden");
		div.click();
		getComputedStyle(div).visibility.should.equal("visible");
	});

	it("can toggle display on other elt", function () {
		var div = make("<div _='on click toggle the *display of #d2'></div>");
		var div2 = make("<div id='d2'></div>");
		getComputedStyle(div2).display.should.equal("block");
		div.click();
		getComputedStyle(div2).display.should.equal("none");
		div.click();
		getComputedStyle(div2).display.should.equal("block");
	});

	it("can toggle display on other elt", function () {
		var div = make("<div _='on click toggle the *opacity of #d2'></div>");
		var div2 = make("<div id='d2'></div>");
		getComputedStyle(div2).opacity.should.equal("1");
		div.click();
		getComputedStyle(div2).opacity.should.equal("0");
		div.click();
		getComputedStyle(div2).opacity.should.equal("1");
	});

	it("can toggle display on other elt", function () {
		var div = make("<div _='on click toggle the *visibility of #d2'></div>");
		var div2 = make("<div id='d2'></div>");
		getComputedStyle(div2).visibility.should.equal("visible");
		div.click();
		getComputedStyle(div2).visibility.should.equal("hidden");
		div.click();
		getComputedStyle(div2).visibility.should.equal("visible");
	});
});
