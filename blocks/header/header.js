import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

// media query match that indicates desktop width
const isDesktop = window.matchMedia('(min-width: 900px)');

function closeOnEscape(e) {
  if (e.code === 'Escape') {
    const nav = document.getElementById('nav');
    const navSections = nav.querySelector('.nav-sections');
    const expanded = navSections && navSections.querySelector('[aria-expanded="true"]');
    if (expanded && isDesktop.matches) {
      expanded.setAttribute('aria-expanded', 'false');
      expanded.focus();
    } else if (!isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleMenu(nav, navSections);
      nav.querySelector('.nav-hamburger button').focus();
    }
  }
}

/**
 * Toggles the entire nav (mobile hamburger open/close).
 * @param {Element} nav The container element
 * @param {Element} navSections The nav sections within the container element
 * @param {*} forceExpanded Optional param to force nav expand behavior when not null
 */
function toggleMenu(nav, navSections, forceExpanded = null) {
  const expanded = forceExpanded !== null ? !forceExpanded : nav.getAttribute('aria-expanded') === 'true';
  const button = nav.querySelector('.nav-hamburger button');
  document.body.style.overflowY = (expanded || isDesktop.matches) ? '' : 'hidden';
  nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  if (button) button.setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation');
  if (!expanded || isDesktop.matches) {
    window.addEventListener('keydown', closeOnEscape);
  } else {
    window.removeEventListener('keydown', closeOnEscape);
  }
}

/**
 * Builds the search control from the tools section.
 * The "Search" link in nav.plain.html is the content marker; the actual
 * input/form is created here (form controls do not live in the fragment).
 * @param {Element} tools The nav-tools container
 */
function decorateSearch(tools) {
  const trigger = [...tools.querySelectorAll('a')].find((a) => a.getAttribute('href') === '#search');
  if (!trigger) return;
  const form = document.createElement('form');
  form.className = 'nav-search';
  form.setAttribute('role', 'search');
  form.action = '/us/en/search';
  const label = document.createElement('span');
  label.className = 'nav-search-icon';
  label.setAttribute('aria-hidden', 'true');
  const input = document.createElement('input');
  input.type = 'search';
  input.name = 'q';
  input.placeholder = trigger.textContent.trim() || 'Search';
  input.setAttribute('aria-label', 'Search');
  form.append(label, input);
  const wrapper = trigger.closest('p') || trigger;
  wrapper.replaceWith(form);
}

/**
 * Builds the language dropdown from the locale list in the tools section.
 * The list of locales lives in nav.plain.html; behavior is added here.
 * @param {Element} tools The nav-tools container
 */
function decorateLanguage(tools) {
  const list = tools.querySelector('ul');
  if (!list) return;
  const items = [...list.querySelectorAll('a')];
  const current = items.find((a) => window.location.pathname.startsWith(a.getAttribute('href')))
    || items[0];

  const langNav = document.createElement('div');
  langNav.className = 'nav-language';

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'nav-language-toggle';
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-haspopup', 'true');
  toggle.innerHTML = `<span class="nav-language-flag" aria-hidden="true"></span>${(current ? current.textContent : 'en-US').toUpperCase()}`;

  // Insert langNav where the list is, THEN move the list into langNav
  // (avoids a circular replaceWith on a node that becomes langNav's own child).
  list.replaceWith(langNav);
  list.className = 'nav-language-list';
  langNav.append(toggle, list);

  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', open ? 'false' : 'true');
  });
  document.addEventListener('click', (e) => {
    if (!langNav.contains(e.target)) toggle.setAttribute('aria-expanded', 'false');
  });
}

/**
 * loads and decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  // load nav as fragment. Path differs by environment: the local dev server
  // serves imported content under /content/, while the aem.live pipeline serves
  // it from the root. Resolve accordingly so the nav loads in both.
  const navMeta = getMetadata('nav');
  let navPath;
  if (navMeta) {
    navPath = new URL(navMeta, window.location).pathname;
  } else if (window.location.pathname.startsWith('/content/')) {
    navPath = '/content/nav';
  } else {
    navPath = '/nav';
  }
  const fragment = await loadFragment(navPath);

  // decorate nav DOM
  block.textContent = '';
  const nav = document.createElement('nav');
  nav.id = 'nav';
  while (fragment.firstElementChild) nav.append(fragment.firstElementChild);

  const classes = ['brand', 'sections', 'tools'];
  classes.forEach((c, i) => {
    const section = nav.children[i];
    if (section) section.classList.add(`nav-${c}`);
  });

  // brand — swap the text brand link for the git-served WKND logo (kept out of
  // the content doc so the content source can't rewrite its asset path).
  const navBrand = nav.querySelector('.nav-brand');
  if (navBrand) {
    const brandLink = navBrand.querySelector('a');
    if (brandLink) {
      brandLink.className = '';
      const bc = brandLink.closest('.button-container');
      if (bc) bc.className = '';
      if (!brandLink.querySelector('img')) {
        const label = brandLink.textContent.trim() || 'WKND';
        brandLink.textContent = '';
        const logo = document.createElement('img');
        logo.src = '/icons/wknd-logo.svg';
        logo.alt = `${label} Logo`;
        logo.width = 128;
        logo.height = 48;
        brandLink.append(logo);
      }
    }
  }

  // tools: search stays in the main (white) bar; sign-in + language move to a
  // separate utility band that renders as the dark strip above the main bar.
  const navTools = nav.querySelector('.nav-tools');
  if (navTools) {
    const navUtility = document.createElement('div');
    navUtility.className = 'nav-utility';

    const signIn = [...navTools.querySelectorAll('a')].find((a) => a.getAttribute('href') === '#sign-in');
    if (signIn) {
      signIn.classList.add('nav-signin');
      navUtility.append(signIn.closest('p') || signIn);
    }
    decorateLanguage(navTools); // builds .nav-language from the locale list
    const langNav = navTools.querySelector('.nav-language');
    if (langNav) navUtility.append(langNav);

    decorateSearch(navTools); // remaining search control stays in nav-tools
    nav.prepend(navUtility);
  }

  // hamburger for mobile
  const hamburger = document.createElement('div');
  hamburger.classList.add('nav-hamburger');
  hamburger.innerHTML = `<button type="button" aria-controls="nav" aria-label="Open navigation">
      <span class="nav-hamburger-icon"></span>
    </button>`;
  const navSections = nav.querySelector('.nav-sections');
  hamburger.addEventListener('click', () => toggleMenu(nav, navSections));
  nav.prepend(hamburger);
  nav.setAttribute('aria-expanded', 'false');

  // prevent mobile nav behavior on window resize
  toggleMenu(nav, navSections, isDesktop.matches);
  isDesktop.addEventListener('change', () => toggleMenu(nav, navSections, isDesktop.matches));

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  block.append(navWrapper);

  // dynamic sticky shrink: collapse the tall white bar once the page scrolls,
  // matching the source header's shrink-on-scroll behavior. Toggling a single
  // class lets CSS handle the (transitioned) size change.
  const header = block.closest('header') || document.querySelector('header');
  if (header) {
    const SHRINK_AT = 40; // px scrolled before the header collapses
    const applyScrollState = () => {
      header.classList.toggle('nav-scrolled', window.scrollY > SHRINK_AT);
    };
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        applyScrollState();
        ticking = false;
      });
    }, { passive: true });
    applyScrollState();
  }
}
