describe("the _hyperscript parser", function() {

    it("basic parse error messages work", function () {
        var msg = getParseErrorFor("addCmd", 'add badstr to');
        startsWith(msg, "Expected either a class reference or attribute expression")
    })

    it("continues parsing even in the presence of a parse error", function(){
        var div = make("<div>" +
            "<div id='d1' _='on click bad'></div>" +
            "<div id='d2' _='on click put \"clicked\" into my.innerHTML'></div>" +
            "</div>")
        var div2 = byId("d2");
        div2.click();
        div2.innerText.should.equal("clicked");
    })

})