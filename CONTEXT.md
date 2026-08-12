# CONTEXT.md — Project State & Architecture

> Warmup context for a new EMA conversation. Read this **and** `INSTRUCTIONS.md`
> before modifying anything. Pairs with `AGENTS.md` (Adobe EDS boilerplate rules).
> Last updated: 2026-08-12 (dynamic FAQ accordion; Sidekick + DA-native Block
> Libraries; all magazine images fixed via DA Media Library Copy; guide-la PDF
> links fixed + force-download).

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

`buildArticleLayout` / `buildAdventureLayout` decorate **flat** detail pages into
2-column layouts (body + SHARE sidebar / spec-rail + tabs). `buildArticleLayout`
now **bails on block-authored pages** (guard: `:scope > .article-title-wrapper`)
so it never nests a 2nd grid inside the block-per-section CSS grid. The 5 magazine
articles are block-authored (so this builder no longer fires on them); it stays
for any future still-flat article.

### Shared index utility (`scripts/query-index.js`)
All dynamic blocks read a query-index feed the same way. Exports: `fetchIndex`,
`toSameOriginPath`, `normalizePath`, `parsePublishDate`, `cardOrderOf`,
`groupSizeOf`, and comparators `byTitle`, `byCardOrder`, `byGroupSizeThenTitle`,
`byPublishDateDesc`, `byLastModifiedDesc`.

### Blocks (24; each has `.js` + `.css`)
`accordion-faq`, `article-download`, `article-hero`, `article-section`,
`article-title`, `author-card`, `breadcrumbs`, `cards-profile`, `cards-teaser`,
`carousel-gallery`, `carousel-hero`, `columns`, `featured-teaser`, `footer`,
`fragment`, `header`, `hero`, `hero-banner`, `members-only`, `share-story`,
`table-specs`, `tabs-detail`, `tabs-filter`, `widget`.

**Magazine article blocks** (block-per-section detail pages): `article-hero`
(LCP lead image), `article-title` (H1 + byline paragraph — kills the source's
duplicate CF title), `article-section` (repeatable body sections; `quote` variant
= grey box, `quote small` variant = plain inset), `author-card` (photo/name-H2/
role/socials), `share-story` (static "SHARE THIS STORY" sidebar; relocates any
`article-download` widget into itself). The 2-col layout is the section's own CSS
grid, keyed on `.article-title-container` (see below), NOT `buildArticleLayout`.

Dynamic (index/sheet-driven) blocks: **`cards-teaser`** (magazine/adventure
listings), **`tabs-filter`** (Adventures category tabs), **`cards-profile`**
(About Us contributors/guides, spreadsheet mode), **`hero-banner`** (featured
adventure), **`accordion-faq`** (FAQ page, **dual-mode** — reads `faqs.json`
sheet when authored with a `.json` link, else inline; renders identically).

### Block Library (both systems live; blocks browsable/insertable in the editor)
- **Sidekick Library** (code, git): `tools/sidekick/{config.json, library.html,
  library.json}`. `library.json` = 21 rows (name/path → `/tools/sidekick/blocks/<name>`).
- **DA-native Library** (the `da.live/edit` panel): configured in the **DA Config
  Service** via `POST admin.da.live/config/kirti-ema/capstone/` (a `library` tab
  → `Blocks` row → `library/blocks.json`). NOT a `.da/config.json` source doc.
- **21 block docs** authored in DA at `/tools/sidekick/blocks/<name>` (excludes
  structural header/footer/fragment). Each = H1 + `library-metadata` (name/
  description/searchTags) + real example markup. `article-section` doc carries 3
  variant sub-items (default / `quote` / `quote small`). Add a block = author a doc
  + add a `name,path` row to `library/blocks.json` (+ Sidekick `library.json`).
  See INSTRUCTIONS "Block Library".

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
- **5 magazine articles re-authored to block-per-section & LIVE** (PR #2, merge
  `41b0901` on `main`): each is `article-hero` → `breadcrumbs` → `article-title`
  → `article-section`(s) → `author-card` → `share-story`, in ONE section that is
  the 2-col CSS grid (`.article-title-container`). Quote variants: grey box
  (`quote`) on ski-touring/western-australia/guide-la; plain inset (`quote small`)
  on arctic-surfing; none on san-diego-surf. guide-la carries an `article-download`
  widget relocated into the sidebar (PDF link `-pdf`→`.pdf` fixed, 2 anchors).
- **All article images re-uploaded fresh to DA** (self-hosted `content.da.live`,
  rendering + optimized). The 4 non-arctic articles had been fully broken
  (`about:error`, mangled hash-chain refs) before this — restructure alone does
  NOT fix images; manual drag-drop re-upload in DA did (see INSTRUCTIONS → "DA
  image insert").
- Adventures metadata is a proper metadata **block**; Adventures hero-banner image
  fixed (absolute content.da.live `<source>` → relative `/media-da/`).
- **local ↔ DA parity verified** for all touched pages → next EMA "sync" is a no-op.

**Done this session (2026-08-12):**
- **ALL magazine article images fixed via DA Media Library "Copy"** (arctic-surfing
  hero + 4 body/author imgs; then all 4 other articles = 21 imgs). Every US magazine
  article now renders **0 `about:error`**. Method (preferred over hash-surgery): the
  DA Media Library holds the authoritative optimized `media_<hash>` URL — see
  INSTRUCTIONS "Broken-image fix".
- **guide-la PDF**: `-pdf`→`.pdf` hrefs fixed (content), AND `article-download.js`
  now adds the HTML5 `download` attr so PDFs download instead of opening in-tab
  (match source's Content-Disposition). Code merged PR #4.
- **FAQ accordion made dynamic** (dual-mode `accordion-faq`, sheet `/us/en/faqs/
  faqs.json`, 7 rows). Code merged PR #6; page + sheet live. UI identical.
- **Block Library** built + wired (Sidekick PR #5 + DA-native Config Service).
  `article-section` variants (quote / quote small) added to its library doc.

**Reverted / not deployed:**
- Dynamic SHARE-sidebar code (commit `ed6e5e8`) was **reverted** (`f58c3b5`)
  because the magazine index `publishDate` lags and produced date-less links.
  The `share-story` block is intentionally **static** (authored links + dates),
  by the same reasoning. Don't make it fetch/dynamic until publishDate reliably
  populates in the index.

## Remaining / possible future work

- CA locale (`/ca/en/`) is static — not migrated to dynamic blocks; add matching
  CA query indices if it comes into scope.
- Redeploy dynamic SHARE-sidebar only after index `publishDate` populates reliably.
- Magazine index `publishDate`/`category`/`groupSize` have platform indexer
  content-cache lag (see INSTRUCTIONS "known issues").
- Pre-existing site-level **SEO ~69** (flagged by PSI on article pages, not caused
  by the block re-author). `aem-psi-check` mobile run is flaky (times out → score
  0/n-a); desktop scores ~99. Not a real regression — re-run if it blocks a PR.

## Known issues & platform gotchas

See **INSTRUCTIONS.md → Known issues & workarounds** for the detailed, actionable
list (image path forms, `about:error` heroes, sync-revert, indexer lag, PDF links,
metadata-as-text). Those are the traps that have caused real regressions.
