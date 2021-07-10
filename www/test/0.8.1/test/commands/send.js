describe("the send command", function () {
	beforeEach(function () {
		clearWorkArea();
	});
	afterEach(function () {
		clearWorkArea();
	});

	it("can send events", function () {
		var div = make("<div _='on click send foo to #bar'></div>");
		var bar = make("<div id='bar' _='on foo add .foo-sent'></div>");
		bar.classList.contains("foo-sent").should.equal(false);
		div.click();
		bar.classList.contains("foo-sent").should.equal(true);
	});

	it("can send events with args", function () {
		var div = make("<div _='on click send foo(x:42) to #bar'></div>");
		var bar = make("<div id='bar' _='on foo put event.detail.x into my.innerHTML'></div>");
		bar.classList.contains("foo-sent").should.equal(false);
		div.click();
		bar.innerHTML.should.equal("42");
	});

	it("can send events with dots", function () {
		var div = make("<div _='on click send foo.bar to #bar'></div>");
		var bar = make("<div id='bar' _='on foo.bar add .foo-sent'></div>");
		bar.classList.contains("foo-sent").should.equal(false);
		div.click();
		bar.classList.contains("foo-sent").should.equal(true);
	});

	it("can send events with dots with args", function () {
		var div = make("<div _='on click send foo.bar(x:42) to #bar'></div>");
		var bar = make("<div id='bar' _='on foo.bar put event.detail.x into my.innerHTML'></div>");
		bar.classList.contains("foo-sent").should.equal(false);
		div.click();
		bar.innerHTML.should.equal("42");
	});

	it("can send events with colons", function () {
		var div = make("<div _='on click send foo:bar to #bar'></div>");
		var bar = make("<div id='bar' _='on foo:bar add .foo-sent'></div>");
		bar.classList.contains("foo-sent").should.equal(false);
		div.click();
		bar.classList.contains("foo-sent").should.equal(true);
	});

	it("can send events with colons with args", function () {
		var div = make("<div _='on click send foo:bar(x:42) to #bar'></div>");
		var bar = make("<div id='bar' _='on foo:bar put event.detail.x into my.innerHTML'></div>");
		bar.classList.contains("foo-sent").should.equal(false);
		div.click();
		bar.innerHTML.should.equal("42");
	});
	
	it("can send events to any expression", function () {
		var div = make("<div _='def bar return #bar on click send foo to bar()'></div>");
		var bar = make("<div id='bar' _='on foo add .foo-sent'></div>");
		bar.classList.contains("foo-sent").should.equal(false);
		div.click();
		bar.classList.contains("foo-sent").should.equal(true);
	});
});
