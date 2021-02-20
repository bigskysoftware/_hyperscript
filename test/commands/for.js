describe("the for command", function() {

    beforeEach(function () {
        clearWorkArea();
    });
    afterEach(function () {
        clearWorkArea();
    });

    it("basic for loop works", function(){
        var d1 = make("<div _='on click for x in [1, 2, 3]" +
            "                                    put x at end of me" +
            "                                  end'></div>");
        d1.click();
        d1.innerHTML.should.equal("123");
    })

    it("basic for loop works", function(){
        var d1 = make("<div _='on click for x in null" +
            "                                    put x at end of me" +
            "                                  end'></div>");
        d1.click();
        d1.innerHTML.should.equal("");
    })

    it("waiting in for loop works", function(done){
        var d1 = make("<div _='on click for x in [1, 2, 3]\n" +
            "                                    put x at end of me\n" +
            "                                    wait 10ms\n" +
            "                                  end'></div>");
        d1.click();
        d1.innerHTML.should.equal("1");
        setTimeout(function () {
            d1.innerHTML.should.equal("12");
            done();
        }, 20);
    })

});

