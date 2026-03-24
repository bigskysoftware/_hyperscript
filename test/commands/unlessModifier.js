import {test, expect} from '../fixtures.js'

test.describe("the unless command modifier", () => {

	test("unless modifier can conditionally execute a command", async ({html, find, evaluate}) => {
		await html("<div _='on click toggle .foo unless I match .bar'></div>");

		await expect(find('div')).not.toHaveClass(/foo/);
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveClass(/foo/);
		await find('div').dispatchEvent('click');
		await expect(find('div')).not.toHaveClass(/foo/);

		await evaluate(() => document.querySelector('#work-area div').classList.add("bar"));
		await expect(find('div')).not.toHaveClass(/foo/);
		await find('div').dispatchEvent('click');
		await expect(find('div')).not.toHaveClass(/foo/);
		await find('div').dispatchEvent('click');
		await expect(find('div')).not.toHaveClass(/foo/);
	});
});
