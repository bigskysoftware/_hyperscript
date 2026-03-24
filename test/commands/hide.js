import {test, expect} from '../fixtures.js'

test.describe("the hide command", () => {

	test("can hide element with no target", async ({html, find}) => {
		await html("<div _='on click hide'></div>");
		await find('div').dispatchEvent('click');
		await expect(find('div')).toBeHidden();
	});

	test("hide element then show element retains original display", async ({html, find}) => {
		await html("<div _='on click 1 hide" +
			"                          on click 2 show'></div>");
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveCSS('display', 'none');
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveCSS('display', 'block');
	});

	test("can hide element with no target followed by command", async ({html, find}) => {
		await html("<div _='on click hide add .foo'></div>");
		await expect(find('div')).toHaveCSS('display', 'block');
		await expect(find('div')).not.toHaveClass(/foo/);
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveCSS('display', 'none');
		await expect(find('div')).toHaveClass(/foo/);
	});

	test("can hide element with no target followed by then", async ({html, find}) => {
		await html("<div _='on click hide then add .foo'></div>");
		await expect(find('div')).toHaveCSS('display', 'block');
		await expect(find('div')).not.toHaveClass(/foo/);
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveCSS('display', 'none');
		await expect(find('div')).toHaveClass(/foo/);
	});

	test("can hide element with no target with a with", async ({html, find}) => {
		await html("<div _='on click hide with display then add .foo'></div>");
		await expect(find('div')).toHaveCSS('display', 'block');
		await expect(find('div')).not.toHaveClass(/foo/);
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveCSS('display', 'none');
		await expect(find('div')).toHaveClass(/foo/);
	});

	test("can hide element, with display:none by default", async ({html, find}) => {
		await html("<div _='on click hide me'></div>");
		await expect(find('div')).toHaveCSS('display', 'block');
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveCSS('display', 'none');
	});

	test("can hide element with display:none explicitly", async ({html, find}) => {
		await html("<div _='on click hide me with display'></div>");
		await expect(find('div')).toHaveCSS('display', 'block');
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveCSS('display', 'none');
	});

	test("can hide element with opacity:0", async ({html, find}) => {
		await html("<div _='on click hide me with opacity'></div>");
		await expect(find('div')).toHaveCSS('opacity', '1');
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveCSS('opacity', '0');
	});

	test("can hide element with opacity style literal", async ({html, find}) => {
		await html("<div _='on click hide me with *opacity'></div>");
		await expect(find('div')).toHaveCSS('opacity', '1');
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveCSS('opacity', '0');
	});

	test("can hide element, with visibility:hidden", async ({html, find}) => {
		await html("<div _='on click hide me with visibility'></div>");
		await expect(find('div')).toHaveCSS('visibility', 'visible');
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveCSS('visibility', 'hidden');
	});

	test("can hide other elements", async ({html, find}) => {
		await html("<div class='hideme'></div><div _='on click hide .hideme'></div>");
		await expect(find('.hideme')).toHaveCSS('display', 'block');
		await find('div:nth-of-type(2)').dispatchEvent('click');
		await expect(find('.hideme')).toHaveCSS('display', 'none');
	});

	test("can hide with custom strategy", async ({html, find, evaluate}) => {
		await evaluate(() => {
			_hyperscript.config.hideShowStrategies = {
				myHide: function (op, element, arg) {
					if (op == "hide") {
						element.classList.add("foo");
					} else {
						element.classList.remove("foo");
					}
				},
			};
		});
		await html("<div _='on click hide with myHide'></div>");
		await expect(find('div')).not.toHaveClass(/foo/);
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveClass(/foo/);
	});

	test("can set default to custom strategy", async ({html, find, evaluate}) => {
		await evaluate(() => {
			_hyperscript.config.hideShowStrategies = {
				myHide: function (op, element, arg) {
					if (op == "hide") {
						element.classList.add("foo");
					} else {
						element.classList.remove("foo");
					}
				},
			};
			_hyperscript.config.defaultHideShowStrategy = "myHide";
		});
		await html("<div _='on click hide'></div>");
		await expect(find('div')).not.toHaveClass(/foo/);
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveClass(/foo/);
	});
});
