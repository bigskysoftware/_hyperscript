import {test, expect} from '../fixtures.js'

test.describe("the string expression", () => {

	test("handles strings properly", async ({run}) => {
		var result = await run('"foo"');
		expect(result).toBe("foo");

		result = await run('"fo\'o"');
		expect(result).toBe("fo'o");

		result = await run("'foo'");
		expect(result).toBe("foo");
	});

	test("string templates work properly", async ({run}) => {
		var result = await run("`$1`");
		expect(result).toBe("1");
	});

	test("string templates work w/ props", async ({run, evaluate}) => {
		await evaluate(() => window.foo = "foo");
		var result = await run("`$window.foo`");
		expect(result).toBe("foo");
	});

	test("string templates work w/ props w/ braces", async ({run, evaluate}) => {
		await evaluate(() => window.foo = "foo");
		var result = await run("`${window.foo}`");
		expect(result).toBe("foo");
	});

	test("string templates work properly w braces", async ({run}) => {
		var result = await run("`${1 + 2}`");
		expect(result).toBe("3");
	});

	test("string templates preserve white space", async ({run}) => {
		var result = await run("` ${1 + 2} ${1 + 2} `");
		expect(result).toBe(" 3 3 ");

		result = await run("`${1 + 2} ${1 + 2} `");
		expect(result).toBe("3 3 ");

		result = await run("`${1 + 2}${1 + 2} `");
		expect(result).toBe("33 ");

		result = await run("`${1 + 2} ${1 + 2}`");
		expect(result).toBe("3 3");
	});

	test("should handle strings with tags and quotes", async ({run}) => {
		var record = {
			name: "John Connor",
			age: 21,
			favouriteColour: "bleaux",
		};
		var result = await run(
			'`<div age="${record.age}" style="color:${record.favouriteColour}">${record.name}</div>`',
			{locals: {record: record}}
		);
		expect(result).toBe('<div age="21" style="color:bleaux">John Connor</div>');
	});

	test("should handle back slashes in non-template content", async ({run}) => {
		var result = await run("`https://${foo}`", {locals: {foo: 'bar'}});
		expect(result).toBe('https://bar');
	});
});
