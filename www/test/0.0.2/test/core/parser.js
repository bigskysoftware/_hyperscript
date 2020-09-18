describe("the _hyperscript parser", function() {

    it("basic parse error messages work", function () {
        var msg = getParseErrorFor("addCmd", 'add badstr to');
        startsWith(msg, "Expected either a class reference or attribute expression")
    })


})