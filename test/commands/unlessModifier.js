describe("the unless command modifier", function () {
	beforeEach(function () {
		clearWorkArea();
	});
	afterEach(function () {
		clearWorkArea();
	});

	it("unless modifier can conditionally execute a command", function () {
		var div = make("<div _='on click toggle .foo unless I match .bar'></div>");

		div.classList.contains("foo").should.equal(false);
		div.click();
		div.classList.contains("foo").should.equal(true);
		div.click();
		div.classList.contains("foo").should.equal(false);

		div.classList.add("bar");
		div.classList.contains("foo").should.equal(false);
		div.click();
		div.classList.contains("foo").should.equal(false);
		div.click();
		div.classList.contains("foo").should.equal(false);
	});
});
