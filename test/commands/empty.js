import {test, expect} from '../fixtures.js'

test.describe("the empty command", () => {

	test("can empty an element", async ({html, find}) => {
		await html("<div id='d1'><p>hello</p><p>world</p></div><button _='on click empty #d1'></button>");
		await expect(find('#d1')).toHaveText("helloworld");
		await find('button').dispatchEvent('click');
		await expect(find('#d1')).toHaveText("");
	});

	test("empty with no target empties me", async ({html, find}) => {
		await html("<div _='on click empty'>content</div>");
		await expect(find('div')).toHaveText("content");
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveText("");
	});

	test("can empty multiple elements", async ({html, find}) => {
		await html(
			"<div class='clearme'><p>a</p></div>" +
			"<div class='clearme'><p>b</p></div>" +
			"<button _='on click empty .clearme'></button>"
		);
		await find('button').dispatchEvent('click');
		await expect(find('.clearme').first()).toHaveText("");
		await expect(find('.clearme').last()).toHaveText("");
	});

	test("can empty an array", async ({html, find}) => {
		await html(`<div _="on click
		                      set :arr to [1,2,3]
		                      empty :arr
		                      put :arr.length into me"></div>`);
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveText("0");
	});

	test("can empty a set", async ({html, find}) => {
		await html(`<div _="on click
		                      set :s to [1,2,3] as Set
		                      empty :s
		                      put :s.size into me"></div>`);
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveText("0");
	});

	test("can empty a map", async ({html, find}) => {
		await html(`<div _="on click
		                      set :m to {a:1, b:2} as Map
		                      empty :m
		                      put :m.size into me"></div>`);
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveText("0");
	});

	test("can empty a text input", async ({html, find}) => {
		await html(`
			<input type="text" id="t1" value="hello" />
			<button _="on click empty #t1">Empty</button>
		`);
		await expect(find('#t1')).toHaveValue("hello");
		await find('button').dispatchEvent('click');
		await expect(find('#t1')).toHaveValue("");
	});

	test("can empty a textarea", async ({html, find}) => {
		await html(`
			<textarea id="ta1">some text</textarea>
			<button _="on click empty #ta1">Empty</button>
		`);
		await find('button').dispatchEvent('click');
		await expect(find('#ta1')).toHaveValue("");
	});

	test("can empty a checkbox", async ({html, find}) => {
		await html(`
			<input type="checkbox" id="cb1" checked />
			<button _="on click empty #cb1">Empty</button>
		`);
		await expect(find('#cb1')).toBeChecked();
		await find('button').dispatchEvent('click');
		await expect(find('#cb1')).not.toBeChecked();
	});

	test("can empty a select", async ({html, find, evaluate}) => {
		await html(`
			<select id="sel1">
				<option value="a">A</option>
				<option value="b" selected>B</option>
			</select>
			<button _="on click empty #sel1">Empty</button>
		`);
		await find('button').dispatchEvent('click');
		var idx = await evaluate(() => document.getElementById('sel1').selectedIndex);
		expect(idx).toBe(-1);
	});

	test("can empty a form (clears all inputs)", async ({html, find}) => {
		await html(`
			<form id="f1">
				<input type="text" id="t2" value="val" />
				<textarea id="ta2">text</textarea>
				<input type="checkbox" id="cb2" checked />
			</form>
			<button _="on click empty #f1">Empty</button>
		`);
		await find('button').dispatchEvent('click');
		await expect(find('#t2')).toHaveValue("");
		await expect(find('#ta2')).toHaveValue("");
		await expect(find('#cb2')).not.toBeChecked();
	});

	test("clear is an alias for empty", async ({html, find}) => {
		await html(`
			<input type="text" id="t3" value="hello" />
			<button _="on click clear #t3">Clear</button>
		`);
		await expect(find('#t3')).toHaveValue("hello");
		await find('button').dispatchEvent('click');
		await expect(find('#t3')).toHaveValue("");
	});

	test("clear works on elements", async ({html, find}) => {
		await html("<div id='d2'><p>content</p></div><button _='on click clear #d2'></button>");
		await expect(find('#d2')).toHaveText("content");
		await find('button').dispatchEvent('click');
		await expect(find('#d2')).toHaveText("");
	});
});
