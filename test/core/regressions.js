describe("_hyperscript regressions", function() {

    beforeEach(function () {
        clearWorkArea();
    });
    afterEach(function () {
        clearWorkArea();
    });

    it("can pick detail fields out by name", function(){
        var div = make("<div id='d1'></div>")
        var input = make("<input debug='true' _='on onchange if my.value !== \"\" then trigger customEvt end end " +
                                          "on customEvt log event then put my.value into #d1.innerHTML'/>");
        div.innerHTML.should.equal("");
        input.value = "foo";
        input.dispatchEvent(new Event("onchange"));
        input.value = "";
        input.dispatchEvent(new Event("onchange"));
        div.innerHTML.should.equal("foo");
        input.value = "bar";
        input.dispatchEvent(new Event("onchange"));
        div.innerHTML.should.equal("bar");
    })

});