import {test, expect} from '../fixtures.js'

test.describe("split by expression", () => {

	test("splits a string by delimiter", async ({run}) => {
		var result = await run(`return "a,b,c" split by ","`);
		expect(result).toEqual(["a", "b", "c"]);
	});

	test("splits by whitespace", async ({run}) => {
		var result = await run(`return "hello world" split by " "`);
		expect(result).toEqual(["hello", "world"]);
	});

});

test.describe("joined by expression", () => {

	test("joins an array with delimiter", async ({run}) => {
		var result = await run(`return ["a", "b", "c"] joined by ", "`);
		expect(result).toBe("a, b, c");
	});

	test("joins with empty string", async ({run}) => {
		var result = await run(`return ["x", "y", "z"] joined by ""`);
		expect(result).toBe("xyz");
	});

});

test.describe("split/join chaining", () => {

	test("split then where then joined", async ({run}) => {
		var result = await run(`return "a,,b,,c" split by "," where it is not "" joined by "-"`);
		expect(result).toBe("a-b-c");
	});

	test("split then sorted then joined", async ({run}) => {
		var result = await run(`return "banana,apple,cherry" split by "," sorted by it joined by ", "`);
		expect(result).toBe("apple, banana, cherry");
	});

	test("split then mapped then joined", async ({run}) => {
		var result = await run(`return "hello world" split by " " mapped to its length joined by ","`);
		expect(result).toBe("5,5");
	});

});
