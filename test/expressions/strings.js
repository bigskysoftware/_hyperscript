describe("the string expression", function () {

    it("handles strings properly", function () {
        var result = evalHyperScript('"foo"');
        result.should.equal("foo");


        var result = evalHyperScript('"fo\'o"');
        result.should.equal("fo'o");


        var result = evalHyperScript("'foo'");
        result.should.equal("foo");

    });

    it("string templates work properly", function () {
        var result = evalHyperScript('"$1"');
        result.should.equal("1");
    });

    it("string templates work w/ props", function () {
        window.foo = 'foo';
        var result = evalHyperScript('"$window.foo"');
        result.should.equal("foo");
        delete window.foo;
    });

    it("string templates work w/ props w/ braces", function () {
        window.foo = 'foo';
        var result = evalHyperScript('"${window.foo}"');
        result.should.equal("foo");
        delete window.foo;
    });

    it("string templates work properly w braces", function () {
        var result = evalHyperScript('"${1 + 2}"');
        result.should.equal("3");
    });

    it("string templates preserve white space", function () {
        var result = evalHyperScript('" ${1 + 2} ${1 + 2} "');
        result.should.equal(" 3 3 ");
        var result = evalHyperScript('"${1 + 2} ${1 + 2} "');
        result.should.equal("3 3 ");
        var result = evalHyperScript('"${1 + 2}${1 + 2} "');
        result.should.equal("33 ");
        var result = evalHyperScript('"${1 + 2} ${1 + 2}"');
        result.should.equal("3 3");
    });

});
