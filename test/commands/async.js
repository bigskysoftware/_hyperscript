describe("the async command", function () {
	beforeEach(function () {
		clearWorkArea();
	});
	afterEach(function () {
		clearWorkArea();
	});

	it("is async", function (done) {
		var div = make("<div _='on click async add .foo'></div>");
		div.classList.contains("foo").should.equal(false);
		div.click();
		div.classList.contains("foo").should.equal(false);
		setTimeout(function () {
			div.classList.contains("foo").should.equal(true);
			done();
		}, 10);
	});

	it("can trigger an event on the original element", function (done) {
		var div = make(
			"<div _='on click async do  " +
				"                                     wait 10ms" +
				"                                     trigger foo" +
				"                                   end" +
				"                                   add .bar" +
				"                                   wait for foo" +
				"                                   add .foo'></div>"
		);
		div.classList.contains("bar").should.equal(false);
		div.classList.contains("foo").should.equal(false);
		div.click();
		div.classList.contains("bar").should.equal(true);
		div.classList.contains("foo").should.equal(false);
		setTimeout(function () {
			div.classList.contains("bar").should.equal(true);
			div.classList.contains("foo").should.equal(true);
			done();
		}, 20);
	});
});
