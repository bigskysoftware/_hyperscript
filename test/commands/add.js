describe("the add command", function() {

    beforeEach(function () {
        clearWorkArea();
    });
    afterEach(function () {
        clearWorkArea();
    });

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

    it("can add to query in me", function(){
        var div = make("<div _='on click add .foo to <p/> in me'>" +
            "<p id='p1'></p>" +
            "</div>");
        var p1 = byId("p1");
        p1.classList.contains("foo").should.equal(false);
        div.classList.contains("foo").should.equal(false);
        div.click();
        p1.classList.contains("foo").should.equal(true);
        div.classList.contains("foo").should.equal(false);
    })

    it("can add non-class attributes", function(){
        var div = make("<div _='on click add [foo=\"bar\"]'></div>");
        div.hasAttribute("foo").should.equal(false);
        div.click();
        div.getAttribute("foo").should.equal("bar");
    })

    it("can add css properties", function(){
        var div = make("<div style='color: blue' " +
                       "    _='on click add {color: \"red\", \"font-family\": \"monospace\"}'></div>");
        div.style.color.should.equal("blue");
        div.click();
        div.style.color.should.equal("red");
        div.style.fontFamily.should.equal("monospace");
    })

});

