describe("the attributeRef expression", function () {
	beforeEach(function () {
		clearWorkArea();
	});
	afterEach(function () {
		clearWorkArea();
	});

	it("attributeRef with no value works", function () {
		var div = make("<div foo='c1'></div>");
		var value = _hyperscript("[@foo]", { me: div });
		value.should.equal("c1");
	});

	it("attributeRef with dashes name works", function () {
		var div = make("<div data-foo='c1'></div>");
		var value = _hyperscript("[@data-foo]", { me: div });
		value.should.equal("c1");
	});

	it("attributeRef can be set as symbol", function () {
		var div = make("<div _='on click set [@data-foo] to \"blue\"' data-foo='red'></div>");
		div.click();
		div.getAttribute("data-foo").should.equal("blue");
	});

	it("attributeRef can have value used in add commands", function () {
		var div = make("<div _='on click add [@data-foo=blue]' data-foo='red'></div>");
		div.click();
		div.getAttribute("data-foo").should.equal("blue");
	});

	it("attributeRef can have value in quotes used in add commands", function () {
		var div = make("<div _='on click add [@data-foo=\"blue\"]' data-foo='red'></div>");
		div.click();
		div.getAttribute("data-foo").should.equal("blue");
	});

	it("attributeRef can have value in quotes with spaces used in add commands", function () {
		var div = make("<div _='on click add [@data-foo=\"blue green\"]' data-foo='red'></div>");
		div.click();
		div.getAttribute("data-foo").should.equal("blue green");
	});

	it("attributeRef can be set as prop", function () {
		var div = make("<div data-foo='red'></div>");
		var value = _hyperscript("set x[@data-foo] to 'blue'", { locals: { x: div } });
		div.getAttribute("data-foo").should.equal("blue");
	});

	it("attributeRef can be set through possessive", function () {
		var div = make("<div _='on click set my [@data-foo] to \"blue\"' data-foo='red'></div>");
		div.click();
		div.getAttribute("data-foo").should.equal("blue");
	});

	it("attributeRef can be set indirectly", function () {
		var div = make("<div data-foo='red'></div>");
		var value = _hyperscript("set [@data-foo] of x to 'blue'", { locals: { x: div } });
		div.getAttribute("data-foo").should.equal("blue");
	});

	it("attributeRef can be put indirectly", function () {
		var div = make("<div data-foo='red'></div>");
		var value = _hyperscript("put 'blue' into x[@data-foo]", { locals: { x: div } });
		div.getAttribute("data-foo").should.equal("blue");
	});

	it("attributeRef can be put as symbol", function () {
		var div = make("<div _='on click put \"blue\" into [@data-foo]' data-foo='red'></div>");
		div.click();
		div.getAttribute("data-foo").should.equal("blue");
	});

	it("attributeRef with no value works w/ short syntax", function () {
		var div = make("<div foo='c1'></div>");
		var value = _hyperscript("@foo", { me: div });
		value.should.equal("c1");
	});

	it("attributeRef with dashes name works w/ short syntax", function () {
		var div = make("<div data-foo='c1'></div>");
		var value = _hyperscript("@data-foo", { me: div });
		value.should.equal("c1");
	});

	it("attributeRef can be set as symbol w/ short syntax", function () {
		var div = make("<div _='on click set @data-foo to \"blue\"' data-foo='red'></div>");
		div.click();
		div.getAttribute("data-foo").should.equal("blue");
	});

	it("attributeRef can be set as prop w/ short syntax", function () {
		var div = make("<div data-foo='red'></div>");
		var value = _hyperscript("set x@data-foo to 'blue'", { locals: { x: div } });
		div.getAttribute("data-foo").should.equal("blue");
	});

	it("attributeRef can be set through possessive  w/ short syntax", function () {
		var div = make("<div _='on click set my @data-foo to \"blue\"' data-foo='red'></div>");
		div.click();
		div.getAttribute("data-foo").should.equal("blue");
	});

	it("attributeRef can be set indirectly w/ short syntax", function () {
		var div = make("<div data-foo='red'></div>");
		var value = _hyperscript("set @data-foo of x to 'blue'", { locals: { x: div } });
		div.getAttribute("data-foo").should.equal("blue");
	});

	it("attributeRef can be put indirectly w/ short syntax", function () {
		var div = make("<div data-foo='red'></div>");
		var value = _hyperscript("put 'blue' into x@data-foo", { locals: { x: div } });
		div.getAttribute("data-foo").should.equal("blue");
	});

	it("attributeRef can be put as symbol w/ short syntax", function () {
		var div = make("<div _='on click put \"blue\" into @data-foo' data-foo='red'></div>");
		div.click();
		div.getAttribute("data-foo").should.equal("blue");
	});

	it("attributeRef can have value used in add commands w/ short syntax", function () {
		var div = make("<div _='on click add @data-foo=blue' data-foo='red'></div>");
		div.click();
		div.getAttribute("data-foo").should.equal("blue");
	});

	it("attributeRef can have value in quotes used in add commands w/ short syntax", function () {
		var div = make("<div _='on click add @data-foo=\"blue\"' data-foo='red'></div>");
		div.click();
		div.getAttribute("data-foo").should.equal("blue");
	});

	it("attributeRef can have value in quotes with spaces used in add commands w/ short syntax", function () {
		var div = make("<div _='on click add @data-foo=\"blue green\"' data-foo='red'></div>");
		div.click();
		div.getAttribute("data-foo").should.equal("blue green");
	});


});
