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
				self.bus.dispatchEvent(new Event("stepOver"));
				this.logCommand();
			})
		} else {
			self.cmd = result;
			self.bus.dispatchEvent(new Event("stepOver"));
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
	}

	HDB.prototype.logCommand = function() {
		var hasSource = this.cmd.sourceFor instanceof Function;
		var cmdSource = hasSource ? this.cmd.sourceFor() : '-- '+this.cmd.type;
		console.log(
			"%c[hdb] " +        "%ccurrent command: " + "%c"+cmdSource,
			markerStyle,        logTypeStyle,           hasSource ? sourceStyle : infoStyle);
	}
})()
