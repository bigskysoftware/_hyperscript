import {test, expect} from '../fixtures.js'

test.describe("async error handling", () => {

	test("rejected promise stops execution", async ({html, find, evaluate}) => {
		await evaluate(() => {
			window.failAsync = function() {
				return Promise.reject(new Error("boom"));
			}
		});
		await html(
			`<button _="on click
				call failAsync()
				put 'should not reach' into #out
			">Go</button>
			<div id='out'>original</div>`
		);
		await find('button').click();
		await new Promise(r => setTimeout(r, 200));
		await expect(find('#out')).toHaveText("original");
	});

	test("rejected promise triggers catch block", async ({html, find, evaluate}) => {
		await evaluate(() => {
			window.failAsync = function() {
				return Promise.reject(new Error("boom"));
			}
		});
		await html(
			`<button _="on click
				call failAsync()
				put 'unreachable' into #out
			catch e
				put e.message into #out
			">Go</button>
			<div id='out'></div>`
		);
		await find('button').click();
		await expect(find('#out')).toHaveText("boom");
	});

});
