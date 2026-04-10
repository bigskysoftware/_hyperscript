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

	test('rpc proxy noTimeout avoids timeout rejection', async ({evaluate}) => {
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
				script.textContent = 'socket NoTOSocket ws://localhost/ws with timeout 20 end'
				document.body.appendChild(script)
				_hyperscript.processNode(script)

				var settled = false
				var p = window.NoTOSocket.rpc.noTimeout.slowCall('x')
				p.then(function (v) { settled = true; resolve({ kind: 'resolved', value: v }) })
				 .catch(function (e) { settled = true; resolve({ kind: 'rejected', err: e }) })

				setTimeout(function () {
					if (!settled) {
						var outgoing = JSON.parse(sent[0])
						mockSocket.onmessage({ data: JSON.stringify({ iid: outgoing.iid, return: 'late' }) })
					}
				}, 80)
			} finally {
				window.WebSocket = OrigWS
			}
		}))
		expect(result.kind).toBe('resolved')
		expect(result.value).toBe('late')
	})

	test('rpc proxy timeout(n) rejects after a custom window', async ({evaluate}) => {
		var result = await evaluate(() => new Promise((resolve) => {
			var OrigWS = window.WebSocket
			var mockSocket = {
				onmessage: null,
				send: function(){},
				addEventListener: function(){},
				close: function(){},
			}
			window.WebSocket = function() { return mockSocket }
			try {
				var script = document.createElement('script')
				script.type = 'text/hyperscript'
				script.textContent = 'socket CustomTOSocket ws://localhost/ws with timeout 60000 end'
				document.body.appendChild(script)
				_hyperscript.processNode(script)

				window.CustomTOSocket.rpc.timeout(50).willTimeOut()
					.then(function () { resolve({ kind: 'resolved' }) })
					.catch(function (e) { resolve({ kind: 'rejected', err: e }) })
			} finally {
				window.WebSocket = OrigWS
			}
		}))
		expect(result.kind).toBe('rejected')
		expect(result.err).toBe('Timed out')
	})

	test('rpc proxy default timeout rejects the promise', async ({evaluate}) => {
		var result = await evaluate(() => new Promise((resolve) => {
			var OrigWS = window.WebSocket
			var mockSocket = {
				onmessage: null,
				send: function(){},
				addEventListener: function(){},
				close: function(){},
			}
			window.WebSocket = function() { return mockSocket }
			try {
				var script = document.createElement('script')
				script.type = 'text/hyperscript'
				script.textContent = 'socket DefTOSocket ws://localhost/ws with timeout 50 end'
				document.body.appendChild(script)
				_hyperscript.processNode(script)

				window.DefTOSocket.rpc.neverReplies()
					.then(function () { resolve({ kind: 'resolved' }) })
					.catch(function (e) { resolve({ kind: 'rejected', err: e }) })
			} finally {
				window.WebSocket = OrigWS
			}
		}))
		expect(result.kind).toBe('rejected')
		expect(result.err).toBe('Timed out')
	})

	test('rpc proxy blacklists then/catch/length/toJSON', async ({evaluate}) => {
		var result = await evaluate(() => {
			var OrigWS = window.WebSocket
			window.WebSocket = function() {
				return { onmessage: null, send: function(){}, addEventListener: function(){}, close: function(){} }
			}
			try {
				var script = document.createElement('script')
				script.type = 'text/hyperscript'
				script.textContent = 'socket BlacklistSocket ws://localhost/ws end'
				document.body.appendChild(script)
				_hyperscript.processNode(script)
				return {
					then: window.BlacklistSocket.rpc.then,
					catch: window.BlacklistSocket.rpc.catch,
					length: window.BlacklistSocket.rpc.length,
					toJSON: window.BlacklistSocket.rpc.toJSON,
				}
			} finally {
				window.WebSocket = OrigWS
			}
		})
		expect(result.then).toBeNull()
		expect(result.catch).toBeNull()
		expect(result.length).toBeNull()
		expect(result.toJSON).toBeNull()
	})

	test('dispatchEvent sends JSON-encoded event over the socket', async ({evaluate}) => {
		var payload = await evaluate(() => {
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
				script.textContent = 'socket DispatchSocket ws://localhost/ws end'
				document.body.appendChild(script)
				_hyperscript.processNode(script)

				var evt = new CustomEvent('ping', {
					detail: { n: 1, msg: 'hi', sender: 'internal', _namedArgList_: 'internal' }
				})
				window.DispatchSocket.dispatchEvent(evt)
				return JSON.parse(sent[0])
			} finally {
				window.WebSocket = OrigWS
			}
		})
		expect(payload.type).toBe('ping')
		expect(payload.n).toBe(1)
		expect(payload.msg).toBe('hi')
		expect(payload.sender).toBeUndefined()
		expect(payload._namedArgList_).toBeUndefined()
	})

	test('rpc reconnects after the underlying socket closes', async ({evaluate}) => {
		var result = await evaluate(() => {
			var OrigWS = window.WebSocket
			var created = []
			var closeHandlers = []
			window.WebSocket = function() {
				var sock = {
					onmessage: null,
					send: function(){},
					addEventListener: function(type, handler) {
						if (type === 'close') closeHandlers.push(handler)
					},
					close: function(){},
				}
				created.push(sock)
				return sock
			}
			try {
				var script = document.createElement('script')
				script.type = 'text/hyperscript'
				script.textContent = 'socket ReconnectSocket ws://localhost/ws end'
				document.body.appendChild(script)
				_hyperscript.processNode(script)

				// Simulate the server closing the connection
				closeHandlers.forEach(function (h) { h({}) })

				// Next RPC call should create a fresh socket
				window.ReconnectSocket.rpc.ping()
				return { count: created.length }
			} finally {
				window.WebSocket = OrigWS
			}
		})
		expect(result.count).toBe(2)
	})

	test('on message as JSON throws on non-JSON payload', async ({page}) => {
		var err = await page.evaluate(() => {
			var OrigWS = window.WebSocket
			var mockSocket = { onmessage: null, send: function(){}, addEventListener: function(){}, close: function(){} }
			window.WebSocket = function() { return mockSocket }
			var script = document.createElement('script')
			script.type = 'text/hyperscript'
			script.textContent = `
				socket StrictJsonSocket ws://localhost/ws
				  on message as JSON
				    set window.strictFired to true
			`
			document.body.appendChild(script)
			_hyperscript.processNode(script)
			window.WebSocket = OrigWS
			try {
				mockSocket.onmessage({ data: 'not-json' })
				return null
			} catch (e) {
				return e.message
			}
		})
		expect(err).toContain('Received non-JSON message')
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
