/**
 * Breadcrumbs block.
 *
 * Content model: one row per crumb. Each row has a single cell containing
 * either a link (an ancestor page) or plain text (the current page, which is
 * rendered as the active, non-linked trail item). The last crumb is treated
 * as the current page.
 *
 * @param {Element} block The breadcrumbs block element
 */
export default async function decorate(block) {
  const nav = document.createElement('nav');
  nav.setAttribute('aria-label', 'Breadcrumb');

  const list = document.createElement('ol');
  list.className = 'breadcrumbs-list';

  const rows = [...block.children];
  rows.forEach((row, i) => {
    const cell = row.firstElementChild || row;
    const item = document.createElement('li');
    item.className = 'breadcrumbs-item';

    const isLast = i === rows.length - 1;
    const link = cell.querySelector('a');

    if (link && !isLast) {
      item.append(link);
    } else {
      // Current page (or a crumb with no link): render as active plain text.
      item.classList.add('breadcrumbs-item-active');
      item.setAttribute('aria-current', 'page');
      item.textContent = (link ? link.textContent : cell.textContent).trim();
    }

    list.append(item);
  });

  nav.append(list);
  block.replaceChildren(nav);
}
