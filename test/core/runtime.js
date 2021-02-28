describe("the _hyperscript runtime", function() {

    it("has proper stack", function(){
        var script = make(
            "<script type='text/hyperscript'>" +
            "def foo() " +
            "  return bar() " +
            "end " +
            "def bar() " +
            "  return meta.caller " +
            "end " +
            " " +
            "</script>");
        var result = foo();
        result.meta.feature.name.should.equal('foo');
        delete window.foo;
        delete window.bar;
    })

    it("has proper stack from event handler", function(){
        var script = make(
            "<script type='text/hyperscript'>" +
            "def bar() " +
            "  log meta.caller " +
            "  return meta.caller " +
            "end " +
            " " +
            "</script>");
        var div = make("<div _='on click put bar().meta.feature.type into my.innerHTML'></div>")
        div.click();
        div.innerHTML.should.equal("onFeature");
        delete window.bar;
    })

    it("hypertrace is reasonable", function(){
        var script = make(
            "<script type='text/hyperscript'>" +
            "def bar() " +
            "  call baz('nope') " +
            "end " +
            " " +
            "def baz(str) " +
            "  throw str " +
            "end " +
            " " +
            "</script>");
        var div = make("<div _='on click call bar()'></div>")
        div.click();
        delete window.bar
        delete window.baz
    })

    it("hypertrace from javascript is reasonable", function(){
        window.baz = function(str){
            throw new Error(str);
        }
        var script = make(
            "<script type='text/hyperscript'>" +
            "def bar() " +
            "  call baz('nope') " +
            "end " +
            " " +
            "</script>");
        var div = make("<div _='on click call bar()'></div>")
        div.click();
        delete window.bar
        delete window.baz
    })

    it("async hypertrace is reasonable", function(done){
        var script = make(
            "<script type='text/hyperscript'>" +
            "def bar() " +
            "  call baz('nope') " +
            "end " +
            " " +
            "def baz(str) " +
            "  wait 20ms " +
            "  throw str " +
            "end " +
            " " +
            "</script>");
        var div = make("<div _='on click call bar()'></div>")
        div.click();
        setTimeout(function () {
            delete window.bar
            delete window.baz
            done();
        }, 100);
    })


});