/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: WKND section boundaries + section metadata.
 *
 * Two-hook strategy (this is the fix for the "featured" section being lost):
 *   The featured teaser anchor (div.teaser.cmp-teaser--featured) ALSO carries
 *   the class "aem-GridColumn". The site-wide cleanup transformer
 *   (wknd-cleanup.js) runs BEFORE this one and, in its afterTransform hook,
 *   unwraps all AEM grid wrappers (div.aem-Grid, div.aem-GridColumn,
 *   div.cmp-container, div.responsivegrid). That unwrap flattens the featured
 *   teaser element itself, so by the time this transformer's afterTransform
 *   runs, element.querySelector('div.teaser.cmp-teaser--featured') no longer
 *   matches anything and no Section Metadata was ever emitted.
 *
 *   To survive that, this transformer marks the section in beforeTransform
 *   (which runs before cleanup unwraps grids, so the anchor still exists):
 *     - It tags durable data attributes (data-wknd-section-*) onto the anchor's
 *       FIRST and LAST descendant *content* elements (non-wrapper, non-removable
 *       tags). Grid unwrapping moves those children up to the parent rather than
 *       deleting them, and cleanup's attribute scrub only strips "data-cmp"
 *       scrub only strips "data-cmp" and "onclick" attributes, so these
 *       markers survive into afterTransform.
 *   Then in afterTransform it locates the marked start/end elements, resolves
 *   their top-level section blocks under `element`, and:
 *     - Inserts an <hr> before the start block (when preceded by content) so the
 *       section starts fresh.
 *     - Appends a Section Metadata block (Style = <section style>) after the end
 *       block as the last element of the section.
 *     - Inserts an <hr> after (when followed by content) so following default
 *       content starts its own section.
 *   Finally it removes the temporary data attributes.
 *
 * Section source of truth:
 *   The WKND page-templates.json marks styled sections per block, e.g. the
 *   homepage template has a block:
 *     { "name": "section-featured",
 *       "instances": ["div.teaser.cmp-teaser--featured"],
 *       "section": "featured" }
 *   This transformer also supports the classic payload.template.sections[]
 *   shape if present. Selectors used to anchor sections come only from the
 *   template (never guessed). On pages without any styled section (e.g.
 *   content-overview, faq-page) no anchor is found and no changes are made.
 */

const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

const ATTR_STYLE = 'data-wknd-section-style';
const ATTR_IDX = 'data-wknd-section-idx';

/**
 * Build a normalized list of styled sections from the template payload.
 * Supports two shapes:
 *   1. payload.template.sections = [{ style, selectors: [...] }, ...]
 *   2. payload.template.blocks   = [{ section, instances: [...] }, ...]
 * Returns [{ style, selectors: [...] }].
 */
function getStyledSections(payload) {
  const template = (payload && payload.template) || {};
  const result = [];

  // Shape 1: explicit sections array (classic helix-importer convention).
  if (Array.isArray(template.sections)) {
    template.sections.forEach((s) => {
      if (s && s.style) {
        result.push({ style: s.style, selectors: s.selectors || s.instances || [] });
      }
    });
  }

  // Shape 2: per-block section markers (WKND page-templates.json convention).
  if (Array.isArray(template.blocks)) {
    template.blocks.forEach((b) => {
      if (b && b.section) {
        result.push({ style: b.section, selectors: b.instances || [] });
      }
    });
  }

  return result;
}

// Find the first element matching any of the section's selectors.
function findAnchor(element, selectors) {
  for (let s = 0; s < selectors.length; s += 1) {
    try {
      const found = element.querySelector(selectors[s]);
      if (found) return found;
    } catch (e) {
      // ignore malformed selector, try next
    }
  }
  return null;
}

/*
 * Strategy: WRAP, don't mark.
 *
 * In beforeTransform (before wknd-cleanup.js unwraps grid wrappers) we wrap the
 * styled section anchor in a plain <div data-wknd-section-*>. wknd-cleanup only
 * unwraps elements matching aem-Grid / aem-GridColumn / cmp-container /
 * responsivegrid — our plain marker div matches none of those, so it (and all
 * its content) survives cleanup intact and contiguous, regardless of how the
 * inner grid wrappers get flattened.
 *
 * In afterTransform we replace each marker div with: <hr> (if preceded by
 * content) + the div's children + a Section Metadata block + <hr> (if followed
 * by content), then drop the marker div itself. This yields a correctly bounded
 * EDS section with the right Style.
 */

export default function transform(hookName, element, payload) {
  const sections = getStyledSections(payload);
  if (!sections.length) return; // no styled sections on this template/page

  const doc = element.ownerDocument;

  // --- beforeTransform: wrap each anchor in a durable plain marker div ---
  if (hookName === TransformHook.beforeTransform) {
    sections.forEach((sec, idx) => {
      const anchor = findAnchor(element, sec.selectors);
      if (!anchor || !anchor.parentNode) return; // not present on this page

      const wrapper = doc.createElement('div');
      wrapper.setAttribute(ATTR_STYLE, sec.style);
      wrapper.setAttribute(ATTR_IDX, String(idx));
      anchor.parentNode.insertBefore(wrapper, anchor);
      wrapper.appendChild(anchor);
    });
    return;
  }

  // --- afterTransform: expand each marker div into a bounded EDS section ---
  if (hookName !== TransformHook.afterTransform) return;

  let markers = [];
  try {
    markers = Array.prototype.slice.call(
      element.querySelectorAll(`div[${ATTR_IDX}]`),
    );
  } catch (e) {
    markers = [];
  }

  // Process in reverse document order so insertions don't disturb earlier ones.
  for (let i = markers.length - 1; i >= 0; i -= 1) {
    const wrapper = markers[i];
    const style = wrapper.getAttribute(ATTR_STYLE);
    if (!wrapper.parentNode) continue;

    // The wrapper marks the featured content in document order. To make EDS
    // treat it as its own styled section without reordering, split its parent
    // chain up to `element` (main) at the wrapper's position: content before
    // the wrapper stays where it is; the wrapper's content becomes a top-level
    // section bounded by <hr>; content after the wrapper is moved into a new
    // trailing top-level block so it starts its own section.
    //
    // Bubble the wrapper up until it is a direct child of `element` (main).
    // At each level: split the parent so siblings AFTER the wrapper move into a
    // clone of the parent placed right after it, then lift the wrapper to sit
    // between the parent and that clone. This preserves document order while
    // making the wrapper a top-level block.
    while (wrapper.parentNode && wrapper.parentNode !== element) {
      const p = wrapper.parentNode;
      const gp = p.parentNode;
      if (!gp) break;
      if (wrapper.nextSibling) {
        const tail = p.cloneNode(false);
        while (wrapper.nextSibling) tail.appendChild(wrapper.nextSibling);
        gp.insertBefore(tail, p.nextSibling);
      }
      gp.insertBefore(wrapper, p.nextSibling);
    }

    const parent = wrapper.parentNode;
    if (!parent) continue;

    // Section break before (only if preceded by real content).
    const prev = wrapper.previousElementSibling;
    if (prev && prev.tagName !== 'HR') {
      parent.insertBefore(doc.createElement('hr'), wrapper);
    }

    // Move the wrapper's children out in place of the wrapper.
    while (wrapper.firstChild) {
      parent.insertBefore(wrapper.firstChild, wrapper);
    }

    // Section Metadata block (Style = <section style>) as the section's last el.
    let metaBlock = null;
    try {
      metaBlock = WebImporter.Blocks.createBlock(doc, {
        name: 'Section Metadata',
        cells: { Style: style },
      });
    } catch (e) {
      metaBlock = null;
    }
    if (metaBlock) parent.insertBefore(metaBlock, wrapper);

    // Section break after (only if followed by real content).
    const next = wrapper.nextElementSibling;
    if (next && next.tagName !== 'HR') {
      parent.insertBefore(doc.createElement('hr'), wrapper);
    }

    parent.removeChild(wrapper);
  }
}
