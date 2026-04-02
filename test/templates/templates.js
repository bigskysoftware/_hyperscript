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

    test('supports for...else with non-empty collection', async ({html, evaluate}) => {
        await html('<template>#for item in items\nFound: ${item}\n#else\nNo items found\n#end\n</template>')
        await evaluate(() => {
            const tmpl = document.querySelector('#work-area template')
            _hyperscript("render tmpl with items: items then put it into window.res", {
                locals: { items: [1, 2, 3], tmpl }
            })
        })
        const res = await evaluate(() => window.res)
        expect(res).toBe('Found: 1\nFound: 2\nFound: 3\n')
    })

    test('supports for...else with empty collection', async ({html, evaluate}) => {
        await html('<template>#for item in items\nFound: ${item}\n#else\nNo items found\n#end\n</template>')
        await evaluate(() => {
            const tmpl = document.querySelector('#work-area template')
            _hyperscript("render tmpl with items: items then put it into window.res", {
                locals: { items: [], tmpl }
            })
        })
        const res = await evaluate(() => window.res)
        expect(res).toBe('No items found\n')
    })

    test('supports for...else with null collection', async ({html, evaluate}) => {
        await html('<template>#for item in items\nFound: ${item}\n#else\nNothing to show\n#end\n</template>')
        await evaluate(() => {
            const tmpl = document.querySelector('#work-area template')
            _hyperscript("render tmpl with items: items then put it into window.res", {
                locals: { items: null, tmpl }
            })
        })
        const res = await evaluate(() => window.res)
        expect(res).toBe('Nothing to show\n')
    })

    test('supports conditional expressions with if', async ({html, evaluate}) => {
        await html('<template>Result: ${value if condition}</template>')
        await evaluate(() => {
            const tmpl = document.querySelector('#work-area template')
            _hyperscript("render tmpl with value: value, condition: condition then put it into window.res", {
                locals: { value: 'Hello', condition: true, tmpl }
            })
        })
        const res = await evaluate(() => window.res)
        expect(res).toBe('Result: Hello')
    })

    test('supports conditional expressions with if (false condition)', async ({html, evaluate}) => {
        await html('<template>Result: ${value if condition}</template>')
        await evaluate(() => {
            const tmpl = document.querySelector('#work-area template')
            _hyperscript("render tmpl with value: value, condition: condition then put it into window.res", {
                locals: { value: 'Hello', condition: false, tmpl }
            })
        })
        const res = await evaluate(() => window.res)
        expect(res).toBe('Result: ')
    })

    test('supports conditional expressions with if...else', async ({html, evaluate}) => {
        await html('<template>Result: ${value if condition else fallback}</template>')
        await evaluate(() => {
            const tmpl = document.querySelector('#work-area template')
            _hyperscript("render tmpl with value: value, condition: condition, fallback: fallback then put it into window.res", {
                locals: { value: 'Hello', condition: false, fallback: 'Goodbye', tmpl }
            })
        })
        const res = await evaluate(() => window.res)
        expect(res).toBe('Result: Goodbye')
    })

    test('supports conditional expressions with complex expressions', async ({html, evaluate}) => {
        await html('<template>Status: ${user.name if user.active else "Inactive"}</template>')
        await evaluate(() => {
            const tmpl = document.querySelector('#work-area template')
            _hyperscript("render tmpl with user: user then put it into window.res", {
                locals: { user: { name: 'Alice', active: true }, tmpl }
            })
        })
        const res = await evaluate(() => window.res)
        expect(res).toBe('Status: Alice')
    })

    test('supports conditional expressions in loops', async ({html, evaluate}) => {
        await html('<template>#for item in items\n${item.name if item.show else "Hidden"}\n#end\n</template>')
        await evaluate(() => {
            const tmpl = document.querySelector('#work-area template')
            _hyperscript("render tmpl with items: items then put it into window.res", {
                locals: {
                    items: [
                        { name: 'Apple', show: true },
                        { name: 'Banana', show: false },
                        { name: 'Cherry', show: true }
                    ],
                    tmpl
                }
            })
        })
        const res = await evaluate(() => window.res)
        expect(res).toBe('Apple\nHidden\nCherry\n')
    })

    test('supports continue in template for loops', async ({html, evaluate}) => {
        await html('<template>#for item in items\n#if item === 2\n#continue\n#end\n${item}\n#end\n</template>')
        await evaluate(() => {
            const tmpl = document.querySelector('#work-area template')
            _hyperscript("render tmpl with items: items then put it into window.res", {
                locals: { items: [1, 2, 3, 4], tmpl }
            })
        })
        const res = await evaluate(() => window.res)
        expect(res).toBe('1\n3\n4\n')
    })

    test('supports break in template for loops', async ({html, evaluate}) => {
        await html('<template>#for item in items\n#if item === 3\n#break\n#end\n${item}\n#end\n</template>')
        await evaluate(() => {
            const tmpl = document.querySelector('#work-area template')
            _hyperscript("render tmpl with items: items then put it into window.res", {
                locals: { items: [1, 2, 3, 4, 5], tmpl }
            })
        })
        const res = await evaluate(() => window.res)
        expect(res).toBe('1\n2\n')
    })

    test('break prevents else clause from executing', async ({html, evaluate}) => {
        await html('<template>#for item in items\n#if item === 2\n#break\n#end\n${item}\n#else\nNo items\n#end\n</template>')
        await evaluate(() => {
            const tmpl = document.querySelector('#work-area template')
            _hyperscript("render tmpl with items: items then put it into window.res", {
                locals: { items: [1, 2, 3], tmpl }
            })
        })
        const res = await evaluate(() => window.res)
        // Break was called, so loop did iterate, else should not run
        expect(res).toBe('1\n')
    })

    // test ('all characters escape correctly', async ({html, evaluate}) => {
    //     await html('<template></template>')
    // })
})
