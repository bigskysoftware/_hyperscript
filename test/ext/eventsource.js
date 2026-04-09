import { test, expect } from '../fixtures.js'

/**
 * Helper: mock fetch in-browser to return a SSE stream.
 * `messages` is an array of {event?, data, id?, delay?} objects.
 */
async function mockSSE(page, url, messages, options) {
    await page.evaluate(({ url, messages, options }) => {
        var origFetch = window.__origFetch || window.fetch;
        window.__origFetch = origFetch;
        window.fetch = function (input, init) {
            var reqUrl = typeof input === 'string' ? input : input.url;
            if (!reqUrl.includes(url)) return origFetch.call(this, input, init);

            // Capture request details for assertions
            window.__lastSSERequest = { method: init?.method || 'GET', headers: init?.headers || {} };

            var stream = new ReadableStream({
                async start(controller) {
                    var encoder = new TextEncoder();
                    for (var i = 0; i < messages.length; i++) {
                        var msg = messages[i];
                        if (msg.delay) await new Promise(r => setTimeout(r, msg.delay));
                        var frame = '';
                        if (msg.event) frame += 'event: ' + msg.event + '\n';
                        if (msg.id) frame += 'id: ' + msg.id + '\n';
                        if (msg.retry) frame += 'retry: ' + msg.retry + '\n';
                        frame += 'data: ' + (msg.data || '') + '\n\n';
                        controller.enqueue(encoder.encode(frame));
                    }
                    if (!options?.keepOpen) controller.close();
                }
            });

            return Promise.resolve(new Response(stream, {
                status: 200,
                headers: { 'Content-Type': 'text/event-stream' }
            }));
        };
    }, { url, messages, options });
}

/** Restore original fetch */
async function restoreFetch(page) {
    await page.evaluate(() => {
        if (window.__origFetch) window.fetch = window.__origFetch;
    });
}

test.describe('eventsource extension', () => {

    test('receives unnamed messages', async ({ page, html, find }) => {
        await mockSSE(page, '/sse', [
            { data: 'hello' },
            { data: 'world', delay: 50 },
        ]);
        await html(`
            <div id="out"></div>
            <script type="text/hyperscript">
                eventsource TestSSE from "/sse"
                    on "message" as string
                        put it into #out
                    end
                end
            </script>
        `);
        await expect.poll(() => find('#out').textContent()).toBe('world');
        await restoreFetch(page);
    });

    test('receives named events', async ({ page, html, find }) => {
        await mockSSE(page, '/sse', [
            { event: 'greeting', data: '{"msg":"hi"}' },
            { event: 'farewell', data: '{"msg":"bye"}', delay: 50 },
        ]);
        await html(`
            <div id="greet"></div>
            <div id="bye"></div>
            <script type="text/hyperscript">
                eventsource NamedSSE from "/sse"
                    on "greeting" as json
                        put it.msg into #greet
                    end
                    on "farewell" as json
                        put it.msg into #bye
                    end
                end
            </script>
        `);
        await expect.poll(() => find('#greet').textContent()).toBe('hi');
        await expect.poll(() => find('#bye').textContent()).toBe('bye');
        await restoreFetch(page);
    });

    test('wildcard pattern matches multiple events', async ({ page, html, find }) => {
        await mockSSE(page, '/sse', [
            { event: 'user.login', data: '{"n":1}' },
            { event: 'user.logout', data: '{"n":2}', delay: 30 },
            { event: 'system.ping', data: '{"n":3}', delay: 30 },
            { event: 'user.update', data: '{"n":4}', delay: 30 },
        ]);
        await html(`
            <div id="count">0</div>
            <script type="text/hyperscript">
                eventsource WildSSE from "/sse"
                    on "user.*" as json
                        set c to #count's innerHTML as Int
                        put (c + 1) into #count
                    end
                end
            </script>
        `);
        await expect.poll(() => find('#count').textContent()).toBe('3');
        await restoreFetch(page);
    });

    test('catch-all * matches every event', async ({ page, html, find }) => {
        await mockSSE(page, '/sse', [
            { event: 'a', data: 'x' },
            { event: 'b', data: 'x', delay: 30 },
            { event: 'c', data: 'x', delay: 30 },
        ]);
        await html(`
            <div id="out"></div>
            <script type="text/hyperscript">
                eventsource CatchAllSSE from "/sse"
                    on "*" as string
                        put (event.type + "," + #out's innerHTML) into #out
                    end
                end
            </script>
        `);
        await expect.poll(() => find('#out').textContent()).toContain('c,');
        var text = await find('#out').textContent();
        // Should contain all three named events (and possibly open)
        expect(text).toContain('a,');
        expect(text).toContain('b,');
        expect(text).toContain('c,');
        await restoreFetch(page);
    });

    test('as json decodes data', async ({ page, html, find }) => {
        await mockSSE(page, '/sse', [
            { event: 'update', data: '{"name":"Alice","age":30}' },
        ]);
        await html(`
            <div id="name"></div>
            <div id="age"></div>
            <script type="text/hyperscript">
                eventsource JsonSSE from "/sse"
                    on "update" as json
                        put it.name into #name
                        put it.age into #age
                    end
                end
            </script>
        `);
        await expect.poll(() => find('#name').textContent()).toBe('Alice');
        await expect.poll(() => find('#age').textContent()).toBe('30');
        await restoreFetch(page);
    });

    test('with method sends POST', async ({ page, html, find, evaluate }) => {
        await mockSSE(page, '/sse', [
            { event: 'ack', data: 'ok' },
        ]);
        await html(`
            <div id="out"></div>
            <script type="text/hyperscript">
                eventsource PostSSE from "/sse" with method "POST"
                    on "ack" as string
                        put it into #out
                    end
                end
            </script>
        `);
        await expect.poll(() => find('#out').textContent()).toBe('ok');
        var req = await evaluate(() => window.__lastSSERequest);
        expect(req.method).toBe('POST');
        await restoreFetch(page);
    });

    test('with headers sends custom headers', async ({ page, html, find, evaluate }) => {
        await mockSSE(page, '/sse', [
            { event: 'ack', data: 'ok' },
        ]);
        await html(`
            <div id="out"></div>
            <script type="text/hyperscript">
                eventsource HeaderSSE from "/sse" with headers {"X-Custom": "test123"}
                    on "ack" as string
                        put it into #out
                    end
                end
            </script>
        `);
        await expect.poll(() => find('#out').textContent()).toBe('ok');
        var req = await evaluate(() => window.__lastSSERequest);
        expect(req.headers['X-Custom']).toBe('test123');
        await restoreFetch(page);
    });

    test('open and close lifecycle events fire', async ({ page, html, find }) => {
        await mockSSE(page, '/sse', [
            { data: 'hi' },
        ]);
        await html(`
            <div id="opened"></div>
            <script type="text/hyperscript">
                eventsource LifecycleSSE from "/sse"
                    on "open"
                        put "yes" into #opened
                    end
                    on "message" as string
                        call LifecycleSSE.close()
                    end
                end
            </script>
        `);
        await expect.poll(() => find('#opened').textContent()).toBe('yes');
        await restoreFetch(page);
    });

    test('close() stops the connection', async ({ page, html, find, evaluate }) => {
        await mockSSE(page, '/sse', [
            { data: '1' },
            { data: '2', delay: 500 },
            { data: '3', delay: 500 },
        ], { keepOpen: true });
        await html(`
            <div id="out">0</div>
            <script type="text/hyperscript">
                eventsource CloseSSE from "/sse"
                    on "message" as string
                        put it into #out
                        if it is "1"
                            call CloseSSE.close()
                        end
                    end
                end
            </script>
        `);
        // Should get "1" then stop
        await expect.poll(() => find('#out').textContent()).toBe('1');
        // Wait long enough that message "2" would have arrived if not closed
        await evaluate(() => new Promise(r => setTimeout(r, 800)));
        expect(await find('#out').textContent()).toBe('1');
        await restoreFetch(page);
    });

    test('dynamic open with new URL', async ({ page, html, find, evaluate }) => {
        await mockSSE(page, '/sse-a', [{ event: 'msg', data: 'from-a' }]);
        await html(`
            <div id="out"></div>
            <script type="text/hyperscript">
                eventsource DynSSE
                    on "msg" as string
                        put it into #out
                    end
                end
            </script>
        `);
        // Not connected yet — open manually
        await evaluate(() => DynSSE.open('/sse-a'));
        await expect.poll(() => find('#out').textContent()).toBe('from-a');
        await restoreFetch(page);
    });
})
