describe("the idRef expression", function () {
	beforeEach(function () {
		clearWorkArea();
	});
	afterEach(function () {
		clearWorkArea();
	});

	it("basic id ref works", function () {
		var div = make("<div id='d1'></div>");
		var value = evalHyperScript("#d1");
		value.should.equal(div);
	});

	it("basic id ref works w no match", function () {
		var div = make("<div></div>");
		var value = evalHyperScript("#d1");
		should.equal(value, null);
	});

	it("template id ref works", function () {
		var div = make("<div id='d1'></div>");
		var value = evalHyperScript("#{'d1'}");
		value.should.equal(div);
	});

	it("id ref works from a disconnected element", function () {
		var div = make("<div id='d1'></div>");
		var value = evalHyperScript("#d1", { me: document.createElement('div') });
		value.should.equal(div);
	});
});
