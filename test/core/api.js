describe("_hyperscript API", function () {
	beforeEach(function () {
		clearWorkArea();
	});
	afterEach(function () {
		clearWorkArea();
	});

	it("processNodes does not reinitialize a node already processed", function () {
		window.global_int = 0;
		var div = make(
			"<div _='on click set window.global_int to window.global_int + 1'></div>"
		);
		window.global_int.should.equal(0);
		div.click();
		window.global_int.should.equal(1);
		_hyperscript.processNode(div);
		div.click();
		window.global_int.should.equal(2);
		delete window.global_int;
	});
});
