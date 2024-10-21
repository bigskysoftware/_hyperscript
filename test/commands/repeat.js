describe("the repeat command", function () {
	beforeEach(function () {
		clearWorkArea();
	});
	afterEach(function () {
		clearWorkArea();
	});

	it("basic for loop works", function () {
		var d1 = make(
			"<div _='on click repeat for x in [1, 2, 3]" +
				"                                    put x at end of me" +
				"                                  end'></div>"
		);
		d1.click();
		d1.innerHTML.should.equal("123");
	});

	it("basic for loop with null works", function () {
		var d1 = make(
			"<div _='on click repeat for x in null" +
				"                                    put x at end of me" +
				"                                  end'></div>"
		);
		d1.click();
		d1.innerHTML.should.equal("");
	});

	it("waiting in for loop works", function (done) {
		var d1 = make(
			"<div _='on click repeat for x in [1, 2, 3]\n" +
				"                                    log me " +
				"                                    put x at end of me\n" +
				"                                    wait 1ms\n" +
				"                                  end'></div>"
		);
		d1.click();
		d1.innerHTML.should.equal("1");
		setTimeout(function () {
			d1.innerHTML.should.equal("123");
			done();
		}, 50);
	});

	it("basic raw for loop works", function () {
		var d1 = make(
			"<div _='on click for x in [1, 2, 3]" +
				"                                    put x at end of me" +
				"                                  end'></div>"
		);
		d1.click();
		d1.innerHTML.should.equal("123");
	});

	it("basic raw for loop works", function () {
		var d1 = make(
			"<div _='on click for x in null" +
				"                                    put x at end of me" +
				"                                  end'></div>"
		);
		d1.click();
		d1.innerHTML.should.equal("");
	});

	it("waiting in raw for loop works", function (done) {
		var d1 = make(
			"<div _='on click for x in [1, 2, 3]\n" +
				"                                    put x at end of me\n" +
				"                                    wait 1ms\n" +
				"                                  end'></div>"
		);
		d1.click();
		d1.innerHTML.should.equal("1");
		setTimeout(function () {
			d1.innerHTML.should.equal("123");
			done();
		}, 40);
	});

	it("repeat forever works", function () {
		make(
			"" +
				"<script type='text/hyperscript'>" +
				"  def repeatForeverWithReturn()" +
				"    set retVal to 0" +
				"    repeat forever" +
				"       set retVal to retVal + 1" +
				"       if retVal == 5 then" +
				"         return retVal" +
				"       end" +
				"    end" +
				"  end" +
				"</script>" +
				"<div id='d1' _='on click put repeatForeverWithReturn() into my.innerHTML'></div>"
		);
		var d1 = byId("d1");
		d1.click();
		d1.innerHTML.should.equal("5");
		delete window.repeatForeverWithReturn;
	});

	it("repeat forever works w/o keyword", function () {
		make(
			"" +
				"<script type='text/hyperscript'>" +
				"  def repeatForeverWithReturn()" +
				"    set retVal to 0" +
				"    repeat" +
				"       set retVal to retVal + 1" +
				"       if retVal == 5 then" +
				"         return retVal" +
				"       end" +
				"    end" +
				"  end" +
				"</script>" +
				"<div id='d1' _='on click put repeatForeverWithReturn() into my.innerHTML'></div>"
		);
		var d1 = byId("d1");
		d1.click();
		d1.innerHTML.should.equal("5");
		delete window.repeatForeverWithReturn;
	});

	it("basic in loop works", function () {
		var d1 = make(
			"<div _='on click repeat in [1, 2, 3]" +
				"                                    put it at end of me" +
				"                                  end'></div>"
		);
		d1.click();
		d1.innerHTML.should.equal("123");
	});

	it("index syntax works", function () {
		var d1 = make(
			'<div _=\'on click repeat for x in ["a", "ab", "abc"] index i' +
				"                                    put x + i at end of me" +
				"                                  end'></div>"
		);
		d1.click();
		d1.innerHTML.should.equal("a0ab1abc2");
	});

	it("indexed by syntax works", function () {
		var d1 = make(
			'<div _=\'on click repeat for x in ["a", "ab", "abc"] indexed by i' +
				"                                    put x + i at end of me" +
				"                                  end'></div>"
		);
		d1.click();
		d1.innerHTML.should.equal("a0ab1abc2");
	});

	it("while keyword works", function () {
		make(
			"" +
				"<script type='text/hyperscript'>" +
				"  def repeatWhileTest()" +
				"    set retVal to 0" +
				"    repeat while retVal < 5" +
				"       set retVal to retVal + 1" +
				"    end" +
				"    return retVal" +
				"  end" +
				"</script>" +
				"<div id='d1' _='on click put repeatWhileTest() into my.innerHTML'></div>"
		);
		var d1 = byId("d1");
		d1.click();
		d1.innerHTML.should.equal("5");
		delete window.repeatWhileTest;
	});

	it("until keyword works", function () {
		make(
			"" +
				"<script type='text/hyperscript'>" +
				"  def repeatUntilTest()" +
				"    set retVal to 0" +
				"    repeat until retVal == 5" +
				"       set retVal to retVal + 1" +
				"    end" +
				"    return retVal" +
				"  end" +
				"</script>" +
				"<div id='d1' _='on click put repeatUntilTest() into my.innerHTML'></div>"
		);
		var d1 = byId("d1");
		d1.click();
		d1.innerHTML.should.equal("5");
		delete window.repeatUntilTest;
	});

	it("until event keyword works", function (done) {
		var div = make("<div id='untilTest'></div>");
		make(
			"" +
				"<script type='text/hyperscript'>" +
				"  def repeatUntilTest()" +
				"    repeat until event click from #untilTest" +
				"      wait 2ms" +
				"    end" +
				"    return 42" +
				"  end" +
				"</script>" +
				""
		);
		var promise = repeatUntilTest();
		div.click();
		promise.then(function (value) {
			value.should.equal(42);
			delete window.repeatUntilTest;
			done();
		});
	});

	it("only executes the init expression once", function () {
		make(
			"" +
				"<script type='text/hyperscript'>" +
				"  def getArray()" +
				"    set window.called to (window.called or 0) + 1" +
				"    return [1, 2, 3]" +
				"  end" +
				"</script>" +
				"<div id='d1' _='on click for x in getArray() put x into my.innerHTML end'></div>"
		);
		var d1 = byId("d1");
		d1.click();
		d1.innerHTML.should.equal("3");
		window.called.should.equal(1);
		delete window.getArray;
		delete window.called;
	});

	it("can nest loops", function () {
		make(
			"" +
				"<script type='text/hyperscript'>" +
				"  def sprayInto(elt)" +
				"    for x in [1, 2, 3]" +
				"      for y in [1, 2, 3]" +
				"        put x * y at end of elt" +
				"      end" +
				"    end" +
				"  end" +
				"</script>" +
				"<div id='d1' _='on click call sprayInto(me)'></div>"
		);
		var d1 = byId("d1");
		d1.click();
		d1.innerHTML.should.equal("123246369");
		delete window.sprayInto;
	});

	it("basic times loop works", function () {
		var d1 = make(
			"<div _='on click repeat 3 times" +
				'                                    put "a" at end of me' +
				"                                  end'></div>"
		);
		d1.click();
		d1.innerHTML.should.equal("aaa");
	});

	it("times loop with expression works", function () {
		var d1 = make(
			"<div _='on click repeat 3 + 3 times" +
				'                                    put "a" at end of me' +
				"                                  end'></div>"
		);
		d1.click();
		d1.innerHTML.should.equal("aaaaaa");
	});

	it("loop continue works", function () {
		var d1 = make(
			`<div _="on click
				repeat 2 times
					for x in ['A', 'B', 'C', 'D']
						if (x != 'D') then
							put 'success ' + x  + '. ' at end of me
							continue
							put 'FAIL!!. ' at end of me
						end
						put 'expected D. ' at end of me
					end
				end
			"></div>`);
		d1.click();
		d1.innerHTML.should.equal("success A. success B. success C. expected D. success A. success B. success C. expected D. ");
	});

	it("loop break works", function () {
		var d1 = make(
			`<div _="on click
				repeat 2 times
					for x in ['A', 'B', 'C', 'D']
						if x is 'C'
						  break
						end
						put x at end of me
					end
				end
			"></div>`);
		d1.click();
		d1.innerHTML.should.equal("ABAB");
	});
});
