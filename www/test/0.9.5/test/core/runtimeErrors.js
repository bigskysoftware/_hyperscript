describe("_hyperscript runtime errors", function () {
	beforeEach(function () {
		clearWorkArea();
	});
	afterEach(function () {
		clearWorkArea();
	});

	function ensureThrows(src, errorMsg) {
		try {
			_hyperscript(src);
			throw Error("'" + src + "' should have thrown an exception but did not");
		} catch (e) {
			console.log(e);
			e.message.should.equal(errorMsg);
		}
	}

	it("reports basic function invocation null errors properly", function () {
		ensureThrows("x()", "'x' is null");
		ensureThrows("x.y()", "'x' is null");
		ensureThrows("x.y.z()", "'x.y' is null");
	});

	it("reports basic function invocation null errors properly w/ possessives", function () {
		ensureThrows("x's y()", "'x' is null");
		ensureThrows("x's y's z()", "'x's y' is null");
	});

	it("reports basic function invocation null errors properly w/ of", function () {
		ensureThrows("z() of y of x", "'z' is null");
	});

	it("reports null errors on sets properly", function(){
		ensureThrows("set x's y to true", "'x' is null");
		ensureThrows("set x's @y to true", "'x' is null");
	})

	it("reports null errors on settle command properly", function(){
		ensureThrows("settle #doesntExist", "'#doesntExist' is null");
	})

	it("reports null errors on add command properly", function(){
		ensureThrows("add .foo to #doesntExist", "'#doesntExist' is null");
		ensureThrows("add @foo to #doesntExist", "'#doesntExist' is null");
		ensureThrows("add {display:none} to #doesntExist", "'#doesntExist' is null");
	})

	it("reports null errors on remove command properly", function(){
		ensureThrows("remove .foo from #doesntExist", "'#doesntExist' is null");
		ensureThrows("remove @foo from #doesntExist", "'#doesntExist' is null");
		ensureThrows("remove #doesntExist from #doesntExist", "'#doesntExist' is null");
	})

	it("reports null errors on toggle command properly", function(){
		ensureThrows("toggle .foo on #doesntExist", "'#doesntExist' is null");
		ensureThrows("toggle between .foo and .bar on #doesntExist", "'#doesntExist' is null");
		ensureThrows("toggle @foo on #doesntExist", "'#doesntExist' is null");
	})

	it("reports null errors on show command properly", function(){
		ensureThrows("show #doesntExist", "'#doesntExist' is null");
	})

	it("reports null errors on hide command properly", function(){
		ensureThrows("hide #doesntExist", "'#doesntExist' is null");
	})

	it("reports null errors on take command properly", function(){
		ensureThrows("take .foo for #doesntExist", "'#doesntExist' is null");
		ensureThrows("take .foo from #doesntExist for body", "'#doesntExist' is null");
	})

	it("reports null errors on put command properly", function(){
		ensureThrows("put 'foo' into #doesntExist", "'#doesntExist' is null");
		ensureThrows("put 'foo' into #doesntExist's innerHTML", "'#doesntExist' is null");
		ensureThrows("put 'foo' into #doesntExist.innerHTML", "'#doesntExist' is null");
		ensureThrows("put 'foo' before #doesntExist", "'#doesntExist' is null");
		ensureThrows("put 'foo' after #doesntExist", "'#doesntExist' is null");
		ensureThrows("put 'foo' at the start of #doesntExist", "'#doesntExist' is null");
		ensureThrows("put 'foo' at the end of #doesntExist", "'#doesntExist' is null");
	})

	it("reports null errors on transition command properly", function(){
		ensureThrows("transition #doesntExist's visibility to 0", "'#doesntExist' is null");
	})

	it("reports null errors on send command properly", function(){
		ensureThrows("send 'foo' to #doesntExist", "'#doesntExist' is null");
	})

	it("reports null errors on trigger command properly", function(){
		ensureThrows("trigger 'foo' on #doesntExist", "'#doesntExist' is null");
	})

	it("reports null errors on increment command properly", function(){
		ensureThrows("increment #doesntExist's innerHTML", "'#doesntExist' is null");
	})

	it("reports null errors on decrement command properly", function(){
		ensureThrows("decrement #doesntExist's innerHTML", "'#doesntExist' is null");
	})

	it("reports null errors on default command properly", function(){
		ensureThrows("default #doesntExist's innerHTML to 'foo'", "'#doesntExist' is null");
	})

	it("reports null errors on measure command properly", function(){
		ensureThrows("measure #doesntExist", "'#doesntExist' is null");
	})

});
