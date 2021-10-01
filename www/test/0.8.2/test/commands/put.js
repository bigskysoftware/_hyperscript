describe("the put command", function () {
	beforeEach(function () {
		clearWorkArea();
	});
	afterEach(function () {
		clearWorkArea();
	});

	it("can set properties", function () {
		var d1 = make("<div id='d1' _='on click put \"foo\" into #d1.innerHTML'></div>");
		d1.click();
		d1.innerHTML.should.equal("foo");
	});

	it("can put directly into nodes", function () {
		var d1 = make("<div id='d1' _='on click put \"foo\" into #d1'></div>");
		d1.click();
		d1.textContent.should.equal("foo");
	});

	it("can put nodes into nodes", function () {
		var d1 = make("<div id='d1'></div>");
		var d2 = make("<div id='d2' _='on click put #d1 into #d2'></div>");
		console.log(d2);
		d2.click();
		d2.firstChild.should.equal(d1);
	});

	it("can put directly into symbols", function () {
		var d1 = make("<div _='on click put \"foo\" into me'></div>");
		d1.click();
		d1.innerHTML.should.equal("foo");
	});

	it("me symbol doesn't get stomped on direct write", function () {
		var d1 = make('<div _=\'on click put "foo" into me then put "bar" into me\'></div>');
		d1.click();
		d1.innerHTML.should.equal("bar");
	});

	it("can set styles", function () {
		var d1 = make("<div _='on click put \"red\" into my.style.color'>lolwat</div>");
		d1.click();
		d1.style.color.should.equal("red");
	});

	it("can set javascript globals", function () {
		try {
			var d1 = make("<div _='on click put \"red\" into window.temp'>lolwat</div>");
			d1.click();
			window["temp"].should.equal("red");
		} finally {
			delete window.temp;
		}
	});

	it("can set into class ref w/ flatmapped property", function () {
		var div = make("<div _='on click put \"foo\" into .divs.parentElement.innerHTML'></div>");
		make("<div id='d1'><div class='divs'></div></div><div id='d2'><div class='divs'></div></div>");
		div.click();
		var d1 = byId("d1");
		var d2 = byId("d2");
		d1.textContent.should.equal("foo");
		d2.textContent.should.equal("foo");
	});

	it("can set into class ref w/ flatmapped property using of", function () {
		var div = make("<div _='on click put \"foo\" into innerHTML of parentElement of .divs'></div>");
		make("<div id='d1'><div class='divs'></div></div><div id='d2'><div class='divs'></div></div>");
		div.click();
		var d1 = byId("d1");
		var d2 = byId("d2");
		d1.textContent.should.equal("foo");
		d2.textContent.should.equal("foo");
	});

	it("can set local variables", function () {
		var d1 = make(
			"<div id='d1' _='on click put \"foo\" into newVar then" +
				"                                    put newVar into #d1.innerHTML'></div>"
		);
		d1.click();
		d1.innerHTML.should.equal("foo");
	});

	it("can set into id ref", function () {
		var d1 = make("<div id='d1' _='on click put \"foo\" into #d1.innerHTML'></div>");
		d1.click();
		d1.innerHTML.should.equal("foo");
	});

	it("can insert before", function () {
		var d2 = make("<div id='d2' _='on click put #d1 before #d2'></div>");
		var d1 = make("<div id='d1'>foo</div>");
		d2.click();
		d2.previousSibling.textContent.should.equal("foo");
	});

	it("can insert after", function () {
		var d1 = make("<div id='d1'>foo</div>");
		var d2 = make("<div id='d2' _='on click put #d1 after #d2'></div>");
		d2.click();
		d2.nextSibling.textContent.should.equal("foo");
	});

	it("can insert after beginning", function () {
		var d1 = make("<div id='d1' _='on click put \"foo\" at start of #d1'>*</div>");
		d1.click();
		d1.textContent.should.equal("foo*");
	});

	it("can insert before end", function () {
		var d1 = make("<div id='d1' _='on click put \"foo\" at end of #d1'>*</div>");
		d1.click();
		d1.textContent.should.equal("*foo");
	});

	it("waits on promises", function (done) {
		window.promiseAString = function () {
			return new Promise(function (finish) {
				window.finish = finish;
			});
		};
		try {
			var d1 = make("<div id='d1' _='on click put promiseAString() into #d1.innerHTML'></div>");
			d1.click();
			d1.innerHTML.should.equal("");
			finish("foo");
			setTimeout(function () {
				d1.innerHTML.should.equal("foo");
				done();
			}, 20);
		} finally {
			delete window.promiseAString;
			delete window.finish;
		}
	});
});
