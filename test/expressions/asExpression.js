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

    it("converts an input element into a Value", function() {
        var node = document.createElement("input")
        node.name = "test-name"
        node.value = "test-value"

        var result = evalHyperScript("x as Values", {x:node})
        result.should.equal("test-value")
    })

    it("converts an form element into a Value", function() {
        var node = document.createElement("form")
        node.innerHTML = `
            <input name="firstName" value="John"><br>
            <input name="lastName" value="Connor"><br>
            <div>
                <input name="areaCode" value="213">
                <input name="phone" value="555-1212">
            </div>`

        var result = evalHyperScript("x as Values", {x:node})
        result.firstName.should.equal("John")
        result.lastName.should.equal("Connor")
        result.areaCode.should.equal("213")
        result.phone.should.equal("555-1212")
    })

    it("converts radio buttons into a Value correctly", function() {
        var node = document.createElement("form")
        node.innerHTML = `
            <div>
                <input type="radio" name="gender" value="Male" checked>
                <input type="radio" name="gender" value="Female" >
                <input type="radio" name="gender" value="Other">
            </div>`

        var result = evalHyperScript("x as Values", {x:node})
        result.gender.should.equal("Male")
    })

    it("converts checkboxes into a Value correctly", function() {
        var node = document.createElement("form")
        node.innerHTML = `
            <div>
                <input type="checkbox" name="gender" value="Male" checked>
                <input type="checkbox" name="gender" value="Female" checked>
                <input type="checkbox" name="gender" value="Other" checked>
            </div>`

        var result = evalHyperScript("x as Values", {x:node})
        result.gender[0].should.equal("Male")
        result.gender[1].should.equal("Female")
        result.gender[2].should.equal("Other")
    })

    it("converts multiple selects into a Value correctly", function() {
        var node = document.createElement("form")
        node.innerHTML = `
            <select name="animal" multiple>
                <option value="dog" selected>Doggo</option>
                <option value="cat">Kitteh</option>
                <option value="raccoon" selected>Trash Panda</option>
                <option value="possum">Sleepy Boi</option>
            </div>`

        var result = evalHyperScript("x as Values", {x:node})
        result.animal[0].should.equal("dog")
        result.animal[1].should.equal("raccoon")
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

