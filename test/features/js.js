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

    it('can declare functions, which are then accessible from hyperscript', function() {
    	window.testSuccess = false
    	var script = make("<script type=text/hyperscript>" +
    					  "  js " +
    					  "    function foo() { " +
    					  "      return 'test succeeded'; " +
    					  "    } " +
    					  "  end ");
    	var div = make("<div _='on click put foo() into my.innerHTML'>test failed</div>")
    	div.click()
    	div.innerHTML.should.equal('test succeeded');
    })
})