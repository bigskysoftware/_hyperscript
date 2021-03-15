describe("_hyperscript runtime errors", function() {

    beforeEach(function () {
        clearWorkArea();
    });
    afterEach(function () {
        clearWorkArea();
    });

    it("null errors are properly reported", function(){
        try {
            _hyperscript("x()");
            throw "should have thrown";
        } catch(e) {
            e.message.should.equal('x is null');
        }

        try {
            _hyperscript("x.y()");
            throw "should have thrown";
        } catch(e) {
            e.message.should.equal('x is null');
        }

        try {
            _hyperscript("x.y()", {x:{}});
            throw "should have thrown";
        } catch(e) {
            e.message.should.equal('x.y is null');
        }
    })


});