describe("_hyperscript regressions", function () {
	beforeEach(function () {
		clearWorkArea();
	});
	afterEach(function () {
		clearWorkArea();
	});

	it("can pick detail fields out by name", function () {
		var div = make("<div id='d1'></div>");
		var input = make(
			"<input debug='true' _='on onchange if my.value !== \"\" then trigger customEvt end end " +
				"on customEvt log event then put my.value into #d1.innerHTML'/>"
		);
		div.innerHTML.should.equal("");
		input.value = "foo";
		input.dispatchEvent(new Event("onchange"));
		input.value = "";
		input.dispatchEvent(new Event("onchange"));
		div.innerHTML.should.equal("foo");
		input.value = "bar";
		input.dispatchEvent(new Event("onchange"));
		div.innerHTML.should.equal("bar");
	});

	it("can trigger htmx events", function () {
		var div1 = make("<div id='div1' _='on htmx:foo put \"foo\" into my.innerHTML'></div>");
		var div2 = make("<div _='on click send htmx:foo to #div1'></div>");
		div2.click();
		div1.innerHTML.should.equal("foo");
	});

	it("can remove class by id", function () {
		var form = make("<form class='hideme' id='email-form'></form>");
		var div = make("<div _='on click remove .hideme from #email-form'></div>");
		form.classList.contains("hideme").should.equal(true);
		div.click();
		form.classList.contains("hideme").should.equal(false);
	});

	it("can remove by clicks elsewhere", function () {
		var div = make("<div _='on click elsewhere remove me'></div>");
		var div2 = make("<div></div>");
		div2.click();
		should.equal(div.parentNode, null);
	});

	it("me and it is properly set when responding to events", function () {
		var div2 = make("<div id='name'></div>");
		var div = make("<div _='on click from #name set window.me to me set window.it to it'></div>");
		div2.click();
		window.me.should.equal(div);
		window.it.should.equal(div2);
		delete window.me;
		delete window.it;
	});

	it("me symbol works in from expressions", function () {
		var div = make(
			"<div>" + "<div id='d1' _='on click from closest parent <div/> put \"Foo\" into me'></div>" + "</div>"
		);
		var d1 = byId("d1");
		d1.innerHTML.should.equal("");
		div.click();
		d1.innerHTML.should.equal("Foo");
	});

	it("can refer to function in init blocks", function (done) {
		var div = make(
			"<script type='text/hyperscript'>" +
			"  init " +
			"    call foo() " +
			"  end " +
			"  def foo() " +
			"    put \"here\" into #d1's innerHTML " +
			"  end</script> " +
			"<div id='d1'></div>"
		);
		var d1 = byId("d1");
		setTimeout(function(){
			d1.innerHTML.should.equal("here");
			delete foo;
			done();
		}, 10)
	});

	it("can create a paragraph tag", function () {
		var i1 = make("<input id='i1' value='foo'>");
		var d2 = make("<div id='d2'></div>");
		var div = make("<div _='on click make a <p/>  put #i1.value into its textContent put it.outerHTML at end of #d2'></div>");
		div.click()
		d2.innerHTML.should.equal("<p>foo</p>");
	});

	it("async exception", function () {
		var div = make("<div _='on click async transition opacity to 0 log \"hello!\"'></div>");
		div.click()
	});

	it("return followed by boundary returns an error", function () {
		var msg = getParseErrorFor("return end");
		startsWith(msg, "'return' commands must return a value.  If you do not wish to return a value, use 'exit' instead.");
	});

	it("string literals can dot-invoked against", function () {
		_hyperscript("'foo'.length").should.equal(3);
		_hyperscript("`foo`.length").should.equal(3);
		_hyperscript("\"foo\".length").should.equal(3);
	});

	it("button query in form", function () {
		var form = make("<form _='on click get the <button/> in me then" +
			"                                   set it @disabled to true'>" +
			"  <button id='b1'>Button</button>" +
			"</form>");
		var btn = byId("b1");
		form.click();
		b1.disabled.should.equal(true);
	});

});
