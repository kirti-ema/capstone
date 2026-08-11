# INSTRUCTIONS.md — Rules, Conventions & Workflows

> How to work in this project. Read with `CONTEXT.md` (state/architecture) and
> `AGENTS.md` (Adobe EDS boilerplate rules). Last updated: 2026-08-11
> (magazine articles block-per-section + DA image self-hosting).

## Golden rules (do / don't)

- **DON'T commit content.** `content/**` is git-ignored — it lives in DA, not git.
  Never expect it in a PR/commit.
- **DON'T hand-edit `content/*.plain.html` as normal practice** (AGENTS.md rule:
  use the importer). **EXCEPTION (approved):** dynamic pages the importer can't
  produce (tabs-filter, cards-profile, dynamic cards-teaser) AND the block-per-section
  magazine articles (see that section) are hand-authored. When you do, flag it as
  the exception, and always **edit BOTH sides** (see below).
- **DON'T touch `scripts/aem.js`** — core library, never modify.
- **DON'T handle pasted secrets.** Never accept/store/use a token pasted in chat
  (GitHub PAT, Adobe IMS/DA Bearer, API key). Creds are auto-injected for git /
  admin.hlx.page / admin.da.live **only if** the Settings opt-in is on. On 401/403,
  tell the user to enable Settings → LLM Permissions — never ask for a token.
- **DO scope all block CSS** to `.{blockname}` (never bare `.item-list`; avoid
  `{blockname}-container`/`-wrapper`). Mobile-first; `min-width` at 600/900/1200px.
- **DO verify by rendering**, not by asserting. Use preview URL + Playwright.

## local ↔ DA parity (the #1 durability rule)

The EMA **"sync"** button overwrites DA from local `content/**/*.plain.html`
(local is treated as source of truth). So a DA-API-only edit **reverts** on the
next sync. To make a page-body change durable, edit **both**:
1. **Local** `content/.../<page>.plain.html` — bare inner `<div>…</div>` (no
   `<body>/<main>` wrapper).
2. **DA** via `POST admin.da.live/source/...` — wrap the same inner as:
   ```
   <body>
     <header></header>
     <main>INNER</main>
     <footer></footer>
   </body>
   ```
Then preview. Verify parity: `local file == DA <main> inner` (byte-identical).
When in doubt, fetch the DA source, extract its `<main>` inner, and write that
verbatim to the local file. Currently **all touched pages are at parity**.

## Deploy order

1. Push **code** first (branch → PR → `main`); wait ~30s for Code Sync.
2. Then **POST/preview/publish DA** docs.
3. PR description **must** include a preview URL (`https://main--capstone--kirti-ema.aem.page/{path}`) or the PR is rejected (AGENTS.md).
- Current working branch is often `develop`; **deploy branch is `main`**.

## Commands

- Dev server: `npx -y @adobe/aem-cli up --no-open --forward-browser-logs` (localhost:3000, auto-reload).
- Lint before commit: `npm run lint` (`lint:js` eslint + `lint:css` stylelint). Fix: `npm run lint:fix`.
- Inspect content: `curl http://localhost:3000/path` (+ `.md`, `.plain.html`).
- Commit message trailer: `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`.

## Authoring conventions (DA)

- **Metadata block**, not loose paragraphs. A page's Title/Description/etc. go in
  a `metadata` block table (`<div class="metadata"><div><div>Title</div><div>…</div></div>…`),
  which renders as `<meta>` tags in the head (invisible in the body — that's
  correct). Matches how About Us is authored.
- **`card-image` / any index image field = TEXT path, never `<img>`.** An `<img>`
  in a metadata cell 404s (`about:error`) and corrupts og:image.
- **Contributors data** is a DA **sheet** at `/us/en/about-us/contributors.json`
  (add a person = add a row); `cards-profile` renders it dynamically.
- Dynamic block shapes (recovered, keep exact):
  - tabs-filter: `<div class="tabs-filter"><div><div>All, Climbing, Cycling, Skiing, Surfing, Travel</div></div><div><div><a href="/us/en/adventures/query-index.json">…</a></div></div></div>`
  - cards-profile: `<div class="cards-profile"><div><div>Contributor|Guide</div></div><div><div><a href="/us/en/about-us/contributors.json">…</a></div></div></div>`

## Magazine article block-per-section (all 5 done; reference = arctic-surfing)

Detail articles are authored as explicit blocks in ONE content section (metadata
in a 2nd), NOT flat content. Block order = the 2-col grid via `.article-title-container`:
`article-hero` → `breadcrumbs` → `article-title` → `article-section`(s) →
`author-card` → `share-story`. Hero + breadcrumbs span both columns; share-story
is the right sidebar (rises to the title row).

- **article-title**: row1 title (→ single H1), row2 byline (→ paragraph, never a heading).
  Do NOT re-add the source's duplicate CF title.
- **article-section**: one cell per row in reading order (H2 + paras + images).
  Multi-row = multiple stacked sub-sections. Variants: `quote` (grey `#ebebeb` box,
  used when source has `cmp-text--quote`), `quote small` (plain inset, no box —
  arctic only). **Check the source per article.**
- **author-card**: 4 rows — photo / name (**H2**, required by detection) / role / socials.
- **share-story**: row1 heading, then one row per dated related link. **Static**
  (authored links+dates); do NOT make it fetch (see reverted dynamic sidebar).
  It auto-relocates a sibling `article-download` block into itself (heading →
  download → list), so a Download-PDF widget lands in the sidebar (guide-la only).
- **PAGE-SPECIFIC** (read source each time): #sections, quote variant, download
  widget, byline/author/filenames/alt, source typos kept verbatim (arctic "revelas").

## Image path forms (critical — causes broken images)

EDS optimizes an image **only** when its `<picture><source srcset>` uses a
**relative `/media-da/{docpath}/{name}-<hashes>.ext`** reference. It then rewrites
to an optimized `./media_<hash>.<ext>` on render.

- **Working `<picture>`:** `<source srcset="/media-da/...">` (relative) +
  `<img src="https://content.da.live/.../.{slug}/...">` fallback. EDS reads the
  `<img>` fallback / relative source and optimizes. This mixed form is HEALTHY.
- **BROKEN — `about:error` hero:** all slots (`<source>` **and** `<img>`) use
  **absolute `content.da.live` URLs**. `content.da.live` returns **401** to
  anonymous requests, so EDS can't fetch/optimize → `<img src="about:error">`.
  **Fix:** set the two hero `<source srcset>` to the **relative `/media-da/`**
  form (leave the `<img>` content.da.live fallback as-is).
- **BROKEN — mangled `/media-da/`:** the `<img>` fallback path has one EXTRA
  trailing hash segment (401/404). **Fix:** `content.da.live/.../.{slug}/{name}-<hashes>.ext`
  = the `/media-da` form with the folder dot-prefixed and last hash dropped.
- **Hash-count rule (verified):** the `content.da.live` `<img>` form has **+3**
  trailing hash segments vs the `/media-da` `<source>` form (e.g. 8 vs 11, or
  6 vs 9). Do **not** assume a fixed count — derive per image.
- `/media-da/...` paths **404 if fetched directly** (curl) — they resolve only
  inside EDS render. **Always verify via the rendered page**, not curl.
- When a good source is missing, archived copies live in
  `migration-work/da-edits/<slug>*.html`.

**DA image insert (self-hosting):** to store an image IN DA, **drag the file from
the OS file window** into the DA doc. **Paste-from-source-tab creates a `wknd.site`
HOTLINK** (renders/optimizes, but depends on wknd.site). A clean DA upload yields
`content.da.live/.../.{slug}/{name}.ext` (no hash chain) which renders + optimizes.
The **mangled hash-chain** `content.da.live/....-hash-hash-hash.ext` form is BROKEN
(`about:error`) — the 4 non-arctic magazine articles all had this until re-uploaded.
Restructuring a page does NOT fix images; they must be re-uploaded. Local `curl` /
dev server always shows `about:error` for these — verify on the **deployed preview**.

## Verification recipe (image/layout fix)

1. `POST` fixed source to DA → expect HTTP 200.
2. `POST admin.hlx.page/preview/.../{path}` → 200; then (to go live) `.../live/...`.
3. Fetch `…aem.page/{path}.plain.html` → assert **`/media-da` count == 0** in the
   *rendered* output and images rewrite to `media_*`.
4. Playwright: navigate the page, force-load images, assert `naturalWidth > 0`
   and `about:error` count == 0.
5. Re-align the local file to the DA `<main>` inner (parity).

## Known issues & workarounds

- **Sync reverts DA-only edits.** → Always edit both local + DA (see parity rule).
- **`about:error` hero** = absolute content.da.live in `<source>`. → relative /media-da.
- **Mangled `/media-da` image** = extra trailing hash. → drop one segment, dot-prefix folder.
- **guide-la-skateparks PDF links revert to `-pdf` (hyphen, 404).** Correct is
  `.pdf` (dot). There are **2** such anchors. **Verify with an ESCAPED dot** —
  `grep -E 'ultimateguidetolaskateparks-pdf'`; an unescaped `.pdf` pattern falsely
  matches the hyphen form and hides the bug (burned twice).
- **Indexer content-cache lag.** After authoring `publishDate`/`category`/`groupSize`,
  the rendered head + `.md` update immediately, but `query-index.json` records
  stay stale for minutes→indeterminate; re-preview/reindex won't force it. Don't
  build features that assume the index is instantly fresh (why the dynamic
  SHARE-sidebar was reverted).
- **SHARE sidebar is static by design.** All 5 articles now use the static
  `share-story` block (authored `<ul>` of dated links). It is NOT the dynamic
  cards-teaser and its static-ness is intentional (publishDate index lag) — do
  NOT make it fetch.
- **`buildAuthorBioBlock` bails** if the author photo `<p><picture>` before the
  author `<h2>` is missing → 2-col layout + author card disappear. A broken image
  path can trigger this. Re-POSTing raw-import local files (mangled paths) caused
  this regression before.

## DA version history (restore)

`GET https://admin.da.live/versionlist/{org}/{repo}/{path}.html` → entries.
Those with a `url` (label "Published"/"Previewed") are fetchable at
`https://admin.da.live/versionsource{url}`. Auto-save entries (label=None) have
no fetchable url. Restore = fetch that snapshot, POST back to `admin.da.live/source/...`, preview.

## Docs to keep updated as the project evolves

- **CONTEXT.md** — when status changes: pages made dynamic, blocks added,
  index/token changes, CA locale work, reverted-code decisions.
- **INSTRUCTIONS.md** — when a new gotcha/workaround is discovered, a convention
  changes, or a new authoring/deploy step is added.
- `helix-query.yaml` comments are the source of truth for index field semantics —
  mirror changes here.
