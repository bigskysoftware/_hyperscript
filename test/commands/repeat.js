describe("the repeat command", function() {

    beforeEach(function () {
        clearWorkArea();
    });
    afterEach(function () {
        clearWorkArea();
    });

    it("basic for loop works", function(){
        var d1 = make("<div _='on click repeat for x in [1, 2, 3]" +
            "                                    put x at end of me" +
            "                                  end'></div>");
        d1.click();
        d1.innerHTML.should.equal("123");
    })

    it("basic for loop with null works", function(){
        var d1 = make("<div _='on click repeat for x in null" +
            "                                    put x at end of me" +
            "                                  end'></div>");
        d1.click();
        d1.innerHTML.should.equal("");
    })

    it("waiting in for loop works", function(done){
        var d1 = make("<div _='on click repeat for x in [1, 2, 3]\n" +
            "                                    put x at end of me\n" +
            "                                    wait 1ms\n" +
            "                                  end'></div>");
        d1.click();
        d1.innerHTML.should.equal("1");
        setTimeout(function () {
            d1.innerHTML.should.equal("123");
            done();
        }, 20);
    })

    it("basic raw for loop works", function(){
        var d1 = make("<div _='on click for x in [1, 2, 3]" +
            "                                    put x at end of me" +
            "                                  end'></div>");
        d1.click();
        d1.innerHTML.should.equal("123");
    })

    it("basic raw for loop works", function(){
        var d1 = make("<div _='on click for x in null" +
            "                                    put x at end of me" +
            "                                  end'></div>");
        d1.click();
        d1.innerHTML.should.equal("");
    })

    it("waiting in raw for loop works", function(done){
        var d1 = make("<div _='on click for x in [1, 2, 3]\n" +
            "                                    put x at end of me\n" +
            "                                    wait 1ms\n" +
            "                                  end'></div>");
        d1.click();
        d1.innerHTML.should.equal("1");
        setTimeout(function () {
            d1.innerHTML.should.equal("123");
            done();
        }, 20);
    })

    it("repeat forever works", function(){
        make("" +
            "<script type='text/hyperscript'>" +
            "  def repeatForeverWithReturn()" +
            "    set retVal to 0" +
            "    repeat forever" +
            "       set retVal to retVal + 1" +
            "       if retVal == 5 then" +
            "         return retVal" +
            "       end" +
            "    end" +
            "  end" +
            "</script>" +
            "<div id='d1' _='on click put repeatForeverWithReturn() into my.innerHTML'></div>");
        var d1 = byId('d1');
        d1.click();
        d1.innerHTML.should.equal("5");
        delete window.repeatForeverWithReturn;
    })

});

