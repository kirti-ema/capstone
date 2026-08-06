/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import breadcrumbsParser from "./parsers/breadcrumbs.js";
import carouselGalleryParser from "./parsers/carousel-gallery.js";
import tableSpecsParser from "./parsers/table-specs.js";
import tabsDetailParser from "./parsers/tabs-detail.js";

// TRANSFORMER IMPORTS
import cleanupTransformer from "./transformers/wknd-cleanup.js";
import sectionsTransformer from "./transformers/wknd-sections.js";

// PARSER REGISTRY
const parsers = {
  "breadcrumbs": breadcrumbsParser,
  "carousel-gallery": carouselGalleryParser,
  "table-specs": tableSpecsParser,
  "tabs-detail": tabsDetailParser,
};

// TRANSFORMER REGISTRY (cleanup first, then sections)
const transformers = [
  cleanupTransformer,
  sectionsTransformer,
];

// PAGE TEMPLATE CONFIGURATION - embedded from page-templates.json
const PAGE_TEMPLATE = {
    "name": "adventure-detail",
    "description": "Adventure detail page with hero image, trip metadata sidebar, rich body copy and related content",
    "urls": [
      "https://wknd.site/ca/en/adventures/bali-surf-camp.html",
      "https://wknd.site/ca/en/adventures/beervana-portland.html",
      "https://wknd.site/ca/en/adventures/climbing-new-zealand.html",
      "https://wknd.site/ca/en/adventures/colorado-rock-climbing.html",
      "https://wknd.site/ca/en/adventures/cycling-southern-utah.html",
      "https://wknd.site/ca/en/adventures/cycling-tuscany.html",
      "https://wknd.site/ca/en/adventures/downhill-skiing-wyoming.html",
      "https://wknd.site/ca/en/adventures/gastronomic-marais-tour.html",
      "https://wknd.site/ca/en/adventures/napa-wine-tasting.html",
      "https://wknd.site/ca/en/adventures/riverside-camping-australia.html",
      "https://wknd.site/ca/en/adventures/ski-touring-mont-blanc.html",
      "https://wknd.site/ca/en/adventures/surf-camp-costa-rica.html",
      "https://wknd.site/ca/en/adventures/tahoe-skiing.html",
      "https://wknd.site/ca/en/adventures/west-coast-cycling.html",
      "https://wknd.site/ca/en/adventures/whistler-mountain-biking.html",
      "https://wknd.site/ca/en/adventures/yosemite-backpacking.html",
      "https://wknd.site/us/en/adventures/bali-surf-camp.html",
      "https://wknd.site/us/en/adventures/beervana-portland.html",
      "https://wknd.site/us/en/adventures/climbing-new-zealand.html",
      "https://wknd.site/us/en/adventures/colorado-rock-climbing.html",
      "https://wknd.site/us/en/adventures/cycling-southern-utah.html",
      "https://wknd.site/us/en/adventures/cycling-tuscany.html",
      "https://wknd.site/us/en/adventures/downhill-skiing-wyoming.html",
      "https://wknd.site/us/en/adventures/gastronomic-marais-tour.html",
      "https://wknd.site/us/en/adventures/napa-wine-tasting.html",
      "https://wknd.site/us/en/adventures/riverside-camping-australia.html",
      "https://wknd.site/us/en/adventures/ski-touring-mont-blanc.html",
      "https://wknd.site/us/en/adventures/surf-camp-costa-rica.html",
      "https://wknd.site/us/en/adventures/tahoe-skiing.html",
      "https://wknd.site/us/en/adventures/west-coast-cycling.html",
      "https://wknd.site/us/en/adventures/whistler-mountain-biking.html",
      "https://wknd.site/us/en/adventures/yosemite-backpacking.html"
    ],
    "blocks": [
      {
        "name": "breadcrumbs",
        "instances": [
          "div.breadcrumb.cmp-breadcrumb--fixed",
          "div.breadcrumb.aem-GridColumn"
        ]
      },
      {
        "name": "carousel-gallery",
        "instances": [
          "div.carousel.panelcontainer.cmp-carousel--mini",
          "div.carousel.panelcontainer"
        ]
      },
      {
        "name": "table-specs",
        "instances": [
          "div.contentfragment.cmp-contentfragment--elements"
        ]
      },
      {
        "name": "tabs-detail",
        "instances": [
          "div.tabs.panelcontainer"
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
