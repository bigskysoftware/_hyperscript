describe("the bind feature", function () {
    beforeEach(function () {
        clearWorkArea();
    });
    afterEach(function () {
        clearWorkArea();
    });

    function tick(ms) {
        return new Promise(function (resolve) { setTimeout(resolve, ms || 20); });
    }

    // === One-way binding (bind X to Y) ===

    it("bind X to Y is sugar for when Y changes set X to it", async function () {
        _hyperscript.evaluate("set $firstName to 'John'");
        _hyperscript.evaluate("set $lastName to 'Doe'");

        var div = make(
            `<div _="bind :fullName to ($firstName + ' ' + $lastName)
                     when :fullName changes
                         put it into me"></div>`
        );

        await tick();
        div.innerHTML.should.equal("John Doe");

        _hyperscript.evaluate("set $firstName to 'Jane'");
        await tick();
        div.innerHTML.should.equal("Jane Doe");

        delete window.$firstName;
        delete window.$lastName;
    });

    it("bind variable to attribute", async function () {
        var div = make(
            `<div data-color="red"
                  _="bind $color to @data-color
                     when $color changes
                         put it into me"></div>`
        );

        await tick();
        div.innerHTML.should.equal("red");

        div.setAttribute("data-color", "blue");
        await tick(50);
        div.innerHTML.should.equal("blue");

        delete window.$color;
    });

    it("bind attribute to variable", async function () {
        _hyperscript.evaluate("set $title to 'hello'");

        var div = make(
            `<div _="bind @data-title to $title"></div>`
        );

        await tick();
        div.getAttribute("data-title").should.equal("hello");

        _hyperscript.evaluate("set $title to 'updated'");
        await tick();
        div.getAttribute("data-title").should.equal("updated");

        delete window.$title;
    });

    // === Two-way binding (bind X and Y) ===

    it("bind variable and input value (two-way)", async function () {
        var container = make(
            `<div>
                 <input type="text" id="bind-input" value="initial" />
                 <span id="bind-output"
                       _="bind $username and #bind-input.value
                          when $username changes
                              put it into me"></span>
             </div>`
        );
        var input = document.getElementById("bind-input");
        var span = document.getElementById("bind-output");

        await tick();
        // Initial sync: input value → $username → span
        span.innerHTML.should.equal("initial");

        // User types in input → $username updates → span updates
        input.value = "typed";
        input.dispatchEvent(new Event("input", { bubbles: true }));
        await tick(50);
        span.innerHTML.should.equal("typed");

        // Programmatic variable change → input updates
        _hyperscript.evaluate("set $username to 'programmatic'");
        await tick();
        input.value.should.equal("programmatic");

        delete window.$username;
    });

    it("bind variable and attribute (two-way)", async function () {
        _hyperscript.evaluate("set $theme to 'light'");

        var div = make(
            `<div _="bind $theme and @data-theme"></div>`
        );

        await tick();
        div.getAttribute("data-theme").should.equal("light");

        _hyperscript.evaluate("set $theme to 'dark'");
        await tick();
        div.getAttribute("data-theme").should.equal("dark");

        div.setAttribute("data-theme", "auto");
        await tick(50);
        window.$theme.should.equal("auto");

        delete window.$theme;
    });

    it("bind checkbox checked state and variable (two-way)", async function () {
        var container = make(
            `<div>
                 <input type="checkbox" id="bind-check" />
                 <span _="bind $enabled and #bind-check.checked
                          when $enabled changes
                              if it is true
                                  put 'ON' into me
                              else
                                  put 'OFF' into me
                              end"></span>
             </div>`
        );
        var checkbox = document.getElementById("bind-check");
        var span = container.querySelector("span");

        await tick();
        span.innerHTML.should.equal("OFF");

        // User checks the box
        checkbox.checked = true;
        checkbox.dispatchEvent(new Event("change", { bubbles: true }));
        await tick(50);
        span.innerHTML.should.equal("ON");

        // Programmatic uncheck via variable
        _hyperscript.evaluate("set $enabled to false");
        await tick();
        checkbox.checked.should.be.false;
        span.innerHTML.should.equal("OFF");

        delete window.$enabled;
    });

    // === Edge cases ===

    it("bind does not infinite loop with two-way (dedup prevents it)", async function () {
        _hyperscript.evaluate("set $stable to 'start'");

        var div = make(
            `<div _="bind $stable and @data-val"></div>`
        );

        await tick();
        div.getAttribute("data-val").should.equal("start");

        _hyperscript.evaluate("set $stable to 'changed'");
        await tick(50);
        div.getAttribute("data-val").should.equal("changed");

        // Should not have infinite-looped — dedup catches it
        window.$stable.should.equal("changed");
    });

    it("multiple bind features on same element", async function () {
        _hyperscript.evaluate("set $x to 'X'");
        _hyperscript.evaluate("set $y to 'Y'");

        var div = make(
            `<div _="bind @data-x to $x
                     bind @data-y to $y"></div>`
        );

        await tick();
        div.getAttribute("data-x").should.equal("X");
        div.getAttribute("data-y").should.equal("Y");

        _hyperscript.evaluate("set $x to 'newX'");
        await tick();
        div.getAttribute("data-x").should.equal("newX");
        div.getAttribute("data-y").should.equal("Y");

        delete window.$x;
        delete window.$y;
    });

    it("bind my textContent to a computed expression", async function () {
        _hyperscript.evaluate("set $price to 10");
        _hyperscript.evaluate("set $qty to 3");

        var div = make(
            `<div _="bind my textContent to '$' + ($price * $qty)"></div>`
        );

        await tick();
        div.textContent.should.equal("$30");

        _hyperscript.evaluate("set $price to 25");
        await tick();
        div.textContent.should.equal("$75");

        _hyperscript.evaluate("set $qty to 2");
        await tick();
        div.textContent.should.equal("$50");

        delete window.$price;
        delete window.$qty;
    });
});
