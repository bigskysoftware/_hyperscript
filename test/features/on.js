describe("the add command", function() {

    beforeEach(function () {
        clearWorkArea();
    });
    afterEach(function () {
        // clearWorkArea();
    });

    it("can respond to events with dots in names", function(){
        var bar = make("<div _='on click send example.event to #d1'></div>");
        var div = make("<div id='d1' _='on example.event add .called'></div>");
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

});

