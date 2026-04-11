import {test, expect} from '../fixtures.js'

test.describe("dialog support in show/hide", () => {

	test("show opens a dialog (non-modal)", async ({html, find}) => {
		await html(
			"<dialog id='d'><p>Hello</p></dialog>" +
			"<button _='on click show #d'>Open</button>"
		);
		await expect(find('#d')).not.toHaveAttribute('open');
		await find('button').click();
		await expect(find('#d')).toHaveAttribute('open');
	});

	test("hide closes a dialog", async ({html, find, evaluate}) => {
		await html(
			"<dialog id='d'><p>Hello</p><button id='close' _='on click hide #d'>Close</button></dialog>"
		);
		await evaluate(() => document.getElementById('d').showModal());
		await expect(find('#d')).toHaveAttribute('open');
		await find('#close').click();
		await expect(find('#d')).not.toHaveAttribute('open');
	});

	test("show opens a non-modal dialog (no ::backdrop)", async ({html, find, evaluate}) => {
		await html(
			"<dialog id='d'><p>Hello</p></dialog>" +
			"<button _='on click show #d'>Open</button>"
		);
		await find('button').click();
		// Non-modal dialogs do not match :modal; modal dialogs do.
		var isModal = await evaluate(() => document.getElementById('d').matches(':modal'));
		expect(isModal).toBe(false);
	});

	test("open opens a modal dialog (matches :modal)", async ({html, find, evaluate}) => {
		await html(
			"<dialog id='d'><p>Hello</p></dialog>" +
			"<button _='on click open #d'>Open</button>"
		);
		await find('button').click();
		var isModal = await evaluate(() => document.getElementById('d').matches(':modal'));
		expect(isModal).toBe(true);
	});

	test("show on already-open dialog is a no-op", async ({html, find, evaluate}) => {
		await html(
			"<dialog id='d'><p>Hello</p><button _='on click show #d'>Show Again</button></dialog>"
		);
		await evaluate(() => document.getElementById('d').showModal());
		await expect(find('#d')).toHaveAttribute('open');
		await find('button').click();
		await expect(find('#d')).toHaveAttribute('open');
	});

});

test.describe("open and close commands", () => {

	test("open opens a dialog", async ({html, find}) => {
		await html(
			"<dialog id='d'><p>Hello</p></dialog>" +
			"<button _='on click open #d'>Open</button>"
		);
		await expect(find('#d')).not.toHaveAttribute('open');
		await find('button').click();
		await expect(find('#d')).toHaveAttribute('open');
	});

	test("close closes a dialog", async ({html, find, evaluate}) => {
		await html(
			"<dialog id='d'><p>Hello</p><button id='close' _='on click close #d'>Close</button></dialog>"
		);
		await evaluate(() => document.getElementById('d').showModal());
		await expect(find('#d')).toHaveAttribute('open');
		await find('#close').click();
		await expect(find('#d')).not.toHaveAttribute('open');
	});

	test("open opens a details element", async ({html, find}) => {
		await html(
			"<details id='d'><summary>More</summary><p>Content</p></details>" +
			"<button _='on click open #d'>Open</button>"
		);
		await expect(find('#d')).not.toHaveAttribute('open');
		await find('button').click();
		await expect(find('#d')).toHaveAttribute('open');
	});

	test("close closes a details element", async ({html, find}) => {
		await html(
			"<details id='d' open><summary>More</summary><p>Content</p></details>" +
			"<button _='on click close #d'>Close</button>"
		);
		await expect(find('#d')).toHaveAttribute('open');
		await find('button').click();
		await expect(find('#d')).not.toHaveAttribute('open');
	});

	test("open shows a popover", async ({html, find}) => {
		await html(
			"<div id='p' popover><p>Popover content</p></div>" +
			"<button _='on click open #p'>Open</button>"
		);
		await find('button').click();
		var visible = await find('#p').evaluate(el => el.matches(':popover-open'));
		expect(visible).toBe(true);
	});

	test("close hides a popover", async ({html, find, evaluate}) => {
		await html(
			"<div id='p' popover><p>Popover content</p><button id='close' _='on click close #p'>Close</button></div>"
		);
		await evaluate(() => document.getElementById('p').showPopover());
		await find('#close').click();
		var visible = await find('#p').evaluate(el => el.matches(':popover-open'));
		expect(visible).toBe(false);
	});

	test("open on implicit me", async ({html, find}) => {
		await html(
			"<dialog id='d' _='on myOpen open'></dialog>" +
			"<button _='on click send myOpen to #d'>Open</button>"
		);
		await find('button').click();
		await expect(find('#d')).toHaveAttribute('open');
	});

});
