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
					if (ctx.hasOwnProperty(attr)) delete ctx[attr];
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

	var ui = "\n\
<div class=\"hdb\" style=\"border:1px solid black;padding:1em;position:fixed;top:0;right:0;width:50%;height:90%;overflow:scroll\" _=\"\n\
	on load or step from hdb.bus trigger update\n\
	on continue from hdb.bus remove me\">\n\
\n\
	<script type=\"text/hyperscript\">\n\
	def highlightDebugCode\n\
		set start to hdb.cmd.startToken.start\n\
		set end to hdb.cmd.endToken.end\n\
		set src to hdb.cmd.programSource\n\
		set beforeCmd to escapeHTML(src.substring(0, start))\n\
		set cmd to escapeHTML(src.substring(start, end))\n\
		set afterCmd to escapeHTML(src.substring(end))\n\
		return beforeCmd+\"<u class=current>\"+cmd+\"</u>\"+afterCmd\n\
	end\n\
\n\
	def escapeHTML(unsafe)\n\
		js(unsafe) return unsafe\n\
			.replace(/&/g, \"&amp;\")\n\
			.replace(/</g, \"&lt;\")\n\
			.replace(/>/g, \"&gt;\")\n\
			.replace(/\\x22/g, \"&quot;\")\n\
			.replace(/\\x27/g, \"&#039;\") end\n\
		return it\n\
	end\n\
	</script>\n\
\n\
	<h2>HDB///_hyperscript/debugger</h2>\n\
	<ul role=\"toolbar\" class=\"hdb__toolbar\">\n\
	<li> <button _=\"on click call hdb.continueExec()\">Continue</button>\n\
	<li> <button _=\"on click call hdb.stepOver()\">Step Over</button>\n\
	</ul>\n\
\n\
	<h3>Debugging</h3>\n\
\n\
	<pre class=\"hdb__code\" _=\"on update from .hdb\n\
		                      put highlightDebugCode() into me\"></pre>\n\
\n\
	<h3>Context</h3>\n\
\n\
	<table class=\"hdb__context\" _=\"\n\
		on update from .hdb\n\
		set my.innerHTML to ''\n\
		repeat for var in hdb.ctx\n\
			get '<tr><th>$var<td>${hdb.ctx[var]}'\n\
			put it at end of me\n\
		end\"></table>\n\
</div>\n\
"
	HDB.prototype.ui = function () {
		document.body.insertAdjacentHTML('beforeend', ui);
		_hyperscript.processNode(document.querySelector('.hdb'));
	}
})()
