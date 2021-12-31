describe("the in expression", function () {
	beforeEach(function () {
		clearWorkArea();
	});
	afterEach(function () {
		clearWorkArea();
	});

	it("basic no query return values", function () {
		var result = evalHyperScript("1 in [1, 2, 3]");
		result.should.deep.equal([1]);

		var result = evalHyperScript("[1, 3] in [1, 2, 3]");
		result.should.deep.equal([1, 3]);

		var result = evalHyperScript("[1, 3, 4] in [1, 2, 3]");
		result.should.deep.equal([1, 3]);

		var result = evalHyperScript("[4, 5, 6] in [1, 2, 3]");
		should.equal(result, null);
	});

	it("basic query return values", function () {
		var div = make("<div id='d1'><p></p><p></p></div>");
		var result = evalHyperScript("<p/> in #d1");
		result.length.should.equal(2);

		var div = make("<div id='d2'><p class='foo'></p><p></p></div>");
		var result = evalHyperScript("<p.foo/> in #d2");
		result.length.should.equal(1);

		var div = make("<div id='d3'><p class='foo'></p><p></p></div>");
		var result = evalHyperScript("<p.foo/> in <div#d3/>");
		result.length.should.equal(1);
	});

	it("id returns values", function () {
		var div = make("<div _='on click get #p1 in me then put its id into @result'><p id='p1'></p></div>");
		div.click();
		div.getAttribute("result").should.equal('p1');
	});

	it("id template returns values", function () {
		var div = make("<div _='on click get #{\"p1\"} in me then put its id into @result'><p id='p1'></p></div>");
		div.click();
		div.getAttribute("result").should.equal('p1');
	});

	it("class returns values", function () {
		var div = make("<div _='on click get the first .p1 in me then put its id into @result'><p id='p1' class='p1'></p></div>");
		div.click();
		div.getAttribute("result").should.equal('p1');
	});

	it("class template returns values", function () {
		var div = make("<div _='on click get the first .{\"p1\"} in me then put its id into @result'><p id='p1' class='p1'></p></div>");
		div.click();
		div.getAttribute("result").should.equal('p1');
	});

	it("query returns values", function () {
		var div = make("<div _='on click get the first <p/> in me then put its id into @result'><p id='p1' class='p1'></p></div>");
		div.click();
		div.getAttribute("result").should.equal('p1');
	});

	it("query template returns values", function () {
		var div = make("<div _='on click get the first <${\"p\"}/> in me then put its id into @result'><p id='p1' class='p1'></p></div>");
		div.click();
		div.getAttribute("result").should.equal('p1');
	});

});
