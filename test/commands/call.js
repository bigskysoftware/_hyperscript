describe("the call command", function() {

    beforeEach(function () {
        this.server = makeServer();
        clearWorkArea();
    });
    afterEach(function () {
        this.server.restore();
        clearWorkArea();
    });

    it("can call javascript functions", function(){
        var d1 = make("<div id='d1' _='on click call document.getElementById(\"d1\") then" +
            "                                          put it into globals.results'></div>");
        d1.click();
        _hyperscript.runtime.getGlobal("results").should.equal(d1);
    })


});

