describe("the set command", function() {

    beforeEach(function () {
        clearWorkArea();
    });
    afterEach(function () {
        clearWorkArea();
    });

    it("can set properties", function(){
        var d1 = make("<div id='d1' _='on click set #d1.innerHTML to \"foo\"'></div>");
        d1.click();
        d1.innerHTML.should.equal("foo");
    })

    it("can set styles", function(){
        var d1 = make("<div _='on click set my.style.color to \"red\"'>lolwat</div>");
        d1.click();
        d1.style.color.should.equal("red");
    })

    it("can set javascript globals", function(){
        try {
            var d1 = make("<div _='on click set window.temp to \"red\"'>lolwat</div>");
            d1.click();
            window['temp'].should.equal("red");
        } finally {
            delete window.temp
        }
    })

    it("can set local variables", function(){
        var d1 = make("<div id='d1' _='on click set newVar to \"foo\" then" +
            "                                    put newVar into #d1.innerHTML'></div>");
        d1.click();
        d1.innerHTML.should.equal("foo");
    })

    it("can set into id ref", function(){
        var d1 = make("<div id='d1' _='on click set #d1.innerHTML to \"foo\"'></div>");
        d1.click();
        d1.innerHTML.should.equal("foo");
    })

    it("can set into class ref", function(){
        var d1 = make("<div class='divs' _='on click set .divs.innerHTML to \"foo\"'></div>");
        var d2 = make("<div class='divs''></div>");
        d1.click();
        d1.innerHTML.should.equal("foo");
        d2.innerHTML.should.equal("foo");
    })

    it("set calls next command", function(){
        var d1 = make("<div id='d1' _='on click set #d1.innerHTML to \"foo\" then add [foo=\"bar\"]'></div>");
        d1.click();
        d1.getAttribute("foo").should.equal("bar");
    })

});

