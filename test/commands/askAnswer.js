import {test, expect} from '../fixtures.js'

test.describe("the ask command", () => {

	test("prompts and puts result in it", async ({page, html, find}) => {
		page.on('dialog', async dialog => {
			expect(dialog.type()).toBe('prompt');
			expect(dialog.message()).toBe('What is your name?');
			await dialog.accept('Alice');
		});
		await html("<button _='on click ask \"What is your name?\" then put it into #out'>Ask</button><div id='out'></div>");
		await find('button').click();
		await expect(find('#out')).toHaveText("Alice");
	});

	test("returns null on cancel", async ({page, html, find}) => {
		page.on('dialog', async dialog => {
			await dialog.dismiss();
		});
		await html("<button _='on click ask \"Name?\" then put it into #out'>Ask</button><div id='out'></div>");
		await find('button').click();
		await expect(find('#out')).toHaveText("null");
	});

});

test.describe("the answer command", () => {

	test("shows an alert", async ({page, html, find}) => {
		var alertMessage = null;
		page.on('dialog', async dialog => {
			alertMessage = dialog.message();
			await dialog.accept();
		});
		await html("<button _='on click answer \"Hello!\" then put \"done\" into #out'>Go</button><div id='out'></div>");
		await find('button').click();
		await expect(find('#out')).toHaveText("done");
		expect(alertMessage).toBe("Hello!");
	});

	test("confirm returns first choice on OK", async ({page, html, find}) => {
		page.on('dialog', async dialog => {
			expect(dialog.type()).toBe('confirm');
			await dialog.accept();
		});
		await html("<button _='on click answer \"Save?\" with \"Yes\" or \"No\" then put it into #out'>Go</button><div id='out'></div>");
		await find('button').click();
		await expect(find('#out')).toHaveText("Yes");
	});

	test("confirm returns second choice on cancel", async ({page, html, find}) => {
		page.on('dialog', async dialog => {
			await dialog.dismiss();
		});
		await html("<button _='on click answer \"Save?\" with \"Yes\" or \"No\" then put it into #out'>Go</button><div id='out'></div>");
		await find('button').click();
		await expect(find('#out')).toHaveText("No");
	});

});
