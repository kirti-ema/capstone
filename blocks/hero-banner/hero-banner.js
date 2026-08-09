export default function decorate(block) {
  if (!block.querySelector(':scope > div:first-child picture')) {
    block.classList.add('no-image');
  }
  // the CTA link ("See Trip") is the shared yellow WKND button
  block.querySelectorAll('a[href]').forEach((a) => a.classList.add('wknd-button'));
}
