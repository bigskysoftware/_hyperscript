import {test, expect} from '../fixtures.js'

test.describe("the make command", () => {

	test("can make objects", async ({run, evaluate}) => {
		await run(`make a WeakMap then set window.obj to it`);
		const isWeakMap = await evaluate(() => window.obj instanceof WeakMap);
		expect(isWeakMap).toBe(true);
	});

	test("can make named objects", async ({run, evaluate}) => {
		await run(`make a WeakMap called wm then set window.obj to wm`);
		const isWeakMap = await evaluate(() => window.obj instanceof WeakMap);
		expect(isWeakMap).toBe(true);
	});

	test("can make named objects w/ global scope", async ({run, evaluate}) => {
		await run(`make a WeakMap called $wm`);
		const isWeakMap = await evaluate(() => window['$wm'] instanceof WeakMap);
		expect(isWeakMap).toBe(true);
	});

	test("can make objects with arguments", async ({run, evaluate}) => {
		await run(`make a URL from "/playground/", "https://hyperscript.org/"
			set window.obj to it`);
		const isURL = await evaluate(() => window.obj instanceof URL);
		expect(isURL).toBe(true);
		const href = await evaluate(() => window.obj.href);
		expect(href).toBe("https://hyperscript.org/playground/");
	});

	test("can make named objects with arguments", async ({run, evaluate}) => {
		await run(`make a URL from "/playground/", "https://hyperscript.org/" called u
			set window.obj to u`);
		const isURL = await evaluate(() => window.obj instanceof URL);
		expect(isURL).toBe(true);
		const href = await evaluate(() => window.obj.href);
		expect(href).toBe("https://hyperscript.org/playground/");
	});

	test("can make elements", async ({run, evaluate}) => {
		await run(`make a <p/> set window.obj to it`);
		const tagName = await evaluate(() => window.obj.tagName);
		expect(tagName).toBe("P");
	});

	test("can make elements with id and classes", async ({run, evaluate}) => {
		await run(`make a <p.a#id.b.c/> set window.obj to it`);
		const tagName = await evaluate(() => window.obj.tagName);
		expect(tagName).toBe("P");
		const id = await evaluate(() => window.obj.id);
		expect(id).toBe("id");
		const hasA = await evaluate(() => window.obj.classList.contains("a"));
		expect(hasA).toBe(true);
		const hasB = await evaluate(() => window.obj.classList.contains("b"));
		expect(hasB).toBe(true);
		const hasC = await evaluate(() => window.obj.classList.contains("c"));
		expect(hasC).toBe(true);
	});

	test("creates a div by default", async ({run, evaluate}) => {
		await run(`make a <.a/> set window.obj to it`);
		const tagName = await evaluate(() => window.obj.tagName);
		expect(tagName).toBe("DIV");
		const hasA = await evaluate(() => window.obj.classList.contains("a"));
		expect(hasA).toBe(true);
	});
});
