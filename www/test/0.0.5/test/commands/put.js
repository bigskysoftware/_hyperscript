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

    it("can set javascript globals", function(){
        try {
            var d1 = make("<div _='on click put \"red\" into window.temp'>lolwat</div>");
            d1.click();
            window['temp'].should.equal("red");
        } finally {
            delete window.temp
        }
    })

    it("can set into class ref w/ flatmapped property", function(){
        var div = make("<div _='on click put \"foo\" into .divs.parentElement.innerHTML'></div>");
        make("<div id='d1'><div class='divs'></div></div><div id='d2'><div class='divs'></div></div>");
        div.click();
        var d1 = byId("d1");
        var d2 = byId("d2");
        d1.innerHTML.should.equal("foo");
        d2.innerHTML.should.equal("foo");
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
        var d1 = make("<div id='d1' _='on click put \"foo\" at start of #d1'>*</div>");
        d1.click();
        d1.innerHTML.should.equal("foo*");
    })

    it("can insert before end", function(){
        var d1 = make("<div id='d1' _='on click put \"foo\" at end of #d1'>*</div>");
        d1.click();
        d1.innerHTML.should.equal("*foo");
    })

    it("waits on promises", function(done){
        window.promiseAString = function(){
            return new Promise(function(finish){
                window.finish = finish;
            });
        }
        try {
            var d1 = make("<div id='d1' _='on click put promiseAString() into #d1.innerHTML'></div>");
            d1.click();
            d1.innerHTML.should.equal("");
            finish("foo");
            setTimeout(function () {
                d1.innerHTML.should.equal("foo");
                done();
            }, 20);
        } finally {
            delete window.promiseAString;
            delete window.finish;
        }
    })



});

