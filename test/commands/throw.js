describe("the throw command", function() {

    beforeEach(function () {
        clearWorkArea();
    });
    afterEach(function () {
        clearWorkArea();
    });

    it("can throw a basic exception", function () {
        try {
            var script = make("<script type='text/hyperscript'>" +
                "def foo() " +
                "  throw \"foo\"" +
                "end" +
                "</script>");
            foo();
            fail("Should have thrown");
        } catch (e) {
            e.should.equal("foo");
        } finally {
            delete window.foo;
        }
    })

    it("can throw an async exception", function(done){
        var script = make(
            "<script type='text/hyperscript'>" +
            "def foo() " +
            "  wait 2ms" +
            "  throw \"foo\"" +
            "end" +
            "</script>");
        foo().catch(function(error){
            error.should.equal("foo");
            done();
        });
        delete window.foo;
    })

    it("async exceptions propogate properly", function(done){
        var script = make(
            "<script type='text/hyperscript'>" +
            "def foo() " +
            "  wait 2ms" +
            "  throw \"foo\"" +
            "end " +
            "def bar() " +
            "  call foo()" +
            "end" +
            "</script>");
        bar().catch(function(error){
            error.should.equal("foo");
            delete window.foo;
            delete window.bar;
            done();
        });
    })

    it("async exceptions as throws propogate properly", function(done){
        window.bar = function(){
            throw "foo";
        }
        var script = make(
            "<script type='text/hyperscript'>" +
            "def foo() " +
            "  wait 2ms" +
            "  call bar()" +
            "end" +
            "</script>");
        foo().catch(function(error){
            error.should.equal("foo");
            delete window.foo;
            delete window.bar;
            done();
        });
    })


});

