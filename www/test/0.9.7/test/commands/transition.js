describe("the transition command", function () {
	beforeEach(function () {
		clearWorkArea();
	});
	afterEach(function () {
		clearWorkArea();
	});

	it("can transition a single property on current element", function (done) {
		var div = make("<div _='on click transition width from 0px to 100px'></div>");
		div.style.width.should.equal("");
		div.click();
		div.style.width.should.equal("0px");
		setTimeout(function () {
			div.style.width.should.equal("100px");
			done();
		}, 20);
	});

	it("can transition with parameterized values", function (done) {
		var div = make("<div _='on click " +
			"                               set startWidth to 0" +
			"                               set endWidth to 100" +
			"                               transition width from (startWidth)px to (endWidth)px'></div>");
		div.style.width.should.equal("");
		div.click();
		div.style.width.should.equal("0px");
		setTimeout(function () {
			div.style.width.should.equal("100px");
			done();
		}, 20);
	});

	it("can transition a single property on form", function (done) {
		var form = make("<form _='on click transition width from 0px to 100px'></form>");
		form.style.width.should.equal("");
		form.click();
		form.style.width.should.equal("0px");
		setTimeout(function () {
			form.style.width.should.equal("100px");
			done();
		}, 20);
	});

	it("can transition a single property on current element with the my prefix", function (done) {
		var div = make("<div _='on click transition my width from 0px to 100px'></div>");
		div.style.width.should.equal("");
		div.click();
		div.style.width.should.equal("0px");
		setTimeout(function () {
			div.style.width.should.equal("100px");
			done();
		}, 20);
	});

	it("can transition two properties on current element", function (done) {
		var div = make("<div _='on click transition width from 0px to 100px height from 0px to 100px'></div>");
		div.style.width.should.equal("");
		div.style.height.should.equal("");
		div.click();
		div.style.width.should.equal("0px");
		div.style.height.should.equal("0px");
		setTimeout(function () {
			div.style.width.should.equal("100px");
			div.style.height.should.equal("100px");
			done();
		}, 20);
	});

	it("can transition on another element", function (done) {
		var div = make("<div _='on click transition element #foo width from 0px to 100px'></div>");
		var div2 = make("<div id='foo'></div>");
		div2.style.width.should.equal("");
		div.click();
		div2.style.width.should.equal("0px");
		setTimeout(function () {
			div2.style.width.should.equal("100px");
			done();
		}, 20);
	});

	it("can transition on another element no element prefix", function (done) {
		var div = make("<div _='on click transition #foo width from 0px to 100px'></div>");
		var div2 = make("<div id='foo'></div>");
		div2.style.width.should.equal("");
		div.click();
		div2.style.width.should.equal("0px");
		setTimeout(function () {
			div2.style.width.should.equal("100px");
			done();
		}, 20);
	});

	it("can transition on another element no element prefix + possessive", function (done) {
		var div = make('<div _="on click transition #foo\'s width from 0px to 100px"></div>');
		var div2 = make("<div id='foo'></div>");
		div2.style.width.should.equal("");
		div.click();
		div2.style.width.should.equal("0px");
		setTimeout(function () {
			div2.style.width.should.equal("100px");
			done();
		}, 20);
	});

	it("can transition on another element no element prefix with it", function (done) {
		var div = make("<div _='on click get  #foo then transition its width from 0px to 100px'></div>");
		var div2 = make("<div id='foo'></div>");
		div2.style.width.should.equal("");
		div.click();
		div2.style.width.should.equal("0px");
		setTimeout(function () {
			div2.style.width.should.equal("100px");
			done();
		}, 20);
	});

	it("can transition with a custom transition time", function (done) {
		var div = make(
			"<div _='on click transition element #foo width from 0px to 100px using \"width 2s ease-in\"'></div>"
		);
		var div2 = make("<div id='foo'></div>");
		div2.style.width.should.equal("");
		div.click();
		div2.style.width.should.equal("0px");
		setTimeout(function () {
			div2.style.width.should.equal("100px");
			done();
		}, 20);
	});

	it("can transition with a custom transition time via the over syntax", function (done) {
		var div = make("<div _='on click transition element #foo width from 0px to 100px over 2s'></div>");
		var div2 = make("<div id='foo'></div>");
		div2.style.width.should.equal("");
		div.click();
		div2.style.width.should.equal("0px");
		setTimeout(function () {
			div2.style.width.should.equal("100px");
			done();
		}, 20);
	});

	it("can transition a single property on current element using style ref", function (done) {
		var div = make("<div _='on click transition *width from 0px to 100px'></div>");
		div.style.width.should.equal("");
		div.click();
		div.style.width.should.equal("0px");
		setTimeout(function () {
			div.style.width.should.equal("100px");
			done();
		}, 20);
	});

	it("can transition a single property on form  using style ref", function (done) {
		var form = make("<form _='on click transition *width from 0px to 100px'></form>");
		form.style.width.should.equal("");
		form.click();
		form.style.width.should.equal("0px");
		setTimeout(function () {
			form.style.width.should.equal("100px");
			done();
		}, 20);
	});

	it("can transition a single property on current element with the my prefix  using style ref", function (done) {
		var div = make("<div _='on click transition my *width from 0px to 100px'></div>");
		div.style.width.should.equal("");
		div.click();
		div.style.width.should.equal("0px");
		setTimeout(function () {
			div.style.width.should.equal("100px");
			done();
		}, 20);
	});


	it("can use initial to transition to original value", function (done) {
		var div = make("<div style='width: 10px' _='on click 1 transition my *width to 100px " +
			"                                              on click 2 transition my *width to initial'></div>");
		div.style.width.should.equal("10px");
		div.click();
		setTimeout(function () {
			div.style.width.should.equal("100px");
			div.click();
			setTimeout(function () {
				div.style.width.should.equal("10px");
				done();
			}, 20);
		}, 20);
	});


});
