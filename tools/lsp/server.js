#!/usr/bin/env node
/**
 * Hyperscript Language Server
 * Provides diagnostics, completions, hover docs, and go-to-definition
 * for _hyperscript in HTML files.
 */
const {
  createConnection, TextDocuments, ProposedFeatures,
  TextDocumentSyncKind, DiagnosticSeverity,
} = require('vscode-languageserver/node');
const { TextDocument } = require('vscode-languageserver-textdocument');
const { URL } = require('url');

const parser = require('./src/parser');
const regions = require('./src/regions');
const completions = require('./src/completions');
const hover = require('./src/hover');

const connection = createConnection(ProposedFeatures.all);
const documents = new TextDocuments(TextDocument);

connection.onInitialize((params) => {
  let root = null;
  if (params.rootUri) {
    try { root = new URL(params.rootUri).pathname; } catch (_) {}
  } else if (params.rootPath) {
    root = params.rootPath;
  }

  try {
    parser.init(root);
    connection.console.log('Hyperscript parser initialized');
  } catch (e) {
    connection.console.error('Failed to initialize parser: ' + e.message);
  }

  return {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Full,
      completionProvider: { triggerCharacters: ['#'] },
      hoverProvider: true,
      definitionProvider: true,
    }
  };
});

// --- Diagnostics ---

documents.onDidChangeContent(({ document }) => {
  const text = document.getText();
  const extracted = regions.extractRegions(text);
  const diagnostics = [];

  for (const region of extracted) {
    const result = parser.parse(region.source);
    if (result.ok) continue;

    for (const error of result.errors) {
      let start, end;
      if (error.start != null) {
        start = regions.regionOffsetToDocPosition(error.start, region);
        const errEnd = error.end != null ? error.end : error.start + 1;
        end = regions.regionOffsetToDocPosition(errEnd, region);
      } else if (error.line != null) {
        const line = error.line - 1; // parser lines are 1-based
        const col = error.column || 0;
        start = regions.regionToDocPosition(line, col, region);
        end = regions.regionToDocPosition(line, col + 1, region);
      } else {
        start = { line: region.line, character: region.col };
        end = { line: region.line, character: region.col + 1 };
      }

      diagnostics.push({
        severity: DiagnosticSeverity.Error,
        range: { start, end },
        message: error.message,
        source: 'hyperscript',
      });
    }
  }

  connection.sendDiagnostics({ uri: document.uri, diagnostics });
});

// --- Completions ---

connection.onCompletion((params) => {
  const doc = documents.get(params.textDocument.uri);
  if (!doc) return [];

  const text = doc.getText();
  const offset = doc.offsetAt(params.position);
  const extracted = regions.extractRegions(text);

  connection.console.log(`Completion at offset ${offset}, found ${extracted.length} regions`);
  for (const r of extracted) {
    connection.console.log(`  region: offset=${r.offset} len=${r.source.length} "${r.source.substring(0, 40)}"`);
  }

  const hit = regions.findRegionAtOffset(extracted, offset);
  if (!hit) {
    connection.console.log('No region at cursor');
    return [];
  }

  connection.console.log(`Hit region at localOffset=${hit.localOffset}, source="${hit.region.source}"`);

  const cssClasses = regions.extractCssClasses(text);
  const cssIds = regions.extractIds(text);

  const items = completions.getCompletions(hit.region.source, hit.localOffset, cssClasses, cssIds);
  connection.console.log(`Returning ${items.length} completions`);
  return items;
});

// --- Hover ---

connection.onHover((params) => {
  const doc = documents.get(params.textDocument.uri);
  if (!doc) return null;

  const text = doc.getText();
  const offset = doc.offsetAt(params.position);
  const extracted = regions.extractRegions(text);
  const hit = regions.findRegionAtOffset(extracted, offset);
  if (!hit) return null;

  // Find the word at cursor
  const src = hit.region.source;
  const pos = hit.localOffset;
  let start = pos, end = pos;
  while (start > 0 && /[\w$]/.test(src[start - 1])) start--;
  while (end < src.length && /[\w$]/.test(src[end])) end++;
  if (start === end) return null;

  const word = src.substring(start, end);
  const content = hover.getHover(word);
  if (!content) return null;

  return { contents: content };
});

// --- Go to Definition ---

connection.onDefinition((params) => {
  const doc = documents.get(params.textDocument.uri);
  if (!doc) return null;

  const text = doc.getText();
  const offset = doc.offsetAt(params.position);
  const extracted = regions.extractRegions(text);
  const hit = regions.findRegionAtOffset(extracted, offset);
  if (!hit) return null;

  // Check if cursor is on a #id token
  const src = hit.region.source;
  const pos = hit.localOffset;

  // Walk back to find '#'
  let start = pos;
  while (start > 0 && /[\w\-$]/.test(src[start - 1])) start--;
  if (start > 0 && src[start - 1] === '#') start--;
  if (src[start] !== '#') return null;

  let end = start + 1;
  while (end < src.length && /[\w\-$]/.test(src[end])) end++;
  const idValue = src.substring(start + 1, end);
  if (!idValue) return null;

  const idPos = regions.findIdPosition(text, idValue);
  if (!idPos) return null;

  return {
    uri: params.textDocument.uri,
    range: { start: idPos, end: { line: idPos.line, character: idPos.character + idValue.length + 4 } },
  };
});

documents.listen(connection);
connection.listen();
