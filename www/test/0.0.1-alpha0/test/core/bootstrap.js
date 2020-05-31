describe("_hyperscript boostrapping", function() {

    beforeEach(function() {
        this.server = makeServer();
        clearWorkArea();
    });
    afterEach(function()  {
        this.server.restore();
        clearWorkArea();
    });

    it("on a single div", function(){
        var div = make("<div _='on click add .foo'></div>");
        div.classList.contains("foo").should.equal(false);
        div.click();
        div.classList.contains("foo").should.equal(true);
    })

    it("toggles", function(){
        var div = make("<div _='on click toggle .foo'></div>");
        div.classList.contains("foo").should.equal(false);
        div.click();
        div.classList.contains("foo").should.equal(true);
        div.click();
        div.classList.contains("foo").should.equal(false);
    })

    it("can target another div", function(){
        var bar = make("<div id='bar'></div>");
        var div = make("<div _='on click add .foo to #bar'></div>");
        bar.classList.contains("foo").should.equal(false);
        div.classList.contains("foo").should.equal(false);
        div.click();
        bar.classList.contains("foo").should.equal(true);
        div.classList.contains("foo").should.equal(false);
    })

    it("hyperscript can have more than one action ", function(){
        var bar = make("<div id='bar'></div>");
        var div = make("<div _='on click " +
            "                             add .foo to #bar then " +
            "                             add .blah'></div>");
        bar.classList.contains("foo").should.equal(false);
        div.classList.contains("foo").should.equal(false);
        bar.classList.contains("blah").should.equal(false);
        div.classList.contains("blah").should.equal(false);
        div.click();
        bar.classList.contains("foo").should.equal(true);
        div.classList.contains("foo").should.equal(false);
        bar.classList.contains("blah").should.equal(false);
        div.classList.contains("blah").should.equal(true);
    })

    it("can wait", function(finished){
        var div = make("<div _='on click " +
            "                             add .foo then " +
            "                             wait 20ms then " +
            "                             add .bar'></div>");
        div.classList.contains("foo").should.equal(false);
        div.classList.contains("bar").should.equal(false);
        div.click();
        div.classList.contains("foo").should.equal(true);
        div.classList.contains("bar").should.equal(false);
        setTimeout(function(){
            div.classList.contains("foo").should.equal(true);
            div.classList.contains("bar").should.equal(true);
            finished();
        }, 30)
    })

    it("can change non-class properties", function(){
        var div = make("<div _='on click add [foo=\"bar\"]'></div>");
        div.hasAttribute("foo").should.equal(false);
        div.click();
        div.getAttribute("foo").should.equal("bar");
    })

    it("can send events", function(){
        var div = make("<div _='on click send foo to #bar'></div>");
        var bar = make("<div id='bar' _='on foo add .foo-sent'></div>");
        bar.classList.contains("foo-sent").should.equal(false);
        div.click();
        bar.classList.contains("foo-sent").should.equal(true);
    })

    it("can respond to events on other elements", function(){
        var bar = make("<div id='bar'></div>");
        var div = make("<div _='on click from #bar " +
            "                             add .clicked'></div>");
        div.classList.contains("clicked").should.equal(false);
        bar.click();
        div.classList.contains("clicked").should.equal(true);
    })

    it("can take a class from other elements", function(){
        var d1 = make("<div class='foo'></div>");
        var d2 = make("<div _='on click take .foo from div'></div>");
        var d3 = make("<div></div>");
        d1.classList.contains("foo").should.equal(true);
        d2.classList.contains("foo").should.equal(false);
        d3.classList.contains("foo").should.equal(false);
        d2.click();
        d1.classList.contains("foo").should.equal(false);
        d2.classList.contains("foo").should.equal(true);
        d3.classList.contains("foo").should.equal(false);
    })

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

    it("can send events with args", function(){
        var div = make("<div _='on click send foo {x:42} to #bar'></div>");
        var bar = make("<div id='bar' _='on foo put event.detail.x into my.innerHTML'></div>");
        bar.classList.contains("foo-sent").should.equal(false);
        div.click();
        bar.innerHTML.should.equal("42");
    })

    it("can call functions", function(){
        var calledWith = null;
        window.globalFunction = function(val){
            calledWith = val;
        }
        try {
            var div = make("<div _='on click call globalFunction(\"foo\")'></div>");
            div.click();
            "foo".should.equal(calledWith);
        } finally {
            delete window.globalFunction;
        }
    })


});