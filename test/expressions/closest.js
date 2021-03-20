describe("the closest expression", function () {

    beforeEach(function () {
        clearWorkArea();
    });
    afterEach(function () {
        clearWorkArea();
    });

    it("basic query return values", function () {
        var div3 = make("<div id='d3'><div id='d1'></div><div id='d2'></div></div>")
        var div1 = byId("d1");
        var div2 = byId("d2");

        var result = evalHyperScript("closest <div/>", {me: div3})
        result.should.equal(div3);

        var result = evalHyperScript("closest <div/>", {me: div1})
        result.should.equal(div1);

        var result = evalHyperScript("closest <div/> to #d3", {me: div1})
        result.should.equal(div3);

        var result = evalHyperScript("closest <div/> to my.parentElement", {me: div1})
        result.should.equal(div3);

        var result = evalHyperScript("closest <div/> to parentElement of me", {me: div1})
        result.should.equal(div3);
    });

    it("parent modifier works", function () {
        var div3 = make("<div id='d3'><div id='d1'></div><div id='d2'></div></div>")
        var div1 = byId("d1");
        var div2 = byId("d2");

        var result = evalHyperScript("closest parent <div/>", {me: div1})
        result.should.equal(div3);

        var result = evalHyperScript("closest parent <div/>", {me: div2})
        result.should.equal(div3);
    });

});
