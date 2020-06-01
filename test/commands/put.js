describe("the put command", function() {

    beforeEach(function () {
        clearWorkArea();
    });
    afterEach(function () {
        clearWorkArea();
    });

    it("can set properties", function(){
        var d1 = make("<div id='d1' _='on click put \"foo\" into #d1.innerHTML'></div>");
        d1.click();
        d1.innerHTML.should.equal("foo");
    })

    it("can set styles", function(){
        var d1 = make("<div _='on click put \"red\" into my.style.color'>lolwat</div>");
        d1.click();
        d1.style.color.should.equal("red");
    })

    it("can set globals", function(){
        var d1 = make("<div _='on click put \"red\" into globals.temp'>lolwat</div>");
        d1.click();
        _hyperscript.runtime.getGlobal("temp").should.equal("red");
    })

    it("can set javascript globals", function(){
        try {
            var d1 = make("<div _='on click put \"red\" into window.temp'>lolwat</div>");
            d1.click();
            window['temp'].should.equal("red");
        } finally {
            delete window.temp
        }
    })

    it("can set local variables", function(){
        var d1 = make("<div id='d1' _='on click put \"foo\" into newVar then" +
            "                                    put newVar into #d1.innerHTML'></div>");
        d1.click();
        d1.innerHTML.should.equal("foo");
    })

    it("can set into id ref", function(){
        var d1 = make("<div id='d1' _='on click put \"foo\" into #d1.innerHTML'></div>");
        d1.click();
        d1.innerHTML.should.equal("foo");
    })

    it("can set into class ref", function(){
        var d1 = make("<div class='divs' _='on click put \"foo\" into .divs.innerHTML'></div>");
        var d2 = make("<div class='divs''></div>");
        d1.click();
        d1.innerHTML.should.equal("foo");
        d2.innerHTML.should.equal("foo");
    })

    it("can insert before", function(){
        var d1 = make("<div id='d1' _='on click put \"<div>foo</div>\" before #d1'></div>");
        d1.click();
        d1.previousSibling.innerHTML.should.equal("foo");
    })

    it("can insert after", function(){
        var d1 = make("<div id='d1' _='on click put \"<div>foo</div>\" after #d1'></div>");
        d1.click();
        d1.nextSibling.innerHTML.should.equal("foo");
    })

    it("can insert after beginning", function(){
        var d1 = make("<div id='d1' _='on click put \"foo\" afterbegin #d1'>*</div>");
        d1.click();
        d1.innerHTML.should.equal("foo*");
    })

    it("can insert before end", function(){
        var d1 = make("<div id='d1' _='on click put \"foo\" beforeend #d1'>*</div>");
        d1.click();
        d1.innerHTML.should.equal("*foo");
    })

});

