describe("the queryRef expression", function () {
	beforeEach(function () {
		clearWorkArea();
	});
	afterEach(function () {
		clearWorkArea();
	});

	it("basic queryRef works", function () {
		var div = make("<div class='c1'></div>");
		var value = evalHyperScript("<.c1/>");
		Array.from(value)[0].should.equal(div);
	});

	it("basic queryRef works w/ multiple matches", function () {
		var div = make(
			"<div class='c1'></div>" +
				"                  <div class='c1'></div>" +
				"                  <div class='c1'></div>"
		);
		var value = evalHyperScript("<.c1/>");
		Array.from(value).length.should.equal(3);
	});

	it("basic queryRef works w/ properties", function () {
		var div = make(
			"<div title='t1'></div>" +
				"                  <div title='t2'></div>" +
				"                  <div title='t3'></div>"
		);
		var value = evalHyperScript("<[title=t2]/>");
		Array.from(value).length.should.equal(1);
	});

	it("basic queryRef works w/ funny selector", function () {
		var div = make(
			"<div title='t1'></div>" +
				"                  <div title='t2'></div>" +
				"                  <div title='t3'></div>"
		);
		var value = evalHyperScript("<:active/>");
		Array.from(value).length.should.equal(0);
	});

	it("basic queryRef works w/ div selector", function () {
		var div = make(
			"<div class='c1'></div>" +
				"                  <div class='c2'></div>" +
				"                  <div class='c3'></div>"
		);
		var value = evalHyperScript("<div.c1/>");
		Array.from(value).length.should.equal(1);
	});

	it("basic queryRef works w no match", function () {
		var value = evalHyperScript("<.badClassThatDoesNotHaveAnyElements/>");
		Array.from(value).length.should.equal(0);
	});

	it("basic queryRef works w properties w/ strings", function () {
		var div = make(
			"<div class='c1'></div>" +
				"                  <div foo='bar' class='c2'></div>" +
				"                  <div class='c3'></div>"
		);
		var value = evalHyperScript("<[foo='bar']/>");
		Array.from(value).length.should.equal(1);
	});

	it("queryRef w/ $ works ", function () {
		var div = make(
			"<div class='c1'></div>" +
				"                  <div foo='bar' class='c2'></div>" +
				"                  <div class='c3'></div>"
		);
		var value = evalHyperScript("<[foo='${x}']/>", { x: "bar" });
		Array.from(value).length.should.equal(1);
	});

	it("queryRef w/ $ no curlies works", function () {
		var div = make(
			"<div id='t1'></div>" + "                  <div id='t2'></div>" + "                  <div id='t3'></div>"
		);
		var value = evalHyperScript("<#$id/>", { id: "t2" });
		Array.from(value)[0].should.equal(byId("t2"));
	});

	it("can interpolate elements into queries", function () {
		var a = make("<div class='a'></div>");
		var b = make("<div class='b'></div>");
		var value = evalHyperScript("<${a} + div/>", { a });
		Array.from(value)[0].should.equal(b);
	});
});
