
describe("the behavior feature", function () {

	it("can define behaviors", function () {
		var behavior = make("<script type=text/hyperscript>" +
			"behavior TheBehaviorWeAreDefiningForHyperscriptTestingPurposes init end end" +
			"</script>");
		assert.property(window, "TheBehaviorWeAreDefiningForHyperscriptTestingPurposes");
		delete window.TheBehaviorWeAreDefiningForHyperscriptTestingPurposes;
	});

	it("can install behaviors", function () {
		var behavior = make("<script type=text/hyperscript>" +
			"behavior Behave on click add .foo end end" +
			"</script>");
		var div = make("<div _='install Behave'></div>");
		div.classList.contains("foo").should.equal(false);
		div.click();
		div.classList.contains("foo").should.equal(true);
		delete window.Behave;
	});

	it("supports init blocks in behaviors", function (done) {
		var behavior = make("<script type=text/hyperscript>" +
			"behavior Behave init add .foo to me end" +
			"</script>");
		var div = make("<div _='install Behave'></div>");
		setTimeout(() => {
			div.classList.contains("foo").should.equal(true);
			delete window.Behave;
			done();
		});
	});
})
