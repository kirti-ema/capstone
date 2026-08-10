/**
 * Article title + byline — the magazine article headline and author line.
 *
 * Content model: two rows, one cell each.
 *   Row 1: the article title (plain text) — rendered as the page <h1>.
 *   Row 2: the byline, e.g. "By Jacob Wester" (plain text) — rendered as a
 *          small uppercase label. Optional (adventure pages have no byline).
 *
 * NOTE: there is deliberately NO duplicate-title row. The imported Content
 * Fragment repeated the title a second time; the live WKND source renders only
 * one title, so this block emits exactly one <h1> + one byline.
 *
 * @param {Element} block The article-title block element
 */
export default function decorate(block) {
  const rows = [...block.querySelectorAll(':scope > div')];
  const titleText = rows[0] ? rows[0].textContent.trim() : '';
  const bylineText = rows[1] ? rows[1].textContent.trim() : '';

  const frag = document.createDocumentFragment();

  if (titleText) {
    const h1 = document.createElement('h1');
    h1.className = 'article-title-heading';
    h1.textContent = titleText;
    frag.append(h1);
  }

  if (bylineText) {
    const byline = document.createElement('p');
    byline.className = 'article-title-byline';
    byline.textContent = bylineText;
    frag.append(byline);
  }

  block.replaceChildren(frag);
}
