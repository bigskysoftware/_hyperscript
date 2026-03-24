import {test, expect} from '../fixtures.js'

test.describe("the if command", () => {

	test("basic true branch works", async ({html, find}) => {
		await html("<div _='on click if true put \"foo\" into me.innerHTML'></div>");
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveText("foo");
	});

	test("basic true branch works with multiple commands", async ({html, find}) => {
		await html(
			"<div _='on click if true log me then " +
				'                                  put "foo" into me.innerHTML\'></div>'
		);
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveText("foo");
	});

	test("basic true branch works with end", async ({html, find}) => {
		await html("<div _='on click if true put \"foo\" into me.innerHTML end'></div>");
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveText("foo");
	});

	test("basic true branch works with naked else", async ({html, find}) => {
		await html("<div _='on click if true put \"foo\" into me.innerHTML else'></div>");
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveText("foo");
	});

	test("basic true branch works with naked else end", async ({html, find}) => {
		await html("<div _='on click if true put \"foo\" into me.innerHTML else end'></div>");
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveText("foo");
	});

	test("basic else branch works", async ({html, find}) => {
		await html("<div _='on click if false else put \"foo\" into me.innerHTML'></div>");
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveText("foo");
	});

	test("basic else branch works with end", async ({html, find}) => {
		await html("<div _='on click if false else put \"foo\" into me.innerHTML end'></div>");
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveText("foo");
	});

	test("basic else if branch works", async ({html, find}) => {
		await html("<div _='on click if false else if true put \"foo\" into me.innerHTML'></div>");
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveText("foo");
	});

	test("basic else if branch works with end", async ({html, find}) => {
		await html(
			"<div _='on click if false " +
				'                                  else if true put "foo" into me.innerHTML end\'></div>'
		);
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveText("foo");
	});

	test("otherwise alias works", async ({html, find}) => {
		await html("<div _='on click if false otherwise put \"foo\" into me.innerHTML'></div>");
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveText("foo");
	});

	test("triple else if branch works", async ({html, find}) => {
		await html("<div _='on click if false else if false else put \"foo\" into me.innerHTML'></div>");
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveText("foo");
	});

	test("triple else if branch works with end", async ({html, find}) => {
		await html(
			"<div _='on click if false " +
				"                                  else if false" +
				'                                  else put "foo" into me.innerHTML end\'></div>'
		);
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveText("foo");
	});

	test("basic else branch works with multiple commands", async ({html, find}) => {
		await html(
			'<div _=\'on click if false put "bar" into me.innerHTML' +
				"                                  else log me then" +
				'                                       put "foo" into me.innerHTML\'></div>'
		);
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveText("foo");
	});

	test("true branch with a wait works", async ({html, find}) => {
		await html("<div _='on click if true wait 10 ms then put \"foo\" into me.innerHTML'></div>");
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveText("foo");
	});

	test("false branch with a wait works", async ({html, find}) => {
		await html("<div _='on click if false else wait 10 ms then put \"foo\" into me.innerHTML'></div>");
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveText("foo");
	});

	test("if properly passes execution along if child is not executed", async ({html, find}) => {
		await html("<div _='on click if false end put \"foo\" into me.innerHTML'></div>");
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveText("foo");
	});

	test("if properly supports nested if statements and end block", async ({html, find, evaluate}) => {
		await evaluate(() => window.tmp = false);
		await html("<div _='on click \n" +
			"                      if window.tmp then\n" +
			"                        put \"foo\" into me\n" +
			"                      else if not window.tmp then\n" +
			"                        // do nothing\n" +
			"                      end\n" +
			"                  catch e\n" +
			"                      // just here for the parsing...\n'" +
			"</div>");
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveText("");

		await evaluate(() => window.tmp = true);
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveText("foo");
	});

	test("if on new line does not join w/ else", async ({html, find, evaluate}) => {
		await evaluate(() => window.tmp = false);
		await html("<div _='on click \n" +
			"                      if window.tmp then\n" +
			"                      else\n" +
			"                        if window.tmp then" +
			"                        end\n" +
			"                        put \"foo\" into me\n" +
			"                      end\n" +
			"                  '" +
			"</div>");
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveText("foo");

		await evaluate(() => window.tmp = true);
		await evaluate(() => document.querySelector('#work-area div').innerHTML = "");
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveText("");
	});

	test("passes the sieve test", async ({run}) => {
		var str =
			"if x is less than 10\n" +
			"  if x is less than 3\n" +
			"    if x is less than 2\n" +
			"      return 1\n" +
			"    else\n" +
			"      return 2\n" +
			"    end\n" +
			"  else if x is less than 4\n" +
			"      return 3\n" +
			"  else if x is 4\n" +
			"    return 4\n" +
			"  else\n" +
			"    if x is 5\n" +
			"       return 5\n" +
			"    else\n" +
			"       return 6\n" +
			"    end\n" +
			"  end\n" +
			"else\n" +
			"  return 10\n" +
			"end";

		expect(await run(str, {locals: {x: 1}})).toBe(1);
		expect(await run(str, {locals: {x: 2}})).toBe(2);
		expect(await run(str, {locals: {x: 3}})).toBe(3);
		expect(await run(str, {locals: {x: 4}})).toBe(4);
		expect(await run(str, {locals: {x: 5}})).toBe(5);
		expect(await run(str, {locals: {x: 6}})).toBe(6);
		expect(await run(str, {locals: {x: 7}})).toBe(6);
		expect(await run(str, {locals: {x: 8}})).toBe(6);
		expect(await run(str, {locals: {x: 9}})).toBe(6);
		expect(await run(str, {locals: {x: 10}})).toBe(10);
		expect(await run(str, {locals: {x: 11}})).toBe(10);
	});

});
