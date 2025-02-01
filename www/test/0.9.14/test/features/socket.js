describe("the socket feature", function () {
	it("can handle different url schemes", function () {
		try {
			_hyperscript("socket MySocket ws:/ws/test/ on message as json log message end");
		} catch (e) {
			if (e instanceof DOMException) {
				assert.fail("Scheme ws: Should not have thrown");
			}
		}
		assert.property(window, "MySocket");
		delete window.MySocket;

		try {
			_hyperscript("socket MySocket wss:/ws/test/ on message as json log message end");
		} catch (e) {
			if (e instanceof DOMException) {
				assert.fail("Scheme wss: Should not have thrown");
			}
		}
		assert.property(window, "MySocket");
		delete window.MySocket;

		try {
			_hyperscript("socket MySocket /ws/test/ on message as json log message end");
		} catch (e) {
			if (e instanceof DOMException) {
				assert.fail("No scheme: Should not have thrown");
			}
		}
		assert.property(window, "MySocket");
		var url = window.MySocket["raw"].url
		if (window.location.protocol === "http:")
			assert.include(url, "ws");
		else
			assert.include(url, "wss");
		assert.include(url, window.location.hostname);
		if (window.location.port)
			assert.include(url, window.location.port);
		delete window.MySocket;

		try {
			_hyperscript("socket MySocket abc:/ws/test/ on message as json log message end");
		} catch (e) {
			if (!(e instanceof DOMException)) {
				assert.fail("Scheme abc: Should have thrown");
			}
		}
		assert.notProperty(window, "MySocket");
	});
});
