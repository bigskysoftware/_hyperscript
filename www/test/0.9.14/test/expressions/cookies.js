describe("the cookies identifier", function () {
	beforeEach(function () {
		evalHyperScript("cookies.clearAll()");
	});
	afterEach(function () {
		evalHyperScript("cookies.clearAll()");
	});


	it("basic set cookie values work", function () {
		var result = evalHyperScript("cookies.foo");
		should.equal(result, undefined);
		evalHyperScript("set cookies.foo to 'bar'");
		result = evalHyperScript("cookies.foo");
		result.should.equal('bar');
	});

	it("update cookie values work", function () {
		evalHyperScript("set cookies.foo to 'bar'");
		var result = evalHyperScript("cookies.foo");
		result.should.equal('bar');
		evalHyperScript("set cookies.foo to 'doh'");
		var result = evalHyperScript("cookies.foo");
		result.should.equal('doh');
	});

	it("basic clear cookie values work", function () {
		evalHyperScript("set cookies.foo to 'bar'");
		evalHyperScript("cookies.clear('foo')");
		var result = evalHyperScript("cookies.foo");
		should.equal(result, undefined);
	});

	it("iterate cookies values work", function () {
		evalHyperScript("set cookies.foo to 'bar'");
		let context = {me:[], you:[]}; // horrifying, but use arrays for me and you to capture values...
		evalHyperScript("for x in cookies me.push(x.name) then you.push(x.value) end", context);
		context.me.includes('foo').should.equal(true);
		context.you.includes('bar').should.equal(true);
	});

});
