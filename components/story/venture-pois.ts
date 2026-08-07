export type VenturePoi = {
  id: string;
  name: string;
  address: string;
  hours?: string;
  coordinates: [longitude: number, latitude: number];
};

/** Venture-related locations revealed by the story URL's venture flag. */
export const VENTURE_POIS: readonly VenturePoi[] = [
  {
    id: "venture-houston",
    name: "Venture Global LNG",
    address: "1401 McKinney St, Ste 2600, Houston, TX 77010",
    coordinates: [-95.3608947, 29.7548518],
  },
  {
    id: "venture-calcasieu-pass",
    name: "Venture Global LNG",
    address: "235 Davis Rd, Cameron, LA 70631",
    coordinates: [-93.326674, 29.783741],
  },
  {
    id: "venture-arlington",
    name: "Venture Global LNG",
    address: "1001 19th St N, Ste 1500, Arlington, VA 22209",
    hours: "9:00 AM–5:00 PM",
    coordinates: [-77.0691532, 38.8973746],
  },
  {
    id: "new-gas-plant-site",
    name: "New Gas Plant Site",
    address: "J437+3P, Port Sulphur, LA 70083",
    coordinates: [-89.8856875, 29.6026875],
  },
];
