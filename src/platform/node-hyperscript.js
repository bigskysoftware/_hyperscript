#!/usr/bin/env node

import _hyperscript from '../_hyperscript.js';
import { Feature } from '../parsetree/base.js';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

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

run(process.argv[2]);
