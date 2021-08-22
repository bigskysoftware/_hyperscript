#!/usr/bin/env node

const _hyperscript = require('../lib/core.js');
const fs = require('fs/promises');
const path = require('path')

global.require = require; // Allow importing modules from within hyperscript

const argv = process.argv.slice(2);
const dirname = path.dirname(path.resolve(argv[0]));

_hyperscript.addFeature('require', (parser, runtime, tokens) => {
    if (!tokens.matchToken('require')) return;
    let id = parser.requireElement('nakedString', tokens)
        // @ts-ignore
        .evaluate({});
    if (id.startsWith('./') || id.startsWith('../')) {
        id = path.join(dirname, id);
    }
    let name = id;
    if (tokens.matchToken('as')) {
        name = tokens.requireTokenType('IDENTIFIER').value;
    }

    return {
        install(source, target) {
            runtime.assignToNamespace(target, [], name, require(id));
        }
    }
})

fs.readFile(argv[0], { encoding: 'utf-8' }).then(code => {
    _hyperscript.evaluate(code);
}).catch(e => {
    console.error("Cannot execute file: ", e);
})
