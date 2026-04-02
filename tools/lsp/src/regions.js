/**
 * Extracts hyperscript regions from HTML documents.
 * Finds _="...", hs="...", data-hs="..." attributes and
 * <script type="text/hyperscript">...</script> blocks.
 */

/**
 * @typedef {{ source: string, offset: number, line: number, col: number, type: string }} Region
 */

/**
 * Extract all hyperscript regions from an HTML document.
 * @param {string} text
 * @returns {Region[]}
 */
function extractRegions(text) {
  const regions = [];

  // Find attribute regions: _="...", hs="...", data-hs="..."
  const attrPattern = /\b(_|hs|data-hs)\s*=\s*(["'])/g;
  let match;
  while ((match = attrPattern.exec(text)) !== null) {
    const quote = match[2];
    const contentStart = match.index + match[0].length;
    const contentEnd = findClosingQuote(text, contentStart, quote);
    if (contentEnd > contentStart) {
      const pos = offsetToPosition(text, contentStart);
      regions.push({
        source: text.substring(contentStart, contentEnd),
        offset: contentStart,
        line: pos.line,
        col: pos.character,
        type: 'attribute'
      });
    }
  }

  // Find script block regions: <script type="text/hyperscript">...</script>
  const scriptPattern = /<script\s+type\s*=\s*["']text\/hyperscript["'][^>]*>([\s\S]*?)<\/script>/gi;
  while ((match = scriptPattern.exec(text)) !== null) {
    const contentStart = match.index + match[0].indexOf('>') + 1;
    const source = match[1];
    if (source.trim()) {
      const pos = offsetToPosition(text, contentStart);
      regions.push({
        source,
        offset: contentStart,
        line: pos.line,
        col: pos.character,
        type: 'script'
      });
    }
  }

  return regions;
}

function findClosingQuote(text, start, quote) {
  let i = start;
  while (i < text.length) {
    if (text[i] === '\\') { i += 2; continue; }
    if (text[i] === quote) return i;
    i++;
  }
  return start; // unclosed
}

/**
 * Convert a character offset to { line, character } (0-based).
 * @param {string} text
 * @param {number} offset
 * @returns {{ line: number, character: number }}
 */
function offsetToPosition(text, offset) {
  let line = 0, lastNewline = -1;
  for (let i = 0; i < offset && i < text.length; i++) {
    if (text[i] === '\n') { line++; lastNewline = i; }
  }
  return { line, character: offset - lastNewline - 1 };
}

/**
 * Convert a position within a region to document-global position.
 * @param {number} regionLine - 0-based line within the region
 * @param {number} regionChar - 0-based character within the region
 * @param {Region} region
 * @returns {{ line: number, character: number }}
 */
function regionToDocPosition(regionLine, regionChar, region) {
  if (regionLine === 0) {
    return { line: region.line, character: region.col + regionChar };
  }
  return { line: region.line + regionLine, character: regionChar };
}

/**
 * Convert a character offset within a region's source to document-global position.
 * @param {number} regionOffset
 * @param {Region} region
 * @returns {{ line: number, character: number }}
 */
function regionOffsetToDocPosition(regionOffset, region) {
  const pos = offsetToPosition(region.source, regionOffset);
  return regionToDocPosition(pos.line, pos.character, region);
}

/**
 * Find which region contains the given document offset.
 * @param {Region[]} regions
 * @param {number} docOffset
 * @returns {{ region: Region, localOffset: number }|null}
 */
function findRegionAtOffset(regions, docOffset) {
  for (const region of regions) {
    if (docOffset >= region.offset && docOffset <= region.offset + region.source.length) {
      return { region, localOffset: docOffset - region.offset };
    }
  }
  return null;
}

/**
 * Extract CSS classes from HTML text.
 * @param {string} text
 * @returns {Set<string>}
 */
function extractCssClasses(text) {
  const classes = new Set();
  const pattern = /\bclass\s*=\s*["']([^"']*)["']/gi;
  let match;
  while ((match = pattern.exec(text)) !== null) {
    match[1].split(/\s+/).filter(Boolean).forEach(c => classes.add(c));
  }
  return classes;
}

/**
 * Extract element IDs from HTML text.
 * @param {string} text
 * @returns {Set<string>}
 */
function extractIds(text) {
  const ids = new Set();
  const pattern = /\bid\s*=\s*["']([^"']*)["']/gi;
  let match;
  while ((match = pattern.exec(text)) !== null) {
    if (match[1].trim()) ids.add(match[1].trim());
  }
  return ids;
}

/**
 * Find the position of an id="value" attribute in the document.
 * @param {string} text
 * @param {string} idValue
 * @returns {{ line: number, character: number }|null}
 */
function findIdPosition(text, idValue) {
  const escaped = idValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`\\bid\\s*=\\s*["']${escaped}["']`, 'gi');
  const match = pattern.exec(text);
  if (!match) return null;
  return offsetToPosition(text, match.index);
}

module.exports = {
  extractRegions, offsetToPosition, regionToDocPosition,
  regionOffsetToDocPosition, findRegionAtOffset,
  extractCssClasses, extractIds, findIdPosition
};
