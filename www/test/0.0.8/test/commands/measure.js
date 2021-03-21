
describe('the measure command', function () {
	it('can measure me', function () {
		var div = make("<div style='position: fixed; top: 89' _='on click " +
			           "  measure me then set window.measurement to it'></div> ");
		div.click();
		window.measurement.top.should.equal(89);
		delete window.measurement;
	})
	
	it('can measure another element', function () {
		var div = make("<div id='other' style='position: fixed; top: 89'></div>");
		var measure = make("<div _='on click measure #other then set window.measurement to it'></div> ");
		measure.click();
		window.measurement.should.have.property('top', 89);
		delete window.measurement;
	})
	
	it('can assign measurements to locals', function () {
		var measure = make("<div _='on click measure my x,y,left,top,right,bottom " +
			               "        set window.measurement to {left:left,top:top,right:right,bottom:bottom}'></div> ");
		measure.click();
		window.measurement.should.have.property('top').that.exist;
		window.measurement.should.have.property('left').that.exist;
		window.measurement.should.have.property('right').that.exist;
		window.measurement.should.have.property('bottom').that.exist;
		delete window.measurement;
	})

	it('can measure all the supported properties', function () {
		var measure = make("<div _='on click measure x,y,left,top,right,bottom,width,height,bounds,scrollLeft,scrollTop,scrollLeftMax,scrollTopMax,scrollWidth,scrollHeight,scroll'></div>")
		try {
			measure.click();
		} catch (e) {
			fail('Should not have thrown')
		}
	})
})
