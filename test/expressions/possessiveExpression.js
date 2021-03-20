describe("possessiveExpression", function () {

    beforeEach(function () {
        clearWorkArea();
    });
    afterEach(function () {
        clearWorkArea();
    });

    it("can access basic properties", function () {
        var result = evalHyperScript("foo's foo", {foo:{foo: 'foo'}});
        result.should.equal("foo");
    });

    it("is null safe", function () {
        var result = evalHyperScript("foo's foo" );
        should.equal(result, undefined);
    });

    it("can access my properties", function () {
        var result = evalHyperScript('my foo', {me:{foo: 'foo'}});
        result.should.equal("foo");
    });

    it("my property is null safe", function () {
        var result = evalHyperScript('my foo' );
        should.equal(result, undefined);
    });

    it("can access its properties", function () {
        var result = evalHyperScript('its foo', {result:{foo: 'foo'}});
        result.should.equal("foo");
    });

    it("its property is null safe", function () {
        var result = evalHyperScript('its foo' );
        should.equal(result, undefined);
    });

    it("can access properties on idrefs", function () {
        make("<div id='foo' style='display: inline'></div>")
        var result = evalHyperScript("the display of #foo's style");
        result.should.equal("inline");
    });

    it("can access properties on idrefs 2", function () {
        make("<div id='foo' style='display: inline'></div>")
        var result = evalHyperScript("#foo's style's display");
        result.should.equal("inline");
    });

    it("can access properties on classrefs", function () {
        make("<div class='foo' style='display: inline'></div>")
        var result = evalHyperScript("the display of .foo's style");
        result.should.deep.equal(["inline"]);
    });

    it("can access properties on classrefs 2", function () {
        make("<div class='foo' style='display: inline'></div>")
        var result = evalHyperScript(".foo's style's display");
        result.should.deep.equal(["inline"]);
    });

    it("can access properties on queryrefs", function () {
        make("<div class='foo' style='display: inline'></div>")
        var result = evalHyperScript("the display of <.foo/>'s style");
        result.should.deep.equal(["inline"]);
    });

    it("can access properties on queryrefs 2", function () {
        make("<div class='foo' style='display: inline'></div>")
        var result = evalHyperScript("<.foo/>'s style's display");
        result.should.deep.equal(["inline"]);
    });

    it("can access basic attribute", function () {
        var div = make("<div data-foo='bar'></div>");
        var result = evalHyperScript("foo's attribute data-foo", {foo:div});
        result.should.equal("bar");
    });

    it("can access multiple basic attributes", function () {
        make("<div class='c1' data-foo='bar'></div><div class='c1' data-foo='bar'></div>");
        var result = evalHyperScript(".c1's attribute data-foo");
        result.should.deep.equal(["bar", "bar"]);
    });

    it("can set basic attributes", function () {
        var div = make("<div data-foo='bar'></div>");
        var result = evalHyperScript("set foo's attribute data-foo to 'blah'", {foo:div});
        div.getAttribute("data-foo").should.equal('blah');
    });

    it("can set multiple basic attributes", function () {
        make("<div class='c1' data-foo='bar'></div><div class='c1' data-foo='bar'></div>");
        var result = evalHyperScript("set .c1's attribute data-foo to 'blah'");
    });

});
