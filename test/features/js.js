describe('The (top-level) js feature', function () {
	beforeEach(function () {
        clearWorkArea();
    });
    afterEach(function () {
        clearWorkArea();
    });

    it('can run js at the top level', function() {
    	window.testSuccess = false
    	var script = make("<script type=text/hyperscript>" +
    					  "  js " +
    					  "    window.testSuccess = true " +
    					  "  end ");
    	assert.equals(window.testSuccess, true);
    	delete window.testSuccess;
    })

    it('can expose globals', function() {
    	window.testSuccess = false
    	var script = make("<script type=text/hyperscript>" +
    					  "  js " +
    					  "    return { foo: 'test succeeded' }; "
    					  "  end ");
    	assertEquals(window.foo, 'test succeeded')
    	delete window.foo
    })

    it('can expose functions', function() {
    	window.testSuccess = false
    	var script = make("<script type=text/hyperscript>" +
    					  "  js " +
    					  "    function foo() { " +
    					  "      return 'test succeeded'; " +
    					  "    } " +
    					  "    return { foo: foo }; "
    					  "  end ");
    	assertEquals(window.foo(), 'test succeeded')
    	delete window.foo
    })
})