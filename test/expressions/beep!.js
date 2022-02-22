describe("the beep! expression", function () {

	function withFakeLog(func) {
		var log = window.console.log;
		window.console.log = function(){
			log.apply(window.console, arguments);
			window.console.log.lastLog = Array.from(arguments);
		}
		try {
			func();
		} finally {
			window.console.log = log;
		}
	}

	it("beeps a basic value", function () {
		withFakeLog(function(){
			let div = make("<div _='on click get beep! 10'></div>");
			div.click()
			console.log.lastLog.should.deep.equal(['///_ BEEP! The expression (10) evaluates to:', 10, 'of type Number' ]);
		})
	});

	it("beeps a null value", function () {
		withFakeLog(function(){
			let div = make("<div _='on click get beep! null'></div>");
			div.click()
			console.log.lastLog.should.deep.equal(['///_ BEEP! The expression (null) evaluates to:', null, 'of type object (null)' ]);
		})
	});

	it("beeps a formatted string value", function () {
		withFakeLog(function(){
			let div = make("<div _='on click get beep! \"foo\"'></div>");
			div.click()
			console.log.lastLog.should.deep.equal(['///_ BEEP! The expression (\"foo\") evaluates to:', "\"foo\"", 'of type String' ]);
		})
	});

	it("beeps the result of an ElementCollection", function () {
		var lastLog = null;
		withFakeLog(function(){
			let div = make("<div class='foo' _='on click get beep! .foo'></div>");
			div.click()
			lastLog = console.log.lastLog;
			console.log.lastLog.should.deep.equal(['///_ BEEP! The expression (.foo) evaluates to:', [div], 'of type ElementCollection' ]);
		})
		console.log(lastLog);
	});

	it("can be cancelled", function () {
		withFakeLog(function(){
			let div = make("<div _='on hyperscript:beep halt" +
				"                          on click get beep! \"foo\"'></div>");
			div.click()
			should.equal(console.log.lastLog, undefined);
		})
	});

	it("can capture information from event", function () {
		withFakeLog(function(){
			let div = make("<div _='on hyperscript:beep(value) set my @data-value to the value " +
				"                          on click get beep! \"foo\"'></div>");
			div.click()
			div.getAttribute("data-value").should.equal("foo");
		})
	});

});
