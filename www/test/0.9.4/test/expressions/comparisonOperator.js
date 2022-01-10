describe("the comparisonOperator expression", function () {
	beforeEach(function () {
		clearWorkArea();
	});
	afterEach(function () {
		clearWorkArea();
	});

	it("less than works", function () {
		var result = evalHyperScript("1 < 2");
		result.should.equal(true);

		var result = evalHyperScript("2 < 1");
		result.should.equal(false);

		var result = evalHyperScript("2 < 2");
		result.should.equal(false);
	});

	it("less than or equal works", function () {
		var result = evalHyperScript("1 <= 2");
		result.should.equal(true);

		var result = evalHyperScript("2 <= 1");
		result.should.equal(false);

		var result = evalHyperScript("2 <= 2");
		result.should.equal(true);
	});

	it("greater than works", function () {
		var result = evalHyperScript("1 > 2");
		result.should.equal(false);

		var result = evalHyperScript("2 > 1");
		result.should.equal(true);

		var result = evalHyperScript("2 > 2");
		result.should.equal(false);
	});

	it("greater than or equal works", function () {
		var result = evalHyperScript("1 >= 2");
		result.should.equal(false);

		var result = evalHyperScript("2 >= 1");
		result.should.equal(true);

		var result = evalHyperScript("2 >= 2");
		result.should.equal(true);
	});

	it("equal works", function () {
		var result = evalHyperScript("1 == 2");
		result.should.equal(false);

		var result = evalHyperScript("2 == 1");
		result.should.equal(false);

		var result = evalHyperScript("2 == 2");
		result.should.equal(true);
	});

	it("triple equal works", function () {
		var result = evalHyperScript("1 === 2");
		result.should.equal(false);

		var result = evalHyperScript("2 === 1");
		result.should.equal(false);

		var result = evalHyperScript("2 === 2");
		result.should.equal(true);
	});

	it("not equal works", function () {
		var result = evalHyperScript("1 != 2");
		result.should.equal(true);

		var result = evalHyperScript("2 != 1");
		result.should.equal(true);

		var result = evalHyperScript("2 != 2");
		result.should.equal(false);
	});

	it("triple not equal works", function () {
		var result = evalHyperScript("1 !== 2");
		result.should.equal(true);

		var result = evalHyperScript("2 !== 1");
		result.should.equal(true);

		var result = evalHyperScript("2 !== 2");
		result.should.equal(false);
	});

	it("is works", function () {
		var result = evalHyperScript("1 is 2");
		result.should.equal(false);

		var result = evalHyperScript("2 is 1");
		result.should.equal(false);

		var result = evalHyperScript("2 is 2");
		result.should.equal(true);
	});

	it("is not works", function () {
		var result = evalHyperScript("1 is not 2");
		result.should.equal(true);

		var result = evalHyperScript("2 is not 1");
		result.should.equal(true);

		var result = evalHyperScript("2 is not 2");
		result.should.equal(false);
	});

	it("is in works", function () {
		var result = evalHyperScript("1 is in [1, 2]");
		result.should.equal(true);

		var result = evalHyperScript("2 is in [1, 2]");
		result.should.equal(true);

		var result = evalHyperScript("3 is in [1, 2]");
		result.should.equal(false);

		var result = evalHyperScript("3 is in null");
		result.should.equal(false);
	});

	it("is not in works", function () {
		var result = evalHyperScript("1 is not in [1, 2]");
		result.should.equal(false);

		var result = evalHyperScript("2 is not in [1, 2]");
		result.should.equal(false);

		var result = evalHyperScript("3 is not in [1, 2]");
		result.should.equal(true);

		var result = evalHyperScript("3 is not in null");
		result.should.equal(true);
	});

	it("I am in works", function () {
		var result = evalHyperScript("I am in [1, 2]", { me: 1 });
		result.should.equal(true);

		var result = evalHyperScript("I am in [1, 2]", { me: 2 });
		result.should.equal(true);

		var result = evalHyperScript("I am in [1, 2]", { me: 3 });
		result.should.equal(false);

		var result = evalHyperScript("I am in null", { me: null });
		result.should.equal(false);
	});

	it("I am not in works", function () {
		var result = evalHyperScript("I am not in [1, 2]", { me: 1 });
		result.should.equal(false);

		var result = evalHyperScript("I am not in [1, 2]", { me: 2 });
		result.should.equal(false);

		var result = evalHyperScript("I am not in [1, 2]", { me: 3 });
		result.should.equal(true);

		var result = evalHyperScript("I am not in null", { me: null });
		result.should.equal(true);
	});

	it("match works", function () {
		var div = make("<div class='foo'></div>");
		var result = evalHyperScript("I match .foo", { me: div });
		result.should.equal(true);

		var div = make("<div class='foo'></div>");
		var result = evalHyperScript("x matches .foo", { x: div });
		result.should.equal(true);

		var div = make("<div class='foo'></div>");
		var result = evalHyperScript("I match .bar", { me: div });
		result.should.equal(false);

		var div = make("<div class='foo'></div>");
		var result = evalHyperScript("x matches .bar", { x: div });
		result.should.equal(false);
	});

	it("does not match works", function () {
		var div = make("<div class='foo'></div>");
		var result = evalHyperScript("I do not match .foo", { me: div });
		result.should.equal(false);

		var div = make("<div class='foo'></div>");
		var result = evalHyperScript("x does not match .foo", { x: div });
		result.should.equal(false);

		var div = make("<div class='foo'></div>");
		var result = evalHyperScript("I do not match .bar", { me: div });
		result.should.equal(true);

		var div = make("<div class='foo'></div>");
		var result = evalHyperScript("x does not match .bar", { x: div });
		result.should.equal(true);
	});

	it("match works w/ strings", function () {
		var result = evalHyperScript("'a' matches '.*'");
		result.should.equal(true);

		var result = evalHyperScript("'a' matches 'b'");
		result.should.equal(false);
	});

	it("does not match works w/ strings", function () {
		var result = evalHyperScript("'a' does not match '.*'");
		result.should.equal(false);

		var result = evalHyperScript("'a' does not match 'b'");
		result.should.equal(true);
	});

	it("contains works with elts", function () {
		var outer = make("<div><div id='d2'></div></div>");
		var inner = byId("d2");

		var result = evalHyperScript("I contain that", {
			me: outer,
			that: inner,
		});
		result.should.equal(true);

		var result = evalHyperScript("I contain that", {
			me: inner,
			that: outer,
		});
		result.should.equal(false);

		var result = evalHyperScript("that contains me", {
			me: outer,
			that: inner,
		});
		result.should.equal(false);

		var result = evalHyperScript("that contains me", {
			me: inner,
			that: outer,
		});
		result.should.equal(true);
	});

	it("contains works with arrays", function () {
		var outer = [1, 2, 3];
		var inner = 1;

		var result = evalHyperScript("I contain that", {
			me: outer,
			that: inner,
		});
		result.should.equal(true);

		var result = evalHyperScript("that contains me", {
			me: inner,
			that: outer,
		});
		result.should.equal(true);
	});

	it("contains works with css literals", function () {

		make("<div id='d1' class='outer'><div id='d2'></div></div>");

		var result = evalHyperScript(".outer contains #d2");
		result.should.equal(true);

		var result = evalHyperScript("#d2 contains #d1");
		result.should.equal(false);
	});

	it("include works", function () {
		var outer = make("<div><div id='d2'></div></div>");
		var inner = byId("d2");

		var result = evalHyperScript("foo includes foobar", {
			foo: "foo",
			foobar: "foobar",
		});
		result.should.equal(false);

		var result = evalHyperScript("foobar includes foo", {
			foo: "foo",
			foobar: "foobar",
		});
		result.should.equal(true);

		var result = evalHyperScript("foo does not include foobar", {
			foo: "foo",
			foobar: "foobar",
		});
		result.should.equal(true);

		var result = evalHyperScript("foobar does not include foo", {
			foo: "foo",
			foobar: "foobar",
		});
		result.should.equal(false);

	});

	it("includes works with arrays", function () {
		var outer = [1, 2, 3];
		var inner = 1;

		var result = evalHyperScript("I include that", {
			me: outer,
			that: inner,
		});
		result.should.equal(true);

		var result = evalHyperScript("that includes me", {
			me: inner,
			that: outer,
		});
		result.should.equal(true);
	});

	it("includes works with css literals", function () {

		make("<div id='d1' class='outer'><div id='d2'></div></div>");

		var result = evalHyperScript(".outer includes #d2");
		result.should.equal(true);

		var result = evalHyperScript("#d2 includes #d1");
		result.should.equal(false);
	});

	it("does not contain works", function () {
		var outer = make("<div><div id='d2'></div></div>");
		var inner = byId("d2");

		var result = evalHyperScript("I do not contain that", {
			me: outer,
			that: inner,
		});
		result.should.equal(false);

		var result = evalHyperScript("I do not contain that", {
			me: inner,
			that: outer,
		});
		result.should.equal(true);

		var result = evalHyperScript("that does not contains me", {
			me: outer,
			that: inner,
		});
		result.should.equal(true);

		var result = evalHyperScript("that does not contains me", {
			me: inner,
			that: outer,
		});
		result.should.equal(false);
	});

	it("is empty works", function () {
		var result = evalHyperScript("undefined is empty");
		result.should.equal(true);

		var result = evalHyperScript("'' is empty");
		result.should.equal(true);

		var result = evalHyperScript("[] is empty");
		result.should.equal(true);

		var result = evalHyperScript("'not empty' is empty");
		result.should.equal(false);

		var result = evalHyperScript("1000 is empty");
		result.should.equal(false);

		var result = evalHyperScript("[1,2,3] is empty");
		result.should.equal(false);

		var result = evalHyperScript(".aClassThatDoesNotExist is empty");
		result.should.equal(true);
	});

	it("is not empty works", function () {
		var result = evalHyperScript("undefined is not empty");
		result.should.equal(false);

		var result = evalHyperScript("'' is not empty");
		result.should.equal(false);

		var result = evalHyperScript("[] is not empty");
		result.should.equal(false);

		var result = evalHyperScript("'not empty' is not empty");
		result.should.equal(true);

		var result = evalHyperScript("1000 is not empty");
		result.should.equal(true);

		var result = evalHyperScript("[1,2,3] is not empty");
		result.should.equal(true);
	});

	it("is a works", function () {
		var result = evalHyperScript("null is a String");
		result.should.equal(true);

		var result = evalHyperScript("null is a String!");
		result.should.equal(false);

		var result = evalHyperScript("'' is a String!");
		result.should.equal(true);
	});

	it("is not a works", function () {
		var result = evalHyperScript("null is not a String");
		result.should.equal(false);

		var result = evalHyperScript("null is not a String!");
		result.should.equal(true);

		var result = evalHyperScript("'' is not a String!");
		result.should.equal(false);
	});

	it("english less than works", function () {
		var result = evalHyperScript("1 is less than 2");
		result.should.equal(true);

		var result = evalHyperScript("2 is less than 1");
		result.should.equal(false);

		var result = evalHyperScript("2 is less than 2");
		result.should.equal(false);
	});

	it("english less than or equal works", function () {
		var result = evalHyperScript("1 is less than or equal to 2");
		result.should.equal(true);

		var result = evalHyperScript("2 is less than or equal to 1");
		result.should.equal(false);

		var result = evalHyperScript("2 is less than or equal to 2");
		result.should.equal(true);
	});

	it("english greater than works", function () {
		var result = evalHyperScript("1 is greater than 2");
		result.should.equal(false);

		var result = evalHyperScript("2 is greater than 1");
		result.should.equal(true);

		var result = evalHyperScript("2 is greater than 2");
		result.should.equal(false);
	});

	it("english greater than or equal works", function () {
		var result = evalHyperScript("1 is greater than or equal to 2");
		result.should.equal(false);

		var result = evalHyperScript("2 is greater than or equal to 1");
		result.should.equal(true);

		var result = evalHyperScript("2 is greater than or equal to 2");
		result.should.equal(true);
	});

	it("exists works", function () {
		var result = evalHyperScript("undefined exists");
		result.should.equal(false);

		var result = evalHyperScript("null exists");
		result.should.equal(false);

		var result = evalHyperScript("#doesNotExist exists");
		result.should.equal(false);

		var result = evalHyperScript(".aClassThatDoesNotExist exists");
		result.should.equal(false);

		var result = evalHyperScript("<.aClassThatDoesNotExist/> exists");
		result.should.equal(false);

		var result = evalHyperScript("<body/> exists");
		result.should.equal(true);
	});

	it("does not exist works", function () {
		var result = evalHyperScript("undefined does not exist");
		result.should.equal(true);

		var result = evalHyperScript("null does not exist");
		result.should.equal(true);

		var result = evalHyperScript("#doesNotExist does not exist");
		result.should.equal(true);

		var result = evalHyperScript(".aClassThatDoesNotExist does not exist");
		result.should.equal(true);

		var result = evalHyperScript("<.aClassThatDoesNotExist/> does not exist");
		result.should.equal(true);

		var result = evalHyperScript("<body/> does not exist");
		result.should.equal(false);
	});



});
