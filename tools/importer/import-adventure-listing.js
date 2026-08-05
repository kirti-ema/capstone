/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import heroBannerParser from "./parsers/hero-banner.js";
import tabsFilterParser from "./parsers/tabs-filter.js";
import cardsTeaserParser from "./parsers/cards-teaser.js";

// TRANSFORMER IMPORTS
import cleanupTransformer from "./transformers/wknd-cleanup.js";
import sectionsTransformer from "./transformers/wknd-sections.js";

// PARSER REGISTRY
const parsers = {
  "hero-banner": heroBannerParser,
  "tabs-filter": tabsFilterParser,
  "cards-teaser": cardsTeaserParser,
};

// TRANSFORMER REGISTRY (cleanup first, then sections)
const transformers = [
  cleanupTransformer,
  sectionsTransformer,
];

// PAGE TEMPLATE CONFIGURATION - embedded from page-templates.json
const PAGE_TEMPLATE = {
    "name": "adventure-listing",
    "description": "Adventure listing/index page with a grid of adventure teaser cards",
    "urls": [
      "https://wknd.site/ca/en/adventures.html",
      "https://wknd.site/us/en/adventures.html"
    ],
    "blocks": [
      {
        "name": "hero-banner",
        "instances": [
          "div.teaser.cmp-teaser--hero"
        ]
      },
      {
        "name": "tabs-filter",
        "instances": [
          "div.tabs.panelcontainer"
        ]
      },
      {
        "name": "cards-teaser",
        "instances": [
          "div.image-list.list"
        ]
      }
    ]
  };

/**
 * Execute all page transformers for a specific hook.
 */
function executeTransformers(hookName, element, payload) {
  const enhancedPayload = { ...payload, template: PAGE_TEMPLATE };
  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

/**
 * Find all blocks on the page based on the embedded template configuration.
 */
function findBlocksOnPage(document, template) {
  const pageBlocks = [];
  template.blocks.forEach((blockDef) => {
    if (blockDef.name.startsWith("section-")) return;
    blockDef.instances.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      elements.forEach((element) => {
        pageBlocks.push({ name: blockDef.name, selector, element, section: blockDef.section || null });
      });
    });
  });
  console.log(`Found ${pageBlocks.length} block instances on page`);
  return pageBlocks;
}

export default {
  transform: (payload) => {
    const { document, url, html, params } = payload;
    const main = document.body;

    // 1. beforeTransform (initial cleanup)
    executeTransformers("beforeTransform", main, payload);

    // 2. Find blocks; dedupe elements matched by multiple selectors
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);
    const seen = new Set();

    // 3. Parse each block; skip duplicates and elements already detached
    pageBlocks.forEach((block) => {
      if (seen.has(block.element)) return;
      seen.add(block.element);
      if (!block.element.parentNode) return;
      const parser = parsers[block.name];
      if (parser) {
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      } else {
        console.warn(`No parser found for block: ${block.name}`);
      }
    });

    // 4. afterTransform (final cleanup + section breaks/metadata)
    executeTransformers("afterTransform", main, payload);

    // 5. WebImporter built-in rules
    const hr = document.createElement("hr");
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 6. Sanitized document path
    const path = WebImporter.FileUtils.sanitizePath(
      new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html$/, ""),
    );

    return [{
      element: main,
      path,
      report: { title: document.title, template: PAGE_TEMPLATE.name, blocks: pageBlocks.map((b) => b.name) },
    }];
  },
};
