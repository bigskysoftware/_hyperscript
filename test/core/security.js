import {test, expect} from '../fixtures.js'

test.describe("security options", () => {

	test("on a single div", async ({html, find}) => {
		await html("<div disable-scripting>" + "<div id='d1' _='on click add .foo'></div>" + "</div>");
		await find('#d1').dispatchEvent('click');
		await expect(find('#d1')).not.toHaveClass(/foo/);
	});
});
