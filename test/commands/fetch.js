describe("the fetch command", function () {
	beforeEach(function () {
		clearWorkArea();
		sinon.stub(window, "fetch");
	});
	afterEach(function () {
		sinon.restore();
		clearWorkArea();
	});

	it("can do a simple fetch", function (done) {
		window.fetch.returns(
			Promise.resolve(
				new window.Response("yay", {
					status: 200,
					headers: { "Content-type": "text/html" },
				})
			)
		);
		var div = make("<div _='on click fetch \"/test\" then put it into my.innerHTML'></div>");
		div.click();
		setTimeout(function () {
			div.innerHTML.should.equal("yay");
			done();
		}, 50);
	});

	it("can do a simple fetch w/ a naked URL", function (done) {
		window.fetch.returns(
			Promise.resolve(
				new window.Response("yay", {
					status: 200,
					headers: { "Content-type": "text/html" },
				})
			)
		);
		var div = make("<div _='on click fetch /test then put it into my.innerHTML'></div>");
		div.click();
		setTimeout(function () {
			div.innerHTML.should.equal("yay");
			done();
		}, 50);
	});

	it("can do a simple fetch w/ html", function (done) {
		window.fetch.returns(
			Promise.resolve(
				new window.Response("<br>", {
					status: 200,
					headers: { "Content-type": "text/html" },
				})
			)
		);
		var div = make(
			"<div _='on click fetch /test as html then log it then put it into my.innerHTML put its childElementCount into my @data-count'></div>"
		);
		div.click();
		setTimeout(function () {
			div.innerHTML.should.equal("[object DocumentFragment]");
			div.dataset.count.should.equal("1");
			done();
		}, 50);
	});

	it("can do a simple fetch w/ json", function (done) {
		window.fetch.returns(
			Promise.resolve(
				new window.Response('{"foo":1}', {
					status: 200,
					headers: { "Content-type": "application/json" },
				})
			)
		);
		var div = make(
			"<div _='on click fetch /test as json then get result as JSON then put it into my.innerHTML'></div>"
		);
		div.click();
		setTimeout(function () {
			div.innerHTML.should.equal('{"foo":1}');
			done();
		}, 50);
	});

	it("can do a simple fetch w/ json using Object syntax", function (done) {
		window.fetch.returns(
			Promise.resolve(
				new window.Response('{"foo":1}', {
					status: 200,
					headers: { "Content-type": "application/json" },
				})
			)
		);
		var div = make(
			"<div _='on click fetch /test as Object then get result as JSON then put it into my.innerHTML'></div>"
		);
		div.click();
		setTimeout(function () {
			div.innerHTML.should.equal('{"foo":1}');
			done();
		}, 50);
	});

	it("can do a simple fetch w/ json using Object syntax and an 'an' prefix", function (done) {
		window.fetch.returns(
			Promise.resolve(
				new window.Response('{"foo":1}', {
					status: 200,
					headers: { "Content-type": "application/json" },
				})
			)
		);
		var div = make(
			"<div _='on click fetch /test as an Object then get result as JSON then put it into my.innerHTML'></div>"
		);
		div.click();
		setTimeout(function () {
			div.innerHTML.should.equal('{"foo":1}');
			done();
		}, 50);
	});

	it("can do a simple fetch with a response object", function (done) {
		window.fetch.returns(
			Promise.resolve(
				new window.Response('{"foo":1}', {
					status: 200,
					headers: { "Content-type": "application/json" },
				})
			)
		);
		var div = make("<div _='on click fetch /test as response then if its.ok put \"yep\" into my.innerHTML'></div>");
		div.click();
		setTimeout(function () {
			div.innerHTML.should.equal("yep");
			done();
		}, 50);
	});

	it("can do a simple fetch w/ a custom conversion", function (done) {
		window.fetch.returns(
			Promise.resolve(
				new window.Response("1.2000", {
					status: 200,
					headers: { "Content-type": "text/plain" },
				})
			)
		);
		var div = make("<div _='on click fetch /test as Number then put it into my.innerHTML'></div>");
		div.click();
		setTimeout(function () {
			div.innerHTML.should.equal("1.2");
			done();
		}, 50);
	});

	it("can do a simple post", function (done) {
		window.fetch.returns(
			Promise.resolve(
				new window.Response("yay", {
					status: 200,
					headers: { "Content-type": "text/html" },
				})
			)
		);
		var div = make("<div _='on click fetch /test {method:\"POST\"} then put it into my.innerHTML'></div>");
		div.click();
		setTimeout(function () {
			div.innerHTML.should.equal("yay");
			done();
		}, 50);
	});

	it("triggers an event just before fetching", function (done) {
		window.fetch.returns(
			Promise.resolve(
				new window.Response("yay", {
					status: 200,
					headers: { "Content-type": "text/html" },
				})
			)
		);
		window.addEventListener('hyperscript:beforeFetch', (event) => {
			event.target.className = "foo-set";
		});
		var div = make("<div _='on click fetch \"/test\" then put it into my.innerHTML end'></div>");
		div.classList.contains("foo-set").should.equal(false);
		div.click();
		div.classList.contains("foo-set").should.equal(true);
		setTimeout(function () {
			div.innerHTML.should.equal("yay");
			done();
		}, 50);
	});

	it("submits the fetch parameters to the event handler", function (done) {
		window.fetch.returns(
			Promise.resolve(
				new window.Response("yay", {
					status: 200,
					headers: { "Content-type": "text/html" },
				})
			)
		);
		var evtListener = function(event) {
			event.detail.headers.should.have.property('X-CustomHeader', 'foo');
		}
		window.addEventListener('hyperscript:beforeFetch', evtListener);
		var div = make("<div _='on click fetch \"/test\" {headers: {\"X-CustomHeader\": \"foo\"}} then put it into my.innerHTML end'></div>");
		div.click();
		setTimeout(function () {
			window.removeEventListener('hyperscript:beforeFetch', evtListener);
			div.innerHTML.should.equal("yay");
			done();
		}, 50);
	});

	it("allows the event handler to change the fetch parameters", function (done) {
		window.fetch.callsFake(function () {
			arguments[1].should.have.property('headers');
			arguments[1].headers.should.have.property('X-CustomHeader', 'foo');
			return Promise.resolve(
				new window.Response("yay", {
					status: 200,
					headers: { "Content-type": "text/html" },
				})
			)
		});
		var evtListener = function(event) {
			event.detail.headers = {'X-CustomHeader': 'foo'};
		}
		window.addEventListener('hyperscript:beforeFetch', evtListener);
		var div = make("<div _='on click fetch \"/test\" then put it into my.innerHTML end'></div>");
		div.click();
		setTimeout(function () {
			window.removeEventListener('hyperscript:beforeFetch', evtListener);
			div.innerHTML.should.equal("yay");
			done();
		}, 50);
	});

});
