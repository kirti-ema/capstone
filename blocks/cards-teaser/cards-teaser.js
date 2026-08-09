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

  // Make the card image clickable to the same destination as the title, like
  // the source (image + title both link to the article). Wrap the picture in an
  // anchor cloned from the title link. It's aria-hidden + tabindex=-1 so it is
  // mouse-clickable but does NOT add a duplicate keyboard/screen-reader stop —
  // the title remains the single meaningful link per card.
  ul.querySelectorAll('li').forEach((li) => {
    const titleLink = li.querySelector('.cards-teaser-card-body h3 a[href]');
    const picture = li.querySelector('.cards-teaser-card-image picture');
    if (!titleLink || !picture || picture.closest('a')) return;
    const imgLink = document.createElement('a');
    imgLink.href = titleLink.getAttribute('href');
    imgLink.setAttribute('aria-hidden', 'true');
    imgLink.setAttribute('tabindex', '-1');
    picture.replaceWith(imgLink);
    imgLink.append(picture);
  });

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
