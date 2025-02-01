describe("the set feature", function () {
	beforeEach(function () {
		clearWorkArea();
	});
	afterEach(function () {
		clearWorkArea();
	});

	it("can define variables with let at the element level", function (done) {
		var div = make(
			"<div _='set :foo to 42 " +
				"           on click put :foo into my innerHTML'></div>"
		);
		div.click();
		div.innerHTML.should.equal("42");
		done();
	});

});
