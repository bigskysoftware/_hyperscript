import {test, expect} from '../fixtures.js'

test.describe("the fetch command", () => {

	test("can do a simple fetch", async ({html, find, mock}) => {
		await mock('GET', '/test', 'yay', {status: 200, contentType: 'text/html'});
		await html("<div _='on click fetch \"/test\" then put it into my.innerHTML'></div>");
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveText("yay");
	});

	test("can do a simple fetch w/ a naked URL", async ({html, find, mock}) => {
		await mock('GET', '/test', 'yay', {status: 200, contentType: 'text/html'});
		await html("<div _='on click fetch /test then put it into my.innerHTML'></div>");
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveText("yay");
	});

	test("can do a simple fetch w/ html", async ({html, find, mock}) => {
		await mock('GET', '/test', '<br>', {status: 200, contentType: 'text/html'});
		await html(
			"<div _='on click fetch /test as html then log it then put it into my.innerHTML put its childElementCount into my @data-count'></div>"
		);
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveText("[object DocumentFragment]");
		await expect(find('div')).toHaveAttribute('data-count', '1');
	});

	test("can do a simple fetch w/ json", async ({html, find, mock}) => {
		await mock('GET', '/test', '{"foo":1}', {status: 200, contentType: 'application/json'});
		await html(
			"<div _='on click fetch /test as json then get result as JSONString then put it into my.innerHTML'></div>"
		);
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveText('{"foo":1}');
	});

	test("can do a simple fetch w/ json using JSON syntax", async ({html, find, mock}) => {
		await mock('GET', '/test', '{"foo":1}', {status: 200, contentType: 'application/json'});
		await html(
			"<div _='on click fetch /test as JSON then get result as JSONString then put it into my.innerHTML'></div>"
		);
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveText('{"foo":1}');
	});

	test("can do a simple fetch w/ json using Object syntax", async ({html, find, mock}) => {
		await mock('GET', '/test', '{"foo":1}', {status: 200, contentType: 'application/json'});
		await html(
			"<div _='on click fetch /test as Object then get result as JSONString then put it into my.innerHTML'></div>"
		);
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveText('{"foo":1}');
	});

	test("can do a simple fetch w/ json using Object syntax and an 'an' prefix", async ({html, find, mock}) => {
		await mock('GET', '/test', '{"foo":1}', {status: 200, contentType: 'application/json'});
		await html(
			"<div _='on click fetch /test as an Object then get result as JSONString then put it into my.innerHTML'></div>"
		);
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveText('{"foo":1}');
	});

	test("can do a simple fetch with a response object", async ({html, find, mock}) => {
		await mock('GET', '/test', '{"foo":1}', {status: 200, contentType: 'application/json'});
		await html("<div _='on click fetch /test as response then if its.ok put \"yep\" into my.innerHTML'></div>");
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveText("yep");
	});

	test("can do a simple fetch w/ a custom conversion", async ({html, find, mock}) => {
		await mock('GET', '/test', '1.2000', {status: 200, contentType: 'text/plain'});
		await html("<div _='on click fetch /test as Number then put it into my.innerHTML'></div>");
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveText("1.2");
	});

	test("can do a simple post", async ({html, find, mock}) => {
		await mock('POST', '/test', 'yay', {status: 200, contentType: 'text/html'});
		await html("<div _='on click fetch /test {method:\"POST\"} then put it into my.innerHTML'></div>");
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveText("yay");
	});

	test("can do a simple post alt syntax without curlies", async ({html, find, mock}) => {
		await mock('POST', '/test', 'yay', {status: 200, contentType: 'text/html'});
		await html("<div _='on click fetch /test with method:\"POST\" then put it into my.innerHTML'></div>");
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveText("yay");
	});

	test("can do a simple post alt syntax w/ curlies", async ({html, find, mock}) => {
		await mock('POST', '/test', 'yay', {status: 200, contentType: 'text/html'});
		await html("<div _='on click fetch /test with {method:\"POST\"} then put it into my.innerHTML'></div>");
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveText("yay");
	});

	test("can put response conversion after with", async ({html, find, mock}) => {
		await mock('POST', '/test', 'yay', {status: 200, contentType: 'text/html'});
		await html("<div _='on click fetch /test with {method:\"POST\"} as text then put it into my.innerHTML'></div>");
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveText("yay");
	});

	test("can put response conversion before with", async ({html, find, mock}) => {
		await mock('POST', '/test', 'yay', {status: 200, contentType: 'text/html'});
		await html("<div _='on click fetch /test as text with {method:\"POST\"} then put it into my.innerHTML'></div>");
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveText("yay");
	});

	test("triggers an event just before fetching", async ({html, find, mock, evaluate}) => {
		await mock('GET', '/test', 'yay', {status: 200, contentType: 'text/html'});
		await evaluate(() => {
			window.addEventListener('hyperscript:beforeFetch', (event) => {
				event.target.className = "foo-set";
			});
		});
		await html("<div _='on click fetch \"/test\" then put it into my.innerHTML end'></div>");
		await expect(find('div')).not.toHaveClass(/foo-set/);
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveClass(/foo-set/);
		await expect(find('div')).toHaveText("yay");
	});

	test("submits the fetch parameters to the event handler", async ({html, find, mock, evaluate}) => {
		await mock('GET', '/test', 'yay', {status: 200, contentType: 'text/html'});
		await evaluate(() => {
			window.headerCheckPassed = false;
			window.addEventListener('hyperscript:beforeFetch', (event) => {
				if (event.detail.headers && event.detail.headers['X-CustomHeader'] === 'foo') {
					window.headerCheckPassed = true;
				}
			});
		});
		await html("<div _='on click fetch \"/test\" {headers: {\"X-CustomHeader\": \"foo\"}} then put it into my.innerHTML end'></div>");
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveText("yay");
		expect(await evaluate(() => window.headerCheckPassed)).toBe(true);
	});

	test("allows the event handler to change the fetch parameters", async ({html, find, evaluate, page}) => {
		await evaluate(() => {
			window.addEventListener('hyperscript:beforeFetch', (event) => {
				event.detail.headers = {'X-CustomHeader': 'foo'};
			});
		});
		await page.route('**/test', async (route) => {
			const headers = route.request().headers();
			if (headers['x-customheader'] === 'foo') {
				await route.fulfill({status: 200, contentType: 'text/html', body: 'yay'});
			} else {
				await route.fulfill({status: 200, contentType: 'text/html', body: 'no header'});
			}
		});
		await html("<div _='on click fetch \"/test\" then put it into my.innerHTML end'></div>");
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveText("yay");
	});

	test("can catch an error that occurs when using fetch", async ({html, find, page}) => {
		await page.route('**/test', async (route) => {
			await route.abort();
		});
		await html("<div _='on click fetch /test catch e log e put \"yay\" into me'></div>");
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveText("yay");
	});

	test("throws on non-2xx response by default", async ({html, find, page}) => {
		await page.route('**/test', async (route) => {
			await route.fulfill({ status: 404, body: 'not found' });
		});
		await html("<div _='on click fetch /test catch e put \"caught\" into me'></div>");
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveText("caught");
	});

	test("do not throw passes through 404 response", async ({html, find, page}) => {
		await page.route('**/test', async (route) => {
			await route.fulfill({ status: 404, body: 'the body' });
		});
		await html("<div _='on click fetch /test do not throw then put it into me'></div>");
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveText("the body");
	});

	test("don't throw passes through 404 response", async ({html, find, page}) => {
		await page.route('**/test', async (route) => {
			await route.fulfill({ status: 404, body: 'the body' });
		});
		await html('<div _="on click fetch /test don\'t throw then put it into me"></div>');
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveText("the body");
	});

	test("as response does not throw on 404", async ({html, find, page}) => {
		await page.route('**/test', async (route) => {
			await route.fulfill({ status: 404, body: 'not found' });
		});
		await html("<div _='on click fetch /test as response then put it.status into me'></div>");
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveText("404");
	});

	test("Response can be converted to JSON via as JSON", async ({html, find, page}) => {
		await page.route('**/test', async (route) => {
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({ name: "Joe" })
			});
		});
		await html("<div _=\"on click fetch /test as Response then put (it as JSON).name into me\"></div>");
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveText("Joe");
	});

});
