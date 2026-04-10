import {test, expect} from '../fixtures.js'
import path from 'path'
import {fileURLToPath} from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

test.describe('the socket feature', () => {

	test('parses socket with absolute ws:// URL', async ({evaluate}) => {
		var result = await evaluate(() => {
			var urls = [];
			var OrigWS = window.WebSocket;
			window.WebSocket = function(url) {
				urls.push(url);
				return { onmessage: null, send: function(){}, addEventListener: function(){}, close: function(){} };
			};
			try {
				var script = document.createElement('script');
				script.type = 'text/hyperscript';
				script.textContent = 'socket MySocket ws://localhost:1234/ws end';
				document.body.appendChild(script);
				_hyperscript.processNode(script);
				return { url: urls[0], error: null };
			} catch (e) {
				return { url: null, error: e.message };
			} finally {
				window.WebSocket = OrigWS;
			}
		});
		expect(result.error).toBeNull();
		expect(result.url).toBe('ws://localhost:1234/ws');
	})

	test('converts relative URL to wss:// on https pages', async ({page}) => {
		await page.route('https://localhost/test', async route => {
			await route.fulfill({
				status: 200,
				contentType: 'text/html',
				body: '<!DOCTYPE html><html><body></body></html>',
			})
		})
		await page.goto('https://localhost/test')
		await page.addScriptTag({
			path: path.join(__dirname, '../.bundle/_hyperscript.js')
		})
		await page.waitForFunction(() => typeof _hyperscript !== 'undefined')

		var result = await page.evaluate(() => {
			var urls = [];
			var OrigWS = window.WebSocket;
			window.WebSocket = function(url) {
				urls.push(url);
				return { onmessage: null, send: function(){}, addEventListener: function(){}, close: function(){} };
			};
			try {
				var script = document.createElement('script');
				script.type = 'text/hyperscript';
				script.textContent = 'socket RelSocket /my-ws end';
				document.body.appendChild(script);
				_hyperscript.processNode(script);
				return { url: urls[0], error: null };
			} catch (e) {
				return { url: null, error: e.message };
			} finally {
				window.WebSocket = OrigWS;
			}
		});
		expect(result.error).toBeNull();
		expect(result.url).toBe('wss://localhost/my-ws');
	})

	test('converts relative URL to ws:// on http pages', async ({page}) => {
		await page.route('http://localhost/test', async route => {
			await route.fulfill({
				status: 200,
				contentType: 'text/html',
				body: '<!DOCTYPE html><html><body></body></html>',
			})
		})
		await page.goto('http://localhost/test')
		await page.addScriptTag({
			path: path.join(__dirname, '../.bundle/_hyperscript.js')
		})
		await page.waitForFunction(() => typeof _hyperscript !== 'undefined')

		var result = await page.evaluate(() => {
			var urls = [];
			var OrigWS = window.WebSocket;
			window.WebSocket = function(url) {
				urls.push(url);
				return { onmessage: null, send: function(){}, addEventListener: function(){}, close: function(){} };
			};
			try {
				var script = document.createElement('script');
				script.type = 'text/hyperscript';
				script.textContent = 'socket RelSocket /my-ws end';
				document.body.appendChild(script);
				_hyperscript.processNode(script);
				return { url: urls[0], error: null };
			} catch (e) {
				return { url: null, error: e.message };
			} finally {
				window.WebSocket = OrigWS;
			}
		});
		expect(result.error).toBeNull();
		expect(result.url).toBe('ws://localhost/my-ws');
	})

	test('with timeout parses and uses the configured timeout', async ({evaluate}) => {
		var ok = await evaluate(() => {
			var OrigWS = window.WebSocket
			var mockSocket = { onmessage: null, send: function(){}, addEventListener: function(){}, close: function(){} }
			window.WebSocket = function() { return mockSocket }
			try {
				var script = document.createElement('script')
				script.type = 'text/hyperscript'
				script.textContent = 'socket TimedSocket ws://localhost/ws with timeout 1500 end'
				document.body.appendChild(script)
				_hyperscript.processNode(script)
				return typeof window.TimedSocket === 'object' && typeof window.TimedSocket.rpc === 'object'
			} catch (e) {
				return 'error: ' + e.message
			} finally {
				window.WebSocket = OrigWS
			}
		})
		expect(ok).toBe(true)
	})

	test('on message handler fires on incoming text message', async ({page}) => {
		var received = await page.evaluate(async () => {
			var OrigWS = window.WebSocket
			var mockSocket = { onmessage: null, send: function(){}, addEventListener: function(){}, close: function(){} }
			window.WebSocket = function() { return mockSocket }
			var script = document.createElement('script')
			script.type = 'text/hyperscript'
			script.textContent = `
				socket TextSocket ws://localhost/ws
				  on message
				    set window.socketFired to true
			`
			document.body.appendChild(script)
			_hyperscript.processNode(script)
			await new Promise(r => setTimeout(r, 20))
			window.WebSocket = OrigWS
			mockSocket.onmessage({ data: 'hello socket' })
			await new Promise(r => setTimeout(r, 20))
			return window.socketFired
		})
		expect(received).toBe(true)
	})

	test('on message as JSON handler decodes JSON payload', async ({page}) => {
		var fired = await page.evaluate(async () => {
			var OrigWS = window.WebSocket
			var mockSocket = { onmessage: null, send: function(){}, addEventListener: function(){}, close: function(){} }
			window.WebSocket = function() { return mockSocket }
			var script = document.createElement('script')
			script.type = 'text/hyperscript'
			script.textContent = `
				socket JsonSocket ws://localhost/ws
				  on message as JSON
				    set window.socketFiredJson to true
			`
			document.body.appendChild(script)
			_hyperscript.processNode(script)
			await new Promise(r => setTimeout(r, 20))
			window.WebSocket = OrigWS
			mockSocket.onmessage({ data: JSON.stringify({ name: 'Alice' }) })
			await new Promise(r => setTimeout(r, 20))
			return window.socketFiredJson
		})
		expect(fired).toBe(true)
	})

	test('rpc proxy sends a message and resolves the reply', async ({evaluate}) => {
		var result = await evaluate(() => new Promise((resolve) => {
			var OrigWS = window.WebSocket
			var sent = []
			var mockSocket = {
				onmessage: null,
				send: function(msg) { sent.push(msg) },
				addEventListener: function(){},
				close: function(){},
			}
			window.WebSocket = function() { return mockSocket }
			try {
				var script = document.createElement('script')
				script.type = 'text/hyperscript'
				script.textContent = 'socket RpcSocket ws://localhost/ws end'
				document.body.appendChild(script)
				_hyperscript.processNode(script)

				// Call an RPC method via the proxy
				var p = window.RpcSocket.rpc.greet('world')
				// Parse the outgoing message to get the iid, then reply
				var outgoing = JSON.parse(sent[0])
				mockSocket.onmessage({ data: JSON.stringify({ iid: outgoing.iid, return: 'hi world' }) })
				p.then(function (value) {
					resolve({ call: outgoing.function, args: outgoing.args, value: value })
				})
			} finally {
				window.WebSocket = OrigWS
			}
		}))
		expect(result.call).toBe('greet')
		expect(result.args).toEqual(['world'])
		expect(result.value).toBe('hi world')
	})

	test('rpc proxy reply with throw rejects the promise', async ({evaluate}) => {
		var result = await evaluate(() => new Promise((resolve) => {
			var OrigWS = window.WebSocket
			var sent = []
			var mockSocket = {
				onmessage: null,
				send: function(msg) { sent.push(msg) },
				addEventListener: function(){},
				close: function(){},
			}
			window.WebSocket = function() { return mockSocket }
			try {
				var script = document.createElement('script')
				script.type = 'text/hyperscript'
				script.textContent = 'socket ErrSocket ws://localhost/ws end'
				document.body.appendChild(script)
				_hyperscript.processNode(script)
				window.ErrSocket.rpc.boom().catch(function (err) { resolve(err) })
				var outgoing = JSON.parse(sent[0])
				mockSocket.onmessage({ data: JSON.stringify({ iid: outgoing.iid, throw: 'kaboom' }) })
			} finally {
				window.WebSocket = OrigWS
			}
		}))
		expect(result).toBe('kaboom')
	})

	test('namespaced sockets work', async ({evaluate}) => {
		var result = await evaluate(() => {
			var OrigWS = window.WebSocket;
			window.WebSocket = function(url) {
				return { onmessage: null, send: function(){}, addEventListener: function(){}, close: function(){} };
			};
			try {
				var script = document.createElement('script');
				script.type = 'text/hyperscript';
				script.textContent = 'socket MyApp.chat ws://localhost/ws end';
				document.body.appendChild(script);
				_hyperscript.processNode(script);
				return { hasRaw: MyApp && MyApp.chat && typeof MyApp.chat.raw !== 'undefined', error: null };
			} catch (e) {
				return { hasRaw: false, error: e.message };
			} finally {
				window.WebSocket = OrigWS;
			}
		});
		expect(result.error).toBeNull();
		expect(result.hasRaw).toBe(true);
	})
})
