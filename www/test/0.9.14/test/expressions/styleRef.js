describe("the styleRef expression", function () {
	beforeEach(function () {
		clearWorkArea();
	});
	afterEach(function () {
		clearWorkArea();
	});

	it("basic style ref works", function () {
		var div = make("<div style='color: red; text-align: center; width: 10px'></div>");

		var value = _hyperscript("*color", { me: div });
		value.should.equal("red");

		value = _hyperscript("*text-align", { me: div });
		value.should.equal("center");

		value = _hyperscript("*width", { me: div });
		value.should.equal("10px");

		value = _hyperscript("*height", { me: div });
		value.should.equal("");

		value = _hyperscript("*bad-prop", { me: div });
		should.equal(value, undefined);
	});

	it("calculated style ref works", function () {
		var div = make("<div style='color: red; text-align: center; width: 10px'></div>");

		var value = _hyperscript("*computed-color", { me: div });
		value.should.equal("rgb(255, 0, 0)");

		value = _hyperscript("*computed-text-align", { me: div });
		value.should.equal("center");

		value = _hyperscript("*computed-width", { me: div });
		value.should.equal("10px");

		value = _hyperscript("*computed-height", { me: div });
		value.should.equal("0px");

		value = _hyperscript("*computed-bad-prop", { me: div });
		should.equal(value, "");
	});

	it("possessive style ref works", function () {
		var div = make("<div style='color: red; text-align: center; width: 10px'></div>");

		var value = _hyperscript("my *color", { me: div });
		value.should.equal("red");

		value = _hyperscript("my *text-align", { me: div });
		value.should.equal("center");

		value = _hyperscript("my *width", { me: div });
		value.should.equal("10px");

		value = _hyperscript("its *height", { result: div });
		value.should.equal("");

		value = _hyperscript("my *bad-prop", { me: div });
		should.equal(value, undefined);
	});

	it("of style ref works", function () {
		var div = make("<div style='color: red; text-align: center; width: 10px'></div>");

		var value = _hyperscript("*color of me", { me: div });
		value.should.equal("red");

		value = _hyperscript("*text-align of me", { me: div });
		value.should.equal("center");

		value = _hyperscript("*width of me", { me: div });
		value.should.equal("10px");

		value = _hyperscript("*height of it", { result: div });
		value.should.equal("");

		value = _hyperscript("*bad-prop of me", { me: div });
		should.equal(value, undefined);
	});


	it("calculated possessive style ref works", function () {
		var div = make("<div style='color: red; text-align: center; width: 10px'></div>");

		var value = _hyperscript("my *computed-color", { me: div });
		value.should.equal("rgb(255, 0, 0)");

		value = _hyperscript("my *computed-text-align", { me: div });
		value.should.equal("center");

		value = _hyperscript("my *computed-width", { me: div });
		value.should.equal("10px");

		value = _hyperscript("its *computed-height", { result: div });
		value.should.equal("0px");

		value = _hyperscript("my *computed-bad-prop", { me: div });
		should.equal(value, '');
	});

	it("calculated of style ref works", function () {
		var div = make("<div style='color: red; text-align: center; width: 10px'></div>");

		var value = _hyperscript("*computed-color of me", { me: div });
		value.should.equal("rgb(255, 0, 0)");

		value = _hyperscript("*computed-text-align of me", { me: div });
		value.should.equal("center");

		value = _hyperscript("*computed-width of me", { me: div });
		value.should.equal("10px");

		value = _hyperscript("*computed-height of it", { result: div });
		value.should.equal("0px");

		value = _hyperscript("*computed-bad-prop of me", { me: div });
		should.equal(value, '');
	});



});
