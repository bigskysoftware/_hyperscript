describe("the clear command", function () {
	beforeEach(function () {
		clearWorkArea();
	});
	afterEach(function () {
		clearWorkArea();
	});

	it("can clear inner text", function () {
		var div = make("<div _='on click clear me'>foo</div>");
        div.innerHTML.should.equal("foo")
		div.click();
	    div.innerHTML.should.equal("")
	});

	it("can clear other inner text", function () {
		var div = make("<div _='on click clear #that'></div>");
		var div2 = make("<div id='that'>foo</div>");
        div2.innerHTML.should.equal("foo")
		div.click();
        div2.innerHTML.should.equal("")
	});

	it("can clear elements", function () {
		var div = make("<div _='on click clear me'><p>foo</p></div>");
        div.innerHTML.should.equal("<p>foo</p>")
		div.click();
	    div.innerHTML.should.equal("")
	});

	it("can clear other elements", function () {
		var div = make("<div _='on click clear #that'></div>");
		var div2 = make("<div id='that'><p>foo</p></div>");
        div2.innerHTML.should.equal("<p>foo</p>")
		div.click();
        div2.innerHTML.should.equal("")
	});

    it("can clear elements by class name", function () {
		var div = make("<div _='on click clear .target'><p>foo</p><p class='target'>bar</p></div>");
        div.innerHTML.should.equal("<p>foo</p><p class=\"target\">bar</p>")
		div.click();
        div.innerHTML.should.equal("<p>foo</p><p class=\"target\"></p>")
    })

    it("can clear elements by class name in other elements", function () {
		var div = make("<div _='on click clear .target in #that'></div>");
		var div2 = make("<div id='that'><p>foo</p><p class='target'>bar</p></div>");
        div2.innerHTML.should.equal("<p>foo</p><p class=\"target\">bar</p>")
		div.click();
        console.log(div2.innerHTML)
        div2.innerHTML.should.equal("<p>foo</p><p class=\"target\"></p>")
    })

	it("can clear parent element", function () {
		var div = make("<div id='p1'><button  id='b1' _='on click clear my.parentElement'></button></div> ");
		var btn = byId("b1");
        div.childElementCount.should.equal(1)
		btn.click();
        div.childElementCount.should.equal(0)
	});

	it("can clear specific things by tag", function () {
		var div = make("<div><div id='d1' _='on click clear <p/>'><p>foo</p>bar</div><p>doh</p></div>");
		var d1 = byId('d1');
		div.innerHTML.includes("foo").should.equal(true);
		div.innerHTML.includes("bar").should.equal(true);
		div.innerHTML.includes("doh").should.equal(true);
		d1.click();
		div.innerHTML.includes("foo").should.equal(false);
		div.innerHTML.includes("bar").should.equal(true);
		div.innerHTML.includes("doh").should.equal(true);
	});

    it("can clear an element that has a clear() method", function () {
        var _ = make("<script>_hyperscript.config.conversions['Set'] = function (val) { return new Set(val)}</script>")
        var btn = make("<button _='on click set foo to [1, 2, 3] as Set then clear foo then put foo as Array into me'>Hello</button>")
        btn.innerText.should.equal("Hello")
        btn.click()
        btn.innerText.should.equal("")
    })

    it("can clear arrays", function() {
        var btn = make("<button _='on click set foo to [1, 2, 3] then clear foo then put foo into me'>Hello</button>")
        btn.innerText.should.equal("Hello")
        btn.click()
        btn.innerText.should.equal("")
    })

    it("can clear text inputs", function() {
        var input = make("<input id='that' value='foo' />")
        var btn = make("<button _='on click clear #that'></button>")
        input.value.should.equal("foo")
        btn.click()
        input.value.should.equal("")
    })
});

// TODO: add null safe check
