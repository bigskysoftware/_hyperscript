import {test, expect} from '../fixtures.js'

test.describe("the send command", () => {

	test("can send events", async ({html, find}) => {
		await html("<div _='on click send foo to #bar'></div><div id='bar' _='on foo add .foo-sent'></div>");
		await expect(find('#bar')).not.toHaveClass(/foo-sent/);
		await find('div').first().dispatchEvent('click');
		await expect(find('#bar')).toHaveClass(/foo-sent/);
	});

	test("can reference sender in events", async ({html, find}) => {
		await html("<div _='on click log 0 send foo to #bar log 3'></div><div id='bar' _='on foo add .foo-sent to sender log 1, me, sender'></div>");
		await find('div').first().dispatchEvent('click');
		await expect(find('div').first()).toHaveClass(/foo-sent/);
	});

	test("can send events with args", async ({html, find}) => {
		await html("<div _='on click send foo(x:42) to #bar'></div><div id='bar' _='on foo put event.detail.x into my.innerHTML'></div>");
		await find('div').first().dispatchEvent('click');
		await expect(find('#bar')).toHaveText("42");
	});

	test("can send events with dots", async ({html, find}) => {
		await html("<div _='on click send foo.bar to #bar'></div><div id='bar' _='on foo.bar add .foo-sent'></div>");
		await expect(find('#bar')).not.toHaveClass(/foo-sent/);
		await find('div').first().dispatchEvent('click');
		await expect(find('#bar')).toHaveClass(/foo-sent/);
	});

	test("can send events with dots with args", async ({html, find}) => {
		await html("<div _='on click send foo.bar(x:42) to #bar'></div><div id='bar' _='on foo.bar put event.detail.x into my.innerHTML'></div>");
		await find('div').first().dispatchEvent('click');
		await expect(find('#bar')).toHaveText("42");
	});

	test("can send events with colons", async ({html, find}) => {
		await html("<div _='on click send foo:bar to #bar'></div><div id='bar' _='on foo:bar add .foo-sent'></div>");
		await expect(find('#bar')).not.toHaveClass(/foo-sent/);
		await find('div').first().dispatchEvent('click');
		await expect(find('#bar')).toHaveClass(/foo-sent/);
	});

	test("can send events with colons with args", async ({html, find}) => {
		await html("<div _='on click send foo:bar(x:42) to #bar'></div><div id='bar' _='on foo:bar put event.detail.x into my.innerHTML'></div>");
		await find('div').first().dispatchEvent('click');
		await expect(find('#bar')).toHaveText("42");
	});

	test("can send events to any expression", async ({html, find}) => {
		await html("<div _='def bar return #bar on click send foo to bar()'></div><div id='bar' _='on foo add .foo-sent'></div>");
		await expect(find('#bar')).not.toHaveClass(/foo-sent/);
		await find('div').first().dispatchEvent('click');
		await expect(find('#bar')).toHaveClass(/foo-sent/);
	});
});
