describe("the take command", function () {
	beforeEach(function () {
		clearWorkArea();
	});
	afterEach(function () {
		clearWorkArea();
	});

	it("can take a class from other elements", function () {
		var d1 = make("<div class='div foo'></div>");
		var d2 = make(
			"<div class='div' _='on click take .foo from .div'></div>"
		);
		var d3 = make("<div class='div'></div>");
		d1.classList.contains("foo").should.equal(true);
		d2.classList.contains("foo").should.equal(false);
		d3.classList.contains("foo").should.equal(false);
		d2.click();
		d1.classList.contains("foo").should.equal(false);
		d2.classList.contains("foo").should.equal(true);
		d3.classList.contains("foo").should.equal(false);
	});

	it("can take a class for other elements", function () {
		var d1 = make("<div class='div foo'></div>");
		var d2 = make(
			"<div class='div' _='on click take .foo from .div for #d3'></div>"
		);
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
});
