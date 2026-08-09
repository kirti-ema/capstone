import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Members Only — locked article previews (magazine listing page).
 *
 * Built via auto-blocking (see buildMembersOnlyAutoBlock in scripts.js) from
 * the raw "Members Only" default content. Each preview is handed to us as a
 * block row of four cells: [0] title, [1] teaser, [2] "Read More", [3] image.
 * This decorator tags the roles so the CSS can render the locked card (padlock
 * badge, inert Read More, image below). The source's "Read More" is a dead
 * control — not a link — so we render it as inert text, matching the gating.
 *
 * @param {Element} block The members-only block element
 */
export default function decorate(block) {
  [...block.children].forEach((row) => {
    row.classList.add('members-only-card');
    const cells = [...row.children];
    const [titleCell, teaserCell, readmoreCell, imageCell] = cells;

    if (titleCell) {
      const heading = titleCell.querySelector('h1, h2, h3, h4, h5, h6') || titleCell;
      heading.classList.add('members-only-title');
    }
    if (teaserCell) {
      teaserCell.classList.add('members-only-teaser');
    }
    if (readmoreCell) {
      readmoreCell.classList.add('members-only-readmore');
      // The source gates this: "Read More" does not navigate until sign-in.
      // Neutralize any link so it behaves as an inert control.
      const link = readmoreCell.querySelector('a');
      if (link) {
        const span = document.createElement('span');
        span.textContent = link.textContent;
        link.replaceWith(span);
      }
    }
    if (imageCell) {
      imageCell.classList.add('members-only-image');
      imageCell.querySelectorAll('picture > img').forEach((img) => {
        img.closest('picture').replaceWith(
          createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]),
        );
      });
    }
  });
}
