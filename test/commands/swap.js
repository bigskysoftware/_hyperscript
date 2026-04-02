import {test, expect} from '../fixtures.js'

test.describe("the swap command", () => {

	test("can swap two variables", async ({html, find}) => {
		await html(`<div id='d1' _='on click set x to "a" then set y to "b" then swap x with y then put x + y into me'></div>`);
		await find('#d1').dispatchEvent('click');
		await expect(find('#d1')).toHaveText("ba");
	});

	test("can swap two properties", async ({html, find}) => {
		await html(`<div id='d1' _='on click set #a.textContent to "hello" then set #b.textContent to "world" then swap #a.textContent with #b.textContent'></div>
			<span id='a'>x</span><span id='b'>y</span>`);
		await find('#d1').dispatchEvent('click');
		await expect(find('#a')).toHaveText("world");
		await expect(find('#b')).toHaveText("hello");
	});

	test("can swap array elements", async ({html, find}) => {
		await html(`<div id='d1' _='on click set arr to [1,2,3] then swap arr[0] with arr[2] then put arr as String into me'></div>`);
		await find('#d1').dispatchEvent('click');
		await expect(find('#d1')).toHaveText("3,2,1");
	});

	test("can swap a variable with a property", async ({html, find}) => {
		await html(`<div id='d1' _='on click set x to "old" then set #target.dataset.val to "new" then swap x with #target.dataset.val then put x into me'></div>
			<span id='target' data-val='x'></span>`);
		await find('#d1').dispatchEvent('click');
		await expect(find('#d1')).toHaveText("new");
		await expect(find('#target')).toHaveAttribute('data-val', 'old');
	});

});
