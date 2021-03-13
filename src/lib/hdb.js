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
				return hdb.break();
			}
		};

	})

	HDB.prototype.break = function() {
		var self = this;
		console.log("=== HDB///_hyperscript/debugger ===");
		return new Promise(function (resolve, reject) {
			self.bus.addEventListener("continue", function () {
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
		if (result && result.then instanceof Function) {
			return result.then(function (next) {
				self.cmd = next;
				self.bus.dispatchEvent(new Event("stepOver"));
			})
		} else {
			self.cmd = result;
			self.bus.dispatchEvent(new Event("stepOver"));
		}
	}
})()
