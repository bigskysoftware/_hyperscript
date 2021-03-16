describe("pseudoCommands", function() {

    beforeEach(function () {
        clearWorkArea();
    });
    afterEach(function () {
        clearWorkArea();
    });

    it("Basic instance function with expression", function(){
        var d1 = make("<div id='d1' _='on click getElementById(\"d1\") the document " +
            "                                          put result into window.results'></div>");
        d1.click();
        var value = window.results;
        delete window.results;
        value.should.equal(d1);
    })

    it("Basic instance function with expression and with", function(){
        var d1 = make("<div id='d1' _='on click getElementById(\"d1\") with the document " +
            "                                          put result into window.results'></div>");
        d1.click();
        var value = window.results;
        delete window.results;
        value.should.equal(d1);
    })

    it("Basic instance function with expression and on", function(){
        var d1 = make("<div id='d1' _='on click getElementById(\"d1\") on the document " +
            "                                          put result into window.results'></div>");
        d1.click();
        var value = window.results;
        delete window.results;
        value.should.equal(d1);
    })

    it("Basic instance function with implicit target", function(){
        var d1 = make("<div id='d1' _='on click foo() " +
            "                                          put result into my.bar'></div>");
        d1.foo = function(){
            return "foo";
        };
        d1.click();
        d1.bar.should.equal("foo");
    })

    it("Basic instance function with implicit target followed by then", function(){
        var d1 = make("<div id='d1' _='on click foo() then" +
            "                                          put result into my.bar'></div>");
        d1.foo = function(){
            return "foo";
        };
        d1.click();
        d1.bar.should.equal("foo");
    })


});

