import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Article body section — one repeatable block per editorial section of a
 * magazine article (intro, "The front", "Clear skies", etc.). All four body
 * sections share the same shape, so authors repeat this one block.
 *
 * Content model: a single flowing content cell. The author types the section's
 * content in natural reading order — an optional H2 heading, one or more
 * paragraphs, and an optional inline image, in whatever order they appear in
 * the section (the source varies: some sections lead with the image, some end
 * with it, some put it mid-text). The block just tags and optimizes.
 *
 * Variant: "article-section (quote)" renders a pull-quote. Authored as a single
 * cell whose content is the quote (a blockquote or a plain paragraph); the
 * block promotes it to a <blockquote> styled as the large serif pull-quote.
 *
 * @param {Element} block The article-section block element
 */
export default function decorate(block) {
  const isQuote = block.classList.contains('quote');

  // flatten the single-cell wrapper: move the authored content up into the block
  const cell = block.querySelector(':scope > div > div') || block.querySelector(':scope > div');
  if (cell) {
    const content = document.createElement('div');
    content.className = 'article-section-body';
    while (cell.firstChild) content.append(cell.firstChild);
    block.replaceChildren(content);

    if (isQuote) {
      // promote the quote text to a <blockquote> if it isn't one already
      if (!content.querySelector('blockquote')) {
        const bq = document.createElement('blockquote');
        while (content.firstChild) bq.append(content.firstChild);
        content.append(bq);
      }
    }

    // optimize any inline images (match the article body width)
    content.querySelectorAll('picture img').forEach((img) => {
      const picture = img.closest('picture');
      picture.replaceWith(createOptimizedPicture(img.src, img.alt || '', false, [{ width: '1600' }]));
    });
  }
}
