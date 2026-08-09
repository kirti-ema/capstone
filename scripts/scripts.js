import {
  loadHeader,
  loadFooter,
  decorateIcons,
  decorateSections,
  decorateBlocks,
  decorateTemplateAndTheme,
  waitForFirstImage,
  loadSection,
  loadSections,
  loadCSS,
  buildBlock,
  toClassName,
} from './aem.js';

if (window.trustedTypes && window.trustedTypes.createPolicy) {
  const innerTT = window.trustedTypes.createPolicy('tt-inner', {
    createHTML: (s) => s, // avoid stack overflow
  });

  window.trustedTypes.createPolicy('default', {
    createHTML: (input, type, sink) => {
      let processedInput = input;
      if (/srcdoc\s*=/i.test(processedInput)) {
        const doc = new DOMParser().parseFromString(innerTT.createHTML(processedInput), 'text/html');
        doc.querySelectorAll('iframe[srcdoc]').forEach((el) => el.removeAttribute('srcdoc'));
        processedInput = doc.body.innerHTML;
      }
      if (sink.includes('createContextualFragment') || sink.includes('Document write')) {
        const doc = new DOMParser().parseFromString(innerTT.createHTML(processedInput), 'text/html');
        doc.querySelectorAll('script').forEach((el) => el.remove());
        processedInput = doc.body.innerHTML;
      }
      return processedInput;
    },
    createScriptURL: (input) => input,
    createScript: (input) => input,
  });
}

/**
 * load fonts.css and set a session storage flag
 */
async function loadFonts() {
  await loadCSS(`${window.hlx.codeBasePath}/styles/fonts.css`);
  try {
    if (!window.location.hostname.includes('localhost')) sessionStorage.setItem('fonts-loaded', 'true');
  } catch (e) {
    // do nothing
  }
}

/**
 * Turns `/widgets/...` links into widget blocks.
 * @param {Element} main The container element
 */
function buildWidgetAutoBlocks(main) {
  const widgetLinks = [...main.querySelectorAll('a[href*="/widgets/"]')];
  widgetLinks.forEach((link) => {
    if (link.closest('.widget')) return;
    const newLink = link.cloneNode(true);
    const widgetBlock = buildBlock('widget', { elems: [newLink] });
    const p = link.closest('p');
    if (
      p
      && p.querySelectorAll('a').length === 1
      && p.querySelector('a') === link
      && p.textContent.trim() === link.textContent.trim()
    ) {
      p.replaceWith(widgetBlock);
    } else {
      link.replaceWith(widgetBlock);
    }
  });
}

/**
 * Promotes the "Featured Article" section into a featured-teaser block.
 *
 * The section is authored as loose default content (eyebrow, heading, body,
 * CTA, image) tagged with `Style=featured`. The aem.live pipeline bakes that
 * into a top-level `<div class="featured">`, while other environments may still
 * carry a raw section-metadata cell whose value is "featured" — detect either.
 * Runs before decorateSections, so we operate on the raw top-level section div.
 * The text elements and the image are grouped into a two-cell block row so the
 * block decorator/CSS can lay them out.
 * @param {Element} main The container element
 */
function buildFeaturedTeaserBlock(textEls, picture) {
  // shared featured-teaser assembly: one row, two cells (text | image). Used by
  // both the homepage (Style=featured section) and the magazine listing's
  // "Featured Article" run, so the block is built one way in one place.
  return buildBlock('featured-teaser', [[{ elems: textEls }, { elems: [picture] }]]);
}

/**
 * Promotes the author bio group at the foot of a magazine article into an
 * author-card block (circular photo, name, role, social icon tiles).
 *
 * The article is flat default content ending with: [author photo <p>],
 * [name H2], [role <p>], [social links <p>], then a "SHARE THIS STORY" H5.
 * We locate that H5 and pull the four preceding elements into the block, so no
 * content-file edits are needed. Guarded to fire only when the group matches.
 * @param {Element} main The container element
 */
function buildAuthorBioBlock(main) {
  // Runs before decorateSections, so operate on the raw top-level section div
  // (the .default-content-wrapper class doesn't exist yet at this point).
  const wrapper = [...main.children]
    .find((w) => [...w.querySelectorAll('h5')].some((h) => toClassName(h.textContent) === 'share-this-story'));
  if (!wrapper || wrapper.querySelector('.author-card')) return;

  const share = [...wrapper.querySelectorAll('h5')].find((h) => toClassName(h.textContent) === 'share-this-story');
  if (!share) return;

  // the social links <p> is the element immediately before "SHARE THIS STORY"
  const socials = share.previousElementSibling;
  const isSocial = socials && socials.tagName === 'P' && socials.querySelector('a');
  if (!isSocial) return;
  const role = socials.previousElementSibling; // "Skater, Writer"
  const name = role && role.previousElementSibling; // H2 author name
  const photo = name && name.previousElementSibling; // author photo <p><picture>
  const hasPhoto = photo && photo.querySelector('picture');
  if (!name || !/^H[1-6]$/.test(name.tagName) || !role || !hasPhoto) return;

  // mark the insertion spot BEFORE buildBlock moves the elements (buildBlock
  // detaches them, so anchor on a placeholder inserted while photo is still
  // in place).
  const slot = document.createElement('div');
  photo.before(slot);
  // one cell per row: photo, name, role, socials (buildBlock wraps each in a div)
  const rows = [photo, name, role, socials].map((el) => [{ elems: [el] }]);
  slot.replaceWith(buildBlock('author-card', rows));
}

function buildFeaturedAutoBlock(main) {
  const section = [...main.children].find((div) => div.classList.contains('featured')
    || [...div.querySelectorAll('div.section-metadata div > div')]
      .some((cell) => toClassName(cell.textContent) === 'featured'));
  if (!section || section.querySelector('.featured-teaser')) return;

  // collect the content elements (skip any section-metadata marker block)
  const meta = section.querySelector('div.section-metadata');
  const content = [...section.children].filter((el) => el !== meta);
  const picture = content.find((el) => el.querySelector('picture'));
  const textEls = content.filter((el) => el !== picture);
  if (!picture || textEls.length === 0) return;

  section.prepend(buildFeaturedTeaserBlock(textEls, picture));
}

/**
 * Promotes the magazine listing page's three sections into blocks.
 *
 * The magazine listing (/us/en/magazine) is authored as one flat run of
 * default content — no Style markers, no block wrappers — so unlike the
 * homepage its "Featured Article" and "All Articles" don't auto-promote. This
 * decorates that flat content in place (no content-file edits) into the same
 * blocks the homepage uses, plus the members-only block:
 *   1. "Featured Article" run  -> featured-teaser (shared builder above)
 *   2. "All Articles" <ul>      -> cards-teaser (same block as Recent Articles)
 *   3. "Members Only" previews  -> members-only (locked cards)
 * Guarded to the magazine listing shape by the presence of both the
 * "All Articles" and "Members Only" headings, so it never fires elsewhere.
 * @param {Element} main The container element
 */
function buildMagazineListingBlocks(main) {
  const wrapper = [...main.children].find((div) => {
    const headings = [...div.querySelectorAll('h2')].map((h) => toClassName(h.textContent));
    return headings.includes('all-articles') && headings.includes('members-only');
  });
  // Re-entrancy guard keyed only on this builder's OWN markers. An authored
  // cards-teaser (e.g. a dynamic json-index "All Articles") is NOT a marker —
  // otherwise its presence would wrongly suppress the Featured/Members Only
  // builds on this same page.
  if (!wrapper || wrapper.querySelector('.featured-teaser, .members-only')) return;

  const kids = [...wrapper.children];
  const isPicture = (el) => el && el.querySelector('picture');
  const headingText = (el) => (el && /^H[1-6]$/.test(el.tagName) ? toClassName(el.textContent) : null);

  // --- 1. Featured Article -> featured-teaser ---
  // Run starts at the "Featured Article" eyebrow and ends at its image (the
  // first picture that follows). Everything in between is the text column.
  const eyebrow = kids.find((el) => el.tagName === 'P' && el.textContent.trim() === 'Featured Article');
  if (eyebrow) {
    const run = [];
    for (let el = eyebrow; el; el = el.nextElementSibling) {
      run.push(el);
      if (isPicture(el)) break;
    }
    const picture = run.find(isPicture);
    const textEls = run.filter((n) => !isPicture(n));
    if (picture && textEls.length) {
      // buildBlock moves the run elements into the block, so mark the spot with
      // a placeholder first (anchoring on a moved element would throw).
      const slot = document.createElement('div');
      eyebrow.before(slot);
      slot.replaceWith(buildFeaturedTeaserBlock(textEls, picture));
    }
  }

  // --- 2. All Articles -> cards-teaser ---
  // Skip if the author already placed a cards-teaser here (e.g. a dynamic
  // json-index listing) — only reshape the flat <ul> when no block exists.
  const allArticlesH = kids.find((el) => headingText(el) === 'all-articles');
  const list = allArticlesH && !wrapper.querySelector('.cards-teaser')
    && allArticlesH.nextElementSibling && allArticlesH.nextElementSibling.tagName === 'UL'
    ? allArticlesH.nextElementSibling : null;
  if (list) {
    // Each <li> is: <p><a><picture></a></p> then <p><a>Title</a>Description</p>.
    // Reshape into the cards-teaser contract — row with an image cell and a
    // body cell (h3 > title link, then description p). buildBlock wraps each
    // cell's elems in a div, so pass the raw elements (not pre-wrapped divs).
    const rows = [...list.children].map((li) => {
      const imageP = [...li.children].find(isPicture);
      const bodyP = [...li.children].find((p) => p !== imageP && p.querySelector('a'));
      const picture = imageP ? imageP.querySelector('picture') : null;

      const cells = [];
      const titleLink = bodyP ? bodyP.querySelector('a') : null;
      const h3 = document.createElement('h3');
      if (titleLink) h3.append(titleLink.cloneNode(true));
      const bodyEls = [h3];
      const desc = bodyP && titleLink
        ? bodyP.textContent.replace(titleLink.textContent, '').trim() : '';
      if (desc) {
        const p = document.createElement('p');
        p.textContent = desc;
        bodyEls.push(p);
      }
      cells.push({ elems: picture ? [picture] : [] });
      cells.push({ elems: bodyEls });
      return cells;
    });
    const block = buildBlock('cards-teaser', rows);
    list.before(block);
    list.remove();
  }

  // --- 3. Members Only -> members-only ---
  const membersH = kids.find((el) => headingText(el) === 'members-only');
  if (membersH) {
    // the two previews follow the "Sign in…" message; each is
    // heading + teaser p + "Read More" p + picture p
    const previews = [];
    let el = membersH.nextElementSibling;
    // skip the sign-in message paragraph
    if (el && el.tagName === 'P') el = el.nextElementSibling;
    const dividerAnchor = el; // first preview heading
    while (el) {
      const title = /^H[1-6]$/.test(el.tagName) ? el : null;
      const teaser = title && title.nextElementSibling;
      const readmore = teaser && teaser.nextElementSibling;
      const image = readmore && readmore.nextElementSibling;
      if (title && teaser && readmore && isPicture(image)) {
        previews.push([title, teaser, readmore, image]);
        el = image.nextElementSibling;
      } else {
        el = el.nextElementSibling;
      }
    }
    if (previews.length && dividerAnchor) {
      const rows = previews.map(([title, teaser, readmore, image]) => [
        { elems: [title] }, { elems: [teaser] }, { elems: [readmore] }, { elems: [image] },
      ]);
      // mark the insertion spot before buildBlock moves the preview elements
      // (dividerAnchor is a preview element that gets moved into the block).
      // The source's divider above the previews is reproduced as a border-top
      // on the block in CSS — a separate classed <div> would be mistaken for a
      // block by decorateBlocks.
      const slot = document.createElement('div');
      dividerAnchor.before(slot);
      slot.replaceWith(buildBlock('members-only', rows));
    }
  }
}

/**
 * Builds all synthetic blocks in a container element.
 * @param {Element} main The container element
 */
function buildAutoBlocks(main) {
  try {
    // auto load `*/fragments/*` references
    const fragments = [...main.querySelectorAll('a[href*="/fragments/"]')].filter((f) => !f.closest('.fragment'));
    if (fragments.length > 0) {
      // eslint-disable-next-line import/no-cycle
      import('../blocks/fragment/fragment.js').then(({ loadFragment }) => {
        fragments.forEach(async (fragment) => {
          try {
            const { pathname } = new URL(fragment.href);
            const frag = await loadFragment(pathname);
            fragment.parentElement.replaceWith(...frag.children);
          } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Fragment loading failed', error);
          }
        });
      });
    }
    buildFeaturedAutoBlock(main);
    buildMagazineListingBlocks(main);
    buildAuthorBioBlock(main);
    buildWidgetAutoBlocks(main);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Auto Blocking failed', error);
  }
}

/**
 * Decorates formatted links to style them as buttons.
 * @param {HTMLElement} main The main container element
 */
function decorateButtons(main) {
  main.querySelectorAll('p a[href]').forEach((a) => {
    const p = a.closest('p');
    const text = a.textContent.trim();

    // quick structural checks
    if (a.querySelector('img') || p.textContent.trim() !== text) return;

    // skip URL display links
    try {
      if (new URL(a.href).href === new URL(text, window.location).href) return;
    } catch { /* continue */ }

    // require authored formatting for buttonization
    const strong = a.closest('strong');
    const em = a.closest('em');
    if (!strong && !em) return;

    p.className = 'button-wrapper';
    a.className = 'button';
    if (strong && em) { // high-impact call-to-action
      a.classList.add('accent');
      const outer = strong.contains(em) ? strong : em;
      outer.replaceWith(a);
    } else if (strong) {
      a.classList.add('primary');
      strong.replaceWith(a);
    } else {
      a.classList.add('secondary');
      em.replaceWith(a);
    }
  });
}

/**
 * Reads each section's "Section Metadata" block, applies its values as
 * section classes / data attributes, then removes the block. This project's
 * aem.js decorateSections does not process section metadata, so it is handled
 * here (mirrors the standard AEM boilerplate behavior).
 * @param {Element} main The main element
 */
function toCamelCaseLocal(name) {
  return name.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
}

function decorateSectionMetadata(main) {
  main.querySelectorAll('div.section-metadata').forEach((meta) => {
    const section = meta.closest('.section');
    if (!section) { meta.remove(); return; }
    [...meta.children].forEach((row) => {
      if (row.children.length < 2) return;
      const key = toClassName(row.children[0].textContent);
      const value = row.children[1].textContent.trim();
      if (key === 'style') {
        value.split(',').map((s) => toClassName(s.trim())).filter(Boolean)
          .forEach((cls) => section.classList.add(cls));
      } else {
        section.dataset[toCamelCaseLocal(key)] = value;
      }
    });
    const wrapper = meta.closest('.section-metadata-wrapper') || meta;
    wrapper.remove();
  });
}

/**
 * Decorates the main element.
 * @param {Element} main The main element
 */
// eslint-disable-next-line import/prefer-default-export
export function decorateMain(main) {
  decorateIcons(main);
  buildAutoBlocks(main);
  decorateSections(main);
  decorateSectionMetadata(main);
  decorateBlocks(main);
  decorateButtons(main);
}

/**
 * Loads everything needed to get to LCP.
 * @param {Element} doc The container element
 */
async function loadEager(doc) {
  document.documentElement.lang = 'en';
  decorateTemplateAndTheme();
  const main = doc.querySelector('main');
  if (main) {
    decorateMain(main);
    document.body.classList.add('appear');
    await loadSection(main.querySelector('.section'), waitForFirstImage);
  }

  try {
    /* if desktop (proxy for fast connection) or fonts already loaded, load fonts.css */
    if (window.innerWidth >= 900 || sessionStorage.getItem('fonts-loaded')) {
      loadFonts();
    }
  } catch (e) {
    // do nothing
  }
}

/**
 * Loads everything that doesn't need to be delayed.
 * @param {Element} doc The container element
 */
async function loadLazy(doc) {
  loadHeader(doc.querySelector('body > header'));

  const main = doc.querySelector('main');
  await loadSections(main);

  const { hash } = window.location;
  const element = hash ? doc.getElementById(hash.substring(1)) : false;
  if (hash && element) element.scrollIntoView();

  loadFooter(doc.querySelector('body > footer'));

  loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
  loadFonts();
}

/**
 * Loads everything that happens a lot later,
 * without impacting the user experience.
 */
function loadDelayed() {
  import('./consent-check.js');
  // load anything that can be postponed to the latest here
}

async function loadPage() {
  await loadEager(document);
  await loadLazy(document);
  loadDelayed();
}

loadPage();
