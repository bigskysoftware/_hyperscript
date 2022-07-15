describe("the _hyperscript parser", function () {
	beforeEach(function () {
		clearWorkArea();
	});
	afterEach(function () {
		clearWorkArea();
	});

	it("basic parse error messages work", function () {
		var msg = getParseErrorFor("add - to");
		startsWith(msg, "Expected either a class reference or attribute expression");
	});

	it("continues initializing elements in the presence of a parse error", function () {
		var div = make(
			"<div>" +
				"<div id='d1' _='on click bad'></div>" +
				"<div id='d2' _='on click put \"clicked\" into my.innerHTML'></div>" +
				"</div>"
		);
		var div2 = byId("d2");
		div2.click();
		div2.innerText.should.equal("clicked");
	});

	it("can have comments in scripts", function () {
		var script = make(
			"<script type='text/hyperscript'>" +
				"-- this is a comment\n" +
				"def foo() -- this is another comment\n" +
				'  return "foo"\n' +
				"end -- end with a comment" +
				"--- this is a comment\n" +
				"----this is a comment----\n" +
				"def bar() ---this is another comment\n" +
				'  return "bar"\n' +
				"end --- end with a comment" +
				"</script>"
		);
		foo().should.equal("foo");
		bar().should.equal("bar");
		delete window.foo;
		delete window.bar;
	});

	it("can have comments in attributes", function () {
		var div = make(
			"<div _='on click put \"clicked\" into my.innerHTML -- put some content into the div...'></div>"
		);
		div.click();
		div.innerText.should.equal("clicked");
		var div = make(
			"<div _='on click put \"clicked\" into my.innerHTML ---put some content into the div...'></div>"
		);
		div.click();
		div.innerText.should.equal("clicked");
	});

	it("can have alternate comments in scripts", function () {
		var script = make(
			"<script type='text/hyperscript'>" +
				"// this is a comment\n" +
				"def foo() // this is another comment\n" +
				'  return "foo"\n' +
				"end // end with a comment" +
				"</script>"
		);
		foo().should.equal("foo");
		delete window.foo;
	});

	it("can have alternate comments in attributes", function () {
		var div = make(
			"<div _='on click put \"clicked\" into my.innerHTML // put some content into the div...'></div>"
		);
		div.click();
		div.innerText.should.equal("clicked");
	});

	it("can have alternate multiline comments in scripts", function () {
		var script = make(
			"<script type='text/hyperscript'>" +
				"/* this is a comment\n" +
				"this is still a comment */\n" +
				"def foo() /* this is another comment */\n" +
				'  return "foo"\n' +
				"end /* end with a multiline comment \n */" +
				"</script>"
		);
		foo().should.equal("foo");
		delete window.foo;
	});

	it("can have multiline comments in attributes", function () {
		var div = make(
			"<div _='on click put \"clicked\" into my.innerHTML /* put some content\n into the div... */'></div>"
		);
		div.click();
		div.innerText.should.equal("clicked");
	});

	it("can support parenthesized commands and features", function () {
		var div = make(
			"<div _='(on click (log me) (trigger foo))" +
				'                (on foo (put "clicked" into my.innerHTML))\'></div>'
		);
		div.click();
		div.innerText.should.equal("clicked");
	});
});
