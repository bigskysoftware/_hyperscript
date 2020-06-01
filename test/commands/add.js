describe("the add command", function() {

    beforeEach(function () {
        clearWorkArea();
    });
    afterEach(function () {
        clearWorkArea();
    });

    it("can add class ref on a single div transpiled", function () {
        var div = make("<div/>");
        div.classList.contains("foo").should.equal(false);
        parseAndTranspileCommand("add", "add .foo", {me:div})
        div.classList.contains("foo").should.equal(true);
    })

    it("can target another div for class ref transpiled", function(){
        var bar = make("<div id='bar'></div>");
        var div = make("<div'></div>");
        bar.classList.contains("foo").should.equal(false);
        div.classList.contains("foo").should.equal(false);
        parseAndTranspileCommand("add", "add .foo to #bar", {me:div})
        bar.classList.contains("foo").should.equal(true);
        div.classList.contains("foo").should.equal(false);
    })

    it("can add non-class attributes transpiled", function(){
        var div = make("<div></div>");
        div.hasAttribute("foo").should.equal(false);
        parseAndTranspileCommand("add", "add [foo=\"bar\"]", {me:div})
        div.getAttribute("foo").should.equal("bar");
    })

    it("can add class ref on a single div", function () {
        var div = make("<div _='on click add .foo'></div>");
        div.classList.contains("foo").should.equal(false);
        div.click();
        div.classList.contains("foo").should.equal(true);
    })

    it("can target another div for class ref", function(){
        var bar = make("<div id='bar'></div>");
        var div = make("<div _='on click add .foo to #bar'></div>");
        bar.classList.contains("foo").should.equal(false);
        div.classList.contains("foo").should.equal(false);
        div.click();
        bar.classList.contains("foo").should.equal(true);
        div.classList.contains("foo").should.equal(false);
    })

    it("can add non-class attributes", function(){
        var div = make("<div _='on click add [foo=\"bar\"]'></div>");
        div.hasAttribute("foo").should.equal(false);
        div.click();
        div.getAttribute("foo").should.equal("bar");
    })

});

