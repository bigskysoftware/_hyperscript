describe("The (top-level) js feature", function () {
	beforeEach(function () {
		clearWorkArea();
	});
	afterEach(function () {
		clearWorkArea();
	});

	it("can run js at the top level", function () {
		window.testSuccess = false;
		var script = make("<script type=text/hyperscript>" + "  js " + "    window.testSuccess = true " + "  end ");
		assert.equal(window.testSuccess, true);
		delete window.testSuccess;
	});

	it("can expose globals", function () {
		var script = make(
			"<script type=text/hyperscript>" + "  js " + "    return { foo: 'test succeeded' }; " + "  end "
		);
		assert.equal(window.foo, "test succeeded");
		delete window.foo;
	});

	it("can expose functions", function () {
		var script = make(
			"<script type=text/hyperscript>" +
				"  js " +
				"    function foo() { " +
				"      return 'test succeeded'; " +
				"    } " +
				"    return { foo: foo }; " +
				"  end "
		);
		assert.equal(window.foo(), "test succeeded");
		delete window.foo;
	});

	it("can hide functions", function () {
		var script = make(
			"<script type=text/hyperscript>" +
				"  js " +
				"    function bar() {} " +
				"    function foo() { " +
				"      return 'test succeeded'; " +
				"    } " +
				"    return { foo: foo }; " +
				"  end "
		);
		assert.equal(window.foo(), "test succeeded");
		assert.notProperty(window, "bar");
		delete window.foo;
	});

	it("does not expose variables", function () {
		var script = make(
			"<script type=text/hyperscript>" +
				"  js " +
				"    var foo = 'foo' " +
				"    let bar = 'bar' " +
				"    const baz = 'baz' " +
				"  end "
		);
		assert.notProperty(window, "foo");
		assert.notProperty(window, "bar");
		assert.notProperty(window, "baz");
	});
});
