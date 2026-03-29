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

});
