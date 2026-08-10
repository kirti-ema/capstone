import { createOptimizedPicture } from '../../scripts/aem.js';
import { fetchIndex } from '../../scripts/query-index.js';

// Inline social glyphs (24x24, fill=currentColor so CSS controls color).
const SOCIAL_ICONS = {
  facebook: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M13.5 21v-8h2.7l.4-3.1h-3.1V7.9c0-.9.25-1.5 1.55-1.5H16.7V3.6c-.3-.04-1.3-.13-2.47-.13-2.45 0-4.13 1.5-4.13 4.24v2.37H7.3V13h2.8v8z"/></svg>',
  twitter: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M22 5.9c-.7.32-1.5.53-2.3.63.83-.5 1.46-1.28 1.76-2.22-.78.46-1.64.8-2.55.98A4.02 4.02 0 0 0 11.9 9c0 .32.03.62.1.92A11.4 11.4 0 0 1 3.7 4.7a4.02 4.02 0 0 0 1.25 5.37c-.65-.02-1.27-.2-1.8-.5v.05a4.02 4.02 0 0 0 3.23 3.95c-.34.09-.7.14-1.06.14-.26 0-.51-.03-.76-.07a4.03 4.03 0 0 0 3.76 2.8A8.08 8.08 0 0 1 2 18.13 11.38 11.38 0 0 0 8.17 20c7.4 0 11.45-6.13 11.45-11.45v-.52c.8-.57 1.48-1.28 2.02-2.09z"/></svg>',
  instagram: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M12 2.2c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 0 1-1.38-.9 3.7 3.7 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.21 15.58 2.2 15.2 2.2 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.21 8.8 2.2 12 2.2zm0 1.98c-3.15 0-3.52.01-4.76.07-1.15.05-1.77.24-2.19.4-.55.22-.94.47-1.35.88-.41.41-.66.8-.88 1.35-.16.42-.35 1.04-.4 2.19-.06 1.24-.07 1.61-.07 4.76s.01 3.52.07 4.76c.05 1.15.24 1.77.4 2.19.22.55.47.94.88 1.35.41.41.8.66 1.35.88.42.16 1.04.35 2.19.4 1.24.06 1.61.07 4.76.07s3.52-.01 4.76-.07c1.15-.05 1.77-.24 2.19-.4.55-.22.94-.47 1.35-.88.41-.41.66-.8.88-1.35.16-.42.35-1.04.4-2.19.06-1.24.07-1.61.07-4.76s-.01-3.52-.07-4.76c-.05-1.15-.24-1.77-.4-2.19a3.6 3.6 0 0 0-.88-1.35 3.6 3.6 0 0 0-1.35-.88c-.42-.16-1.04-.35-2.19-.4-1.24-.06-1.61-.07-4.76-.07zm0 3.37a4.45 4.45 0 1 1 0 8.9 4.45 4.45 0 0 1 0-8.9zm0 7.34a2.89 2.89 0 1 0 0-5.78 2.89 2.89 0 0 0 0 5.78zm5.66-7.56a1.04 1.04 0 1 1-2.08 0 1.04 1.04 0 0 1 2.08 0z"/></svg>',
};

function detectPlatform(text = '', href = '') {
  const hay = `${text} ${href}`.toLowerCase();
  if (hay.includes('facebook')) return 'facebook';
  if (hay.includes('twitter')) return 'twitter';
  if (hay.includes('insta')) return 'instagram';
  return null;
}

/**
 * Builds one authored profile row — an image cell (picture) followed by a body
 * cell (name h3, role h5, and Facebook/Twitter/Instagram social links) — exactly
 * matching the inline-authored shape the static decoration below consumes, so a
 * dynamically rendered person renders identically to a hand-authored one.
 * @param {Object} person a data row { name, role, image }
 * @returns {HTMLElement} the row div
 */
function buildProfileRow(person) {
  const row = document.createElement('div');

  const imageCell = document.createElement('div');
  if (person.image) {
    const img = document.createElement('img');
    img.src = person.image;
    img.alt = '';
    img.loading = 'lazy';
    const picture = document.createElement('picture');
    picture.append(img);
    imageCell.append(picture);
  }

  const bodyCell = document.createElement('div');
  const h3 = document.createElement('h3');
  h3.textContent = person.name || '';
  bodyCell.append(h3);
  if (person.role) {
    const h5 = document.createElement('h5');
    h5.textContent = person.role;
    bodyCell.append(h5);
  }
  // the static path expects each social link in its own <p> (detectPlatform
  // reads the link text); emit the same shape so decoration is identical.
  ['Facebook', 'Twitter', 'Instagram'].forEach((label) => {
    const p = document.createElement('p');
    const a = document.createElement('a');
    a.href = '/';
    a.textContent = label;
    p.append(a);
    bodyCell.append(p);
  });

  row.append(imageCell, bodyCell);
  return row;
}

/**
 * Dynamic mode: the block holds a sheet .json URL plus a "type" cell (Contributor
 * or Guide). Fetch the sheet, keep only rows of that type, sort by the authored
 * `order`, and replace the block's children with authored-shape profile rows so
 * the static decoration below renders them identically. On failure the block is
 * removed so no broken markup is left behind.
 * @param {Element} block the cards-profile block
 * @param {string} rawHref the authored sheet URL
 * @param {string} type the group to render ("Contributor" | "Guide")
 * @returns {Promise<boolean>} true if dynamic rows were built
 */
async function decorateDynamic(block, rawHref, type) {
  try {
    const data = await fetchIndex(rawHref);
    const wanted = type.trim().toLowerCase();
    const people = data
      .filter((p) => (p.type || '').trim().toLowerCase() === wanted)
      .sort((a, b) => (parseFloat(a.order) || 0) - (parseFloat(b.order) || 0));
    if (!people.length) { block.remove(); return false; }
    block.replaceChildren(...people.map(buildProfileRow));
    // In dynamic mode ONE block holds all cards of a group, so the block's own
    // <ul> becomes the responsive grid (see CSS). Tag the section so it lays out
    // its wrappers in flow (single column) instead of the static per-wrapper
    // grid; both classes are scoped so the static About page is unaffected.
    block.classList.add('cards-profile-grid');
    block.closest('.section')?.classList.add('cards-profile-dynamic');
    return true;
  } catch (e) {
    // network/parse failure — leave no broken block behind
    // eslint-disable-next-line no-console
    console.warn('cards-profile: failed to load dynamic listing', e);
    block.remove();
    return false;
  }
}

/**
 * loads and decorates the block
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  // Dynamic mode is opt-in: a sheet .json URL plus a "type" cell (Contributor
  // or Guide) inside the authored block. Inline-authored profiles (image + body
  // rows, no .json) are untouched, so existing instances render identically. On
  // failure the block is removed, so skip the static decoration below.
  const jsonLink = block.querySelector('a[href*=".json"]');
  const jsonText = jsonLink ? null
    : (block.textContent.match(/https?:\/\/\S+\.json|\/\S+\.json/) || [])[0];
  if (jsonLink || jsonText) {
    const url = jsonLink ? jsonLink.getAttribute('href') : jsonText;
    // the type is the other authored cell (not the json URL): its trimmed text
    const type = [...block.querySelectorAll('div')]
      .map((d) => d.textContent.trim())
      .find((t) => t && !/\.json/i.test(t) && !/^https?:/i.test(t)) || 'Contributor';
    const built = await decorateDynamic(block, url, type);
    if (!built) return;
  }

  /* change to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) div.className = 'cards-profile-card-image';
      else div.className = 'cards-profile-card-body';
    });
    ul.append(li);
  });
  ul.querySelectorAll('picture > img').forEach((img) => {
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
    img.closest('picture').replaceWith(optimizedPic);
  });

  // Transform trailing social links (Facebook/Twitter/Instagram) into an icon row.
  ul.querySelectorAll('.cards-profile-card-body').forEach((body) => {
    const socialLinks = [...body.querySelectorAll('p > a')].filter((a) => detectPlatform(a.textContent, a.getAttribute('href')));
    if (!socialLinks.length) return;

    const social = document.createElement('div');
    social.className = 'cards-profile-social';

    socialLinks.forEach((a) => {
      const platform = detectPlatform(a.textContent, a.getAttribute('href'));
      const label = a.textContent.trim();
      a.className = 'cards-profile-social-link';
      a.setAttribute('aria-label', label || platform);
      // the source uses non-navigating placeholder anchors for these contributor
      // socials; Document Authoring rewrites the placeholders to "/" on publish,
      // so normalize back to "#" to match the source (no real destination).
      a.setAttribute('href', '#');
      a.innerHTML = `${SOCIAL_ICONS[platform]}<span class="cards-profile-social-label">${label}</span>`;
      const p = a.closest('p');
      social.append(a);
      if (p && !p.children.length && !p.textContent.trim()) p.remove();
    });

    body.append(social);
  });

  block.textContent = '';
  block.append(ul);
}
