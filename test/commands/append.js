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

	it("can append a value to a DOM node", function () {
		var div = make(`<div _="on click
                            append '<span>This is my inner HTML</span>' to me
                            append '<b>With Tags</b>' to me"></div>`);
		div.click();
		div.innerHTML.should.equal("<span>This is my inner HTML</span><b>With Tags</b>");
	});

	it("can append a value to a DOM element", function () {
		var div = make(`<div id="content" _="on click
                            append 'Content' to #content"></div>`);
		div.click();
		div.innerHTML.should.equal("Content");
	});

	it("can append a value to I", function () {
		var div = make(`<div _="on click 
                            append 'Content' to I"></div>`);
		div.click();
		div.innerHTML.should.equal("Content");
	});

    it("can append a value to an object property", function () {
        var div = make(`<div id="id" _="on click append '_new' to my id"></div>`);
        div.click();
        div.id.should.equal("id_new");
    })

    it("multiple appends work", function () {
        var div = make(`<div id="id" _="on click get 'foo' then append 'bar' then append 'doh' then append it to me"></div>`);
        div.click();
		div.innerHTML.should.equal("foobardoh");
    })

    it("append to undefined ignores the undefined", function () {
        var div = make(`<div id="id" _="on click append 'bar' then append it to me"></div>`);
        div.click();
		div.innerHTML.should.equal("bar");
    })

    it("append preserves existing content rather than overwriting it", function () {
		var div = make(`<div _="on click append '<a>New Content</a>' to me"><button id="btn1">Click Me</button></div>`);
		let btn = byId('btn1');
		var clicks = 0;
		btn.addEventListener('click', function() {
			clicks++;
		})
        btn.click();
		clicks.should.equal(1);
		div.click();
		div.innerHTML.should.contain("New Content");
		btn.click();
		btn.parentNode.should.equal(div);
    })

    it("new content added by append will be live", function () {
		var div = make(`<div _="on click append \`<button id='b1' _='on click increment window.temp'>Test</button>\` to me"></div>`);
		div.click();
		let btn = byId('b1');
		btn.click();
		window.temp.should.equal(1);
		delete window.temp;
    })

});
