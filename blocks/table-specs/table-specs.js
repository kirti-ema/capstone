/*
 * Table Specs Block
 * Renders a 2-column label/value spec sheet (e.g. adventure trip metadata)
 * as a semantic definition list. Each authored row is [label cell, value cell];
 * the label is rendered stacked above its value.
 */

/**
 * loads and decorates the block
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const dl = document.createElement('dl');
  dl.className = 'table-specs-list';

  [...block.children].forEach((row) => {
    const cells = [...row.children];
    if (cells.length === 0) return;

    const item = document.createElement('div');
    item.className = 'table-specs-item';

    const dt = document.createElement('dt');
    dt.className = 'table-specs-label';
    dt.innerHTML = cells[0] ? cells[0].innerHTML : '';

    const dd = document.createElement('dd');
    dd.className = 'table-specs-value';
    dd.innerHTML = cells[1] ? cells[1].innerHTML : '';

    item.append(dt, dd);
    dl.append(item);
  });

  block.replaceChildren(dl);
}
