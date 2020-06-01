/* Test Utilities */

function byId(id) {
    return document.getElementById(id);
}

function make(htmlStr) {
    var makeFn = function(){
        var  range = document.createRange();
        var  fragment = range.createContextualFragment(htmlStr);
        var  wa = getWorkArea();
        for (var  i = fragment.childNodes.length - 1; i >= 0; i--) {
            var child = fragment.childNodes[i];
            _hyperscript.init(child);
            wa.appendChild(child);
        }
        return wa.lastChild;
    }
    if (getWorkArea()) {
        return makeFn();
    } else {
        ready(makeFn);
    }
}

function ready(fn) {
    if (document.readyState !== 'loading') {
        fn();
    } else {
        document.addEventListener('DOMContentLoaded', fn);
    }
}

function getWorkArea() {
    return byId("work-area");
}

function clearWorkArea() {
    getWorkArea().innerHTML = "";
}

function parseAndEval(type, src, ctx) {
    ctx = ctx || {}
    return _hyperscript.parser.parseExpression(type, _hyperscript.lexer.tokenize(src ) ).evaluate(ctx)
}

function parseAndTranspileCommand(type, src, ctx) {
    ctx = ctx || {}
    var transpile = _hyperscript.parser.parseCommand(_hyperscript.lexer.tokenize(src)).transpile();
    var evalString = "(function(" + Object.keys(ctx).join(",") + "){return " + transpile + "})";
    console.log("transpile: " + transpile);
    console.log("evalString: " + evalString);
    var args = Object.keys(ctx).map(function (key) {
        return ctx[key]
    });
    console.log("args", args);
    return eval(evalString).apply(null, args);
}

function parseAndTranspile(type, src, ctx) {
    ctx = ctx || {}
    var transpile = _hyperscript.parser.parseExpression(type, _hyperscript.lexer.tokenize(src) ).transpile();
    var evalString = "(function(" + Object.keys(ctx).join(",") + "){return " + transpile + "})";
    console.log("transpile: " + transpile);
    console.log("evalString: " + evalString);
    var args = Object.keys(ctx).map(function (key) {
        return ctx[key]
    });
    console.log("args", args);
    return eval(evalString).apply(null, args);
}