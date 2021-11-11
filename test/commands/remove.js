describe("the remove command", function () {
	beforeEach(function () {
		clearWorkArea();
	});
	afterEach(function () {
		clearWorkArea();
	});

	it("can remove class ref on a single div", function () {
		var div = make("<div class='foo' _='on click remove .foo'></div>");
		div.classList.contains("foo").should.equal(true);
		div.click();
		div.classList.contains("foo").should.equal(false);
	});

	it("can remove class ref on a single form", function () {
		var form = make("<form class='foo' _='on click remove .foo'></form>");
		form.classList.contains("foo").should.equal(true);
		form.click();
		form.classList.contains("foo").should.equal(false);
	});

	it("can target another div for class ref", function () {
		var bar = make("<div class='foo' id='bar'></div>");
		var div = make("<div _='on click remove .foo from #bar'></div>");
		bar.classList.contains("foo").should.equal(true);
		div.classList.contains("foo").should.equal(false);
		div.click();
		bar.classList.contains("foo").should.equal(false);
		div.classList.contains("foo").should.equal(false);
	});

	it("can remove non-class attributes", function () {
		var div = make("<div foo='bar' _='on click remove [@foo]'></div>");
		div.getAttribute("foo").should.equal("bar");
		div.click();
		div.hasAttribute("foo").should.equal(false);
	});

	it("can remove elements", function () {
		var div = make("<div _='on click remove me'></div>");
		assert.isNotNull(div.parentElement);
		div.click();
		assert.isNull(div.parentElement);
	});

	it("can remove other elements", function () {
		var div = make("<div _='on click remove #that'></div>");
		var div2 = make("<div id='that'></div>");
		assert.isNotNull(div2.parentElement);
		div.click();
		assert.isNull(div2.parentElement);
	});

	it("can remove parent element", function () {
		var div = make("<div id='p1'><button  id='b1' _=\"on click remove my.parentElement\"></button></div> ");
		var btn = byId("b1");
		assert.isNotNull(div.parentElement);
		btn.click();
		assert.isNull(div.parentElement);
	});

	it("can remove multiple class refs", function () {
		var div = make("<div class='foo bar doh' _='on click remove .foo .bar'></div>");
		div.classList.contains("foo").should.equal(true);
		div.classList.contains("bar").should.equal(true);
		div.classList.contains("doh").should.equal(true);
		div.click();
		div.classList.contains("foo").should.equal(false);
		div.classList.contains("bar").should.equal(false);
		div.classList.contains("doh").should.equal(true);
	});
});
