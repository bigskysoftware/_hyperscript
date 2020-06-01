describe("the call command", function() {

    beforeEach(function () {
        clearWorkArea();
    });
    afterEach(function () {
        clearWorkArea();
    });

    it("can call javascript instance functions", function(){
        var d1 = make("<div id='d1' _='on click call document.getElementById(\"d1\") then" +
            "                                          put it into window.results'></div>");
        d1.click();
        var value = window.results;
        delete window.results;
        value.should.equal(d1);
    })

    it("can call global javascript functions", function(){
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

