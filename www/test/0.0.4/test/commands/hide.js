describe("the hide command", function() {

    beforeEach(function () {
        clearWorkArea();
    });
    afterEach(function () {
        clearWorkArea();
    });

    it("can hide element, with display:none by default", function () {
        var div = make("<div _='on click hide me'></div>");
        getComputedStyle(div).display.should.equal('block');
        div.click();
        getComputedStyle(div).display.should.equal('none');
    })

    it("can hide element with display:none explicitly", function () {
        var div = make("<div _='on click hide me with display'></div>");
        getComputedStyle(div).display.should.equal('block');
        div.click();
        getComputedStyle(div).display.should.equal('none');
    })

    it("can hide element with opacity:0", function () {
        var div = make("<div _='on click hide me with opacity'></div>");
        getComputedStyle(div).opacity.should.equal('1');
        div.click();
        getComputedStyle(div).opacity.should.equal('0');
    })

    it("can hide element, with visibility:hidden", function () {
        var div = make("<div _='on click hide me with visibility'></div>");
        getComputedStyle(div).visibility.should.equal('visible');
        div.click();
        getComputedStyle(div).visibility.should.equal('hidden');
    })

    it("can hide other elements", function () {
        var hideme = make('<div class=hideme></div>')
        var div = make("<div _='on click hide .hideme'></div>");
        getComputedStyle(hideme).display.should.equal('block');
        div.click();
        getComputedStyle(hideme).display.should.equal('none');
    })
});

