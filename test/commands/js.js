describe('The (inline) js command', function () {
	beforeEach(function () {
        clearWorkArea();
    });
    afterEach(function () {
        clearWorkArea();
    });

    it('can run js', function () {
    	window.testSuccess = false
    	var div = make('<div _="on click js window.testSuccess = true end"></div>');
    	div.click();
    	assert.equal(window.testSuccess, true);
    	delete window.testSuccess;
    })

    it('can deal with empty input list', function () {
    	window.testSuccess = false
    	var div = make('<div _="on click js() window.testSuccess = true end"></div>');
    	div.click();
    	assert.equal(window.testSuccess, true);
    	delete window.testSuccess;
    })

    it('can access values from _hyperscript', function () {
    	window.testSuccess = false
    	var div = make("<div _='on click set t to true " + 
    					"       then js(t) window.testSuccess = t end'></div>");
    	div.click();
    	assert.equal(window.testSuccess, true);
    	delete window.testSuccess;
    })

    it('can return values to _hyperscript', function () {
    	var div = make("<div _=\"on click js return 'test success' end " +
    				   "        then put it in my.innerHTML\"></div>");
    	div.click();
    	div.innerHTML.should.equal('test success');
    })
})