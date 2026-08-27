/* ------------------------------------------------------------------
   Per-unit factors shared by the editorial bands, the perspective
   charts, and the purchase sizer. Anything a visitor could put side by
   side on one page lives here once, so two surfaces can never quote
   different arithmetic for the same claim.

   Program figures are NOT here — those come from the snapshot manifest
   so the page tracks the survey database rather than a constant.
   ------------------------------------------------------------------ */

export const ACRE_M2 = 4046.8564;
export const LB_PER_KG = 2.20462;

/** Added fish and crustacean production on restored reef. Peterson et al. 2003. */
export const FISH_G_PER_M2_YR = 260;

/** Shoreline erosion reduction measured behind restored Louisiana reef.
    LSU AgCenter monitoring. Quoted by the co-benefits band and by the
    invitation-only opener, so it lives here rather than as a literal in
    whichever band happened to need it first. */
export const EROSION_REDUCTION_PCT = 50;

/** Jobs supported per $1M of restoration spend. Hall & DeAngelis 2022. */
export const JOBS_PER_MILLION = 18.55;

/** Peterson's 260 g/m²/yr expressed at a scale a person can hold — ~2,320 lb. */
export const FISH_LB_PER_ACRE_YEAR = (FISH_G_PER_M2_YR * ACRE_M2 * LB_PER_KG) / 1000;

/* EPA Greenhouse Gas Equivalencies Calculator factors, per t CO2e —
   kept byte-identical to the registry's EQUIVALENT_FACTORS
   (web_app_v2 PublicCreditDemoPage.tsx, eGRID2022, reviewed 2026-06)
   so the two public surfaces can never disagree. */
export const EPA = {
  passenger_cars_year: 0.233,
  homes_electricity_year: 0.208,
  tree_seedlings_10yr: 16.67,
  gasoline_gallons: 112.5,
} as const;
