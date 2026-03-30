import {test, expect} from '../fixtures.js'

test.describe("on resize", () => {

	test("fires when element is resized", async ({html, find, page}) => {
		await html(
			"<div id='box' style='width:100px; height:100px' " +
			"_='on resize put detail.width into #out'></div>" +
			"<div id='out'></div>"
		);
		await page.evaluate(() => {
			document.getElementById('box').style.width = '200px';
		});
		await expect(find('#out')).toHaveText("200");
	});

	test("provides height in detail", async ({html, find, page}) => {
		await html(
			"<div id='box' style='width:100px; height:100px' " +
			"_='on resize put detail.height into #out'></div>" +
			"<div id='out'></div>"
		);
		await page.evaluate(() => {
			document.getElementById('box').style.height = '300px';
		});
		await expect(find('#out')).toHaveText("300");
	});

	test("works with from clause", async ({html, find, page}) => {
		await html(
			"<div id='box' style='width:100px; height:100px'></div>" +
			"<div id='out' _='on resize from #box put detail.width into me'></div>"
		);
		await page.evaluate(() => {
			document.getElementById('box').style.width = '150px';
		});
		await expect(find('#out')).toHaveText("150");
	});

});
