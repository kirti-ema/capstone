import { createOptimizedPicture, toClassName } from '../../scripts/aem.js';
import {
  fetchIndex,
  cardOrderOf,
  byCardOrder,
  byLastModifiedDesc,
} from '../../scripts/query-index.js';

/**
 * Builds the two authored rows a hero-banner expects from a query-index entry —
 * row 1: an image cell wrapping the picture (authored cardImage preferred over
 * the page hero image); row 2: a content cell with the title (h2), description,
 * and a "See Trip" CTA to the adventure. This matches
 * the inline-authored hero-banner shape exactly, so the block's own decoration
 * and CSS (image detection, overlay box, wknd-button) treat it identically.
 * @param {Object} entry a query-index row { path, title, description, image, cardImage }
 * @returns {HTMLElement[]} [imageRow, contentRow]
 */
function buildFeaturedRows(entry) {
  const imageRow = document.createElement('div');
  const imageCell = document.createElement('div');
  // prefer an authored card crop (cardImage) over the page's hero (image), so a
  // curated listing can pin a specific crop — same precedence as cards-teaser.
  const img = entry.cardImage || entry.image;
  if (img) {
    imageCell.append(createOptimizedPicture(img, entry.title || '', false, [{ width: '2000' }]));
  }
  imageRow.append(imageCell);

  const contentRow = document.createElement('div');
  const contentCell = document.createElement('div');
  const h2 = document.createElement('h2');
  h2.id = toClassName(entry.title || '');
  h2.textContent = entry.title || '';
  contentCell.append(h2);
  if (entry.description) {
    const p = document.createElement('p');
    p.textContent = entry.description;
    contentCell.append(p);
  }
  const ctaP = document.createElement('p');
  const cta = document.createElement('a');
  cta.href = entry.path;
  cta.textContent = 'See Trip';
  ctaP.append(cta);
  contentCell.append(ctaP);
  contentRow.append(contentCell);

  return [imageRow, contentRow];
}

/**
 * Picks the single adventure to feature: the entry authored `Featured = true`
 * (lowest cardOrder wins if more than one), else the lowest card-ordered entry,
 * else the most recently modified. Guarantees a pick from a non-empty index so
 * the banner never renders empty once the index resolves.
 * @param {Array} data query-index rows
 * @returns {Object|undefined}
 */
function pickFeatured(data) {
  const isFeatured = (e) => String(e.featured).toLowerCase() === 'true';
  const featured = data.filter(isFeatured);
  if (featured.length) {
    return [...featured].sort(byCardOrder)[0];
  }
  const ordered = data.filter((e) => Number.isFinite(cardOrderOf(e)));
  if (ordered.length) {
    return [...ordered].sort(byCardOrder)[0];
  }
  return [...data].sort(byLastModifiedDesc)[0];
}

/**
 * Dynamic mode: the block holds a query-index .json URL (opt-in). Fetch the
 * index, pick the featured adventure, and render it in the standard hero-banner
 * two-row shape. On empty/error the block is removed so no broken/raw-URL banner
 * is left behind (the "Next Adventures" heading, default content, remains).
 * @param {Element} block the hero-banner block
 * @param {string} rawHref the authored index URL (from a link or plain text)
 * @returns {Promise<boolean>} true if a featured banner was rendered
 */
async function decorateDynamic(block, rawHref) {
  try {
    const data = await fetchIndex(rawHref);
    const entry = pickFeatured(data);
    if (!entry) {
      block.remove();
      return false;
    }
    block.replaceChildren(...buildFeaturedRows(entry));
    return true;
  } catch (e) {
    // network/parse failure — leave no broken block behind
    // eslint-disable-next-line no-console
    console.warn('hero-banner: failed to load featured adventure', e);
    block.remove();
    return false;
  }
}

/**
 * loads and decorates the block
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  // Dynamic mode is opt-in: a query-index .json URL inside the authored table
  // (as a link or plain text). Inline-authored banners carry no .json and are
  // untouched, so existing instances render byte-identically. On failure the
  // block is removed, so skip the static decoration below.
  const jsonLink = block.querySelector('a[href*=".json"]');
  const jsonText = jsonLink ? null
    : (block.textContent.match(/https?:\/\/\S+\.json|\/\S+\.json/) || [])[0];
  if (jsonLink || jsonText) {
    const rendered = await decorateDynamic(block, jsonLink ? jsonLink.getAttribute('href') : jsonText);
    if (!rendered) return;
  }

  if (!block.querySelector(':scope > div:first-child picture')) {
    block.classList.add('no-image');
  }
  // the CTA link ("See Trip") is the shared yellow WKND button
  block.querySelectorAll('a[href]').forEach((a) => a.classList.add('wknd-button'));
}
