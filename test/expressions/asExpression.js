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

