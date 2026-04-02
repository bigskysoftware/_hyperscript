import _hyperscript from '../_hyperscript.js';
import { Feature } from '../parsetree/base.js';
import * as path from 'jsr:@std/path';

const hsExt = '._hs';

export function run(modulePath) {
    modulePath = path.resolve(modulePath);
    const args = { module: { dir: path.dirname(modulePath), id: modulePath } };
    return Deno.readTextFile(modulePath)
        .then(code => _hyperscript.evaluate(code, {}, args))
        .catch(e => console.error("Cannot execute file:", e));
}

class ImportFeature extends Feature {
    static keyword = "import";

    constructor(id, name) {
        super();
        this.moduleId = id;
        this.moduleName = name;
    }

    static parse(parser) {
        if (!parser.matchToken("import")) return;
        var id = parser.requireElement("nakedString").evalStatically();
        var name;
        if (parser.matchToken("as")) {
            name = parser.requireTokenType("IDENTIFIER").value;
        } else {
            name = path.basename(id).replace(/\.[^.]*$/, '');
        }
        return new ImportFeature(id, name);
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
            try {
                await Deno.stat(id + hsExt);
                mod = await run(id + hsExt);
            } catch {
                mod = await import(id);
            }
        }
        runtime.assignToNamespace(target, [], this.moduleName, mod);
    }
}

_hyperscript.addFeature(ImportFeature.keyword, ImportFeature.parse.bind(ImportFeature));

export default _hyperscript;

if (import.meta.main) run(Deno.args[0]);
