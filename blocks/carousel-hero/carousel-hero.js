import { createOptimizedPicture, toClassName } from '../../scripts/aem.js';
import { fetchIndex, normalizePath } from '../../scripts/query-index.js';

function updateActiveSlide(slide) {
  const block = slide.closest('.carousel-hero');
  const slideIndex = parseInt(slide.dataset.slideIndex, 10);
  block.dataset.activeSlide = slideIndex;

  const slides = block.querySelectorAll('.carousel-hero-slide');

  slides.forEach((aSlide, idx) => {
    aSlide.setAttribute('aria-hidden', idx !== slideIndex);
    aSlide.querySelectorAll('a').forEach((link) => {
      if (idx !== slideIndex) {
        link.setAttribute('tabindex', '-1');
      } else {
        link.removeAttribute('tabindex');
      }
    });
  });

  const indicators = block.querySelectorAll('.carousel-hero-slide-indicator');
  indicators.forEach((indicator, idx) => {
    if (idx !== slideIndex) {
      indicator.querySelector('button').removeAttribute('disabled');
    } else {
      indicator.querySelector('button').setAttribute('disabled', 'true');
    }
  });
}

export function showSlide(block, slideIndex = 0) {
  const slides = block.querySelectorAll('.carousel-hero-slide');
  let realSlideIndex = slideIndex < 0 ? slides.length - 1 : slideIndex;
  if (slideIndex >= slides.length) realSlideIndex = 0;
  const activeSlide = slides[realSlideIndex];

  activeSlide.querySelectorAll('a').forEach((link) => link.removeAttribute('tabindex'));
  block.querySelector('.carousel-hero-slides').scrollTo({
    top: 0,
    left: activeSlide.offsetLeft,
    behavior: 'smooth',
  });
}

function bindEvents(block) {
  const slideIndicators = block.querySelector('.carousel-hero-slide-indicators');
  if (!slideIndicators) return;

  slideIndicators.querySelectorAll('button').forEach((button) => {
    button.addEventListener('click', (e) => {
      const slideIndicator = e.currentTarget.parentElement;
      showSlide(block, parseInt(slideIndicator.dataset.targetSlide, 10));
    });
  });

  block.querySelector('.slide-prev').addEventListener('click', () => {
    showSlide(block, parseInt(block.dataset.activeSlide, 10) - 1);
  });
  block.querySelector('.slide-next').addEventListener('click', () => {
    showSlide(block, parseInt(block.dataset.activeSlide, 10) + 1);
  });

  const slideObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) updateActiveSlide(entry.target);
    });
  }, { threshold: 0.5 });
  block.querySelectorAll('.carousel-hero-slide').forEach((slide) => {
    slideObserver.observe(slide);
  });
}

function createSlide(row, slideIndex, carouselId) {
  const slide = document.createElement('li');
  slide.dataset.slideIndex = slideIndex;
  slide.setAttribute('id', `carousel-hero-${carouselId}-slide-${slideIndex}`);
  slide.classList.add('carousel-hero-slide');

  row.querySelectorAll(':scope > div').forEach((column, colIdx) => {
    const role = colIdx === 0 ? 'image' : 'content';
    column.classList.add(`carousel-hero-slide-${role}`);
    // the CTA link in the content column is the shared yellow WKND button
    if (role === 'content') {
      column.querySelectorAll('a[href]').forEach((a) => a.classList.add('wknd-button'));
    }
    slide.append(column);
  });

  const labeledBy = slide.querySelector('h1, h2, h3, h4, h5, h6');
  if (labeledBy) {
    slide.setAttribute('aria-labelledby', labeledBy.getAttribute('id'));
  }

  return slide;
}

// Known query indices, matched by longest path prefix. Each index's `**`
// include means every page under the root lives in one index at
// `{root}/query-index.json`, so a referenced page resolves via its root index.
const INDEX_ROOTS = ['/us/en/magazine', '/us/en/adventures'];

/**
 * The query-index URL that covers a given content path, or null if the path is
 * not under a known index root.
 * @param {string} path a normalized same-origin path
 * @returns {string|null}
 */
function indexUrlForPath(path) {
  const root = INDEX_ROOTS.find((r) => path === r || path.startsWith(`${r}/`));
  return root ? `${root}/query-index.json` : null;
}

/**
 * If a row is a "reference row" — an opt-in slide authored as just an internal
 * path (bare text) or a lone link, with NO authored picture or heading — return
 * that normalized internal path. Otherwise null. Every inline-authored slide
 * carries a <picture> (and a heading), so this never matches an existing slide,
 * guaranteeing authored slides render unchanged.
 * @param {Element} row a block row
 * @returns {string|null}
 */
function referencePathOf(row) {
  // inline slides carry an authored image + heading — never treat as references
  if (row.querySelector('picture, img')) return null;
  if (row.querySelector('h1, h2, h3, h4, h5, h6')) return null;

  const link = row.querySelector('a[href]');
  const raw = (link ? link.getAttribute('href') : row.textContent).trim();
  if (!raw) return null;
  try {
    const u = new URL(raw, window.location.href);
    if (u.origin !== window.location.origin || !u.pathname.startsWith('/')) return null;
    return normalizePath(u.pathname);
  } catch (e) {
    return null;
  }
}

/**
 * Builds the two authored cells a reference slide needs (image cell, content
 * cell) from a query-index entry, matching the shape an inline-authored slide
 * row has so createSlide + the block CSS treat it identically: a picture, then
 * a heading + description + a "Read More" CTA to the referenced page.
 * @param {Object} entry a query-index row { path, title, description, image, cardImage }
 * @returns {HTMLElement[]} [imageCell, contentCell]
 */
function buildReferenceSlideCells(entry) {
  const imageCell = document.createElement('div');
  const img = entry.image || entry.cardImage;
  if (img) {
    imageCell.append(createOptimizedPicture(img, entry.title || '', false, [{ width: '2000' }]));
  }

  const contentCell = document.createElement('div');
  const h2 = document.createElement('h2');
  h2.id = toClassName(entry.title || '');
  h2.textContent = entry.title || '';
  contentCell.append(h2);
  if (entry.description) {
    const p = document.createElement('p');
    p.textContent = entry.description;
    contentCell.append(p);
  }
  const ctaP = document.createElement('p');
  const cta = document.createElement('a');
  cta.href = entry.path;
  cta.textContent = 'Read More';
  ctaP.append(cta);
  contentCell.append(ctaP);

  return [imageCell, contentCell];
}

/**
 * Hybrid opt-in pass: resolve any reference rows in place before slides are
 * built, pulling each referenced page's title/description/image from the shared
 * query index. Inline-authored rows are left untouched. A reference that can't
 * resolve (unknown root, entry not found, or fetch error) drops its row so no
 * broken literal-path slide is shown. Reference rows to the same index share a
 * single fetch (fetchIndex memoizes per page).
 * @param {Element} block the carousel-hero block
 */
async function resolveReferenceRows(block) {
  const refs = [...block.querySelectorAll(':scope > div')]
    .map((row) => ({ row, path: referencePathOf(row) }))
    .filter((r) => r.path);
  if (!refs.length) return;

  await Promise.all(refs.map(async ({ row, path }) => {
    try {
      const indexUrl = indexUrlForPath(path);
      if (!indexUrl) { row.remove(); return; }
      const data = await fetchIndex(indexUrl);
      const entry = data.find((e) => normalizePath(e.path) === path);
      if (!entry) { row.remove(); return; }
      row.replaceChildren(...buildReferenceSlideCells(entry));
    } catch (e) {
      // unresolved reference — drop the row so no broken slide is shown
      row.remove();
    }
  }));
}

let carouselId = 0;
export default async function decorate(block) {
  carouselId += 1;
  block.setAttribute('id', `carousel-hero-${carouselId}`);

  // Hybrid: resolve opt-in "reference" rows (a bare internal path / lone link,
  // no authored picture) into inline slide markup pulled from that page's
  // query-index entry, BEFORE slides/dots are built so the counts include
  // resolved slides. Existing inline slides (all carry a <picture>) are
  // untouched — authored slides render byte-identically.
  await resolveReferenceRows(block);

  const rows = block.querySelectorAll(':scope > div');
  const isSingleSlide = rows.length < 2;

  block.setAttribute('role', 'region');
  block.setAttribute('aria-roledescription', 'Carousel');

  const container = document.createElement('div');
  container.classList.add('carousel-hero-slides-container');

  const slidesWrapper = document.createElement('ul');
  slidesWrapper.classList.add('carousel-hero-slides');
  block.prepend(slidesWrapper);

  let slideIndicators;
  if (!isSingleSlide) {
    const slideIndicatorsNav = document.createElement('nav');
    slideIndicatorsNav.setAttribute('aria-label', 'Carousel Slide Controls');
    slideIndicators = document.createElement('ol');
    slideIndicators.classList.add('carousel-hero-slide-indicators');
    slideIndicatorsNav.append(slideIndicators);
    block.append(slideIndicatorsNav);

    const slideNavButtons = document.createElement('div');
    slideNavButtons.classList.add('carousel-hero-navigation-buttons');
    slideNavButtons.innerHTML = `
      <button type="button" class= "slide-prev" aria-label="Previous Slide"></button>
      <button type="button" class="slide-next" aria-label="Next Slide"></button>
    `;

    container.append(slideNavButtons);
  }

  rows.forEach((row, idx) => {
    const slide = createSlide(row, idx, carouselId);
    slidesWrapper.append(slide);

    if (slideIndicators) {
      const indicator = document.createElement('li');
      indicator.classList.add('carousel-hero-slide-indicator');
      indicator.dataset.targetSlide = idx;
      indicator.innerHTML = `<button type="button" aria-label="Show Slide ${idx + 1} of ${rows.length}"></button>`;
      slideIndicators.append(indicator);
    }
    row.remove();
  });

  container.append(slidesWrapper);
  block.prepend(container);

  if (!isSingleSlide) {
    bindEvents(block);
  }
}
