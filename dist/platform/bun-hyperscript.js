#!/usr/bin/env bun

import _hyperscript from '../_hyperscript.esm.js';
import path from 'node:path';

const hsExt = '._hs';

function run(modulePath) {
    modulePath = path.resolve(modulePath);
    const args = { module: { dir: path.dirname(modulePath), id: modulePath } };
    return Bun.file(modulePath).text()
        .then(code => _hyperscript.evaluate(code, {}, args))
        .catch(e => console.error("Cannot execute file:", e));
}

_hyperscript.addFeature("require", function parseRequire(parser) {
    if (!parser.matchToken("require")) return;
    const id = parser.requireElement("nakedString").evalStatically();
    let name;
    if (parser.matchToken("as")) {
        name = parser.requireTokenType("IDENTIFIER").value;
    } else {
        name = path.basename(id).replace(/\.[^.]*$/, '');
    }
    return {
        async install(target, source, args, runtime) {
            let resolved = id;
            if (resolved.startsWith('./') || resolved.startsWith('../')) {
                resolved = path.join(args.module.dir, resolved);
            }
            let mod;
            if (resolved.endsWith(hsExt)) {
                mod = await run(resolved);
            } else {
                const file = Bun.file(resolved + hsExt);
                if (await file.exists()) {
                    mod = await run(resolved + hsExt);
                } else {
                    mod = await import(resolved);
                }
            }
            runtime.assignToNamespace(target, [], name, mod);
        }
    };
});

run(process.argv[2]);
