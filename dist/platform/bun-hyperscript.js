#!/usr/bin/env bun

import _hyperscript from '../_hyperscript.js';
import { Feature } from '../parsetree/base.js';
import path from 'node:path';

const hsExt = '._hs';

function run(modulePath) {
    modulePath = path.resolve(modulePath);
    const args = { module: { dir: path.dirname(modulePath), id: modulePath } };
    return Bun.file(modulePath).text()
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
        var id = parser.requireElement("nakedString").evaluate();
        var name;
        if (parser.matchToken("as")) {
            name = parser.requireTokenType("IDENTIFIER").value;
        } else {
            name = path.basename(id).replace(/\.[^.]*$/, '');
        }
        return new RequireFeature(id, name);
    }

    async install(target, source, args, runtime) {
        var id = this.moduleId;
        if (id.startsWith('./') || id.startsWith('../')) {
            id = path.join(args.module.dir, id);
        }

        var mod;
        if (id.endsWith(hsExt)) {
            mod = await run(id);
        } else {
            var file = Bun.file(id + hsExt);
            if (await file.exists()) {
                mod = await run(id + hsExt);
            } else {
                mod = await import(id);
            }
        }
        runtime.assignToNamespace(target, [], this.moduleName, mod);
    }
}

_hyperscript.addFeature(RequireFeature.keyword, RequireFeature.parse.bind(RequireFeature));

run(process.argv[2]);
