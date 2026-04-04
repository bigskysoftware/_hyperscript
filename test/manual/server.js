/**
 * Manual test server for hyperscript features that need a live server.
 *
 * Usage:
 *   npm run test:manual
 *
 * Then open http://localhost:3000
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
var WebSocketServer;
try {
	({ WebSocketServer } = await import('ws'));
} catch {
	console.error('The "ws" package is required: cd test/manual && npm install');
	process.exit(1);
}

const PORT = 3000;
const ROOT = path.resolve(import.meta.dirname, '../..');

// --- HTTP server (serves static files + SSE endpoint) ---

const MIME = {
	'.html': 'text/html',
	'.js': 'application/javascript',
	'.css': 'text/css',
	'.map': 'application/json',
};

const server = http.createServer((req, res) => {
	// SSE endpoint
	if (req.url === '/sse') {
		res.writeHead(200, {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			'Connection': 'keep-alive',
			'Access-Control-Allow-Origin': '*',
		});

		// Send a greeting immediately
		res.write('data: hello from SSE\n\n');

		// Send a JSON event every second for 5 seconds
		var count = 0;
		var interval = setInterval(() => {
			count++;
			res.write('event: tick\n');
			res.write('data: ' + JSON.stringify({ count, time: Date.now() }) + '\n\n');
			if (count >= 5) {
				clearInterval(interval);
				res.write('event: done\n');
				res.write('data: finished\n\n');
			}
		}, 1000);

		req.on('close', () => clearInterval(interval));
		return;
	}

	// Named SSE events endpoint
	if (req.url === '/sse-named') {
		res.writeHead(200, {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			'Connection': 'keep-alive',
			'Access-Control-Allow-Origin': '*',
		});

		res.write('event: greeting\n');
		res.write('data: {"message":"hello"}\n\n');

		setTimeout(() => {
			res.write('event: farewell\n');
			res.write('data: {"message":"goodbye"}\n\n');
		}, 1000);

		return;
	}

	// Root → index.html
	if (req.url === '/') {
		req.url = '/test/manual/index.html';
	}

	// Test API endpoint for intercept tests
	if (req.url.startsWith('/api/')) {
		res.writeHead(200, {
			'Content-Type': 'application/json',
			'Access-Control-Allow-Origin': '*',
		});
		res.end(JSON.stringify({ path: req.url, time: Date.now(), random: Math.random() }));
		return;
	}

	// Static file serving
	var filePath = path.join(ROOT, req.url);
	if (!filePath.startsWith(ROOT)) {
		res.writeHead(403);
		res.end('Forbidden');
		return;
	}

	fs.readFile(filePath, (err, data) => {
		if (err) {
			res.writeHead(404);
			res.end('Not found: ' + req.url);
			return;
		}
		var ext = path.extname(filePath);
		var headers = { 'Content-Type': MIME[ext] || 'application/octet-stream' };
		// Allow service worker to claim wider scope
		if (req.url.endsWith('/intercept-sw.js')) {
			headers['Service-Worker-Allowed'] = '/';
		}
		res.writeHead(200, headers);
		res.end(data);
	});
});

// --- WebSocket server ---

const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws) => {
	console.log('WebSocket client connected');

	ws.on('message', (raw) => {
		var data;
		try { data = JSON.parse(raw); } catch { data = null; }

		if (!data) {
			// Echo raw messages back
			ws.send(raw.toString());
			return;
		}

		// RPC: respond to function calls
		if (data.iid && data.function) {
			var result;
			switch (data.function) {
				case 'add':
					result = (data.args[0] || 0) + (data.args[1] || 0);
					break;
				case 'greet':
					result = 'Hello, ' + (data.args[0] || 'world') + '!';
					break;
				case 'failPlease':
					ws.send(JSON.stringify({ iid: data.iid, throw: 'intentional error' }));
					return;
				default:
					result = 'unknown function: ' + data.function;
			}
			ws.send(JSON.stringify({ iid: data.iid, return: result }));
			return;
		}

		// Custom events: echo with type prefix
		if (data.type) {
			ws.send(JSON.stringify({ type: 'echo:' + data.type, detail: data }));
			return;
		}

		// Default: echo as JSON
		ws.send(JSON.stringify(data));
	});

	// Send a welcome message
	ws.send(JSON.stringify({ type: 'welcome', message: 'connected' }));
});

server.listen(PORT, () => {
	console.log('Manual test server running at http://localhost:' + PORT);
});
