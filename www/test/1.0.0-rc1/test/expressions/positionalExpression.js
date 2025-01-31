describe("the positional expression", function () {
	beforeEach(function () {
		clearWorkArea();
	});
	afterEach(function () {
		//clearWorkArea();
	});

	it("first works", function () {
		var result = evalHyperScript("the first of [1, 2, 3]");
		result.should.equal(1);
	});

	it("last works", function () {
		var result = evalHyperScript("the last of [1, 2, 3]");
		result.should.equal(3);
	});

	it("first works w/ array-like", function () {
		var div = make(
			"<div id='d1' class='c1'></div>\n" +
				"                  <div id='d2' class='c1'></div>\n" +
				"                  <div id='d3' class='c1'></div>\n"
		);
		var result = evalHyperScript("the first of .c1");
		result.should.equal(byId("d1"));
	});

	it("last works w/ array-like", function () {
		var div = make(
			"<div id='d1' class='c1'></div>" +
				"                  <div id='d2' class='c1'></div>" +
				"                  <div id='d3' class='c1'></div>"
		);
		var result = evalHyperScript("the last of .c1");
		result.should.equal(byId("d3"));
	});

	it("first works w/ node", function () {
		var div = make(
			"<div><div id='d1' class='c1'></div>" +
				"                  <div id='d2' class='c1'></div>" +
				"                  <div id='d3' class='c1'></div></div>"
		);
		var result = evalHyperScript("the first of div", { locals: { div: div } });
		result.should.equal(byId("d1"));
	});

	it("last works w/ node", function () {
		var div = make(
			"<div><div id='d1' class='c1'></div>" +
				"                  <div id='d2' class='c1'></div>" +
				"                  <div id='d3' class='c1'></div></div>"
		);
		var result = evalHyperScript("the last of div", { locals: { div: div } });
		result.should.equal(byId("d3"));
	});

	it("is null safe", function () {
		var result = evalHyperScript("the first of null");
		should.equal(result, undefined);
	});


});
