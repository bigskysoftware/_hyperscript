describe("the ajax command", function() {

    beforeEach(function () {
        clearWorkArea();
        this.server = makeServer()
    });
    afterEach(function () {
//        this.server.restore();
        clearWorkArea();
    });

    it("can do a simple get", function(){
        this.server.respondWith("GET", "/test", [200, {}, 'yay']);
        var div = make("<div _='on click ajax GET \"/test\" then put response into my.innerHTML'></div>");
        div.click();
        this.server.respond();
        div.innerHTML.should.equal("yay");
    })

    it("can do a simple get w/ naked URL", function(){
        this.server.respondWith("GET", "/test", [200, {}, 'yay']);
        var div = make("<div _='on click ajax GET /test then put response into my.innerHTML'></div>");
        div.click();
        this.server.respond();
        div.innerHTML.should.equal("yay");
    })

    it("can do a simple post", function(){
        this.server.respondWith("POST", "/test", [200, {}, 'yay']);
        var div = make("<div _='on click ajax POST to \"/test\" then put response into my.innerHTML'></div>");
        div.click();
        this.server.respond();
        div.innerHTML.should.equal("yay");
    })

    it("can do a post with data", function(){
        this.server.respondWith("POST", "/test", function(xhr){
            var params = JSON.parse(xhr.requestBody);
            xhr.respond(200, {}, params["foo"]);
        });
        var div = make("<div _='on click ajax POST {foo:\"bar\"} to \"/test\" then put response into my.innerHTML'></div>");
        div.click();
        this.server.respond();
        div.innerHTML.should.equal("bar");
    })

    it("can do a post with data w/ naked URL", function(){
        this.server.respondWith("POST", "/test", function(xhr){
            var params = JSON.parse(xhr.requestBody);
            xhr.respond(200, {}, params["foo"]);
        });
        var div = make("<div _='on click ajax POST {foo:\"bar\"} to /test then put response into my.innerHTML'></div>");
        div.click();
        this.server.respond();
        div.innerHTML.should.equal("bar");
    })

});

