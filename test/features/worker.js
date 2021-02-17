describe("the worker feature", function() {

    beforeEach(function () {
        clearWorkArea();
    });
    afterEach(function () {
        clearWorkArea();
    });

    it("can define a basic no arg function in a worker", function(done){
        var script = make(
            "<script type='text/hyperscript'>" +
            "worker example" +
            "  def func " +
            "    return 1 " +
            "  end " +
            "end" +
            "</script>");
        window.example.func().then(function (result) {
            assert.equal(result, 1);
            delete window.example;
            done();
        });
    })

    it("can define a basic one arg function", function(done){
        var script = make(
            "<script type='text/hyperscript'>" +
            "worker example" +
            "  def fn(n) " +
            "    return n " +
            "  end " +
            "end" +
            "</script>");
        window.example.fn(1).then(function (result) {
            assert.equal(result, 1);
            delete window.example;
            done();
        });
    })

    it('can call functions from within _hyperscript', function (done) {
        var div;
        window.finish = function() {        
            div.innerHTML.should.equal('2');
            done();
        }
        var script = make(
            "<script type='text/hyperscript'>" +
            "worker example" +
            "  def fn(n) " +
            "    return n + 1 " +
            "  end " +
            "end" +
            "</script>");
        div = make("<div _='on click call example.fn(1)"+
                   "        then put it into my.innerHTML"+
                   "        then call finish()'></div>");
        div.click();
    })

    it("can evaluate expressions in worker functions", function(done){
        var script = make(
            "<script type='text/hyperscript'>" +
            "worker example" +
            "  def fn(n) " +
            "    return n + 1 " +
            "  end " +
            "end" +
            "</script>");
        window.example.fn(1).then(function (result) {
            assert.equal(result, 2);
            delete window.example;
            done();
        });
    })

    it("workers can be namespaced", function(done){
        var script = make(
            "<script type='text/hyperscript'>" +
            "worker example.foo.bar" +
            "  def fn " +
            "    return 1 " +
            "  end " +
            "end" +
            "</script>");
        window.example.foo.bar.fn().then(function (result) {
            assert.equal(result, 1);
            delete window.example;
            done();
        });
    })

    it('can import external scripts', function(done) {
        assert(false);
    });
});
