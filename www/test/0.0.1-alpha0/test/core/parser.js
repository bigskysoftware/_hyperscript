describe("the _hyperscript parser", function() {

    it("basic parse error messages work", function () {
        var msg = null
        try {
            var value = _hyperscript.evaluate('add badstr to');
        } catch(e) {
            var msg = e.message
        }
        assert.isNotNull(msg)
        console.log(msg)
        msg.indexOf("Expected '=' but found 'to'").should.equal(0)
    })


})