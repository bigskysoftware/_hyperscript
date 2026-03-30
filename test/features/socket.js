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
