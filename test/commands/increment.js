describe("the increment command", function () {
	beforeEach(function () {
		clearWorkArea();
	});
	afterEach(function () {
		clearWorkArea();
	});

	it("can increment an empty variable", function () {
		var div = make(`<div _="on click increment value then put value into me"></div>`);
		div.click();
		div.innerHTML.should.equal("1");
	});

	it("can increment a variable", function () {
		var div = make(`<div _="on click set value to 20 then increment value by 2 then put value into me"></div>`);
		div.click();
		div.innerHTML.should.equal("22");
	});

	it("can increment refer to result", function () {
		var div = make(`<div _="on click increment value by 2 then put it into me"></div>`);
		div.click();
		div.innerHTML.should.equal("2");
	});

	it("can increment an attribute", function () {
		var div = make(`<div value="5" _="on click increment @value then put @value into me"></div>`);
		div.click();
		div.click();
		div.click();
		div.innerHTML.should.equal("8");
	});

	it("can increment an floating point numbers", function () {
		var div = make(
			`<div value="5" _="on click set value to 5.2 then increment value by 6.1 then put value into me"></div>`
		);
		div.click();
		div.innerHTML.should.equal("11.3");
	});

	it("can increment a property", function () {
		var div = make(`<div _="on click increment my.innerHTML">3</div>`);
		div.click();
		div.click();
		div.click();
		div.innerHTML.should.equal("6");
	});

	it("can increment by zero", function () {
		var div = make(`<div _="on click set value to 20 then increment value by 0 then put value into me"></div>`);
		div.click();
		div.innerHTML.should.equal("20");
	});

	it("can increment a value multiple times", function () {
		var div = make(`<div _="on click increment my.innerHTML"></div>`);
		div.click();
		div.click();
		div.click();
		div.click();
		div.click();
		div.innerHTML.should.equal("5");
	});

	it("can decrement an empty variable", function () {
		var div = make(`<div _="on click decrement value then put value into me"></div>`);
		div.click();
		div.innerHTML.should.equal("-1");
	});

	it("can decrement a variable", function () {
		var div = make(`<div _="on click set value to 20 then decrement value by 2 then put value into me"></div>`);
		div.click();
		div.innerHTML.should.equal("18");
	});

	it("can decrement an attribute", function () {
		var div = make(`<div value="5" _="on click decrement @value then put @value into me"></div>`);
		div.click();
		div.click();
		div.click();
		div.innerHTML.should.equal("2");
	});

	it("can decrement an floating point numbers", function () {
		var div = make(
			`<div value="5" _="on click set value to 6.1 then decrement value by 5.1 then put value into me"></div>`
		);
		div.click();
		div.innerHTML.should.equal("1");
	});

	it("can decrement a property", function () {
		var div = make(`<div _="on click decrement my.innerHTML">3</div>`);
		div.click();
		div.click();
		div.click();
		div.innerHTML.should.equal("0");
	});

	it("can decrement a value multiple times", function () {
		var div = make(`<div _="on click decrement my.innerHTML"></div>`);
		div.click();
		div.click();
		div.click();
		div.click();
		div.click();
		div.innerHTML.should.equal("-5");
	});

	it("can decrement by zero", function () {
		var div = make(`<div _="on click set value to 20 then decrement value by 0 then put value into me"></div>`);
		div.click();
		div.innerHTML.should.equal("20");
	});


});
