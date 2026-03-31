import {test, expect} from '../fixtures.js'

test.describe('dom-scope attribute', () => {

	test('isolated stops ^var resolution', async ({html, find}) => {
		await html(`
			<div _="init set ^color to 'red'">
				<div dom-scope="isolated">
					<span _="init if ^color is not undefined put 'leaked' into me else put 'blocked' into me">waiting</span>
				</div>
			</div>
		`)
		await expect.poll(() => find('span').textContent()).toBe('blocked')
	})

	test('closest jumps to matching ancestor', async ({html, find}) => {
		await html(`
			<div class="outer" _="init set ^val to 'from-outer'">
				<div dom-scope="isolated" _="init set ^val to 'from-inner'">
					<span dom-scope="closest .outer" _="init put ^val into me">none</span>
				</div>
			</div>
		`)
		await expect.poll(() => find('span').textContent()).toBe('from-outer')
	})

	test('closest with no match stops resolution', async ({html, find}) => {
		await html(`
			<div _="init set ^val to 'found'">
				<span dom-scope="closest .nonexistent" _="init if ^val is not undefined put 'leaked' into me else put 'blocked' into me">waiting</span>
			</div>
		`)
		await expect.poll(() => find('span').textContent()).toBe('blocked')
	})

	test('isolated allows setting ^var on the isolated element itself', async ({html, find}) => {
		await html(`
			<div _="init set ^outer to 'leaked'">
				<div dom-scope="isolated" _="init set ^inner to 'contained'">
					<span _="init put ^inner into me">none</span>
				</div>
			</div>
		`)
		await expect.poll(() => find('span').textContent()).toBe('contained')
	})

})
