import { toClassName, createOptimizedPicture } from '../../scripts/aem.js';
import { fetchIndex, byTitle, byGroupSizeThenTitle } from '../../scripts/query-index.js';

/**
 * Picks the card-ordering comparator for a tab, matching the source Adventures
 * page: the "All" and "Travel" tabs list alphabetically by title, while the
 * activity tabs (Climbing, Cycling, Skiing, Surfing) order ascending by group
 * size (tiebreak title). Any tab not named here falls back to title order.
 * @param {string} tab the tab label
 * @returns {(a: Object, b: Object) => number} comparator
 */
function sortForTab(tab) {
  const t = (tab || '').trim().toLowerCase();
  const bySize = new Set(['climbing', 'cycling', 'skiing', 'surfing']);
  return bySize.has(t) ? byGroupSizeThenTitle : byTitle;
}

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

  // Wrap each card image in an anchor to the same destination as its title, so
  // the image is clickable with a pointer cursor like the title (matching the
  // cards-teaser "All Articles" cards). aria-hidden + tabindex=-1 keeps it
  // mouse-clickable without adding a duplicate keyboard/screen-reader stop.
  ul.querySelectorAll('li').forEach((li) => {
    const titleLink = li.querySelector('.tabs-filter-card-body a[href]');
    const picture = li.querySelector('.tabs-filter-card-image picture');
    if (!titleLink || !picture || picture.closest('a')) return;
    const imgLink = document.createElement('a');
    imgLink.href = titleLink.getAttribute('href');
    imgLink.setAttribute('aria-hidden', 'true');
    imgLink.setAttribute('tabindex', '-1');
    picture.replaceWith(imgLink);
    imgLink.append(picture);
  });

  table.closest('.image-list, div')?.remove?.();
  panel.replaceChildren(ul);
}

/**
 * Splits an authored category value into a list. Categories are authored as a
 * single value or a comma-separated list (e.g. "Cycling, Travel") so one
 * adventure can appear under multiple tabs. Empty/blank yields no categories.
 * @param {string} value the raw category field
 * @returns {string[]}
 */
function splitCategories(value) {
  return (value || '')
    .split(',')
    .map((c) => c.trim())
    .filter(Boolean);
}

/**
 * Builds one authored tab row — a tab-name cell followed by a "Cards Teaser"
 * table of the given entries — matching exactly the inline structure the static
 * path (decorateCards) consumes, so dynamic and authored tabs render identically.
 * @param {string} tabName the tab label
 * @param {Array} entries query-index rows to render as cards (in order)
 * @returns {HTMLElement} the row div
 */
function buildTabRow(tabName, entries) {
  const row = document.createElement('div');

  const nameCell = document.createElement('div');
  nameCell.textContent = tabName;

  const tableCell = document.createElement('div');
  const table = document.createElement('table');
  const tbody = document.createElement('tbody');
  entries.forEach((entry) => {
    const tr = document.createElement('tr');
    const imgTd = document.createElement('td');
    const cardImg = entry.cardImage || entry.image;
    if (cardImg) {
      imgTd.append(createOptimizedPicture(cardImg, entry.title || '', false, [{ width: '750' }]));
    }
    const bodyTd = document.createElement('td');
    const h3 = document.createElement('h3');
    h3.id = toClassName(entry.title || '');
    const a = document.createElement('a');
    a.href = entry.path;
    a.textContent = entry.title || '';
    h3.append(a);
    bodyTd.append(h3);
    if (entry.description) {
      const p = document.createElement('p');
      p.textContent = entry.description;
      bodyTd.append(p);
    }
    tr.append(imgTd, bodyTd);
    tbody.append(tr);
  });
  table.append(tbody);
  tableCell.append(table);

  row.append(nameCell, tableCell);
  return row;
}

/**
 * Dynamic mode: the block holds a query-index .json URL plus an optional
 * tab-order cell (comma-separated tab labels; "All" first). Fetch the index and
 * replace the block's children with authored-shape tab rows — an "All" tab
 * (every entry) plus one tab per category — so the static decoration below
 * renders them identically. Cards within each tab are sorted per sortForTab()
 * (title for All/Travel, group size for the activity tabs), matching the
 * source listing. If no tab order is authored, tabs are derived from the
 * categories present, sorted alphabetically, with "All" first.
 * @param {Element} block the tabs-filter block
 * @param {string} rawHref the authored index URL
 * @returns {Promise<boolean>} true if dynamic rows were built
 */
async function decorateDynamic(block, rawHref) {
  // optional tab order: a cell listing labels, e.g. "All, Climbing, Cycling…"
  // (any cell that isn't the json URL and contains a comma or a known label).
  const tabOrderCell = [...block.querySelectorAll('div')]
    .map((d) => d.textContent.trim())
    .find((t) => t && !/\.json/i.test(t) && t.includes(','));
  const authoredOrder = tabOrderCell
    ? tabOrderCell.split(',').map((t) => t.trim()).filter(Boolean)
    : null;

  try {
    const data = await fetchIndex(rawHref);
    if (!data.length) { block.remove(); return false; }

    // categories present across all entries
    const present = new Set();
    data.forEach((e) => splitCategories(e.category).forEach((c) => present.add(c)));

    // tab labels: authored order (kept only if it has entries, "All" always),
    // else "All" + categories present alphabetically.
    let tabs;
    if (authoredOrder) {
      tabs = authoredOrder.filter((t) => t.toLowerCase() === 'all' || present.has(t));
    } else {
      tabs = ['All', ...[...present].sort((a, b) => a.localeCompare(b))];
    }
    if (!tabs.some((t) => t.toLowerCase() === 'all')) tabs.unshift('All');

    const rows = tabs.map((tab) => {
      const entries = (tab.toLowerCase() === 'all'
        ? [...data]
        : data.filter((e) => splitCategories(e.category).includes(tab)))
        .sort(sortForTab(tab));
      return buildTabRow(tab, entries);
    });
    block.replaceChildren(...rows);
    return true;
  } catch (e) {
    // network/parse failure — leave no broken block behind
    // eslint-disable-next-line no-console
    console.warn('tabs-filter: failed to load dynamic listing', e);
    block.remove();
    return false;
  }
}

/**
 * loads and decorates the tabs-filter block
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  // Dynamic mode is opt-in: a query-index .json URL inside the authored table.
  // Inline-authored tabs (static <table> per tab) carry no .json and are
  // untouched, so existing instances render byte-identically. On failure the
  // block is removed, so skip the static decoration below.
  const jsonLink = block.querySelector('a[href*=".json"]');
  const jsonText = jsonLink ? null
    : (block.textContent.match(/https?:\/\/\S+\.json|\/\S+\.json/) || [])[0];
  if (jsonLink || jsonText) {
    const built = await decorateDynamic(block, jsonLink ? jsonLink.getAttribute('href') : jsonText);
    if (!built) return;
  }

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
