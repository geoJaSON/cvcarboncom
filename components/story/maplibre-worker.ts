import { setWorkerUrl } from "maplibre-gl";

/* MapLibre's default worker is spawned from a bundler-transformed
   module, which Turbopack breaks silently - every GeoJSON source then
   hangs forever unloaded. Serve the library's own pristine worker
   (copied into public/maplibre/ by the sync-maplibre-worker script,
   which predev/prebuild run automatically).

   This lives in its own module because the page now builds more than
   one map: importing it is how any map component declares the
   dependency, rather than relying on whichever module happened to be
   evaluated first. Module side effects run once, so the repeat imports
   cost nothing. */
setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");
