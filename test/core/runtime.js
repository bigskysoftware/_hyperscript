import {test, expect} from '../fixtures.js'

test.describe("the _hyperscript runtime", () => {

	test("has proper stack", async ({html, evaluate}) => {
		await html(
			"<script type='text/hyperscript'>" +
				"def foo() " +
				"  return bar() " +
				"end " +
				"def bar() " +
				"  return meta.caller " +
				"end " +
				"</script>"
		);
		const name = await evaluate(() => foo().meta.feature.name);
		expect(name).toBe("foo");
	});

	test("has proper stack from event handler", async ({html, find, evaluate}) => {
		await html(
			"<script type='text/hyperscript'>" +
				"def bar() " +
				"  log meta.caller " +
				"  return meta.caller " +
				"end " +
				"</script>" +
				"<div _='on click put bar().meta.feature.type into my.innerHTML'></div>"
		);
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveText("onFeature");
	});

	test("hypertrace is reasonable", async ({html, find, evaluate}) => {
		await html(
			"<script type='text/hyperscript'>" +
				"def bar() " +
				"  call baz('nope') " +
				"end " +
				" " +
				"def baz(str) " +
				"  throw str " +
				"end " +
				"</script>" +
				"<div _='on click call bar()'></div>"
		);
		// Should not crash
		await find('div').dispatchEvent('click');
	});

	test("hypertrace from javascript is reasonable", async ({html, find, evaluate}) => {
		await evaluate(() => {
			window.baz = function (str) { throw new Error(str); };
		});
		await html(
			"<script type='text/hyperscript'>def bar() call baz('nope') end</script>" +
				"<div _='on click call bar()'></div>"
		);
		await find('div').dispatchEvent('click');
	});

	test("async hypertrace is reasonable", async ({html, find, evaluate}) => {
		await html(
			"<script type='text/hyperscript'>" +
				"def bar() " +
				"  call baz('nope') " +
				"end " +
				" " +
				"def baz(str) " +
				"  wait 20ms " +
				"  throw str " +
				"end " +
				"</script>" +
				"<div _='on click call bar()'></div>"
		);
		await find('div').dispatchEvent('click');
		// Just wait a bit for the async to complete without crashing
		await evaluate(() => new Promise(r => setTimeout(r, 100)));
	});

	test("arrays args are handled properly wrt Promises", async ({html, evaluate}) => {
		await html(
			"<script type='text/hyperscript'>" +
				"def invokesArrayPromise() " +
				"  return {" +
				"            foo: stringPromise()," +
				"            bar: stringPromise()," +
				"            baz: stringPromise()" +
			    "         }" +
				"end " +
				" " +
				"def stringPromise() " +
				"  wait 20ms " +
				"  return 'foo' " +
				"end " +
				"</script>"
		);
		const result = await evaluate(() => invokesArrayPromise());
		expect(result.foo).toBe('foo');
		expect(result.bar).toBe('foo');
		expect(result.baz).toBe('foo');
	});

	test("scalar args are handled properly wrt Promises", async ({html, evaluate}) => {
		await html(
			"<script type='text/hyperscript'>" +
				"def invokesScalarPromise() " +
				"  return stringPromise()" +
				"end " +
				" " +
				"def stringPromise() " +
				"  wait 20ms " +
				"  return 'foo' " +
				"end " +
				"</script>"
		);
		const result = await evaluate(() => invokesScalarPromise());
		expect(result).toBe('foo');
	});
});
