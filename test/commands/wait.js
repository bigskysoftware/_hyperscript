describe("the wait command", function() {

    beforeEach(function () {
        clearWorkArea();
    });
    afterEach(function () {
        clearWorkArea();
    });

    it("can wait on time", function(finished){
        var div = make("<div _='on click " +
            "                             add .foo then " +
            "                             wait 20ms then " +
            "                             add .bar'></div>");
        div.classList.contains("foo").should.equal(false);
        div.classList.contains("bar").should.equal(false);
        div.click();
        div.classList.contains("foo").should.equal(true);
        div.classList.contains("bar").should.equal(false);
        setTimeout(function(){
            div.classList.contains("foo").should.equal(true);
            div.classList.contains("bar").should.equal(true);
            finished();
        }, 30)
    })

    it("can wait on event", function(done){
        var div = make("<div _='on click " +
            "                             add .foo then " +
            "                             wait for foo then " +
            "                             add .bar'></div>");
        div.classList.contains("foo").should.equal(false);
        div.classList.contains("bar").should.equal(false);
        div.click();
        div.classList.contains("foo").should.equal(true);
        div.classList.contains("bar").should.equal(false);
        div.dispatchEvent(new CustomEvent("foo"));
        setTimeout(function () {
            div.classList.contains("foo").should.equal(true);
            div.classList.contains("bar").should.equal(true);
            done();
        }, 10);
    })

    it("waiting on an event sets 'it' to the event", function(done){
        var div = make("<div _='on click wait for foo
                                then put its.detail into me'></div>");
        div.click();
		div.innerHTML.should.equal('');
        div.dispatchEvent(new CustomEvent("foo", { detail: 'hyperscript is hyper cool' }));
        setTimeout(function () {
            div.innerHTML.should.equal('hyperscript is hyper cool');
            done();
        }, 10);
    })

    it("can wait on event on another element", function(done){
        var div = make("<div _='on click " +
            "                             add .foo then " +
            "                             wait for foo from #d2 then " +
            "                             add .bar'></div>");
        var div2 = make("<div id='d2'></div>");

        div.classList.contains("foo").should.equal(false);
        div.classList.contains("bar").should.equal(false);
        div.click();
        div.classList.contains("foo").should.equal(true);
        div.classList.contains("bar").should.equal(false);

        div2.dispatchEvent(new CustomEvent("foo"));
        setTimeout(function(){
            div.classList.contains("foo").should.equal(true);
            div.classList.contains("bar").should.equal(true);
            done();
        }, 10)
    })

});

