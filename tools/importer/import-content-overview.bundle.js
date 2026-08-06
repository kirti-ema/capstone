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

  // tools/importer/import-content-overview.js
  var import_content_overview_exports = {};
  __export(import_content_overview_exports, {
    default: () => import_content_overview_default
  });

  // tools/importer/parsers/cards-profile.js
  function parse(element, { document }) {
    const img = element.querySelector(".image img, img");
    const titles = Array.from(element.querySelectorAll(".cmp-title__text, .title .cmp-title__text"));
    const name = titles[0] || null;
    const role = titles[1] || null;
    const socialLinks = Array.from(element.querySelectorAll(".button a.cmp-button, .cmp-button"));
    if (!img && !name && !role) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const imageCell = img || "";
    const textCell = [];
    if (name) {
      const h = document.createElement("h3");
      h.textContent = (name.textContent || "").trim();
      textCell.push(h);
    }
    if (role) {
      const h = document.createElement("h5");
      h.textContent = (role.textContent || "").trim();
      textCell.push(h);
    }
    socialLinks.forEach((link) => {
      const href = link.getAttribute("href");
      if (!href) return;
      const labelEl = link.querySelector(".cmp-button__text");
      const label = (labelEl ? labelEl.textContent : link.textContent || "").trim();
      const a = document.createElement("a");
      a.href = href;
      a.textContent = label;
      textCell.push(a);
    });
    const cells = [[imageCell, textCell]];
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-profile", cells });
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

  // tools/importer/import-content-overview.js
  var parsers = {
    "cards-profile": parse
  };
  var transformers = [
    transform,
    transform2
  ];
  var PAGE_TEMPLATE = {
    "name": "content-overview",
    "description": "Overview/landing page listing content with intro heading and teaser grid (about-us, magazine index, members-only index)",
    "urls": [
      "https://wknd.site/ca/en/about-us.html",
      "https://wknd.site/ca/en/magazine.html",
      "https://wknd.site/ca/en/magazine/members-only.html",
      "https://wknd.site/us/en/about-us.html",
      "https://wknd.site/us/en/magazine.html"
    ],
    "blocks": [
      {
        "name": "cards-profile",
        "instances": [
          "section.experiencefragment.cmp-experience-fragment--contributor"
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
  var import_content_overview_default = {
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
  return __toCommonJS(import_content_overview_exports);
})();
