(function () {
    if (globalThis._hyperscript) {
        // hyperscript already loaded - register directly
        registerCommands(globalThis._hyperscript);
        return;
    }

    // Intercept _hyperscript being set on window so we can register
    // custom commands before browserInit() processes the DOM.

    // Not yet loaded - intercept assignment
    Object.defineProperty(globalThis, "_hyperscript", {
        configurable: true,
        enumerable: true,

        get: function () {
            return undefined;
        },

        set: function (hs) {
            // Remove the interceptor and assign normally
            delete globalThis._hyperscript;
            globalThis._hyperscript = hs;

            // Register debugger commands before DOM processing
            registerCommands(hs);
        },
    });

    function registerCommands(_hs) {
        _hs.addCommand("breakpoint", function (parser) {
            if (!parser.matchToken("breakpoint")) return;

            return {
                type: "breakpointCommand",
                execute: function (ctx) {
                    ctx.meta.command = this;
                    return ctx.meta.runtime.unifiedExec(this, ctx);
                },
                resolve: function (ctx) {
                    globalThis._hyperscript.hdb = HDB(ctx, ctx.meta.runtime, this, _hs);

                    if (!_hs.debuggerOpen) {
                        return ctx.meta.runtime.findNext(this, ctx);
                    }

                    try {
                        return globalThis._hyperscript.hdb.break(ctx);
                    } catch (e) {
                        console.error(e, e.stack);
                    }
                },
            };
        });
    }

    function escapeHTML(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function truncate(str, len) {
        if (str.length <= len) return str;
        return str.slice(0, len) + "…";
    }

    let hdbCounter = 0;

    function HDB(ctx, runtime, breakpoint, _hyperscript) {
        let cmd = breakpoint;
        let cmdMap = [];
        const bus = new EventTarget();
        let renderedCode = "";

        const consoleHistory = [];
        let renderedConsole = "";

        const brk = function (_ctx) {
            console.log("=== HDB///_hyperscript/debugger ===");

            // Print initial context at startup
            for (const v of Object.keys(ctx)) {
                if (v == "meta") continue;
                consoleHistory.push(v);
                renderedConsole += makeConsoleHistoryEntry(v, ctx[v]);
            }

            hdbCounter++;

            ui();
            return new Promise((resolve, reject) => {
                bus.addEventListener(
                    "continue",
                    () => {
                        resolve(runtime.findNext(cmd, ctx));
                        cmd = null;
                    },
                    { once: true },
                );
            });
        };

        const continueExec = function () {
            bus.dispatchEvent(new Event("continue"));
            ui();
        };

        const stepOver = function () {
            if (!cmd) return continueExec();
            const result =
                cmd && cmd.type === "breakpointCommand"
                    ? runtime.findNext(cmd, ctx)
                    : runtime.unifiedEval(cmd, ctx);
            if (result.type === "implicitReturn") return stepOut();
            if (result && result.then instanceof Function) {
                return result.then((next) => {
                    cmd = next;
                    bus.dispatchEvent(new Event("step"));
                    logCommand();
                });
            } else if (result === runtime.HALT) {
                bus.dispatchEvent(new Event("continue"));
            } else {
                cmd = result;
                bus.dispatchEvent(new Event("step"));
                logCommand();
            }
            ui();
        };

        const stepOut = function () {
            if (!ctx.meta.caller) return continueExec();
            const callingCmd = ctx.meta.callingCommand;
            const oldMe = ctx.me;
            ctx = ctx.meta.caller;
            console.log(
                "[hdb] stepping out into " + ctx.meta.feature.displayName,
            );
            if (ctx.me instanceof Element && ctx.me !== oldMe) {
                console.log("[hdb] me: ", ctx.me);
            }
            cmd = runtime.findNext(callingCmd, ctx);
            cmd = runtime.findNext(cmd, ctx);
            logCommand();
            bus.dispatchEvent(new Event("step"));
            ui();
        };

        const skipTo = function (toCmdIndex) {
            const toCmd = cmdMap[toCmdIndex];
            cmd = toCmd.cmd;
            bus.dispatchEvent(new Event("skip"));
            ui();
        };

        const rewrite = function (command, newCode) {
            const parent = command.cmd.parent;
            let prev;
            for (prev of parent.children) {
                if (prev.next === command.cmd) break;
            }
            const next = command.next;

            const tok = _hyperscript.internals.tokenizer.tokenize(newCode);
            const parser = _hyperscript.internals.createParser(tok);
            const newcmd = parser.requireElement("command");

            newcmd.startToken = command.startToken;
            newcmd.endToken = command.endToken;
            newcmd.programSource = command.programSource;
            newcmd.sourceFor = function () {
                return newCode;
            };

            prev.next = newcmd;
            newcmd.next = next;
            newcmd.parent = parent;

            bus.dispatchEvent(new Event("step"));
        };

        const logCommand = function () {
            const hasSource = cmd.sourceFor instanceof Function;
            const cmdSource = hasSource ? cmd.sourceFor() : "-- " + cmd.type;
            console.log("[hdb] current command: " + cmdSource);
        };

        const ui = function () {
            renderedCode = renderCode();
            hdbCounter++;
        };

        const renderCode = function () {
            if (!cmd || !cmd.programSource) {
                return "";
            }
            cmdMap = [];
            const src = cmd.programSource;

            // Find feature
            let feat = cmd;
            while (feat.parent && !feat.isFeature) feat = feat.parent;

            // Traverse, finding starts
            const all = traverse(feat);
            for (let j = 0; j < all.length; j++) {
                const c = all[j];
                if (!c.startToken) continue;
                cmdMap.push({
                    index: c.startToken.start,
                    widget: makeCommandWidget(cmdMap.length),
                    cmd: c,
                });
            }

            let rv = src.slice(0, cmdMap[0].index);
            for (let i = 0; i < cmdMap.length; i++) {
                const obj = cmdMap[i];
                const end = cmdMap[i + 1] ? cmdMap[i + 1].index : undefined;
                if (obj.cmd === cmd) {
                    rv +=
                        obj.widget +
                        '<u class="current">' +
                        escapeHTML(src.slice(obj.index, end)) +
                        "</u>";
                } else {
                    rv += obj.widget + escapeHTML(src.slice(obj.index, end));
                }
            }
            return rv;
        };

        const traverse = function (ge) {
            const rv = [];

            (function recurse(ge) {
                rv.push(ge);
                if ("children" in ge)
                    for (const child of ge.children) recurse(child);
            })(ge);

            return rv;
        };

        const makeCommandWidget = function (i) {
            let html =
                '<span data-cmd="' +
                i +
                '"><button class="skip" data-cmd="' +
                i +
                '">&rdca;</button></span>';
            return html;
        };

        const makeConsoleHistoryEntry = function (input, output) {
            if (!output) {
                const result = _hyperscript.parse(input);
                output = result.execute
                    ? result.execute(ctx)
                    : result.evaluate(ctx);
            }

            return '<li class="console-entry">' +
                '<kbd><code class="input">' + escapeHTML(input) + '</code></kbd>' +
                '<samp class="output">' + prettyPrint(output) + '</samp>' +
                '</li>';
        };

        const evaluateExpression = function (input) {
            consoleHistory.push(input);
            const node = makeConsoleHistoryEntry(input);
            renderedConsole += node;
            hdbCounter++;
        };

        const prettyPrint = function (obj) {
            if (obj == null) return "null";

            let result;

            if (Element.prototype.isPrototypeOf(obj)) {
                result =
                    '&lt;<span class="token tagname">' +
                    obj.tagName.toLowerCase() +
                    "</span>";
                for (const attr of Array.from(obj.attributes)) {
                    if (attr.specified)
                        result +=
                            ' <span class="token attr">' +
                            attr.nodeName +
                            '</span>=<span class="token string">"' +
                            truncate(attr.textContent, 10) +
                            '"</span>';
                }
                result += ">";
                return result;
            } else if (obj.call) {
                if (obj.hyperfunc) result = "def " + obj.hypername + " ...";
                else result = "function " + obj.name + "(...) {...}";
            } else if (obj.toString) {
                result = obj.toString();
            }

            return escapeHTML((result || "undefined").trim());
        };

        const getCounter = function () {
            return hdbCounter;
        };

        const getRenderedCode = function () {
            return renderedCode;
        };

        const getRenderedConsole = function () {
            return renderedConsole;
        };

        return {
            break: brk,
            continueExec,
            stepOver,
            skipTo,
            evaluateExpression,
            getCounter,
            getRenderedCode,
            getRenderedConsole,
        };
    }
})();
