# Migration Analysis — WKND Adventures & Travel

> **Initial Analysis (Aug 5, 2026)**
>
> Point-in-time planning artifact, reproduced exactly as first reported at the
> start of the migration. The figures below reflect the source-site analysis
> captured on **2026-08-05**, prior to implementation — they describe the
> migration *as planned*, not the final delivered build.

---

## 1. Page / Site Overview

| Property | Value |
|----------|-------|
| **Entry URL** | `https://wknd.site/us/en.html` |
| **Canonical URL** | `/us/en.html` |
| **Title** | WKND Adventures and Travel |
| **Description** | *WKND is a collective of outdoors, music, crafts, adventure sports, and travel enthusiasts that want to share our experiences, connections, and expertise with the world.* |
| **Keywords** | Attract |
| **Pages discovered** | 64 (via crawl; no sitemap present) |
| **Locales** | 7 — `us` (27), `ca` (30), `ch` (3), `de`, `fr`, `es`, `it` (1 each) |
| **Analysis coverage** | 100% (64 / 64 pages, 0 failed) |

## 2. Template & Layout Identification

**6 distinct page types (layouts) identified** across the site:

| Template | Pages | Layout Description |
|----------|:-----:|--------------------|
| `adventure-detail` | 32 | Hero image, trip metadata sidebar, rich body copy + related content |
| `magazine-article` | 12 | Title, hero image, long-form editorial body |
| `homepage` | 11 | Locale landing page — hero banner + curated content teasers (this is the entry URL's type) |
| `content-overview` | 5 | Intro heading + teaser grid (about-us, magazine index, members-only) |
| `adventure-listing` | 2 | Grid of adventure teaser cards |
| `faq-page` | 2 | Heading + stacked question/answer default content |

## 3. Identified Block Variants

**31 unique block variants** cataloged across 225 block instances (196 reused via ≥80% similarity matching).

**Reusable EDS Blocks (24 variants → standard blocks):**

| Base Block | Variants | Notable Usage |
|------------|:--------:|---------------|
| `tabs` | 7 | up to 16 pages |
| `hero` | 5 | up to 14 pages |
| `carousel` | 4 | up to 14 pages |
| `quote` | 2 | 2 pages each |
| `cards` | 2 | 2 pages each |
| `accordion` | 1 | 2 pages |
| `breadcrumbs` | 1 | 44 pages (site-wide) |
| `header` / `footer` | 2 | Global (configuration model) |

**Default Authoring Content / Custom (7 "unknown" variants):**
These are content sequences that map to **default content** (headings, images, paragraphs, CTAs) rather than named blocks — e.g. *"1 heading + 1 image + 3 CTAs + 1 paragraph"* (12 pages), *"single image"* (10 pages), *"1 heading + 1 image"* (9 pages). These require author-content modeling or a decision to introduce new blocks.

*Homepage (target page) composition:* `carousel`, `hero` (×2), `cards`, plus default-content sequences.

## 4. Required Import Infrastructure

To migrate all 6 templates, the following import artifacts are needed:

**Block Parsers** (extract source DOM → EDS block tables) — one per reusable block family:
- `hero.js`, `carousel.js`, `cards.js`, `tabs.js`, `accordion.js`, `quote.js`, `breadcrumbs.js`
- Global: `header.js`, `footer.js` (configuration-driven)

**Page Transformers** (per-page cleanup & structure):
- **Cleanup transformer** — strip AEM authoring wrappers/panel containers (`div.carousel.panelcontainer`, etc.)
- **Section transformer** — establish section breaks between hero, teasers, and body regions
- **Metadata transformer** — carry title, description, canonical, keywords into page metadata
- **Image transformer** — map Dynamic Media / Scene7 asset references to EDS-optimized images
- **Default-content handler** — convert the 7 "unknown" sequences into default authoring content

**Page Templates:** 6 template skeletons (one per identified layout), driving template-based bulk import.

---

## Appendix — What Changed During Delivery

> *Added 2026-08-12. Everything above is the original **Aug 5, 2026** planning
> analysis, preserved verbatim. This appendix reconciles that point-in-time plan
> with what was actually built, so the artifact can be read alongside the shipped
> code. It corrects nothing in the original — a planning snapshot is expected to
> evolve during implementation.*

### Import infrastructure: planned vs. delivered

The Aug 5 plan (§4) sketched a per-block-family parser set and several
conceptual transformers. The delivered infrastructure in `tools/importer/`
consolidated this into **10 block parsers + 2 page transformers**, with the
metadata / image / default-content concerns handled *inside* those files rather
than as separate transformers.

| Aspect | Planned (Aug 5) | Delivered |
|--------|-----------------|-----------|
| Block parsers | Per family: `hero`, `carousel`, `cards`, `tabs`, `accordion`, `quote`, `breadcrumbs` + global `header`/`footer` | **10 parsers:** `accordion-faq`, `breadcrumbs`, `cards-profile`, `cards-teaser`, `carousel-gallery`, `carousel-hero`, `hero-banner`, `table-specs`, `tabs-detail`, `tabs-filter` |
| Page transformers | Cleanup, Section, Metadata, Image, Default-content (5 conceptual) | **2 transformers:** `wknd-cleanup.js`, `wknd-sections.js` (metadata, image/Scene7, and default-content handling folded in) |
| Import scripts | Template-based bulk import | **6 per-template import scripts** (+ bundles): `import-homepage`, `import-adventure-listing`, `import-adventure-detail`, `import-content-overview`, `import-faq-page`, `import-magazine-article` |
| Page templates | 6 skeletons | 6 templates (`tools/importer/page-templates.json`) |

### Bulk import outcome

- **54 pages imported, 0 failures** across all 6 templates
  (homepage 1 · adventure-detail 32 · adventure-listing 2 · magazine-article 12
  · content-overview 5 · faq-page 2).
- Note: the 3 magazine-index pages in `content-overview` imported as default
  content (0 blocks), while the about-us pages carried contributor cards — a
  structural split within one template group.

### Static import vs. dynamic authoring

The importer produces **static markup only**. Several pages were subsequently
hand-authored in Document Authoring (DA) to become **index/sheet-driven and
dynamic**, which the importer could not generate:

- **`cards-teaser`** — homepage "Recent Articles" and magazine "All Articles"
  listings (query-index driven).
- **`tabs-filter`** — Adventures category tabs (query-index driven).
- **`cards-profile`** — About Us contributors/guides (fed by a DA sheet,
  `contributors.json`).
- **`hero-banner`** — homepage featured adventure (query-index driven).
- **`accordion-faq`** — FAQ page, dual-mode (reads a DA sheet `faqs.json`,
  falls back to inline authoring).
- The 5 US magazine articles were re-authored **block-per-section**
  (`article-hero` → `breadcrumbs` → `article-title` → `article-section`(s) →
  `author-card` → `share-story`).

### Minor figure reconciliation

- **Similarity threshold.** §3 states matching at "≥80% similarity"; the Aug 5
  catalog artifact (`catalog/block-catalog.json`) records a
  `similarityThreshold` of `0.7` (70%). The reuse count (196 of 225 instances)
  is unaffected.

*Sources for this appendix: `tools/importer/` (parsers, transformers, import
scripts, `page-templates.json`), `catalog/block-catalog.json`,
`catalog/summary.json`, and `migration-work/migration-plan.md` — all dated
2026-08-05 except the delivered code.*
