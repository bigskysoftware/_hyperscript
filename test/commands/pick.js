import {test, expect} from '../fixtures.js'

test.describe("the pick command", () => {

	// Array indexing

	test("can pick items from an array", async ({run, evaluate}) => {
		await run(`pick items 1 to 3 from arr
			set $test to it`, {locals: {arr: [10, 11, 12, 13, 14, 15, 16]}});
		const result = await evaluate(() => window.$test);
		expect(result).toEqual([11, 12]);
	});

	test("can pick a single item from an array", async ({run, evaluate}) => {
		await run(`pick item 2 from arr
			set $test to it`, {locals: {arr: [10, 11, 12, 13, 14, 15, 16]}});
		const result = await evaluate(() => window.$test);
		expect(result).toEqual([12]);
	});

	test("can use 'end' when picking items from an array", async ({run, evaluate}) => {
		await run(`pick item 4 to end from arr
			set $test to it`, {locals: {arr: [10, 11, 12, 13, 14, 15, 16]}});
		const result = await evaluate(() => window.$test);
		expect(result).toEqual([14, 15, 16]);
	});

	test("can use 'start' when picking items from an array", async ({run, evaluate}) => {
		await run(`pick items start to 3 from arr
			set $test to it`, {locals: {arr: [10, 11, 12, 13, 14, 15, 16]}});
		const result = await evaluate(() => window.$test);
		expect(result).toEqual([10, 11, 12]);
	});

	test("can use negative indices when picking items from an array", async ({run, evaluate}) => {
		await run(`pick items 0 to -4 from arr
			set $test to it`, {locals: {arr: [10, 11, 12, 13, 14, 15, 16]}});
		const result = await evaluate(() => window.$test);
		expect(result).toEqual([10, 11, 12]);
	});

	// String indexing

	test("can pick items from a string", async ({run, evaluate}) => {
		await run(`pick items 1 to 3 from str
			set $test to it`, {locals: {str: "abcdefghijklmnopqrstuvwxyz"}});
		const result = await evaluate(() => window.$test);
		expect(result).toBe("bc");
	});

	test("can pick a single item from a string", async ({run, evaluate}) => {
		await run(`pick item 2 from str
			set $test to it`, {locals: {str: "abcdefghijklmnopqrstuvwxyz"}});
		const result = await evaluate(() => window.$test);
		expect(result).toBe("c");
	});

	test("can use 'end' when picking items from a string", async ({run, evaluate}) => {
		await run(`pick item 4 to end from str
			set $test to it`, {locals: {str: "abcdefghijklmnopqrstuvwxyz"}});
		const result = await evaluate(() => window.$test);
		expect(result).toBe("efghijklmnopqrstuvwxyz");
	});

	test("can use 'start' when picking items from a string", async ({run, evaluate}) => {
		await run(`pick items start to 3 from str
			set $test to it`, {locals: {str: "abcdefghijklmnopqrstuvwxyz"}});
		const result = await evaluate(() => window.$test);
		expect(result).toBe("abc");
	});

	test("can use negative indices when picking items from a string", async ({run, evaluate}) => {
		await run(`pick items 0 to -4 from str
			set $test to it`, {locals: {str: "abcdefghijklmnopqrstuvwxyz"}});
		const result = await evaluate(() => window.$test);
		expect(result).toBe("abcdefghijklmnopqrstuv");
	});

	// Regex

	test("can pick a single regex match", async ({run, evaluate}) => {
		const haystack = "The 32 quick brown foxes jumped 12 times over the 149 lazy dogs";
		await run(String.raw`pick match of "\\d+" from haystack
			set window.test to it`, {locals: {haystack}});
		const result = await evaluate(() => [...window.test]);
		expect(result).toEqual(["32"]);
	});

	test("can pick all regex matches", async ({run, evaluate}) => {
		const haystack = "The 32 quick brown foxes jumped 12 times over the 149 lazy dogs";
		await run(String.raw`pick matches of "\\d+" from haystack
			set window.test to it`, {locals: {haystack}});
		const result = await evaluate(() => Array.from(window.test).map(m => Array.from(m)));
		expect(result).toEqual([["32"], ["12"], ["149"]]);
	});

	test("can pick a single regex match w/ a flag", async ({run, evaluate}) => {
		const haystack = "The 32 quick brown foxes jumped 12 times over the 149 lazy dogs";
		await run(String.raw`pick match of "t.e" | i from haystack
			set window.test to it`, {locals: {haystack}});
		const result = await evaluate(() => [...window.test]);
		expect(result).toEqual(["The"]);
	});

	test("does not hang on zero-length regex matches", async ({run, evaluate}) => {
		await run(String.raw`pick matches of "\\d*" from haystack
			set window.test to it`, {locals: {haystack: "a1b"}});
		const result = await evaluate(() => Array.from(window.test).map(m => m[0]));
		expect(result).toContain("1");
	});

	// Positional pick

	test("can pick first n items", async ({run, evaluate}) => {
		await run(`pick first 3 of arr
			set $test to it`, {locals: {arr: [10, 20, 30, 40, 50]}});
		const result = await evaluate(() => window.$test);
		expect(result).toEqual([10, 20, 30]);
	});

	test("can pick last n items", async ({run, evaluate}) => {
		await run(`pick last 2 of arr
			set $test to it`, {locals: {arr: [10, 20, 30, 40, 50]}});
		const result = await evaluate(() => window.$test);
		expect(result).toEqual([40, 50]);
	});

	test("can pick random item", async ({run, evaluate}) => {
		await run(`pick random of arr
			set $test to it`, {locals: {arr: [10, 20, 30]}});
		const result = await evaluate(() => window.$test);
		expect([10, 20, 30]).toContain(result);
	});

	test("can pick random n items", async ({run, evaluate}) => {
		await run(`pick random 2 of arr
			set $test to it`, {locals: {arr: [10, 20, 30, 40, 50]}});
		const result = await evaluate(() => window.$test);
		expect(result).toHaveLength(2);
	});

	// 'of' syntax for existing forms

	test("can pick items using 'of' syntax", async ({run, evaluate}) => {
		await run(`pick items 1 to 3 of arr
			set $test to it`, {locals: {arr: [10, 11, 12, 13, 14, 15, 16]}});
		const result = await evaluate(() => window.$test);
		expect(result).toEqual([11, 12]);
	});

	test("can pick match using 'of' syntax", async ({run, evaluate}) => {
		const haystack = "The 32 quick brown foxes";
		await run(String.raw`pick match of "\\d+" of haystack
			set window.test to it`, {locals: {haystack}});
		const result = await evaluate(() => [...window.test]);
		expect(result).toEqual(["32"]);
	});

	test("pick first from null returns null", async ({run}) => {
		var result = await run("set x to null then pick first 3 from x then return it");
		expect(result).toBeNull();
	});

	test("pick last from null returns null", async ({run}) => {
		var result = await run("set x to null then pick last 2 from x then return it");
		expect(result).toBeNull();
	});

	test("pick random from null returns null", async ({run}) => {
		var result = await run("set x to null then pick random from x then return it");
		expect(result).toBeNull();
	});

	test("pick match from null returns null", async ({run}) => {
		var result = await run(String.raw`set x to null then pick match of "\\d+" from x then return it`);
		expect(result).toBeNull();
	});

});
