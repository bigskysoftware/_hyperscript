#!/usr/bin/env node

const _hyperscript = require('../lib/core');
const fs = require('fs/promises');

global.require = require; // Allow importing modules from within hyperscript

const argv = process.argv.slice(2);
fs.readFile(argv[0], { encoding: 'utf-8' }).then(code => {
    _hyperscript(code);
}).catch(e => {
    console.error("Cannot execute file: ", e);
})
