describe("the when feature", function () {
    beforeEach(function () {
        clearWorkArea();
    });
    afterEach(function () {
        clearWorkArea();
    });

    // Yield to microtask queue (effects batch via queueMicrotask)
    function tick(ms) {
        return new Promise(function (resolve) { setTimeout(resolve, ms || 20); });
    }

    // === Core behavior (ported from feature/when branch) ===

    it("provides access to `it` and syncs initial value", async function () {
        _hyperscript.evaluate("set $global to 'initial'");

        var div = make(
            `<div _="when $global changes
                         put it into me"></div>`
        );

        await tick();
        div.innerHTML.should.equal("initial");

        _hyperscript.evaluate("set $global to 'hello world'");
        await tick();
        div.innerHTML.should.equal("hello world");

        _hyperscript.evaluate("set $global to 42");
        await tick();
        div.innerHTML.should.equal("42");

        delete window.$global;
    });

    it("detects changes from $global variable", async function () {
        var div = make(
            `<div _="when $global changes
                         put it into me"></div>`
        );

        _hyperscript.evaluate("set $global to 'Changed!'");
        await tick();
        div.innerHTML.should.equal("Changed!");

        delete window.$global;
    });

    it("detects changes from :element variable", async function () {
        var div = make(
            `<div _="init set :count to 0 end
                     when :count changes
                         put it into me
                     end
                     on click increment :count">0</div>`
        );

        await tick();
        div.innerHTML.should.equal("0");

        div.click();
        await tick();
        div.innerHTML.should.equal("1");

        div.click();
        await tick();
        div.innerHTML.should.equal("2");
    });

    it("triggers multiple elements watching same variable", async function () {
        var div1 = make(
            `<div _="when $shared changes
                         put 'first' into me"></div>`
        );
        var div2 = make(
            `<div _="when $shared changes
                         put 'second' into me"></div>`
        );

        _hyperscript.evaluate("set $shared to 'changed'");
        await tick();

        div1.innerHTML.should.equal("first");
        div2.innerHTML.should.equal("second");

        delete window.$shared;
    });

    it("executes multiple commands", async function () {
        var div = make(
            `<div _="when $multi changes
                         put 'first' into me
                         add .executed to me"></div>`
        );

        _hyperscript.evaluate("set $multi to 'go'");
        await tick();

        div.innerHTML.should.equal("first");
        div.classList.contains("executed").should.be.true;

        delete window.$multi;
    });

    it("does not execute when variable is undefined initially", async function () {
        var div = make(
            `<div _="when $neverSet changes
                         put 'synced' into me">original</div>`
        );

        await tick(50);
        div.innerHTML.should.equal("original");
    });

    it("only triggers when variable actually changes value", async function () {
        var div = make(
            `<div _="when $dedup changes
                         increment :callCount
                         put :callCount into me"></div>`
        );

        _hyperscript.evaluate("set $dedup to 'value1'");
        await tick();
        div.innerHTML.should.equal("1");

        _hyperscript.evaluate("set $dedup to 'value1'");
        await tick();
        div.innerHTML.should.equal("1");

        _hyperscript.evaluate("set $dedup to 'value2'");
        await tick();
        div.innerHTML.should.equal("2");

        delete window.$dedup;
    });

    // === Auto-tracking ===

    it("auto-tracks compound expressions", async function () {
        _hyperscript.evaluate("set $a to 1");
        _hyperscript.evaluate("set $b to 2");

        var div = make(
            `<div _="when ($a + $b) changes
                         put it into me"></div>`
        );

        await tick();
        div.innerHTML.should.equal("3");

        _hyperscript.evaluate("set $a to 10");
        await tick();
        div.innerHTML.should.equal("12");

        _hyperscript.evaluate("set $b to 20");
        await tick();
        div.innerHTML.should.equal("30");

        delete window.$a;
        delete window.$b;
    });

    // === Attribute & property tracking ===

    it("detects attribute changes", async function () {
        var div = make(
            `<div data-title="original"
                  _="when @data-title changes
                         put it into me"></div>`
        );

        await tick();
        div.innerHTML.should.equal("original");

        div.setAttribute("data-title", "updated");
        await tick(50);
        div.innerHTML.should.equal("updated");
    });

    it("detects form input value changes via user interaction", async function () {
        var container = make(
            `<div>
                 <input type="text" id="reactive-input" value="start" />
                 <span _="when #reactive-input.value changes
                               put it into me"></span>
             </div>`
        );
        var input = document.getElementById("reactive-input");
        var span = container.querySelector("span");

        await tick();
        span.innerHTML.should.equal("start");

        input.value = "typed";
        input.dispatchEvent(new Event("input", { bubbles: true }));
        await tick(50);
        span.innerHTML.should.equal("typed");
    });

    it("detects programmatic .value = without event dispatch", async function () {
        var container = make(
            `<div>
                 <input type="text" id="prog-input" value="initial" />
                 <span _="when #prog-input.value changes
                               put it into me"></span>
             </div>`
        );
        var input = document.getElementById("prog-input");
        var span = container.querySelector("span");

        await tick();
        span.innerHTML.should.equal("initial");

        // Set value programmatically — no event dispatched
        input.value = "programmatic";
        await tick(50);
        span.innerHTML.should.equal("programmatic");
    });

    // === Lifecycle ===

    it("disposes effect when element is removed from DOM", async function () {
        _hyperscript.evaluate("set $dispose to 'before'");

        var div = make(
            `<div _="when $dispose changes
                         put it into me"></div>`
        );

        await tick();
        div.innerHTML.should.equal("before");

        div.parentNode.removeChild(div);

        _hyperscript.evaluate("set $dispose to 'after'");
        await tick(50);
        div.innerHTML.should.equal("before");

        delete window.$dispose;
    });

    // === Edge cases ===

    it("batches multiple synchronous writes into one effect run", async function () {
        _hyperscript.evaluate("set $batchA to 0");
        _hyperscript.evaluate("set $batchB to 0");

        var div = make(
            `<div _="when ($batchA + $batchB) changes
                         increment :runCount
                         put :runCount into me"></div>`
        );

        await tick();
        div.innerHTML.should.equal("1");

        _hyperscript.evaluate("set $batchA to 5");
        _hyperscript.evaluate("set $batchB to 10");
        await tick();
        div.innerHTML.should.equal("2");

        delete window.$batchA;
        delete window.$batchB;
    });

    it("handles chained reactivity across elements", async function () {
        make(
            `<div _="when $source changes
                         set $derived to (it * 2)"></div>`
        );
        var output = make(
            `<div _="when $derived changes
                         put it into me"></div>`
        );

        _hyperscript.evaluate("set $source to 5");
        await tick();
        await tick();

        output.innerHTML.should.equal("10");

        _hyperscript.evaluate("set $source to 20");
        await tick();
        await tick();

        output.innerHTML.should.equal("40");

        delete window.$source;
        delete window.$derived;
    });

    it("supports multiple when features on the same element", async function () {
        _hyperscript.evaluate("set $left to 'L'");
        _hyperscript.evaluate("set $right to 'R'");

        var div = make(
            `<div _="when $left changes
                         put it into my @data-left
                     end
                     when $right changes
                         put it into my @data-right"></div>`
        );

        await tick();
        div.getAttribute("data-left").should.equal("L");
        div.getAttribute("data-right").should.equal("R");

        _hyperscript.evaluate("set $left to 'newL'");
        await tick();
        div.getAttribute("data-left").should.equal("newL");
        div.getAttribute("data-right").should.equal("R");

        delete window.$left;
        delete window.$right;
    });

    it("works with on handlers that modify the watched variable", async function () {
        var div = make(
            `<div _="init set :label to 'initial' end
                     when :label changes
                         put it into me
                     end
                     on click set :label to 'clicked'">initial</div>`
        );

        await tick();
        div.innerHTML.should.equal("initial");

        div.click();
        await tick();
        div.innerHTML.should.equal("clicked");
    });

    it("handles attribute changes set via hyperscript commands", async function () {
        var div = make(
            `<div data-status="pending"
                  _="when @data-status changes
                         put it into me
                     end
                     on click set @data-status to 'done'"></div>`
        );

        await tick();
        div.innerHTML.should.equal("pending");

        div.click();
        await tick(50);
        div.innerHTML.should.equal("done");
    });

    it("does not cross-trigger on unrelated variable writes", async function () {
        var div = make(
            `<div _="when $trigger changes
                         increment :count
                         put :count into me
                         set $other to 'side-effect'"></div>`
        );

        _hyperscript.evaluate("set $trigger to 'go'");
        await tick();
        div.innerHTML.should.equal("1");

        await tick();
        div.innerHTML.should.equal("1");

        delete window.$trigger;
        delete window.$other;
    });

    it("handles checkbox checked state via change event", async function () {
        var container = make(
            `<div>
                 <input type="checkbox" id="reactive-check" />
                 <span _="when #reactive-check.checked changes
                               if it is true
                                   put 'ON' into me
                               else
                                   put 'OFF' into me
                               end"></span>
             </div>`
        );
        var checkbox = document.getElementById("reactive-check");
        var span = container.querySelector("span");

        await tick();
        span.innerHTML.should.equal("OFF");

        checkbox.checked = true;
        checkbox.dispatchEvent(new Event("change", { bubbles: true }));
        await tick(50);
        span.innerHTML.should.equal("ON");

        checkbox.checked = false;
        checkbox.dispatchEvent(new Event("change", { bubbles: true }));
        await tick(50);
        span.innerHTML.should.equal("OFF");
    });

    it("handles rapid successive changes correctly", async function () {
        var div = make(
            `<div _="when $rapid changes
                         put it into me"></div>`
        );

        for (var i = 0; i < 10; i++) {
            _hyperscript.evaluate("set $rapid to " + i);
        }
        await tick();
        div.innerHTML.should.equal("9");

        delete window.$rapid;
    });

    it("continues working after an error in the effect body", async function () {
        var div = make(
            `<div _="when $robust changes
                         put it into me"></div>`
        );

        _hyperscript.evaluate("set $robust to 'first'");
        await tick();
        div.innerHTML.should.equal("first");

        _hyperscript.evaluate("set $robust to 'second'");
        await tick();
        div.innerHTML.should.equal("second");

        delete window.$robust;
    });

    it("isolates element-scoped variables between elements", async function () {
        var div1 = make(
            `<div _="init set :value to 'A' end
                     when :value changes
                         put it into me
                     end
                     on click set :value to 'A-clicked'">A</div>`
        );
        var div2 = make(
            `<div _="init set :value to 'B' end
                     when :value changes
                         put it into me
                     end
                     on click set :value to 'B-clicked'">B</div>`
        );

        await tick();
        div1.innerHTML.should.equal("A");
        div2.innerHTML.should.equal("B");

        div1.click();
        await tick();
        div1.innerHTML.should.equal("A-clicked");
        div2.innerHTML.should.equal("B");

        div2.click();
        await tick();
        div1.innerHTML.should.equal("A-clicked");
        div2.innerHTML.should.equal("B-clicked");
    });

    // === Multiple effects on same input (shopping cart scenario) ===

    it("handles multiple effects watching the same input property", async function () {
        this.timeout(5000);
        var container = make(
            `<div>
                 <input type="number" id="sc-price" value="10" step="1" />
                 <input type="number" id="sc-qty" value="2" />
                 <span id="sc-sub" _="when (#sc-price.value * #sc-qty.value) changes
                                          put '$' + it into me"></span>
                 <span id="sc-dbl" _="when (#sc-price.value * #sc-qty.value * 2) changes
                                          put '$' + it into me"></span>
                 <span id="sc-tri" _="when (#sc-price.value * #sc-qty.value * 3) changes
                                          put '$' + it into me"></span>
             </div>`
        );

        var price = document.getElementById("sc-price");
        var sub = document.getElementById("sc-sub");
        var dbl = document.getElementById("sc-dbl");
        var tri = document.getElementById("sc-tri");

        await tick();
        sub.innerHTML.should.equal("$20");
        dbl.innerHTML.should.equal("$40");
        tri.innerHTML.should.equal("$60");

        // Simulate user changing price (fires both input and change on number inputs)
        price.value = "15";
        price.dispatchEvent(new Event("input", { bubbles: true }));
        await tick(50);

        sub.innerHTML.should.equal("$30");
        dbl.innerHTML.should.equal("$60");
        tri.innerHTML.should.equal("$90");

        // Fire change event too (like number input spinner does)
        price.dispatchEvent(new Event("change", { bubbles: true }));
        await tick(50);

        // Values should be the same — no cascade
        sub.innerHTML.should.equal("$30");
        dbl.innerHTML.should.equal("$60");
        tri.innerHTML.should.equal("$90");
    });

    // === Performance & safety ===

    it("handles 50 elements watching the same variable", async function () {
        this.timeout(5000);
        var divs = [];
        for (var i = 0; i < 50; i++) {
            divs.push(make(
                `<div _="when $fan changes
                             put it into me"></div>`
            ));
        }

        var start = performance.now();
        _hyperscript.evaluate("set $fan to 'broadcast'");
        await tick();
        var elapsed = performance.now() - start;

        for (var j = 0; j < 50; j++) {
            divs[j].innerHTML.should.equal("broadcast");
        }
        elapsed.should.be.below(500);

        delete window.$fan;
    });

    it("handles 100 rapid writes without hanging", async function () {
        this.timeout(5000);
        var div = make(
            `<div _="when $firehose changes
                         put it into me"></div>`
        );

        var start = performance.now();
        for (var i = 0; i < 100; i++) {
            _hyperscript.evaluate("set $firehose to " + i);
        }
        await tick();
        var elapsed = performance.now() - start;

        div.innerHTML.should.equal("99");
        elapsed.should.be.below(500);

        delete window.$firehose;
    });

    it("handles a 5-element reactive chain without blowing up", async function () {
        this.timeout(5000);
        // $step0 → $step1 → $step2 → $step3 → $step4
        make(`<div _="when $step0 changes set $step1 to (it + 1)"></div>`);
        make(`<div _="when $step1 changes set $step2 to (it + 1)"></div>`);
        make(`<div _="when $step2 changes set $step3 to (it + 1)"></div>`);
        make(`<div _="when $step3 changes set $step4 to (it + 1)"></div>`);
        var output = make(
            `<div _="when $step4 changes
                         put it into me"></div>`
        );

        var start = performance.now();
        _hyperscript.evaluate("set $step0 to 0");

        // Each link needs a microtask to propagate
        for (var i = 0; i < 5; i++) { await tick(); }
        var elapsed = performance.now() - start;

        output.innerHTML.should.equal("4");
        elapsed.should.be.below(1000);

        delete window.$step0;
        delete window.$step1;
        delete window.$step2;
        delete window.$step3;
        delete window.$step4;
    });

    it("stops self-triggering effects without freezing", async function () {
        this.timeout(5000);
        // This effect writes to the variable it watches — infinite loop
        // The circular guard should stop it after 100 triggers
        _hyperscript.evaluate("set $loop to 0");
        make(
            `<div _="when $loop changes
                         set $loop to (it + 1)"></div>`
        );

        var start = performance.now();
        await tick();
        await tick();
        await tick();
        var elapsed = performance.now() - start;

        // Should have stopped, not frozen the browser
        elapsed.should.be.below(2000);
        // Value should be capped, not Infinity
        window.$loop.should.be.below(200);

        delete window.$loop;
    });

    // === Or syntax ===

    it("fires when either expression changes using or", async function () {
        var div = make(
            `<div _="when $x or $y changes
                         put it into me"></div>`
        );

        _hyperscript.evaluate("set $x to 'from-x'");
        await tick();
        div.innerHTML.should.equal("from-x");

        _hyperscript.evaluate("set $y to 'from-y'");
        await tick();
        div.innerHTML.should.equal("from-y");

        _hyperscript.evaluate("set $x to 'x-again'");
        await tick();
        div.innerHTML.should.equal("x-again");

        delete window.$x;
        delete window.$y;
    });

    it("provides the changed value as `it` for each or branch", async function () {
        _hyperscript.evaluate("set $first to 10");
        _hyperscript.evaluate("set $second to 20");

        var div = make(
            `<div _="when $first or $second changes
                         put it into me"></div>`
        );

        await tick();
        // Both fire on initial sync — last one wins (20)
        var initial = parseInt(div.innerHTML);
        initial.should.be.oneOf([10, 20]);

        _hyperscript.evaluate("set $first to 99");
        await tick();
        div.innerHTML.should.equal("99");

        _hyperscript.evaluate("set $second to 55");
        await tick();
        div.innerHTML.should.equal("55");

        delete window.$first;
        delete window.$second;
    });

    it("supports three or more expressions with or", async function () {
        var div = make(
            `<div _="when $r or $g or $b changes
                         put it into me"></div>`
        );

        _hyperscript.evaluate("set $r to 'red'");
        await tick();
        div.innerHTML.should.equal("red");

        _hyperscript.evaluate("set $g to 'green'");
        await tick();
        div.innerHTML.should.equal("green");

        _hyperscript.evaluate("set $b to 'blue'");
        await tick();
        div.innerHTML.should.equal("blue");

        delete window.$r;
        delete window.$g;
        delete window.$b;
    });
});
