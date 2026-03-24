import {test, expect} from '../fixtures.js'

test.describe('Templating', () => {

	test('can render', async ({html, evaluate}) => {
		await html('<template>render ${x}</template>')
		await evaluate(() => {
			const tmpl = document.querySelector('#work-area template')
			_hyperscript("render tmpl with x: x then put it into window.res", {
				locals: { x: ":)", tmpl }
			})
		})
		const res = await evaluate(() => window.res)
		expect(res).toBe('render :)')
	})

	test('escapes html, with opt-out', async ({html, evaluate}) => {
		await html('<template>render ${x} ${unescaped x}</template>')
		await evaluate(() => {
			const tmpl = document.querySelector('#work-area template')
			_hyperscript("render tmpl with x: x then put it into window.res", {
				locals: { x: "<br>", tmpl }
			})
		})
		const res = await evaluate(() => window.res)
		expect(res).toBe('render &lt;br&gt; <br>')
	})

	test('supports repeat', async ({html, evaluate}) => {
		await html('<template>begin\n@repeat in [1, 2, 3]\n${it}\n@end\nend\n</template>')
		await evaluate(() => {
			const tmpl = document.querySelector('#work-area template')
			_hyperscript("render tmpl with x: x then put it into window.res", {
				locals: { x: ":)", tmpl }
			})
		})
		const res = await evaluate(() => window.res)
		expect(res).toBe('begin\n1\n2\n3\nend\n')
	})

	test('supports if', async ({html, evaluate}) => {
		await html('<template>begin\n@if true\na\n@else\nb\n@end\nend\n</template>')
		await evaluate(() => {
			const tmpl = document.querySelector('#work-area template')
			_hyperscript("render tmpl with x: x then put it into window.res", {
				locals: { x: ":)", tmpl }
			})
		})
		const res = await evaluate(() => window.res)
		expect(res).toBe('begin\na\nend\n')
	})

})
