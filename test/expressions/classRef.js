describe("the classRef expression", function () {
	beforeEach(function () {
		clearWorkArea();
	});
	afterEach(function () {
		clearWorkArea();
	});

	it("basic classRef works", function () {
		var div = make("<div class='c1'></div>");
		var value = evalHyperScript(".c1");
		Array.from(value)[0].should.equal(div);
	});

	it("basic classRef works w no match", function () {
		var value = evalHyperScript(".badClassThatDoesNotHaveAnyElements");
		Array.from(value).length.should.equal(0);
	});

	it("dashed class ref works", function () {
		var div = make("<div class='c1-foo'></div>");
		var value = evalHyperScript(".c1-foo");
		Array.from(value)[0].should.equal(div);
	});

	it("colon class ref works", function () {
		var div = make("<div class='c1:foo'></div>");
		var value = evalHyperScript(".c1:foo");
		Array.from(value)[0].should.equal(div);
	});

	it("multiple colon class ref works", function () {
		var div = make("<div class='c1:foo:bar'></div>");
		var value = evalHyperScript(".c1:foo:bar");
		Array.from(value)[0].should.equal(div);
	});

	it("template classRef works", function () {
		var div = make("<div class='c1'></div>");
		var value = evalHyperScript(".{'c1'}");
		Array.from(value)[0].should.equal(div);
	});

	it("leading minus class ref works", function () {
        var div = make("<div class='-c1'></div>");
        var value = evalHyperScript(".-c1");
        Array.from(value)[0].should.equal(div);
    });

	it("slashes in class references work", function () {
        var div = make("<div class='-c1/22'></div>");
        var value = evalHyperScript(".-c1\\/22");
        Array.from(value)[0].should.equal(div);
    });

	it("tailwind insanity in class references work", function () {
        var div = make("<div class='group-[:nth-of-type(3)_&]:block'></div>");
        var value = evalHyperScript(".group-\\[:nth-of-type\\(3\\)_\\&\\]:block");
        Array.from(value)[0].should.equal(div);
    });

});
