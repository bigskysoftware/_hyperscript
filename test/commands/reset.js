import {test, expect} from '../fixtures.js'

test.describe("the reset command", () => {

	test("can reset a form", async ({html, find}) => {
		await html(`
			<form id="f1">
				<input type="text" id="t1" value="original" />
				<button type="button" _="on click set #t1's value to 'changed'">Change</button>
				<button type="button" id="rst" _="on click reset #f1">Reset</button>
			</form>
		`);
		await find('#t1').fill('changed');
		await expect(find('#t1')).toHaveValue('changed');
		await find('#rst').dispatchEvent('click');
		await expect(find('#t1')).toHaveValue('original');
	});

	test("reset with no target resets me (form)", async ({html, find}) => {
		await html(`
			<form _="on custom reset">
				<input type="text" id="t2" value="default" />
			</form>
		`);
		await find('#t2').fill('modified');
		await expect(find('#t2')).toHaveValue('modified');
		await find('form').dispatchEvent('custom');
		await expect(find('#t2')).toHaveValue('default');
	});

	test("can reset a text input to defaultValue", async ({html, find}) => {
		await html(`
			<input type="text" id="t3" value="hello" />
			<button _="on click reset #t3">Reset</button>
		`);
		await find('#t3').fill('goodbye');
		await expect(find('#t3')).toHaveValue('goodbye');
		await find('button').dispatchEvent('click');
		await expect(find('#t3')).toHaveValue('hello');
	});

	test("can reset a checkbox", async ({html, find, evaluate}) => {
		await html(`
			<input type="checkbox" id="cb1" checked />
			<button _="on click reset #cb1">Reset</button>
		`);
		await find('#cb1').uncheck();
		await expect(find('#cb1')).not.toBeChecked();
		await find('button').dispatchEvent('click');
		await expect(find('#cb1')).toBeChecked();
	});

	test("can reset an unchecked checkbox", async ({html, find}) => {
		await html(`
			<input type="checkbox" id="cb2" />
			<button _="on click reset #cb2">Reset</button>
		`);
		await find('#cb2').check();
		await expect(find('#cb2')).toBeChecked();
		await find('button').dispatchEvent('click');
		await expect(find('#cb2')).not.toBeChecked();
	});

	test("can reset a textarea", async ({html, find}) => {
		await html(`
			<textarea id="ta1">original text</textarea>
			<button _="on click reset #ta1">Reset</button>
		`);
		await find('#ta1').fill('new text');
		await expect(find('#ta1')).toHaveValue('new text');
		await find('button').dispatchEvent('click');
		await expect(find('#ta1')).toHaveValue('original text');
	});

	test("can reset a select", async ({html, find}) => {
		await html(`
			<select id="sel1">
				<option value="a">A</option>
				<option value="b" selected>B</option>
				<option value="c">C</option>
			</select>
			<button _="on click reset #sel1">Reset</button>
		`);
		await find('#sel1').selectOption('c');
		await expect(find('#sel1')).toHaveValue('c');
		await find('button').dispatchEvent('click');
		await expect(find('#sel1')).toHaveValue('b');
	});

	test("can reset multiple inputs", async ({html, find}) => {
		await html(`
			<input type="text" class="resettable" value="one" />
			<input type="text" class="resettable" value="two" />
			<button _="on click reset .resettable">Reset</button>
		`);
		await find('.resettable').first().fill('changed1');
		await find('.resettable').last().fill('changed2');
		await find('button').dispatchEvent('click');
		await expect(find('.resettable').first()).toHaveValue('one');
		await expect(find('.resettable').last()).toHaveValue('two');
	});
});
