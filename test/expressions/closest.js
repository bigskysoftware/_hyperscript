describe("the closest expression", function () {
	beforeEach(function () {
		clearWorkArea();
	});
	afterEach(function () {
		clearWorkArea();
	});

	it("basic query return values", function () {
		var div3 = make(
			"<div id='d3'><div id='d1'></div><div id='d2'></div></div>"
		);
		var div1 = byId("d1");
		var div2 = byId("d2");

		var result = evalHyperScript("closest <div/>", { me: div3 });
		result.should.equal(div3);

		var result = evalHyperScript("closest <div/>", { me: div1 });
		result.should.equal(div1);

		var result = evalHyperScript("closest <div/> to #d3", { me: div1 });
		result.should.equal(div3);

		var result = evalHyperScript("closest <div/> to my.parentElement", {
			me: div1,
		});
		result.should.equal(div3);

		var result = evalHyperScript("closest <div/> to parentElement of me", {
			me: div1,
		});
		result.should.equal(div3);
	});

	it("parent modifier works", function () {
		var div3 = make(
			"<div id='d3'><div id='d1'></div><div id='d2'></div></div>"
		);
		var div1 = byId("d1");
		var div2 = byId("d2");

		var result = evalHyperScript("closest parent <div/>", { me: div1 });
		result.should.equal(div3);

		var result = evalHyperScript("closest parent <div/>", { me: div2 });
		result.should.equal(div3);
	});

	it("attributes resolve as attributes", function () {
		var div3 = make(
			"<div foo='bar' id='d3'><div id='d1'></div><div id='d2'></div></div>"
		);
		var div1 = byId("d1");
		var div2 = byId("d2");

		var result = evalHyperScript("closest @foo", { me: div1 });
		result.should.equal("bar");

		var result = evalHyperScript("closest @foo", { me: div1 });
		result.should.equal("bar");
	});

	it("attributes can be looked up and referred to in same expression", function () {
		var div = make(
			"<div foo='bar'>" +
				"<div id='d1' _='on click put closest @foo into me'></div>" +
				"</div>"
		);
		var d1 = byId("d1");
		d1.innerHTML.should.equal("");
		d1.click();
		d1.innerHTML.should.equal("bar");
	});

	it("attributes can be set via the closest expression", function () {
		var div = make(
			"<div foo='bar'>" +
				"<div id='d1' _='on click set closest @foo to \"doh\"'></div>" +
				"</div>"
		);
		var d1 = byId("d1");
		div.getAttribute("foo").should.equal("bar");
		d1.click();
		div.getAttribute("foo").should.equal("doh");
	});

	it("parenthesizing allows you to nest to modifiers properly", function () {
		var div = make("<div foo='bar'>" + "<div id='d1'></div>" + "</div>");
		var div2 = make(
			"<div _='on click set (closest @foo to #d1) to \"doh\"'></div>"
		);
		div.getAttribute("foo").should.equal("bar");
		div2.click();
		div.getAttribute("foo").should.equal("doh");
	});

	it("attributes can be set via the closest expression", function () {
		var div = make(
			"<div foo='bar'>" +
				"<div id='d1' _='on click set closest @foo to \"doh\"'></div>" +
				"</div>"
		);
		var d1 = byId("d1");
		div.getAttribute("foo").should.equal("bar");
		d1.click();
		div.getAttribute("foo").should.equal("doh");
	});
});
