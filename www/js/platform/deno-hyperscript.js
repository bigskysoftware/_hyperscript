import _hyperscript from '../_hyperscript.js';
import * as path from 'jsr:@std/path';

const hsExt = '._hs';

export function run(modulePath) {
    modulePath = path.resolve(modulePath);
    const args = { module: { dir: path.dirname(modulePath), id: modulePath } };
    return Deno.readTextFile(modulePath)
        .then(code => _hyperscript.evaluate(code, {}, args))
        .catch(e => console.error("Cannot execute file:", e));
}

_hyperscript.addFeature("import", function parseImport(parser) {
    if (!parser.matchToken("import")) return;
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
                try {
                    await Deno.stat(resolved + hsExt);
                    mod = await run(resolved + hsExt);
                } catch {
                    mod = await import(resolved);
                }
            }
            runtime.assignToNamespace(target, [], name, mod);
        }
    };
});

export default _hyperscript;

if (import.meta.main) run(Deno.args[0]);
