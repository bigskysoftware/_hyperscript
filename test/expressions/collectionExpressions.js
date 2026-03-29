import {test, expect} from '../fixtures.js'

test.describe("where expression", () => {

	test("filters an array by condition", async ({run}) => {
		var result = await run(`set arr to [{name: "a", active: true}, {name: "b", active: false}, {name: "c", active: true}]
			then return arr where its active`);
		expect(result.map(x => x.name)).toEqual(["a", "c"]);
	});

	test("filters with comparison", async ({run}) => {
		var result = await run(`set arr to [1, 2, 3, 4, 5]
			then return arr where it > 3`);
		expect(result).toEqual([4, 5]);
	});

	test("works with DOM elements", async ({html, find, evaluate}) => {
		await html(
			"<ul id='list'><li class='yes'>A</li><li>B</li><li class='yes'>C</li></ul>" +
			"<button _='on click set items to <li/> in #list then set matches to items where it matches .yes then put matches mapped to its textContent into #out'>Go</button>" +
			"<div id='out'></div>"
		);
		await find('button').click();
		await expect(find('#out')).toHaveText("AC");
	});

});

test.describe("sorted by expression", () => {

	test("sorts by a property", async ({run}) => {
		var result = await run(`set arr to [{name: "Charlie"}, {name: "Alice"}, {name: "Bob"}]
			then return arr sorted by its name`);
		expect(result.map(x => x.name)).toEqual(["Alice", "Bob", "Charlie"]);
	});

	test("sorts descending", async ({run}) => {
		var result = await run(`set arr to [3, 1, 2]
			then return arr sorted by it descending`);
		expect(result).toEqual([3, 2, 1]);
	});

	test("sorts numbers by a computed key", async ({run}) => {
		var result = await run(`set arr to [{name: "b", age: 30}, {name: "a", age: 20}, {name: "c", age: 25}]
			then return arr sorted by its age`);
		expect(result.map(x => x.name)).toEqual(["a", "c", "b"]);
	});

});

test.describe("mapped to expression", () => {

	test("maps to a property", async ({run}) => {
		var result = await run(`set arr to [{name: "Alice"}, {name: "Bob"}]
			then return arr mapped to its name`);
		expect(result).toEqual(["Alice", "Bob"]);
	});

	test("maps with an expression", async ({run}) => {
		var result = await run(`set arr to [1, 2, 3]
			then return arr mapped to (it * 2)`);
		expect(result).toEqual([2, 4, 6]);
	});

});

test.describe("chaining collection expressions", () => {

	test("where then mapped to", async ({run}) => {
		var result = await run(`set arr to [{name: "Alice", active: true}, {name: "Bob", active: false}, {name: "Charlie", active: true}]
			then return arr where its active mapped to its name`);
		expect(result).toEqual(["Alice", "Charlie"]);
	});

	test("sorted by then mapped to", async ({run}) => {
		var result = await run(`set arr to [{name: "Charlie", age: 30}, {name: "Alice", age: 20}]
			then return arr sorted by its age mapped to its name`);
		expect(result).toEqual(["Alice", "Charlie"]);
	});

	test("where then sorted by then mapped to", async ({run}) => {
		var result = await run(`set arr to [{name: "Charlie", active: true, age: 30}, {name: "Alice", active: false, age: 20}, {name: "Bob", active: true, age: 25}]
			then return arr where its active sorted by its age mapped to its name`);
		expect(result).toEqual(["Bob", "Charlie"]);
	});

});
