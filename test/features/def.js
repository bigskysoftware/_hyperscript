describe("the def feature", function() {

    beforeEach(function () {
        clearWorkArea();
    });
    afterEach(function () {
         clearWorkArea();
    });

    it("can define a basic no arg function", function(){
        var script = make(
            "<script type='text/hyperscript'>" +
            "def foo() " +
            "  add .called to #d1 " +
            "end" +
            "</script>");
        var bar = make("<div _='on click call foo()'></div>");
        var div = make("<div id='d1'></div>");
        div.classList.contains("called").should.equal(false);
        bar.click();
        div.classList.contains("called").should.equal(true);
        delete window.foo;
    })

    it("can define a basic one arg function", function(){
        var script = make("<script type='text/hyperscript'>def foo(str) put str into #d1.innerHTML end</script>");
        var bar = make("<div _='on click call foo(\"called\")'></div>");
        var div = make("<div id='d1'></div>");
        div.innerHTML.should.equal("");
        bar.click();
        div.innerHTML.should.equal("called");
        delete window.foo;
    })

    it("functions can be namespaced", function(){
        var script = make(
            "<script type='text/hyperscript'>" +
            "def utils.foo() " +
            "  add .called to #d1 " +
            "end" +
            "</script>");
        var bar = make("<div _='on click call utils.foo()'></div>");
        var div = make("<div id='d1'></div>");
        div.classList.contains("called").should.equal(false);
        bar.click();
        div.classList.contains("called").should.equal(true);
        delete window.utils;
    })

    it("is called synchronously", function(){
        var script = make(
            "<script type='text/hyperscript'>" +
            "def foo() " +
            "  log me" +
            "end" +
            "</script>");
        var bar = make("<div _='on click call foo() then add .called to #d1'></div>");
        var div = make("<div id='d1'></div>");
        div.classList.contains("called").should.equal(false);
        bar.click();
        div.classList.contains("called").should.equal(true);
        delete window.foo;
    })

    it("can call asynchronously", function(done){
        var script = make(
            "<script type='text/hyperscript'>" +
            "def foo() " +
            "  wait 1ms" +
            "  log me" +
            "end" +
            "</script>");
        var bar = make("<div _='on click call foo() then add .called to #d1'></div>");
        var div = make("<div id='d1'></div>");
        div.classList.contains("called").should.equal(false);
        bar.click();
        setTimeout(function () {
            div.classList.contains("called").should.equal(true);
            delete window.foo;
            done();
        }, 10);
    })

    it("can return a value synchronously", function(){
        var script = make(
            "<script type='text/hyperscript'>" +
            "def foo() " +
            "  return \"foo\"" +
            "end" +
            "</script>");
        var bar = make("<div _='on click call foo() then put it into #d1.innerText'></div>");
        var div = make("<div id='d1'></div>");
        div.innerText.should.equal("");
        bar.click();
        div.innerText.should.equal("foo");
        delete window.foo;
    })

    it("can return a value asynchronously", function(done){
        var script = make(
            "<script type='text/hyperscript'>" +
            "def foo() " +
            "  wait 1ms" +
            "  return \"foo\"" +
            "end" +
            "</script>");
        var bar = make("<div _='on click call foo() then put it into #d1.innerText'></div>");
        var div = make("<div id='d1'></div>");
        div.innerText.should.equal("");
        bar.click();
        setTimeout(function () {
            div.innerText.should.equal("foo");
            delete window.foo;
            done();
        }, 10);
    })

    it("can interop with javascript", function(){
        var script = make(
            "<script type='text/hyperscript'>" +
            "def foo() " +
            "  return \"foo\"" +
            "end" +
            "</script>");
        foo().should.equal("foo");
        delete window.foo;
    })

    it("can interop with javascript asynchronously", function(done){
        var script = make(
            "<script type='text/hyperscript'>" +
            "def foo() " +
            "  wait 1ms" +
            "  return \"foo\"" +
            "end" +
            "</script>");
        var result = foo();
        result.then(function(val){
            val.should.equal("foo");
            delete window.foo;
            done();
        })
    })

    it("can catch exceptions", function(){
        var script = make(
            "<script type='text/hyperscript'>" +
            "def foo() " +
            "  throw \"bar\"" +
            "catch e " +
            "   set window.bar to e " +
            "end" +
            "</script>");
        foo();
        window.bar.should.equal('bar');
        delete window.bar;
        delete window.foo;
    })

    it("can catch nested async exceptions", function(done){
        var script = make(
            "<script type='text/hyperscript'>" +
            "def doh() " +
            "  wait 10ms" +
            "  throw \"bar\"" +
            "end " +
            " " +
            "def foo() " +
            "  call doh()" +
            "catch e " +
            "   set window.bar to e " +
            "end" +
            "</script>");
        foo();
        setTimeout(function () {
            window.bar.should.equal('bar');
            delete window.bar;
            delete window.foo;
            delete window.doh;
            done();
        }, 20);
    })


});

