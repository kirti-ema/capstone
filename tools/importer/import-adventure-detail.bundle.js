/* eslint-disable */
var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // tools/importer/import-adventure-detail.js
  var import_adventure_detail_exports = {};
  __export(import_adventure_detail_exports, {
    default: () => import_adventure_detail_default
  });

  // tools/importer/parsers/breadcrumbs.js
  function parse(element, { document }) {
    const items = Array.from(element.querySelectorAll(".cmp-breadcrumb__item, li"));
    const cells = [];
    items.forEach((item) => {
      const link = item.querySelector("a");
      if (link) {
        const label = (link.textContent || "").trim();
        const a = document.createElement("a");
        a.href = link.getAttribute("href");
        a.textContent = label;
        cells.push([a]);
      } else {
        const label = (item.textContent || "").trim();
        if (label) cells.push([label]);
      }
    });
    if (cells.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "breadcrumbs", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/carousel-gallery.js
  function parse2(element, { document }) {
    const slides = Array.from(element.querySelectorAll(".cmp-carousel__item"));
    const cells = [];
    slides.forEach((slide) => {
      const img = slide.querySelector(".cmp-image img, img");
      if (!img) return;
      const heading = slide.querySelector('.cmp-teaser__title, h1, h2, h3, [class*="title"]');
      const description = slide.querySelector('.cmp-teaser__description, [class*="description"]');
      const cta = slide.querySelector(".cmp-teaser__action-link, a");
      const textCell = [];
      if (heading) {
        const h = document.createElement("h3");
        h.textContent = (heading.textContent || "").trim();
        textCell.push(h);
      }
      if (description) {
        const p = document.createElement("p");
        p.textContent = (description.textContent || "").trim();
        textCell.push(p);
      }
      if (cta && cta.getAttribute("href")) {
        const a = document.createElement("a");
        a.href = cta.getAttribute("href");
        a.textContent = (cta.textContent || "").trim();
        textCell.push(a);
      }
      cells.push([img, textCell.length ? textCell : ""]);
    });
    if (cells.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "carousel-gallery", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/table-specs.js
  function parse3(element, { document }) {
    const groups = Array.from(element.querySelectorAll(".cmp-contentfragment__element"));
    const cells = [];
    if (groups.length) {
      groups.forEach((group) => {
        const dt = group.querySelector("dt, .cmp-contentfragment__element-title");
        const dd = group.querySelector("dd, .cmp-contentfragment__element-value");
        const label = dt ? (dt.textContent || "").trim() : "";
        const value = dd ? (dd.textContent || "").trim() : "";
        if (label || value) cells.push([label, value]);
      });
    } else {
      const dts = Array.from(element.querySelectorAll("dt"));
      dts.forEach((dt) => {
        const dd = dt.nextElementSibling && dt.nextElementSibling.tagName === "DD" ? dt.nextElementSibling : null;
        const label = (dt.textContent || "").trim();
        const value = dd ? (dd.textContent || "").trim() : "";
        if (label || value) cells.push([label, value]);
      });
    }
    if (cells.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "table-specs", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/tabs-detail.js
  function parse4(element, { document }) {
    const labels = Array.from(element.querySelectorAll(".cmp-tabs__tablist .cmp-tabs__tab, .cmp-tabs__tab"));
    const panels = Array.from(element.querySelectorAll(".cmp-tabs__tabpanel"));
    const cells = [];
    labels.forEach((labelEl, i) => {
      const label = (labelEl.textContent || "").trim();
      const panel = panels[i];
      let contentCell = "";
      if (panel) {
        const cf = panel.querySelector(".cmp-contentfragment__elements");
        contentCell = cf || panel;
      }
      if (label || contentCell) cells.push([label, contentCell || ""]);
    });
    if (cells.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "tabs-detail", cells });
    element.replaceWith(block);
  }

  // tools/importer/transformers/wknd-cleanup.js
  var TransformHook = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  function unwrap(el) {
    const parent = el.parentNode;
    if (!parent) return;
    while (el.firstChild) {
      parent.insertBefore(el.firstChild, el);
    }
    parent.removeChild(el);
  }
  function transform(hookName, element, payload) {
    if (hookName === TransformHook.beforeTransform) {
      WebImporter.DOMUtils.remove(element, [
        "header.experiencefragment",
        "footer.experiencefragment",
        "div.cmp-experiencefragment--header",
        "div.cmp-experiencefragment--footer"
      ]);
      WebImporter.DOMUtils.remove(element, [
        "#toggleNav",
        "#mobileNav"
      ]);
      WebImporter.DOMUtils.remove(element, [
        'iframe[src*="demdex"]',
        "#destination_publishing_iframe_wkndsite_0"
      ]);
    }
    if (hookName === TransformHook.afterTransform) {
      WebImporter.DOMUtils.remove(element, [
        "header.experiencefragment",
        "footer.experiencefragment",
        "div.cmp-experiencefragment--header",
        "div.cmp-experiencefragment--footer"
      ]);
      const wrapperSelector = "div.aem-Grid, div.aem-GridColumn, div.cmp-container, div.responsivegrid";
      let guard = 0;
      let wrappers = element.querySelectorAll(wrapperSelector);
      while (wrappers.length && guard < 100) {
        wrappers.forEach((w) => unwrap(w));
        wrappers = element.querySelectorAll(wrapperSelector);
        guard += 1;
      }
      WebImporter.DOMUtils.remove(element, [
        "iframe",
        "link",
        "noscript",
        "source",
        "meta"
      ]);
      element.querySelectorAll("*").forEach((el) => {
        const names = el.getAttributeNames ? el.getAttributeNames() : [];
        names.forEach((name) => {
          if (name.startsWith("data-cmp") || name === "onclick") {
            el.removeAttribute(name);
          }
        });
      });
    }
  }

  // tools/importer/transformers/wknd-sections.js
  var TransformHook2 = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  function getStyledSections(payload) {
    const template = payload && payload.template || {};
    const result = [];
    if (Array.isArray(template.sections)) {
      template.sections.forEach((s) => {
        if (s && s.style) {
          result.push({ style: s.style, selectors: s.selectors || s.instances || [] });
        }
      });
    }
    if (Array.isArray(template.blocks)) {
      template.blocks.forEach((b) => {
        if (b && b.section) {
          result.push({ style: b.section, selectors: b.instances || [] });
        }
      });
    }
    return result;
  }
  function topLevelBlock(root, node) {
    let current = node;
    while (current && current.parentNode && current.parentNode !== root) {
      current = current.parentNode;
    }
    return current && current.parentNode === root ? current : null;
  }
  function transform2(hookName, element, payload) {
    if (hookName !== TransformHook2.afterTransform) return;
    const sections = getStyledSections(payload);
    if (!sections.length) return;
    const doc = element.ownerDocument;
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const { style, selectors } = sections[i];
      let anchor = null;
      for (let s = 0; s < selectors.length && !anchor; s += 1) {
        try {
          anchor = element.querySelector(selectors[s]);
        } catch (e) {
          anchor = null;
        }
      }
      if (!anchor) continue;
      const block = topLevelBlock(element, anchor);
      if (!block) continue;
      const prev = block.previousElementSibling;
      if (prev && prev.tagName !== "HR") {
        block.parentNode.insertBefore(doc.createElement("hr"), block);
      }
      let metaBlock = null;
      try {
        metaBlock = WebImporter.Blocks.createBlock(doc, {
          name: "Section Metadata",
          cells: { Style: style }
        });
      } catch (e) {
        metaBlock = null;
      }
      const next = block.nextElementSibling;
      if (metaBlock) {
        block.parentNode.insertBefore(metaBlock, next);
      }
      if (next && next.tagName !== "HR") {
        block.parentNode.insertBefore(doc.createElement("hr"), next);
      }
    }
  }

  // tools/importer/import-adventure-detail.js
  var parsers = {
    "breadcrumbs": parse,
    "carousel-gallery": parse2,
    "table-specs": parse3,
    "tabs-detail": parse4
  };
  var transformers = [
    transform,
    transform2
  ];
  var PAGE_TEMPLATE = {
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
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), { template: PAGE_TEMPLATE });
    transformers.forEach((transformerFn) => {
      try {
        transformerFn.call(null, hookName, element, enhancedPayload);
      } catch (e) {
        console.error(`Transformer failed at ${hookName}:`, e);
      }
    });
  }
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
  var import_adventure_detail_default = {
    transform: (payload) => {
      const { document, url, html, params } = payload;
      const main = document.body;
      executeTransformers("beforeTransform", main, payload);
      const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);
      const seen = /* @__PURE__ */ new Set();
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
      executeTransformers("afterTransform", main, payload);
      const hr = document.createElement("hr");
      main.appendChild(hr);
      WebImporter.rules.createMetadata(main, document);
      WebImporter.rules.transformBackgroundImages(main, document);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const path = WebImporter.FileUtils.sanitizePath(
        new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html$/, "")
      );
      return [{
        element: main,
        path,
        report: { title: document.title, template: PAGE_TEMPLATE.name, blocks: pageBlocks.map((b) => b.name) }
      }];
    }
  };
  return __toCommonJS(import_adventure_detail_exports);
})();
