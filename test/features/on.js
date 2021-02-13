describe("the on feature", function() {

    beforeEach(function () {
        clearWorkArea();
    });
    afterEach(function () {
         clearWorkArea();
    });

    it("can respond to events with dots in names", function(){
        var bar = make("<div _='on click send example.event to #d1'></div>");
        var div = make("<div id='d1' _='on example.event add .called'></div>");
        div.classList.contains("called").should.equal(false);
        bar.click();
        div.classList.contains("called").should.equal(true);
    })

    it("can respond to events with colons in names", function(){
        var bar = make("<div _='on click send example:event to #d1'></div>");
        var div = make("<div id='d1' _='on example:event add .called'></div>");
        div.classList.contains("called").should.equal(false);
        bar.click();
        div.classList.contains("called").should.equal(true);
    })

    it("can respond to events on other elements", function(){
        var bar = make("<div id='bar'></div>");
        var div = make("<div _='on click from #bar add .clicked'></div>");
        div.classList.contains("clicked").should.equal(false);
        bar.click();
        div.classList.contains("clicked").should.equal(true);
    })

    it("can pick detail fields out by name", function(){
        var bar = make("<div id='d1' _='on click send custom(foo:\"fromBar\") to #d2'></div>");
        var div = make("<div id='d2' _='on custom(foo) call me.classList.add(foo)'></div>");
        div.classList.contains("fromBar").should.equal(false);
        bar.click();
        div.classList.contains("fromBar").should.equal(true);
    })

    it("can fire an event on load", function(){
        var div = make("<div id='d1' _='on load put \"Loaded\" into my.innerHTML'></div>");
        div.innerText.should.equal("Loaded");
    })

    it("can be in a top level script tag", function(){
        var div = make("<script type='text/hyperscript'>on load put \"Loaded\" into #d1.innerHTML</script><div id='d1'></div>");
        byId('d1').innerText.should.equal("Loaded");
    })

});

