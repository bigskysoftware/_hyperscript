///=========================================================================
/// Time Travel Debugger (TTD) for _hyperscript
///
/// The TTD class below is a headless data API consumed by the visual
/// debugger panel (Timeline UI). It performs no console output.
///=========================================================================

import css from './debugger.module.css' with { type: 'text' };

const style = document.createElement('style');
style.textContent = css;
document.head.appendChild(style);

// ==========================================================================
// Configuration
// ==========================================================================

const MAX_STEPS = 10000;

// ==========================================================================
// Utilities
// ==========================================================================

let _idCounter = 0;
function generateStreamId(ctx) {
	const feature = ctx.meta.feature;
	const prefix = feature && feature.displayName
		? feature.displayName.replace(/\s+/g, '-').substring(0, 20)
		: 'exec';
	return prefix + '-' + (++_idCounter);
}

/** Describe a DOM element concisely */
function elementDescription(el) {
	if (el == null) return 'null';
	if (!(el instanceof Element)) {
		if (el.nodeName) return el.nodeName;
		return String(el);
	}
	let desc = '<' + el.tagName.toLowerCase();
	if (el.id) desc += '#' + el.id;
	if (el.className && typeof el.className === 'string') {
		const classes = el.className.trim();
		if (classes) desc += '.' + classes.split(/\s+/).join('.');
	}
	desc += '>';
	return desc;
}

/** Shallow clone a value — copies arrays and plain objects one level deep */
function cloneValue(value) {
	if (value === null || value === undefined) return value;
	if (typeof value !== 'object') return value;
	if (typeof Node !== 'undefined' && value instanceof Node) return value;
	if (typeof Event !== 'undefined' && value instanceof Event) return value;
	if (Array.isArray(value)) return [...value];
	if (value.constructor === Object) return { ...value };
	return value;
}

/** Capture a snapshot of context state */
function captureSnapshot(ctx) {
	const locals = {};
	for (const key of Object.keys(ctx.locals)) {
		if (key === 'cookies' || key === 'clipboard') continue;
		locals[key] = cloneValue(ctx.locals[key]);
	}
	return {
		locals,
		result: cloneValue(ctx.result),
		me: ctx.me,
		you: ctx.you,
	};
}

/**
 * Enrich MutationRecords with new values for redo support.
 * For attribute and characterData mutations, computes the new value
 * by looking at the next mutation of the same target+attribute,
 * or reading the current DOM value for the last mutation.
 */
function enrichMutations(records) {
	return records.map((record, i, arr) => {
		const enriched = {
			type: record.type,
			target: record.target,
			oldValue: record.oldValue,
			attributeName: record.attributeName || null,
			attributeNamespace: record.attributeNamespace || null,
			addedNodes: record.addedNodes ? Array.from(record.addedNodes) : [],
			removedNodes: record.removedNodes ? Array.from(record.removedNodes) : [],
			previousSibling: record.previousSibling,
			nextSibling: record.nextSibling,
			newValue: null,
		};

		if (record.type === 'attributes') {
			let found = false;
			for (let j = i + 1; j < arr.length; j++) {
				if (arr[j].type === 'attributes' &&
					arr[j].target === record.target &&
					arr[j].attributeName === record.attributeName) {
					enriched.newValue = arr[j].oldValue;
					found = true;
					break;
				}
			}
			if (!found && record.target.getAttribute) {
				enriched.newValue = record.target.getAttribute(record.attributeName);
			}
		} else if (record.type === 'characterData') {
			let found = false;
			for (let j = i + 1; j < arr.length; j++) {
				if (arr[j].type === 'characterData' && arr[j].target === record.target) {
					enriched.newValue = arr[j].oldValue;
					found = true;
					break;
				}
			}
			if (!found && record.target.data !== undefined) {
				enriched.newValue = record.target.data;
			}
		}

		return enriched;
	});
}

// ==========================================================================
// RingBuffer — Fixed-size circular buffer for step storage
// ==========================================================================

class RingBuffer {
	constructor(maxSize) {
		this.maxSize = maxSize;
		this._buffer = new Array(maxSize);
		this._head = 0;
		this._count = 0;
	}

	push(item) {
		this._buffer[this._head] = item;
		this._head = (this._head + 1) % this.maxSize;
		if (this._count < this.maxSize) this._count++;
	}

	/** Get item by logical index (0 = oldest item in buffer) */
	get(index) {
		if (index < 0 || index >= this._count) return undefined;
		const physical = (this._head - this._count + index + this.maxSize) % this.maxSize;
		return this._buffer[physical];
	}

	get length() { return this._count; }

	/** Absolute step index of the first item */
	get firstIndex() {
		return this._count > 0 ? this.get(0).index : 0;
	}

	/** Absolute step index of the last item */
	get lastIndex() {
		return this._count > 0 ? this.get(this._count - 1).index : -1;
	}

	/** Get a step by its absolute step index */
	getStep(absIndex) {
		if (this._count === 0) return undefined;
		const offset = absIndex - this.firstIndex;
		return this.get(offset);
	}

	clear() {
		this._buffer = new Array(this.maxSize);
		this._head = 0;
		this._count = 0;
	}

	*[Symbol.iterator]() {
		for (let i = 0; i < this._count; i++) {
			yield this.get(i);
		}
	}

	toArray() {
		return Array.from(this);
	}
}

// ==========================================================================
// MutationBatcher — Manages MutationObserver with per-step batching
// ==========================================================================

class MutationBatcher {
	constructor() {
		this._observer = null;
		this._pendingRecords = [];
		this._currentBatch = [];
		this._inBatch = false;
		this._paused = false;
	}

	init() {
		if (typeof MutationObserver === 'undefined') return;
		if (typeof document === 'undefined') return;

		this._observer = new MutationObserver((records) => {
			if (this._paused) return;
			if (this._inBatch) {
				this._currentBatch.push(...records);
			} else {
				this._pendingRecords.push(...records);
			}
		});

		this._observer.observe(document.documentElement, {
			childList: true,
			subtree: true,
			attributes: true,
			attributeOldValue: true,
			characterData: true,
			characterDataOldValue: true,
		});
	}

	/**
	 * Start a new mutation batch for a command step.
	 * Returns any gap mutations (from async gaps between steps).
	 */
	startBatch() {
		if (!this._observer) return [];
		const gapRecords = [
			...this._pendingRecords,
			...this._observer.takeRecords()
		];
		this._pendingRecords = [];
		this._currentBatch = [];
		this._inBatch = true;
		return gapRecords;
	}

	/**
	 * End the current mutation batch.
	 * Returns mutations caused by the command.
	 */
	endBatch() {
		if (!this._observer) return [];
		const records = [
			...this._currentBatch,
			...this._observer.takeRecords()
		];
		this._currentBatch = [];
		this._inBatch = false;
		return records;
	}

	/** Pause observation (used during DOM restoration) */
	pause() {
		this._paused = true;
		if (this._observer) this._observer.takeRecords(); // flush
	}

	/** Resume observation */
	resume() {
		if (this._observer) this._observer.takeRecords(); // discard restoration mutations
		this._paused = false;
	}

}

// ==========================================================================
// DomRestorer — Undo/redo DOM mutations for time travel navigation
// ==========================================================================

class DomRestorer {
	constructor(mutationBatcher, runtime) {
		this._batcher = mutationBatcher;
		this._runtime = runtime;
	}

	/** Undo all mutations in a step (reverse order) */
	undoStep(step) {
		this._suppress();
		try {
			const mutations = step.mutations;
			for (let i = mutations.length - 1; i >= 0; i--) {
				this._undoMutation(mutations[i]);
			}
		} finally {
			this._unsuppress();
		}
	}

	/** Redo all mutations in a step (forward order) */
	redoStep(step) {
		this._suppress();
		try {
			for (const m of step.mutations) {
				this._redoMutation(m);
			}
		} finally {
			this._unsuppress();
		}
	}

	_suppress() {
		this._batcher.pause();
		// Suppress processNode to prevent hyperscript re-initialization
		this._runtime.processNode = () => {};
	}

	_unsuppress() {
		// Restore processNode by removing own-property override
		delete this._runtime.processNode;
		this._batcher.resume();
	}

	_undoMutation(m) {
		try {
			switch (m.type) {
				case 'attributes':
					if (m.oldValue === null) {
						m.target.removeAttribute(m.attributeName);
					} else {
						m.target.setAttribute(m.attributeName, m.oldValue);
					}
					break;

				case 'characterData':
					m.target.data = m.oldValue;
					break;

				case 'childList':
					// Remove nodes that were added
					for (const node of m.addedNodes) {
						if (node.parentNode) node.parentNode.removeChild(node);
					}
					// Re-insert nodes that were removed (at original position)
					for (const node of m.removedNodes) {
						m.target.insertBefore(node, m.nextSibling);
					}
					break;
			}
		} catch (e) {
			console.warn('[ttd] Failed to undo mutation:', m.type, e.message);
		}
	}

	_redoMutation(m) {
		try {
			switch (m.type) {
				case 'attributes':
					if (m.newValue === null) {
						m.target.removeAttribute(m.attributeName);
					} else {
						m.target.setAttribute(m.attributeName, m.newValue);
					}
					break;

				case 'characterData':
					m.target.data = m.newValue;
					break;

				case 'childList':
					// Remove nodes that were removed
					for (const node of m.removedNodes) {
						if (node.parentNode) node.parentNode.removeChild(node);
					}
					// Re-insert nodes that were added
					for (const node of m.addedNodes) {
						m.target.insertBefore(node, m.nextSibling);
					}
					break;
			}
		} catch (e) {
			console.warn('[ttd] Failed to redo mutation:', m.type, e.message);
		}
	}
}


// ==========================================================================
// Recorder — Listens for hyperscript:beforeEval / hyperscript:afterEval
//            events fired by the runtime to capture execution steps.
// ==========================================================================

class Recorder {
	constructor(timeline, mutationBatcher) {
		this._timeline = timeline;
		this._batcher = mutationBatcher;
		this._stepCounter = 0;
		this._pendingSnapshot = null;
		this._pendingGapMutations = [];

		this.active = true;
		this.timeTraveling = false;

		// Optional callback invoked after each recorded step. Set by the panel
		// so the timeline UI can append live without polling.
		this.onStep = null;
	}

	/** Attach event listeners to capture execution steps */
	install() {
		document.addEventListener("hyperscript:beforeEval", (evt) => {
			const { command, ctx } = evt.detail;

			// Assign a stream ID on first encounter — used by live breakpoint
			// stepping to scope a pending "step to next command" break to the
			// originating event-handler invocation.
			if (!ctx.meta.ttd_streamId) {
				ctx.meta.ttd_streamId = generateStreamId(ctx);
			}

			// Suppress execution during time travel
			if (this.timeTraveling) {
				evt.preventDefault();
				return;
			}

			// Record before-state
			if (this.active) {
				this._beforeStep(command, ctx);
			}
		});

		document.addEventListener("hyperscript:afterEval", (evt) => {
			const { command, ctx, next, error } = evt.detail;

			if (this.active && !this.timeTraveling) {
				this._afterStep(command, ctx, next, error);
			}
		});
	}

	_beforeStep(command, ctx) {
		this._pendingGapMutations = this._batcher.startBatch();
		this._pendingSnapshot = captureSnapshot(ctx);
	}

	_afterStep(command, ctx, next, error) {
		const commandMutations = this._batcher.endBatch();

		// Combine gap mutations + command mutations and enrich
		const allRawMutations = [...this._pendingGapMutations, ...commandMutations];
		const mutations = enrichMutations(allRawMutations);

		const afterSnapshot = captureSnapshot(ctx);

		const step = {
			index: this._stepCounter++,
			timestamp: performance.now(),

			// Command info
			commandType: command.type || 'unknown',
			commandSource: _safeSourceFor(command),
			featureName: ctx.meta.feature ? (ctx.meta.feature.displayName || null) : null,
			ownerElement: ctx.meta.owner || null,
			line: command.startToken ? command.startToken.line : null,

			// Snapshots
			snapshotBefore: this._pendingSnapshot,
			snapshotAfter: afterSnapshot,

			// DOM mutations
			mutations: mutations,

			// Metadata
			isAsync: !!(next && typeof next.then === 'function'),
			error: error || null,
		};

		this._timeline.push(step);

		// Notify any live listener (the timeline panel)
		if (this.onStep) {
			try { this.onStep(step); } catch (e) { /* listener error — ignore */ }
		}

		// Clean up pending state
		this._pendingSnapshot = null;
		this._pendingGapMutations = [];
	}

}

function _safeSourceFor(command) {
	try {
		if (command.sourceFor && typeof command.sourceFor === 'function') {
			return command.sourceFor();
		}
	} catch { /* ignore */ }
	return command.type || '(synthetic)';
}

// ==========================================================================
// TTD — Headless time-travel data API consumed by the debugger panel.
//       Performs DOM time-travel navigation and exposes recorded steps,
//       diffs, locals, DOM mutations, and streams as plain data. No
//       console output: the visual panel renders everything graphically.
// ==========================================================================

class TTD {
	constructor(recorder, timeline, domRestorer) {
		this._recorder = recorder;
		this._timeline = timeline;
		this._restorer = domRestorer;

		// Current position in the timeline for time travel navigation
		// -1 means "live" (at the end of the timeline)
		this._position = -1;
	}

	// ==================================================================
	// Properties
	// ==================================================================

	/** Current step index (-1 if live, i.e. not time traveling) */
	get current() {
		if (this._position === -1) {
			return this._timeline.lastIndex;
		}
		return this._position;
	}

	/** Total number of recorded steps */
	get length() {
		return this._timeline.length;
	}

	// ==================================================================
	// Navigation — Time Travel
	// ==================================================================

	/** Jump to a specific step index with DOM restoration. Returns true on success. */
	goto(n) {
		if (n < this._timeline.firstIndex || n > this._timeline.lastIndex) {
			return false; // out of range
		}

		this._enterTimeTravelIfNeeded();

		if (n < this._position) {
			// Going backward
			for (let i = this._position; i > n; i--) {
				const step = this._timeline.getStep(i);
				if (step) this._restorer.undoStep(step);
			}
		} else if (n > this._position) {
			// Going forward
			for (let i = this._position + 1; i <= n; i++) {
				const step = this._timeline.getStep(i);
				if (step) this._restorer.redoStep(step);
			}
		}

		this._position = n;
		return true;
	}

	/** Exit time travel mode and return to live state. Returns true on success. */
	resume() {
		if (!this._recorder.timeTraveling) {
			return false; // not in time travel mode
		}

		// Redo all steps to catch up to latest
		const latest = this._timeline.lastIndex;
		if (this._position < latest) {
			for (let i = this._position + 1; i <= latest; i++) {
				const step = this._timeline.getStep(i);
				if (step) this._restorer.redoStep(step);
			}
		}

		this._position = -1;
		this._recorder.timeTraveling = false;
		this._recorder.active = true;
		return true;
	}

	_enterTimeTravelIfNeeded() {
		if (!this._recorder.timeTraveling) {
			this._recorder.timeTraveling = true;
			this._recorder.active = false;
			this._position = this._timeline.lastIndex;
		}
	}

	// ==================================================================
	// Overview
	// ==================================================================

	/** All recorded steps as raw step objects. */
	steps() {
		return this._timeline.toArray();
	}

	/** Clear all recorded history. No-op while time traveling. */
	clear() {
		if (this._recorder.timeTraveling) return this;
		this._timeline.clear();
		this._recorder._stepCounter = 0;
		this._position = -1;
		return this;
	}
}


// ==========================================================================
// DevTools Panel — inline div with scoped CSS
// ==========================================================================

const LOGO_DATA = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAL4AAADICAYAAABWD1tBAAAAAXNSR0IArs4c6QAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAARGVYSWZNTQAqAAAACAABh2kABAAAAAEAAAAaAAAAAAADoAEAAwAAAAEAAQAAoAIABAAAAAEAAAC+oAMABAAAAAEAAADIAAAAAFjbRO4AAEAASURBVHgB7X0HgCRHdXZN2p0Nt5dv7/aC9qQLSihiiSADAgTClgw2WBgRJCRZQthgwk8w+Mf6McHI2PpN+EEEC4kgJCGMEEEChbPBKKdTvJzz6e72bsPk+b+vul93dU/3zOzuzKbrupvtquqqV1WvXr1+r+pVVUxFbkpgYNvHrl1eLuVXx1QsXS6XVSqeUPlS8bm9/VtOe+m3vpWfEo1sYCPiDYQVgYowMGkwEBH+pOmqqKKNxEBE+I3EZgRr0mAgIvxJ01XVK5qPleOJWDzdnmpR8kOOtuq5jt63yanS9C0f/fyV6Vjy2EypoGQ0gxi+cey//sOWZrXxykfLqXWHd384kUjNKpXyKh6Pq1JJZeKF1HX3nDerr1nlBsFNxEt7i4XixwYLKsFK5ONJPl48s6enGJS+mXGvuX/n8clk+tJSIauLibe0qVJm8Nn7Xtfz/WaWOxzYU4bwQeyXtbe0nJ0oxlUMGIjFYupQdvCX8DaN8HepXamYin8k3t7eHSsUVCwBwh8YKGZU5j9Q7pgS/jH//PcHUeaX8Rt3h4/PikR7xydiOYu84mkQfm7o16hYRPiN7h3M4GUG8zmVLYIAAZyEH4/Fm87tyjE1WBwaVGWWC46PwgfiJdTmqHblYnFoQJXQH3Tlcgl/YxkdmCB/RCqYINWJqhFhYGwwMGVEHXBardglwHWF40PUSTQdjWXVnki3Oxy/MDTYXorjc3NUu1iCOIklRNRJq1J2KD2RUDJlCB+rlf86kM8vylHJtDGcTJU2NBPZR85ckFOr9ny6lBnqKqLcBFZLY2WVKw+mKG8fta6YUE8XM0MfKdrKbUJB8ovF1jcbIfnn3/3qZEfLmwtDBV1Usi2pipn8fckVN/3CX/ZRzpn86IjCkxkD+Rcu+XhyTvpLClNb2nUkVWF/5rrUyhs/4m/XlOH4/oZF4aMPA5hoyJPoizbHT1gyr6Vh+9AhUoEvOgpGGJjaGIg4/tTu36OqddCvUqo9iRU828GPL0CLBM3nuBH+ufftvgwLG2eUstb0bhxL7aVc7tv3v7b7KbOCkT/CQL0YSMYSd2NVZaBkizp6fi9efjwo/7gRPhaYLkym299Ssmf+4i2tqlDKr0IlI8IP6qkoriYGYiv/g7RTF/2MG+GXVTlbzAxyflc3qFwqqnKp3PSV1prYixIcFRiIlNujopujRvoxMG4cHzNNrXp1z15JiLekVTmXd/QSf0WjcISBRmJg3AgfZlxfgyHTr0p5S7mFmKOKqvhoIxs3kWHt+/0rp02Pla+BKfO0AuyHk7DszBULh9ta85+JvfSxwUbUvbz5ygXFXPYzsVg5QTuxRAoLOvni9uSK7/0TdKyGGNJt+egXTmyNxT+Uhzk4XUsyxXY8vfhfP/3VRrShWTDGjfDvf+38e9Eo/o5Kl46V22DEeVUqHetIlCBxYrUl1h87rHItXwBCGkL4mOGYnUjH34ed5zCRBFQ8y7nCWqX+z+cQagjhx0vFJW3p9F8nStbHug2Eny8W7wH8iPCBhMj5MVBMlFWiOFjIlDqK+Nol9DIjCJ7xjXKpUqmYL+VjhVKKhtKJAib4YsqaTWhQGaV4vEhzcJzooCHyhAdOXDQIfNPARMpt01AbAZ7IGBg3UWciI2Us6jZUTAylEkUfd4fcXUg2jiPn4/FEK1YzDVEHckhDzYNLpVKirTWtkhTX4NKplMoUC61jgcPRlHHUEX7++UuvSbbGeov5Mj/72B1ULicK5X+MnXTT1tEgslre8t1v6Mh29n8hmYxNLxa5G0mpUjmXRvFdslmrBHEH9ZmRacndkP3Dy7WokIDCWyiWDuzbrj69+KIHhj8gssXtMBF+DzRaTZWUw7FL7IBS1/gGXLXaV3+XSBVXD+ULl9IcnE4LOuXy9uq5xv+tPZk4/hUZqxrAdPXp5PSWkyGUcpugUmS6+dgZseXffaJZdSj/4eWzsmW1sbUjOV2Xx4JQbC5XwsBzS+VAbGkBjUqvQO7PDhT3D+7ILpt10WN9bsrIN1oMHHUcHwjLKNhyQOmzOb4CH0xYbHi02AzLD4W1HIOxbKYEjm9Qui89B0E261YlaSm8Q+XOZHgmH4woWB8GLMGsvrRRqggDUwYDRyHHj7WqNHg8uakl6sTVYKy5DGCgGIt1xtLJ1rhKCscHD8/hqxMo6gh5oY6FwcYqowL6aH/WTfjlde99l2qN/UlxyJqvTbQlVCGTuyG14ge/nVRILMc+poaKs0TJVGUsa7YXNzW1DYsP95cOdF1WzJXTuaKFv3hJdcXisWuxL10ruPF4DAdAlQ/lM+WPFeKlAdanJQFlFItZs7YVhq/YNrVBkx+4qFE1W1Jcd8lX4zPSf+vsZ4SRf+nFzN8ljr/xKzUzRwkqMLD3/td0drXkNiTisXmygFUolHel8y3Hxs5dNaHOoKmo/BSIqJvjK5xKp5XCjGWTofWuWNne1TsFMDHGTWhLFHmupY/xYNdossD4iPCb3B/NlW2bXPkIfISBkWKgbo4PXSwFQ2JM/Nkza/CrTGRGPFLEw06Hpxy2JjFvnyRO8QnFVGer6i/6vgIjLiHKWAUDdRM+ZqK/rXKFVcWcrdyC7vPZ2JNVYEevqmCgs296X3bGoXcW88VW6rvQY+ky6vDh/irZolcRBiIMRBiIMBBhIMJAhIEIAxEGIgxEGIgwEICBaAYhAClRlFKvuX//8fFY6Vqc+aLREUvBxD439My9r+351ETAz7n37fqTZFvH+3hEDR0PLijlMnfc++p5362nfnXP6tQDLEozdTCQLJTmqM70hZYxUVnxwK9iPjN34rSwvCzemr7Qum1FKfhVMZfZUm/9IsKvF1NHWbpSHKyexztqKzqsM+CJvxNoLy12EqN+cgRljHaG5XLdN7hHK7dHGUFHzbUwEHH8iBICMQCrIdzkk3I4fhx7aUu57IShF6x6x3nQcLlgMXl96HA2Yy0DBrbIGzlhGuKtVvXQ1o98/gutyeTp2YK1ipyESW+xGPv44us++XT1nFPjbf+zl85PJ0vfxH1frdqyM5WAfFvYuWb10NUnXXRb4EUIw215OdbybDmff5OVDzvW6CmVsV93Yrh4ofzzQi67XtnXDRVwtWixHN9cb+0mJeGjca9IJ5OvlkYmceHbUCl3rYSn+jOZyuG2udSFsJ2Ka9upJCTWXGxr+9yOhomuq86deQh4vGui4vKe83q2om78jchNVsLPZXChchY/ugIIH5ta3c2qI0LF5MlULulDpzI4b7qdpzPwlJKJpXhOfFw2jENM/KZGNYww4GJgUhJ+rAy9C1ze/GEL4VGzGBfLwXQZW1ZiEHGACAVEIFierF9vlxrH0DcpkRVLlj8KXX5WSVmiTqmUVJ0qPeYm0m9aV27NbN/73XgisaAMsSsGm3qc+jyYT5Qv+92rFuxrVj/u68/vmp9qeSO1OUp7SUy5Y5p9qPc1vQ1RbJtV74kE96jhks1A+oWP7mwfOBxfl2jv6CkXQfj4ChWzmWwuX1zxe0v5akaxEcwGYGBScvwGtLthIDDfncX8thLCB+BsXM4FbFgpEaBGY2BSyviNRkIE7+jDQET4o+zzGM6cjcV5GKv1g7Bd9+rhKIuOso8CA5GoMwrknXnmgszv/mv327BsnlbQMsvJJM7jjBU6ioN7RwHWk/Wmb3xjXrkldhOMsGB363nlBOI8VblQ2t4+fcalF110UaTgOpgJ90SEH46bmm+uielFs0dqJhxNglwuXU6lX9OSSrbynrAgl0jCZKGY2zIwMBB9wYMQFBAXEX4AUiZSVCGZhCylsvl8oZXX7AQ56tL4F3H6IOSExEUcIgQxEyW6paUlmNoDKtjd3V132oDsR1VURPgTvLuHhuo/L3b9+vUTvDUTp3rRAtY49cUNN1w3I1FsvxmK6YywyyK4ra6lJdXas7DnlDinjWiKFuC4+yifz2e2b9+5GuJQiAqMFV4o30i3fvOOXZdcc801oekCihhW1Ln37XhloqXty2XchkgXS7epUibzX/ed2/3JYQFqYuJIxm8icquBzmQKLR2p2MsTieR0S0euTF0uwx4JxNre1oZdF+EfZ55FmMvFYamdOCtMDyB0vCfhT68sqbExOHh9FjaGvExGVhwbWkqlwf2NLWV00CLCHx3+Rpy7tRW6agmHMmIaFDcHBsIhEfPcfD6rETQz0zyZsGql4xgJLKyBkbhyoFQCt+dPOw7aeKzu/bANrEooqHA2EpoletEIDKTTrcFySyOA14ABMaf5ZdNY1vzhyrEa1RrT13EwEyw+en9jWoOJWxg7qp5fUAuAU/C9Kr9C3+FxYzq33nor+r16/ey2B7Wtvjh+esxfIlz3qA/gyFP56ZvhWHHtJY+aIOO46UQN5L8aW3nTjWb8UeanCHgzfktrtJsXOFyE305Jd9O//EuHmjn91ngi1h2mtDIt3qeWLF50ImR3R9yEebPqXrAAvSJWD+whnCXeisOcOARDHI3zKS5lcxAtbF5OZgt5Xu3dtQu5rEgqwdlcdmjb1h3PA24o16deUSjmV19y+VWXhRRZNfr1v90wvZjuWoYKWOlS7Sqhsgfv+ePujVUzNuFlec17LlEdqQ+UBi0TdikiGU/Gz5SAfuIWbOBwoSfu6AuQzE7Fb3mNphObnpvC462tCUjaZ6YSqe4wpZUwEyDydDqtn1JGAgQ3Y+ZMyPVC+NYbMs56XHtHh5NMK7zZrOrvO+TI/YzD/7ZUKnmGkzDAQyW4yPtQR+juOe843sn72AizNzQbaTmeip8JOvfATfrbl8Clw2Ag1vEFnqRHXaAeZYzaWwVVgriqKq3EpCkFCGYZZym6Vdi7JA54mgOERE5YUo4kFyVYwlWe9bS/SvYJ8oq0DJr20zku3fPqINU+qROkKWNRjQpirlKoJ+20jg5PuEq+6NVYYcBH46T5JJiMl7vrbqvz2zqKil+DSepnb/MOs9v+EvaHVWTPURRXK6tXtgBeIHpXE4M1PKKqVCxSRnfyP7duXbJn+VItmxPBlnM8EqHfVxXcnZSN9VjiTmV9gj5cUIKddkktbrvtNvHqJ8IaDZ7ICRUALYPG/RQdy77wnlPMerZ0tOBCmuKu2PIbmrZnlOWde9+eaxNtbW8sZa3TbnkoaSlf/PB9r55zn1mfMfBT+LsFvxVSVjKZin35G7cv71l8TLpYCBF1QdW5TLb0yQ9etHbXji3O3Pi0zs7E97/3nRXz5s5NFeVOW8xjd/f0eOR5En1rK3BtOBJlqgWnl3n5gZFieF6KOXnOpcs3CPROC88clWBxuh0ZtXf3bonRawdDQ5nBHTt2OTYQScjIm7dtU7fd/nP9nom5qAZx6sHHH3/8KifzBPPgfua5uNB7QW7AaDPqmGw9/qbV41LXWOnYeCJ5SjnBjuYsR0oVM7mZ41IXpU5Eufw5bnHvcrXyxOOVfUKdEy8enlE6OJBB38ePlzg+S5i1g/Ko2tpweq9D+Ak1ffp0nIjgTODoLKZMLjCC4uTdcJ8cSK04Rdjv2trbnSimycAe6AiUYHGMKxVL7clE3GGKVMZxfJX9JbO+GEwH96Lkm4hPm4FXMHFvT4xpzXHaLahKzj4sgXuAmELYa9MrVqHIFVA3zsYV8l5JUGrCjeUFJAgiVMbJj+npp6IZw2+sXVj9pB6ayG0lWOL4pKlzwR64DPOjwYFstYsxVrsQ9s4TWq8m/N/xI3xOPpNjWFzDfU54lNWuIIlJfkxtc8baGSdBigDCnwS1rqzi+BF+GbYbPM8cnEU7POM8k32COKuDvTYy9RIwF474c0WdCdOsUOyabZNB64/jFCAXt2g/REcZH7/Y9ddfb8mriOOiECfwv/Wtb+Gv66ZNm1ZetWrVhPk6jBvhx0qJT0C2+Xw8bhNFvKiGyontLqrGz0frsU2bn1KlxADmf62+4qrn0t7TIDO36c99WO2gFKoPfOh/aQKRNNO6pqlbb/mx6u6e5wwGeTfeTw7wFqwML1xyjFMVEvzQ0KAmbInkh3nhwgXqpJNcVYgDAQP85X19R57ie7oXsPi1a8MmPfA5SOg4QI4cOXIPvB/UERPgz7gR/n2vm7MD7edvQrosZpuGhvpVkUeVwZHwq5i6O22gLL9tu7dZnZ0dE47gnQrrtsU08UscCb9UKmJlGaYShqPpRFdXlxPDdP39/R39/QMnyNchSSUYPxK7xFnwSuudjBPAM26EPwHaXrUK7Cz5MaF0YtVMIS+F84W8nhDR5PymE1HPjKNfxDf6iROG+RP8IEqHzfw2bIuDMOMEcBHhYwLD3w/sKCF6t0NlIHDa333vzxscdtMLPKazCSI4ixFr5jGim+aVto+mAD/h80s4kdyUJnysPLbUOnJjy5Yt8S9+8Ys0IXb6hZ9qTmfmYORVxJmYdNqyMTOEqSiKPCBkfMqzCOONfqcTyR9O8huLULF4SmUAayiDy8qMKcIUrtepRdQsi4ryWDrWKYv6mjiR8oPqaw4U+inmYJM8RB7igTJ+gtO5id7e3jR+Oi7sD3SB4mOPPdb0BtsqSVg1Jnf8jd/95i3JROr0gk28ga0BDXd0ti/G4gx2hiCAf0z/+WuvU7t270WMDAjIwak0CB4oYxQxh4Mz82ouHuAfeuBwQCRVx5KXqTjSOumKGEDb7sC3hVbMFryuaV3qK9ddqxe2sF8psGo0U967d5/6u49+HPpG/ZvOA4ENM3LJ4sXqfVdc5hA/B0F7e5tatGihE0eQ5OTc+SWOhJ/DQB3oH3DGfgpbD597YW3/f9z4/V3VxD4yHIhNd2Al+GMCr1nPKc3xQWO9QObyIM5lInThgh7Vhk5lOnZcHkv6hw68qPbs8iqpZh7xzz+mRyVbsBJqEz5uJFOtHd24F9aOA7xCrl+t27QZwq9lnsG8nZ2desWU+2nDxAASAmdXeHpCNutdcpfym/Us4ZYVk+sTN0FES+6u9wsYFSG375o2zYlpwZdt6/YdnUDucuK3msP7nmrvG/VuShM+kIjFR0v5qoYwrlDKflV2DMPs0FrO2jACDk6itwmfBFIuc4UTK746jl+IkiYa+646DZZExLLkF1SWvGPasSZ82uSzfNP5w/IuiLEQ7+KKwCUHt4Ub64sn78yn/d7NaL5ssH9KE34grkijtrgR+N6ODOrMaukr3wnRyNPf4dbXRYi7Mj8kBXtghH0RgvI0Ko7t9xO61MdfRr24sgnbzc72uaEx9U1Kwr/hhhvSEAMqTGb9mIsXs2DcenXReeXvTL5gGiqr5NB8zzDl2XbDmIvpKGfX08llzIGXS5B7yfEBj9w/nmjRP8Khi8VbtLI7ODikDdusWO9fGoVR3KBY5N+V5U3Z+BB3h2WgjEt72RSifNCHA5z3o43yzBoEDRAudlEESuFLYjlro4z5ZTBhNNs/KQk/Vsx9OxlPnVNrtmPB4kUL2mElKZ1HZM6DPN+KTtVEaWNXxA5BNnnzzTf/yFHa2JEkwLe//WK1ZetWSRbw5FVARTWw9QG8E16GwQSFd8nL/kZboOpyuRhWGFRXfeATkPtdhbcSYEzNw2rv/fevUh3GtsLKdI2PWb16tbr88ss8gEnkFIFMt2L5MnX1lX+t5+4ZT1xzoHKVV/BO4l68eKG65OK/wgC28MJBtH7DRnXvqv/WA8qEORb+yUn4UICAuN5aIkAKsjG5jHQAEUounoZCacYFIXrx4kXOp56ET+7H6cfaDpaYOVeJBSngbqwW1dI2y57p4VcAlp3Zw2rnrt0g/OqzNfwSLV26tOLrU7seo0uxZ88etX9/bYvj6VjJpX2/cG7i1ZzlYS0oWlLBnTljuoNTMhv2Ra1+GF0rwnNPSsIHboHn2korkSo/QYGEayFcOpL5SPii/Aqcqk+k9ziEae6gTR5QJ+0QJtczdEBPFglQ7PITkrxr5tNsf7Vy2IYg0cafh/gmo2JaOlF2/enGKjwpCd8jp9iYqkXIjUCo/wvj2u74CD1QeWYaSWf7ZRDUqpx/INVKP4bviXc/4Qtxm9WQNPJOnswvfaf9Y7T1dEIRPlZa2/DZTKkDB0ycVfhL2K7lV1oZ9jsuADFeEOt/P9wwTGsVf65jmeDkJSw0GkRMmd7vmAY3klvpKOND+eUil572dBKDKxY4X29/FRgPuKUcFOC8V8zSyrgzkBwADfLARBzH7pgGaWGA2yA2UkEvQrehI64pEno5uvXFpJ4kBC9fbKYVvYF9VSyWWs4++2zXEg4wUUZu1apVVIYa5oQFNQzgaADd+J3rv43Tgc/P5cJXrInYJUsWzYF8mOZRGdohjnta/bI7t/oJoqVe8mmWcL1Plrtv3z5H7GAnDQwMqbdd9C61c6dznhTE94Sa0/NHKqFXboWAMVOUhKWjw7kRj4WutvkvwdMaJKwn5f7N//PvsAh15f4Fs6epu667QnW1YU8y6sBBkUi1quk9KwCucrDX256q6UDExfRMNTj7tKrJ+PKBBx5Q73sfttxKUxF30oknqL+9+ioQsbWii4NxtSL7q9/cA/HOqjP7bvbMGWpp7xJnVovv9uzeP/jsmrUHOAtEx/7CILoZq7kf1xEN+lPJmhoEeERgMImBabtFcdjmhzkSIJFBTkG/dniS6LmX1ImzARj94aS1Xw3rQcJcgFPOxJHwYY4LnlsAobrMSJ/mbVKBzgCunXeJmVQSw0BItc2A4kvTX4oLnFLFF8EZHFZJFKfyAwdUvtRiET7aWmpJw/rhCJJ6Z1ikbqN+4mvU0jZdzVq0qCaoWbNm4QN90JPuUF+fti8S3QSXuujJgcOHD+u+Y+Ii5P3Ojna9N1lESBJ+MpVsB67biV864h19OlsHGvhnYhE+boslEgQRQe0kYZs/nSYoLijzKONMhY91MMMu6JCPqI+gKe9byi7tdKzh6eoMLjT69KDgwNDprEHCmSH/IPHmGkUIsCsYRgi4oL4i0ZJg+aMTP+OFoAnfJmqHWZn9Sj+d/Qw2ZtIpRvZnYhE+5718ThAg0f6wxI/X09/xrsGZfwBUNA1VZhpJZ/vtDnfagzA/+3r+myDws8QAM6+Tug5PUD3qyBaSJAga+8gkchkIjJf+k6cMCoI3/VIc4+AaLtONCeHfdNNNHRBPcIgMj1QMcXhVTiZa+LmjKCOOSpyQBuOIML4nMuG1nTWzIKGxerJTZsyYwV1IbpHkxFB4SyUoqU4FSbiVqC4XqciydWgIuSwU4ASN22xOSaCxZJs6NEDzaMAkPPxSrTE1rZgHTOLJQQKT1+HAiXW+Gkk5/VrI1kikFI5aVTNx3qfpOD8P82LoQ5bISuWViq02VUa/0RUBn/ijPscjWegSJSq3Gikw7bSczVgMBMub0T1NmhodpCq5v/ed67/a2tLytlwuHJHs00WLF87AgUxQWi1EkMi50motdEgBFuE75sF2NGdwbO4gCZv+ZP1efPEAiNzqYIokRzAI3vLnb1dcABKa5CzPnEVnYcBa8rxVMRBgsgVkbxM+aR/mu+kFp0Hu5wwOBjMYXTF7UB1a/U1QCgeJ5RbM6VQ//NSfq/ZWzJ4QcfU6pE22tmvFuGYWtEWbVldJqE0z2ueo7DzvGbSYgVFXv+990nzdQi4IvuF15zqzP1wF3vfii2rt+o3oN2swJDAoSuXiTw4XSh/A8Hcc6GEINvpVuKaTtG5PJRuqO+swEpbLM8Gh51ezN9GcHA0nd5DLwRlHk1f/bA1L5jvX2cTjRoyJjwONG8jF8SvUBwUOrBIKrzvI47TUdMhAUuOzn4ctjBO0phBTaaxu8uNIwgdBgBDUvkNQjEsuvBRONSvyxhEojcMl/FLROy0qxVc8wYVLWYfxVrxmBAm/tXOOmjl/vuc9D8+igmu6OXNm6z28clYPiZz4ymSy+sm0DIPIB5994gksaTfXjQnhg0DQnvqUVjZXiJpP8xeOCod8wpM06Y2p4LKuZtgtMuTDaog0VtpKhRfUBYKgQZcLTcv7Om8IXDdpgG8YeSrq5wOH90GYZ1/7HZmE9CXf0U/HeP4M/zAqqLON6M+YED4aWYEffxTD/jgDGZ7GmcjyvPAFgmCGleHLGlgXf5qwsL/j3bC/TyvQApBMI+lsvy0DO+UBVyR+R+F1XlR6nLUOzyuBL5FB9ZB3w38GQSMOzH4Tv9lHtj8o+/ArUSPHqAj/1q9/vZPLav2qiu6BVzBIaqNCaiqt/KzJSGcd2WjOzTONrFozjkoRIhxCZJfx5o9gzuptLcUkwiMccTS3Zdmmo7mxS5wW2dGC05/OzBPmZ5tmz57t2Ser59shspSwBREttbOCcO1zQ11YGPxOGqZDu6nwtk5TMVt00kMBN4y8eDijhrK4OM5omwvH8iUwOKZ3UK8wHcQjKMam00RYj8JrZhI/BiVFNtO1QOeeO3euGaVXvAcGBlXB1oco6tC6lgfnemX8ctvpp5/uyTw4OJhZs2bNEQ/AUQb8Q39Y4KC0find2vLebNaLSBMIZdRFC3umQe7zKK1zu+erDiz/m0TpHwwk2jvvuENt2LCBg0eD5SzPf/7szoqza8wyxf+2v3izWtizwEPUF7397WoBVnll4LD8W26+WSujMkioKL/j4ovVnDlzPHkFbrUn4R06dMjJxzYdPNinLnzzX2Dl17V2JNHPXXgWiN+n8PoGA1d82xaegZkYth+DAXJ/YeiAOvjE1/SgqFaXpQtmqJs+cQFs4M0ZMA44d9aM9U22dqgZWAkekUN9qKSLo9yvOheownyvwnv33Xerq6660h33yHDssUvV+W94PfrCWuHFnb9q9+59mWeeX3OEA4OO+ANT+gFWbj+iIxr0Z1QcH1TbhYrN1Z/csAphioqVtzi5Nc6IbE5tkSPTbzozzDzk+DgpwSF8wjoAW54XMSNQy3GlkKawQuRMb3J2yU+OzzKE8PkMSifpqz2F48vXzGo70Kw5vjsz46EAB6BwfDsCuCkTd+T4MHFgHnJHrhST44PVOjmDPDM6vZzYSuPl+MS3JtYgAPXEkePDlkicVngxrmYGcHza9JhOOH6hYM/qWFPZaeCOP52UT9Sx4XfzjorwUSfQR3Wlle9NYpaGa4QT6T7Cl/fyZMPlxzj6SUz1OKYz84blkTR80skzLH2teHPQsH1m2M0b9rH1xyNMGV/L+TaTAEwyG1tqcEH6fOEMyV+GL+NwgzbedDb4vazMAhaEA+JZ6ICpxC9PicOzUlvmy1G4URE+6ZZls6KWI0LFb8WYjbATVaRx4yt9QpRitKQ7PGDWoDKnxd25khqEdDO9WQZrL2WZaejnl8DvzK+J/50Z9tfBChNffiL04k/DIGEJcelnJZ7Nskw/5Xz+pIsIPVjhNXM13i/lm5CJA/an4Jv+0TIdE341f92E/4OvfKWrZf60dkgEthtUqViyg/PuVErFaS6rObLVgUSyXrED0VimtNZAqbeBPISVxmCm6Srnibux4ucOOCnd++Sqaif0CJM4g74WUJ50GVw1ZgcFiTosa+/evR5YJMbZMNIKGhBmTdhWKrxC/HrRCgZmZazuYncuklq4Yjz35noduAvn++OWHExYVICpGyC1lRTjgPUrGYtcfMHV3j0HiTtXxsdlD2pmJ7ZeNtPhU+TdhYarIVMxNd8330+z58NH3PNJKeNzp9tYOD+7CS3zpu9c/zmcqvv+LBYc6LjM3NMzvx3Wea1CWDSymgOlddr0GehU9+vEEW0RvdXB7GdtioD4ao4D5h3veJe69977DMYYU9/+1jfVua95lT6drFZ+P6ETpsSRiFj388+/QD33/HMOKCrSv7n71/pkYMqhTMcOueCCN+MU5S1OOt568utf3al6e3sdc2XnpeGh8rbmueecmR6Wf+jgQXXZVR9UfX1Y8LIdrTrmLD4b9SPx27gCecdg1utxIHLLItQeMKhfHtsd929/CAPAwDs4aGcbV4ddt3zRLPX9T17gfAU4YFLpTjVz0QluotH6qPAaSrreeN8FS8+Ff+SBfAcmLq6++mrEuW0lU1uMw6yESRBX6KPvPPHEE3/tyTzKgA+jVaDFVAcqMZOjUjtwclaKP3G4LFtzfxKXSfi6WUDwSBynLnn8nulowkBzWH+8mYb+oC9CUBwVaK4gikvwptqA+h461KdnbCRdJgMbeWOAS7z/yYFD7iYnLxNnPEqQm1BK3MRiO6ardOD4Pk7ONDy4ShzzxeMuHInn1/Yw7HxMd3jQGzbfNcyPwWdOcZLwWxMgoACbHj+H58aWsXD1Ez7wz06WjiZSg4iDcfJrRAOCiIHwzbqMthx/Gf6wwDcHOeP8YUkX9PTXV/DoTRtE+EwRFO9nJP6wF7KERJ6WcNOe5iCGP6h2QfQThvtG17N+wg8rmZxRuKM8w9JOgHhTHhck+4mQ4k9Qp4y6+oIfPGXwmjCteoDITaIxE4T5dfqgwRGWISDeX6am1CByDcg70ih/mSOFM4J8oyJ8Gp0lodgK4VC+FAV2BHUZkyy7d++BrG3Np5PwqQBSbFqIRS3pZlHYG0n8ehuk3UJ+KSgOUjHmRQriYjh8lqu71ry61Ebehj+tdoxCKcRALOV9IhDkdNxKGV7oMN9Q3DGN3lhnUxwaJrhRJx9xy0gUM2bNVot6l2oFUWqiG1SH3Cvpx+qp64U6X37Flerpp59xiuUU2i23/EidfNJJjvJJ0aID2+Jk65yTeIQeMogFC91tfKzL7Hnd6jOf+oTWUximmS5XfD/7hWvVABbUhuPI6/ENwVfEVWzrzc+yC1iAOrDtWScL+7YFCi/39TbCcdW5cGinOvy4ezk0VvzV0MYHGwF+RDBGTPgsTXcYuFcjOeOIWjGMTNw0wk0SpqNCxdkE82Q2+YqZ6UbjN/UBjTdwepbLeMFjNssj++zjB4dRWP3fhjCgGDTGahj7cySDKAy6jqfC6zk1F4PVUOyr5m3Cy1ERfhPq03SQJgGyMIbZ0ST0RhN7rcZYBGaRremvlW/SvsfXxXX0m2H3zVj46iZ87ngikQjhsKPIqaiI6addW8ZPVSfrFdI+ikJUlsWAzowXf7Unccn8wvEZLmK2rJmOpMZFLM9qLvqs2eUGtSmIVmhtSnwITckzKP9o4uom/EMw+GpJZfQ5iSywiM8Wjbt4u7fMTzNeDnGifyo5dsAiHLch+0PZNhrZ7dq1S3eS7C+lzsBjSMzZoyA88Ouyb/9+XA6RsToa+fohgi3EtsJsJuko2ixXmy8Lc+S4IANq6fCA5SDcsWNHTbEzVyipLXv6AAIA7THGE4znzTA3+3lANyVAom9Pp9Be94AuVikJnHJuXwYF29+ML3HdhP/DH9+KDqLVorW/VG8SBkqmdbTpq1+IHcqFNDf2r9w2BXNjCJSdwFmYm2/+gW4jiyZ3pn35BRe+RROcVKcTpxrfe+/depD4vxCShnlpJvH5L30Zlqa0MrWoeva0tLrl0xeo6TAp0PY0KDeeasGq6onubBnj0l1q2mlvQZzbfTTdxglkNZf8N+06pC78h59IVfTzpGPmYA/vn+laNPd74xabzRfVq05Zon7xubeCrqxF0DQM+W//77Xqf9/4Ozdhk3wu5moUkMsVUEGuNFozB3JCLolCVmlJ+DJSa4CblK95Zr58ekm8JFhyJxKxOJJwPThgGq4Ymzed5Frjqg0byDvACU3C78Qpas7JCMBxHKYStEHC8JNi6z5GnKIEN7CYLoO+HQ+XBItnW4Xw21pwujWObRAaa2ad6iZ8VoKdLh0vz2ZWbqLB1oMchCOOHeTHgzUgJEX1pz8vwyyDxKl3VrEs249rGS1gdhyZjblmMhpi8dejeq0b95Yt0jK9LXPRL81sXCnBkOomfCAnQQQJkvhkJ1OWFXmWtjoSLuM9Hf9KR1oxOroursiUmgCsLM7fejgqE7MuZn2Zzy9+kGDqhedUYCJ4bPHArYp1MKsbnlK+4S9Q1Gh+3YQP4sBBMWqdEAmfg0OD83C5wXRZCWVcFspT5+F+V/zBaOblAbRkdEczz8ZJ6oFTo364Pa8ThzbhyA09hKzUOFhW9LKq2bdt2+YYn3EAsH7d3d1aNJF2cOEoaCdYVcDj/RLiTmnoEAa1dB/wiatEV65c6Uw+sIoUR7fiBhdp63hXexTlz0De5b78hxDe54urOyiYq5kB1oXXItG/ScLNmzerO3951//91V2/vUoUXuud+1VgmErwFe99tzrnFS9zOoUdMW/+AtWJAVGtU8idz3vtuWoxrpVJ2svn5NA92Efr59xSLz5J5Pxd/f4PqEcffcx8pe742e3qjDPOcMwW+JKKa6NWaT2FNSOAgcql/yNP/syFjoEwKz1DPfLwQ64ugLfPP/+8VnjNhTk306TyvRW1/TNfja9H+EO+uLqDdRP+qlWrqAF5tCBs9ChQnKgmX5LwSVQkcCFyedZTS84580ofmStnWSK+1MpvKY9eGxRumuHXh5tOxA2nPpJnvJ/axl0qQYUXu/O0Sa8hAvFEiSniaNDkGjVZjfLv2BlWU+sm/CCokPFBg14O709X670/vT9MBWikgyZogAisyUjsXtyYGpPlZ5vQHY6b/G10mhLksbX9oFe140ZF+EHghbDknXBoUXoZzzS0gCQXNzuHac0wCZezFxRrZLbEn0bKmYxPv3jFdvILx18JN5IAGVi8smx5PBRtIbGyyQa310mgF9Uj5uh6oCzH0W+GnReN9XBvANsq05kp+LmIVacblcLbUMIn0XIBJ53msSFW9fMQczjPvW37dnSCLSnhJeeO23EtpBA6BCE1Czt02vB5ljgS+zToAVRIOXDoOMujd3hJAVYxk+4v23Ps0l7Pjq4ubBPcuKtPdRwagPiIJrGtwOXJswcVzZotjR6IBYHzVhSPg7hTHDwAIhKJAFsKyxn1kpe8pKb+srynC0eYYI2CRRIo/lTA9xQ2+gCZGneDrd3GOtsLWKmE2nukpFqnLbAqEVoMGWJxdm5gr3+/JO+Q4iRMTddQwifHetlZL1WnngwTXxA8HTvsN/fcp3586+1W59lV8oshTP83V12hzjrzdGMluKxeec456rw3vtEZDMzOAVFNubWLmLAP1p13aV3/dVz7Az8dB8LevfvUe957hcd6tHtWh/r551rUNAwKPbWLwZDAjSh6NVc4PJ68IcWv8Ha3z1KPPfqIHijVkFHq36cGn/lFtSQNf9cKIv/909vVlZ/9qQsbI68L+3KXv/YfKzbOu4nQ/9ibvH/jfW/f/fStbzPj4f93/D7miwsMNpTwWQIJmp0o8+/caEEOTsK2PwKBFeF7EWOE4/NJIveLRPI+ENAkiqSiLSIcccZwHtPBeWyOEcewbi9wwS+A85ME5hNc3+bZeGASABhPYcYKvWKmqvCXmAb9NtaONGK2leWjufig4e4y3ZbgGun31mfCnaGwktZNz3UnDK5CcCw7SohTnhwQfi5v5q72zoRn5pnsfrNd4vfTnz9cu81CwPaTg6UGEOmj2rCbn8KqNVkkf2Eu9F3oCz+kURE+PtPaiFZsdXihF0exdCILo5+cnJ90P3GbYW4BtJQdXHqsBVwrL7m9n+PLl8FsTFDn+ZVHqY+Zj37CN+vifx8UJqcmh9Y2NUYC1q1e58cTw/460/LVmtKFOEMixi9U4fUUDBIiwYs45HnnC9STxpdlREFzAOq62YPTA8yuc7U6hb+z5EYPvOBA3YR/5plnLkDHzBUwXBXEoapzOccuC1g0zeVKK+ePk85VjzB5nTdXHbNksSPjs7k5mDPziA1xBRD+YZjlbtqy1el8Dt8BHEjbBuMwYQAkjrn6kgFXCSYMEqFpu8K45cuXWactM2A7GpoRhunWrl3rrPCa8dX83J/Aw66mT5+mctk5VvUAtrOzwxFfquZHx+OcIs0UmI4DicemrFixXB9uxTjSxvT2lFqz/YBqTwHPut644THdpk6ZjbM+saXR2xLmsh1EhTIOnSr2769J/MVBLoI213GHl3VZhkXsBQVzdv8+X1SBR6kUhw6CNiqPS5EalrnqDyU+3bVQojSySqVCd+7I7lPcSO3bi78VF01YtfClDAqC8L8Mrvgh4WiUyc8799XxM087NUY/Hd8tWtSjTw0jB6dj55HQTGIjd922fafqwx5TU8a989d3q7Xr1msOrDMH/OGX4yMffL96CRVoDB7tAH/B4iUV130GfRlYnnB3Pgnv9a8/Xz2LA5+G6zjY3vPOv8IdUDN029lGmj9cceWVeiuj4KpeuNzbsA0r4nJZMuV+2vu/85LL1CBMoMUtnDtN/fyf/lJ1VLsKCHVJ4NqfWYtPtDpBMoc9kb5ZjuJ4pv+A6tu1Dri3Z3BgifnT372gPvyNez3Ftk/rUbMWnA56cZmiJwECHETpWceqtp5TtZ/vtcK77u7y7md/6v/k0uLgU0xjuro5PjqVRmoyV6ZhkHDkxwiv3y2G8ULgkg7AfOktW5ogkciFxGPx6j/6g4Tjd+YAlHeEyd9wnbRXnsxP/0gd87LOAoJ+/opF7w4phkEZKEZ+QSXa75pI0EGlVo8z60t/iGOdq9XbfqfJ0Ua35deY83e6P6wLrZvwkbpKTUMaYET7CS4MmElERnbHOxzC8pfpAPF5hgPTzDrSfCYMv591lnqLXwaCpPWHJf7oe5KKhJLkWYGFwBfDIfwKiNy+Ro5kyZ7WF5VhKosi9yM2kEtLp5qdTK5rKXfCNe19ve7SiobFr4el8NpfNRALwynIwQKPlaW4ZYYZ5w8zzhGZGBiGYz75WohYNZwvh3/gMMzp35JevrQsWDXH9ynMLIuXPXDLoLkV0lN14ESUYJqIC0Y9acYqgPLZZ6yziDqsO/f9Vjibm1fEV0QgL8UmrnDTaX8APOttxd8REz47qe/wEQWzZCU32bFDOAgO4SBUITDOelAZpdIncawFr4CxdjRZMh+Nxmh1SWJiZ9OxDO5QcgeRpUfwCvn1GzZqotMJUSZXAXl9j1nGfNxIqE2OHa4AS0xs5fMrwSeddCJuVhy+QRcH2+IlS7RCLzMunDeX+uu6hfxhPXPYgQX+rlOQNHkdqqXcWwfVklh4AUY3Jgd4WC9TsmtndqXV05v24wRil+lUFAP47VhFP33WYofYKtKMUQTbcQC3wjy3fq9TlxbUfev+QSj4sNA16qHv+fXEGC8dL8RiHLzFlWo5BqWMs0T9JzQ7yQM8dQ8RmPL+Gxrw4XoUNtCr8wXi7M2Vl1+qXnXOKxyz5IB6OFHoL6t39SMGe/JteiVTuCORePsdd2oCScLvOF2oE9ID4OMf+Tu1csUyZ5aIb3ugBPuvDzUHiwuhPp/Uq77Ubip+GXZsgSJr6xZs10Eo+9d87ksw8RgAgXP5CTM4rWn1srPP1BaqrKdOd/CQuuHGH2CxK3zmgyUt65mpfvbZt2pOq/HqFj+mvjQU2TsfWK8+8LXfeMpNd8xXs7Ui69dHPcnqCnBr5pEDG1Xf/hf86b+EiE/6I0fM8f2AzLB5QobvK20mC/RrWrZZgI+WPen5JcEtQ67zFTQcYiYxjdQNp5x6yyD+2PYqi5f6ipBaxDx6cqq3xvWlq1Xf+qA0JlVTCN/8jFQj3qAm1IscwjXL0ZQSBLCOuGYQbx3FhiZhu3TbPA30Jq/yyklYTxon8VHmqZvw8UlP8rPu/7T7iUaUPMEjP+XMQ3nYFJP86ZjeD0vizHj6CdNvShtUL3Jylms6zr3zZ8IkPDMs5Zr5Ruv3109wIvGsK3UD4kVwJm3l0/9jmtoO1p1QIr23HtbO1egUrEMS5+NXuHq5XEVGRnhpUSvNwVzWSwA2rMDIwHKU2oD4B00CgX8pOq5b0vPdTFy/Y66OcjWXZ1WuWbvOkbUlnbUP11VtaG7sVwxp4iyEwHI4k7Rk8SK9CixXQhKlGZ8SzLS0dmR6c8AdxH5grpjqUlFfEh6vBKWybfYD0whREtboHMywefGEUQCV+A0bN2m9h+XwNwDz7Xm4LXDG9C5dHJOzXh1QUsXYjwOE5t2LFi4EPl0Zn208giuTTBeDFeOja3dpkwejaDPJmPipyG7cPQAT6xkoz+3vpO9QrPorw4vvMjjMzD0hmhMWOGl6F2Bs8cHZ6AvrYMAwDEoWHAeF9+voiPcLYZELn3/e69RpLznZMUumScMv7/6tWv3Msw73Zbo/+9M3qROPX+kZDEuWLMKKZxcI1UVOUMm60sboJtFs2rhZ9eOCLiFWPm+5/T/1fbj+wSQwOQBJSP/77z+memFSIbNTzLtwyTHWAGkAxXBWavuWLc6JcyyTV5F+5p/+WT8ZZl06OzrVey6+SJt8MBzkWDfeErNh4wZnQDOOh1s9+MjjnjiedPfcc88DTDCsIPjNikt3dKs5PWegnaPXPKjI9h/cpA7tY9s87jqE6roPdzgc31NCvQFBOTuHPzp51gvDn07D9BGGlONPa5brf8fwaOsSBLPeOKmb1MFGT73Z60tHlIchpz4IDUk1Kg7bkBp4gYx8OsMLJwpNUAxMNIKbKGhqOsdnQymjiyEbw5RRyeUogsgnnU+G+dn3sigqdszlOsnjxiAHEvnjqV9QrDLjhbsyr+RhuRTJUCkNkmnqVYLNOoT5CY9KthAh28gwza+JG6mH6TfrbOHEgk5Y/AXFMb+InUwj8MLqNbbxrLefz1b2WXCdXGmB74eryAbBbDrhswN7FsyH/FxAZ1krsrTfp1nzZpggi8zHlU+aHPAsSuk8VrgVCziWjO5SP1djrTi3SVSU6djh1lOpY4/txRa/Tg+RZAHfsvdHOpRJ8+LtO3bqk5+dcgFjP1Yak9yZxAEFgNwrQKV6JPt9qYTS6pQrtUK4bOf8efPUjK5puiOJpw6YTHOF2zrgSjcDuCiqg1iwkoHA/Bms8B7AdaFOfTGkOMAXLexBffV/XU4GMv7gAA73AuwwR3jMayrGTM+BOQ11Ga4jPJpr78eKs+l4B29mEHGGjE+LytoKLgcw+gzXmToOjAPXnVKRXe/EWZ61vnBosOmEz9mLP33TG/Q9U9JR5KZf+8a31S/v+i0Iybq2ku9OO+VkNb97rtOh7IBjoGTyJDbpPD57e5eAQIyN6oibP9+ZXHIae/kl73IGgkRu3LgJK6NDTjzh/fCW29SuPXthO+LnSFYupmlBnf/x05+oeZiVlCNPEsIAbmH56tev1yuz5NSEx6uGLrn4Hc4MGOOIl+OO63UYhM6LmZ7VTz+t9y8wrOOGBtWjjz8FgrAUReJu9uxZ6t1/dZEmWMJiOg6uDZs2OriTOplP1udQX596+NEnnWjCo6n1WWfA7NeJrc/DAcMZvJ/89A5PhmzmgNq3/UFPXFtnN1Zuqyu85O6ZgX3q0F73qiIbCDfr/q0H4DACTSd81oUdQWTyRydP6UjGiV+ejKNjeKSO5fJnOn8cwyyDBGCKD/48fDfiuhjwCUfKlLp4n2bJwX6Qv4MvppB6mXAY7w8zzu+C0phxXuz5c1eGJW/lm6CYkfctoI0qczCLC6pjFBdhYAphoOEcn9xHfsQT/eRylMmFM9FPrk8xSOIYpjKm9+3iSUfuQSdpdAB/BJ68Z3wQpzHfS15/OoYp41LhLqGe4ij7C0thmiLecRGJ4ggXxep1rLtWZCGWcJ0gAVgaHvxSF/MpbSN85pUvBNOIc3BlizqiJDO94Mr0Sz55EqY4+pmWuBdnwatvvt1fjsATWNWfrK9bl6C0VRRZ92r3oIw14hpM+JArcXPfEci0JCY6Kq3797+or7Us2wtTJHyaKp8KmZ7EJOm4L3cWt/GJAoS+pvJr3lJIVXPfvv3Yl0qlTWfFH1gx4gZB7kE1Hff+mmdk8h1Xlalko6+1I4wVy5epOVgx5a4wOoLlFT2WObRlJcl6bty8Re2HSbRTP526+h9CpCK/YD4UWezPZUeyDVyR5tk6bbj0wSJ8a1V677599oBDTvxnXu7FbQFhaiJDJO8WJq5K3IkFRxx1QBEdwAIecUt4TMu8pmNdOPi0smy/YDoyoF6YV4sjPL3PWSJCnlYZed3fkoSDHGeWUrN9SuLCntheOA/y+8nER5jD0Mfe3MxOvPebXbp3toZlrhJPXIzY+VduqWydfNJKnG7c4+EgLIBNk8I4KF71x+fgJLGlSGcNEL4VzicVorK56r9/p09hY4eGOeZb2rtUn+JGv7ilS3u1EmnGsbP8jnFWvBBSWW3YsFkrh/KOdf7eD2+GffwBPXD8MMLCmogwKC991zswS+Iq5GzPccctdWanWM4QlNZf3/0bvQeBYTKNVswsrVi2XHN+swyrvlYM/ZytWrN+ncZhWDrOTPUd6VcPYYVXcEJO34M7u975dvdsJsLrx2zQxk2bTFAVfnJ3MrVHn1ht48/6GgPmL5588skLKzJURrDQ2yqjK2K+hZirKmJHEdFgjm/VhIgzO4axJrkRYUS8Fm3sz3VQG/TmDuYNgOdPX08a5pEON/P74ximOMGfwKWf9SbB8lmv42UZ0l7CkLIIl34JEx6CTnl8z1KC0llp3QHONMQVn/U4Mx39zMa6iWOcWS+JD3taMKyy6Ud766tI5QnIYUXUj/AwCL74hgP0wY+CEQYmJAZGy/FTJvcjx2JYOFxYi8lNKHv7xReTI0pexpmKl8SbT+FO/JS7fKtZSnBet88s3+8n19NsFC+o17D+JldkeuKIC3a8GYaO7ylrsy3SHvH78+oMxh++Z9tr4Z1pmJZyvpTBA6uozDJenIZn96PEBT2lr/mU/PSjvVj5q8uFy6/e7KNSZL2grNBoCf8pEOZd8pmkVSUWh07et+/FRXI2TFChJIRdu/bATKAFSHdncGb6Tktm53Bhhk8iNMzxo0+YfUcOW8qEnXDPnj2qrw/7cA3lqR3ytqwgCzxL4fXC5wITZ3BID+xUwj/phOOhaPfr1V7J63+iqmoIi04iprHuhENLSY0nJiBM/Fv9zHP6qWEgjncH83KH1pZWFqplH94bTHmb6cMc68fFqn2Qt4Wgw9KS6I/rPcbBCOs0Y/p0zwQCZ7Q4eUB41Rz7pP9I/4uA8YgQvp3+4Wr5jHc74L/LCId5nwh7MdL4cGyOEOJpp512PQjrymozH0T2qSefoHqw2kpuQ0fF+FV//ErMVizRRCbFE6E+pMor58n3995/v9q1e49n9TWICI479ljV3tbuIZDjjsPhRPqOLg4hywWVyY6uhTC2h3fO5nACnMAgsa1Zt9aZvmU8Z1x+/8Aj2sSYYdZ1Guzu3/vuix2zZEm3FkqrHjRSOd+T6WiW/IBhluxLooPE8QKsjHOFl3noSOTcB7Buvbv6z3Zy5uchrA5Xay/Twfzk7ieeeOJ8DWwS/Rktx69oKhAKfABdpSooA9KJNI04G4JmhHZnmEBJEEEEbKZxOhH5xc/3pl/SMy4oXt7LM6hMcv1ajgRKAjPFB8ZJueaToh6nSRnH8hiW9kr5fEqesLLlPUUZJA5LpsroF6Y16xaD8i31k4wmvHBoENcICw/JN5mek7LSkwnBUV0nJgYazvGDmkmOwp848XOeXoQLcnwuflgro+545Dw435mO+YUjSjzjNEf2J5YE9pPcjF8aqQOjyWmF20py4bwSrvfJrx25eCnpTi+SaxIexT985zQolk9lVlav+V7MtXkFKTCmOSrrG+TYBnHCoWmGbZ5BRO6vvwJ2QpZJPUzSM1rwYcKjX37BpVsAmQY4r1eRtWsxMR5NJ3x2aDfMb3mKMv10/MtO2Ll7r0P4DD/3/Bqsyr7oECWVUlpmchHHUVCRmQovV2UFHmHOxcqrHjQ1lsApW5PYTLdz505sM+SeW6t+7Oz29g4MBq43mCmr+0mjJL71m2Txi8RJADGttFKxpl+nw2rs6aeeYg1WFohktADF3cFa7mcEUup9DFIvpNKOosp+LKSZdSP+lh231CrOLpODgPK7HamJfsaMLn0qtYwnriRTed6zF6cq246DF8r4AcD8H1athnPNOmsknEiv62jX8Kp7+umnfxvc8wp2BB1XPC940xvVKTjdWMwYyNklYj1KAAAM3UlEQVR/ducv1TPYD0q/OHaw2cmEcebpp+iTxAQen+e+5tXYIO5dHTY5lsALev7mnnux2rhfczR5b5bJOHLBZcceVzG4JH3Yk/l48tuNP/qxZy8tBymVVt4PJmXxC7Ny5XL9pZEyuXL7i1/92lm5lXIIVxz9g5gh+sODj2hdgvHECZnBpe98R4VZ8nrszZUymZZ+wSXDxBvNkh96xJ04YRlI93usvv4x00xF51JdE1tHRFMMEeVQOlI+p2FFMx8JxE/Ukt/MZ3amGR/kZ34Thulnennvjw+CZcZJPtZZ6k1Co59P+TEP/WQEfNIxL78WAqNW2cSJndXJT/wyH2HyyTDxImXohHZZpp9pTRzbMFxZShJPoeeUbtwU6qeoKQ3GwJhwfOEowlX4JCcS0SesTUwDZgSO6R2fXPHkzq1iwY3ngpGfswVxO8aRE/rTmnVgfaXOZjrLBMUVO8w89DMPF6G4v5g3uvO0YuYnx2e5VCwteNaCnHwZJK8OAzfED2EFOSqrrAdxx2lTOmmTWWfxE5bZBj9MTjAwDX/idDuKRayiTV3XfMJHR1EmPYQDUbnvlo4rp3PnzNHn6nBlMtSBaHK5gtqxk1eXWiIBTQCeWv2s2rpth+5wnRevZs6cXrEfloczWftXrbxMOx935nJVljMn1RxXQmliLQ5V0ftcSdihDm0lcb/kpBP04KJyClLXSqtWyLF/2GkH4O3AXl++pyOxscxdUPh5bg7DYY6DfMWyZXZOQESZXH3mVUrWTJkl6gxhi+VubKmsRvgk+KFM5iAGz32+8tb4wlMq2HTCZwfyqOstaXBo4VDouBOOX6HOecXZsCl3pzn9mE3g6LnbsHdzzboNUNrcAfLE6mc8ncmOPeulp6vZs2Y6g4Fx573utbh/a54n7WmYSalGVKwDOSjNgzlYhRMy7g8PPYoZkMHQ/CyTMzdf/OxncD/YbKcuqIBeNBICFCL/1V13a1MGhnUcNqM/8dQzzv5aPz6kbtwPe+m7LlatmAUiTMn7wto1TlsZ14+T1Z4Ek5Byg+AxHd6vgyLr2iUHJZxicU0nfOKLyJUfw+S1JCRr3jmc8IVP+z/FQoyERceOFbGB5Uic+HWE/Yfl1nJMI/UVGHyyDFlpDYIh9aAYwinTamUxLdtBmFIW/dJWKTeoHL6juFZAfsKRsJmHfv4Ij2nCHNPgffXPX1jmSRx/1DV4EvdVVPUGYqAZHL/F5MjkNRZnc8cYZVKKLpzDN7kiz9sxeRPzcbHGUoLNN14MCNezuKf1jmVwQYvn4Jhl0O/ngEFx5KimEsw0vOSCC2AuZ7UUTakN4bKuVnstTi7vzCfzs66WabalyAp3Zn7+3DL4xXRxx3rwJ+ml7bpMcndDZxDF1d9ef10AzzqUyHwxxf0NJ3x0yO+ByJQgm8QMU96XQ0HtFRmfCl4WSmsHVi/FfBfUqGbgpOU27EWVzqMCSgtOfYoyOrWa4yFGPBjK/aqXcfbMk6oLBzZxEIibNXumVjalflRAu1GGXh22M5OoeBoxZWlRgmluQHUE+0lJiRY4pOdBTJoQEUOYHGy7YQ59GCbSUoaULU/CJ5wdO3dDoZVDpqz8K5cv03sKRLUlbO5hJs7oqDxTOeehsxS7iCvC4x7hnbBO5Xs6xmGQ9qEOd+EXKt+xjvht1JmOoj+C36Y2GabKN4AjXcpOFGcjXIKaeM447RS9KZtcno6D5rhjj9P24kwf5ji996Nbblebtm7VxCDprIHmzXf2WWeombA/l7qQQN5w3uuhGM9y4pif3NIhcBsguarpCGP9+o2erwAvrX5uzQuasAk7yNlEqR54+HEnL9vHld3L3/NO56oiK11WrYXJsNRX4OmvkR4Mliw/gAHoPy0ZMJ+F0nqy5ImeLgYazvFd0K4PBAM68hKN+9bysWOZhp0thlVlhBnPT38twmc++bQL7KAyySVFoWQ65uPP72TwmfEkNtNJ3UzRRNphlmHmoV/XFfVg/aTNbB/9tN2X9jKdTAAQrul0vfG1oqNfYEkaxgFmDBdzpx577DGvcZIkOoqf1anxKEZM1PSpjYEx4fhAoUfhDUMpuRYVPmHA5IJUgPkzOb6f+1HUITfmiqmZLqgcckJTCWa4XiXYD8/ktPSLM5VWiTOfVFY1d0d9WWd+4ajryJeD79gOgW/ixIQjfqbzf+0YBzzRHDRyARgYK8K/Dx2Z8YsKZn3Y0X2H+87FOTtLhLARBeUvr60kJS3TcaGKBzLRT8dO5knGvE2F/mqOyigXdlwXUw8+/AgUbddyku944JV1YbSb0u+jzshTgS2C5VtrAFJppfIaXhfWsayOX7HcA5JmyTw8i/tzRWmltef2Hbv1wA5rGsuBLf9h4O3nwLGWxzh4EN65bNmyEkQdTzlRgD01gRyU4NuwcfFtQvismjUj4yqoJPY/wim+c+ZiZdRe9WXciuUrPAc2hTXr+zffomd/EviKaAfQtFu3BpGFDhLSK3C3LI8Yl8EVBs8kbk2A4OAPPvSYGoT5gfnOzM82dXS0QZF9lz4ljWXovPmcen7NGj2QmJ5xMCdQDwCe3qSCL1uQ0+WUy2uhyK4Meh/FVWJgrDh+ZckBMeBSWgn2dK9PCyGRkJvpaUb7HePI6EQpDADtRJFI9Bw6YIijKGE6pqF4xXS1CN+fT9cNsCl6aII0E9j+Mq6hZzoqrlJnphWzZL6jYxz9hFXSIqAHMzY0Kx3qGevt7U1v3rzZNTByUkQePwa8Pe5/G4UjDExRDEwojg+u1SrcLgzf5MCW8uiujFLWJofmdT4mhw6bktQnIwNOmNOmv+C2I+H41kozFG1edxQimrCO1RRZqRc5PttKnPAX9gVhPMTDSJEVxNXxnFCEj879BUSWHSbxBrXhxQMH/2RwKLtQdAEqgoNDOZXm/bUGQVNBte6vdYn82KW9eiujaQYQVMbBvsPqwKG+oFfV4yCNHL9iGeWP0HSsIxXnI/1HoLy7iixt+Ldt36kHBQBoQocp9wDa+RPkyZltM4GT8PFu7+zZs4sQdcxXkT8EA+G9E5JhIkSfcuqpv8aR4OcL4bNO+jQGPKVBXO55OUyVaXZgplu5YoXqxAyOYyrBzIYjky5Aab4BJyPv0xdEu+bQRrJAL+vA2Sauvk7vmq7tjIISso5cqHruhedtIrfk9Axmgh548DHYBNEeyOLwMEHYOmvWjONWrVolx0oHgYzihomBCcXx6607lD1IIe58v5XPq66Qx4uIYMKlElxtvp+MmqYOFHco6hBGvU5ORqaSyjLMAeeHwXqQUwt88WsxruSaKsfj5RimN9uRH+cjRq5RGKi/VxtVYgQnwsAEwMCk5PjgjmnhlGE4JMf3K8FMq5VgyNeOvIyEphJMjk81gaIIN5Nwm2S9jjCtL5HLySUv60vY4uSLImFyfPnCWGktGR9fhnYowkZOyRE9R4OBSUn4aPCtECNWVxMlKOPv3XfgrX2H++ebB9j2DwxZZsk21khR3fPm2nFYSEKYlr3HL1+merEaDPKzU9Z+yGDrx5U8lNOtwaVnXPTeV4o3Qv20POW1P1I3Ej5EpEEMwh8hXZbEbw+Ag7gyCLbQkWskBurv1UaWOkawTj31tN+Bns5xuDvKpZ8cXeiZBPfys85U07FKKwov405YsVLfA2Xa8tesNrBJ/eB5wyyZsLiB5Q84GXmItvfGFCe5vjimQ9124R6rpevXr48IXRDTpOdk5fh1oQNiB2hLE1Roer4X7mqNCGuGxRJ1ahu9+QHzKyQw+RS/JWJZCq0/D8NMB8KP4Xx8KrIR4QchqYFxkXLbQGRGoCYPBqY0xwcXbSM3N0Udf9eQ01Kp5C+mZSCL+3IVmObKnJsXZ+3oklD404Fnc/wEvgLyVWF5QY7xVGTxxQhOEJQpihsxBqY04QMr3wMxraqBndju3XvfiWs85zoDBKR3+HC/vk/WFH/md8/TgwGaQghIyyx585ZtrlkyYAFuBlsSb0RdBjkAqrjDXV1dQ1XeR68ahIGIuwCRp5566uPguKc7hI84+u0PgEY1jwN85dkvrbg31+wHcm0uXD3w4KPanNjg7gdwYvLShx56KFqEMhE2jv6pzvHrQa1eBiaRmoTvzyiiSjXRiTD43hR1bDgxiDDR6qsfqeMYrvrdHcd6RUVHGGgqBiKOD/SCU9dUgk1OHvZlIMfnWoB8HRimA7fviJRWjYoJ8ycifEtT/X8gzAXVegWKaQKnG1+eSCVnhhI+VsWwEpuFIvtdwDvCAWC7Icj4PBUqchMEA5FyO4yOgBL8Arj4yjDCt0H14Wjy4x5++OHqtyMPo9woaeMxEHH8OnHai/2sUFprrgQDHJYDylRkI8KvE7fjkcz5Fo9H4VGZEQbGCwMR4Y8X5qNyxxUDEeGPK/qjwscLA/8fzRhRNz+6X8sAAAAASUVORK5CYII=';



function createPanel(_hyperscript, ttd, timeline, domRestorer, recorder) {
	var selectedElement = null;
	var position = 'bottom';
	var consoleHistory = [];
	var historyIndex = -1;

	// Highlight overlay
	var hl = document.createElement('div');
	hl.style.cssText = 'position:fixed;pointer-events:none;border:2px solid #4a84c4;background:rgba(74,132,196,.12);z-index:2147483646;transition:all .15s ease-out;display:none';
	document.body.appendChild(hl);
	function showHL(el) { var r = el.getBoundingClientRect(); hl.style.display = 'block'; hl.style.top = r.top+'px'; hl.style.left = r.left+'px'; hl.style.width = r.width+'px'; hl.style.height = r.height+'px'; }
	function hideHL() { hl.style.display = 'none'; }

	// Build DOM
	var root = document.createElement('div');
	root.id = 'hs-debugger';
	root.innerHTML =
		'<div class="d-resize"></div>' +
		'<div class="d-root">' +
			'<div class="d-toolbar">' +
				'<img class="d-logo" src="' + LOGO_DATA + '" alt="">' +
				'<span class="d-title">hyper<em>s</em>cript</span>' +
				'<button class="d-btn d-dock" data-dock="bottom" title="Dock bottom">\u2581</button>' +
				'<button class="d-btn d-dock" data-dock="right" title="Dock right">\u2595</button>' +
				'<button class="d-btn d-btn-close" title="Close (Ctrl+.)">\u00d7</button>' +
			'</div>' +
			'<div class="d-body">' +
				'<div class="d-el-list">' +
					'<input class="d-el-search" placeholder="Filter elements…" spellcheck="false" autocomplete="off">' +
					'<div class="d-el-items"></div>' +
				'</div>' +
				'<div class="d-split" data-pane="list"></div>' +
				'<div class="d-detail">' +
					'<div class="d-detail-toolbar">' +
						'<div class="d-dbg-btns">' +
							'<button class="d-dbg-btn d-step-back" title="Step Back (F9)">\u25c0</button>' +
							'<button class="d-dbg-btn d-step" title="Step (F10)">\u25b6</button>' +
							'<button class="d-dbg-btn d-step-over" title="Step Over (F11)">\u21bb</button>' +
							'<button class="d-dbg-btn d-continue" title="Continue (F8)">\u25b6\u25b6</button>' +
							'<button class="d-dbg-btn d-stop" title="Stop">\u25a0</button>' +
						'</div>' +
					'</div>' +
					'<div class="d-detail-content">' +
						'<div class="d-empty">Select an element to inspect</div>' +
					'</div>' +
				'</div>' +
				'<div class="d-split" data-pane="timeline"></div>' +
				'<div class="d-timeline">' +
					'<div class="d-tl-hdr">' +
						'<span class="d-tl-title">Timeline</span>' +
						'<span class="d-tl-spacer"></span>' +
						'<button class="d-tl-btn d-tl-live" title="Resume live execution">Live</button>' +
						'<button class="d-tl-btn d-tl-clear" title="Clear recorded timeline">Clear</button>' +
					'</div>' +
					'<div class="d-tl-body">' +
						'<div class="d-tl-track-wrap"><div class="d-tl-track"></div></div>' +
					'</div>' +
				'</div>' +
				'<div class="d-split" data-pane="console"></div>' +
				'<div class="d-console">' +
					'<div class="d-con-scroll">' +
						'<div class="d-con-out"></div>' +
						'<div class="d-con-in">' +
							'<span class="d-prompt">_ &gt;</span>' +
							'<input class="d-input" spellcheck="false" autocomplete="off">' +
						'</div>' +
					'</div>' +
				'</div>' +
			'</div>' +
		'</div>';
	document.body.appendChild(root);

	var $ = function(s) { return root.querySelector(s); };
	var $$ = function(s) { return root.querySelectorAll(s); };
	var conOut = $('.d-con-out');
	var conIn = $('.d-input');
	var conScroll = $('.d-con-scroll');

	var body = $('.d-body');

	// Pane sizes (px) for the three fixed-size panes; the control sub-panel
	// (.d-detail) gets the remaining 1fr. Tracked separately per dock since
	// widths and heights aren't interchangeable.
	var DEFAULT_SIZES = {
		bottom: { list: 200, timeline: 260, console: 300 },
		right:  { list: 140, timeline: 180, console: 200 },
	};
	var MIN_SIZE = 60;
	var paneSizes = {
		bottom: Object.assign({}, DEFAULT_SIZES.bottom),
		right:  Object.assign({}, DEFAULT_SIZES.right),
	};

	// Build the grid track list for the .d-body grid in the active dock.
	// Track order matches DOM order: list · split · detail · split · timeline · split · console.
	function buildGridTracks() {
		var s = paneSizes[position];
		return s.list + 'px 6px 1fr 6px ' + s.timeline + 'px 6px ' + s.console + 'px';
	}

	function applyGridTracks() {
		var tracks = buildGridTracks();
		if (position === 'right') {
			body.style.gridTemplateColumns = '1fr';
			body.style.gridTemplateRows = tracks;
		} else {
			body.style.gridTemplateColumns = tracks;
			body.style.gridTemplateRows = '';
		}
	}

	// Dock
	function setDock(pos) {
		position = pos;
		root.className = 'hs-' + pos;
		root.style.width = ''; root.style.height = '';
		applyGridTracks();
		for (var b of $$('.d-dock')) b.classList.toggle('active', b.dataset.dock === pos);
		if (typeof renderTimeline === 'function') renderTimeline();
		saveState();
	}
	for (var b of $$('.d-dock')) b.addEventListener('click', function() { setDock(this.dataset.dock); });
	$('.d-btn-close').addEventListener('click', function() { root.classList.add('hs-hidden'); hideHL(); });

	// Resize the whole debugger panel from its outer edge.
	$('.d-resize').addEventListener('mousedown', function(e) {
		e.preventDefault();
		var sx = e.clientX, sy = e.clientY, sw = root.offsetWidth, sh = root.offsetHeight;
		function mv(e) { if (position === 'bottom') root.style.height = Math.max(100, sh + sy - e.clientY) + 'px'; else root.style.width = Math.max(200, sw + sx - e.clientX) + 'px'; }
		function up() { document.removeEventListener('mousemove', mv); document.removeEventListener('mouseup', up); }
		document.addEventListener('mousemove', mv); document.addEventListener('mouseup', up);
	});

	// Generic pane splitter. Each .d-split has data-pane="list|timeline|console"
	// telling us which fixed pane it resizes (the one immediately to its left in
	// bottom dock, above it in right dock). Drag direction maps to dock axis.
	for (var sp of $$('.d-split')) {
		sp.addEventListener('mousedown', function(e) {
			e.preventDefault();
			var paneName = this.dataset.pane;
			var horizontal = position !== 'right';
			var dock = position;
			var startCoord = horizontal ? e.clientX : e.clientY;
			var startSize = paneSizes[dock][paneName];
			// `list` and `timeline` splitters sit *after* their pane (drag right/down = grow).
			// `console` splitter sits *before* the console pane (drag left/up = grow).
			var sign = (paneName === 'console') ? -1 : 1;
			function mv(e) {
				var coord = horizontal ? e.clientX : e.clientY;
				var delta = (coord - startCoord) * sign;
				paneSizes[dock][paneName] = Math.max(MIN_SIZE, startSize + delta);
				applyGridTracks();
			}
			function up() { document.removeEventListener('mousemove', mv); document.removeEventListener('mouseup', up); saveState(); }
			document.addEventListener('mousemove', mv); document.addEventListener('mouseup', up);
		});
	}

	// Click anywhere in the console focuses the input — unless a text selection is active
	// (using 'click' not 'mousedown' so drag-to-select isn't hijacked).
	$('.d-console').addEventListener('click', function(e) {
		var sel = window.getSelection && window.getSelection();
		if (sel && sel.toString().length > 0) return;
		var t = e.target;
		if (t.tagName === 'INPUT' || t.tagName === 'A' || t.tagName === 'BUTTON') return;
		if (t.classList && t.classList.contains('d-log-coll-item')) return;
		conIn.focus();
	});

	// Elements
	function refreshElements() {
		var items = $('.d-el-items');
		var sel = _hyperscript.config.attributes.replaceAll(' ', '').split(',').map(function(a) { return '[' + a + ']'; }).join(',');
		var els = document.querySelectorAll(sel);
		items.innerHTML = '';
		for (var el of els) {
			if (root.contains(el)) continue;
			var item = document.createElement('div');
			item.className = 'd-el-item';
			if (el === selectedElement) item.classList.add('selected');
			var tag = '<span class="d-tag">&lt;' + el.tagName.toLowerCase() + '&gt;</span>';
			var id = el.id ? '<span class="d-id">#' + el.id + '</span>' : '';
			var cls = el.className && typeof el.className === 'string' ? '<span class="d-cls">.' + el.className.trim().split(/\s+/).join('.') + '</span>' : '';
			item.innerHTML = tag + id + cls;
			item._ref = el;
			item.addEventListener('mouseenter', function() { showHL(this._ref); });
			item.addEventListener('mouseleave', function() { if (selectedElement !== this._ref) hideHL(); });
			item.addEventListener('click', function() {
				for (var i of $$('.d-el-item')) i.classList.remove('selected');
				this.classList.add('selected');
				selectElement(this._ref);
				this._ref.scrollIntoView({ behavior: 'smooth', block: 'center' });
				showHL(this._ref);
			});
			items.appendChild(item);
		}
		if (!items.children.length) items.innerHTML = '<div class="d-empty">No hyperscript elements found</div>';
		applyElementFilter();
	}

	// Auto-refresh the element panel when hyperscript elements are added/removed or
	// gain/lose a script attribute. Debounced to one call per animation frame.
	var hsAttrNames = _hyperscript.config.attributes.replaceAll(' ', '').split(',');
	var hsSelectorForObserver = hsAttrNames.map(function(a) { return '[' + a + ']'; }).join(',');
	var refreshScheduled = false;
	function scheduleRefresh() {
		if (refreshScheduled) return;
		// During time-travel we're intentionally undoing/redoing DOM mutations;
		// the element panel shouldn't react to those transient changes.
		if (recorder.timeTraveling) return;
		refreshScheduled = true;
		requestAnimationFrame(function() {
			refreshScheduled = false;
			if (recorder.timeTraveling) return;
			// Detail reset fires even when panel is hidden, so breakpoints/ref stay consistent
			if (selectedElement && (
				!document.documentElement.contains(selectedElement) ||
				(selectedElement.matches && !selectedElement.matches(hsSelectorForObserver))
			)) {
				resetDetail();
			}
			if (!root.classList.contains('hs-hidden')) refreshElements();
		});
	}

	// Reset the detail pane back to the "Select an element to inspect" default.
	// Triggered when the currently-selected element is removed from the DOM
	// or loses all hyperscript attributes.
	function resetDetail() {
		selectedElement = null;
		if (monacoEditor) { try { monacoEditor.dispose(); } catch (e) {} monacoEditor = null; }
		bpDecorations = [];
		debugDecorations = [];
		// Only the content area is rebuilt — the toolbar row is a stable, persistent
		// node and must never be wiped or moved.
		$('.d-detail-content').innerHTML = '<div class="d-empty">Select an element to inspect</div>';
		hideHL();
		updateToolbarState();
		saveState();
	}

	if (typeof MutationObserver !== 'undefined') {
		var elObserver = new MutationObserver(function(records) {
			for (var rec of records) {
				if (root.contains(rec.target)) continue;
				if (rec.type === 'attributes') {
					scheduleRefresh();
					return;
				}
				if (rec.type === 'childList') {
					for (var n of rec.addedNodes) {
						if (n.nodeType !== 1) continue;
						if (n.matches && n.matches(hsSelectorForObserver)) { scheduleRefresh(); return; }
						if (n.querySelector && n.querySelector(hsSelectorForObserver)) { scheduleRefresh(); return; }
					}
					for (var n of rec.removedNodes) {
						if (n.nodeType !== 1) continue;
						if (n.matches && n.matches(hsSelectorForObserver)) { scheduleRefresh(); return; }
						if (n.querySelector && n.querySelector(hsSelectorForObserver)) { scheduleRefresh(); return; }
					}
				}
			}
		});
		whenDomReady(function() {
			elObserver.observe(document.documentElement, {
				childList: true,
				subtree: true,
				attributes: true,
				attributeFilter: hsAttrNames,
			});
		});
	}

	function applyElementFilter() {
		var search = $('.d-el-search');
		var query = (search && search.value || '').trim().toLowerCase();
		for (var item of $$('.d-el-item')) {
			var match = !query || item.textContent.toLowerCase().indexOf(query) !== -1;
			item.style.display = match ? '' : 'none';
		}
	}

	$('.d-el-search').addEventListener('input', applyElementFilter);
	$('.d-el-search').addEventListener('keydown', function(e) {
		if (e.key === 'Escape') { this.value = ''; applyElementFilter(); }
	});

	// Monaco loader
	var monacoReady = null;
	var monacoEditor = null;

	function loadMonaco() {
		if (monacoReady) return monacoReady;
		monacoReady = new Promise(function(resolve) {
			if (window.monaco) {
				console.warn('[hs-debugger] Monaco already loaded globally — reusing existing instance.');
				registerHyperscriptLanguage();
				resolve(window.monaco);
				return;
			}
			var loaderScript = document.createElement('script');
			loaderScript.src = 'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs/loader.js';
			loaderScript.onload = function() {
				window.require.config({ paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs' } });
				window.require(['vs/editor/editor.main'], function() {
					registerHyperscriptLanguage();
					resolve(window.monaco);
				});
			};
			document.head.appendChild(loaderScript);
		});
		return monacoReady;
	}

	function registerHyperscriptLanguage() {
		if (window.monaco.languages.getLanguages().some(function(l) { return l.id === 'hyperscript'; })) return;
		window.monaco.languages.register({ id: 'hyperscript' });
		window.monaco.languages.setMonarchTokensProvider('hyperscript', {
			keywords: [
				'on', 'send', 'trigger', 'take', 'put', 'set', 'get', 'add', 'remove', 'toggle',
				'hide', 'show', 'wait', 'settle', 'fetch', 'call', 'log', 'throw', 'return',
				'exit', 'halt', 'repeat', 'for', 'while', 'until', 'if', 'else', 'end',
				'then', 'from', 'to', 'into', 'by', 'in', 'of', 'with', 'as', 'at',
				'when', 'changes', 'live', 'bind', 'init', 'immediately',
				'increment', 'decrement', 'default', 'transition', 'async', 'tell',
				'go', 'render', 'continue', 'break', 'append', 'prepend',
			],
			builtins: [
				'me', 'my', 'I', 'it', 'its', 'you', 'your', 'yourself',
				'result', 'event', 'target', 'detail', 'sender', 'body',
				'the', 'a', 'an', 'no', 'not', 'and', 'or', 'is', 'am',
				'closest', 'next', 'previous', 'first', 'last', 'random',
			],
			tokenizer: {
				root: [
					[/--.*$/, 'comment'],
					[/"[^"]*"|'[^']*'/, 'string'],
					[/`[^`]*`/, 'string'],
					[/\$\w+/, 'variable'],
					[/:\w+/, 'variable.element'],
					[/\^\w+/, 'variable.dom'],
					[/@[\w-]+/, 'attribute'],
					[/\*[\w-]+/, 'attribute.style'],
					[/#[\w-]+/, 'tag'],
					[/\.[\w-]+/, 'tag.class'],
					[/<[^>]+\/>/, 'tag.query'],
					[/\d+(\.\d+)?(ms|s|px|em|rem|%)?/, 'number'],
					[/[a-zA-Z_]\w*/, { cases: { '@keywords': 'keyword', '@builtins': 'type', '@default': 'identifier' } }],
				],
			},
		});
		window.monaco.editor.defineTheme('hyperscript-light', {
			base: 'vs',
			inherit: true,
			rules: [
				{ token: 'keyword', foreground: '4a84c4', fontStyle: 'bold' },
				{ token: 'type', foreground: '7a5a8a' },
				{ token: 'string', foreground: '2b6b1f' },
				{ token: 'variable', foreground: 'c05020' },
				{ token: 'variable.element', foreground: 'c05020' },
				{ token: 'variable.dom', foreground: 'c05020' },
				{ token: 'attribute', foreground: '8a6d00' },
				{ token: 'attribute.style', foreground: '8a6d00' },
				{ token: 'tag', foreground: '2b6b1f' },
				{ token: 'tag.class', foreground: '8a6d00' },
				{ token: 'tag.query', foreground: '4a84c4' },
				{ token: 'number', foreground: 'c05020' },
				{ token: 'comment', foreground: '999999', fontStyle: 'italic' },
			],
			colors: {
				'editor.background': '#f6f6f6',
			},
		});
	}

	function showInEditor(container, text) {
		return loadMonaco().then(function(monaco) {
			// Container may have been detached while Monaco was loading — bail out cleanly
			if (!container.isConnected) return null;
			if (monacoEditor && monacoEditor.getContainerDomNode().parentNode === container) {
				monacoEditor.setValue(text);
				return monacoEditor;
			}
			if (monacoEditor) { monacoEditor.dispose(); monacoEditor = null; }
			monacoEditor = monaco.editor.create(container, {
				value: text,
				language: 'hyperscript',
				theme: 'hyperscript-light',
				readOnly: true,
				minimap: { enabled: false },
				scrollBeyondLastLine: false,
				lineNumbers: 'on',
				lineNumbersMinChars: 1,
				glyphMargin: true,
				renderLineHighlight: 'none',
				overviewRulerLanes: 0,
				hideCursorInOverviewRuler: true,
				scrollbar: { vertical: 'auto', horizontal: 'auto' },
				fontSize: 13,
				fontFamily: '"IBM Plex Mono", "SF Mono", "Consolas", monospace',
				fontWeight: '600',
				wordWrap: 'off',
				automaticLayout: true,
			});
			setupGutterBreakpoints();
			updateBreakpointDecorations();
			return monacoEditor;
		});
	}

	// =================================================================
	// Debugger: breakpoints & stepping
	// =================================================================

	var breakpoints = new Map();    // element -> Set<lineNumber>
	var pausedCommand = null;
	var pausedCtx = null;
	var pausedElement = null;
	var breakOnNext = false;
	var skipNextBreak = false;
	var stepOverDepth = -1;
	// When stepping, remember the execution stream we were paused in so a *new* event
	// handler on the same element doesn't accidentally trigger the pending break.
	var stepStreamId = null;
	var debugDecorations = [];

	function getBreakpointsFor(el) {
		if (!breakpoints.has(el)) breakpoints.set(el, new Set());
		return breakpoints.get(el);
	}

	function sameStep(ctx) {
		if (!stepStreamId) return true;
		var sid = ctx && ctx.meta && ctx.meta.ttd_streamId;
		return sid === stepStreamId;
	}

	function shouldBreak(command, ctx) {
		if (skipNextBreak) { skipNextBreak = false; return false; }
		if (breakOnNext) {
			if (!sameStep(ctx)) { breakOnNext = false; stepStreamId = null; return false; }
			return true;
		}
		if (stepOverDepth >= 0) {
			if (!sameStep(ctx)) { stepOverDepth = -1; stepStreamId = null; return false; }
			var depth = 0;
			for (var p = command.parent; p; p = p.parent) depth++;
			if (depth <= stepOverDepth) return true;
			return false;
		}
		var el = ctx.meta.owner || ctx.me;
		var bps = breakpoints.get(el);
		if (!bps || !command.startToken) return false;
		return bps.has(command.startToken.line);
	}

	function pauseAt(command, ctx) {
		// Auto-continue past implicit returns (end of on/init features)
		if (command.type === 'implicitReturn') {
			breakOnNext = false;
			stepOverDepth = -1;
			stepStreamId = null;
			return false; // signal: don't prevent the event
		}

		pausedCommand = command;
		pausedCtx = ctx;
		pausedElement = ctx.meta.owner || ctx.me;
		breakOnNext = false;
		stepOverDepth = -1;
		stepStreamId = null;
		root.classList.add('hs-paused');

		// Show the paused element in the editor
		if (pausedElement && pausedElement !== selectedElement) {
			selectElement(pausedElement);
			for (var i of $$('.d-el-item')) {
				i.classList.toggle('selected', i._ref === pausedElement);
			}
		}

		// Highlight current line in Monaco
		if (monacoEditor && command.startToken) {
			var line = command.startToken.line;
			// For implicit returns, show line past the last real command
			debugDecorations = monacoEditor.deltaDecorations(debugDecorations, [{
				range: new window.monaco.Range(line, 1, line, 1),
				options: {
					isWholeLine: true,
					className: 'hs-dbg-current-line',
					glyphMarginClassName: 'hs-dbg-current-glyph',
				}
			}]);
			monacoEditor.revealLineInCenter(line);
		}

		updateToolbarState();

		// Flash the editor so the break point is visually obvious
		flashEditor();
		return true; // signal: prevent the event (pause)
	}

	function flashEditor() {
		var edEl = $('.d-editor');
		if (!edEl) return;
		edEl.classList.remove('hs-dbg-flash');
		// force a reflow so restarting the animation works even on rapid re-breaks
		void edEl.offsetWidth;
		edEl.classList.add('hs-dbg-flash');
	}

	function resumeExec() {
		root.classList.remove('hs-paused');
		if (monacoEditor) {
			debugDecorations = monacoEditor.deltaDecorations(debugDecorations, []);
		}
		var cmd = pausedCommand;
		var ctx = pausedCtx;
		pausedCommand = null;
		pausedCtx = null;
		pausedElement = null;
		if (cmd && ctx) {
			skipNextBreak = true;
			_hyperscript.internals.runtime.unifiedExec(cmd, ctx);
		}
		updateToolbarState();
	}

	// Install beforeEval listener
	document.addEventListener('hyperscript:beforeEval', function(evt) {
		var command = evt.detail.command;
		var ctx = evt.detail.ctx;
		if (shouldBreak(command, ctx)) {
			if (pauseAt(command, ctx)) {
				evt.preventDefault();
			}
		}
	});

	// Render a recorded timeline step (used during time-travel navigation).
	// Always ensures the paused UI (buttons, vars panel) is visible and updates
	// the current-line decoration *synchronously* when the editor is already up.
	function renderTimelineStep(step) {
		if (!step) return;
		root.classList.add('hs-paused');
		var owner = step.ownerElement;
		var needsEditorSwap = owner && owner instanceof Element && owner !== selectedElement;
		if (needsEditorSwap) {
			var editorReady = selectElement(owner);
			for (var i of $$('.d-el-item')) i.classList.toggle('selected', i._ref === owner);
			if (editorReady && typeof editorReady.then === 'function') {
				editorReady.then(function() { applyStepDecoration(step); });
			} else {
				applyStepDecoration(step);
			}
		} else {
			// Same element, editor is live — update synchronously so a later navigation
			// can't race ahead and land a stale decoration.
			applyStepDecoration(step);
		}
		// Keep the timeline panel in sync when stepping via the toolbar / keys.
		if (typeof syncTimelineToStep === 'function') syncTimelineToStep(step.index);
		updateToolbarState();
	}

	function applyStepDecoration(step) {
		if (!monacoEditor || !step || !step.line) return;
		debugDecorations = monacoEditor.deltaDecorations(debugDecorations, [{
			range: new window.monaco.Range(step.line, 1, step.line, 1),
			options: { isWholeLine: true, className: 'hs-dbg-current-line', glyphMarginClassName: 'hs-dbg-current-glyph' }
		}]);
		monacoEditor.revealLineInCenter(step.line);
	}

	// Debugger actions — also exposed on public API
	function stepForward() {
		// Time-travel: advance through the recorded timeline, restricted to the
		// current event-handler stream.
		if (recorder.timeTraveling) {
			// Walk the entire recorded timeline (no stream scoping).
			var target = ttd.current + 1;
			if (target <= timeline.lastIndex) {
				ttd.goto(target);
				renderTimelineStep(timeline.getStep(target));
				return;
			}
			// Past the last recorded step — exit time-travel and restore the live pause view
			ttd.resume();
			if (pausedCommand) {
				showLivePause(pausedCommand, pausedCtx);
			} else {
				root.classList.remove('hs-paused');
				if (monacoEditor) debugDecorations = monacoEditor.deltaDecorations(debugDecorations, []);
			}
			updateToolbarState();
			return;
		}
		if (!pausedCommand) return;
		breakOnNext = true;
		stepStreamId = (pausedCtx && pausedCtx.meta && pausedCtx.meta.ttd_streamId) || null;
		resumeExec();
	}

	// Re-display the live paused command in the UI (used after exiting time-travel)
	function showLivePause(command, ctx) {
		root.classList.add('hs-paused');
		var owner = ctx && ctx.meta && (ctx.meta.owner || ctx.me);
		var needsSwap = owner && owner instanceof Element && owner !== selectedElement;
		if (needsSwap) {
			var editorReady = selectElement(owner);
			for (var i of $$('.d-el-item')) i.classList.toggle('selected', i._ref === owner);
			if (editorReady && typeof editorReady.then === 'function') {
				editorReady.then(function() { applyLineDecoration(command.startToken && command.startToken.line); });
			} else {
				applyLineDecoration(command.startToken && command.startToken.line);
			}
		} else {
			applyLineDecoration(command.startToken && command.startToken.line);
		}
	}

	function applyLineDecoration(line) {
		if (!monacoEditor || !line) return;
		debugDecorations = monacoEditor.deltaDecorations(debugDecorations, [{
			range: new window.monaco.Range(line, 1, line, 1),
			options: { isWholeLine: true, className: 'hs-dbg-current-line', glyphMarginClassName: 'hs-dbg-current-glyph' }
		}]);
		monacoEditor.revealLineInCenter(line);
	}
	function stepOver() {
		if (recorder.timeTraveling) { stepForward(); return; }
		if (!pausedCommand) return;
		stepOverDepth = 0;
		for (var p = pausedCommand.parent; p; p = p.parent) stepOverDepth++;
		stepStreamId = (pausedCtx && pausedCtx.meta && pausedCtx.meta.ttd_streamId) || null;
		resumeExec();
	}
	function continueExec() {
		if (recorder.timeTraveling) {
			// Replay forward to the live edge, exit time-travel
			ttd.resume();
			// Fall through — if there was a live pause, resume it; else just clean up UI
		}
		if (pausedCommand) { resumeExec(); return; }
		root.classList.remove('hs-paused');
		if (monacoEditor) debugDecorations = monacoEditor.deltaDecorations(debugDecorations, []);
		updateToolbarState();
	}
	function stopExec() {
		if (recorder.timeTraveling) ttd.resume();
		pausedCommand = null;
		pausedCtx = null;
		pausedElement = null;
		breakOnNext = false;
		stepOverDepth = -1;
		stepStreamId = null;
		root.classList.remove('hs-paused');
		if (monacoEditor) debugDecorations = monacoEditor.deltaDecorations(debugDecorations, []);
		updateToolbarState();
	}
	function stepBack() {
		if (timeline.length === 0) return;
		// Walk the entire recorded timeline (no stream scoping). From a live state,
		// the latest recorded step is the first candidate; while time-traveling, the
		// immediately-earlier step.
		var scanFrom = recorder.timeTraveling ? ttd.current : timeline.lastIndex + 1;
		var target = scanFrom - 1;
		if (target < timeline.firstIndex) return; // already at the beginning
		root.classList.add('hs-paused');
		ttd.goto(target);
		renderTimelineStep(timeline.getStep(target));
	}

	// Per-state predicates for the debug toolbar. The toolbar is always visible;
	// buttons are enabled/disabled rather than shown/hidden. Stepping walks the
	// whole recorded timeline (no stream scoping), so the bounds are simply the
	// first/last recorded step.
	function canStepBack() {
		if (timeline.length === 0) return false;
		// From a live state, Step Back enters time-travel at the latest step.
		// While traveling, it's available until we reach the earliest step.
		return !recorder.timeTraveling || ttd.current > timeline.firstIndex;
	}
	function canStepFwd() {
		if (recorder.timeTraveling) {
			// Enabled while there are later steps, or there's a live pause to return to.
			return ttd.current < timeline.lastIndex || !!pausedCommand;
		}
		return !!pausedCommand;
	}
	function canContinue()   { return !!pausedCommand || recorder.timeTraveling; }
	function canStop()       { return !!pausedCommand || recorder.timeTraveling; }

	// Reflect current debugger state onto the toolbar buttons' disabled flags.
	function updateToolbarState() {
		var back = $('.d-step-back'), step = $('.d-step'), over = $('.d-step-over'),
			cont = $('.d-continue'), stop = $('.d-stop');
		if (!back) return;
		back.disabled = !canStepBack();
		step.disabled = !canStepFwd();
		over.disabled = !canStepFwd();
		cont.disabled = !canContinue();
		stop.disabled = !canStop();
	}

	// Toolbar buttons
	$('.d-step-back').addEventListener('click', function() { if (!this.disabled) stepBack(); });
	$('.d-step').addEventListener('click', function() { if (!this.disabled) stepForward(); });
	$('.d-step-over').addEventListener('click', function() { if (!this.disabled) stepOver(); });
	$('.d-continue').addEventListener('click', function() { if (!this.disabled) continueExec(); });
	$('.d-stop').addEventListener('click', function() { if (!this.disabled) stopExec(); });

	// Keyboard shortcuts — gated per-state to mirror the toolbar buttons.
	// Only active while the panel is visible so we don't hijack function keys
	// on pages that merely loaded the debugger.
	document.addEventListener('keydown', function(e) {
		if (root.classList.contains('hs-hidden')) return;
		if (e.key === 'F9') { if (canStepBack()) { e.preventDefault(); stepBack(); } }
		else if (e.key === 'F10') { if (canStepFwd()) { e.preventDefault(); stepForward(); } }
		else if (e.key === 'F11') { if (canStepFwd()) { e.preventDefault(); stepOver(); } }
		else if (e.key === 'F8') { if (canContinue()) { e.preventDefault(); continueExec(); } }
	});

	// =================================================================
	// Timeline panel
	//
	// A graphical view of the recorded command timeline. Steps are drawn
	// as ticks; clicking a tick jumps time-travel to that step. A detail
	// subview shows the selected step's command, diff, locals, and DOM
	// mutations.
	// =================================================================
	var tlSelectedIndex = null;  // currently-viewed step index in the track
	var tlRenderScheduled = false;

	var tlTrackEl = $('.d-tl-track');

	$('.d-tl-live').addEventListener('click', function() {
		if (recorder.timeTraveling) { continueExec(); }
		tlSelectedIndex = null;
		renderTimeline();
		updateToolbarState();
	});
	$('.d-tl-clear').addEventListener('click', function() {
		if (recorder.timeTraveling) continueExec();
		ttd.clear();
		tlSelectedIndex = null;
		renderTimeline();
		updateToolbarState();
	});

	// Append a step live as it is recorded (cheap; full re-render is debounced).
	recorder.onStep = function() {
		// Step Back enablement tracks recorded history — refresh the toolbar.
		updateToolbarState();
		if (root.classList.contains('hs-hidden')) return;
		if (recorder.timeTraveling) return;
		scheduleTimelineRender();
	};

	function scheduleTimelineRender() {
		if (tlRenderScheduled) return;
		tlRenderScheduled = true;
		requestAnimationFrame(function() { tlRenderScheduled = false; renderTimeline(); });
	}

	function renderTimeline() {
		renderTimelineTrack();
	}

	function renderTimelineTrack() {
		var steps = ttd.steps();
		if (!steps.length) {
			tlTrackEl.innerHTML = '<div class="d-tl-empty">No steps recorded yet</div>';
			return;
		}
		tlTrackEl.innerHTML = '';
		var current = ttd.current;
		for (var step of steps) {
			var tick = document.createElement('button');
			tick.className = 'd-tl-tick';
			if (step.error) tick.classList.add('err');
			if (step.isAsync) tick.classList.add('async');
			if (step.index === current && recorder.timeTraveling) tick.classList.add('current');
			if (step.index === tlSelectedIndex) tick.classList.add('selected');
			var src = step.commandSource.trim();
			tick.innerHTML = '<span class="d-tl-tick-idx">#' + step.index + '</span>' +
				'<span class="d-tl-tick-src">' + esc(src) + '</span>';
			tick.title = '#' + step.index + ' ' + src;
			tick._idx = step.index;
			tick._owner = step.ownerElement;
			tick.addEventListener('click', function() { tlGoto(this._idx); });
			tick.addEventListener('mouseenter', function() { if (this._owner instanceof Element) showHL(this._owner); });
			tick.addEventListener('mouseleave', hideHL);
			tlTrackEl.appendChild(tick);
		}
		var cur = tlTrackEl.querySelector('.current, .selected');
		if (cur) cur.scrollIntoView({ block: 'nearest', inline: 'nearest' });
	}

	// Navigate time-travel to a specific step.
	function tlGoto(index) {
		if (ttd.goto(index)) {
			// renderTimelineStep restores the DOM/editor view and calls
			// syncTimelineToStep, which updates the track selection.
			renderTimelineStep(timeline.getStep(index));
		}
	}

	// Update the timeline's selection to match the externally-driven
	// position (toolbar/keyboard stepping). Does not itself navigate.
	function syncTimelineToStep(index) {
		tlSelectedIndex = index;
		renderTimeline();
	}

	// -------------------------------------------------------------
	// Shift-held page highlight mode + middle-click element picker.
	// When Shift is held, the panel is visible, and focus is outside
	// the debugger, overlay halos on every hyperscript element on the
	// page. Middle-click picks one into the element panel.
	// -------------------------------------------------------------
	var shiftHeld = false;
	var shiftOverlays = [];

	function hsAttrList() {
		return _hyperscript.config.attributes.replaceAll(' ', '').split(',');
	}

	function showAllHsHighlights() {
		clearAllHsHighlights();
		var sel = hsAttrList().map(function(a) { return '[' + a + ']'; }).join(',');
		var els = document.querySelectorAll(sel);
		for (var el of els) {
			if (root.contains(el)) continue;
			var r = el.getBoundingClientRect();
			if (r.width === 0 || r.height === 0) continue;
			var ov = document.createElement('div');
			ov.style.cssText = 'position:fixed;pointer-events:none;border:2px solid #4a84c4;background:rgba(74,132,196,.12);z-index:2147483645;top:' + r.top + 'px;left:' + r.left + 'px;width:' + r.width + 'px;height:' + r.height + 'px;box-sizing:border-box';
			ov._ref = el;
			document.body.appendChild(ov);
			shiftOverlays.push(ov);
		}
	}

	function clearAllHsHighlights() {
		for (var ov of shiftOverlays) if (ov.parentNode) ov.parentNode.removeChild(ov);
		shiftOverlays = [];
	}

	function updateShiftMode() {
		var active = shiftHeld
			&& !root.classList.contains('hs-hidden')
			&& !root.contains(document.activeElement);
		if (active) showAllHsHighlights();
		else clearAllHsHighlights();
	}

	document.addEventListener('keydown', function(e) {
		if (e.key === 'Shift' && !shiftHeld) { shiftHeld = true; updateShiftMode(); }
	});
	document.addEventListener('keyup', function(e) {
		if (e.key === 'Shift' && shiftHeld) { shiftHeld = false; updateShiftMode(); }
	});
	window.addEventListener('blur', function() { if (shiftHeld) { shiftHeld = false; updateShiftMode(); } });
	document.addEventListener('focusin', updateShiftMode);
	document.addEventListener('focusout', updateShiftMode);
	window.addEventListener('scroll', function() {
		if (!shiftOverlays.length) return;
		for (var ov of shiftOverlays) {
			var r = ov._ref.getBoundingClientRect();
			ov.style.top = r.top + 'px'; ov.style.left = r.left + 'px';
			ov.style.width = r.width + 'px'; ov.style.height = r.height + 'px';
		}
	}, true);

	// Middle-click on a page hs-element while shift is held → select it.
	// (mousedown catches the event before the browser's autoscroll/paste defaults.)
	document.addEventListener('mousedown', function(e) {
		if (e.button !== 1) return;
		if (!shiftHeld) return;
		if (root.classList.contains('hs-hidden')) return;
		if (root.contains(e.target)) return;
		var attrs = hsAttrList();
		var hit = null;
		for (var node = e.target; node && node.nodeType === 1; node = node.parentElement) {
			if (attrs.some(function(a) { return node.hasAttribute(a); })) { hit = node; break; }
		}
		if (!hit) return;
		e.preventDefault();
		if (selectedElement === hit) return; // already the current selection — no-op
		refreshElements();
		selectElement(hit);
		for (var item of $$('.d-el-item')) item.classList.toggle('selected', item._ref === hit);
	}, true);

	// Shift + middle-click selected Monaco text → evaluate in console
	root.addEventListener('mousedown', function(e) {
		if (e.button !== 1 || !e.shiftKey) return;
		if (!monacoEditor) return;
		if (!e.target.closest || !e.target.closest('.d-editor')) return;
		var sel = monacoEditor.getSelection();
		if (!sel || sel.isEmpty()) return;
		var text = monacoEditor.getModel().getValueInRange(sel);
		if (!text.trim()) return;
		e.preventDefault();
		e.stopPropagation();
		evalHS(text);
	}, true);

	// Monaco gutter click for breakpoints
	function setupGutterBreakpoints() {
		if (!monacoEditor || !selectedElement) return;
		monacoEditor.onMouseDown(function(e) {
			if (e.target.type !== window.monaco.editor.MouseTargetType.GUTTER_GLYPH_MARGIN &&
				e.target.type !== window.monaco.editor.MouseTargetType.GUTTER_LINE_NUMBERS) return;
			var line = e.target.position.lineNumber;
			var bps = getBreakpointsFor(selectedElement);
			if (bps.has(line)) { bps.delete(line); } else { bps.add(line); }
			updateBreakpointDecorations();
			saveState();
		});
	}

	var bpDecorations = [];
	function updateBreakpointDecorations() {
		if (!monacoEditor || !selectedElement) return;
		var bps = breakpoints.get(selectedElement);
		var decs = [];
		if (bps) {
			for (var line of bps) {
				decs.push({
					range: new window.monaco.Range(line, 1, line, 1),
					options: { isWholeLine: true, glyphMarginClassName: 'hs-dbg-bp-glyph', linesDecorationsClassName: 'hs-dbg-bp-line' }
				});
			}
		}
		bpDecorations = monacoEditor.deltaDecorations(bpDecorations, decs);
	}

	function normalizeScript(raw) {
		var lines = raw.split('\n');
		if (lines.length <= 1) return raw.trim();

		// Trim leading/trailing blank lines
		while (lines.length && !lines[0].trim()) lines.shift();
		while (lines.length && !lines[lines.length - 1].trim()) lines.pop();
		if (!lines.length) return '';

		// Find the minimum indent of lines 2+ (continuation lines)
		// These have HTML-level indentation we want to strip
		var minIndent = Infinity;
		for (var i = 1; i < lines.length; i++) {
			if (!lines[i].trim()) continue;
			var indent = lines[i].match(/^(\s*)/)[1].length;
			if (indent < minIndent) minIndent = indent;
		}
		if (minIndent === Infinity) minIndent = 0;

		// First line: strip its own leading whitespace
		var result = [lines[0].trim()];

		// Remaining lines: strip the common indent, then add 2-space indent
		for (var i = 1; i < lines.length; i++) {
			if (!lines[i].trim()) { result.push(''); continue; }
			result.push('  ' + lines[i].substring(minIndent));
		}

		return result.join('\n');
	}

	function selectElement(el) {
		selectedElement = el;
		var content = $('.d-detail-content');
		var script = el.getAttribute('_') || el.getAttribute('script') || el.getAttribute('data-script') || '';
		var t = el.tagName.toLowerCase();
		var id = el.id ? '#' + el.id : '';
		var c = el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).join('.') : '';
		// Rebuild only the content area; the toolbar row above it is persistent.
		content.innerHTML =
			'<div class="d-label">Element</div><div class="d-code">&lt;' + t + id + c + '&gt;</div>' +
			'<div class="d-dbg-toolbar"><span class="d-label">Hyperscript</span></div>' +
			'<div class="d-code-area"><div class="d-editor"></div></div>';
		var editorReady = showInEditor($('.d-editor'), normalizeScript(script));
		updateToolbarState();
		saveState();
		return editorReady;
	}

	// Console
	conIn.addEventListener('keydown', function(e) {
		if (e.key === 'Enter' && this.value.trim()) {
			var src = this.value.trim();
			consoleHistory.push(src);
			historyIndex = consoleHistory.length;
			evalHS(src);
			this.value = '';
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			if (historyIndex > 0) { historyIndex--; this.value = consoleHistory[historyIndex]; }
		} else if (e.key === 'ArrowDown') {
			e.preventDefault();
			if (historyIndex < consoleHistory.length - 1) { historyIndex++; this.value = consoleHistory[historyIndex]; }
			else { historyIndex = consoleHistory.length; this.value = ''; }
		}
	});

	function evalHS(src) {
		log(src, 'input');
		try {
			var rt = _hyperscript.internals.runtime;
			var ctx;
			// When paused, reuse the paused ctx so the REPL sees the live locals,
			// result, it, me, you that the vars panel is showing.
			if (pausedCtx) {
				ctx = pausedCtx;
			} else {
				var target = selectedElement || document.body;
				ctx = rt.makeContext(target, null, target, null);
			}
			var parsed = _hyperscript.parse(src);
			if (parsed && parsed.errors && parsed.errors.length > 0) {
				throw new Error(parsed.errors[0].message);
			}
			var result;
			if (parsed.execute) {
				parsed.execute(ctx);
				result = ctx.meta.returnValue !== undefined ? ctx.meta.returnValue : ctx.result;
			} else {
				result = parsed.evaluate(ctx);
			}
			if (result && result.then) {
				result.then(function(v) { showResult(v); }).catch(function(e) { log(String(e), 'error'); });
			} else {
				showResult(result);
			}
		} catch (e) { log(e.message || String(e), 'error'); }
	}

	function isElColl(v) {
		if (v instanceof NodeList || v instanceof HTMLCollection) return true;
		if (Array.isArray(v) && v.length > 0 && v[0] instanceof Element) return true;
		if (v && v.constructor && v.constructor.name === 'ElementCollection') return true;
		return false;
	}

	function showResult(value) {
		if (value instanceof Element) { showCollection([value]); }
		else if (isElColl(value)) { showCollection(Array.from(value)); }
		else { log(fmt(value), 'result'); }
	}

	function showCollection(items) {
		var c = document.createElement('div');
		c.className = 'd-con-entry d-log-coll';
		c.textContent = 'ElementCollection [' + items.length + ']';
		var elementItems = items.filter(function(el) { return el instanceof Element; });
		for (var el of elementItems) {
			var item = document.createElement('div');
			item.className = 'd-log-coll-item';
			item.textContent = elementDescription(el);
			item._ref = el;
			item.addEventListener('mouseenter', function(e) { e.stopPropagation(); showHL(this._ref); });
			item.addEventListener('click', function() { this._ref.scrollIntoView({ behavior: 'smooth', block: 'center' }); showHL(this._ref); });
			c.appendChild(item);
		}
		// Hovering the header (or anywhere on the entry not covered by a child item) highlights the first element
		c.addEventListener('mouseenter', function() { if (elementItems[0]) showHL(elementItems[0]); });
		c.addEventListener('mouseleave', function() { hideHL(); });
		conOut.appendChild(c);
		scroll();
	}

	function log(text, type) {
		var e = document.createElement('div');
		e.className = 'd-con-entry d-log-' + type;
		e.textContent = text;
		conOut.appendChild(e);
		scroll();
	}

	function scroll() { conScroll.scrollTop = conScroll.scrollHeight; }
	function fmt(v) { if (v === undefined) return 'undefined'; if (v === null) return 'null'; if (typeof v === 'string') return '"' + v + '"'; if (typeof v === 'object') { try { return JSON.stringify(v, null, 2); } catch(e) { return String(v); } } return String(v); }
	function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

	// --------------------------------------------------------------
	// Element identity — survives reloads
	// layered: {id, path, scriptHash}, resolved with graceful fallback
	// --------------------------------------------------------------
	function scriptText(el) {
		return el.getAttribute('_') || el.getAttribute('script') || el.getAttribute('data-script') || '';
	}

	function hashScript(el) {
		var s = scriptText(el);
		if (!s) return null;
		var h = 0;
		for (var i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
		return 'h:' + (h >>> 0).toString(36);
	}

	function cssPath(el) {
		var parts = [];
		for (var node = el; node && node.nodeType === 1 && node !== document.documentElement; node = node.parentElement) {
			var tag = node.tagName.toLowerCase();
			var parent = node.parentElement;
			if (!parent) { parts.unshift(tag); break; }
			var sameTag = [];
			for (var c = parent.firstElementChild; c; c = c.nextElementSibling) {
				if (c.tagName === node.tagName) sameTag.push(c);
			}
			var idx = sameTag.indexOf(node);
			parts.unshift(tag + (sameTag.length > 1 ? ':nth-of-type(' + (idx + 1) + ')' : ''));
		}
		return parts.join('>');
	}

	function elementIdentity(el) {
		if (!el || el.nodeType !== 1 || root.contains(el)) return null;
		return { id: el.id || null, path: cssPath(el), scriptHash: hashScript(el) };
	}

	function hsAttrsSelector() {
		return _hyperscript.config.attributes.replaceAll(' ', '').split(',').map(function(a) { return '[' + a + ']'; }).join(',');
	}

	function resolveIdentity(ident) {
		if (!ident) return null;
		// 1) #id
		if (ident.id) {
			var byId = document.getElementById(ident.id);
			if (byId && (!ident.scriptHash || hashScript(byId) === ident.scriptHash)) return byId;
		}
		// 2) CSS path
		if (ident.path) {
			try {
				var hits = document.querySelectorAll(ident.path);
				if (hits.length === 1 && (!ident.scriptHash || hashScript(hits[0]) === ident.scriptHash)) return hits[0];
				if (hits.length > 1 && ident.scriptHash) {
					var matched = Array.from(hits).filter(function(h) { return hashScript(h) === ident.scriptHash; });
					if (matched.length === 1) return matched[0];
				}
			} catch (e) { /* invalid selector — ignore */ }
		}
		// 3) broaden: any hyperscript element with matching script hash
		if (ident.scriptHash) {
			var all = document.querySelectorAll(hsAttrsSelector());
			var matched2 = Array.from(all).filter(function(h) { return hashScript(h) === ident.scriptHash; });
			if (matched2.length === 1) return matched2[0];
		}
		return null;
	}

	// --------------------------------------------------------------
	// Persistence — restore dock / sizes / collapsed / open / selection / breakpoints
	// --------------------------------------------------------------
	var STATE_KEY = 'hs-debugger-state';
	var stateReady = false;

	function whenDomReady(fn) {
		if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, { once: true });
		else fn();
	}

	function saveState() {
		if (!stateReady) return;
		try {
			var bpEntries = [];
			for (var entry of breakpoints) {
				var el = entry[0], lines = entry[1];
				if (!el || !lines || !lines.size) continue;
				var id = elementIdentity(el);
				if (id) bpEntries.push({ identity: id, lines: Array.from(lines) });
			}
			var state = {
				open: !root.classList.contains('hs-hidden'),
				dock: position,
				selectedIdentity: elementIdentity(selectedElement),
				breakpoints: bpEntries,
				paneSizes: {
					bottom: Object.assign({}, paneSizes.bottom),
					right: Object.assign({}, paneSizes.right),
				},
			};
			localStorage.setItem(STATE_KEY, JSON.stringify(state));
		} catch (e) { /* storage unavailable — ignore */ }
	}

	function loadState() {
		try {
			var raw = localStorage.getItem(STATE_KEY);
			return raw ? JSON.parse(raw) : null;
		} catch (e) { return null; }
	}

	function restoreDomLinked(state) {
		// Breakpoints — apply even if panel is hidden (they take effect at runtime)
		if (Array.isArray(state.breakpoints)) {
			for (var bp of state.breakpoints) {
				var el = resolveIdentity(bp.identity);
				if (el && Array.isArray(bp.lines) && bp.lines.length) {
					breakpoints.set(el, new Set(bp.lines));
				}
			}
		}
		// Only repopulate the element list + selection when the panel is visible
		if (!root.classList.contains('hs-hidden')) {
			refreshElements();
			if (state.selectedIdentity) {
				var sel = resolveIdentity(state.selectedIdentity);
				if (sel) {
					selectElement(sel);
					for (var i of $$('.d-el-item')) i.classList.toggle('selected', i._ref === sel);
				}
			}
			renderTimeline();
		}
	}

	function applyState() {
		var state = loadState();
		if (!state) return false;
		if (state.paneSizes && typeof state.paneSizes === 'object') {
			for (var dockName of ['bottom', 'right']) {
				var stored = state.paneSizes[dockName];
				if (!stored || typeof stored !== 'object') continue;
				for (var key of Object.keys(paneSizes[dockName])) {
					var v = Number(stored[key]);
					if (!isNaN(v) && v >= MIN_SIZE) paneSizes[dockName][key] = v;
				}
			}
		}
		if (state.dock === 'bottom' || state.dock === 'right') setDock(state.dock);
		if (state.open) root.classList.remove('hs-hidden');
		else root.classList.add('hs-hidden');
		// DOM-dependent parts run after DOMContentLoaded (may be "now")
		whenDomReady(function() { restoreDomLinked(state); });
		return true;
	}

	setDock('bottom');
	root.classList.add('hs-hidden');
	applyState();
	stateReady = true;
	updateToolbarState();

	return {
		toggle: function() {
			if (root.classList.contains('hs-hidden')) { root.classList.remove('hs-hidden'); refreshElements(); renderTimeline(); }
			else { root.classList.add('hs-hidden'); hideHL(); }
			saveState();
		},
		show: function() { root.classList.remove('hs-hidden'); refreshElements(); renderTimeline(); saveState(); },
		hide: function() { root.classList.add('hs-hidden'); hideHL(); saveState(); },
		refresh: refreshElements,
		step: stepForward,
		stepOver: stepOver,
		stepBack: stepBack,
		continue: continueExec,
		stop: stopExec,
		ttd,
	};
}


export default function debuggerPlugin (_hyperscript) {
	_hyperscript.config.debugMode = true;
	const runtime = _hyperscript.internals.runtime;

	// Always create TTD components for time-travel debugging
	const timeline = new RingBuffer(MAX_STEPS);
	const mutationBatcher = new MutationBatcher();
	const recorder = new Recorder(timeline, mutationBatcher);
	const domRestorer = new DomRestorer(mutationBatcher, runtime);
	const ttd = new TTD(recorder, timeline, domRestorer);
	recorder.install();
	if (typeof document !== 'undefined') {
		if (document.readyState === 'loading') {
			document.addEventListener('DOMContentLoaded', function() { mutationBatcher.init(); });
		} else {
			mutationBatcher.init();
		}
	}

	// DevTools panel — hidden by default, restored from localStorage if previously open
	if (typeof document !== 'undefined') {
		const panel = createPanel(_hyperscript, ttd, timeline, domRestorer, recorder);
		_hyperscript.debugger = panel;
	}
}


// Auto-register when loaded via script tag
if (typeof self !== 'undefined' && self._hyperscript) {
	self._hyperscript.use(debuggerPlugin);
}
