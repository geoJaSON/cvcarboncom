import type { Geometry, Position } from "geojson";
import { CHESAPEAKE_OUTLINE } from "./chesapeake-outline";
import { SOUTHWEST_LA_OUTLINE } from "./southwest-la-outline";
import { MAP_TARGETS, mapTarget } from "./scenes";
import type { BBox, StoryFeatureCollection } from "./use-story-data";

const REGIONAL_OUTLINES = [...CHESAPEAKE_OUTLINE.features, ...SOUTHWEST_LA_OUTLINE.features];

type CarbonPoint = [number, number];

/** Area memberships are stamped onto the 3D carbon cells and also used
 * to calculate the number in the chapter card, keeping ink and total on
 * the same geographic test. A cell is assigned by its baked centerpoint. */
export function carbonAreaIdsForPoint(
  point: CarbonPoint,
  counties: StoryFeatureCollection | null,
): string[] {
  return MAP_TARGETS.filter((target) => carbonAreaContainsPoint(target.id, point, counties)).map(
    (target) => target.id,
  );
}

export function carbonNetForArea(
  carbon: StoryFeatureCollection | null,
  counties: StoryFeatureCollection | null,
  areaId: string,
): number | null {
  if (!carbon) return null;

  let total = 0;
  for (const feature of carbon.features) {
    if (feature.geometry.type !== "Point") continue;
    const [lon, lat] = feature.geometry.coordinates;
    if (!carbonAreaContainsPoint(areaId, [lon, lat], counties)) continue;
    const mt = Number((feature.properties as { mt?: unknown } | null)?.mt);
    if (Number.isFinite(mt)) total += mt;
  }
  return total;
}

function carbonAreaContainsPoint(
  areaId: string,
  point: CarbonPoint,
  counties: StoryFeatureCollection | null,
): boolean {
  const target = mapTarget(areaId);
  if (!target) return false;

  if ("geoid" in target) {
    const county = counties?.features.find((feature) => feature.properties?.GEOID === target.geoid);
    return county ? pointInGeometry(point, county.geometry) : false;
  }

  const regional = REGIONAL_OUTLINES.find(
    (feature) => feature.properties?.targetId === target.id,
  );
  if (regional && pointInGeometry(point, regional.geometry)) return true;

  return "bounds" in target ? pointInBounds(point, target.bounds) : false;
}

function pointInBounds([lon, lat]: CarbonPoint, [west, south, east, north]: BBox): boolean {
  return lon >= west && lon <= east && lat >= south && lat <= north;
}

function pointInGeometry(point: CarbonPoint, geometry: Geometry): boolean {
  if (geometry.type === "Polygon") return pointInPolygon(point, geometry.coordinates);
  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates.some((polygon) => pointInPolygon(point, polygon));
  }
  return false;
}

function pointInPolygon(point: CarbonPoint, rings: Position[][]): boolean {
  if (!rings.length || !pointInRing(point, rings[0])) return false;
  return !rings.slice(1).some((ring) => pointInRing(point, ring));
}

function pointInRing([x, y]: CarbonPoint, ring: Position[]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (pointOnSegment(x, y, xi, yi, xj, yj)) return true;
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

function pointOnSegment(
  x: number,
  y: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
): boolean {
  const cross = (x - ax) * (by - ay) - (y - ay) * (bx - ax);
  if (Math.abs(cross) > 1e-10) return false;
  return x >= Math.min(ax, bx) && x <= Math.max(ax, bx) && y >= Math.min(ay, by) && y <= Math.max(ay, by);
}
