import {test, expect} from '../fixtures.js'

test.describe("the halt command", () => {

	test("halts event propagation and default", async ({html, find, evaluate}) => {
		await html(
			"<div id='outer' _='on click add .outer-clicked'>" +
			"  <a id='inner' href='#shouldnot' _='on click halt'>click me</a>" +
			"</div>"
		);
		await find('#inner').dispatchEvent('click');
		// halt stops propagation — outer should NOT get the click
		await expect(find('#outer')).not.toHaveClass(/outer-clicked/);
	});

	test("halt stops execution after the halt", async ({html, find}) => {
		await html(
			"<div _='on click halt then add .should-not-happen'>test</div>"
		);
		await find('div').dispatchEvent('click');
		await expect(find('div')).not.toHaveClass(/should-not-happen/);
	});

	test("halt the event stops propagation but continues execution", async ({html, find}) => {
		await html(
			"<div id='outer' _='on click add .outer-clicked'>" +
			"  <div id='inner' _='on click halt the event then add .continued'>click me</div>" +
			"</div>"
		);
		await find('#inner').dispatchEvent('click');
		// halt the event stops propagation but continues execution
		await expect(find('#outer')).not.toHaveClass(/outer-clicked/);
		await expect(find('#inner')).toHaveClass(/continued/);
	});

	test("halt the event's stops propagation but continues execution", async ({html, find}) => {
		await html(
			"<div id='outer' _='on click add .outer-clicked'>" +
			"  <div id='inner' _=\"on click halt the event's then add .continued\">click me</div>" +
			"</div>"
		);
		await find('#inner').dispatchEvent('click');
		await expect(find('#outer')).not.toHaveClass(/outer-clicked/);
		await expect(find('#inner')).toHaveClass(/continued/);
	});

	test("halt bubbling only stops propagation, not default", async ({html, find, evaluate}) => {
		await html(
			"<div id='outer' _='on click add .outer-clicked'>" +
			"  <div id='inner' _='on click halt bubbling then add .continued'>click me</div>" +
			"</div>"
		);
		await find('#inner').dispatchEvent('click');
		// bubbling stopped — outer should NOT get click
		await expect(find('#outer')).not.toHaveClass(/outer-clicked/);
		// but execution halts (no keepExecuting)
		await expect(find('#inner')).not.toHaveClass(/continued/);
	});

	test("halt works outside of event context", async ({evaluate}) => {
		// halt in init (no event) should not throw "did not return a next element"
		var error = await evaluate(() => {
			return new Promise(resolve => {
				window.addEventListener('error', function handler(e) {
					window.removeEventListener('error', handler);
					resolve(e.message);
				});
				var wa = document.getElementById('work-area');
				wa.innerHTML = "<div _='init halt'></div>";
				_hyperscript.processNode(wa);
				setTimeout(() => resolve(null), 200);
			});
		});
		expect(error).toBeNull();
	});

	test("halt default only prevents default, not propagation", async ({html, find}) => {
		await html(
			"<div id='outer' _='on click add .outer-clicked'>" +
			"  <div id='inner' _='on click halt default'>click me</div>" +
			"</div>"
		);
		await find('#inner').dispatchEvent('click');
		// default halted but propagation NOT stopped — outer SHOULD get click
		await expect(find('#outer')).toHaveClass(/outer-clicked/);
	});

});
