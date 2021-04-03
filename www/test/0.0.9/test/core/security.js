describe("security options", function() {

    beforeEach(function() {
        clearWorkArea();
    });
    afterEach(function()  {
        clearWorkArea();
    });

    it("on a single div", function(){
        var div = make("<div disable-scripting>" +
            "<div id='d1' _='on click add .foo'></div>" +
            "</div>");
        var innerDiv = byId("d1");
        innerDiv.click();
        innerDiv.classList.contains("foo").should.equal(false);
    })


});