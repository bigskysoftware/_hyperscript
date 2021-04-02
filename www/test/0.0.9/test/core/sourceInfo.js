describe("the line info  parser", function() {

    beforeEach(function () {
        clearWorkArea();
    });
    afterEach(function () {
        clearWorkArea();
    });

    it("debug", function () {
        var elt = _hyperscript.parse("<button.foo/>");
        elt.sourceFor().should.equal("<button.foo/>");
    });

    it("get source works for expressions", function () {
        var elt = _hyperscript.parse("1");
        elt.sourceFor().should.equal("1");

        elt = _hyperscript.parse("a.b");
        elt.sourceFor().should.equal("a.b");
        elt.root.sourceFor().should.equal("a")

        elt = _hyperscript.parse("a.b()");
        elt.sourceFor().should.equal("a.b()");
        elt.root.sourceFor().should.equal("a.b");
        elt.root.root.sourceFor().should.equal("a");

        elt = _hyperscript.parse("<button.foo/>");
        elt.sourceFor().should.equal("<button.foo/>");

        elt = _hyperscript.parse("x + y");
        elt.sourceFor().should.equal("x + y");
        elt.lhs.sourceFor().should.equal("x");
        elt.rhs.sourceFor().should.equal("y");

        elt = _hyperscript.parse("'foo'");
        elt.sourceFor().should.equal("'foo'");

        elt = _hyperscript.parse(".foo");
        elt.sourceFor().should.equal(".foo");

        elt = _hyperscript.parse("#bar");
        elt.sourceFor().should.equal("#bar");
    })

    it("get source works for statements", function () {
        var elt = _hyperscript.parse("if true log 'it was true'");
        elt.sourceFor().should.equal("if true log 'it was true'");

        var elt = _hyperscript.parse("for x in [1, 2, 3] log x then log x end");
        elt.sourceFor().should.equal("for x in [1, 2, 3] log x then log x end");
    })

    it("get line works for statements", function () {
        var elt = _hyperscript.parse("if true\n  log 'it was true'\n    log 'it was true'");
        elt.lineFor().should.equal("if true");
        elt.trueBranch.lineFor().should.equal("  log 'it was true'")
        elt.trueBranch.next.lineFor().should.equal("    log 'it was true'")
    })




})