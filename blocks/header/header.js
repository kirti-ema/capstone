import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';
import { fetchIndex, byTitle } from '../../scripts/query-index.js';

// media query match that indicates desktop width
const isDesktop = window.matchMedia('(min-width: 900px)');

/**
 * Marks the nav link matching the current page as active. A link is active
 * when the current path equals its href or is a descendant of it (so a section
 * link like /magazine stays highlighted on its article pages too, matching the
 * source). Sets both a class (for styling) and aria-current="page" (a11y).
 * @param {Element} scope The container holding the nav links
 * @param {string} activeClass The class to add to the active link
 */
export function markActiveNavLink(scope, activeClass) {
  if (!scope) return;
  const path = window.location.pathname.replace(/\.html$/, '').replace(/\/$/, '') || '/';
  scope.querySelectorAll('a[href]').forEach((a) => {
    const href = (a.getAttribute('href') || '').replace(/\.html$/, '').replace(/\/$/, '');
    if (!href || href === '/' || href === '#') return;
    if (path === href || path.startsWith(`${href}/`)) {
      a.classList.add(activeClass);
      a.setAttribute('aria-current', 'page');
    }
  });
}

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
// Search suggestion sources: the magazine + adventures query indexes provide
// the searchable page titles (articles + adventures), matching the source's
// autocomplete corpus. Fetched once, lazily, on first keystroke.
const SEARCH_INDEXES = ['/us/en/magazine/query-index.json', '/us/en/adventures/query-index.json'];

/**
 * Builds a suggestion row: the page title with the typed query substring wrapped
 * in <mark> for highlighting (matching the source's cmp-search__item-mark),
 * linking to the entry's path.
 * @param {Object} entry a query-index row { path, title }
 * @param {string} q the current query (already lower-cased)
 * @returns {HTMLLIElement}
 */
function buildSuggestion(entry, q) {
  const li = document.createElement('li');
  li.className = 'nav-search-suggestion';
  li.setAttribute('role', 'option');
  const a = document.createElement('a');
  a.href = entry.path;
  const title = entry.title || '';
  const idx = title.toLowerCase().indexOf(q);
  if (idx >= 0) {
    a.append(
      document.createTextNode(title.slice(0, idx)),
      Object.assign(document.createElement('mark'), { textContent: title.slice(idx, idx + q.length) }),
      document.createTextNode(title.slice(idx + q.length)),
    );
  } else {
    a.textContent = title;
  }
  li.append(a);
  return li;
}

function decorateSearch(tools) {
  // Match by href OR link text: Document Authoring rewrites the placeholder
  // "#search" href to "/" on publish, so text is the reliable signal.
  const trigger = [...tools.querySelectorAll('a')].find((a) => a.getAttribute('href') === '#search'
    || a.textContent.trim().toLowerCase() === 'search');
  if (!trigger) return;
  const form = document.createElement('form');
  form.className = 'nav-search';
  form.setAttribute('role', 'search');
  const label = document.createElement('span');
  label.className = 'nav-search-icon';
  label.setAttribute('aria-hidden', 'true');
  const input = document.createElement('input');
  input.type = 'search';
  input.name = 'q';
  input.placeholder = trigger.textContent.trim() || 'Search';
  input.setAttribute('aria-label', 'Search');
  input.setAttribute('autocomplete', 'off');
  // clear (×) button — shown only when the field has text, matching the source
  const clear = document.createElement('button');
  clear.type = 'button';
  clear.className = 'nav-search-clear';
  clear.setAttribute('aria-label', 'Clear');
  clear.hidden = true;
  // suggestions dropdown (dark panel), matching the source's live autocomplete
  const results = document.createElement('ul');
  results.className = 'nav-search-results';
  results.setAttribute('role', 'listbox');
  results.hidden = true;
  form.append(label, input, clear, results);
  const wrapper = trigger.closest('p') || trigger;
  wrapper.replaceWith(form);

  // lazy-load the searchable titles once, on first interaction
  let corpus = null;
  const loadCorpus = async () => {
    if (corpus) return corpus;
    const lists = await Promise.all(SEARCH_INDEXES.map((u) => fetchIndex(u).catch(() => [])));
    // de-dupe by path, keep entries with a title, sort alphabetically
    const seen = new Set();
    corpus = lists.flat().filter((e) => {
      if (!e.title || !e.path || seen.has(e.path)) return false;
      seen.add(e.path);
      return true;
    }).sort(byTitle);
    return corpus;
  };

  const closeResults = () => { results.hidden = true; results.replaceChildren(); };

  const render = async () => {
    const q = input.value.trim().toLowerCase();
    clear.hidden = !input.value;
    if (!q) { closeResults(); return; }
    const data = await loadCorpus();
    const matches = data.filter((e) => e.title.toLowerCase().includes(q)).slice(0, 8);
    if (!matches.length) { closeResults(); return; }
    results.replaceChildren(...matches.map((e) => buildSuggestion(e, q)));
    results.hidden = false;
  };

  input.addEventListener('input', render);
  input.addEventListener('focus', render);
  clear.addEventListener('click', () => {
    input.value = '';
    clear.hidden = true;
    closeResults();
    input.focus();
  });
  // Enter must NOT auto-navigate; selection happens by clicking a suggestion.
  form.addEventListener('submit', (e) => e.preventDefault());
  // close the dropdown when focus/click leaves the search
  document.addEventListener('click', (e) => { if (!form.contains(e.target)) closeResults(); });
  input.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeResults(); });
}

// Maps the country segment (first path part of each locale href, e.g. /us/en)
// to a display name + flag asset. The source groups the flat locale list by
// country; the content only carries a flat list, so the grouping is derived
// here from the href. Order defines the dropdown group order (matches source).
const COUNTRIES = [
  { code: 'us', name: 'United States' },
  { code: 'ca', name: 'Canada' },
  { code: 'ch', name: 'Switzerland' },
  { code: 'de', name: 'Germany' },
  { code: 'fr', name: 'France' },
  { code: 'es', name: 'Spain' },
  { code: 'it', name: 'Italy' },
];

/**
 * Builds the language dropdown from the locale list in the tools section.
 * The list of locales lives in nav.plain.html as a flat list; the country
 * grouping (name + flag) is derived here from each locale's href, since the
 * content source only stores the flat list. Renders 7 country groups matching
 * the source: flag + country name + that country's locale codes as separate
 * links, with the current locale marked active.
 * @param {Element} tools The nav-tools container
 */
function decorateLanguage(tools) {
  const list = tools.querySelector('ul');
  if (!list) return;
  const items = [...list.querySelectorAll('a')];
  if (!items.length) return;

  // country segment of an href like "/us/en" -> "us"
  const countryOf = (a) => (a.getAttribute('href') || '').split('/').filter(Boolean)[0] || '';
  const current = items.find((a) => window.location.pathname.startsWith(a.getAttribute('href')))
    || items[0];

  const langNav = document.createElement('div');
  langNav.className = 'nav-language';

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'nav-language-toggle';
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-haspopup', 'true');
  toggle.innerHTML = `<span class="nav-language-flag nav-language-flag-${countryOf(current)}" aria-hidden="true"></span>${(current ? current.textContent : 'en-US').toUpperCase()}`;

  // Build the grouped list: one row per country, in COUNTRIES order, containing
  // only the countries that actually have locales in the content list.
  const grouped = document.createElement('ul');
  grouped.className = 'nav-language-list';
  COUNTRIES.forEach(({ code, name }) => {
    const localeLinks = items.filter((a) => countryOf(a) === code);
    if (!localeLinks.length) return;

    const group = document.createElement('li');
    group.className = `nav-language-group nav-language-group-${code}`;

    const title = document.createElement('span');
    title.className = 'nav-language-country';
    title.textContent = name;

    const codes = document.createElement('ul');
    codes.className = 'nav-language-codes';
    localeLinks.forEach((a) => {
      const li = document.createElement('li');
      a.textContent = a.textContent.trim().toUpperCase();
      if (a === current) a.classList.add('nav-language-active');
      li.append(a);
      codes.append(li);
    });

    group.append(title, codes);
    grouped.append(group);
  });

  list.replaceWith(langNav);
  langNav.append(toggle, grouped);

  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', open ? 'false' : 'true');
  });
  document.addEventListener('click', (e) => {
    if (!langNav.contains(e.target)) toggle.setAttribute('aria-expanded', 'false');
  });
}

/**
 * Wires the utility-bar "Sign In" link to open a modal matching the source: a
 * dark panel with the "Sign In" heading (yellow accent), "Welcome Back",
 * username/password fields, a "Forgot your password?" link and a yellow
 * "Sign In" button. The form is presentational (the WKND demo has no auth
 * backend). The modal + backdrop are built once and toggled with a class.
 * @param {HTMLAnchorElement} signIn the Sign In link
 */
function decorateSignIn(signIn) {
  const backdrop = document.createElement('div');
  backdrop.className = 'nav-signin-backdrop';
  backdrop.setAttribute('hidden', '');
  backdrop.innerHTML = `
    <div class="nav-signin-modal" role="dialog" aria-modal="true" aria-label="Sign In">
      <button type="button" class="nav-signin-close" aria-label="Close">&times;</button>
      <h1 class="nav-signin-title">Sign In</h1>
      <h3 class="nav-signin-welcome">Welcome Back</h3>
      <form class="nav-signin-form">
        <input type="text" name="username" placeholder="Username" aria-label="Username" autocomplete="username">
        <input type="password" name="password" placeholder="Password" aria-label="Password" autocomplete="current-password">
        <p class="nav-signin-forgot"><a href="#">Forgot your password?</a></p>
        <button type="submit" class="nav-signin-submit">Sign In</button>
      </form>
    </div>`;
  document.body.append(backdrop);

  const modal = backdrop.querySelector('.nav-signin-modal');
  const open = () => {
    backdrop.removeAttribute('hidden');
    document.body.style.overflow = 'hidden';
    modal.querySelector('input')?.focus();
  };
  const close = () => {
    backdrop.setAttribute('hidden', '');
    document.body.style.overflow = '';
    signIn.focus();
  };

  signIn.addEventListener('click', (e) => { e.preventDefault(); open(); });
  backdrop.querySelector('.nav-signin-close').addEventListener('click', close);
  backdrop.addEventListener('click', (e) => { if (e.target === backdrop) close(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !backdrop.hasAttribute('hidden')) close();
  });
  // presentational only — no auth backend, so don't navigate on submit
  backdrop.querySelector('.nav-signin-form').addEventListener('submit', (e) => e.preventDefault());
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

  // highlight the nav item for the current page (yellow block, like the source)
  markActiveNavLink(nav.querySelector('.nav-sections'), 'nav-active');

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

    // Match by href OR link text: DA rewrites the placeholder "#sign-in" href
    // to "/" on publish, so fall back to the link text.
    const signIn = [...navTools.querySelectorAll('a')].find((a) => a.getAttribute('href') === '#sign-in'
      || a.textContent.trim().toLowerCase() === 'sign in');
    if (signIn) {
      signIn.classList.add('nav-signin');
      navUtility.append(signIn.closest('p') || signIn);
      decorateSignIn(signIn);
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
