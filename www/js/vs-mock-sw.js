// Mock Service Worker for the /vs/ demo page
// Intercepts fetch requests and returns fake responses

const MACS = [
    "Macintosh 128K", "Macintosh 512K", "Macintosh 512Ke", "Macintosh Plus",
    "Macintosh SE", "Macintosh SE/30", "Macintosh II", "Macintosh IIx",
    "Macintosh IIcx", "Macintosh IIci", "Macintosh IIfx", "Macintosh Classic",
    "Macintosh Classic II", "Macintosh LC", "Macintosh LC II", "Macintosh LC III",
    "Macintosh Color Classic", "PowerBook 100", "PowerBook 140", "PowerBook 170",
    "Quadra 700", "Quadra 800", "Quadra 900", "Quadra 950",
];

self.addEventListener("fetch", (event) => {
    const url = new URL(event.request.url);

    // Debounced search: GET /search?q=...
    if (url.pathname === "/virtual/search") {
        const q = (url.searchParams.get("q") || "").toLowerCase();
        const results = MACS.filter(m => m.toLowerCase().includes(q));
        const html = results.length
            ? results.map(m => `<li>${m}</li>`).join("")
            : `<li style="color:gray">No results</li>`;
        event.respondWith(new Response(html, { headers: { "Content-Type": "text/html" } }));
        return;
    }

    // Confirm delete: DELETE /api/items/...
    if (url.pathname.startsWith("/virtual/items/") && event.request.method === "DELETE") {
        event.respondWith(new Response("", { status: 204 }));
        return;
    }

    // Infinite scroll: GET /api/more?page=...
    if (url.pathname === "/virtual/more") {
        const page = parseInt(url.searchParams.get("page") || "1");
        const perPage = 5;
        const start = (page - 1) * perPage;
        const items = MACS.slice(start, start + perPage);
        const html = items.map(m => `<li>${m}</li>`).join("");
        event.respondWith(new Response(html, { headers: { "Content-Type": "text/html" } }));
        return;
    }

    // Morph after fetch: GET /api/component
    if (url.pathname === "/virtual/component") {
        const random = MACS[Math.floor(Math.random() * MACS.length)];
        const html = `<div id="vs-morph-target" style="padding:8px; border:1px solid var(--border); border-radius:var(--radius)">
            <strong>${random}</strong> — refreshed at ${new Date().toLocaleTimeString()}
        </div>`;
        event.respondWith(new Response(html, { headers: { "Content-Type": "text/html" } }));
        return;
    }
});

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
