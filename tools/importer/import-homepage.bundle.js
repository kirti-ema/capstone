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

  // tools/importer/import-homepage.js
  var import_homepage_exports = {};
  __export(import_homepage_exports, {
    default: () => import_homepage_default
  });

  // tools/importer/parsers/carousel-hero.js
  function parse(element, { document }) {
    const slides = Array.from(element.querySelectorAll(".cmp-carousel__item"));
    const cells = [];
    slides.forEach((slide) => {
      const img = slide.querySelector(".cmp-teaser__image img, .cmp-image img, img");
      const heading = slide.querySelector('.cmp-teaser__title, h1, h2, h3, [class*="title"]');
      const description = slide.querySelector('.cmp-teaser__description, [class*="description"]');
      const cta = slide.querySelector(".cmp-teaser__action-link, .cmp-teaser__action-container a");
      if (!img && !heading && !description) return;
      const imageCell = img || "";
      const textCell = [];
      if (heading) {
        const h = document.createElement("h2");
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
      cells.push([imageCell, textCell.length ? textCell : ""]);
    });
    if (cells.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "carousel-hero", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-teaser.js
  function parse2(element, { document }) {
    const items = Array.from(element.querySelectorAll(".cmp-image-list__item, li"));
    const cells = [];
    items.forEach((item) => {
      const img = item.querySelector("img");
      const titleLink = item.querySelector(".cmp-image-list__item-title-link, a");
      const titleText = item.querySelector(".cmp-image-list__item-title");
      const description = item.querySelector(".cmp-image-list__item-description");
      if (!img && !titleLink && !titleText && !description) return;
      const imageCell = img || "";
      const textCell = [];
      const label = (titleText ? titleText.textContent : titleLink ? titleLink.textContent : "").trim();
      if (label) {
        const heading = document.createElement("h3");
        const href = titleLink ? titleLink.getAttribute("href") : null;
        if (href) {
          const a = document.createElement("a");
          a.href = href;
          a.textContent = label;
          heading.append(a);
        } else {
          heading.textContent = label;
        }
        textCell.push(heading);
      }
      if (description) {
        const p = document.createElement("p");
        p.textContent = (description.textContent || "").trim();
        textCell.push(p);
      }
      cells.push([imageCell, textCell]);
    });
    if (cells.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-teaser", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/hero-banner.js
  function parse3(element, { document }) {
    const image = element.querySelector('.cmp-teaser__image img, img[class*="image"], img');
    const heading = element.querySelector('.cmp-teaser__title, h1, h2, h3, [class*="title"]');
    const description = element.querySelector('.cmp-teaser__description, [class*="description"], p');
    const ctaLinks = Array.from(
      element.querySelectorAll(".cmp-teaser__action-link, .cmp-teaser__action-container a")
    );
    if (!image && !heading && !description) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    if (image) cells.push([image]);
    const contentCell = [];
    if (heading) {
      const h = document.createElement("h2");
      h.textContent = (heading.textContent || "").trim();
      contentCell.push(h);
    }
    if (description) contentCell.push(description);
    ctaLinks.forEach((cta) => {
      const a = document.createElement("a");
      a.href = cta.getAttribute("href");
      a.textContent = (cta.textContent || "").trim();
      contentCell.push(a);
    });
    cells.push([contentCell]);
    const block = WebImporter.Blocks.createBlock(document, { name: "hero-banner", cells });
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
  var ATTR_STYLE = "data-wknd-section-style";
  var ATTR_IDX = "data-wknd-section-idx";
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
  function findAnchor(element, selectors) {
    for (let s = 0; s < selectors.length; s += 1) {
      try {
        const found = element.querySelector(selectors[s]);
        if (found) return found;
      } catch (e) {
      }
    }
    return null;
  }
  function transform2(hookName, element, payload) {
    const sections = getStyledSections(payload);
    if (!sections.length) return;
    const doc = element.ownerDocument;
    if (hookName === TransformHook2.beforeTransform) {
      sections.forEach((sec, idx) => {
        const anchor = findAnchor(element, sec.selectors);
        if (!anchor || !anchor.parentNode) return;
        const wrapper = doc.createElement("div");
        wrapper.setAttribute(ATTR_STYLE, sec.style);
        wrapper.setAttribute(ATTR_IDX, String(idx));
        anchor.parentNode.insertBefore(wrapper, anchor);
        wrapper.appendChild(anchor);
      });
      return;
    }
    if (hookName !== TransformHook2.afterTransform) return;
    let markers = [];
    try {
      markers = Array.prototype.slice.call(
        element.querySelectorAll(`div[${ATTR_IDX}]`)
      );
    } catch (e) {
      markers = [];
    }
    for (let i = markers.length - 1; i >= 0; i -= 1) {
      const wrapper = markers[i];
      const style = wrapper.getAttribute(ATTR_STYLE);
      if (!wrapper.parentNode) continue;
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
      const prev = wrapper.previousElementSibling;
      if (prev && prev.tagName !== "HR") {
        parent.insertBefore(doc.createElement("hr"), wrapper);
      }
      while (wrapper.firstChild) {
        parent.insertBefore(wrapper.firstChild, wrapper);
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
      if (metaBlock) parent.insertBefore(metaBlock, wrapper);
      const next = wrapper.nextElementSibling;
      if (next && next.tagName !== "HR") {
        parent.insertBefore(doc.createElement("hr"), wrapper);
      }
      parent.removeChild(wrapper);
    }
  }

  // tools/importer/import-homepage.js
  var parsers = {
    "carousel-hero": parse,
    "cards-teaser": parse2,
    "hero-banner": parse3
  };
  var transformers = [
    transform,
    transform2
  ];
  var PAGE_TEMPLATE = {
    name: "homepage",
    description: "Locale landing/home page with hero banner and curated content teasers; one per country/language root (e.g. /us/en.html)",
    urls: [
      "https://wknd.site/ca/en.html",
      "https://wknd.site/ca/fr.html",
      "https://wknd.site/ch/de.html",
      "https://wknd.site/ch/fr.html",
      "https://wknd.site/ch/it.html",
      "https://wknd.site/de/de.html",
      "https://wknd.site/es/es.html",
      "https://wknd.site/fr/fr.html",
      "https://wknd.site/it/it.html",
      "https://wknd.site/us/en.html",
      "https://wknd.site/us/es.html"
    ],
    blocks: [
      {
        name: "carousel-hero",
        instances: ["div.carousel.panelcontainer"]
      },
      {
        name: "cards-teaser",
        instances: ["div.image-list.list"]
      },
      {
        name: "hero-banner",
        instances: ["div.teaser.cmp-teaser--hero.cmp-teaser--imagebottom"]
      },
      {
        name: "section-featured",
        instances: ["div.teaser.cmp-teaser--featured"],
        section: "featured"
      }
    ]
  };
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), {
      template: PAGE_TEMPLATE
    });
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
        if (elements.length === 0) {
          console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
        }
        elements.forEach((element) => {
          pageBlocks.push({
            name: blockDef.name,
            selector,
            element,
            section: blockDef.section || null
          });
        });
      });
    });
    console.log(`Found ${pageBlocks.length} block instances on page`);
    return pageBlocks;
  }
  var import_homepage_default = {
    transform: (payload) => {
      const {
        document,
        url,
        html,
        params
      } = payload;
      const main = document.body;
      executeTransformers("beforeTransform", main, payload);
      const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);
      pageBlocks.forEach((block) => {
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
        report: {
          title: document.title,
          template: PAGE_TEMPLATE.name,
          blocks: pageBlocks.map((b) => b.name)
        }
      }];
    }
  };
  return __toCommonJS(import_homepage_exports);
})();
