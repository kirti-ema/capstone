# CONTEXT.md — Project State & Architecture

> Warmup context for a new EMA conversation. Read this **and** `INSTRUCTIONS.md`
> before modifying anything. Pairs with `AGENTS.md` (Adobe EDS boilerplate rules).
> Last updated: 2026-08-11.

## What this project is

A migration of the **WKND** demo site (source: `https://wknd.site/`) to **Adobe
Edge Delivery Services (EDS)**, authored in **Document Authoring (DA / da.live)**.
Goal: pixel-match the source, verified on production preview/live.

- **GitHub repo:** `kirti-ema/capstone` (`https://github.com/kirti-ema/capstone`)
- **DA content source (org/repo):** `kirti-ema/capstone`
- **Deploy branch:** `main` (origin/HEAD → main). Code Sync publishes from `main`.
- **Preview:** `https://main--capstone--kirti-ema.aem.page/{path}`
- **Live:** `https://main--capstone--kirti-ema.aem.live/{path}`
- **DA source API:** `https://admin.da.live/source/kirti-ema/capstone/{path}.html`
- **Admin API:** `https://admin.hlx.page/{preview|live|index}/kirti-ema/capstone/main/{path}`
- Stack: vanilla ES6+, modern CSS, **no build step**. Airbnb ESLint + Stylelint standard.

## Locales

Two locale trees exist: **`/us/en/`** (primary, actively maintained) and
**`/ca/en/`** (parallel copy, largely untouched). All dynamic work so far targets
`/us/en/`. `helix-query.yaml` notes where to add matching CA indices when CA is in scope.

## Site map (57 content pages)

- Homepage `/us/en` — hero + dynamic listings (cards-teaser).
- Magazine `/us/en/magazine` (landing) + 5 articles: `arctic-surfing`,
  `guide-la-skateparks`, `san-diego-surf`, `ski-touring`, `western-australia`.
  CA also has `members-only/` locked articles (excluded from indices).
- Adventures `/us/en/adventures` (landing, dynamic tabs) + 16 detail pages.
- About Us `/us/en/about-us` — dynamic contributor/guide cards.
- FAQs `/us/en/faqs`.

## Architecture

### Page decoration (`scripts/scripts.js`)
Standard EDS 3-phase load (eager → lazy → delayed). Custom auto-blocking in
`buildAutoBlocks(main)` runs these builders (order matters):
1. **fragments** — auto-loads `a[href*="/fragments/"]`.
2. `buildFeaturedAutoBlock` — homepage "Next Adventures" featured banner.
3. `buildMagazineListingBlocks` — homepage/magazine dynamic `cards-teaser` +
   `members-only` blocks.
4. `buildAuthorBioBlock` — flat magazine articles → `author-card` (bails if the
   author photo `<p><picture>` before the author `<h2>` is missing).
5. `buildWidgetAutoBlocks`.

`buildArticleLayout` / `buildAdventureLayout` decorate flat detail pages into
2-column layouts (body + SHARE sidebar / spec-rail + tabs).

### Shared index utility (`scripts/query-index.js`)
All dynamic blocks read a query-index feed the same way. Exports: `fetchIndex`,
`toSameOriginPath`, `normalizePath`, `parsePublishDate`, `cardOrderOf`,
`groupSizeOf`, and comparators `byTitle`, `byCardOrder`, `byGroupSizeThenTitle`,
`byPublishDateDesc`, `byLastModifiedDesc`.

### Blocks (23; each has `.js` + `.css`)
`accordion-faq`, `article-download`, `article-hero`, `article-section`,
`article-title`, `author-card`, `breadcrumbs`, `cards-profile`, `cards-teaser`,
`carousel-gallery`, `carousel-hero`, `columns`, `featured-teaser`, `footer`,
`fragment`, `header`, `hero`, `hero-banner`, `members-only`, `table-specs`,
`tabs-detail`, `tabs-filter`, `widget`.

Dynamic (index/sheet-driven) blocks: **`cards-teaser`** (magazine/adventure
listings), **`tabs-filter`** (Adventures category tabs), **`cards-profile`**
(About Us contributors/guides, spreadsheet mode), **`hero-banner`** (featured
adventure).

### Design tokens (`styles/brand.css`)
Extracted from source. Headings **Asar** (serif), body **Source Sans Pro**.
Key: `--text-color:#202020`, `--link-color:#0045ff`, `--nav-height:87px`,
heading sizes xxl 54 / xl 36 / l 24 / m 20 / s 18 / xs 16 px. Yellow accent
used under section H2s (e.g. Adventures "Current Adventures").

## Content model — the query index (`helix-query.yaml`)

Two indices, **identical shape** so every dynamic block reads them uniformly:
`magazine` → `/us/en/magazine/query-index.json`, `adventures` →
`/us/en/adventures/query-index.json`. Both exclude their own landing page;
magazine also excludes `members-only/**`.

Authored metadata fields → indexed properties (authored as DA **metadata block**
rows; see INSTRUCTIONS):
- `title` (og:title), `description`, `image` (og:image path only), `lastModified`.
- **`cardOrder`** (`card-order` meta) — curated listing position, ascending.
  Blank = not shown in curated lists. Controls selection+order instead of recency.
- **`cardImage`** (`card-image` meta) — dedicated card thumbnail. **MUST be
  authored as TEXT (a path), never an `<img>`** — an `<img>` in a metadata cell
  emits `about:error` and corrupts og:image.
- **`publishDate`** (`publish-date` meta) — human string (e.g. "Thursday, 9 Jul
  2020"); rendered as the SHARE-sidebar date line.
- Adventures only: **`category`** (tabs group by it), **`featured`** ("true" on
  exactly one; homepage banner; lowest cardOrder wins on ties), **`groupSize`**
  (read **positionally** from the spec sheet — `.table-specs > div:nth(4) >
  div:nth(2)` — so activity tabs can sort by it without extra authoring).

## Migration tooling (`tools/importer/`)

Helix-importer scripts per template: `import-homepage`, `import-adventure-listing`,
`import-adventure-detail`, `import-content-overview`, `import-faq-page` (+`.bundle`).
Parsers in `parsers/` (10), transformers in `transformers/` (`wknd-cleanup.js`,
`wknd-sections.js`). `catalog/` holds template/block catalog JSON from analysis.
**Importer regenerates STATIC markup only** — it cannot produce the dynamic blocks
(tabs-filter/cards-profile/dynamic cards-teaser), which is why those pages are
hand-authored (see INSTRUCTIONS "content editing exception").

## Current status (2026-08-11)

**Done & live/verified:**
- Design system migrated (brand.css, styles.css, all 23 blocks styled to source).
- Homepage + magazine index: dynamic `cards-teaser` listings.
- Adventures: dynamic `tabs-filter` (category tabs; per-tab sort — title for
  All/Travel, groupSize for activity tabs), dynamic featured hero-banner.
- About Us: 2 dynamic `cards-profile` blocks fed by `contributors.json` DA sheet.
- 5 magazine articles: 2-column layout + author-card + static dated SHARE sidebar.
- **Content recovery + sync-hardening (this session):** all 5 magazine articles'
  local files brought to byte-parity with their corrected DA sources (heroes/images
  fixed); guide-la-skateparks PDF links fixed (`-pdf`→`.pdf`); Adventures metadata
  converted to a proper metadata **block**; Adventures hero-banner image fixed
  (absolute content.da.live `<source>` → relative `/media-da/` form).
- **local ↔ DA parity verified** for all touched pages → next EMA "sync" is a no-op.

**Reverted / not deployed:**
- Dynamic SHARE-sidebar code (commit `ed6e5e8`) was **reverted** (`f58c3b5`)
  because the magazine index `publishDate` lags and produced date-less links.
  Sidebars are intentionally static-dated. Don't redeploy until publishDate
  reliably populates in the index.

## Remaining / possible future work

- CA locale (`/ca/en/`) is static — not migrated to dynamic blocks; add matching
  CA query indices if it comes into scope.
- Redeploy dynamic SHARE-sidebar only after index `publishDate` populates reliably.
- Magazine index `publishDate`/`category`/`groupSize` have platform indexer
  content-cache lag (see INSTRUCTIONS "known issues").

## Known issues & platform gotchas

See **INSTRUCTIONS.md → Known issues & workarounds** for the detailed, actionable
list (image path forms, `about:error` heroes, sync-revert, indexer lag, PDF links,
metadata-as-text). Those are the traps that have caused real regressions.
