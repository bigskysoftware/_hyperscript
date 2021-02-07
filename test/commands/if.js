describe("the if command", function() {

    beforeEach(function () {
        clearWorkArea();
    });
    afterEach(function () {
        clearWorkArea();
    });

    it("basic true branch works", function(){
        var d1 = make("<div _='on click if true put \"foo\" into me.innerHTML'></div>");
        d1.click();
        d1.innerHTML.should.equal("foo");
    })

    it("basic true branch works with multiple commands", function(){
        var d1 = make("<div _='on click if true log me then " +
            "                                  put \"foo\" into me.innerHTML'></div>");
        d1.click();
        d1.innerHTML.should.equal("foo");
    })

    it("basic true branch works with end", function(){
        var d1 = make("<div _='on click if true put \"foo\" into me.innerHTML end'></div>");
        d1.click();
        d1.innerHTML.should.equal("foo");
    })

    it("basic true branch works with naked else", function(){
        var d1 = make("<div _='on click if true put \"foo\" into me.innerHTML else'></div>");
        d1.click();
        d1.innerHTML.should.equal("foo");
    })

    it("basic true branch works with naked else end", function(){
        var d1 = make("<div _='on click if true put \"foo\" into me.innerHTML else end'></div>");
        d1.click();
        d1.innerHTML.should.equal("foo");
    })

    it("basic else branch works", function(){
        var d1 = make("<div _='on click if false else put \"foo\" into me.innerHTML'></div>");
        d1.click();
        d1.innerHTML.should.equal("foo");
    })

    it("basic else branch works with end", function(){
        var d1 = make("<div _='on click if false else put \"foo\" into me.innerHTML end'></div>");
        d1.click();
        d1.innerHTML.should.equal("foo");
    })

    it("basic else if branch works", function(){
        var d1 = make("<div _='on click if false else if true put \"foo\" into me.innerHTML'></div>");
        d1.click();
        d1.innerHTML.should.equal("foo");
    })

    it("basic else if branch works with end", function(){
        var d1 = make("<div _='on click if false " +
            "                                  else if true put \"foo\" into me.innerHTML end'></div>");
        d1.click();
        d1.innerHTML.should.equal("foo");
    })

    it("triple else if branch works", function(){
        var d1 = make("<div _='on click if false else if false else put \"foo\" into me.innerHTML'></div>");
        d1.click();
        d1.innerHTML.should.equal("foo");
    })

    it("tripple else if branch works with end", function(){
        var d1 = make("<div _='on click if false " +
            "                                  else if false" +
            "                                  else put \"foo\" into me.innerHTML end'></div>");
        d1.click();
        d1.innerHTML.should.equal("foo");
    })

    it("basic else branch works with multiple commands", function(){
        var d1 = make("<div _='on click if false put \"bar\" into me.innerHTML" +
            "                                  else log me then" +
            "                                       put \"foo\" into me.innerHTML'></div>");
        d1.click();
        d1.innerHTML.should.equal("foo");
    })

    it("if calls next command", function(){
        var d1 = make("<div _='on click if false then log me end then add [foo=\"bar\"]'></div>");
        d1.click();
        d1.getAttribute("foo").should.equal("bar");
        var d1 = make("<div _='on click if false then log me else log me end then add [foo=\"bar\"]'></div>");
        d1.click();
        d1.getAttribute("foo").should.equal("bar");
    })


});

