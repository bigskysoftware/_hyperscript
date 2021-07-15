describe("the append command", function () {
	beforeEach(function () {
		clearWorkArea();
	});
	afterEach(function () {
		clearWorkArea();
	});

	it("can append a string to another string", function () {
		var div = make(`<div _="on click 
                            set value to 'Hello there.' then 
                            append ' General Kenobi.' to value then
                            set my.innerHTML to value"></div>`);
		div.click();
		div.innerHTML.should.equal("Hello there. General Kenobi.");
	});

	it("can append a value into an array", function () {
		var div = make(`<div _="on click 
                            set value to [1,2,3]
                            append 4 to value
                            set my.innerHTML to value as String"></div>`);
		div.click();
		div.innerHTML.should.equal("1,2,3,4");
	});

	it("can append a value to 'it'", function () {
		var div = make(`<div _="on click 
                            set result to [1,2,3]
                            append 4
                            put it as String into me"></div>`);
		div.click();
		div.innerHTML.should.equal("1,2,3,4");
	});

	it("can append a value to 'me'", function () {
		var div = make(`<div _="on click 
                            append '<span>This is my inner HTML</span>' to me
                            append '<b>With Tags</b>' to me"></div>`);
		div.click();
		div.innerHTML.should.equal("<span>This is my inner HTML</span><b>With Tags</b>");
	});

	it("can append a value to any other named DOM node", function () {
		var div = make(`<div _="on click append ' World' to #target"><span id="target">Hello</div></div>`);
		div.click();
		div.innerHTML.should.equal(`<span id="target">Hello World</span>`);
	});

	/*
    it("can append a value to an object property", function () {
        var div = make(`<div id="id" _="on click append '_new' to my.id"></div>`);
        div.click();
        div.id.should.equal("id2");
    })
    */
});
