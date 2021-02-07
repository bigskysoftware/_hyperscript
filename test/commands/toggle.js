describe("the toggle command", function() {

    beforeEach(function () {
        clearWorkArea();
    });
    afterEach(function () {
        clearWorkArea();
    });

    it("can toggle class ref on a single div", function () {
        var div = make("<div _='on click toggle .foo'></div>");
        div.classList.contains("foo").should.equal(false);
        div.click();
        div.classList.contains("foo").should.equal(true);
        div.click();
        div.classList.contains("foo").should.equal(false);
    })

    it("can target another div for class ref toggle", function(){
        var bar = make("<div id='bar'></div>");
        var div = make("<div _='on click toggle .foo on #bar'></div>");
        bar.classList.contains("foo").should.equal(false);
        div.classList.contains("foo").should.equal(false);
        div.click();
        bar.classList.contains("foo").should.equal(true);
        div.classList.contains("foo").should.equal(false);
        div.click();
        bar.classList.contains("foo").should.equal(false);
        div.classList.contains("foo").should.equal(false);
    })

    it("can toggle non-class attributes", function(){
        var div = make("<div _='on click toggle [foo=\"bar\"]'></div>");
        div.hasAttribute("foo").should.equal(false);
        div.click();
        div.getAttribute("foo").should.equal("bar");
        div.click();
        div.hasAttribute("foo").should.equal(false);
    })

    it("toggle calls next command", function () {
        var div = make("<div _='on click toggle .foo then add [foo=\"bar\"]'></div>");
        div.click();
        div.getAttribute("foo").should.equal("bar");
    })


});

