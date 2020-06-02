describe("the _hyperscript parser", function() {

    it("basic parse error messages work", function () {
        var msg = null
        try {
            var value = parseAndTranspileCommand("add", 'add badstr to');
        } catch(e) {
            var msg = e.message
        }
        assert.isNotNull(msg)
        console.log(msg)
        msg.indexOf("Expected either a class reference or attribute expression").should.equal(0)
    })


})