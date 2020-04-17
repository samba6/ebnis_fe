/* eslint-disable no-restricted-globals */
/* global importScripts, workbox, idbKeyval */

importScripts(`idb-keyval-iife.min.js`);

const offlineShell = `%pathPrefix%/offline-plugin-app-shell-fallback/index.html`;

const { NavigationRoute } = workbox.routing;

// for non /app/** routes, fetch the route plus its resources stored in KV store
const navigationRoute = new NavigationRoute(
  async ({ event }) => {
    let { pathname } = new URL(event.request.url);

    pathname = pathname.replace(new RegExp(`^%pathPrefix%`), ``);

    // Check for resources + the app bundle
    // The latter may not exist if the SW is updating to a new version
    const resources = await idbKeyval.get(`resources:${pathname}`);
    if (!resources || !(await caches.match(`%pathPrefix%/%appFile%`))) {
      return await fetch(event.request);
    }

    for (const resource of resources) {
      // As soon as we detect a failed resource, fetch the entire page from
      // network - that way we won't risk being in an inconsistent state with
      // some parts of the page failing.
      if (!(await caches.match(resource))) {
        return await fetch(event.request);
      }
    }

    const offlineShellWithKey = workbox.precaching.getCacheKeyForURL(
      offlineShell,
    );

    return await caches.match(offlineShellWithKey);
  },

  {
    blacklist: [new RegExp("/app/.+")],
  },
);

workbox.routing.registerRoute(navigationRoute);

// for all requests to /app/**, respond with /app/index.html == SPA
workbox.routing.registerNavigationRoute(
  workbox.precaching.getCacheKeyForURL("/app/index.html"),
  {
    whitelist: [new RegExp("/app/.+")],
  },
);

// always response with content of this url for all requests for app page data
const appPageDataUrl = "%pathPrefix%/page-data/app/page-data.json";
workbox.routing.registerRoute(
  new RegExp("/page-data/app/.+?/page-data\\.json"),

  () => {
    const appPageDataKey = workbox.precaching.getCacheKeyForURL(appPageDataUrl);
    return caches.match(appPageDataKey);
  },
);

const messageApi = {
  setPathResources(event, arg) {
    const { path, resources } = arg;
    event.waitUntil(idbKeyval.set(`resources:${path}`, resources));
  },

  clearPathResources(event) {
    event.waitUntil(idbKeyval.clear());
  },
};

self.addEventListener(`message`, event => {
  const { gatsbyApi } = event.data;
  if (gatsbyApi) messageApi[gatsbyApi](event, event.data);
});
