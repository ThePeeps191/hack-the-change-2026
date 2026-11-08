// Only here so Chrome offers "Install app". It caches nothing: every request goes
// straight to the network, so phones always run the latest deploy.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {});
