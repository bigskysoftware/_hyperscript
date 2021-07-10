describe("the async expression works", function () {
	it("simple async expression works", function () {
		var result = evalHyperScript("(async 1)");
		result.value.should.deep.equal(1);
	});

	it("async argument works w/ non-async value", function () {
		var val = null;
		window.func = function (x) {
			val = x;
		};
		var result = evalHyperScript("func(async 1)");
		val.should.equal(1);
		delete window.func;
	});

	it("async argument works w/ async value", function (done) {
		var val = null;
		window.func = function (x) {
			val = x;
		};
		var result = evalHyperScript("func(async promiseAnIntIn(10))");
		val.then(function (i) {
			i.should.equal(42);
			delete window.func;
			done();
		});
	});
});
