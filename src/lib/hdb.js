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
				return hdb.break(ctx);
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
				for (var attr in ctx) {
					delete ctx[attr];
				}
				Object.assign(ctx, self.ctx);
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
				this.logCommand();
			})
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
	on continue from hdb.bus remove me">

	<script type="text/hyperscript">
	def highlightDebugCode
		set start to hdb.cmd.startToken.start
		set end to hdb.cmd.endToken.end
		set src to hdb.cmd.programSource
		set beforeCmd to escapeHTML(src.substring(0, start))
		set cmd to escapeHTML(src.substring(start, end))
		set afterCmd to escapeHTML(src.substring(end))
		return beforeCmd+"<u class='hdb__current'>"+cmd+"</u>"+afterCmd
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
	</script>

	<header>
		<h2>HDB///_hyperscript/debugger</h2>
		<ul role="toolbar" class="hdb__toolbar">
		<li> <button _="on click call hdb.continueExec()">Continue</button>
		<li> <button _="on click call hdb.stepOver()">Step Over</button>
		</ul>
	</header>

	<section class="hdb__sec-code">
		<h3 _="on update from .hdb
			put 'Debugging <code>'+hdb.cmd.parent.displayName+'</code>' into me"></h3>

		<pre class="hdb__code" _="on update from .hdb
			                      put highlightDebugCode() into my.innerHTML then
			                      call .hdb__current[0].scrollIntoView()"></pre>
	</section>

	<section class="hdb__sec-ctx">

		<h3>Context</h3>

		<table class="hdb__context" _="
			on update from .hdb
			set my.innerHTML to ''
			repeat for var in Object.keys(hdb.ctx) if var != 'meta'
				get '<tr><th>'+var+'<td>'+(hdb.ctx[var])
				put it at end of me
			end end"></table>

	</section>

	<style>
	.hdb {
		border: 1px solid black;
		padding: 1em;
		border-radius: .5em;
		box-shadow: 0 .2em .3em #0008;
		position: fixed;
		top: .5em; right: .5em;
		width: 50%; height: 90%;

		display: grid;
		grid-template-rows: auto 1fr 1fr;
	}

	.hdb__toolbar {
		list-style: none;
		padding-left: 0;
	}

	.hdb__toolbar li {
		display: inline;
	}

	.hdb__toolbar a, .hdb__toolbar button {
		display: inline-block;
		border: none;
		background: #006aff;
		border: none;
		font: inherit;
		padding: .5em;
		margin: .2em;
		border-radius: .2em;
		color: white;
	}

	.hdb section {
		overflow: auto;
	}
	</style>
</div>
`
	HDB.prototype.ui = function () {
		document.body.insertAdjacentHTML('beforeend', ui);
		_hyperscript.processNode(document.querySelector('.hdb'));
	}
})()

