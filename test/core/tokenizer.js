import {test, expect} from '../fixtures.js'

test.describe("the _hyperscript tokenizer", () => {

	test("handles basic token types", async ({evaluate}) => {
		const results = await evaluate(() => {
			const tokenizer = _hyperscript.internals.tokenizer;
			const r = {};

			r.fooType = tokenizer.tokenize("foo").consumeToken().type;
			r.numType = tokenizer.tokenize("1").consumeToken().type;

			let tokens = tokenizer.tokenize("1.1");
			r.floatType = tokens.consumeToken().type;
			r.floatHasMore = tokens.hasMore();

			tokens = tokenizer.tokenize("1e6");
			r.sciType = tokens.consumeToken().type;
			r.sciHasMore = tokens.hasMore();

			tokens = tokenizer.tokenize("1e-6");
			r.sciNegType = tokens.consumeToken().type;
			r.sciNegHasMore = tokens.hasMore();

			tokens = tokenizer.tokenize("1.1e6");
			r.floatSciType = tokens.consumeToken().type;
			r.floatSciHasMore = tokens.hasMore();

			tokens = tokenizer.tokenize("1.1e-6");
			r.floatSciNegType = tokens.consumeToken().type;
			r.floatSciNegHasMore = tokens.hasMore();

			r.classType = tokenizer.tokenize(".a").consumeToken().type;
			r.idType = tokenizer.tokenize("#a").consumeToken().type;
			r.stringType = tokenizer.tokenize('"asdf"').consumeToken().type;

			return r;
		});

		expect(results.fooType).toBe("IDENTIFIER");
		expect(results.numType).toBe("NUMBER");
		expect(results.floatType).toBe("NUMBER");
		expect(results.floatHasMore).toBe(false);
		expect(results.sciType).toBe("NUMBER");
		expect(results.sciHasMore).toBe(false);
		expect(results.sciNegType).toBe("NUMBER");
		expect(results.sciNegHasMore).toBe(false);
		expect(results.floatSciType).toBe("NUMBER");
		expect(results.floatSciHasMore).toBe(false);
		expect(results.floatSciNegType).toBe("NUMBER");
		expect(results.floatSciNegHasMore).toBe(false);
		expect(results.classType).toBe("CLASS_REF");
		expect(results.idType).toBe("ID_REF");
		expect(results.stringType).toBe("STRING");
	});

	test("handles whitespace properly", async ({evaluate}) => {
		const results = await evaluate(() => {
			const t = _hyperscript.internals.tokenizer;
			return [
				t.tokenize("   ").list.length,
				t.tokenize("  asdf").list.length,
				t.tokenize("  asdf  ").list.length,
				t.tokenize("asdf  ").list.length,
				t.tokenize("\n").list.length,
				t.tokenize("\nasdf").list.length,
				t.tokenize("\nasdf\n").list.length,
				t.tokenize("asdf\n").list.length,
				t.tokenize("\r").list.length,
				t.tokenize("\rasdf").list.length,
				t.tokenize("\rasdf\r").list.length,
				t.tokenize("asdf\r").list.length,
				t.tokenize("\t").list.length,
				t.tokenize("\tasdf").list.length,
				t.tokenize("\tasdf\t").list.length,
				t.tokenize("asdf\t").list.length,
			];
		});
		expect(results).toEqual([0, 1, 2, 2, 0, 1, 2, 2, 0, 1, 2, 2, 0, 1, 2, 2]);
	});

	test("handles comments properly", async ({evaluate}) => {
		const results = await evaluate(() => {
			const t = _hyperscript.internals.tokenizer;
			return [
				t.tokenize("--").list.length,
				t.tokenize("asdf--").list.length,
				t.tokenize("-- asdf").list.length,
				t.tokenize("--\nasdf").list.length,
				t.tokenize("--\nasdf--").list.length,
				t.tokenize("---asdf").list.length,
				t.tokenize("----\n---asdf").list.length,
				t.tokenize("----asdf----").list.length,
				t.tokenize("---\nasdf---").list.length,
				t.tokenize("// asdf").list.length,
				t.tokenize("///asdf").list.length,
				t.tokenize("asdf//").list.length,
				t.tokenize("asdf\n//").list.length,
				t.tokenize("/**/asdf").list.length,
				t.tokenize("/* asdf */").list.length,
				t.tokenize("/**asdf**/").list.length,
				t.tokenize("/*\nasdf\n*/").list.length,
				t.tokenize("asdf/*\n*/").list.length,
			];
		});
		expect(results).toEqual([0, 1, 0, 1, 1, 0, 0, 0, 1, 0, 0, 1, 2, 1, 0, 0, 0, 1]);
	});

	test("handles class identifiers properly", async ({evaluate}) => {
		const results = await evaluate(() => {
			const t = _hyperscript.internals.tokenizer;
			return [
				{type: t.tokenize(".a").consumeToken().type, value: t.tokenize(".a").consumeToken().value},
				{type: t.tokenize("  .a").consumeToken().type, value: t.tokenize("  .a").consumeToken().value},
				{type: t.tokenize("a.a").consumeToken().type, value: t.tokenize("a.a").consumeToken().value},
				{type: t.tokenize("(a).a").list[4].type, value: t.tokenize("(a).a").list[4].value},
				{type: t.tokenize("{a}.a").list[4].type, value: t.tokenize("{a}.a").list[4].value},
				{type: t.tokenize("[a].a").list[4].type, value: t.tokenize("[a].a").list[4].value},
				{type: t.tokenize("(a(.a").list[3].type, value: t.tokenize("(a(.a").list[3].value},
				{type: t.tokenize("{a{.a").list[3].type, value: t.tokenize("{a{.a").list[3].value},
				{type: t.tokenize("[a[.a").list[3].type, value: t.tokenize("[a[.a").list[3].value},
			];
		});
		expect(results[0]).toEqual({type: "CLASS_REF", value: ".a"});
		expect(results[1]).toEqual({type: "CLASS_REF", value: ".a"});
		expect(results[2]).toEqual({type: "IDENTIFIER", value: "a"});
		expect(results[3]).toEqual({type: "IDENTIFIER", value: "a"});
		expect(results[4]).toEqual({type: "IDENTIFIER", value: "a"});
		expect(results[5]).toEqual({type: "IDENTIFIER", value: "a"});
		expect(results[6]).toEqual({type: "CLASS_REF", value: ".a"});
		expect(results[7]).toEqual({type: "CLASS_REF", value: ".a"});
		expect(results[8]).toEqual({type: "CLASS_REF", value: ".a"});
	});

	test("handles id references properly", async ({evaluate}) => {
		const results = await evaluate(() => {
			const t = _hyperscript.internals.tokenizer;
			return [
				{type: t.tokenize("#a").consumeToken().type, value: t.tokenize("#a").consumeToken().value},
				{type: t.tokenize("  #a").consumeToken().type, value: t.tokenize("  #a").consumeToken().value},
				{type: t.tokenize("a#a").consumeToken().type, value: t.tokenize("a#a").consumeToken().value},
				{type: t.tokenize("(a)#a").list[4].type, value: t.tokenize("(a)#a").list[4].value},
				{type: t.tokenize("{a}#a").list[4].type, value: t.tokenize("{a}#a").list[4].value},
				{type: t.tokenize("[a]#a").list[4].type, value: t.tokenize("[a]#a").list[4].value},
				{type: t.tokenize("(a(#a").list[3].type, value: t.tokenize("(a(#a").list[3].value},
				{type: t.tokenize("{a{#a").list[3].type, value: t.tokenize("{a{#a").list[3].value},
				{type: t.tokenize("[a[#a").list[3].type, value: t.tokenize("[a[#a").list[3].value},
			];
		});
		expect(results[0]).toEqual({type: "ID_REF", value: "#a"});
		expect(results[1]).toEqual({type: "ID_REF", value: "#a"});
		expect(results[2]).toEqual({type: "IDENTIFIER", value: "a"});
		expect(results[3]).toEqual({type: "IDENTIFIER", value: "a"});
		expect(results[4]).toEqual({type: "IDENTIFIER", value: "a"});
		expect(results[5]).toEqual({type: "IDENTIFIER", value: "a"});
		expect(results[6]).toEqual({type: "ID_REF", value: "#a"});
		expect(results[7]).toEqual({type: "ID_REF", value: "#a"});
		expect(results[8]).toEqual({type: "ID_REF", value: "#a"});
	});

	test("handles identifiers properly", async ({evaluate}) => {
		const results = await evaluate(() => {
			const t = _hyperscript.internals.tokenizer;
			const r = {};

			let token = t.tokenize("foo").consumeToken();
			r.foo = {type: token.type, value: token.value};

			token = t.tokenize("     foo    ").consumeToken();
			r.fooSpaces = {type: token.type, value: token.value};

			let tokens = t.tokenize("     foo    bar");
			token = tokens.consumeToken();
			r.fooFirst = {type: token.type, value: token.value};
			token = tokens.consumeToken();
			r.barSecond = {type: token.type, value: token.value};

			tokens = t.tokenize("     foo\n-- a comment\n    bar");
			token = tokens.consumeToken();
			r.fooComment = {type: token.type, value: token.value};
			token = tokens.consumeToken();
			r.barComment = {type: token.type, value: token.value};

			return r;
		});

		expect(results.foo).toEqual({type: "IDENTIFIER", value: "foo"});
		expect(results.fooSpaces).toEqual({type: "IDENTIFIER", value: "foo"});
		expect(results.fooFirst).toEqual({type: "IDENTIFIER", value: "foo"});
		expect(results.barSecond).toEqual({type: "IDENTIFIER", value: "bar"});
		expect(results.fooComment).toEqual({type: "IDENTIFIER", value: "foo"});
		expect(results.barComment).toEqual({type: "IDENTIFIER", value: "bar"});
	});

	test("handles identifiers with numbers properly", async ({evaluate}) => {
		const results = await evaluate(() => {
			const t = _hyperscript.internals.tokenizer;
			return [
				{type: t.tokenize("f1oo").consumeToken().type, value: t.tokenize("f1oo").consumeToken().value},
				{type: t.tokenize("fo1o").consumeToken().type, value: t.tokenize("fo1o").consumeToken().value},
				{type: t.tokenize("foo1").consumeToken().type, value: t.tokenize("foo1").consumeToken().value},
			];
		});
		expect(results[0]).toEqual({type: "IDENTIFIER", value: "f1oo"});
		expect(results[1]).toEqual({type: "IDENTIFIER", value: "fo1o"});
		expect(results[2]).toEqual({type: "IDENTIFIER", value: "foo1"});
	});

	test("handles numbers properly", async ({evaluate}) => {
		const results = await evaluate(() => {
			const t = _hyperscript.internals.tokenizer;
			const r = [];
			r.push({type: t.tokenize("1").consumeToken().type, value: t.tokenize("1").consumeToken().value});
			r.push({type: t.tokenize("1.1").consumeToken().type, value: t.tokenize("1.1").consumeToken().value});
			r.push({type: t.tokenize("1234567890.1234567890").consumeToken().type, value: t.tokenize("1234567890.1234567890").consumeToken().value});
			r.push({type: t.tokenize("1e6").consumeToken().type, value: t.tokenize("1e6").consumeToken().value});
			r.push({type: t.tokenize("1e-6").consumeToken().type, value: t.tokenize("1e-6").consumeToken().value});
			r.push({type: t.tokenize("1.1e6").consumeToken().type, value: t.tokenize("1.1e6").consumeToken().value});
			r.push({type: t.tokenize("1.1e-6").consumeToken().type, value: t.tokenize("1.1e-6").consumeToken().value});

			const tokens = t.tokenize("1.1.1").list;
			r.push({t0: tokens[0].type, t1: tokens[1].type, t2: tokens[2].type, len: tokens.length});

			return r;
		});
		expect(results[0]).toEqual({type: "NUMBER", value: "1"});
		expect(results[1]).toEqual({type: "NUMBER", value: "1.1"});
		expect(results[2]).toEqual({type: "NUMBER", value: "1234567890.1234567890"});
		expect(results[3]).toEqual({type: "NUMBER", value: "1e6"});
		expect(results[4]).toEqual({type: "NUMBER", value: "1e-6"});
		expect(results[5]).toEqual({type: "NUMBER", value: "1.1e6"});
		expect(results[6]).toEqual({type: "NUMBER", value: "1.1e-6"});
		expect(results[7]).toEqual({t0: "NUMBER", t1: "PERIOD", t2: "NUMBER", len: 3});
	});

	test("handles strings properly", async ({evaluate}) => {
		const results = await evaluate(() => {
			const t = _hyperscript.internals.tokenizer;
			const r = [];
			r.push({type: t.tokenize('"foo"').consumeToken().type, value: t.tokenize('"foo"').consumeToken().value});
			r.push({type: t.tokenize('"fo\'o"').consumeToken().type, value: t.tokenize('"fo\'o"').consumeToken().value});
			r.push({type: t.tokenize('"fo\\"o"').consumeToken().type, value: t.tokenize('"fo\\"o"').consumeToken().value});
			r.push({type: t.tokenize("'foo'").consumeToken().type, value: t.tokenize("'foo'").consumeToken().value});
			r.push({type: t.tokenize("'fo\"o'").consumeToken().type, value: t.tokenize("'fo\"o'").consumeToken().value});
			r.push({type: t.tokenize("'fo\\'o'").consumeToken().type, value: t.tokenize("'fo\\'o'").consumeToken().value});

			let unterminatedSingle = null;
			try { t.tokenize("'").consumeToken(); } catch (e) { unterminatedSingle = e.message; }
			r.push(unterminatedSingle);

			let unterminatedDouble = null;
			try { t.tokenize('"').consumeToken(); } catch (e) { unterminatedDouble = e.message; }
			r.push(unterminatedDouble);

			return r;
		});
		expect(results[0]).toEqual({type: "STRING", value: "foo"});
		expect(results[1]).toEqual({type: "STRING", value: "fo'o"});
		expect(results[2]).toEqual({type: "STRING", value: 'fo"o'});
		expect(results[3]).toEqual({type: "STRING", value: "foo"});
		expect(results[4]).toEqual({type: "STRING", value: 'fo"o'});
		expect(results[5]).toEqual({type: "STRING", value: "fo'o"});
		expect(results[6]).toMatch(/Unterminated string/);
		expect(results[7]).toMatch(/Unterminated string/);
	});

	test("handles all special escapes properly", async ({evaluate}) => {
		const results = await evaluate(() => {
			const t = _hyperscript.internals.tokenizer;
			return [
				t.tokenize('"\\b"').consumeToken().value,
				t.tokenize('"\\f"').consumeToken().value,
				t.tokenize('"\\n"').consumeToken().value,
				t.tokenize('"\\r"').consumeToken().value,
				t.tokenize('"\\t"').consumeToken().value,
				t.tokenize('"\\v"').consumeToken().value,
			];
		});
		expect(results[0]).toBe("\b");
		expect(results[1]).toBe("\f");
		expect(results[2]).toBe("\n");
		expect(results[3]).toBe("\r");
		expect(results[4]).toBe("\t");
		expect(results[5]).toBe("\v");
	});

	test("handles hex escapes properly", async ({evaluate}) => {
		const results = await evaluate(() => {
			const t = _hyperscript.internals.tokenizer;
			const r = [];
			r.push(t.tokenize('"\\x1f"').consumeToken().value);
			r.push(t.tokenize('"\\x41"').consumeToken().value);
			r.push(t.tokenize('"\\x41\\x61"').consumeToken().value);

			const errors = [];
			try { t.tokenize('"\\x"').consumeToken(); } catch (e) { errors.push(e.message); }
			try { t.tokenize('"\\xGG"').consumeToken(); } catch (e) { errors.push(e.message); }
			try { t.tokenize('"\\1H"').consumeToken(); } catch (e) { errors.push(e.message); }
			try { t.tokenize('"\\x4"').consumeToken(); } catch (e) { errors.push(e.message); }

			return {values: r, errors: errors};
		});
		expect(results.values[0]).toBe("\x1f");
		expect(results.values[1]).toBe("A");
		expect(results.values[2]).toBe("Aa");
		for (const msg of results.errors) {
			expect(msg).toMatch(/Invalid hexadecimal escape/);
		}
	});

	test("handles strings properly 2", async ({evaluate}) => {
		const result = await evaluate(() => {
			const t = _hyperscript.internals.tokenizer;
			const token = t.tokenize("'foo'").consumeToken();
			return {type: token.type, value: token.value};
		});
		expect(result).toEqual({type: "STRING", value: "foo"});
	});

	test("handles operators properly", async ({evaluate}) => {
		const results = await evaluate(() => {
			const t = _hyperscript.internals.tokenizer;
			const optable = {
				"+": "PLUS", "-": "MINUS", "*": "MULTIPLY", ".": "PERIOD",
				"\\": "BACKSLASH", ":": "COLON", "%": "PERCENT", "|": "PIPE",
				"!": "EXCLAMATION", "?": "QUESTION", "#": "POUND", "&": "AMPERSAND",
				";": "SEMI", ",": "COMMA", "(": "L_PAREN", ")": "R_PAREN",
				"<": "L_ANG", ">": "R_ANG", "{": "L_BRACE", "}": "R_BRACE",
				"[": "L_BRACKET", "]": "R_BRACKET", "=": "EQUALS",
				"<=": "LTE_ANG", ">=": "GTE_ANG", "==": "EQ", "===": "EQQ",
			};
			const r = [];
			Object.keys(optable).forEach(key => {
				const token = t.tokenize(key).consumeToken();
				r.push({key: key, op: token.op, value: token.value});
			});
			return r;
		});
		for (const item of results) {
			expect(item.op).toBe(true);
			expect(item.value).toBe(item.key);
		}
	});

	test("handles look ahead property", async ({evaluate}) => {
		const results = await evaluate(() => {
			const t = _hyperscript.internals.tokenizer;
			const tokenize = t.tokenize("a 1 + 1");
			return [
				tokenize.token(0).value,
				tokenize.token(1).value,
				tokenize.token(2).value,
				tokenize.token(3).value,
				tokenize.token(4).value,
			];
		});
		expect(results).toEqual(["a", "1", "+", "1", "<<<EOF>>>"]);
	});

	test("handles template bootstrap properly", async ({evaluate}) => {
		const results = await evaluate(() => {
			const t = _hyperscript.internals.tokenizer;
			const r = [];

			r.push(t.tokenize('"', true).token(0).value);

			let tok = t.tokenize('"$', true);
			r.push([tok.token(0).value, tok.token(1).value]);

			tok = t.tokenize('"${', true);
			r.push([tok.token(0).value, tok.token(1).value, tok.token(2).value]);

			tok = t.tokenize('"${"asdf"', true);
			r.push([tok.token(0).value, tok.token(1).value, tok.token(2).value, tok.token(3).value]);

			tok = t.tokenize('"${"asdf"}"', true);
			r.push([tok.token(0).value, tok.token(1).value, tok.token(2).value, tok.token(3).value, tok.token(4).value, tok.token(5).value]);

			return r;
		});
		expect(results[0]).toBe('"');
		expect(results[1]).toEqual(['"', '$']);
		expect(results[2]).toEqual(['"', '$', '{']);
		expect(results[3]).toEqual(['"', '$', '{', 'asdf']);
		expect(results[4]).toEqual(['"', '$', '{', 'asdf', '}', '"']);
	});

	test("handles $ in template properly", async ({evaluate}) => {
		const result = await evaluate(() => {
			const t = _hyperscript.internals.tokenizer;
			return t.tokenize('"', true).token(0).value;
		});
		expect(result).toBe('"');
	});

	test("string interpolation isnt surprising", async ({html, find}) => {
		await html('<div _="on click set x to 42 then put `test\\${x} test ${x} test\\$x test $x test \\$x test \\${x} test$x test_$x test_${x} test-$x test.$x` into my.innerHTML"></div>');
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveText("test${x} test 42 test$x test 42 test $x test ${x} test42 test_42 test_42 test-42 test.42");
	});

});
