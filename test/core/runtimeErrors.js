describe("_hyperscript runtime errors", function () {
	beforeEach(function () {
		clearWorkArea();
	});
	afterEach(function () {
		clearWorkArea();
	});

	it("basic null errors are properly reported", function () {
		try {
			_hyperscript("x()");
			throw "should have thrown";
		} catch (e) {
			e.message.should.equal("'x' is null");
		}

		try {
			_hyperscript("x.y()");
			throw "should have thrown";
		} catch (e) {
			e.message.should.equal("'x' is null");
		}

		try {
			_hyperscript("x.y()", { x: {} });
			throw "should have thrown";
		} catch (e) {
			e.message.should.equal("'x.y' is null");
		}
	});

	it("reports null errors on sets properly", function(){
		try {
			_hyperscript("set x's y to true");
			throw "should have thrown";
		} catch (e) {
			e.message.should.equal("'x' is null");
		}
		try {
			_hyperscript("set x's @y to true");
			throw "should have thrown";
		} catch (e) {
			e.message.should.equal("'x' is null");
		}
	})

	it("reports null errors on show command properly", function(){
		try {
			_hyperscript("show #doesntExist");
		} catch (e) {
			e.message.should.equal("'#doesntExist' is null");
		}
	})
});
