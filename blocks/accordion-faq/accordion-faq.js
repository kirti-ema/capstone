/*
 * Accordion Block
 * Recreate an accordion
 * https://www.hlx.live/developer/block-collection/accordion
 */

import { fetchIndex } from '../../scripts/query-index.js';

/**
 * Builds one authored accordion row — a question cell followed by an answer
 * cell — matching the inline-authored shape the static decoration below
 * consumes, so a sheet-driven FAQ renders identically to a hand-authored one.
 * The answer is split on newlines into one paragraph per line (the sheet stores
 * plain text), mirroring the source's single-paragraph answers.
 * @param {Object} faq a data row { question, answer }
 * @returns {HTMLElement} the row div
 */
function buildFaqRow(faq) {
  const row = document.createElement('div');

  const questionCell = document.createElement('div');
  const q = document.createElement('p');
  q.textContent = (faq.question || '').trim();
  questionCell.append(q);

  const answerCell = document.createElement('div');
  (faq.answer || '')
    .split(/\n+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .forEach((para) => {
      const p = document.createElement('p');
      p.textContent = para;
      answerCell.append(p);
    });

  row.append(questionCell, answerCell);
  return row;
}

/**
 * Dynamic mode: the block holds a sheet .json URL. Fetch the sheet, sort by the
 * authored `order` (blank sorts last, then falls back to sheet order), and
 * replace the block's children with authored-shape question/answer rows so the
 * static decoration below renders them identically. On failure the block is
 * removed so no broken markup is left behind.
 * @param {Element} block the accordion-faq block
 * @param {string} rawHref the authored sheet URL
 * @returns {Promise<boolean>} true if dynamic rows were built
 */
async function decorateDynamic(block, rawHref) {
  try {
    const data = await fetchIndex(rawHref);
    const faqs = data
      .filter((f) => (f.question || '').trim())
      .map((f, i) => ({ ...f, i }))
      .sort((a, b) => {
        const oa = parseFloat(a.order);
        const ob = parseFloat(b.order);
        const na = Number.isFinite(oa) ? oa : Infinity;
        const nb = Number.isFinite(ob) ? ob : Infinity;
        return na !== nb ? na - nb : a.i - b.i;
      });
    if (!faqs.length) { block.remove(); return false; }
    block.replaceChildren(...faqs.map(buildFaqRow));
    return true;
  } catch (e) {
    // network/parse failure — leave no broken block behind
    // eslint-disable-next-line no-console
    console.warn('accordion-faq: failed to load dynamic listing', e);
    block.remove();
    return false;
  }
}

/**
 * loads and decorates the block
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  // Dynamic mode is opt-in: a sheet .json URL inside the authored block (a link
  // or a bare path). Inline-authored FAQs (question row + answer row, no .json)
  // are untouched, so existing instances render identically. On failure the
  // block is removed, so skip the static decoration below.
  const jsonLink = block.querySelector('a[href*=".json"]');
  const jsonText = jsonLink ? null
    : (block.textContent.match(/https?:\/\/\S+\.json|\/\S+\.json/) || [])[0];
  if (jsonLink || jsonText) {
    const url = jsonLink ? jsonLink.getAttribute('href') : jsonText;
    const built = await decorateDynamic(block, url);
    if (!built) return;
  }

  [...block.children].forEach((row) => {
    // decorate accordion item label
    const label = row.children[0];
    const summary = document.createElement('summary');
    summary.className = 'accordion-faq-item-label';
    summary.append(...label.childNodes);
    // decorate accordion item body
    const body = row.children[1];
    body.className = 'accordion-faq-item-body';
    // decorate accordion item
    const details = document.createElement('details');
    details.className = 'accordion-faq-item';
    details.append(summary, body);
    row.replaceWith(details);
  });
}
