describe("the _hyperscript parser", function() {

    it("basic parse error messages work", function () {
        var msg = getParseErrorFor("command", 'add badstr to');
        startsWith(msg, "Expected either a class reference or attribute expression")
    })

    it("continues initializing elements in the presence of a parse error", function(){
        var div = make("<div>" +
            "<div id='d1' _='on click bad'></div>" +
            "<div id='d2' _='on click put \"clicked\" into my.innerHTML'></div>" +
            "</div>")
        var div2 = byId("d2");
        div2.click();
        div2.innerText.should.equal("clicked");
    })

    it("can have comments in scripts", function(){
        var script = make(
            "<script type='text/hyperscript'>" +
            "-- this is a comment\n" +
            "def foo() -- this is another comment\n" +
            "  return \"foo\"\n" +
            "end --end with a comment" +
            "</script>");
        foo().should.equal("foo");
        delete window.foo;
    })

    it("can have comments in attributes", function(){
        var div = make("<div _='on click put \"clicked\" into my.innerHTML -- put some content into the div...'></div>")
        div.click();
        div.innerText.should.equal("clicked");
    })


})