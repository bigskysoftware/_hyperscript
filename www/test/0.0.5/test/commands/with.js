describe("the with command", function() {

    beforeEach(function () {
        clearWorkArea();
    });
    afterEach(function () {
        clearWorkArea();
    });

    it("establishes a proper implicit me symbol", function(){
        make("<div id='d1' _='on click " +
            "                          add .foo " +
            "                          with #d2" +
            "                            add .bar'></div>" +
            "<div id='d2'></div>");
        var div1 = byId("d1");
        var div2 = byId("d2");

        div1.classList.contains("bar").should.equal(false);
        div1.classList.contains("foo").should.equal(false);
        div2.classList.contains("bar").should.equal(false);
        div2.classList.contains("foo").should.equal(false);

        div1.click();

        div1.classList.contains("bar").should.equal(false);
        div1.classList.contains("foo").should.equal(true);
        div2.classList.contains("bar").should.equal(true);
        div2.classList.contains("foo").should.equal(false);

    })

    it("works with an array", function(){
        make("<div id='d1' _='on click " +
            "                          add .foo " +
            "                          with <p/> in me" +
            "                            add .bar'><p id='p1'></p><p id='p2'></p><div id='d2'></div></div>" +
            "");

        var div1 = byId("d1");
        var p1 = byId("p1");
        var p2 = byId("p2");
        var div2 = byId("d2");

        div1.classList.contains("bar").should.equal(false);
        div1.classList.contains("foo").should.equal(false);

        div2.classList.contains("bar").should.equal(false);
        div2.classList.contains("foo").should.equal(false);

        p1.classList.contains("bar").should.equal(false);
        p1.classList.contains("foo").should.equal(false);

        p2.classList.contains("bar").should.equal(false);
        p2.classList.contains("foo").should.equal(false);

        div1.click();

        div1.classList.contains("bar").should.equal(false);
        div1.classList.contains("foo").should.equal(true);

        div2.classList.contains("bar").should.equal(false);
        div2.classList.contains("foo").should.equal(false);

        p1.classList.contains("bar").should.equal(true);
        p1.classList.contains("foo").should.equal(false);

        p2.classList.contains("bar").should.equal(true);
        p2.classList.contains("foo").should.equal(false);

    })


    it("restores a proper implicit me symbol", function(){
        make("<div id='d1' _='on click " +
            "                          with #d2" +
            "                            add .bar" +
            "                          end" +
            "                          add .foo'></div>" +
            "<div id='d2'></div>");

        var div1 = byId("d1");
        var div2 = byId("d2");

        div1.classList.contains("bar").should.equal(false);
        div1.classList.contains("foo").should.equal(false);
        div2.classList.contains("bar").should.equal(false);
        div2.classList.contains("foo").should.equal(false);

        div1.click();

        div1.classList.contains("bar").should.equal(false);
        div1.classList.contains("foo").should.equal(true);
        div2.classList.contains("bar").should.equal(true);
        div2.classList.contains("foo").should.equal(false);

    })

    it("ignores null", function(){
        make("<div id='d1' _='on click " +
            "                          with null" +
            "                            add .bar" +
            "                          end" +
            "                          add .foo'></div>" +
            "<div id='d2'></div>");

        var div1 = byId("d1");
        var div2 = byId("d2");

        div1.classList.contains("bar").should.equal(false);
        div1.classList.contains("foo").should.equal(false);
        div2.classList.contains("bar").should.equal(false);
        div2.classList.contains("foo").should.equal(false);

        div1.click();

        div1.classList.contains("bar").should.equal(false);
        div1.classList.contains("foo").should.equal(true);
        div2.classList.contains("bar").should.equal(false);
        div2.classList.contains("foo").should.equal(false);

    })



});

