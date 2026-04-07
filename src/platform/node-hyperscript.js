#!/usr/bin/env node

import _hyperscript from '../_hyperscript.js';
import { Parser } from '../core/parser.js';
import { Feature } from '../parsetree/base.js';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const argv = process.argv.slice(2);
const flags = new Set(argv.filter(a => a.startsWith('--')));
const positional = argv.filter(a => !a.startsWith('--'));

// ===== Run mode (existing) =====

const hsExt = '._hs';

function run(modulePath) {
    modulePath = path.resolve(modulePath);
    const args = { module: { dir: path.dirname(modulePath), id: modulePath } };
    return fs.promises.readFile(modulePath, { encoding: 'utf-8' })
        .then(code => _hyperscript.evaluate(code, {}, args))
        .catch(e => console.error("Cannot execute file:", e));
}

class RequireFeature extends Feature {
    static keyword = "require";

    constructor(id, name) {
        super();
        this.moduleId = id;
        this.moduleName = name;
    }

    static parse(parser) {
        if (!parser.matchToken("require")) return;
        var id = parser.requireElement("nakedString").evalStatically();
        var name;
        if (parser.matchToken("as")) {
            name = parser.requireTokenType("IDENTIFIER").value;
        } else {
            name = path.basename(id).replace(/\.[^.]*$/, '');
        }
        return new RequireFeature(id, name);
    }

    install(target, source, args, runtime) {
        var id = this.moduleId;
        if (id.startsWith('./') || id.startsWith('../')) {
            id = path.join(args.module.dir, id);
        }

        var mod;
        if (id.endsWith(hsExt)) {
            mod = run(id);
        } else if (fs.existsSync(id + hsExt)) {
            mod = run(id + hsExt);
        } else {
            var nodeRequire = createRequire(args.module.id);
            mod = nodeRequire(id);
        }
        runtime.assignToNamespace(target, [], this.moduleName, mod);
    }
}

_hyperscript.addFeature(RequireFeature.keyword, RequireFeature.parse.bind(RequireFeature));

// ===== Validate mode =====

const DEFAULT_EXTENSIONS = new Set(['.html', '.htm', '._hs']);
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'build', 'vendor', '__pycache__', '_site']);

function validate() {
    // Parse --ext flag
    const extFlag = getFlagValue('--ext');
    const extensions = new Set(DEFAULT_EXTENSIONS);
    if (extFlag) {
        for (const e of extFlag.split(',')) {
            extensions.add(e.startsWith('.') ? e : '.' + e);
        }
    }

    // Parse --attr flag (additional attributes beyond the defaults)
    const defaultAttrs = ['_', 'script', 'data-script'];
    const attrFlag = getFlagValue('--attr');
    const attrs = [...defaultAttrs];
    if (attrFlag) {
        for (const a of attrFlag.split(',')) {
            if (a.trim()) attrs.push(a.trim());
        }
    }

    const quiet = flags.has('--quiet');

    // Build regex from attributes
    const attrPattern = new RegExp('\\b(' + attrs.map(escapeRegex).join('|') + ')\\s*=\\s*(["\'])', 'g');
    const scriptPattern = /<script\s+type\s*=\s*["']text\/hyperscript["'][^>]*>([\s\S]*?)<\/script>/gi;

    // Collect files
    const targets = positional.length ? positional : ['.'];
    const files = [];
    for (const target of targets) {
        collectFiles(path.resolve(target), extensions, files);
    }

    if (!files.length) {
        console.log('No files found to validate.');
        return;
    }

    // Validate
    let totalErrors = 0;
    let filesWithErrors = 0;

    for (const filePath of files) {
        const errors = validateFile(filePath, extensions, attrPattern, scriptPattern);
        if (errors.length) {
            filesWithErrors++;
            totalErrors += errors.length;
            if (!quiet) {
                for (const msg of errors) console.error(msg);
            }
        }
    }

    // Summary
    const color = totalErrors ? '\x1b[31m' : '\x1b[32m';
    const reset = '\x1b[0m';
    console.log(`\n${color}Validated ${files.length} file(s), ${totalErrors} error(s) in ${filesWithErrors} file(s).${reset}`);
    process.exit(totalErrors ? 1 : 0);
}

function collectFiles(target, extensions, out) {
    const stat = fs.statSync(target, { throwIfNoEntry: false });
    if (!stat) {
        console.error(`Not found: ${target}`);
        return;
    }
    if (stat.isFile()) {
        out.push(target);
        return;
    }
    if (!stat.isDirectory()) return;

    for (const entry of fs.readdirSync(target, { withFileTypes: true })) {
        if (entry.isDirectory()) {
            if (SKIP_DIRS.has(entry.name) || entry.name.startsWith('.')) continue;
            collectFiles(path.join(target, entry.name), extensions, out);
        } else if (extensions.has(path.extname(entry.name))) {
            out.push(path.join(target, entry.name));
        }
    }
}

function validateFile(filePath, extensions, attrPattern, scriptPattern) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const ext = path.extname(filePath);
    const errors = [];

    if (ext === '._hs') {
        // Entire file is hyperscript
        parseAndCollect(content, 0, null);
    } else {
        // HTML-like file — extract regions
        const regions = extractRegions(content, attrPattern, scriptPattern);
        for (const region of regions) {
            if (!region.source.trim()) continue;
            parseAndCollect(region.source, region.offset, region);
        }
    }

    function parseAndCollect(source, offset, region) {
        var result;
        try {
            result = _hyperscript.parse(source);
        } catch (e) {
            // Tokenizer can throw on unterminated strings, etc.
            errors.push(formatError(filePath, content, {
                message: e.message,
                token: { start: 0, value: '', line: 1, column: 0 },
            }, offset, region));
            return;
        }
        if (result.errors?.length) {
            for (const err of result.errors) {
                errors.push(formatError(filePath, content, err, offset, region));
            }
        }
    }
    return errors;
}

// ===== Region extraction (adapted from tools/lsp/src/regions.js) =====

function extractRegions(text, attrPattern, scriptPattern) {
    const regions = [];

    // Attribute regions
    attrPattern.lastIndex = 0;
    let match;
    while ((match = attrPattern.exec(text)) !== null) {
        const quote = match[2];
        const contentStart = match.index + match[0].length;
        const contentEnd = findClosingQuote(text, contentStart, quote);
        if (contentEnd > contentStart) {
            regions.push({
                source: text.substring(contentStart, contentEnd),
                offset: contentStart,
                type: 'attribute',
            });
        }
    }

    // Script block regions
    scriptPattern.lastIndex = 0;
    while ((match = scriptPattern.exec(text)) !== null) {
        const contentStart = match.index + match[0].indexOf('>') + 1;
        const source = match[1];
        if (source.trim()) {
            regions.push({
                source,
                offset: contentStart,
                type: 'script',
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

// ===== Error formatting =====

function formatError(filePath, fileContent, error, regionOffset, region) {
    // Map error position to absolute file position
    const absOffset = regionOffset + (error.token?.start ?? 0);
    const pos = offsetToLineCol(fileContent, absOffset);
    const relPath = path.relative(process.cwd(), filePath);

    let out = `\x1b[1m${relPath}:${pos.line}:${pos.col}\x1b[0m \x1b[31merror:\x1b[0m ${error.message}`;

    // Show context line
    const lines = fileContent.split('\n');
    const lineIdx = pos.line - 1;
    if (lineIdx >= 0 && lineIdx < lines.length) {
        const lineStr = lines[lineIdx];
        const gutter = String(pos.line).length;
        out += '\n';
        out += `  ${String(pos.line).padStart(gutter)} | ${lineStr}\n`;

        // Underline
        const col = pos.col - 1;
        const len = Math.max(1, error.token?.value?.length || 1);
        out += `  ${' '.repeat(gutter)} | ${' '.repeat(col)}${'~'.repeat(len)}`;
    }

    return out;
}

function offsetToLineCol(text, offset) {
    let line = 1, col = 1;
    for (let i = 0; i < offset && i < text.length; i++) {
        if (text[i] === '\n') { line++; col = 1; }
        else col++;
    }
    return { line, col };
}

// ===== Utilities =====

function getFlagValue(flag) {
    const idx = argv.indexOf(flag);
    if (idx === -1 || idx + 1 >= argv.length) return null;
    return argv[idx + 1];
}

function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ===== Dispatch =====

function usage() {
    console.log(`Usage:
  hyperscript <file._hs>                  Run a hyperscript file
  hyperscript --validate [paths...]       Validate hyperscript in files
    --ext .njk,.erb,...                   Additional file extensions to scan
    --attr foo,bar,...                    Additional HTML attributes to check
    --quiet                              Only show error count, not details`);
}

if (flags.has('--validate')) {
    validate();
} else if (flags.has('--help') || flags.has('-h') || !positional.length) {
    usage();
} else {
    run(positional[0]);
}
