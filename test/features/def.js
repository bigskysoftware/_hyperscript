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


});

