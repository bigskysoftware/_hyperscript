describe("possessiveExpression", function () {
	beforeEach(function () {
		clearWorkArea();
	});
	afterEach(function () {
		clearWorkArea();
	});

	it("can access basic properties", function () {
		var result = evalHyperScript("foo's foo", { locals: { foo: { foo: "foo" } } });
		result.should.equal("foo");
	});

	it("is null safe", function () {
		var result = evalHyperScript("foo's foo");
		should.equal(result, undefined);
	});

	it("can access my properties", function () {
		var result = evalHyperScript("my foo", { me: { foo: "foo" } });
		result.should.equal("foo");
	});

	it("my property is null safe", function () {
		var result = evalHyperScript("my foo");
		should.equal(result, undefined);
	});

	it("can access its properties", function () {
		var result = evalHyperScript("its foo", { result: { foo: "foo" } });
		result.should.equal("foo");
	});

	it("its property is null safe", function () {
		var result = evalHyperScript("its foo");
		should.equal(result, undefined);
	});

	it("can access properties on idrefs", function () {
		make("<div id='foo' style='display: inline'></div>");
		var result = evalHyperScript("the display of #foo's style");
		result.should.equal("inline");
	});

	it("can access properties on idrefs 2", function () {
		make("<div id='foo' style='display: inline'></div>");
		var result = evalHyperScript("#foo's style's display");
		result.should.equal("inline");
	});

	it("can access properties on classrefs", function () {
		make("<div class='foo' style='display: inline'></div>");
		var result = evalHyperScript("the display of .foo's style");
		result.should.deep.equal(["inline"]);
	});

	it("can access properties on classrefs 2", function () {
		make("<div class='foo' style='display: inline'></div>");
		var result = evalHyperScript(".foo's style's display");
		result.should.deep.equal(["inline"]);
	});

	it("can access properties on queryrefs", function () {
		make("<div class='foo' style='display: inline'></div>");
		var result = evalHyperScript("the display of <.foo/>'s style");
		result.should.deep.equal(["inline"]);
	});

	it("can access properties on queryrefs 2", function () {
		make("<div class='foo' style='display: inline'></div>");
		var result = evalHyperScript("<.foo/>'s style's display");
		result.should.deep.equal(["inline"]);
	});

	it("can access basic attribute", function () {
		var div = make("<div data-foo='bar'></div>");
		var result = evalHyperScript("foo's [@data-foo]", { locals: { foo: div } });
		result.should.equal("bar");
	});

	it("can access my attribute", function () {
		var div = make("<div data-foo='bar'></div>");
		var result = evalHyperScript("my @data-foo", { me: div });
		result.should.equal("bar");
	});

	it("can access multiple basic attributes", function () {
		make("<div class='c1' data-foo='bar'></div><div class='c1' data-foo='bar'></div>");
		var result = evalHyperScript(".c1's [@data-foo]");
		result.should.deep.equal(["bar", "bar"]);
	});

	it("can set basic attributes", function () {
		var div = make("<div data-foo='bar'></div>");
		var result = evalHyperScript("set foo's [@data-foo] to 'blah'", {
			locals: { foo: div, }
		});
		div.getAttribute("data-foo").should.equal("blah");
	});

	it("can set multiple basic attributes", function () {
		make("<div id='d1' class='c1' data-foo='bar'></div><div id='d2' class='c1' data-foo='bar'></div>");
		var result = evalHyperScript("set .c1's [@data-foo] to 'blah'");
		byId('d1').getAttribute('data-foo').should.equal('blah')
		byId('d2').getAttribute('data-foo').should.equal('blah')
	});

	it("can access basic style", function () {
		var div = make("<div style='color:red'></div>");
		var result = evalHyperScript("foo's *color", { locals: { foo: div } });
		result.should.equal("red");
	});

	it("can access my style", function () {
		var div = make("<div style='color:red'></div>");
		var result = evalHyperScript("my *color", { me: div });
		result.should.equal("red");
	});

	it("can access multiple basic styles", function () {
		make("<div class='c1' style='color:red'></div><div class='c1' style='color:red'></div>");
		var result = evalHyperScript(".c1's *color");
		result.should.deep.equal(["red", "red"]);
	});

	it("can set root styles", function () {
		var div = make("<div style='color:red'></div>");
		var result = evalHyperScript("set *color to 'blue'", {me: div});
		div.style["color"].should.equal("blue");
	});

	it("can set basic styles", function () {
		var div = make("<div style='color:red'></div>");
		var result = evalHyperScript("set foo's *color to 'blue'", { locals: { foo: div } });
		div.style["color"].should.equal("blue");
	});

	it("can set multiple basic styles", function () {
		make("<div id='d1' class='c1' style='color:red'></div><div id='d2' class='c1' style='color:red'></div>");
		var result = evalHyperScript("set .c1's *color to 'blue'");
		byId('d1').style['color'].should.equal('blue')
		byId('d2').style['color'].should.equal('blue')
	});
});
