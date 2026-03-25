import {test, expect} from '../fixtures.js'

test.describe("_hyperscript bootstrapping", () => {

	test("on a single div", async ({html, find}) => {
		await html("<div _='on click add .foo'></div>");
		await expect(find('div')).not.toHaveClass(/foo/);
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveClass(/foo/);
	});

	test("toggles", async ({html, find}) => {
		await html("<div _='on click toggle .foo'></div>");
		await expect(find('div')).not.toHaveClass(/foo/);
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveClass(/foo/);
		await find('div').dispatchEvent('click');
		await expect(find('div')).not.toHaveClass(/foo/);
	});

	test("can target another div", async ({html, find}) => {
		await html("<div id='bar'></div><div _='on click add .foo to #bar'></div>");
		await expect(find('#bar')).not.toHaveClass(/foo/);
		await find('div:nth-of-type(2)').dispatchEvent('click');
		await expect(find('#bar')).toHaveClass(/foo/);
	});

	test("hyperscript can have more than one action", async ({html, find}) => {
		await html(
			"<div id='bar'></div>" +
			"<div _='on click " +
				"                             add .foo to #bar then " +
				"                             add .blah'></div>"
		);
		await find('div:nth-of-type(2)').dispatchEvent('click');
		await expect(find('#bar')).toHaveClass(/foo/);
		await expect(find('#bar')).not.toHaveClass(/blah/);
		await expect(find('div:nth-of-type(2)')).not.toHaveClass(/foo/);
		await expect(find('div:nth-of-type(2)')).toHaveClass(/blah/);
	});

	test("can wait", async ({html, find}) => {
		await html(
			"<div _='on click " +
				"                             add .foo then " +
				"                             wait 20ms then " +
				"                             add .bar'></div>"
		);
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveClass(/foo/);
		await expect(find('div')).toHaveClass(/bar/);
	});

	test("can change non-class properties", async ({html, find}) => {
		await html("<div _='on click add [@foo=\"bar\"]'></div>");
		await expect(find('div')).not.toHaveAttribute('foo');
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveAttribute('foo', 'bar');
	});

	test("can send events", async ({html, find}) => {
		await html("<div _='on click send foo to #bar'></div><div id='bar' _='on foo add .foo-sent'></div>");
		await expect(find('#bar')).not.toHaveClass(/foo-sent/);
		await find('div').first().dispatchEvent('click');
		await expect(find('#bar')).toHaveClass(/foo-sent/);
	});

	test("can respond to events on other elements", async ({html, find}) => {
		await html("<div id='bar'></div>" +
			"<div _='on click from #bar " + "                             add .clicked'></div>");
		await expect(find('div:nth-of-type(2)')).not.toHaveClass(/clicked/);
		await find('#bar').dispatchEvent('click');
		await expect(find('div:nth-of-type(2)')).toHaveClass(/clicked/);
	});

	test("can take a class from other elements", async ({html, find}) => {
		await html("<div class='divs foo'></div>" +
			"<div class='divs' _='on click take .foo from .divs'></div>" +
			"<div class='divs'></div>");
		await find('.divs').nth(1).dispatchEvent('click');
		await expect(find('.divs').first()).not.toHaveClass(/foo/);
		await expect(find('.divs').nth(1)).toHaveClass(/foo/);
		await expect(find('.divs').nth(2)).not.toHaveClass(/foo/);
	});

	test("can set properties", async ({html, find}) => {
		await html("<div id='d1' _='on click put \"foo\" into #d1.innerHTML'></div>");
		await find('#d1').dispatchEvent('click');
		await expect(find('#d1')).toHaveText("foo");
	});

	test("can set styles", async ({html, find}) => {
		await html("<div _='on click put \"red\" into my.style.color'>lolwat</div>");
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveCSS('color', 'rgb(255, 0, 0)');
	});

	test("can send events with args", async ({html, find}) => {
		await html("<div _='on click send foo(x:42) to #bar'></div><div id='bar' _='on foo put event.detail.x into my.innerHTML'></div>");
		await find('div').first().dispatchEvent('click');
		await expect(find('#bar')).toHaveText("42");
	});

	test("can call functions", async ({html, find, evaluate}) => {
		await evaluate(() => {
			window.calledWith = null;
			window.globalFunction = function (val) { window.calledWith = val; };
		});
		await html("<div _='on click call globalFunction(\"foo\")'></div>");
		await find('div').dispatchEvent('click');
		expect(await evaluate(() => window.calledWith)).toBe("foo");
	});

	test("stores state on elt._hyperscript", async ({html, find, evaluate}) => {
		await html("<div _='on click add .foo'></div>");
		var state = await evaluate(() => {
			var div = document.querySelector('#work-area div');
			return {
				hasProperty: '_hyperscript' in div,
				initialized: div._hyperscript?.initialized,
				hasScriptHash: typeof div._hyperscript?.scriptHash === 'number',
			};
		});
		expect(state.hasProperty).toBe(true);
		expect(state.initialized).toBe(true);
		expect(state.hasScriptHash).toBe(true);
	});

	test("skips reinitialization if script unchanged", async ({html, find, evaluate}) => {
		await html("<div _='on click add .foo'></div>");
		// Process again — should be a no-op
		var clickCount = await evaluate(() => {
			var div = document.querySelector('#work-area div');
			var count = 0;
			div.addEventListener('click', () => count++);
			_hyperscript.processNode(div);
			div.click();
			return count;
		});
		// Only 1 click handler should fire (the original), not 2
		expect(clickCount).toBe(1);
	});

	test("reinitializes if script attribute changes", async ({html, find, evaluate}) => {
		await html("<div _='on click add .foo'></div>");
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveClass(/foo/);

		// Change the script and reprocess (simulates morph swap)
		await evaluate(() => {
			var div = document.querySelector('#work-area div');
			div.setAttribute('_', 'on click add .bar');
			_hyperscript.processNode(div);
		});
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveClass(/bar/);
	});

	test("cleanup removes event listeners on the element", async ({html, find, evaluate}) => {
		await html("<div _='on click add .foo'></div>");
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveClass(/foo/);

		// Cleanup and verify listener is gone
		await evaluate(() => {
			var div = document.querySelector('#work-area div');
			_hyperscript.cleanup(div);
			div.classList.remove('foo');
			div.click();
		});
		await expect(find('div')).not.toHaveClass(/foo/);
	});

	test("cleanup removes cross-element event listeners", async ({html, find, evaluate}) => {
		await html("<div id='source'></div><div id='target' _='on click from #source add .foo'></div>");

		// Verify the cross-element listener works
		await find('#source').dispatchEvent('click');
		await expect(find('#target')).toHaveClass(/foo/);

		// Cleanup target and verify listener on source is removed
		var listenerRemoved = await evaluate(() => {
			var source = document.getElementById('source');
			var target = document.getElementById('target');
			_hyperscript.cleanup(target);
			target.classList.remove('foo');
			source.click();
			// If cleanup worked, target should NOT get .foo again
			return !target.classList.contains('foo');
		});
		expect(listenerRemoved).toBe(true);
	});

	test("cleanup tracks listeners in elt._hyperscript", async ({html, find, evaluate}) => {
		await html("<div _='on click add .foo'></div>");
		var info = await evaluate(() => {
			var div = document.querySelector('#work-area div');
			return {
				hasListeners: Array.isArray(div._hyperscript.listeners),
				listenerCount: div._hyperscript.listeners.length,
			};
		});
		expect(info.hasListeners).toBe(true);
		expect(info.listenerCount).toBeGreaterThan(0);
	});

	test("cleanup clears elt._hyperscript", async ({html, find, evaluate}) => {
		await html("<div _='on click add .foo'></div>");
		var hasState = await evaluate(() => {
			var div = document.querySelector('#work-area div');
			_hyperscript.cleanup(div);
			return '_hyperscript' in div;
		});
		expect(hasState).toBe(false);
	});
});
