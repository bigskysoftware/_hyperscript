describe("as operator", function() {

    it("converts null as null", function () {
        var result = evalHyperScript("null as String")
        should.equal(result, null);
    })

    it("converts value as String", function () {
        var result = evalHyperScript("10 as String")
        result.should.equal("10");
        var result = evalHyperScript("true as String")
        result.should.equal("true");
    })

    it("converts value as Int", function () {
        var result = evalHyperScript("'10' as Int")
        result.should.equal(10);

        var result = evalHyperScript("'10.4' as Int")
        result.should.equal(10);
    })

    it("converts value as Float", function () {
        var result = evalHyperScript("'10' as Float")
        result.should.equal(10);

        var result = evalHyperScript("'10.4' as Float")
        result.should.equal(10.4);
    })

    it("converts value as Number", function () {
        var result = evalHyperScript("'10' as Number")
        result.should.equal(10);

        var result = evalHyperScript("'10.4' as Number")
        result.should.equal(10.4);
    })

    it("converts value as Date", function () {
        var result = evalHyperScript("1 as Date")
        result.should.equal(Date(1));
    })

    it("converts value as JSON", function () {
        var result = evalHyperScript("{foo:'bar'} as JSON")
        result.should.equal('{"foo":"bar"}');
    })

    it("converts string as Object", function () {
        var result = evalHyperScript("'{\"foo\":\"bar\"}' as Object")
        result['foo'].should.equal('bar');
    })

    it("converts value as Object", function () {
        var result = evalHyperScript("x as Object", {x:{foo:"bar"}})
        result["foo"].should.equal('bar');
    })

    it("converts an input element into Values", function() {
        var node = document.createElement("input")
        node.name = "test-name"
        node.value = "test-value"

        var result = evalHyperScript("x as Values", {x:node})
        result['test-name'].should.equal("test-value")
    })

    it("converts a form element into Values", function() {
        var node = document.createElement("form");
        node.innerHTML = `
            <input name="firstName" value="John"><br>
            <input name="lastName" value="Connor"><br>
            <div>
                <input name="areaCode" value="213">
                <input name="phone" value="555-1212">
            </div>`;

        var result = evalHyperScript("x as Values", {x:node});
        result.firstName.should.equal("John");
        result.lastName.should.equal("Connor");
        result.areaCode.should.equal("213");
        result.phone.should.equal("555-1212");
    });

    it("converts a query selector into Values", function() {
        var d1 = make(`<div _="on click put <input.include/> as Values into my.customData"></div>`)

        d1.innerHTML = `
            <input class="include" name="firstName" value="John"><br>
            <input class="include" name="lastName" value="Connor"><br>
            <input class="include" name="areaCode" value="213">
            <input class="dont-include" name="phone" value="555-1212">
        `;

        d1.click();

        d1.customData.firstName.should.equal("John");
        d1.customData.lastName.should.equal("Connor");
        d1.customData.areaCode.should.equal("213");
        should.not.exist(d1.customData.phone);
    });

    it("converts radio buttons into a Value correctly", function() {
        var node = document.createElement("form");
        node.innerHTML = `
            <div>
                <input type="radio" name="gender" value="Male" checked>
                <input type="radio" name="gender" value="Female" >
                <input type="radio" name="gender" value="Other">
            </div>`;

        var result = evalHyperScript("x as Values", {x:node});
        result.gender.should.equal("Male");
    });

    it("converts checkboxes into a Value correctly", function() {
        var node = document.createElement("form");
        node.innerHTML = `
            <div>
                <input type="checkbox" name="gender" value="Male" checked>
                <input type="checkbox" name="gender" value="Female" checked>
                <input type="checkbox" name="gender" value="Other" checked>
            </div>`;

        var result = evalHyperScript("x as Values", {x:node})
        result.gender[0].should.equal("Male");
        result.gender[1].should.equal("Female");
        result.gender[2].should.equal("Other");
    });

    it("converts multiple selects into a Value correctly", function() {
        var node = document.createElement("form");
        node.innerHTML = `
            <select name="animal" multiple>
                <option value="dog" selected>Doggo</option>
                <option value="cat">Kitteh</option>
                <option value="raccoon" selected>Trash Panda</option>
                <option value="possum">Sleepy Boi</option>
            </div>`;

        var result = evalHyperScript("x as Values", {x:node});
        result.animal[0].should.equal("dog");
        result.animal[1].should.equal("raccoon");
    });

    it("converts a complete form into Values", function() {
        var node = document.createElement("form");
        node.innerHTML = `
        <div><span><b>
            Catches elements nested deeply within the DOM tree
            <input name="firstName" value="John"><br>
            <input name="lastName" value="Connor"><br>
            <input name="phone" value="555-1212">
        </b></span></div>

        Works with Textareas
        <textarea name="aboutMe">It began on a warm summer day in 1969...</textarea>

        Works with Single Select Boxes
        <select name="animal">
            <option value="dog" selected>Doggo</option>
            <option value="cat">Kitteh</option>
            <option value="raccoon">Trash Panda</option>
            <option value="possum">Sleepy Boi</option>
        </select>

        Works with Multi-Select Boxes
        <select name="spiritAnimal" multiple>
            <option value="dog" selected>Doggo</option>
            <option value="cat">Kitteh</option>
            <option value="raccoon" selected>Trash Panda</option>
            <option value="possum">Sleepy Boi</option>
        </select>

        Works with Radio Buttons
        <input type="radio" name="coolOrNaw" value="Cool" checked>
        <input type="radio" name="coolOrNaw" value="Naw Bruh">        

        Works with Checkboxes
        <input type="checkbox" name="gender" value="Male" checked>
        <input type="checkbox" name="gender" value="Female" checked>
        <input type="checkbox" name="gender" value="Other" checked>
        `;

        var result = evalHyperScript("x as Values", {x:node});
        result.firstName.should.equal("John");
        result.lastName.should.equal("Connor");
        result.phone.should.equal("555-1212");
        result.aboutMe.should.equal("It began on a warm summer day in 1969...");
        result.animal.should.equal("dog");
        result.spiritAnimal[0].should.equal("dog");
        result.spiritAnimal[1].should.equal("raccoon");
        result.coolOrNaw.should.equal("Cool");
        result.gender[0].should.equal("Male");
        result.gender[1].should.equal("Female");
        result.gender[2].should.equal("Other");
    });

    it("converts an element into HTML", function () {
        var d1 = document.createElement("div");
        d1.id = "myDiv";
        d1.innerText = "With Text";

        var result = evalHyperScript("d as HTML", {d: d1});
        result.should.equal(`<div id="myDiv">With Text</div>`);
    })

    it("converts a NodeList into HTML", function () {
        var fragment = document.createDocumentFragment()

        {
            var d = document.createElement("div");
            d.id = "first";
            d.innerText = "With Text";
            fragment.appendChild(d)
        }

        {
            var d = document.createElement("span");
            d.id = "second";
            fragment.appendChild(d)
        }

        {
            var d = document.createElement("i");
            d.id = "third";
            fragment.appendChild(d)
        }

        var result = evalHyperScript("nodeList as HTML", {nodeList: fragment.childNodes});
        result.should.equal(`<div id="first">With Text</div><span id="second"></span><i id="third"></i>`);
    })

    it("converts an array into HTML", function () {
        var d1 = ["this-", "is-", "html"]

        var result = evalHyperScript("d as HTML", {d: d1});
        result.should.equal(`this-is-html`);
    })

    it("converts numbers things 'HTML'", function () {
        var value = 123

        var result = evalHyperScript("value as HTML", {value: value});
        result.should.equal("123");
    })

    it("can accept custom comversions", function () {
        _hyperscript.config.conversions["Foo"] = function(val){
            return "foo" + val;
        };
        var result = evalHyperScript("1 as Foo")
        result.should.equal("foo1");
        delete _hyperscript.config.conversions.Foo
    })

    it("can accept custom dynamic comversions", function () {
        _hyperscript.config.conversions.dynamicResolvers.push(function(conversion, val){
            if (conversion.indexOf("Foo:") === 0) {
                var arg = conversion.split(":")[1];
                return arg + val;
            }
        });
        var result = evalHyperScript("1 as Foo:Bar")
        result.should.equal("Bar1");
        _hyperscript.config.conversions.dynamicResolvers = [];
    })

});

