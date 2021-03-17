(function () {

	var globalScope = typeof self !== 'undefined' ? self : typeof global !== 'undefined' ? global : this

	function HDB(ctx, runtime, breakpoint) {
		this.ctx = ctx;
		this.runtime = runtime;
		this.cmd = breakpoint;

		this.bus = new EventTarget();
	} // See below for methods

	_hyperscript.addCommand("breakpoint", function (parser, runtime, tokens) {
		if (!tokens.matchToken("breakpoint")) return;

		var hdb = new HDB();

		return {
			op: function (ctx) {
				var hdb = new HDB(ctx, runtime, this);
				window.hdb = hdb;
				try{return hdb.break(ctx);}catch(e){console.error(e, e.stack)}
			}
		};

	})

	var markerStyle = "color: #006aff; font-family: sans-serif;";
	var logTypeStyle = "font-style: italic; font-family: sans-serif;";
	var sourceStyle = "color: greenyellow; background: black;";
	var symbolStyle = "font-style: italic;";
	var infoStyle = "font-weight: bold; font-family: sans-serif;";
	var headingStyle = "font-weight: bold; font-size: 1.4em; border: 1px solid #006aff; padding: .2em; display: block; width: max-content; max-width: 100%;"
	
	HDB.prototype.break = function(ctx) {
		var self = this;
		console.log("%c=== HDB///_hyperscript/debugger ===", headingStyle);
		self.ui();
		return new Promise(function (resolve, reject) {
			self.bus.addEventListener("continue", function () {
				if (self.ctx !== ctx) {
					// Context switch
					for (var attr in ctx) {
						delete ctx[attr];
					}
					Object.assign(ctx, self.ctx);
				}
				delete window.hdb;
				resolve(self.runtime.findNext(self.cmd, self.ctx));
			}, { once: true });
		})
	}

	HDB.prototype.continueExec = function() {
		this.bus.dispatchEvent(new Event("continue"));
	}

	HDB.prototype.stepOver = function() {
		var self = this;
		if (!self.cmd) return self.continueExec();
		var result = self.cmd && self.cmd.type === 'breakpointCommand' ?
			self.runtime.findNext(self.cmd, self.ctx) :	
			self.runtime.unifiedEval(self.cmd, self.ctx);
		if (result.type === "implicitReturn") return self.stepOut();
		if (result && result.then instanceof Function) {
			return result.then(function (next) {
				self.cmd = next;
				self.bus.dispatchEvent(new Event("step"));
				self.logCommand();
			})
		} else if (result.halt_flag) {
			this.bus.dispatchEvent(new Event("continue"));
		} else {
			self.cmd = result;
			self.bus.dispatchEvent(new Event("step"));
			this.logCommand();
		}
	}

	HDB.prototype.stepOut = function() {
		var self = this;
		if (!self.ctx.meta.caller) return self.continueExec();
		var callingCmd = self.ctx.meta.callingCommand;
		var oldMe = self.ctx.me;
		self.ctx = self.ctx.meta.caller;
		console.log(
			"%c[hdb] %cstepping out into %c" + self.ctx.meta.feature.displayName,
			markerStyle, logTypeStyle, symbolStyle)
		if (self.ctx.me instanceof Element && self.ctx.me !== oldMe) {
			console.log("%c[hdb] %cme: ", markerStyle, logTypeStyle, self.ctx.me)
		}
		self.cmd = self.runtime.findNext(callingCmd, self.ctx);
		self.cmd = self.runtime.findNext(self.cmd, self.ctx);
		self.logCommand();
		self.bus.dispatchEvent(new Event('step'))
	}

	HDB.prototype.logCommand = function() {
		var hasSource = this.cmd.sourceFor instanceof Function;
		var cmdSource = hasSource ? this.cmd.sourceFor() : '-- '+this.cmd.type;
		console.log(
			"%c[hdb] " +        "%ccurrent command: " + "%c"+cmdSource,
			markerStyle,        logTypeStyle,           hasSource ? sourceStyle : infoStyle);
	}

	var ui = `
<div class="hdb" _="
	on load or step from hdb.bus send update to me
	on continue from hdb.bus remove #hyperscript-hdb-ui-wrapper-">

	<script type="text/hyperscript">
	def highlightDebugCode
		set start to hdb.cmd.startToken.start
		set end to hdb.cmd.endToken.end
		set src to hdb.cmd.programSource
		set beforeCmd to escapeHTML(src.substring(0, start))
		set cmd to escapeHTML(src.substring(start, end))
		set afterCmd to escapeHTML(src.substring(end))
		return beforeCmd+"<u class='current'>"+cmd+"</u>"+afterCmd
	end

	def escapeHTML(unsafe)
		js(unsafe) return unsafe
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/\\x22/g, "&quot;")
			.replace(/\\x27/g, "&#039;") end
		return it
	end

	def prettyPrint(obj)
		if obj.outerHTML
			get obj.outerHTML.split('>')[0] + '>'
		else if obj.call
			if obj.hyperfunc
				get "def " + obj.hypername
			else
				get "function "+obj.name+"() {...}"
			end
		else if obj
			call obj.toString()
		end
		return escapeHTML((it or 'undefined').trim())
	end
	</script>

	<header>
		<h2 class="titlebar">HDB///_hyperscript/debugger</h2>
		<ul role="toolbar" class="toolbar">
		<li><button _="on click call hdb.continueExec()">Continue</button></li
		><li><button _="on click call hdb.stepOver()">Step Over</button></li>
		</ul>
	</header>

	<section class="sec-eval">
		<h3>Evaluate Expression</h3>
		<form class="eval-form"  _="
			on submit call event.preventDefault()
			get the first <input/> in me
			then call _hyperscript(its.value, hdb.ctx)
			then call prettyPrint(it)
			then put it into the <output/> in me">
			<input type="text" id="eval-expr" placeholder="e.g. target.innerText">
			<button type="submit">Go</button>
			<output id="eval-output"><em>The value will show up here</em></output>
	</section>

	<section class="sec-code">
		<h3 _="on update from hdbUI
			put 'Debugging <code>'+hdb.cmd.parent.displayName+'</code>' into me"></h3>

		<div class="code-container">
			<pre class="code" _="on update from hdbUI
			                          if hdb.cmd.programSource
				                        put highlightDebugCode() into my.innerHTML
				                        scrollIntoView({ block: 'nearest' }) the
				                        	first .current in me"></pre>
		</div>
	</section>

	<section class="sec-ctx">

		<h3>Context</h3>

		<dl class="context" _="
			on update from hdbUI
			set my.innerHTML to ''
			repeat for var in Object.keys(hdb.ctx) if var != 'meta'
				get '<dt>'+var+'<dd>'+prettyPrint(hdb.ctx[var])
				put it at end of me
			end end

			on click
				get closest <dt/> to target
				log hdb.ctx[its.innerText]"></dl>

	</section>

	<style>
	.hdb {
		border: 1px solid #888;
		border-radius: .3em;
		box-shadow: 0 .2em .3em #0008;
		position: fixed;
		top: .5em; right: .5em;
		width: min(40ch, calc(100% - 1em)); height: calc(100% - 1em);
		background-color: white;
		opacity: .9;
		z-index: 2147483647;
		color: black;
		display: grid;
	}

	* {
		box-sizing: border-box;
	}

	.titlebar {
		margin: 0;
		font-size: 1em;
		padding: .5em;
		background: linear-gradient(to bottom, #eee, #ccc);
		border-bottom: 1px solid #888;
		border-radius: .3em .3em 0 0;
	}

	.toolbar {
		list-style: none;
		padding-left: 0;
		margin: 0;
		background: linear-gradient(to bottom, #666, #999);
		border-bottom: 1px solid #444;
	}

	.toolbar li {
		display: inline;
	}

	.toolbar a, .toolbar button {
		display: inline-block;
		border: none;
		background: linear-gradient(to bottom, #ccc, #aaa);
		border-right: 1px solid #444;
		font: inherit;
		padding: .3em;
	}

	.toolbar a:hover .toolbar a:focus, .toolbar button:hover, .toolbar button:focus {
		background: linear-gradient(to bottom, #eee, #bbb);
	}

	.toolbar a:active, .toolbar button:active {
		background: linear-gradient(to bottom, #777, #999);
	}

	.eval-form {
		display: grid;
		grid-template-columns: 1fr auto;
		grid-template-areas: 'input go' 'output output';
		padding: .4em;
	}

	#eval-expr {
		grid-area: input;
		border-radius: .2em 0 0 0;
		font: inherit;
		font-family: Consolas, "Andale Mono WT", "Andale Mono", "Lucida Console", "Lucida Sans Typewriter", "DejaVu Sans Mono", "Bitstream Vera Sans Mono", "Liberation Mono", "Nimbus Mono L", Monaco, "Courier New", Courier, monospace;
		box-shadow: 0 .05em .2em #0008 inset;
		border: 1px solid #0008;
		border-right: none;
		padding: .4em;
	}

	#eval-output {
		grid-area: output;
		border-radius: 0 0 .2em .2em;
		background: #111;
		font-family: Consolas, "Andale Mono WT", "Andale Mono", "Lucida Console", "Lucida Sans Typewriter", "DejaVu Sans Mono", "Bitstream Vera Sans Mono", "Liberation Mono", "Nimbus Mono L", Monaco, "Courier New", Courier, monospace;
		color: greenyellow;
		text-shadow: 0 0 .2em greenyellow;
		padding: .4em;
	}

	.eval-form button {
		grid-area: 'go';
		border-radius: 0 .2em 0 0;
		background: linear-gradient(to bottom, #ccc, #aaa);
		border: 1px solid #444;
	}

	.sec-code {
	
	}

	.hdb h3 {
		margin: 0;
		font-size: 1em;
		padding: .2em .4em 0 .4em;
	}

	.code-container {
		line-height: 1.2em;
		height: calc(12 * 1.2em);
		padding: .1em;
		border-radius: .2em;
		background: #eda;
		box-shadow: 0 .1em .3em #650 inset;
		margin: .4em;
		display: grid;
	}

	.code {
		font-family: Consolas, "Andale Mono WT", "Andale Mono", "Lucida Console", "Lucida Sans Typewriter", "DejaVu Sans Mono", "Bitstream Vera Sans Mono", "Liberation Mono", "Nimbus Mono L", Monaco, "Courier New", Courier, monospace;
		height: 100%;
		overflow-y: scroll;
		scrollbar-width: thin;
		scrollbar-color: #650 transparent;
		margin: 0;
		padding-left: 1ch;
	}

	.current {
		font-weight: bold;
		background: #abf;
	}

	.sec-ctx {
		display: contents;
	}

	.sec-ctx dl {
		font-family: Consolas, "Andale Mono WT", "Andale Mono", "Lucida Console", "Lucida Sans Typewriter", "DejaVu Sans Mono", "Bitstream Vera Sans Mono", "Liberation Mono", "Nimbus Mono L", Monaco, "Courier New", Courier, monospace;
		line-height: 1.2em;
		max-height: calc(12 * 1.2em);
		padding: .1em;
		margin: .4em;
		border-radius: .2em;

		overflow: auto;
		scrollbar-width: thin;
	}

	.sec-ctx dt {
		color: #02a;
	}
	</style>
</div>
`
	HDB.prototype.ui = function () {
		var node = document.createElement('div');
		var shadow = node.attachShadow({ mode: 'open' });
		node.style = 'all: initial';
		node.id = 'hyperscript-hdb-ui-wrapper-';
		shadow.innerHTML = ui;
		document.body.appendChild(node);
		window.hdbUI = shadow.querySelector('.hdb');
		_hyperscript.processNode(hdbUI);
	}
})()

