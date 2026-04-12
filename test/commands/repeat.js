import {test, expect} from '../fixtures.js'

test.describe("the repeat command", () => {

	test("basic for loop works", async ({html, find}) => {
		await html(
			"<div _='on click repeat for x in [1, 2, 3]" +
				"                                    put x at end of me" +
				"                                  end'></div>"
		);
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveText("123");
	});

	test("basic for loop with null works", async ({html, find}) => {
		await html(
			"<div _='on click repeat for x in null" +
				"                                    put x at end of me" +
				"                                  end'></div>"
		);
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveText("");
	});

	test("waiting in for loop works", async ({html, find}) => {
		await html(
			"<div _='on click repeat for x in [1, 2, 3]\n" +
				"                                    log me " +
				"                                    put x at end of me\n" +
				"                                    wait 1ms\n" +
				"                                  end'></div>"
		);
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveText("123");
	});

	test("basic raw for loop works", async ({html, find}) => {
		await html(
			"<div _='on click for x in [1, 2, 3]" +
				"                                    put x at end of me" +
				"                                  end'></div>"
		);
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveText("123");
	});

	test("basic raw for loop with null works", async ({html, find}) => {
		await html(
			"<div _='on click for x in null" +
				"                                    put x at end of me" +
				"                                  end'></div>"
		);
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveText("");
	});

	test("waiting in raw for loop works", async ({html, find}) => {
		await html(
			"<div _='on click for x in [1, 2, 3]\n" +
				"                                    put x at end of me\n" +
				"                                    wait 1ms\n" +
				"                                  end'></div>"
		);
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveText("123");
	});

	test("repeat forever works", async ({html, find}) => {
		await html(
			"<script type='text/hyperscript'>" +
				"  def repeatForeverWithReturn()" +
				"    set retVal to 0" +
				"    repeat forever" +
				"       set retVal to retVal + 1" +
				"       if retVal == 5 then" +
				"         return retVal" +
				"       end" +
				"    end" +
				"  end" +
				"</script>" +
				"<div id='d1' _='on click put repeatForeverWithReturn() into my.innerHTML'></div>"
		);
		await find('#d1').dispatchEvent('click');
		await expect(find('#d1')).toHaveText("5");
	});

	test("repeat forever works w/o keyword", async ({html, find}) => {
		await html(
			"<script type='text/hyperscript'>" +
				"  def repeatForeverWithReturn()" +
				"    set retVal to 0" +
				"    repeat" +
				"       set retVal to retVal + 1" +
				"       if retVal == 5 then" +
				"         return retVal" +
				"       end" +
				"    end" +
				"  end" +
				"</script>" +
				"<div id='d1' _='on click put repeatForeverWithReturn() into my.innerHTML'></div>"
		);
		await find('#d1').dispatchEvent('click');
		await expect(find('#d1')).toHaveText("5");
	});

	test("basic in loop works", async ({html, find}) => {
		await html(
			"<div _='on click repeat in [1, 2, 3]" +
				"                                    put it at end of me" +
				"                                  end'></div>"
		);
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveText("123");
	});

	test("index syntax works", async ({html, find}) => {
		await html(
			'<div _=\'on click repeat for x in ["a", "ab", "abc"] index i' +
				"                                    put x + i at end of me" +
				"                                  end'></div>"
		);
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveText("a0ab1abc2");
	});

	test("indexed by syntax works", async ({html, find}) => {
		await html(
			'<div _=\'on click repeat for x in ["a", "ab", "abc"] indexed by i' +
				"                                    put x + i at end of me" +
				"                                  end'></div>"
		);
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveText("a0ab1abc2");
	});

	test("while keyword works", async ({html, find}) => {
		await html(
			"<script type='text/hyperscript'>" +
				"  def repeatWhileTest()" +
				"    set retVal to 0" +
				"    repeat while retVal < 5" +
				"       set retVal to retVal + 1" +
				"    end" +
				"    return retVal" +
				"  end" +
				"</script>" +
				"<div id='d1' _='on click put repeatWhileTest() into my.innerHTML'></div>"
		);
		await find('#d1').dispatchEvent('click');
		await expect(find('#d1')).toHaveText("5");
	});

	test("until keyword works", async ({html, find}) => {
		await html(
			"<script type='text/hyperscript'>" +
				"  def repeatUntilTest()" +
				"    set retVal to 0" +
				"    repeat until retVal == 5" +
				"       set retVal to retVal + 1" +
				"    end" +
				"    return retVal" +
				"  end" +
				"</script>" +
				"<div id='d1' _='on click put repeatUntilTest() into my.innerHTML'></div>"
		);
		await find('#d1').dispatchEvent('click');
		await expect(find('#d1')).toHaveText("5");
	});

	test("until event keyword works", async ({html, find, evaluate}) => {
		await html(
			"<div id='untilTest'></div>" +
				"<script type='text/hyperscript'>" +
				"  def repeatUntilTest()" +
				"    repeat until event click from #untilTest" +
				"      wait 2ms" +
				"    end" +
				"    return 42" +
				"  end" +
				"</script>"
		);
		await evaluate(() => {
			window._testPromise = repeatUntilTest();
		});
		await evaluate(() => document.querySelector('#untilTest').click());
		const value = await evaluate(() => window._testPromise);
		expect(value).toBe(42);
	});

	test("only executes the init expression once", async ({html, find, evaluate}) => {
		await html(
			"<script type='text/hyperscript'>" +
				"  def getArray()" +
				"    set window.called to (window.called or 0) + 1" +
				"    return [1, 2, 3]" +
				"  end" +
				"</script>" +
				"<div id='d1' _='on click for x in getArray() put x into my.innerHTML end'></div>"
		);
		await find('#d1').dispatchEvent('click');
		await expect(find('#d1')).toHaveText("3");
		expect(await evaluate(() => window.called)).toBe(1);
	});

	test("can nest loops", async ({html, find}) => {
		await html(
			"<script type='text/hyperscript'>" +
				"  def sprayInto(elt)" +
				"    for x in [1, 2, 3]" +
				"      for y in [1, 2, 3]" +
				"        put x * y at end of elt" +
				"      end" +
				"    end" +
				"  end" +
				"</script>" +
				"<div id='d1' _='on click call sprayInto(me)'></div>"
		);
		await find('#d1').dispatchEvent('click');
		await expect(find('#d1')).toHaveText("123246369");
	});

	test("basic times loop works", async ({html, find}) => {
		await html(
			"<div _='on click repeat 3 times" +
				'                                    put "a" at end of me' +
				"                                  end'></div>"
		);
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveText("aaa");
	});

	test("times loop with expression works", async ({html, find}) => {
		await html(
			"<div _='on click repeat 3 + 3 times" +
				'                                    put "a" at end of me' +
				"                                  end'></div>"
		);
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveText("aaaaaa");
	});

	test("loop continue works", async ({html, find}) => {
		await html(
			`<div _="on click
				repeat 2 times
					for x in ['A', 'B', 'C', 'D']
						if (x != 'D') then
							put 'success ' + x  + '. ' at end of me
							continue
							put 'FAIL!!. ' at end of me
						end
						put 'expected D. ' at end of me
					end
				end
			"></div>`);
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveText("success A. success B. success C. expected D. success A. success B. success C. expected D. ");
	});

	test("loop break works", async ({html, find}) => {
		await html(
			`<div _="on click
				repeat 2 times
					for x in ['A', 'B', 'C', 'D']
						if x is 'C'
						  break
						end
						put x at end of me
					end
				end
			"></div>`);
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveText("ABAB");
	});

	test("basic property for loop works", async ({html, find}) => {
		await html(
			"<div _='on click set x to {foo:1, bar:2, baz:3}" +
			"                 for prop in x " +
			"                   put x[prop] at end of me" +
			"                 end'></div>"
		);
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveText("123");
	});

	test("bottom-tested repeat until", async ({html, find}) => {
		await html(
			"<div _='on click set x to 0 " +
			"                 repeat " +
			"                   set x to x + 1 " +
			"                 until x is 3 end " +
			"                 put x into me'></div>"
		);
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveText("3");
	});

	test("bottom-tested repeat while", async ({html, find}) => {
		await html(
			"<div _='on click set x to 0 " +
			"                 repeat " +
			"                   set x to x + 1 " +
			"                 while x < 3 end " +
			"                 put x into me'></div>"
		);
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveText("3");
	});

	test("bottom-tested loop always runs at least once", async ({html, find}) => {
		await html(
			"<div _='on click set x to 0 " +
			"                 repeat " +
			"                   set x to x + 1 " +
			"                 until true end " +
			"                 put x into me'></div>"
		);
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveText("1");
	});

	test("break exits a simple repeat loop", async ({html, find}) => {
		await html(
			`<div _="on click
				set x to 0
				repeat 10 times
					set x to x + 1
					if x is 3 break end
				end
				put x into me
			"></div>`);
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveText("3");
	});

	test("continue skips rest of iteration in simple repeat loop", async ({html, find}) => {
		await html(
			`<div _="on click
				repeat for x in [1, 2, 3, 4, 5]
					if x is 3 continue end
					put x at end of me
				end
			"></div>`);
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveText("1245");
	});

	test("break exits a for-in loop", async ({html, find}) => {
		await html(
			`<div _="on click
				repeat for x in [1, 2, 3, 4, 5]
					if x is 4 break end
					put x at end of me
				end
			"></div>`);
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveText("123");
	});

	test("break exits a while loop", async ({html, find}) => {
		await html(
			`<div _="on click
				set x to 0
				repeat while x < 100
					set x to x + 1
					if x is 5 break end
				end
				put x into me
			"></div>`);
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveText("5");
	});

	test("for loop over undefined skips without error", async ({html, find}) => {
		await html(
			"<div _='on click repeat for x in doesNotExist put x at end of me end then put \"done\" into me'></div>"
		);
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveText("done");
	});

	test("where clause can use the for loop variable name", async ({html, find}) => {
		await html(`<div _="on click
		                       set :items to [{name:'a', val:5}, {name:'b', val:15}, {name:'c', val:25}]
		                       repeat for x in :items where x.val > 10
		                         put x.name at end of me
		                       end"></div>`);
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveText("bc");
	});
});
