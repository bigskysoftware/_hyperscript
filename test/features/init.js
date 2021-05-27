describe("the init feature", function () {
	beforeEach(function () {
		clearWorkArea();
	});
	afterEach(function () {
		clearWorkArea();
	});

	it("can define an init block inline", function (done) {
		var div = make(
			"<div _='init " +
				"                 set my.foo to 42 " +
				"               end" +
				"               on click put my.foo into my.innerHTML'></div>"
		);
		setTimeout(function () {
			div.click();
			div.innerHTML.should.equal("42");
			done();
		}, 10);
	});

	it("can define an init block in a script", function (done) {
		var div = make(
			"<script type='text/hyperscript'>" +
				"  init" +
				"    set window.foo to 42" +
				"  end" +
				"</script>"
		);
		setTimeout(function () {
			window.foo.should.equal(42);
			delete window.foo;
			done();
		}, 10);
	});
});
