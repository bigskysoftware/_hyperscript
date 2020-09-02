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

    it("can call no argument functions", function(){
        var called = false;
        window.globalFunction = function(){
            called = true;
        }
        try {
            var div = make("<div _='on click call globalFunction()'></div>");
            div.click();
            called.should.equal(true);
        } finally {
            delete window.globalFunction;
        }
    })

    it("can call functions w/ underscores", function(){
        var called = false;
        window.global_function = function(){
            called = true;
        }
        try {
            var div = make("<div _='on click call global_function()'></div>");
            div.click();
            called.should.equal(true);
        } finally {
            delete window.global_function;
        }
    })

    it("can call functions w/ dollar signs", function(){
        var called = false;
        window.$ = function(){
            called = true;
        }
        try {
            var div = make("<div _='on click call $()'></div>");
            div.click();
            called.should.equal(true);
        } finally {
            delete window.$;
        }
    })

});

