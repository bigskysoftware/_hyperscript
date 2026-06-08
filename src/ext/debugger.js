///=========================================================================
/// Time Travel Debugger (TTD) for _hyperscript
///
/// The TTD class drives the visual debugger panel's timeline.
///=========================================================================

import css from './debugger.module.css' with { type: 'text' };
import logoBase64 from './debugger-logo.b64' with { type: 'text' };

if (typeof document !== 'undefined') {
	const style = document.createElement('style');
	style.textContent = css;
	document.head.appendChild(style);
}

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
// TTD — Time-travel engine that drives the Timeline panel.
//       Performs DOM time-travel navigation and exposes recorded steps,
//       diffs, locals, DOM mutations, and streams as plain data.
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

const LOGO_DATA = 'data:image/png;base64,' + logoBase64;



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
				'<button class="d-btn d-dock" data-dock="bottom" title="Dock bottom">' +
					'<svg viewBox="0 0 14 14" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.2">' +
						'<rect x="1.5" y="1.5" width="11" height="11" rx="1.5"/>' +
						'<rect x="1.5" y="9" width="11" height="3.5" rx="1.5" fill="currentColor" stroke="none"/>' +
					'</svg>' +
				'</button>' +
				'<button class="d-btn d-dock" data-dock="right" title="Dock right">' +
					'<svg viewBox="0 0 14 14" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.2">' +
						'<rect x="1.5" y="1.5" width="11" height="11" rx="1.5"/>' +
						'<rect x="9" y="1.5" width="3.5" height="11" rx="1.5" fill="currentColor" stroke="none"/>' +
					'</svg>' +
				'</button>' +
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

	// Reserve space at the bottom of the page so content isn't hidden behind
	// the panel when it's open in bottom dock.  Right dock leaves the page
	// alone (per design).  Stomps any existing inline body.style.paddingBottom
	// while open; reverts on close.
	function applyPageOffset() {
		if (!document.body) return;
		if (position === 'bottom' && !root.classList.contains('hs-hidden')) {
			document.body.style.paddingBottom = root.getBoundingClientRect().height + 'px';
		} else {
			document.body.style.paddingBottom = '';
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
		applyPageOffset();
		saveState();
	}
	for (var b of $$('.d-dock')) b.addEventListener('click', function() { setDock(this.dataset.dock); });
	$('.d-btn-close').addEventListener('click', function() { root.classList.add('hs-hidden'); hideHL(); applyPageOffset(); });

	// Resize the whole debugger panel from its outer edge.
	$('.d-resize').addEventListener('mousedown', function(e) {
		e.preventDefault();
		var sx = e.clientX, sy = e.clientY, sw = root.offsetWidth, sh = root.offsetHeight;
		function mv(e) { if (position === 'bottom') root.style.height = Math.max(100, sh + sy - e.clientY) + 'px'; else root.style.width = Math.max(200, sw + sx - e.clientX) + 'px'; }
		function up() { document.removeEventListener('mousemove', mv); document.removeEventListener('mouseup', up); applyPageOffset(); }
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
			// `list` splitter sits *after* the list pane (drag right/down = grow).
			// `timeline` and `console` splitters sit *before* their pane (drag left/up = grow).
			var sign = (paneName === 'list') ? 1 : -1;
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

	// Route hyperscript `breakpoint` commands to the GUI panel when it is
	// open, instead of letting the JS `debugger` statement fire.  We arm the
	// existing `breakOnNext` flag so that the very next command's
	// hyperscript:beforeEval pauses in the panel via the listener above.
	document.addEventListener('hyperscript:breakpoint', function(evt) {
		if (root.classList.contains('hs-hidden')) return; // panel closed -> fall through to `debugger;`
		breakOnNext = true;
		evt.preventDefault();
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
			applyPageOffset();
			saveState();
		},
		show: function() { root.classList.remove('hs-hidden'); refreshElements(); renderTimeline(); applyPageOffset(); saveState(); },
		hide: function() { root.classList.add('hs-hidden'); hideHL(); applyPageOffset(); saveState(); },
		refresh: refreshElements,
		step: stepForward,
		stepOver: stepOver,
		stepBack: stepBack,
		continue: continueExec,
		stop: stopExec,
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
