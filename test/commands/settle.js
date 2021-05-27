describe("the settle command", function () {
	beforeEach(function () {
		clearWorkArea();
	});
	afterEach(function () {
		clearWorkArea();
	});

	it("can settle me no transition", function (done) {
		var d1 = make("<div id='d1' _='on click settle then add .foo'></div>");
		d1.click();
		d1.classList.contains("foo").should.equal(false);
		setTimeout(function () {
			d1.classList.contains("foo").should.equal(true);
			done();
		}, 1000);
	});

	it("can settle target no transition", function (done) {
		var d1 = make("<div id='d1'></div>");
		var d2 = make(
			"<div _='on click settle #d1 then add .foo to #d1'></div>"
		);
		d2.click();
		d1.classList.contains("foo").should.equal(false);
		setTimeout(function () {
			d1.classList.contains("foo").should.equal(true);
			done();
		}, 1000);
	});
});
