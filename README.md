# CV Carbon

Marketing site for CV Carbon — oyster reef restoration funded by verified blue carbon credits.

Rebuilt from the legacy Wix site (archived as saved HTML in `Downloads/New folder`) onto
Next.js 16 (App Router) + React 19 + Tailwind CSS v4. All pages are statically prerendered.

```bash
npm install
npm run dev      # http://localhost:3000
npm run build
npm start
```

## Design system

The palette is derived from the logo — a navy oyster shell wrapped in a steel-blue wave — set
against oyster-shell neutrals with a verdigris accent that carries the ecological / carbon story.
Tokens live in the `@theme` block of [`app/globals.css`](app/globals.css); everything else composes
from them.

| Token | Use |
| --- | --- |
| `abyss` / `navy` | Dark bands, hero scrims, footer |
| `steel` / `steel-400` | Eyebrows, secondary display type |
| `pearl` / `nacre` / `sand` | Light page grounds, captions, rules |
| `verdigris` | Primary action, citation markers, the "30%" promise |

Type is **Fraunces** (display) over **Inter** (body). Shared pieces — `PageHero`, `StatBand`,
`PullQuote`, `Figure`, `Citations`, `NextPage`, `TideRule` — are in
[`components/ui.tsx`](components/ui.tsx). Scroll reveals use an IntersectionObserver
([`components/reveal.tsx`](components/reveal.tsx)) and are disabled under `prefers-reduced-motion`.

## Pages

| Route | Source of copy |
| --- | --- |
| `/` | Legacy "Welcome to CV Carbon" |
| `/science` | Legacy "Oysters Sequester and Store Carbon" |
| `/history` | Legacy "History: The Impact of Oyster Shell Mining" |
| `/partnering` | Legacy "Partnering with Oystermen" (incl. offset methodology) |
| `/beyond-carbon` | Legacy "Beyond Carbon: The Other Benefits of Oyster Reefs" |
| `/restoration` | Legacy "Restoring Oyster Habitat" |
| `/team` | Legacy "Meet the Team" |
| `/contact` | Rebuilt (email only — see below) |

Body copy, statistics, and every "Literature Cited" entry are carried over verbatim from the legacy
site. Nothing scientific was invented or paraphrased into new claims.

The legacy footer linked to a Terms & Conditions page. Those terms belonged to the previous
platform, so the page and the footer link were dropped.

## Carbon credit registry

The public registry at <https://portal.cvcarbon.eco/registry> is the transparency backbone of the
offering, so it is linked from every place a buyer looks. The URL is defined once in
[`lib/site.ts`](lib/site.ts) — change it there and every link follows.

- **Header nav + mobile menu** — a permanent `Registry ↗` item.
- **`/partnering`** — a full-width call to action immediately after *Independent Verification*, so
  the proof sits directly under the claim.
- **`/`** — inside the "30% back into the water" card: *See every credit in the registry*.
- **`/contact`** — on the "Buying carbon offsets" card.
- **Footer** — a `Carbon Credit Registry` button.

## Press

The Esri Blog article — [*Mapping Resilience: How CV Carbon and Oyster Fishermen Are Rebuilding
Oyster Reefs*](https://www.esri.com/about/newsroom/blog/how-cv-carbon-fishermen-rebuild-oyster-reefs),
by Dr. Dawn Wright, Chief Scientist at Esri, January 20 2026 — is referenced in three places, all
defined once in [`components/featured-article.tsx`](components/featured-article.tsx):

- **`/partnering`** — a full press card, plus an inline link on "we developed **an app**" in the
  Quantification section. This is the article's actual subject, so it is the primary placement.
- **`/restoration`** — an inline link where field data collection is described.
- **`/`** — a compact "Featured in" band under the stat band.

## Contact details

All contact points to **support@cvcarbon.com**, defined once in [`lib/site.ts`](lib/site.ts) —
change it there and the header button, footer, and `/contact` page all follow. The legacy phone
number (713 829 5271) was removed sitewide in favor of a "Message Us" mailto button.

### Facts worth reconciling

1. **Revenue share.** This site says *30% of gross revenue* goes back into the water (from the
   legacy homepage). The Esri article says fishermen are paid for carbon "half of which goes right
   back into building new reefs." These may be different measures, but a buyer will read both.
2. **Acres restored.** The Esri article's own key takeaways say "over 1,600 acres" since 2024 while
   its body says "more than 1,000 acres." No acreage figure is used on this site — but it is the
   single most persuasive number available, and is worth pinning down and adding.
3. **"Hargfield Reef."** The legacy history page credits a photo to Hargfield Reef in East Galveston
   Bay. Carried over as-is; may be a typo for Hanna Reef.
4. **Legacy typos, silently fixed on `/restoration`:** *Crassotrea* / *Crossotrea* → *Crassostrea*,
   and "oysters retire specific ranges" → "require".

## Deploying (Docker + Caddy)

`next.config.ts` sets `output: "standalone"`, so the runtime image carries a self-contained
`server.js` and only the `node_modules` actually reached — no build toolchain, running as non-root.

The compose file deliberately **does not publish a host port**. It joins the Docker network your
existing Caddy container is already on, and Caddy reaches the app internally at
`cvcarbon-web:3000`.

```bash
docker network ls                     # find the network your Caddy container uses

# then, on the VPS:
CADDY_NETWORK=<that-network> docker compose up -d --build
```

Then paste the block from [`Caddyfile.snippet`](Caddyfile.snippet) into the Caddyfile your Caddy
container already mounts, and reload it. Caddy issues TLS automatically.

**Two values to change before deploying:**

1. The domain in `Caddyfile.snippet` — it assumes `cvcarbon.com`.
2. `metadataBase` in [`app/layout.tsx`](app/layout.tsx) — same assumption. It only affects the
   absolute URLs in Open Graph tags, but it should match the real domain.

Image optimization needs `sharp`, which arrives as an optional dependency of Next. The lockfile
carries the `linuxmusl` binaries, so `npm ci` inside the Alpine builder resolves it correctly — no
extra step needed.

## Assets

`public/images/` holds 33 photographs and diagrams recovered from the legacy site, renamed
semantically (`cultch-barge.jpg`, `historic-tonging.jpg`, `oyster-lifecycle.png`, …). They are
served through `next/image`. The favicon (`app/icon.png`) is the oyster mark from the logo.
