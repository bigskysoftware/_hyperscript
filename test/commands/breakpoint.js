import {test, expect} from '../fixtures.js'

test.describe("the breakpoint command", () => {

	// Note: the resolve path (`debugger;`) is not exercised at runtime — Playwright
	// uses the Chrome DevTools Protocol and treats `debugger;` as a real pause point,
	// so any test that actually dispatches a handler containing `breakpoint` hangs.
	// We only test that the command parses and installs; resolve is two lines
	// (`debugger; return this.findNext(ctx)`) and is exercised in manual debugging.

	test("parses as a top-level command", async ({error}) => {
		expect(await error("breakpoint")).toBeNull()
	})

	test("parses inside an event handler", async ({html, find, error}) => {
		// Parsing-only check: installing the handler must not throw.
		expect(await error("on click breakpoint end")).toBeNull()
	})
})
