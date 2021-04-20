
describe("Templating", function () {
	it("can render", function() {
		var tmpl = make("<template>render ${x}</template>");
		_hyperscript("render tmpl with (x: x) then put it into window.res", { x: ':)', tmpl: tmpl })
		window.res.should.equal('render :)')
		delete window.res;
	})

	it("escapes html, with opt-out", function() {
		var tmpl = make("<template>render ${x} ${unescaped x}</template>");
		_hyperscript("render tmpl with (x: x) then put it into window.res", { x: '<br>', tmpl: tmpl })
		window.res.should.equal('render &lt;br&gt; <br>')
		delete window.res;
	})

	it("supports repeat", function() {
		var tmpl = make("<template>" + 
			"begin\n" +
			"@repeat in [1, 2, 3]\n" + 
			"${it}\n" + 
			"@end\n" + 
			"end\n" + 
			"</template>");
		_hyperscript("render tmpl with (x: x) then put it into window.res", { x: ':)', tmpl: tmpl })
		window.res.should.equal('begin\n1\n2\n3\nend\n');
		delete window.res;
	})

	it("supports if", function() {
		var tmpl = make("<template>" + 
			"begin\n" +
			"@if true\n" + 
			"a\n" + 
			"@else\n" + 
			"b\n" + 
			"@end\n" + 
			"end\n" + 
			"</template>");
		_hyperscript("render tmpl with (x: x) then put it into window.res", { x: ':)', tmpl: tmpl })
		window.res.should.equal('begin\na\nend\n');
		delete window.res;
	})
})
