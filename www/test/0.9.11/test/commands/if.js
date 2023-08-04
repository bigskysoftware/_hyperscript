describe("the if command", function () {
	beforeEach(function () {
		clearWorkArea();
	});
	afterEach(function () {
		clearWorkArea();
	});

	it("basic true branch works", function () {
		var d1 = make("<div _='on click if true put \"foo\" into me.innerHTML'></div>");
		d1.click();
		d1.innerHTML.should.equal("foo");
	});

	it("basic true branch works with multiple commands", function () {
		var d1 = make(
			"<div _='on click if true log me then " +
				'                                  put "foo" into me.innerHTML\'></div>'
		);
		d1.click();
		d1.innerHTML.should.equal("foo");
	});

	it("basic true branch works with end", function () {
		var d1 = make("<div _='on click if true put \"foo\" into me.innerHTML end'></div>");
		d1.click();
		d1.innerHTML.should.equal("foo");
	});

	it("basic true branch works with naked else", function () {
		var d1 = make("<div _='on click if true put \"foo\" into me.innerHTML else'></div>");
		d1.click();
		d1.innerHTML.should.equal("foo");
	});

	it("basic true branch works with naked else end", function () {
		var d1 = make("<div _='on click if true put \"foo\" into me.innerHTML else end'></div>");
		d1.click();
		d1.innerHTML.should.equal("foo");
	});

	it("basic else branch works", function () {
		var d1 = make("<div _='on click if false else put \"foo\" into me.innerHTML'></div>");
		d1.click();
		d1.innerHTML.should.equal("foo");
	});

	it("basic else branch works with end", function () {
		var d1 = make("<div _='on click if false else put \"foo\" into me.innerHTML end'></div>");
		d1.click();
		d1.innerHTML.should.equal("foo");
	});

	it("basic else if branch works", function () {
		var d1 = make("<div _='on click if false else if true put \"foo\" into me.innerHTML'></div>");
		d1.click();
		d1.innerHTML.should.equal("foo");
	});

	it("basic else if branch works with end", function () {
		var d1 = make(
			"<div _='on click if false " +
				'                                  else if true put "foo" into me.innerHTML end\'></div>'
		);
		d1.click();
		d1.innerHTML.should.equal("foo");
	});

	it("otherwise alias works", function () {
		var d1 = make("<div _='on click if false otherwise put \"foo\" into me.innerHTML'></div>");
		d1.click();
		d1.innerHTML.should.equal("foo");
	});
	
	it("triple else if branch works", function () {
		var d1 = make("<div _='on click if false else if false else put \"foo\" into me.innerHTML'></div>");
		d1.click();
		d1.innerHTML.should.equal("foo");
	});

	it("tripple else if branch works with end", function () {
		var d1 = make(
			"<div _='on click if false " +
				"                                  else if false" +
				'                                  else put "foo" into me.innerHTML end\'></div>'
		);
		d1.click();
		d1.innerHTML.should.equal("foo");
	});

	it("basic else branch works with multiple commands", function () {
		var d1 = make(
			'<div _=\'on click if false put "bar" into me.innerHTML' +
				"                                  else log me then" +
				'                                       put "foo" into me.innerHTML\'></div>'
		);
		d1.click();
		d1.innerHTML.should.equal("foo");
	});

	it("true branch with a wait works", function (done) {
		var d1 = make("<div _='on click if true wait 10 ms then put \"foo\" into me.innerHTML'></div>");
		d1.click();
		d1.innerHTML.should.equal("");
		setTimeout(function () {
			d1.innerHTML.should.equal("foo");
			done();
		}, 20);
	});

	it("false branch with a wait works", function (done) {
		var d1 = make("<div _='on click if false else wait 10 ms then put \"foo\" into me.innerHTML'></div>");
		d1.click();
		d1.innerHTML.should.equal("");
		setTimeout(function () {
			d1.innerHTML.should.equal("foo");
			done();
		}, 20);
	});

	it("if properly passes execution along if child is not executed", function () {
		var d1 = make("<div _='on click if false end put \"foo\" into me.innerHTML'></div>");
		d1.click();
		d1.innerHTML.should.equal("foo");
	});

	it("if properly supports nested if statements and end block", function () {
		window.tmp = false
		var d1 = make("<div _='on click \n" +
			"                      if window.tmp then\n" +
			"                        put \"foo\" into me\n" +
			"                      else if not window.tmp then\n" +
			"                        // do nothing\n" +
			"                      end\n" +
			"                  catch e\n" +
			"                      // just here for the parsing...\n'" +
			"</div>");
		d1.click();
		d1.innerHTML.should.equal("");

		window.tmp = true
		d1.click();
		d1.innerHTML.should.equal("foo");

		delete window.tmp;
	});

	it("if on new line does not join w/ else", function () {
		window.tmp = false
		var d1 = make("<div _='on click \n" +
			"                      if window.tmp then\n" +
			"                      else\n" +
			"                        if window.tmp then" +
			"                        end\n" +
			"                        put \"foo\" into me\n" +
			"                      end\n" +
			"                  '" +
			"</div>");
		d1.click();
		d1.innerHTML.should.equal("foo");

		window.tmp = true
		d1.innerHTML = "";
		d1.click();
		d1.innerHTML.should.equal("");

		delete window.tmp;
	});

});
