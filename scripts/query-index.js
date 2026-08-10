/**
 * Shared query-index utility. ONE place every dynamic block fetches and
 * normalizes an aem.live `query-index.json` feed, plus the common path/date
 * helpers and sort comparators listings need. Blocks import from here instead
 * of writing their own fetch/sort logic, so all dynamic listings (magazine
 * cards-teaser, adventures listings, category-filtered tabs) behave the same.
 *
 * Each block's job is still its own: pick which index to read, filter/sort for
 * its purpose, and render its own card/slide markup. This module only owns the
 * shared plumbing.
 */

// In-page cache: multiple blocks on the same page that read the SAME index
// share a single network round-trip (keyed by the normalized same-origin
// path). Stores the in-flight promise so concurrent callers dedupe too.
const indexCache = new Map();

/**
 * Normalizes any authored index URL (a full https URL or a path) to a
 * same-origin path + query. The query-index.json is not served with CORS
 * headers, so a cross-origin fetch (e.g. a page on *.aem.live or localhost
 * fetching from *.aem.page) is blocked. Reducing to the pathname keeps every
 * fetch same-origin so it resolves on preview, live, and local alike.
 * @param {string} rawHref The authored URL (full or path)
 * @returns {string} same-origin path + query (rawHref unchanged if unparseable)
 */
export function toSameOriginPath(rawHref) {
  try {
    const u = new URL(rawHref, window.location.href);
    return `${u.pathname}${u.search}`;
  } catch (e) {
    // keep rawHref if it isn't a parseable URL
    return rawHref;
  }
}

/**
 * Strips the `.html` extension and any trailing slash from a path so two
 * same-origin paths compare equal (query-index paths carry neither, but
 * window.location.pathname may). Used for "exclude self" comparisons.
 * @param {string} path
 * @returns {string}
 */
export function normalizePath(path) {
  return (path || '').replace(/\.html$/, '').replace(/\/$/, '');
}

/**
 * Fetches a query-index feed and returns its `data` rows. Uses 'no-cache' to
 * force a revalidation round-trip (the index is served with a long max-age, so
 * a plain fetch would keep showing a stale listing and miss newly published
 * entries) — a cheap 304 when unchanged, fresh data when it changed. Results
 * are memoized per page so several blocks reading one index fetch only once;
 * each caller gets a fresh array copy so no consumer can disturb another.
 * @param {string} rawHref The authored index URL (full or path)
 * @returns {Promise<Array>} the data rows (throws on network/HTTP error)
 */
export async function fetchIndex(rawHref) {
  const url = toSameOriginPath(rawHref);
  if (!indexCache.has(url)) {
    const promise = (async () => {
      const resp = await fetch(url, { cache: 'no-cache' });
      if (!resp.ok) throw new Error(`query-index ${resp.status}`);
      const json = await resp.json();
      return Array.isArray(json.data) ? json.data : [];
    })().catch((e) => {
      // don't cache a failure — allow a later retry
      indexCache.delete(url);
      throw e;
    });
    indexCache.set(url, promise);
  }
  const data = await indexCache.get(url);
  return [...data];
}

/**
 * Parses the human publish-date string the index stores ("Thursday, 9 Jul
 * 2020") to a sortable timestamp. Returns 0 when absent/unparseable so undated
 * entries sort last under a newest-first sort.
 * @param {string} s
 * @returns {number}
 */
export function parsePublishDate(s) {
  if (!s) return 0;
  const t = Date.parse(s.replace(/^[A-Za-z]+,\s*/, '')); // drop leading weekday
  return Number.isNaN(t) ? 0 : t;
}

/**
 * The authored numeric `cardOrder` for an entry, or NaN when absent/blank.
 * A number selects an entry into a curated listing and sets its ascending
 * position; blank means "not shown" in curated listings.
 * @param {Object} entry
 * @returns {number}
 */
export function cardOrderOf(entry) {
  const n = parseFloat(entry.cardOrder);
  return Number.isFinite(n) ? n : NaN;
}

/** Comparator: alphabetical by title (A→Z), case-insensitive. */
export function byTitle(a, b) {
  return (a.title || '').localeCompare(b.title || '', undefined, { sensitivity: 'base' });
}

/** Comparator: ascending by authored cardOrder. */
export function byCardOrder(a, b) {
  return cardOrderOf(a) - cardOrderOf(b);
}

/** Comparator: newest publish date first. */
export function byPublishDateDesc(a, b) {
  return parsePublishDate(b.publishDate) - parsePublishDate(a.publishDate);
}

/** Comparator: most-recently modified first. */
export function byLastModifiedDesc(a, b) {
  return Number(b.lastModified || 0) - Number(a.lastModified || 0);
}
