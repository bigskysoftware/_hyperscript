describe("the fetch command", function() {

    beforeEach(function () {
        clearWorkArea();
        sinon.stub(window, 'fetch');
    });
    afterEach(function () {
        sinon.restore();
        clearWorkArea();
    });

    it("can do a simple fetch", function(done){
        window.fetch.returns(Promise.resolve(new window.Response("yay", {
            status: 200,
            headers: {'Content-type': 'text/html'}
        })));
        var div = make("<div _='on click fetch \"/test\" then put it into my.innerHTML'></div>");
        div.click();
        setTimeout(function () {
            div.innerHTML.should.equal("yay");
            done();
        }, 50);
    })

    it("can do a simple fetch w/ a naked URL", function(done){
        window.fetch.returns(Promise.resolve(new window.Response("yay", {
            status: 200,
            headers: {'Content-type': 'text/html'}
        })));
        var div = make("<div _='on click fetch /test then put it into my.innerHTML'></div>");
        div.click();
        setTimeout(function () {
            div.innerHTML.should.equal("yay");
            done();
        }, 50);
    })

    it("can do a simple fetch w/ json", function(done){
        window.fetch.returns(Promise.resolve(new window.Response("{\"foo\":1}", {
            status: 200,
            headers: {'Content-type': 'application/json'}
        })));
        var div = make("<div _='on click fetch /test as json then get result as JSON then put it into my.innerHTML'></div>");
        div.click();
        setTimeout(function () {
            div.innerHTML.should.equal("{\"foo\":1}");
            done();
        }, 50);
    })

    it("can do a simple fetch with a response object", function(done){
        window.fetch.returns(Promise.resolve(new window.Response("{\"foo\":1}", {
            status: 200,
            headers: {'Content-type': 'application/json'}
        })));
        var div = make("<div _='on click fetch /test as response then if its.ok put \"yep\" into my.innerHTML'></div>");
        div.click();
        setTimeout(function () {
            div.innerHTML.should.equal("yep");
            done();
        }, 50);
    })

    it("can do a simple post", function(done){
        window.fetch.returns(Promise.resolve(new window.Response("yay", {
            status: 200,
            headers: {'Content-type': 'text/html'}
        })));
        var div = make("<div _='on click fetch /test {method:\"POST\"} then put it into my.innerHTML'></div>");
        div.click();
        setTimeout(function () {
            div.innerHTML.should.equal("yay");
            done();
        }, 50);
    })

});

