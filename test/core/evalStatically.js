import {test, expect} from '../fixtures.js'

test.describe("evalStatically()", () => {

	test("works on number literals", async ({evaluate}) => {
		expect(await evaluate(() => _hyperscript.parse("42").evalStatically())).toBe(42);
		expect(await evaluate(() => _hyperscript.parse("3.14").evalStatically())).toBe(3.14);
	});

	test("works on boolean literals", async ({evaluate}) => {
		expect(await evaluate(() => _hyperscript.parse("true").evalStatically())).toBe(true);
		expect(await evaluate(() => _hyperscript.parse("false").evalStatically())).toBe(false);
	});

	test("works on null literal", async ({evaluate}) => {
		expect(await evaluate(() => _hyperscript.parse("null").evalStatically())).toBe(null);
	});

	test("works on plain string literals", async ({evaluate}) => {
		expect(await evaluate(() => _hyperscript.parse('"hello"').evalStatically())).toBe("hello");
		expect(await evaluate(() => _hyperscript.parse("'world'").evalStatically())).toBe("world");
	});

	test("works on time expressions", async ({evaluate}) => {
		expect(await evaluate(() => _hyperscript.parse("200ms").evalStatically())).toBe(200);
		expect(await evaluate(() => _hyperscript.parse("2s").evalStatically())).toBe(2000);
	});

	test("throws on template strings", async ({evaluate}) => {
		var msg = await evaluate(() => {
			try { _hyperscript.parse('`hello ${name}`').evalStatically(); return null; }
			catch (e) { return e.message; }
		});
		expect(msg).toMatch(/cannot be evaluated statically/);
	});

	test("throws on symbol references", async ({evaluate}) => {
		var msg = await evaluate(() => {
			try { _hyperscript.parse("x").evalStatically(); return null; }
			catch (e) { return e.message; }
		});
		expect(msg).toMatch(/cannot be evaluated statically/);
	});

	test("throws on math expressions", async ({evaluate}) => {
		var msg = await evaluate(() => {
			try { _hyperscript.parse("1 + 2").evalStatically(); return null; }
			catch (e) { return e.message; }
		});
		expect(msg).toMatch(/cannot be evaluated statically/);
	});
});
