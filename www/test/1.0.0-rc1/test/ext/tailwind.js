describe("tailwindcss extensions", function () {
	beforeEach(function () {
		clearWorkArea();
	});
	afterEach(function () {
		clearWorkArea();
		_hyperscript.config.defaultHideShowStrategy = null;
	});

	it("can hide element, with tailwindcss hidden class default strategy", function () {
		_hyperscript.config.defaultHideShowStrategy = "twDisplay";
		var div = make("<div _='on click hide'></div>");
		div.classList.contains("hidden").should.equal(false);
		div.click();
		div.classList.contains("hidden").should.equal(true);
	});

	it("can hide element, with tailwindcss invisible class default strategy", function () {
		_hyperscript.config.defaultHideShowStrategy = "twVisibility";
		var div = make("<div _='on click hide'></div>");
		div.classList.contains("invisible").should.equal(false);
		div.click();
		div.classList.contains("invisible").should.equal(true);
	});

	it("can hide element, with tailwindcss opacity-0 class default strategy", function () {
		_hyperscript.config.defaultHideShowStrategy = "twOpacity";
		var div = make("<div _='on click hide'></div>");
		div.classList.contains("opacity-0").should.equal(false);
		div.click();
		div.classList.contains("opacity-0").should.equal(true);
	});

	it("can hide element, with tailwindcss hidden class", function () {
		var div = make("<div _='on click hide with twDisplay'></div>");
		div.classList.contains("hidden").should.equal(false);
		div.click();
		div.classList.contains("hidden").should.equal(true);
	});

	it("can hide element, with tailwindcss invisible class", function () {
		var div = make("<div _='on click hide with twVisibility'></div>");
		div.classList.contains("invisible").should.equal(false);
		div.click();
		div.classList.contains("invisible").should.equal(true);
	});

	it("can hide element, with tailwindcss opacity-0 class", function () {
		var div = make("<div _='on click hide with twOpacity'></div>");
		div.classList.contains("opacity-0").should.equal(false);
		div.click();
		div.classList.contains("opacity-0").should.equal(true);
	});


	it("can show element, with tailwindcss removing hidden class default strategy", function () {
		_hyperscript.config.defaultHideShowStrategy = "twDisplay";
		var div = make("<div class='hidden' _='on click show'></div>");
		div.classList.contains("hidden").should.equal(true);
		div.click();
		div.classList.contains("hidden").should.equal(false);
	});

	it("can show element, with tailwindcss removing invisible class default strategy", function () {
		_hyperscript.config.defaultHideShowStrategy = "twVisibility";
		var div = make("<div class='invisible' _='on click show'></div>");
		div.classList.contains("invisible").should.equal(true);
		div.click();
		div.classList.contains("invisible").should.equal(false);
	});

	it("can show element, with tailwindcss removing opacity-0 class default strategy", function () {
		_hyperscript.config.defaultHideShowStrategy = "twOpacity";
		var div = make("<div class='opacity-0' _='on click show'></div>");
		div.classList.contains("opacity-0").should.equal(true);
		div.click();
		div.classList.contains("opacity-0").should.equal(false);
	});

	it("can show element, with tailwindcss removing hidden class", function () {
		var div = make("<div class='hidden' _='on click show with twDisplay'></div>");
		div.classList.contains("hidden").should.equal(true);
		div.click();
		div.classList.contains("hidden").should.equal(false);
	});

	it("can show element, with tailwindcss removing invisible class", function () {
		var div = make("<div class='invisible' _='on click show with twVisibility'></div>");
		div.classList.contains("invisible").should.equal(true);
		div.click();
		div.classList.contains("invisible").should.equal(false);
	});

	it("can show element, with tailwindcss removing opacity-0 class", function () {
		var div = make("<div class='opacity-0' _='on click show with twOpacity'></div>");
		div.classList.contains("opacity-0").should.equal(true);
		div.click();
		div.classList.contains("opacity-0").should.equal(false);
	});
});