describe("the trigger command", function() {

    beforeEach(function () {
        clearWorkArea();
    });
    afterEach(function () {
        clearWorkArea();
    });

    it("can trigger events", function(){
        var div = make("<div _='on click trigger foo end" +
            "                          on foo add .foo-set end'></div>");
        div.classList.contains("foo-set").should.equal(false);
        div.click();
        div.classList.contains("foo-set").should.equal(true);
    })

    it("can trigger events with args", function(){
        var div = make("<div _='on click trigger foo(x:42) end" +
            "                          on foo(x) put x into my.innerHTML'></div>");
        div.classList.contains("foo-sent").should.equal(false);
        div.click();
        div.innerHTML.should.equal("42");
    })


});
