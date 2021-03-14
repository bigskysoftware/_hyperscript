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

	HDB.prototype.break = function(ctx) {
		var self = this;
		console.log("=== HDB///_hyperscript/debugger ===");
		return new Promise(function (resolve, reject) {
			self.bus.addEventListener("continue", function () {
				for (var attr in ctx) {
					if (ctx.hasOwnProperty(attr)) delete ctx[attr];
				}
				Object.assign(ctx, self.ctx);
				resolve(self.cmd);
			}, { once: true });
		})
	}

	HDB.prototype.continueExec = function() {
		this.bus.dispatchEvent(new Event("continue"));
	}

	HDB.prototype.stepOver = function() {
		var self = this;
		var result = self.cmd && self.cmd.type === 'breakpointCommand' ?
			self.runtime.findNext(self.cmd, self.ctx) :	
			self.runtime.unifiedEval(self.cmd, self.ctx);
		if (result.type === "implicitReturn") return this.stepOut();
		if (result && result.then instanceof Function) {
			return result.then(function (next) {
				self.cmd = next;
				self.bus.dispatchEvent(new Event("stepOver"));
				console.log("[hdb] ", sourceFor(self.cmd));
			})
		} else {
			self.cmd = result;
			self.bus.dispatchEvent(new Event("stepOver"));
				console.log("[hdb] ", sourceFor(self.cmd));
		}
	}

	HDB.prototype.stepOut = function() {
		var self = this;
		var callingCmd = self.ctx.meta.callingCommand;
		self.ctx = self.ctx.meta.caller;
		self.cmd = self.runtime.findNext(callingCmd, self.ctx);
		self.cmd = self.runtime.findNext(self.cmd, self.ctx);
	}

	function sourceFor(cmd) {
		return cmd.sourceFor instanceof Function ? cmd.sourceFor() : '-- '+cmd.type
	}
})()
