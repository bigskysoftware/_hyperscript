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
        await html('<template>#for x in stuff\n#if x === 2\n<p>Should be 2 -> ${x}</p>\n#end\n#end</template>')
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

    test('async expressions in a loop resolve correctly', async ({html, evaluate}) => {
        await html('<template>#for x in items\n${asyncFn(x)}\n#end</template>')
        await evaluate(() => {
            window.asyncFn = (v) => Promise.resolve("got:" + v)
            const tmpl = document.querySelector('#work-area template')
            return _hyperscript("render tmpl with items: items, asyncFn: asyncFn then put it into window.res", {
                locals: { items: [1, 2, 3], asyncFn: window.asyncFn, tmpl }
            })
        })
        const res = await evaluate(() => window.res)
        expect(res).toBe('got:1\ngot:2\ngot:3\n')
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

    test('empty template renders empty string', async ({html, evaluate}) => {
        await html('<template></template>')
        await evaluate(() => {
            const tmpl = document.querySelector('#work-area template')
            _hyperscript("render tmpl then put it into window.res", {
                locals: { tmpl }
            })
        })
        const res = await evaluate(() => window.res)
        expect(res).toBe('')
    })

    test('plain text with no expressions', async ({html, evaluate}) => {
        await html('<template>just plain text\n</template>')
        await evaluate(() => {
            const tmpl = document.querySelector('#work-area template')
            _hyperscript("render tmpl then put it into window.res", {
                locals: { tmpl }
            })
        })
        const res = await evaluate(() => window.res)
        expect(res).toBe('just plain text\n')
    })

    test('blank lines are consumed as whitespace', async ({html, evaluate}) => {
        await html('<template>a\n\nb\n</template>')
        await evaluate(() => {
            const tmpl = document.querySelector('#work-area template')
            _hyperscript("render tmpl then put it into window.res", {
                locals: { tmpl }
            })
        })
        const res = await evaluate(() => window.res)
        expect(res).toBe('a\nb\n')
    })

    test('renders into DOM element', async ({html, find, evaluate}) => {
        await html('<template><b>${x}</b></template><div id="target"></div>')
        await evaluate(() => {
            const tmpl = document.querySelector('#work-area template')
            const target = document.querySelector('#target')
            _hyperscript("render tmpl with x: x then put it into window.res", {
                locals: { x: "hello", tmpl }
            })
            target.innerHTML = window.res
        })
        await expect(find('#target b')).toHaveText('hello')
    })

    test('expression with math', async ({html, evaluate}) => {
        await html('<template>${x + y}</template>')
        await evaluate(() => {
            const tmpl = document.querySelector('#work-area template')
            _hyperscript("render tmpl with x: x, y: y then put it into window.res", {
                locals: { x: 10, y: 20, tmpl }
            })
        })
        const res = await evaluate(() => window.res)
        expect(res).toBe('30')
    })

    test('expression with function call', async ({html, evaluate}) => {
        await html('<template>${fn()}</template>')
        await evaluate(() => {
            window.testFn = () => "called"
            const tmpl = document.querySelector('#work-area template')
            _hyperscript("render tmpl with fn: fn then put it into window.res", {
                locals: { fn: window.testFn, tmpl }
            })
        })
        const res = await evaluate(() => window.res)
        expect(res).toBe('called')
    })

    test('if false takes else branch', async ({html, evaluate}) => {
        await html('<template>#if false\nyes\n#else\nno\n#end\n</template>')
        await evaluate(() => {
            const tmpl = document.querySelector('#work-area template')
            _hyperscript("render tmpl then put it into window.res", {
                locals: { tmpl }
            })
        })
        const res = await evaluate(() => window.res)
        expect(res).toBe('no\n')
    })

    test('if with expression condition', async ({html, evaluate}) => {
        await html('<template>#if x is greater than 5\nbig\n#else\nsmall\n#end\n</template>')
        await evaluate(() => {
            const tmpl = document.querySelector('#work-area template')
            _hyperscript("render tmpl with x: x then put it into window.res", {
                locals: { x: 10, tmpl }
            })
        })
        const res = await evaluate(() => window.res)
        expect(res).toBe('big\n')
    })

    test('for loop with index', async ({html, evaluate}) => {
        await html('<template>#for x in items\n${x}\n#end</template>')
        await evaluate(() => {
            const tmpl = document.querySelector('#work-area template')
            _hyperscript("render tmpl with items: items then put it into window.res", {
                locals: { items: ["a", "b", "c"], tmpl }
            })
        })
        const res = await evaluate(() => window.res)
        expect(res).toBe('a\nb\nc\n')
    })

    test('for loop over empty array', async ({html, evaluate}) => {
        await html('<template>before\n#for x in items\n${x}\n#end\nafter\n</template>')
        await evaluate(() => {
            const tmpl = document.querySelector('#work-area template')
            _hyperscript("render tmpl with items: items then put it into window.res", {
                locals: { items: [], tmpl }
            })
        })
        const res = await evaluate(() => window.res)
        expect(res).toBe('before\nafter\n')
    })

    test('all html entities escaped', async ({html, evaluate}) => {
        await html('<template>${x}</template>')
        await evaluate(() => {
            const tmpl = document.querySelector('#work-area template')
            _hyperscript("render tmpl with x: x then put it into window.res", {
                locals: { x: '<div class="a" data-x=\'b\'>&', tmpl }
            })
        })
        const res = await evaluate(() => window.res)
        expect(res).toBe('&lt;div class=&quot;a&quot; data-x=&#039;b&#039;&gt;&amp;')
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

    test('conditional with nested parens in value does not false-trigger on inner if', async ({html, evaluate}) => {
        await html('<template>${fn(x) if condition}</template>')
        await evaluate(() => {
            window.testFn = (v) => 'called:' + v
            const tmpl = document.querySelector('#work-area template')
            _hyperscript("render tmpl with fn: fn, x: x, condition: condition then put it into window.res", {
                locals: { fn: window.testFn, x: 42, condition: true, tmpl }
            })
        })
        const res = await evaluate(() => window.res)
        expect(res).toBe('called:42')
    })

    test('error inside for body is reported', async ({html, evaluate}) => {
        await html('<template>#for x in items\n${!!!}\n#end\n</template>')
        await evaluate(() => {
            var origError = console.error
            window.__capturedErrors = []
            console.error = function() { window.__capturedErrors.push(Array.from(arguments).join(' ')) }
            const tmpl = document.querySelector('#work-area template')
            _hyperscript("render tmpl with items: items then put it into window.res", {
                locals: { items: [1, 2], tmpl }
            })
            console.error = origError
        })
        const captured = await evaluate(() => window.__capturedErrors)
        expect(captured.length).toBeGreaterThan(0)
        expect(captured[0]).toContain('template error')
    })

    test('content after for...else still renders', async ({html, evaluate}) => {
        await html('<template>#for item in items\n${item}\n#else\nnothing\n#end\nafter\n</template>')
        await evaluate(() => {
            const tmpl = document.querySelector('#work-area template')
            _hyperscript("render tmpl with items: items then put it into window.res", {
                locals: { items: [], tmpl }
            })
        })
        const res = await evaluate(() => window.res)
        expect(res).toBe('nothing\nafter\n')
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
        expect(res).toBe('1\n')
    })
})
