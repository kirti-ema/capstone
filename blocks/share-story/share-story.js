/**
 * "SHARE THIS STORY" sidebar block — a static, authored replacement for the
 * loose <h5> + <ul> that flat magazine articles rely on. Renders the heading and
 * a list of related-article links (dark uppercase title over a muted date),
 * reusing the shared .article-aside sidebar styling (see styles.css). Sits in the
 * right column of the block-per-section article grid (.article-title-container).
 *
 * Content model: one cell per row.
 *   Row 1: heading text (e.g. "SHARE THIS STORY").
 *   Rows 2..n: one related link each, text "Title Weekday, DD Mon YYYY".
 *
 * Static by construction — no query-index dependency. The dynamic related list
 * was intentionally reverted (magazine index publishDate lags), so this block
 * deliberately does NOT fetch: the links and dates are authored.
 *
 * @param {Element} block The share-story block element
 */
const DATE_RE = /\s+((?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)[a-z]*,\s+\d{1,2}\s+[A-Za-z]{3,}\s+\d{4})$/;

export default function decorate(block) {
  const rows = [...block.children];
  const frag = document.createDocumentFragment();

  // first row = the sidebar heading
  const headingText = rows[0] ? rows[0].textContent.trim() : '';
  if (headingText) {
    const h5 = document.createElement('h5');
    h5.textContent = headingText;
    frag.append(h5);
  }

  // remaining rows = related-article links; split "Title Weekday, DD Mon YYYY"
  // into a dark uppercase title span over a muted date span (same markup and
  // classes the flat path / reverted dynamic path produce, so the CSS is shared).
  const links = rows.slice(1).map((row) => row.querySelector('a')).filter(Boolean);
  if (links.length) {
    const ul = document.createElement('ul');
    links.forEach((source) => {
      const text = source.textContent.trim();
      const m = text.match(DATE_RE);
      const title = m ? text.slice(0, m.index).trim() : text;
      const date = m ? m[1] : '';

      const a = document.createElement('a');
      a.href = source.getAttribute('href');
      const titleSpan = document.createElement('span');
      titleSpan.className = 'article-related-title';
      titleSpan.textContent = title;
      a.append(titleSpan);
      if (date) {
        const dateSpan = document.createElement('span');
        dateSpan.className = 'article-related-date';
        dateSpan.textContent = date;
        a.append(dateSpan);
      }

      const li = document.createElement('li');
      li.append(a);
      ul.append(li);
    });
    frag.append(ul);
  }

  block.replaceChildren(frag);
  // opt into the shared sidebar styling instead of duplicating it (same class the
  // flat article sidebar and the reverted dynamic cards-teaser both use)
  block.classList.add('article-aside');

  // Some articles (e.g. LA Skateparks) carry a "Download PDF" widget that the
  // source renders inside this sidebar — between the heading and the related
  // list — not in the body column. In block-per-section authoring it is a
  // separate .article-download block (which would otherwise fall into the left
  // body column), so relocate it here in that same order, mirroring the dynamic
  // cards-teaser sidebar. Then drop its now-empty section wrapper so it leaves
  // no empty grid cell. (article-download decorates first — blocks load in DOM
  // order and it precedes this block.)
  const section = block.closest('.section');
  const list = block.querySelector('ul');
  if (section) {
    const download = section.querySelector('.article-download');
    if (download && !block.contains(download)) {
      const dlWrapper = download.closest('.article-download-wrapper');
      if (list) list.before(download);
      else block.append(download);
      if (dlWrapper && !dlWrapper.childElementCount) dlWrapper.remove();
    }
  }
}
