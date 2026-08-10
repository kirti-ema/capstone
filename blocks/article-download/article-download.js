/**
 * Article "Download PDF" widget — a sidebar block on magazine articles that
 * offer a downloadable PDF (e.g. LA Skateparks). Renders below "SHARE THIS
 * STORY", above the related list.
 *
 * Content model: one cell holding the widget content in reading order —
 *   [H3 title link] [P "Get the Full Story"] [UL of file metadata] [P download link]
 * The author types exactly what the source shows. The block flattens the cell
 * and styling comes from the shared .article-download rules in styles.css
 * (14px/600 title, 16px uppercase label, values-only metadata, dark button).
 *
 * @param {Element} block The article-download block element
 */
export default function decorate(block) {
  const cell = block.querySelector(':scope > div > div') || block.querySelector(':scope > div');
  if (!cell) return;
  const content = document.createDocumentFragment();
  while (cell.firstChild) content.append(cell.firstChild);
  block.replaceChildren(content);
}
