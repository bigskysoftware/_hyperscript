describe("the hide command", function () {
	beforeEach(function () {
		clearWorkArea();
	});
	afterEach(function () {
		clearWorkArea();
	});

	it("can hide element with no target", function () {
		var div = make("<div _='on click hide'></div>");
		div.click();
		getComputedStyle(div).display.should.equal("none");
	});

	it("can hide form with no target", function () {
		var form = make("<form _='on click hide'></form>");
		form.click();
		getComputedStyle(form).display.should.equal("none");
	});

	it("can hide element with no target followed by command", function () {
		var div = make("<div _='on click hide add .foo'></div>");
		getComputedStyle(div).display.should.equal("block");
		div.classList.contains("foo").should.equal(false);
		div.click();
		getComputedStyle(div).display.should.equal("none");
		div.classList.contains("foo").should.equal(true);
	});

	it("can hide element with no target followed by then", function () {
		var div = make("<div _='on click hide then add .foo'></div>");
		getComputedStyle(div).display.should.equal("block");
		div.classList.contains("foo").should.equal(false);
		div.click();
		getComputedStyle(div).display.should.equal("none");
		div.classList.contains("foo").should.equal(true);
	});

	it("can hide element with no target with a with", function () {
		var div = make("<div _='on click hide with display then add .foo'></div>");
		getComputedStyle(div).display.should.equal("block");
		div.classList.contains("foo").should.equal(false);
		div.click();
		getComputedStyle(div).display.should.equal("none");
		div.classList.contains("foo").should.equal(true);
	});

	it("can hide element, with display:none by default", function () {
		var div = make("<div _='on click hide me'></div>");
		getComputedStyle(div).display.should.equal("block");
		div.click();
		getComputedStyle(div).display.should.equal("none");
	});

	it("can hide element with display:none explicitly", function () {
		var div = make("<div _='on click hide me with display'></div>");
		getComputedStyle(div).display.should.equal("block");
		div.click();
		getComputedStyle(div).display.should.equal("none");
	});

	it("can hide element with opacity:0", function () {
		var div = make("<div _='on click hide me with opacity'></div>");
		getComputedStyle(div).opacity.should.equal("1");
		div.click();
		getComputedStyle(div).opacity.should.equal("0");
	});

	it("can hide element, with visibility:hidden", function () {
		var div = make("<div _='on click hide me with visibility'></div>");
		getComputedStyle(div).visibility.should.equal("visible");
		div.click();
		getComputedStyle(div).visibility.should.equal("hidden");
	});

	it("can hide other elements", function () {
		var hideme = make("<div class=hideme></div>");
		var div = make("<div _='on click hide .hideme'></div>");
		getComputedStyle(hideme).display.should.equal("block");
		div.click();
		getComputedStyle(hideme).display.should.equal("none");
	});

	it("can hide with custom strategy", function () {
		_hyperscript.config.hideShowStrategies = {
			myHide: function (op, element, arg) {
				if (op == "hide") {
					element.classList.add("foo");
				} else {
					element.classList.remove("foo");
				}
			},
		};
		var div = make("<div _='on click hide with myHide'></div>");
		div.classList.contains("foo").should.equal(false);
		div.click();
		div.classList.contains("foo").should.equal(true);
		_hyperscript.config.hideShowStrategies = null;
	});

	it("can set default to custom strategy", function () {
		_hyperscript.config.hideShowStrategies = {
			myHide: function (op, element, arg) {
				if (op == "hide") {
					element.classList.add("foo");
				} else {
					element.classList.remove("foo");
				}
			},
		};
		_hyperscript.config.defaultHideShowStrategy = "myHide";
		var div = make("<div _='on click hide'></div>");
		div.classList.contains("foo").should.equal(false);
		div.click();
		div.classList.contains("foo").should.equal(true);
		_hyperscript.config.hideShowStrategies = null;
		_hyperscript.config.defaultHideShowStrategy = null;
	});
});
