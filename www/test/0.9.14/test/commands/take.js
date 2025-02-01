describe("the take command", function () {
	beforeEach(function () {
		clearWorkArea();
	});
	afterEach(function () {
		clearWorkArea();
	});

	it("can take a class from other elements", function () {
		var d1 = make("<div class='div foo'></div>");
		var d2 = make("<div class='div' _='on click take .foo from .div'></div>");
		var d3 = make("<div class='div'></div>");
		d1.classList.contains("foo").should.equal(true);
		d2.classList.contains("foo").should.equal(false);
		d3.classList.contains("foo").should.equal(false);
		d2.click();
		d1.classList.contains("foo").should.equal(false);
		d2.classList.contains("foo").should.equal(true);
		d3.classList.contains("foo").should.equal(false);
	});

	it("can take a class from other forms", function () {
		var f1 = make("<form class='div foo'></form>");
		var f2 = make("<form class='div' _='on click take .foo from .div'></form>");
		var f3 = make("<form class='div'></form>");
		f1.classList.contains("foo").should.equal(true);
		f2.classList.contains("foo").should.equal(false);
		f3.classList.contains("foo").should.equal(false);
		f2.click();
		f1.classList.contains("foo").should.equal(false);
		f2.classList.contains("foo").should.equal(true);
		f3.classList.contains("foo").should.equal(false);
	});

	it("can take a class for other elements", function () {
		var d1 = make("<div class='div foo'></div>");
		var d2 = make("<div class='div' _='on click take .foo from .div for #d3'></div>");
		var d3 = make("<div id='d3' class='div'></div>");
		d1.classList.contains("foo").should.equal(true);
		d2.classList.contains("foo").should.equal(false);
		d3.classList.contains("foo").should.equal(false);
		d2.click();
		d1.classList.contains("foo").should.equal(false);
		d2.classList.contains("foo").should.equal(false);
		d3.classList.contains("foo").should.equal(true);
	});

	it("a parent can take a class for other elements", function () {
		var div = make(
			"<div _='on click take .foo from .div for event.target'>" +
				"<div id='d1' class='div foo'></div>" +
				"<div id='d2' class='div'></div>" +
				"<div id='d3' class='div'></div>" +
				"</div>"
		);
		var d1 = byId("d1");
		var d2 = byId("d2");
		var d3 = byId("d3");
		d1.classList.contains("foo").should.equal(true);
		d2.classList.contains("foo").should.equal(false);
		d3.classList.contains("foo").should.equal(false);
		d2.click();
		d1.classList.contains("foo").should.equal(false);
		d2.classList.contains("foo").should.equal(true);
		d3.classList.contains("foo").should.equal(false);
	});

	it("can take an attribute from other elements", function () {
		var d1 = make("<div class='div' data-foo='bar'></div>");
		var d2 = make("<div class='div' _='on click take @data-foo from .div'></div>");
		var d3 = make("<div class='div'></div>");
		d1.getAttribute("data-foo").should.equal("bar");
		assert.isNull(d2.getAttribute("data-foo"))
		assert.isNull(d3.getAttribute("data-foo"))
		d2.click();
		assert.isNull(d1.getAttribute("data-foo"))
		d2.getAttribute("data-foo").should.equal("");
		assert.isNull(d3.getAttribute("data-foo"))
	});

	it("can take an attribute with specific value from other elements", function () {
		var d1 = make("<div class='div' data-foo='bar'></div>");
		var d2 = make("<div class='div' _='on click take @data-foo=baz from .div'></div>");
		var d3 = make("<div class='div'></div>");
		d1.getAttribute("data-foo").should.equal("bar");
		assert.isNull(d2.getAttribute("data-foo"))
		assert.isNull(d3.getAttribute("data-foo"))
		d2.click();
		assert.isNull(d1.getAttribute("data-foo"))
		d2.getAttribute("data-foo").should.equal("baz");
		assert.isNull(d3.getAttribute("data-foo"))
	});

	it("can take an attribute value from other elements and set specific values instead", function () {
		var d1 = make("<div class='div' data-foo='bar'></div>");
		var d2 = make("<div class='div' _='on click take @data-foo=baz with \"qux\" from .div'></div>");
		var d3 = make("<div class='div'></div>");

		d1.getAttribute("data-foo").should.equal("bar");
		assert.isNull(d2.getAttribute("data-foo"))
		assert.isNull(d3.getAttribute("data-foo"))
		d2.click();
		d1.getAttribute("data-foo").should.equal("qux");
		d2.getAttribute("data-foo").should.equal("baz");
		d3.getAttribute("data-foo").should.equal("qux");
	});

	it("can take an attribute value from other elements and set value from an expression instead", function () {
		var d1 = make("<div class='div' data-foo='bar'></div>");
		var d2 = make("<div class='div' data-foo='qux' _='on click take @data-foo=baz with my @data-foo from .div'></div>");
		var d3 = make("<div class='div'></div>");

		d1.getAttribute("data-foo").should.equal("bar");
		d2.getAttribute("data-foo").should.equal("qux");
		assert.isNull(d3.getAttribute("data-foo"))
		d2.click();
		d1.getAttribute("data-foo").should.equal("qux");
		d2.getAttribute("data-foo").should.equal("baz");
		d3.getAttribute("data-foo").should.equal("qux");
	});

	it("can take an attribute for other elements", function () {
		var d1 = make("<div class='div' data-foo='bar'></div>");
		var d2 = make("<div class='div' _='on click take @data-foo from .div for #d3'></div>");
		var d3 = make("<div id='d3' class='div'></div>");
		d1.getAttribute("data-foo").should.equal("bar");
		assert.isNull(d2.getAttribute("data-foo"))
		assert.isNull(d3.getAttribute("data-foo"))
		d2.click();
		assert.isNull(d1.getAttribute("data-foo"))
		assert.isNull(d2.getAttribute("data-foo"))
		d3.getAttribute("data-foo").should.equal("");
	});

	it("a parent can take an attribute for other elements", function () {
		var div = make(
			"<div _='on click take @data-foo from .div for event.target'>" +
				"<div id='d1' class='div' data-foo='bar'></div>" +
				"<div id='d2' class='div'></div>" +
				"<div id='d3' class='div'></div>" +
			"</div>"
		);
		var d1 = byId("d1");
		var d2 = byId("d2");
		var d3 = byId("d3");
		d1.getAttribute("data-foo").should.equal("bar");
		assert.isNull(d2.getAttribute("data-foo"))
		assert.isNull(d3.getAttribute("data-foo"))
		d2.click();
		assert.isNull(d1.getAttribute("data-foo"))
		d2.getAttribute("data-foo").should.equal("");
		assert.isNull(d3.getAttribute("data-foo"))
	});

	it("can take multiple classes from other elements", function () {
		var d1 = make("<div class='div foo'></div>");
		var d2 = make("<div class='div' _='on click take .foo .bar'></div>");
		var d3 = make("<div class='div bar'></div>");
		d1.classList.contains("foo").should.equal(true);
		d2.classList.contains("foo").should.equal(false);
		d3.classList.contains("foo").should.equal(false);
		d1.classList.contains("bar").should.equal(false);
		d2.classList.contains("bar").should.equal(false);
		d3.classList.contains("bar").should.equal(true);
		d2.click();
		d1.classList.contains("foo").should.equal(false);
		d2.classList.contains("foo").should.equal(true);
		d3.classList.contains("foo").should.equal(false);
		d1.classList.contains("bar").should.equal(false);
		d2.classList.contains("bar").should.equal(true);
		d3.classList.contains("bar").should.equal(false);
	});

	it("can take multiple classes from specific element", function () {
		var d1 = make("<div class='div1 foo bar'></div>");
		var d2 = make("<div class='div' _='on click take .foo .bar from .div1'></div>");
		var d3 = make("<div class='div bar'></div>");
		d1.classList.contains("foo").should.equal(true);
		d2.classList.contains("foo").should.equal(false);
		d3.classList.contains("foo").should.equal(false);
		d1.classList.contains("bar").should.equal(true);
		d2.classList.contains("bar").should.equal(false);
		d3.classList.contains("bar").should.equal(true);
		d2.click();
		d1.classList.contains("foo").should.equal(false);
		d2.classList.contains("foo").should.equal(true);
		d3.classList.contains("foo").should.equal(false);
		d1.classList.contains("bar").should.equal(false);
		d2.classList.contains("bar").should.equal(true);
		d3.classList.contains("bar").should.equal(true);
	});


});
