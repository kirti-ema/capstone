/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: WKND site-wide DOM cleanup.
 *
 * Source is AEM Core Components markup (div.aem-Grid, div.cmp-container,
 * experiencefragment header/footer wrappers, cmp-* classes).
 *
 * All selectors below were verified against migration-work/cleaned.html
 * (representative faq-page). Nothing is guessed.
 *
 * Hook strategy:
 *  - beforeTransform: remove non-authorable global chrome (header/footer
 *    experience fragments, mobile nav, tracking iframe). These contain no
 *    template block content, so removing them early keeps the DOM the block
 *    parsers scan free of stray nav/search/form markup.
 *  - afterTransform: strip AEM grid/container wrapper chrome (unwrap, preserve
 *    content), then remove leftover non-authorable elements and clean
 *    tracking attributes. Grid unwrapping MUST run here, after block parsers
 *    have extracted blocks, because some block roots (e.g.
 *    div.accordion.panelcontainer.aem-GridColumn) also carry aem-GridColumn
 *    classes; unwrapping earlier would destroy the selectors parsers rely on.
 */

const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

// Unwrap an element in place: move its children up to its parent, then drop it.
// Preserves all authorable content while removing the wrapper chrome itself.
function unwrap(el) {
  const parent = el.parentNode;
  if (!parent) return;
  while (el.firstChild) {
    parent.insertBefore(el.firstChild, el);
  }
  parent.removeChild(el);
}

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    // --- Non-authorable global chrome (header/footer are auto-populated in EDS) ---
    // Verified in cleaned.html:
    //   line 5   <header class="experiencefragment cmp-experiencefragment--header ...">
    //   line 357 <footer class="experiencefragment cmp-experiencefragment--footer ...">
    // NOTE: these use "cmp-experiencefragment--*" (no dash). The content-overview
    // contributor block uses "cmp-experience-fragment--contributor" (dashed) and is
    // intentionally NOT matched here so it survives for its parser.
    WebImporter.DOMUtils.remove(element, [
      'header.experiencefragment',
      'footer.experiencefragment',
      'div.cmp-experiencefragment--header',
      'div.cmp-experiencefragment--footer',
    ]);

    // --- Mobile navigation chrome (verified: line 454 #toggleNav, line 460 #mobileNav) ---
    WebImporter.DOMUtils.remove(element, [
      '#toggleNav',
      '#mobileNav',
    ]);

    // --- Tracking / analytics pixel (verified: line 452 Adobe ID syncing iFrame, demdex.net) ---
    WebImporter.DOMUtils.remove(element, [
      'iframe[src*="demdex"]',
      '#destination_publishing_iframe_wkndsite_0',
    ]);
  }

  if (hookName === TransformHook.afterTransform) {
    // --- Defensive re-removal of chrome in case document root differs from beforeTransform scope ---
    WebImporter.DOMUtils.remove(element, [
      'header.experiencefragment',
      'footer.experiencefragment',
      'div.cmp-experiencefragment--header',
      'div.cmp-experiencefragment--footer',
    ]);

    // --- Strip AEM grid / container wrapper chrome, preserving inner content ---
    // Verified wrapper classes in cleaned.html: aem-Grid, aem-GridColumn,
    // cmp-container, responsivegrid. Iterate with a re-query loop so nested
    // wrappers exposed after each pass are also flattened.
    const wrapperSelector = 'div.aem-Grid, div.aem-GridColumn, div.cmp-container, div.responsivegrid';
    let guard = 0;
    let wrappers = element.querySelectorAll(wrapperSelector);
    while (wrappers.length && guard < 100) {
      wrappers.forEach((w) => unwrap(w));
      wrappers = element.querySelectorAll(wrapperSelector);
      guard += 1;
    }

    // --- Leftover non-authorable / structural elements ---
    // meta: verified stray <meta> inside cmp-image (line 176).
    WebImporter.DOMUtils.remove(element, [
      'iframe',
      'link',
      'noscript',
      'source',
      'meta',
    ]);

    // --- Attribute cleanup: drop AEM data-layer / cmp tracking hooks and inline handlers ---
    element.querySelectorAll('*').forEach((el) => {
      // Snapshot attribute names (removing while iterating attributes is unsafe).
      const names = el.getAttributeNames ? el.getAttributeNames() : [];
      names.forEach((name) => {
        if (name.startsWith('data-cmp') || name === 'onclick') {
          el.removeAttribute(name);
        }
      });
    });
  }
}
