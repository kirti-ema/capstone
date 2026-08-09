import { createOptimizedPicture } from '../../scripts/aem.js';

export default function decorate(block) {
  /* change to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) div.className = 'cards-teaser-card-image';
      else div.className = 'cards-teaser-card-body';
    });
    ul.append(li);
  });
  ul.querySelectorAll('picture > img').forEach((img) => img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }])));
  block.replaceChildren(ul);

  // The "All Articles" / "All Trips" CTAs are section-level default content
  // (a paragraph whose only child is a single link), not part of the block.
  // Tag them with the shared yellow WKND button class so they match the CTAs
  // in the other blocks. Scoped to this block's section to mirror the section
  // that carries the styling.
  const section = block.closest('.section');
  if (section) {
    section.querySelectorAll(':scope > .default-content-wrapper p > a:only-child').forEach((a) => {
      a.classList.add('wknd-button');
    });
  }
}
