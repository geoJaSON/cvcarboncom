import type { FeatureCollection, Polygon } from "geojson";

/** Hand-authored operations-area outline for southwest Louisiana -
 *  Calcasieu Lake and Pass west, the Cameron chenier coast, and
 *  Vermilion Bay with Marsh Island east. An authored chart region,
 *  not an official boundary. */
export const SOUTHWEST_LA_OUTLINE: FeatureCollection<Polygon> = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { targetId: "southwest-la" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-93.46, 30.03],
            [-93.17, 30.02],
            [-93.08, 29.87],
            [-92.86, 29.8],
            [-92.62, 29.77],
            [-92.4, 29.79],
            [-92.2, 29.82],
            [-92.1, 29.87],
            [-91.92, 29.84],
            [-91.82, 29.75],
            [-91.65, 29.68],
            [-91.52, 29.58],
            [-91.54, 29.38],
            [-91.85, 29.34],
            [-92.18, 29.37],
            [-92.55, 29.4],
            [-92.95, 29.48],
            [-93.25, 29.6],
            [-93.46, 29.68],
            [-93.46, 30.03],
          ],
        ],
      },
    },
  ],
};
