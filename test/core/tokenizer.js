describe("the _hyperscript tokenizer", function () {
	it("handles basic token types", function () {
		var tokenizer = _hyperscript.internals.tokenizer;

		var token = tokenizer.tokenize("foo").consumeToken();
		token.type.should.equal("IDENTIFIER");

		var token = tokenizer.tokenize("1").consumeToken();
		token.type.should.equal("NUMBER");

		var tokens = tokenizer.tokenize("1.1");
		var token = tokens.consumeToken();
		token.type.should.equal("NUMBER");
		tokens.hasMore().should.equal(false);

		var tokens = tokenizer.tokenize("1e6");
		var token = tokens.consumeToken();
		token.type.should.equal("NUMBER");
		tokens.hasMore().should.equal(false);

		var tokens = tokenizer.tokenize("1e-6");
		var token = tokens.consumeToken();
		token.type.should.equal("NUMBER");
		tokens.hasMore().should.equal(false);

		var tokens = tokenizer.tokenize("1.1e6");
		var token = tokens.consumeToken();
		token.type.should.equal("NUMBER");
		tokens.hasMore().should.equal(false);

		var tokens = tokenizer.tokenize("1.1e-6");
		var token = tokens.consumeToken();
		token.type.should.equal("NUMBER");
		tokens.hasMore().should.equal(false);

		var token = tokenizer.tokenize(".a").consumeToken();
		token.type.should.equal("CLASS_REF");

		var token = tokenizer.tokenize("#a").consumeToken();
		token.type.should.equal("ID_REF");

		var token = tokenizer.tokenize('"asdf"').consumeToken();
		token.type.should.equal("STRING");
	});

	it("handles whitespace properly", function () {
		var tokenizer = _hyperscript.internals.tokenizer;
		tokenizer.tokenize("   ").list.length.should.equal(0);
		tokenizer.tokenize("  asdf").list.length.should.equal(1);
		tokenizer.tokenize("  asdf  ").list.length.should.equal(2);
		tokenizer.tokenize("asdf  ").list.length.should.equal(2);
		tokenizer.tokenize("\n").list.length.should.equal(0);
		tokenizer.tokenize("\nasdf").list.length.should.equal(1);
		tokenizer.tokenize("\nasdf\n").list.length.should.equal(2);
		tokenizer.tokenize("asdf\n").list.length.should.equal(2);
		tokenizer.tokenize("\r").list.length.should.equal(0);
		tokenizer.tokenize("\rasdf").list.length.should.equal(1);
		tokenizer.tokenize("\rasdf\r").list.length.should.equal(2);
		tokenizer.tokenize("asdf\r").list.length.should.equal(2);
		tokenizer.tokenize("\t").list.length.should.equal(0);
		tokenizer.tokenize("\tasdf").list.length.should.equal(1);
		tokenizer.tokenize("\tasdf\t").list.length.should.equal(2);
		tokenizer.tokenize("asdf\t").list.length.should.equal(2);
	});

	it("handles comments properly", function () {
		var tokenizer = _hyperscript.internals.tokenizer;
		tokenizer.tokenize("--").list.length.should.equal(0);
		tokenizer.tokenize("asdf--").list.length.should.equal(1);
		tokenizer.tokenize("-- asdf").list.length.should.equal(0);
		tokenizer.tokenize("--\nasdf").list.length.should.equal(1);
		tokenizer.tokenize("--\nasdf--").list.length.should.equal(1);
		tokenizer.tokenize("---asdf").list.length.should.equal(0);
		tokenizer.tokenize("----\n---asdf").list.length.should.equal(0);
		tokenizer.tokenize("----asdf----").list.length.should.equal(0);
		tokenizer.tokenize("---\nasdf---").list.length.should.equal(1);
		tokenizer.tokenize("// asdf").list.length.should.equal(0);
		tokenizer.tokenize("///asdf").list.length.should.equal(0);
		tokenizer.tokenize("asdf//").list.length.should.equal(1);
		tokenizer.tokenize("asdf\n//").list.length.should.equal(2);
		tokenizer.tokenize("/**/asdf").list.length.should.equal(1);
		tokenizer.tokenize("/* asdf */").list.length.should.equal(0);
		tokenizer.tokenize("/**asdf**/").list.length.should.equal(0);
		tokenizer.tokenize("/*\nasdf\n*/").list.length.should.equal(0);
		tokenizer.tokenize("asdf/*\n*/").list.length.should.equal(1);
	});

	it("handles class identifiers properly", function () {
		var tokenizer = _hyperscript.internals.tokenizer;

		var token = tokenizer.tokenize(".a").consumeToken();
		token.type.should.equal("CLASS_REF");
		token.value.should.equal(".a");

		var token = tokenizer.tokenize("  .a").consumeToken();
		token.type.should.equal("CLASS_REF");
		token.value.should.equal(".a");

		var token = tokenizer.tokenize("a.a").consumeToken();
		token.type.should.equal("IDENTIFIER");
		token.value.should.equal("a");

		var token = tokenizer.tokenize("(a).a").list[4];
		token.type.should.equal("IDENTIFIER");
		token.value.should.equal("a");

		var token = tokenizer.tokenize("{a}.a").list[4];
		token.type.should.equal("IDENTIFIER");
		token.value.should.equal("a");

		var token = tokenizer.tokenize("[a].a").list[4];
		token.type.should.equal("IDENTIFIER");
		token.value.should.equal("a");

		var token = tokenizer.tokenize("(a(.a").list[3];
		token.type.should.equal("CLASS_REF");
		token.value.should.equal(".a");

		var token = tokenizer.tokenize("{a{.a").list[3];
		token.type.should.equal("CLASS_REF");
		token.value.should.equal(".a");

		var token = tokenizer.tokenize("[a[.a").list[3];
		token.type.should.equal("CLASS_REF");
		token.value.should.equal(".a");
	});

	it("handles id references properly", function () {
		var tokenizer = _hyperscript.internals.tokenizer;

		var token = tokenizer.tokenize("#a").consumeToken();
		token.type.should.equal("ID_REF");
		token.value.should.equal("#a");

		var token = tokenizer.tokenize("  #a").consumeToken();
		token.type.should.equal("ID_REF");
		token.value.should.equal("#a");

		var token = tokenizer.tokenize("a#a").consumeToken();
		token.type.should.equal("IDENTIFIER");
		token.value.should.equal("a");

		var token = tokenizer.tokenize("(a)#a").list[4];
		token.type.should.equal("IDENTIFIER");
		token.value.should.equal("a");

		var token = tokenizer.tokenize("{a}#a").list[4];
		token.type.should.equal("IDENTIFIER");
		token.value.should.equal("a");

		var token = tokenizer.tokenize("[a]#a").list[4];
		token.type.should.equal("IDENTIFIER");
		token.value.should.equal("a");

		var token = tokenizer.tokenize("(a(#a").list[3];
		token.type.should.equal("ID_REF");
		token.value.should.equal("#a");

		var token = tokenizer.tokenize("{a{#a").list[3];
		token.type.should.equal("ID_REF");
		token.value.should.equal("#a");

		var token = tokenizer.tokenize("[a[#a").list[3];
		token.type.should.equal("ID_REF");
		token.value.should.equal("#a");
	});

	it("handles identifiers properly", function () {
		var tokenizer = _hyperscript.internals.tokenizer;

		var token = tokenizer.tokenize("foo").consumeToken();
		token.type.should.equal("IDENTIFIER");
		token.value.should.equal("foo");

		var token = tokenizer.tokenize("     foo    ").consumeToken();
		token.type.should.equal("IDENTIFIER");
		token.value.should.equal("foo");

		var tokens = tokenizer.tokenize("     foo    bar");
		var token = tokens.consumeToken();
		token.type.should.equal("IDENTIFIER");
		token.value.should.equal("foo");

		var token = tokens.consumeToken();
		token.type.should.equal("IDENTIFIER");
		token.value.should.equal("bar");

		var tokens = tokenizer.tokenize("     foo\n-- a comment\n    bar");
		var token = tokens.consumeToken();
		token.type.should.equal("IDENTIFIER");
		token.value.should.equal("foo");

		var token = tokens.consumeToken();
		token.type.should.equal("IDENTIFIER");
		token.value.should.equal("bar");
	});

	it("handles identifiers with numbers properly", function () {
		var tokenizer = _hyperscript.internals.tokenizer;

		var token = tokenizer.tokenize("f1oo").consumeToken();
		token.type.should.equal("IDENTIFIER");
		token.value.should.equal("f1oo");

		var token = tokenizer.tokenize("fo1o").consumeToken();
		token.type.should.equal("IDENTIFIER");
		token.value.should.equal("fo1o");

		var token = tokenizer.tokenize("foo1").consumeToken();
		token.type.should.equal("IDENTIFIER");
		token.value.should.equal("foo1");

	});

	it("handles numbers properly", function () {
		var tokenizer = _hyperscript.internals.tokenizer;

		var token = tokenizer.tokenize("1").consumeToken();
		token.type.should.equal("NUMBER");
		token.value.should.equal("1");

		var token = tokenizer.tokenize("1.1").consumeToken();
		token.type.should.equal("NUMBER");
		token.value.should.equal("1.1");

		var token = tokenizer.tokenize("1234567890.1234567890").consumeToken();
		token.type.should.equal("NUMBER");
		token.value.should.equal("1234567890.1234567890");

		var token = tokenizer.tokenize("1e6").consumeToken();
		token.type.should.equal("NUMBER");
		token.value.should.equal("1e6");

		var token = tokenizer.tokenize("1e-6").consumeToken();
		token.type.should.equal("NUMBER");
		token.value.should.equal("1e-6");

		var token = tokenizer.tokenize("1.1e6").consumeToken();
		token.type.should.equal("NUMBER");
		token.value.should.equal("1.1e6");

		var token = tokenizer.tokenize("1.1e-6").consumeToken();
		token.type.should.equal("NUMBER");
		token.value.should.equal("1.1e-6");

		var tokens = tokenizer.tokenize("1.1.1").list;
		tokens[0].type.should.equal("NUMBER");
		tokens[1].type.should.equal("PERIOD");
		tokens[2].type.should.equal("NUMBER");
		tokens.length.should.equal(3);
	});

	it("handles strings properly", function () {
		var tokenizer = _hyperscript.internals.tokenizer;
		var token = tokenizer.tokenize('"foo"').consumeToken();
		token.type.should.equal("STRING");
		token.value.should.equal("foo");

		var tokenizer = _hyperscript.internals.tokenizer;
		var token = tokenizer.tokenize('"fo\'o"').consumeToken();
		token.type.should.equal("STRING");
		token.value.should.equal("fo'o");

		var tokenizer = _hyperscript.internals.tokenizer;
		var token = tokenizer.tokenize('"fo\\"o"').consumeToken();
		token.type.should.equal("STRING");
		token.value.should.equal('fo"o');

		var tokenizer = _hyperscript.internals.tokenizer;
		var token = tokenizer.tokenize("'foo'").consumeToken();
		token.type.should.equal("STRING");
		token.value.should.equal("foo");

		var tokenizer = _hyperscript.internals.tokenizer;
		var token = tokenizer.tokenize("'fo\"o'").consumeToken();
		token.type.should.equal("STRING");
		token.value.should.equal('fo"o');

		var tokenizer = _hyperscript.internals.tokenizer;
		var token = tokenizer.tokenize("'fo\\'o'").consumeToken();
		token.type.should.equal("STRING");
		token.value.should.equal("fo'o");

		try {
			tokenizer.tokenize("'").consumeToken();
		} catch (e) {
			e.message.indexOf("Unterminated string").should.equal(0);
		}

		try {
			tokenizer.tokenize('"').consumeToken();
		} catch (e) {
			e.message.indexOf("Unterminated string").should.equal(0);
		}
	});

	it("handles all special escapes properly", function () {
		var tokenizer = _hyperscript.internals.tokenizer;
		var token = tokenizer.tokenize('"\\b"').consumeToken();
		token.value.should.equal("\b");

		token = tokenizer.tokenize('"\\f"').consumeToken();
		token.value.should.equal("\f");

		token = tokenizer.tokenize('"\\n"').consumeToken();
		token.value.should.equal("\n");

		token = tokenizer.tokenize('"\\r"').consumeToken();
		token.value.should.equal("\r");

		token = tokenizer.tokenize('"\\t"').consumeToken();
		token.value.should.equal("\t");

		token = tokenizer.tokenize('"\\v"').consumeToken();
		token.value.should.equal("\v");
	});

	it("handles hex escapes properly", function () {
		var tokenizer = _hyperscript.internals.tokenizer;
		var token = tokenizer.tokenize('"\\x1f"').consumeToken();
		token.value.should.equal("\x1f");

		token = tokenizer.tokenize('"\\x41"').consumeToken();
		token.value.should.equal("A");

		token = tokenizer.tokenize('"\\x41\\x61"').consumeToken();
		token.value.should.equal("Aa");

		try {
			tokenizer.tokenize('"\\x"').consumeToken();
		} catch (e) {
			e.message.indexOf("Invalid hexadecimal escape").should.equal(0);
		}

		try {
			tokenizer.tokenize('"\\xGG"').consumeToken();
		} catch (e) {
			e.message.indexOf("Invalid hexadecimal escape").should.equal(0);
		}

		try {
			tokenizer.tokenize('"\\1H"').consumeToken();
		} catch (e) {
			e.message.indexOf("Invalid hexadecimal escape").should.equal(0);
		}

		try {
			tokenizer.tokenize('"\\x4"').consumeToken();
		} catch (e) {
			e.message.indexOf("Invalid hexadecimal escape").should.equal(0);
		}
	});

	it("handles strings properly 2", function () {
		var tokenizer = _hyperscript.internals.tokenizer;
		var token = tokenizer.tokenize("'foo'").consumeToken();
		token.type.should.equal("STRING");
		token.value.should.equal("foo");
	});

	it("handles operators properly", function () {
		var tokenizer = _hyperscript.internals.tokenizer;

		var optable = {
			"+": "PLUS",
			"-": "MINUS",
			"*": "MULTIPLY",
			".": "PERIOD",
			"\\": "BACKSLASH",
			":": "COLON",
			"%": "PERCENT",
			"|": "PIPE",
			"!": "EXCLAMATION",
			"?": "QUESTION",
			"#": "POUND",
			"&": "AMPERSAND",
			";": "SEMI",
			",": "COMMA",
			"(": "L_PAREN",
			")": "R_PAREN",
			"<": "L_ANG",
			">": "R_ANG",
			"{": "L_BRACE",
			"}": "R_BRACE",
			"[": "L_BRACKET",
			"]": "R_BRACKET",
			"=": "EQUALS",
			"<=": "LTE_ANG",
			">=": "GTE_ANG",
			"==": "EQ",
			"===": "EQQ",
		};

		Object.keys(optable).forEach(function (key) {
			var consumeToken = tokenizer.tokenize(key).consumeToken();
			consumeToken.op.should.equal(true);
			consumeToken.value.should.equal(key);
		});
	});

	it("handles look ahead property", function () {
		var tokenizer = _hyperscript.internals.tokenizer;
		var tokenize = tokenizer.tokenize("a 1 + 1");
		tokenize.token(0).value.should.equal("a");
		tokenize.token(1).value.should.equal("1");
		tokenize.token(2).value.should.equal("+");
		tokenize.token(3).value.should.equal("1");
		tokenize.token(4).value.should.equal("<<<EOF>>>");
	});

	it("handles template bootstrap properly", function () {
		var tokenizer = _hyperscript.internals.tokenizer;
		var tokenize = tokenizer.tokenize('"', true);
		tokenize.token(0).value.should.equal('"');

		var tokenize = tokenizer.tokenize('"$', true);
		tokenize.token(0).value.should.equal('"');
		tokenize.token(1).value.should.equal("$");

		var tokenize = tokenizer.tokenize('"${', true);
		tokenize.token(0).value.should.equal('"');
		tokenize.token(1).value.should.equal("$");
		tokenize.token(2).value.should.equal("{");

		var tokenize = tokenizer.tokenize('"${"asdf"', true);
		tokenize.token(0).value.should.equal('"');
		tokenize.token(1).value.should.equal("$");
		tokenize.token(2).value.should.equal("{");
		tokenize.token(3).value.should.equal("asdf");

		var tokenize = tokenizer.tokenize('"${"asdf"}"', true);
		tokenize.token(0).value.should.equal('"');
		tokenize.token(1).value.should.equal("$");
		tokenize.token(2).value.should.equal("{");
		tokenize.token(3).value.should.equal("asdf");
		tokenize.token(4).value.should.equal("}");
		tokenize.token(5).value.should.equal('"');
	});

	it("handles $ in template properly", function () {
		var tokenizer = _hyperscript.internals.tokenizer;
		var tokenize = tokenizer.tokenize('"', true);
		tokenize.token(0).value.should.equal('"');
	});

	it("string interpolation isnt surprising", function () {
		clearWorkArea();
		var div = make( '<div _="on click set x to 42 then put `test\\${x} test ${x} test\\$x test $x test \\$x test \\${x} test$x test_$x test_${x} test-$x test.$x` into my.innerHTML"></div>');
		div.click();
		div.innerHTML.should.equal("test${x} test 42 test$x test 42 test $x test ${x} test42 test_42 test_42 test-42 test.42");
		clearWorkArea();
	});

});
