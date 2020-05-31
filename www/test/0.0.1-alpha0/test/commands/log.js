describe("the log command", function() {

    beforeEach(function () {
        this.server = makeServer();
        clearWorkArea();
    });
    afterEach(function () {
        this.server.restore();
        clearWorkArea();
    });

    it("can log single item", function(){
        var d1 = make("<div _='on click log meta.ctx'></div>");
        d1.click();
    })

    it("can log multiple items", function(){
        var d1 = make("<div _='on click log me, meta.context'></div>");
        d1.click();
    })

    it("can log multiple items with debug", function(){
        var d1 = make("<div _='on click log me, meta.context with console.debug'></div>");
        d1.click();
    })

    it("can log multiple items with error", function(){
        var d1 = make("<div _='on click log me, meta.context with console.error'></div>");
        d1.click();
    })

});

