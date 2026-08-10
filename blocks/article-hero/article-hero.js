import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Article hero image — the full-width lead image at the top of a magazine
 * article, above the breadcrumbs and title.
 *
 * Content model: one row, one cell, containing the hero image. An optional
 * second row may hold alt/caption text (used as the image alt when present).
 *
 * @param {Element} block The article-hero block element
 */
export default function decorate(block) {
  const img = block.querySelector('picture img');
  // optional alt text authored in a second cell (first cell = image)
  const altCell = [...block.querySelectorAll(':scope > div')]
    .map((row) => row.textContent.trim())
    .find((t) => t);

  if (img) {
    const optimized = createOptimizedPicture(
      img.src,
      altCell || img.alt || '',
      true, // eager — this is the LCP image
      [{ width: '2000' }],
    );
    block.replaceChildren(optimized);
  } else {
    block.replaceChildren();
  }
}
