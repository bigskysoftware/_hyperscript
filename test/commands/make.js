describe("the make command", function () {
	it("can make objects", function () {
		evalHyperScript(`make a WeakMap then set window.obj to it`)
		window.obj.should.be.a("weakmap")
		delete window.obj
	})
	
	it("can make named objects", function () {
		evalHyperScript(`make a WeakMap called wm then set window.obj to wm`)
		window.obj.should.be.a("weakmap")
		delete window.obj
	})

	it("can make objects with arguments", function () {
		evalHyperScript(`
			make a URL from "/playground/", "https://hyperscript.org/"
			set window.obj to it`)
		window.obj.should.be.a("URL")
		window.obj.href.should.equal("https://hyperscript.org/playground/");
		delete window.obj
	})

	it("can make named objects with arguments", function () {
		evalHyperScript(`
			make a URL from "/playground/", "https://hyperscript.org/" called u 
			set window.obj to u`)
		window.obj.should.be.a("URL")
		window.obj.href.should.equal("https://hyperscript.org/playground/");
		delete window.obj
	})

	it("can make elements", function () {
		evalHyperScript(`make a <p/> set window.obj to it`)
		window.obj.should.be.a("htmlparagraphelement")
		delete window.obj
	})

	it("can make elements with id and classes", function () {
		evalHyperScript(`make a <p.a#id.b.c/> set window.obj to it`)
		window.obj.should.be.a("htmlparagraphelement")
		window.obj.id.should.equal("id")
		assert(window.obj.classList.contains("a"))
		assert(window.obj.classList.contains("b"))
		assert(window.obj.classList.contains("c"))
		delete window.obj
	})

	it("creates a div by default", function () {
		evalHyperScript(`make a <.a/> set window.obj to it`)
		window.obj.should.be.a("htmldivelement")
		assert(window.obj.classList.contains("a"))
		delete window.obj
	})
})
