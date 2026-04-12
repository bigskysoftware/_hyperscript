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

test.describe("null safety", () => {

	test("where on null returns null", async ({run}) => {
		var result = await run(`set x to null then return x where it > 1`);
		expect(result).toBeNull();
	});

	test("sorted by on null returns null", async ({run}) => {
		var result = await run(`set x to null then return x sorted by it`);
		expect(result).toBeNull();
	});

	test("mapped to on null returns null", async ({run}) => {
		var result = await run(`set x to null then return x mapped to (it * 2)`);
		expect(result).toBeNull();
	});

	test("split by on null returns null", async ({run}) => {
		var result = await run(`set x to null then return x split by ','\n`);
		expect(result).toBeNull();
	});

	test("joined by on null returns null", async ({run}) => {
		var result = await run(`set x to null then return x joined by ','`);
		expect(result).toBeNull();
	});

	test("where on undefined returns undefined", async ({run}) => {
		var result = await run(`return doesNotExist where it > 1`);
		expect(result).toBeUndefined();
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

	test("the result inside where refers to previous command result, not current element", async ({run}) => {
		var result = await run(`get 3
			then set arr to [1, 2, 3, 4, 5]
			then return arr where it > the result`);
		expect(result).toEqual([4, 5]);
	});

});

test.describe("weak indirect binding", () => {

	test("where binds after in without parens", async ({html, run}) => {
		await html(
			"<div id='container'>" +
			"<span class='a'>A</span><span class='b'>B</span><span class='a'>C</span>" +
			"</div>"
		);
		var result = await run("<span/> in #container where it matches .a");
		expect(result.length).toBe(2);
	});

	test("sorted by binds after in without parens", async ({html, run}) => {
		await html(
			"<ul id='list'><li>C</li><li>A</li><li>B</li></ul>"
		);
		var result = await run("<li/> in #list where its textContent is not 'A'");
		expect(result.length).toBe(2);
	});

	test("where binds after property access", async ({run}) => {
		var result = await run("obj.items where it > 2", {
			locals: { obj: { items: [1, 2, 3, 4] } }
		});
		expect(result).toEqual([3, 4]);
	});

	test("where after in with mapped to", async ({html, run}) => {
		await html(
			"<ul id='items'><li class='yes'>A</li><li>B</li><li class='yes'>C</li></ul>"
		);
		var result = await run(
			"<li/> in #items where it matches .yes mapped to its textContent"
		);
		expect(result).toEqual(["A", "C"]);
	});

	test("where binds after in on closest", async ({html, find}) => {
		await html(
			"<div id='box'><span class='a'>A</span><span class='b'>B</span><span class='a'>C</span></div>" +
			"<button _=\"on click set result to (<span/> in #box) where it matches .a then put result.length into me\">go (parens)</button>" +
			"<button id='b2' _=\"on click set result to <span/> in #box where it matches .a then put result.length into me\">go</button>"
		);
		await find('button').first().click();
		await expect(find('button').first()).toHaveText("2");
		await find('#b2').click();
		await expect(find('#b2')).toHaveText("2");
	});

	test("where in init followed by on feature", async ({html, find}) => {
		await html(
			"<div id='box'><span class='a'>A</span><span class='b'>B</span></div>" +
			"<button _=\"set :items to <span/> in #box where it matches .a " +
			"on click put :items.length into me\">go</button>"
		);
		await find('button').click();
		await expect(find('button')).toHaveText("1");
	});

	test("where in component init followed by on feature", async ({html, find}) => {
		await html(`
			<div id='box'><span class='a'>A</span><span class='b'>B</span></div>
			<script type="text/hyperscript-template" component="test-where-comp"
				_="set :items to <span/> in #box where it matches .a
				   on click put :items.length into me">
				<slot/>
			</script>
			<test-where-comp>go</test-where-comp>
		`);
		await find('test-where-comp').click();
		await expect(find('test-where-comp')).toHaveText("1");
	});

	test("where with is not me in component template", async ({html, find, evaluate}) => {
		await html(`
			<div id='box'><input type="checkbox" class="cb"><input type="checkbox" class="cb"></div>
			<script type="text/hyperscript-template" component="test-where-me">
				<input type="checkbox" _="set :checkboxes to <input[type=checkbox]/> in #box where it is not me on change set checked of the :checkboxes to my checked">
			</script>
			<test-where-me></test-where-me>
		`);
		var attr = await evaluate(() => document.querySelector('test-where-me input')?.getAttribute('_'));
		console.log("ATTR:", attr);
		await find('test-where-me input').click();
		await expect.poll(() => find('.cb').first().isChecked()).toBe(true);
	});

	test("where with is not me followed by on feature", async ({html, find}) => {
		await html(`
			<table>
			<tr><td><input type="checkbox" class="cb" checked></td></tr>
			<tr><td><input type="checkbox" class="cb"></td></tr>
			<tr><td><input type="checkbox" class="cb" checked></td></tr>
			<tr><td><input id="master" type="checkbox"
				_="set :checkboxes to <input[type=checkbox]/> in the closest <table/> where it is not me
				   on change set checked of the :checkboxes to my checked"></td></tr>
			</table>
		`);
		await find('#master').click();
		await expect.poll(() => find('.cb').first().isChecked()).toBe(true);
	});

	test("full select-all pattern with multiple on features", async ({html, find, evaluate}) => {
		await html(`
			<table>
			<tr><td><input type="checkbox" class="cb" checked></td></tr>
			<tr><td><input type="checkbox" class="cb"></td></tr>
			<tr><td><input type="checkbox" class="cb" checked></td></tr>
			<tr><td><input id="master" type="checkbox"
				_="set :checkboxes to <input[type=checkbox]/> in the closest <table/> where it is not me
				   on change
				     set checked of the :checkboxes to my checked
				   on change from the closest <table/>
				     if no :checkboxes where it is checked
				       set my indeterminate to false
				       set my checked to false
				     else if no :checkboxes where it is not checked
				       set my indeterminate to false
				       set my checked to true
				     else
				       set my indeterminate to true
				     end"></td></tr>
			</table>
		`);
		// master check should check all
		await find('#master').click();
		await expect.poll(() => find('.cb').first().isChecked()).toBe(true);
		// uncheck one child - master should become indeterminate
		await find('.cb').first().click();
		var indet = await evaluate(() => document.querySelector('#master').indeterminate);
		expect(indet).toBe(true);
	});

});
