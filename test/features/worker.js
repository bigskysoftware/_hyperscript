describe("the def feature", function() {

    beforeEach(function () {
        clearWorkArea();
    });
    afterEach(function () {
        clearWorkArea();
    });

    it("can define a basic no arg function in a worker", function(done){
        var script = make(
            "<script type='text/hyperscript'>" +
            "worker foo" +
            "  def fn " +
            "    return 1 " +
            "  end " +
            "end" +
            "</script>");
        foo.fn().then(function (result) {
            assert.equal(result, 1);
            delete window.foo;
            done();
    })

    it("can define a basic one arg function", function(done){
        var script = make(
            "<script type='text/hyperscript'>" +
            "worker foo" +
            "  def fn(n) " +
            "    return n " +
            "  end " +
            "end" +
            "</script>");
        foo.fn(1).then(function (result) {
            assert.equal(result, 1);
            delete window.foo;
            done();
        });
    })

    it("can evaluate expressions in worker functions", function(done){
        var script = make(
            "<script type='text/hyperscript'>" +
            "worker foo" +
            "  def fn(n) " +
            "    return n + 1 " +
            "  end " +
            "end" +
            "</script>");
        foo.fn(1).then(function (result) {
            assert.equal(result, 2);
            delete window.foo;
            done();
        });
    })

    it("workers can be namespaced", function(done){
        var script = make(
            "<script type='text/hyperscript'>" +
            "worker foo.bar.baz" +
            "  def fn " +
            "    return 1 " +
            "  end " +
            "end" +
            "</script>");
        foo.bar.baz.fn().then(function (result) {
            assert.equal(result, 1);
            delete window.foo;
            done();
        });
    })

    it('can import external scripts', function(done) {

    })
});

