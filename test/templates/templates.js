import {test, expect} from '../fixtures.js'
import _hyperscript from "../../src/_hyperscript.js";

test.describe('Templating', () => {

    test('can render correctly', async ({html, evaluate}) => {
        await html('<template>#for x in stuff\n<p>Hello ${x}</p>\n#end</template>')
        await evaluate(() => {
            const tmpl = document.querySelector('#work-area template')
            _hyperscript("render tmpl with stuff: stuff then put it into window.res", {
                locals: { stuff: [1,2,3], tmpl }
            })
        })
        const res = await evaluate(() => window.res)
        expect(res).toBe('<p>Hello 1</p>\n<p>Hello 2</p>\n<p>Hello 3</p>\n')
    })

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
		await html('<template>begin\n#for it in [1, 2, 3]\n${it}\n#end\nend\n</template>')
		await evaluate(() => {
			const tmpl = document.querySelector('#work-area template')
			_hyperscript("render tmpl then put it into window.res", {
				locals: { tmpl }
			})
		})
		const res = await evaluate(() => window.res)
		expect(res).toBe('begin\n1\n2\n3\nend\n')
	})

	test('supports if', async ({html, evaluate}) => {
		await html('<template>begin\n#if true\na\n#else\nb\n#end\nend\n</template>')
		await evaluate(() => {
			const tmpl = document.querySelector('#work-area template')
			_hyperscript("render tmpl then put it into window.res", {
				locals: { tmpl }
			})
		})
		const res = await evaluate(() => window.res)
		expect(res).toBe('begin\na\nend\n')
	})

    test ('supports nested operations', async ({html, evaluate}) => {
        await html('<template>#for x in stuff\n#if x === 2\n<p>Should be 2 -> ${x}</p>\n#end\n#end{</template>')
        await evaluate(() => {
            const tmpl = document.querySelector('#work-area template')
            _hyperscript("render tmpl with stuff: stuff then put it into window.res", {
                locals: { stuff: [0,1,2,2,3,4], tmpl }
            })
        })
        const res = await evaluate(() => window.res)
        expect(res).toBe('<p>Should be 2 -&gt; 2</p>\n<p>Should be 2 -&gt; 2</p>\n')
    })

    test ('handles async expressions', async ({html, evaluate}) => {
        await html('<template>result: ${asyncFn()}</template>')
        await evaluate(() => {
            window.asyncFn = () => Promise.resolve(10)
            const tmpl = document.querySelector('#work-area template')
            return _hyperscript("render tmpl then put it into window.res", {
                locals: { tmpl }
            })
        })
        const res = await evaluate(() => window.res)
        expect(res).toBe('result: 10')
    })

    test('recovers from bad expression in ${}', async ({html, evaluate}) => {
        await html('<template>before ${!!!} after</template>')
        var errors = []
        await evaluate(() => {
            var origError = console.error
            window.__capturedErrors = []
            console.error = function() { window.__capturedErrors.push(Array.from(arguments).join(' ')) }
            const tmpl = document.querySelector('#work-area template')
            _hyperscript("render tmpl then put it into window.res", {
                locals: { tmpl }
            })
            console.error = origError
        })
        const res = await evaluate(() => window.res)
        expect(res).toBe('before  after')
        const captured = await evaluate(() => window.__capturedErrors)
        expect(captured.length).toBeGreaterThan(0)
        expect(captured[0]).toContain('template error')
    })

    test('recovers from unterminated ${}', async ({html, evaluate}) => {
        await html('<template>before ${x after</template>')
        await evaluate(() => {
            var origError = console.error
            window.__capturedErrors = []
            console.error = function() { window.__capturedErrors.push(Array.from(arguments).join(' ')) }
            const tmpl = document.querySelector('#work-area template')
            _hyperscript("render tmpl then put it into window.res", {
                locals: { tmpl }
            })
            console.error = origError
        })
        const res = await evaluate(() => window.res)
        expect(res).toBe('before ')
        const captured = await evaluate(() => window.__capturedErrors)
        expect(captured.length).toBeGreaterThan(0)
        expect(captured[0]).toContain('Unterminated')
    })

    test('good expressions still render alongside bad ones', async ({html, evaluate}) => {
        await html('<template>${x} ${!!!} ${y}</template>')
        await evaluate(() => {
            var origError = console.error
            console.error = function() {}
            const tmpl = document.querySelector('#work-area template')
            _hyperscript("render tmpl with x: x, y: y then put it into window.res", {
                locals: { x: "hello", y: "world", tmpl }
            })
            console.error = origError
        })
        const res = await evaluate(() => window.res)
        expect(res).toBe('hello  world')
    })

    test('multiple expressions on one line', async ({html, evaluate}) => {
        await html('<template>${a} + ${b} = ${c}</template>')
        await evaluate(() => {
            const tmpl = document.querySelector('#work-area template')
            _hyperscript("render tmpl with a: a, b: b, c: c then put it into window.res", {
                locals: { a: 1, b: 2, c: 3, tmpl }
            })
        })
        const res = await evaluate(() => window.res)
        expect(res).toBe('1 + 2 = 3')
    })

    test('expression with nested braces', async ({html, evaluate}) => {
        await html('<template>${obj["key"]}</template>')
        await evaluate(() => {
            const tmpl = document.querySelector('#work-area template')
            _hyperscript("render tmpl with obj: obj then put it into window.res", {
                locals: { obj: { key: "val" }, tmpl }
            })
        })
        const res = await evaluate(() => window.res)
        expect(res).toBe('val')
    })

    test('null and undefined render as empty', async ({html, evaluate}) => {
        await html('<template>[${x}][${y}]</template>')
        await evaluate(() => {
            const tmpl = document.querySelector('#work-area template')
            _hyperscript("render tmpl with x: x, y: y then put it into window.res", {
                locals: { x: null, y: undefined, tmpl }
            })
        })
        const res = await evaluate(() => window.res)
        expect(res).toBe('[][]')
    })
})
