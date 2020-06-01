describe("the call command", function() {

    beforeEach(function () {
        clearWorkArea();
    });
    afterEach(function () {
        clearWorkArea();
    });

    it("can call javascript instance functions", function(){
        var d1 = make("<div id='d1' _='on click call document.getElementById(\"d1\") then" +
            "                                          put it into globals.results'></div>");
        d1.click();
        _hyperscript.runtime.getGlobal("results").should.equal(d1);
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

    it("can call injected global functions", function(){
        var calledWith = null;
        _hyperscript.runtime.setGlobal("myFun", function(val){
            calledWith = val;
        })
        try {
            var div = make("<div _='on click call globals.myFun(\"foo\")'></div>");
            div.click();
            "foo".should.equal(calledWith);
        } finally {
            _hyperscript.runtime.setGlobal("myFun", null);
        }
    })



});

