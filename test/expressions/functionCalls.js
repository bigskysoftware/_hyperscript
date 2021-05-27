describe("function call expressions", function () {
	it("can invoke global function", function () {
		window.identity = function (x) {
			return x;
		};
		try {
			var result = evalHyperScript('identity("foo")');
			result.should.equal("foo");
		} finally {
			delete window.identity;
		}
	});

	it("can invoke function on object", function () {
		window.obj = {
			value: "foo",
			getValue: function () {
				return this.value;
			},
		};
		try {
			var result = evalHyperScript("obj.getValue()");
			result.should.equal("foo");
		} finally {
			delete window.obj;
		}
	});

	it("can invoke global function w/ async arg", function (done) {
		window.identity = function (x) {
			return x;
		};
		var result = evalHyperScript("identity(promiseAnIntIn(10))");
		result.then(function (result) {
			result.should.equal(42);
			delete window.identity;
			done();
		});
	});

	it("can invoke function on object w/ async arg", function (done) {
		window.obj = {
			identity: function (x) {
				return x;
			},
		};
		var result = evalHyperScript("obj.identity(promiseAnIntIn(10))");
		result.then(function (result) {
			result.should.equal(42);
			delete window.obj;
			done();
		});
	});

	it("can invoke function on object w/ async root & arg", function (done) {
		window.obj = {
			identity: function (x) {
				return x;
			},
		};
		var result = evalHyperScript(
			"promiseValueBackIn(obj, 20).identity(promiseAnIntIn(10))"
		);
		result.then(function (result) {
			result.should.equal(42);
			delete window.obj;
			done();
		});
	});
});
