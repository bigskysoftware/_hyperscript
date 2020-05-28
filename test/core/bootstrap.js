describe("Bootstrap hypescript test", function() {

    beforeEach(function() {
        this.server = makeServer();
        clearWorkArea();
    });
    afterEach(function()  {
        this.server.restore();
        clearWorkArea();
    });

    it("hypes a single div", function(){
        var div = make("<div _='add .foo'></div>");
        div.classList.contains("foo").should.equal(false);
        div.click();
        div.classList.contains("foo").should.equal(true);
    })

    it("toggle works", function(){
        var div = make("<div _='toggle .foo'></div>");
        div.classList.contains("foo").should.equal(false);
        div.click();
        div.classList.contains("foo").should.equal(true);
        div.click();
        div.classList.contains("foo").should.equal(false);
    })

    it("hypes can target another div", function(){
        var bar = make("<div id='bar'></div>");
        var div = make("<div _='add .foo to #bar'></div>");
        bar.classList.contains("foo").should.equal(false);
        div.classList.contains("foo").should.equal(false);
        div.click();
        bar.classList.contains("foo").should.equal(true);
        div.classList.contains("foo").should.equal(false);
    })

    it("hypes can have more than one action ", function(){
        var bar = make("<div id='bar'></div>");
        var div = make("<div _='add .foo to #bar then add .blah'></div>");
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

    var calledWith = null;
    window.globalFunction = function(val){
        calledWith = val;
    }
    it("hypes can eval javascript ", function(){
        try {
            var div = make("<div _='eval globalFunction(\"foo\")'></div>");
            div.click();
            "foo".should.equal(calledWith);
        } finally {
            delete window.globalFunction;
        }
    })

    it("hypes can wait", function(finished){
        var div = make("<div _='add .foo then wait 20ms then add .bar'></div>");
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

    it("hypes can change non-class properties", function(){
        var div = make("<div _='add foo=bar'></div>");
        div.hasAttribute("foo").should.equal(false);
        div.click();
        div.getAttribute("foo").should.equal("bar");
    })

    it("hypes can send events", function(){
        var div = make("<div _='send foo to #bar'></div>");
        var bar = make("<div id='bar' _='on foo add .foo-sent'></div>");
        bar.classList.contains("foo-sent").should.equal(false);
        div.click();
        bar.classList.contains("foo-sent").should.equal(true);
    })

});