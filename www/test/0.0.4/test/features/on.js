describe("the on feature", function() {

    beforeEach(function () {
        clearWorkArea();
    });
    afterEach(function () {
         clearWorkArea();
    });

    it("can respond to events with dots in names", function(){
        var bar = make("<div _='on click send example.event to #d1'></div>");
        var div = make("<div id='d1' _='on example.event add .called'></div>");
        div.classList.contains("called").should.equal(false);
        bar.click();
        div.classList.contains("called").should.equal(true);
    })

    it("can respond to events with colons in names", function(){
        var bar = make("<div _='on click send example:event to #d1'></div>");
        var div = make("<div id='d1' _='on example:event add .called'></div>");
        div.classList.contains("called").should.equal(false);
        bar.click();
        div.classList.contains("called").should.equal(true);
    })

    it("can respond to events on other elements", function(){
        var bar = make("<div id='bar'></div>");
        var div = make("<div _='on click from #bar add .clicked'></div>");
        div.classList.contains("clicked").should.equal(false);
        bar.click();
        div.classList.contains("clicked").should.equal(true);
    })

    it("can pick detail fields out by name", function(){
        var bar = make("<div id='d1' _='on click send custom(foo:\"fromBar\") to #d2'></div>");
        var div = make("<div id='d2' _='on custom(foo) call me.classList.add(foo)'></div>");
        div.classList.contains("fromBar").should.equal(false);
        bar.click();
        div.classList.contains("fromBar").should.equal(true);
    })

    it("can fire an event on load", function(){
        var div = make("<div id='d1' _='on load put \"Loaded\" into my.innerHTML'></div>");
        div.innerText.should.equal("Loaded");
    })

    it("can be in a top level script tag", function(){
        var div = make("<script type='text/hyperscript'>on load put \"Loaded\" into #d1.innerHTML</script><div id='d1'></div>");
        byId('d1').innerText.should.equal("Loaded");
    })

    it("can have a simple event filter", function(){
        var div = make("<div id='d1' _='on click[false] log event then put \"Clicked\" into my.innerHTML'></div>");
        div.click();
        byId('d1').innerText.should.equal("");
    })

    it("can refer to event properties directly in filter", function(){
        var div = make("<div _='on click[buttons==0] log event then put \"Clicked\" into my.innerHTML'></div>");
        div.click();
        div.innerText.should.equal("Clicked");

        div = make("<div _='on click[buttons==1] log event then put \"Clicked\" into my.innerHTML'></div>");
        div.click();
        div.innerText.should.equal("");

        div = make("<div _='on click[buttons==1 and buttons==0] log event then put \"Clicked\" into my.innerHTML'></div>");
        div.click();
        div.innerText.should.equal("");
    })

    it("can click after a positive event filter", function(){
        var div = make("<div _='on foo(bar)[bar] put \"triggered\" into my.innerHTML'></div>");
        div.dispatchEvent(new CustomEvent("foo", {detail: {bar:false}}));
        div.innerText.should.equal("");

        div.dispatchEvent(new CustomEvent("foo", {detail: {bar:true}}));
        div.innerText.should.equal("triggered");

    })

    it("one event at a time is allowed to execute by default", function(){

        var i = 1;
        window.increment = function(){
            return i++;
        }

        var div = make("<div _='on click put increment() into my.innerHTML then wait for a customEvent'></div>");
        div.click()
        div.innerText.should.equal("1");
        div.click()
        div.innerText.should.equal("1");
        div.dispatchEvent(new CustomEvent("customEvent"));
        div.innerText.should.equal("1");
        div.click()
        div.innerText.should.equal("2");
        delete window.increment;
    })

    it("multiple event handlers at a time are allowed to execute with the every keyword", function(){

        var i = 1;
        window.increment = function(){
            return i++;
        }

        var div = make("<div _='on every click put increment() into my.innerHTML then wait for a customEvent'></div>");
        div.click()
        div.innerText.should.equal("1");
        div.click()
        div.innerText.should.equal("2");
        div.click()
        div.innerText.should.equal("3");
        delete window.increment;
    })



});

