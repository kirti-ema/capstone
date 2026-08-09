import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

// Inline social glyphs (fill=currentColor so CSS controls color).
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
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  // load footer as fragment — /content/footer locally, /footer on the pipeline
  const footerMeta = getMetadata('footer');
  let footerPath;
  if (footerMeta) {
    footerPath = new URL(footerMeta, window.location).pathname;
  } else if (window.location.pathname.startsWith('/content/')) {
    footerPath = '/content/footer';
  } else {
    footerPath = '/footer';
  }
  const fragment = await loadFragment(footerPath);

  block.textContent = '';
  const footer = document.createElement('div');
  while (fragment.firstElementChild) footer.append(fragment.firstElementChild);

  // Section classes: [0] = top band (brand/nav/social), [1] = legal/copyright.
  // decorateMain wraps loose content in a .default-content-wrapper, so read the
  // brand link / nav list / follow label / social list from within each band.
  const [topBand, legal] = footer.children;

  if (topBand) {
    topBand.classList.add('footer-top');
    const scope = topBand.querySelector('.default-content-wrapper') || topBand;
    const brandP = scope.querySelector('p:first-child');
    const lists = scope.querySelectorAll('ul');
    const navList = lists[0];
    const socialList = lists[1];
    // the "Follow Us" label is the <p> immediately before the social list
    const followP = socialList ? socialList.previousElementSibling : null;

    // brand — swap text link for the git-served light logo
    if (brandP) {
      brandP.classList.add('footer-brand');
      const brandLink = brandP.querySelector('a');
      if (brandLink && !brandLink.querySelector('img')) {
        const label = brandLink.textContent.trim() || 'WKND';
        brandLink.textContent = '';
        const logo = document.createElement('img');
        logo.src = '/icons/wknd-logo-light.svg';
        logo.alt = `${label} Logo`;
        logo.width = 128;
        logo.height = 48;
        brandLink.append(logo);
      }
    }

    if (navList) navList.classList.add('footer-nav');
    if (followP && followP.tagName === 'P') followP.classList.add('footer-follow');
    if (socialList) {
      socialList.classList.add('footer-social');
      socialList.querySelectorAll('a').forEach((a) => {
        const platform = detectPlatform(a.textContent, a.getAttribute('href'));
        if (!platform) return;
        const label = a.textContent.trim();
        a.setAttribute('aria-label', label);
        // source uses non-navigating placeholder anchors (#facebookwknd etc.);
        // DA rewrites them to "/", so normalize to "#" to match the source.
        a.setAttribute('href', '#');
        a.innerHTML = `${SOCIAL_ICONS[platform]}<span class="footer-social-label">${label}</span>`;
      });
    }
  }

  if (legal) legal.classList.add('footer-legal');

  block.append(footer);
}
