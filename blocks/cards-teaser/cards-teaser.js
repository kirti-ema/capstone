import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Tags the section-level "All Articles" / "All Trips" CTA (a paragraph whose
 * only child is a single link) with the shared yellow WKND button class, so it
 * matches the CTAs in the other blocks. Scoped to this block's section. Shared
 * by both the static and dynamic render paths. Takes the section explicitly so
 * it still works when the block itself has been removed (failed fetch).
 * @param {Element} section The block's section element
 */
function tagSectionCtas(section) {
  if (!section) return;
  section.querySelectorAll(':scope > .default-content-wrapper p > a:only-child').forEach((a) => {
    a.classList.add('wknd-button');
  });
}

/**
 * Wraps each card image in an anchor to the same destination as the title, like
 * the source (image + title both link to the article). aria-hidden + tabindex=-1
 * so it is mouse-clickable but adds no duplicate keyboard/screen-reader stop.
 * @param {Element} ul The card list
 */
function linkCardImages(ul) {
  ul.querySelectorAll('li').forEach((li) => {
    const titleLink = li.querySelector('.cards-teaser-card-body h3 a[href]');
    const picture = li.querySelector('.cards-teaser-card-image picture');
    if (!titleLink || !picture || picture.closest('a')) return;
    const imgLink = document.createElement('a');
    imgLink.href = titleLink.getAttribute('href');
    imgLink.setAttribute('aria-hidden', 'true');
    imgLink.setAttribute('tabindex', '-1');
    picture.replaceWith(imgLink);
    imgLink.append(picture);
  });
}

/**
 * Static mode: the authored rows ARE the cards. Reshape the block's rows into
 * the <ul>/<li> card structure. Unchanged from the original block behaviour —
 * used by "Recent Articles" (fallback), "Where do you want to go?", and the
 * auto-blocked magazine "All Articles" list.
 * @param {Element} block The block element
 */
function decorateStatic(block) {
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) div.className = 'cards-teaser-card-image';
      else div.className = 'cards-teaser-card-body';
    });
    ul.append(li);
  });
  ul.querySelectorAll('picture > img').forEach((img) => img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }])));
  linkCardImages(ul);
  block.replaceChildren(ul);
}

/**
 * Builds one card <li> from a query-index entry, using the exact same markup
 * and classes decorateStatic produces (so the CSS is shared, no changes).
 * @param {Object} entry A query-index row: { path, title, description, image }
 * @returns {HTMLLIElement}
 */
function buildCardFromEntry(entry) {
  const li = document.createElement('li');

  // image cell (only if the entry has an image — degrade gracefully otherwise)
  const imageDiv = document.createElement('div');
  imageDiv.className = 'cards-teaser-card-image';
  if (entry.image) {
    const imgLink = document.createElement('a');
    imgLink.href = entry.path;
    imgLink.setAttribute('aria-hidden', 'true');
    imgLink.setAttribute('tabindex', '-1');
    imgLink.append(createOptimizedPicture(entry.image, entry.title || '', false, [{ width: '750' }]));
    imageDiv.append(imgLink);
  }

  // body cell: h3 > title link, then description
  const bodyDiv = document.createElement('div');
  bodyDiv.className = 'cards-teaser-card-body';
  const h3 = document.createElement('h3');
  const titleLink = document.createElement('a');
  titleLink.href = entry.path;
  titleLink.textContent = entry.title || '';
  h3.append(titleLink);
  bodyDiv.append(h3);
  if (entry.description) {
    const p = document.createElement('p');
    p.textContent = entry.description;
    bodyDiv.append(p);
  }

  li.append(imageDiv, bodyDiv);
  return li;
}

/**
 * Dynamic mode: the block holds a query-index .json URL plus an optional
 * numeric max-card limit. Fetch the index, sort most-recent first, and render
 * one card per entry. On empty/error the block is removed so no broken layout
 * or empty box is left behind (the section heading + CTA remain).
 * @param {Element} block The block element
 * @param {string} rawHref The authored query-index URL (from a link or text)
 * @param {Element} section The block's section (for CTA tagging after removal)
 */
async function decorateDynamic(block, rawHref, section) {
  // Normalize the authored URL to a same-origin path. The query-index .json
  // is not served with CORS headers, so a cross-origin fetch (e.g. a page on
  // *.aem.live or localhost fetching from *.aem.page) is blocked. Authors may
  // paste a full https URL; reduce it to its pathname (+query) so the fetch is
  // always same-origin and resolves on preview, live, and local alike.
  let jsonUrl = rawHref;
  try {
    const u = new URL(rawHref, window.location.href);
    jsonUrl = `${u.pathname}${u.search}`;
  } catch (e) {
    // keep rawHref if it isn't a parseable URL
  }

  // optional limit: the first cell whose text is a plain integer
  const limitText = [...block.querySelectorAll('div')]
    .map((d) => d.textContent.trim())
    .find((t) => /^\d+$/.test(t));
  const limit = limitText ? parseInt(limitText, 10) : 0;

  // reserve the list up front (empty <ul> has no height, so no layout flash;
  // the raw authored config never shows because the section stays hidden until
  // its blocks finish loading).
  const ul = document.createElement('ul');
  block.replaceChildren(ul);

  try {
    const resp = await fetch(jsonUrl);
    if (!resp.ok) throw new Error(`query-index ${resp.status}`);
    const json = await resp.json();
    let entries = Array.isArray(json.data) ? json.data : [];

    // most-recent first (lastModified is epoch seconds as a string/number)
    entries.sort((a, b) => Number(b.lastModified || 0) - Number(a.lastModified || 0));
    if (limit > 0) entries = entries.slice(0, limit);

    if (!entries.length) {
      block.remove();
      tagSectionCtas(section);
      return;
    }

    entries.forEach((entry) => ul.append(buildCardFromEntry(entry)));
  } catch (e) {
    // network/parse failure — leave no broken/empty block behind
    // eslint-disable-next-line no-console
    console.warn('cards-teaser: failed to load dynamic listing', e);
    block.remove();
    tagSectionCtas(section);
  }
}

/**
 * loads and decorates the block
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const section = block.closest('.section');

  // Dynamic mode is opt-in: a query-index .json URL inside the authored table.
  // Accept it either as a link (<a href="…json">) or as plain text (authors
  // often paste a URL that DA renders as text, not a link). Static card rows
  // link to article pages (never .json) and carry no .json text, so existing
  // instances ("Recent Articles" fallback, "Where do you want to go?", magazine
  // "All Articles") never match and are untouched.
  const jsonLink = block.querySelector('a[href*=".json"]');
  const jsonText = jsonLink ? null
    : (block.textContent.match(/https?:\/\/\S+\.json|\/\S+\.json/) || [])[0];
  if (jsonLink || jsonText) {
    await decorateDynamic(block, jsonLink ? jsonLink.getAttribute('href') : jsonText, section);
  } else {
    decorateStatic(block);
  }

  tagSectionCtas(section);
}
