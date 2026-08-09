import { createOptimizedPicture } from '../../scripts/aem.js';

/* Inline social glyphs (fill=currentColor so CSS controls color) — the same
   set the footer uses, so the author-card socials match the footer icons. */
const SOCIAL_ICONS = {
  facebook: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M13.5 21v-8h2.7l.4-3.1h-3.1V7.9c0-.9.25-1.5 1.55-1.5H16.7V3.6c-.3-.04-1.3-.13-2.47-.13-2.45 0-4.13 1.5-4.13 4.24v2.37H7.3V13h2.8v8z"/></svg>',
  twitter: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M22 5.9c-.7.32-1.5.53-2.3.63.83-.5 1.46-1.28 1.76-2.22-.78.46-1.64.8-2.55.98A4.02 4.02 0 0 0 11.9 9c0 .32.03.62.1.92A11.4 11.4 0 0 1 3.7 4.7a4.02 4.02 0 0 0 1.25 5.37c-.65-.02-1.27-.2-1.8-.5v.05a4.02 4.02 0 0 0 3.23 3.95c-.34.09-.7.14-1.06.14-.26 0-.51-.03-.76-.07a4.03 4.03 0 0 0 3.76 2.8A8.08 8.08 0 0 1 2 18.13 11.38 11.38 0 0 0 8.17 20c7.4 0 11.45-6.13 11.45-11.45v-.52c.8-.57 1.48-1.28 2.02-2.09z"/></svg>',
  instagram: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M12 2.2c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 0 1-1.38-.9 3.7 3.7 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.21 15.58 2.2 15.2 2.2 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.21 8.8 2.2 12 2.2zm0 1.98c-3.15 0-3.52.01-4.76.07-1.15.05-1.77.24-2.19.4-.55.22-.94.47-1.35.88-.41.41-.66.8-.88 1.35-.16.42-.35 1.04-.4 2.19-.06 1.24-.07 1.61-.07 4.76s.01 3.52.07 4.76c.05 1.15.24 1.77.4 2.19.22.55.47.94.88 1.35.41.41.8.66 1.35.88.42.16 1.04.35 2.19.4 1.24.06 1.61.07 4.76.07s3.52-.01 4.76-.07c1.15-.05 1.77-.24 2.19-.4.55-.22.94-.47 1.35-.88.41-.41.66-.8.88-1.35.16-.42.35-1.04.4-2.19.06-1.24.07-1.61.07-4.76s-.01-3.52-.07-4.76c-.05-1.15-.24-1.77-.4-2.19a3.6 3.6 0 0 0-.88-1.35 3.6 3.6 0 0 0-1.35-.88c-.42-.16-1.04-.35-2.19-.4-1.24-.06-1.61-.07-4.76-.07zm0 3.37a4.45 4.45 0 1 1 0 8.9 4.45 4.45 0 0 1 0-8.9zm0 7.34a2.89 2.89 0 1 0 0-5.78 2.89 2.89 0 0 0 0 5.78zm5.66-7.56a1.04 1.04 0 1 1-2.08 0 1.04 1.04 0 0 1 2.08 0z"/></svg>',
};

/**
 * Author bio card shown below a magazine article body: circular author photo,
 * name, role, and social icon tiles. Built by an auto-block in scripts.js from
 * the article's flat default content; this decorator tags the cells and swaps
 * the plain-text social links for the shared icon tiles.
 *
 * Expected rows (one cell each): [photo] [name] [role] [socials].
 * @param {Element} block The author-card block element
 */
export default function decorate(block) {
  const rows = [...block.children];

  rows.forEach((row) => {
    const cell = row.firstElementChild || row;
    if (cell.querySelector('picture')) {
      // author photo — optimize and mark
      row.className = 'author-card-photo';
      const img = cell.querySelector('picture img');
      if (img) {
        cell.querySelector('picture').replaceWith(
          createOptimizedPicture(img.src, img.alt || '', false, [{ width: '120' }]),
        );
      }
    } else if (cell.querySelector('a')) {
      // social links — swap text for icon tiles (same glyphs as the footer).
      // The pipeline may merge the three adjacent anchors ("Facebook",
      // "Twitter", "Instagram") into one anchor whose text is
      // "FacebookTwitterInstagram"; normalize to one tile per platform.
      row.className = 'author-card-social';
      const container = cell.querySelector('a').parentElement;
      const platforms = [];
      cell.querySelectorAll('a').forEach((a) => {
        const t = a.textContent;
        ['facebook', 'twitter', 'instagram'].forEach((p) => {
          if (t.toLowerCase().includes(p.slice(0, 5)) && !platforms.includes(p)) platforms.push(p);
        });
      });
      if (platforms.length) {
        container.textContent = '';
        platforms.forEach((platform) => {
          const label = platform.charAt(0).toUpperCase() + platform.slice(1);
          const a = document.createElement('a');
          a.href = '#'; // source uses non-navigating placeholders
          a.setAttribute('aria-label', label);
          a.innerHTML = `${SOCIAL_ICONS[platform]}<span class="author-card-social-label">${label}</span>`;
          container.append(a);
        });
      }
    } else if (cell.querySelector('h1,h2,h3,h4,h5,h6')) {
      row.className = 'author-card-name';
    } else {
      row.className = 'author-card-role';
    }
  });
}
