describe("the log command", function () {
	beforeEach(function () {
		clearWorkArea();
	});
	afterEach(function () {
		clearWorkArea();
	});

	it("can log single item", function () {
		var d1 = make("<div _='on click log me'></div>");
		d1.click();
	});

	it("can log multiple items", function () {
		var d1 = make("<div _='on click log me, my'></div>");
		d1.click();
	});

	it("can log multiple items with debug", function () {
		var d1 = make("<div _='on click log me, my with console.debug'></div>");
		d1.click();
	});

	it("can log multiple items with error", function () {
		var d1 = make("<div _='on click log me, my with console.error'></div>");
		d1.click();
	});
});
