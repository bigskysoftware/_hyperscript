describe("the tell command", function () {
	beforeEach(function () {
		clearWorkArea();
	});
	afterEach(function () {
		clearWorkArea();
	});

	it("establishes a proper beingTold symbol", function () {
		make(
			"<div id='d1' _='on click " +
				"                          add .foo " +
				"                          tell #d2" +
				"                            add .bar'></div>" +
				"<div id='d2'></div>"
		);
		var div1 = byId("d1");
		var div2 = byId("d2");

		div1.classList.contains("bar").should.equal(false);
		div1.classList.contains("foo").should.equal(false);
		div2.classList.contains("bar").should.equal(false);
		div2.classList.contains("foo").should.equal(false);

		div1.click();

		div1.classList.contains("bar").should.equal(false);
		div1.classList.contains("foo").should.equal(true);
		div2.classList.contains("bar").should.equal(true);
		div2.classList.contains("foo").should.equal(false);
	});

	it("does not overwrite the me symobl", function () {
		make(
			"<div id='d1' _='on click " +
				"                          add .foo " +
				"                          tell #d2" +
				"                            add .bar to me'></div>" +
				"<div id='d2'></div>"
		);
		var div1 = byId("d1");
		var div2 = byId("d2");

		div1.classList.contains("bar").should.equal(false);
		div1.classList.contains("foo").should.equal(false);
		div2.classList.contains("bar").should.equal(false);
		div2.classList.contains("foo").should.equal(false);

		div1.click();

		div1.classList.contains("bar").should.equal(true);
		div1.classList.contains("foo").should.equal(true);
		div2.classList.contains("bar").should.equal(false);
		div2.classList.contains("foo").should.equal(false);
	});

	it("works with an array", function () {
		make(
			"<div id='d1' _='on click " +
				"                          add .foo " +
				"                          tell <p/> in me" +
				"                            add .bar'><p id='p1'></p><p id='p2'></p><div id='d2'></div></div>" +
				""
		);

		var div1 = byId("d1");
		var p1 = byId("p1");
		var p2 = byId("p2");
		var div2 = byId("d2");

		div1.classList.contains("bar").should.equal(false);
		div1.classList.contains("foo").should.equal(false);

		div2.classList.contains("bar").should.equal(false);
		div2.classList.contains("foo").should.equal(false);

		p1.classList.contains("bar").should.equal(false);
		p1.classList.contains("foo").should.equal(false);

		p2.classList.contains("bar").should.equal(false);
		p2.classList.contains("foo").should.equal(false);

		div1.click();

		div1.classList.contains("bar").should.equal(false);
		div1.classList.contains("foo").should.equal(true);

		div2.classList.contains("bar").should.equal(false);
		div2.classList.contains("foo").should.equal(false);

		p1.classList.contains("bar").should.equal(true);
		p1.classList.contains("foo").should.equal(false);

		p2.classList.contains("bar").should.equal(true);
		p2.classList.contains("foo").should.equal(false);
	});

	it("restores a proper implicit me symbol", function () {
		make(
			"<div id='d1' _='on click " +
				"                          tell #d2" +
				"                            add .bar" +
				"                          end" +
				"                          add .foo'></div>" +
				"<div id='d2'></div>"
		);

		var div1 = byId("d1");
		var div2 = byId("d2");

		div1.classList.contains("bar").should.equal(false);
		div1.classList.contains("foo").should.equal(false);
		div2.classList.contains("bar").should.equal(false);
		div2.classList.contains("foo").should.equal(false);

		div1.click();

		div1.classList.contains("bar").should.equal(false);
		div1.classList.contains("foo").should.equal(true);
		div2.classList.contains("bar").should.equal(true);
		div2.classList.contains("foo").should.equal(false);
	});

	it("ignores null", function () {
		make(
			"<div id='d1' _='on click " +
				"                          tell null" +
				"                            add .bar" +
				"                          end" +
				"                          add .foo'></div>" +
				"<div id='d2'></div>"
		);

		var div1 = byId("d1");
		var div2 = byId("d2");

		div1.classList.contains("bar").should.equal(false);
		div1.classList.contains("foo").should.equal(false);
		div2.classList.contains("bar").should.equal(false);
		div2.classList.contains("foo").should.equal(false);

		div1.click();

		div1.classList.contains("bar").should.equal(false);
		div1.classList.contains("foo").should.equal(true);
		div2.classList.contains("bar").should.equal(false);
		div2.classList.contains("foo").should.equal(false);
	});

	it("you symbol represents the thing being told", function () {
		make(
			"<div id='d1' _='on click " +
				"                          tell #d2" +
				"                            add .bar to you'></div>" +
				"<div id='d2'></div>"
		);

		var div1 = byId("d1");
		var div2 = byId("d2");

		div1.classList.contains("bar").should.equal(false);
		div2.classList.contains("bar").should.equal(false);

		div1.click();

		div1.classList.contains("bar").should.equal(false);
		div2.classList.contains("bar").should.equal(true);
	});

	it("your symbol represents the thing being told", function () {
		make(
			"<div id='d1' _='on click " +
				"                          tell #d2" +
				"                            put your innerText into me'></div>" +
				"<div id='d2'>foo</div>"
		);

		var div1 = byId("d1");
		var div2 = byId("d2");

		div1.innerText.should.equal("");
		div2.innerText.should.equal("foo");

		div1.click();

		div1.innerText.should.equal("foo");
		div2.innerText.should.equal("foo");
	});

	it("attributes refer to the thing being told", function () {
		make(
			"<div id='d1' _='on click " +
				"                          tell #d2" +
				"                            put @foo into me'></div>" +
				"<div foo='bar' id='d2'></div>"
		);

		var div1 = byId("d1");
		var div2 = byId("d2");

		div1.innerText.should.equal("");
		div2.innerText.should.equal("");

		div1.click();

		div1.innerText.should.equal("bar");
		div2.innerText.should.equal("");
	});

	it("yourself attribute also works", function () {
		make(`<div id="d1" _="on click tell #d2 remove yourself"><div id="d2"></div></div>`);

		var div1 = byId("d1");
		var div2 = byId("d2");

		div1.innerHTML.should.equal(`<div id="d2"></div>`);

		div1.click();

		div1.innerHTML.should.equal("");
	});

	it("tell terminates with a feature", function () {
		make(`<div id="d1" _="on click tell #d2 remove yourself on click tell #d3 remove yourself"><div id="d2"></div><div id="d3"></div></div>`);

		var div1 = byId("d1");
		var div2 = byId("d2");
		var div2 = byId("d3");

		div1.innerHTML.should.equal(`<div id="d2"></div><div id="d3"></div>`);

		div1.click();

		div1.innerHTML.should.equal("");
	});
});
