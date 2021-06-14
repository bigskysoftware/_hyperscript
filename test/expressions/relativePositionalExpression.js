describe("the relative positional expression", function () {
	beforeEach(function () {
		clearWorkArea();
	});

	it("next works properly among siblings", function () {
		var div = make(
			"<div id='d1' class='c1'></div>\n" +
				"                  <div id='d2' class='c1'></div>\n" +
				"                  <div id='d3' class='c1'></div>\n"
		);
		var result = evalHyperScript("the next <div/> from #d1");
		result.should.equal(byId("d2"));
		var result = evalHyperScript("the next <div/> from #d2");
		result.should.equal(byId("d3"));
		var result = evalHyperScript("the next <div/> from #d3");
		should.equal(result, undefined);
	});

	it("relative next works properly among siblings w/ query", function () {
		make(
			"<div id='d1' _='on click add .foo to next <div/>' class='c1'></div>\n" +
			"       <div id='d2' class='c1'></div>"
		);
		var d1 = byId('d1')
		var d2 = byId('d2')
		d1.click();
		d2.classList.contains('foo');
	});

	it("relative next works properly among siblings w/ class", function () {
		make(
			"<div id='d1' _='on click add .foo to next .c1' class='c1'></div>\n" +
			"       <div id='d2' class='c1'></div>"
		);
		var d1 = byId('d1')
		var d2 = byId('d2')
		d1.click();
		d2.classList.contains('foo');
	});

	it("relative next works properly among siblings w/ query & class", function () {
		make(
			"<div id='d1' _='on click add .foo to next <div.c1/>' class='c1'></div>\n" +
			"       <div id='d2' class='c1'></div>"
		);
		var d1 = byId('d1')
		var d2 = byId('d2')
		d1.click();
		d2.classList.contains('foo');
	});

	it("previous works properly among siblings", function () {
		var div = make(
			"<div id='d1' class='c1'></div>\n" +
				"                  <div id='d2' class='c1'></div>\n" +
				"                  <div id='d3' class='c1'></div>\n"
		);
		var result = evalHyperScript("the previous <div/> from #d1 within #work-area");
		should.equal(result, undefined);
		var result = evalHyperScript("the previous <div/> from #d2");
		result.should.equal(byId("d1"));
		var result = evalHyperScript("the previous <div/> from #d3");
		result.should.equal(byId("d2"));
	});

	it("relative previous works properly among siblings w/ query", function () {
		make(
			"<div id='d1' class='c1'></div>\n" +
			"       <div id='d2' _='on click add .foo to previous <div/>' class='c1'></div>"
		);
		var d1 = byId('d1')
		var d2 = byId('d2')
		d2.click();
		d1.classList.contains('foo');
	});

	it("relative previous works properly among siblings w/ class", function () {
		make(
			"<div id='d1' class='c1'></div>\n" +
			"       <div id='d2' _='on click add .foo to previous .c1' class='c1'></div>"
		);
		var d1 = byId('d1')
		var d2 = byId('d2')
		d2.click();
		d1.classList.contains('foo');
	});

	it("relative previous works properly among siblings w/ query & class", function () {
		make(
			"<div id='d1' class='c1'></div>\n" +
			"       <div id='d2' _='on click add .foo to previous <div.c1/>' class='c1'></div>"
		);
		var d1 = byId('d1')
		var d2 = byId('d2')
		d2.click();
		d1.classList.contains('foo');
	});

	it("properly constrains via the within modifier", function () {
		make(
			"<div id='d1' class='c1'><div id='d2' class='c1'></div><div id='d3' class='c1'></div></div><div id='d4' class='c1'>\n"
		);
		var result = evalHyperScript("the next .c1 from #d2 within #d1");
		result.should.equal(byId("d3"));
		var result = evalHyperScript("the next .c1 from #d3 within #d1");
		should.equal(result, undefined);
		var result = evalHyperScript("the next .c1 from #d3 within the #work-area");
		result.should.equal(byId("d4"));
	});

});
