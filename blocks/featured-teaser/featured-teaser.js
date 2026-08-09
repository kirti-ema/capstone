/**
 * Featured Teaser block — the homepage "Featured Article" promo.
 *
 * Built via auto-blocking (see buildFeaturedAutoBlock in scripts.js) from the
 * section marked `Style=featured` in the content. The auto-block hands us a
 * single row with two cells: [0] the text content (eyebrow, heading, body,
 * CTA) and [1] the image. This decorator tags those cells and the inner text
 * roles so the CSS can lay them out (stacked on mobile, image-left /
 * grey-box-right on desktop) without relying on positional selectors.
 *
 * @param {Element} block The featured-teaser block element
 */
export default function decorate(block) {
  const row = block.firstElementChild;
  if (!row) return;

  const [textCol, imageCol] = [...row.children];
  if (textCol) textCol.classList.add('featured-teaser-text');
  if (imageCol) imageCol.classList.add('featured-teaser-image');

  // flatten the wrapping row so the two cells are direct grid children
  block.append(...row.children);
  row.remove();

  if (textCol) {
    const eyebrow = textCol.querySelector(':scope > p');
    if (eyebrow) eyebrow.classList.add('featured-teaser-eyebrow');

    const ctaLink = textCol.querySelector('p a[href]');
    const ctaP = ctaLink ? ctaLink.closest('p') : null;
    if (ctaP) ctaP.classList.add('featured-teaser-cta');
    // the CTA is the shared yellow WKND button
    if (ctaLink) ctaLink.classList.add('wknd-button');
  }
}
