import {test, expect} from '../fixtures.js'

test.describe('the worker feature', () => {
	test('raises a helpful error when the worker plugin is not installed', async ({error}) => {
		// The core bundle only ships a stub; the actual worker plugin is
		// a separate ext that must be loaded. Without it, parsing should
		// fail with a message pointing the user to the docs.
		const msg = await error("worker MyWorker def noop() end end")
		expect(msg).toContain('worker plugin')
		expect(msg).toContain('hyperscript.org/features/worker')
	})

	test.skip('can define a basic no arg function in a worker', async () => {
		// TODO: reimplement
	})

	test.skip('can define a basic one arg function', async () => {
		// TODO: reimplement
	})

	test.skip('can call functions from within _hyperscript', async () => {
		// TODO: reimplement
	})

	test.skip('can evaluate expressions in worker functions', async () => {
		// TODO: reimplement
	})

	test.skip('workers can be namespaced', async () => {
		// TODO: reimplement
	})

	test.skip('can access global scope in worker function', async () => {
		// TODO: reimplement
	})

	test.skip('can import external scripts', async () => {
		// TODO: reimplement
	})
})
