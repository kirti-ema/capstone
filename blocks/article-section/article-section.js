import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Article body section(s). One block can hold ONE row (a single section: the
 * lead-in intro, or a pull-quote) or MANY rows (one row per titled sub-section:
 * "The front", "Clear skies", "Mythical northern lights"). Consolidating the
 * repeatable titled sections into one multi-row block means less scrolling and
 * adding a 4th section is one new row, not a whole new block table.
 *
 * Content model: one cell per row. The author writes that section's content in
 * natural reading order — an optional H2 heading, one or more paragraphs, and
 * an optional image, in whatever order they appear (the source varies: some
 * sections lead with the image, some end with it, some put it mid-text). A
 * single flowing cell preserves that exact order; the block just tags/optimizes
 * each row into its own rendered section (so N rows render as N stacked
 * sections, identical to N separate blocks).
 *
 * Variant: "article-section (quote)" renders a pull-quote — a single row whose
 * cell content is promoted to a <blockquote> styled as the large serif quote.
 *
 * @param {Element} block The article-section block element
 */
export default function decorate(block) {
  const isQuote = block.classList.contains('quote');
  const rows = [...block.children];

  // Rebuild each authored row as its own .article-section-body section, so a
  // multi-row block renders as several stacked sections (visually identical to
  // the same rows authored as separate blocks). Single-row instances (intro,
  // quote) simply produce one section.
  const sections = rows.map((row) => {
    const cell = row.firstElementChild || row;
    const section = document.createElement('div');
    section.className = 'article-section-body';
    while (cell.firstChild) section.append(cell.firstChild);

    if (isQuote && !section.querySelector('blockquote')) {
      // promote loose quote text to a <blockquote>
      const bq = document.createElement('blockquote');
      while (section.firstChild) bq.append(section.firstChild);
      section.append(bq);
    }

    // optimize inline images (match the article body width)
    section.querySelectorAll('picture img').forEach((img) => {
      const picture = img.closest('picture');
      picture.replaceWith(createOptimizedPicture(img.src, img.alt || '', false, [{ width: '1600' }]));
    });

    return section;
  });

  block.replaceChildren(...sections);
}
