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

  // tools/importer/import-faq-page.js
  var import_faq_page_exports = {};
  __export(import_faq_page_exports, {
    default: () => import_faq_page_default
  });

  // tools/importer/parsers/accordion-faq.js
  function parse(element, { document }) {
    const items = Array.from(element.querySelectorAll(".cmp-accordion__item"));
    const cells = [];
    items.forEach((item) => {
      const titleEl = item.querySelector(".cmp-accordion__title, .cmp-accordion__header");
      const panel = item.querySelector(".cmp-accordion__panel");
      const title = titleEl ? (titleEl.textContent || "").trim() : "";
      let contentCell = "";
      if (panel) {
        const textEl = panel.querySelector(".cmp-text");
        if (textEl) {
          contentCell = Array.from(textEl.children).length ? Array.from(textEl.children) : (textEl.textContent || "").trim();
        } else {
          contentCell = panel;
        }
      }
      if (title || contentCell && contentCell.length !== 0) {
        cells.push([title, contentCell]);
      }
    });
    if (cells.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "accordion-faq", cells });
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

  // tools/importer/import-faq-page.js
  var parsers = {
    "accordion-faq": parse
  };
  var transformers = [
    transform,
    transform2
  ];
  var PAGE_TEMPLATE = {
    "name": "faq-page",
    "description": "FAQ page with heading and stacked question/answer default content",
    "urls": [
      "https://wknd.site/ca/en/faqs.html",
      "https://wknd.site/us/en/faqs.html"
    ],
    "blocks": [
      {
        "name": "accordion-faq",
        "instances": [
          "div.accordion.panelcontainer"
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
  var import_faq_page_default = {
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
  return __toCommonJS(import_faq_page_exports);
})();
