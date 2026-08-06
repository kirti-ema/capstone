import { toClassName, createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Converts the inner "Cards Teaser" table of a tab panel into a
 * teaser-card grid (image + uppercase title + description), matching
 * the look of the cards-teaser block.
 * @param {Element} panel The tab panel element containing the table
 */
function decorateCards(panel) {
  const table = panel.querySelector('table');
  if (!table) return;

  const ul = document.createElement('ul');
  ul.className = 'tabs-filter-cards';

  table.querySelectorAll('tbody tr').forEach((tr) => {
    const cells = [...tr.children];
    if (cells.length < 2) return;
    const [imageCell, bodyCell] = cells;

    const li = document.createElement('li');

    const imageDiv = document.createElement('div');
    imageDiv.className = 'tabs-filter-card-image';
    while (imageCell.firstChild) imageDiv.append(imageCell.firstChild);

    const bodyDiv = document.createElement('div');
    bodyDiv.className = 'tabs-filter-card-body';
    while (bodyCell.firstChild) bodyDiv.append(bodyCell.firstChild);

    li.append(imageDiv, bodyDiv);
    ul.append(li);
  });

  // optimize images
  ul.querySelectorAll('picture > img').forEach((img) => {
    img.closest('picture').replaceWith(
      createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]),
    );
  });

  table.closest('.image-list, div')?.remove?.();
  panel.replaceChildren(ul);
}

/**
 * loads and decorates the tabs-filter block
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  // build tablist
  const tablist = document.createElement('div');
  tablist.className = 'tabs-filter-list';
  tablist.setAttribute('role', 'tablist');

  // decorate tabs and tabpanels
  const tabs = [...block.children].map((child) => child.firstElementChild);
  tabs.forEach((tab, i) => {
    const id = toClassName(tab.textContent);

    // decorate tabpanel
    const tabpanel = block.children[i];
    tabpanel.className = 'tabs-filter-panel';
    tabpanel.id = `tabpanel-${id}`;
    tabpanel.setAttribute('aria-hidden', !!i);
    tabpanel.setAttribute('aria-labelledby', `tab-${id}`);
    tabpanel.setAttribute('role', 'tabpanel');

    // build tab button
    const button = document.createElement('button');
    button.className = 'tabs-filter-tab';
    button.id = `tab-${id}`;
    button.innerHTML = tab.innerHTML;

    button.setAttribute('aria-controls', `tabpanel-${id}`);
    button.setAttribute('aria-selected', !i);
    button.setAttribute('role', 'tab');
    button.setAttribute('type', 'button');
    button.addEventListener('click', () => {
      block.querySelectorAll('[role=tabpanel]').forEach((panel) => {
        panel.setAttribute('aria-hidden', true);
      });
      tablist.querySelectorAll('button').forEach((btn) => {
        btn.setAttribute('aria-selected', false);
      });
      tabpanel.setAttribute('aria-hidden', false);
      button.setAttribute('aria-selected', true);
    });
    tablist.append(button);
    tab.remove();

    // convert the panel's inner table into a teaser-card grid
    decorateCards(tabpanel);
  });

  block.prepend(tablist);
}
