///=========================================================================
/// Time Travel Debugger (TTD) for _hyperscript
///
/// Activate via URL parameter: ?_ttd=true
/// Optional max steps: ?_ttd=true&_ttd_max=20000
///
/// Console API: globalThis.ttd
///=========================================================================

'use strict';

// ==========================================================================
// Configuration
// ==========================================================================

const DEFAULT_MAX_STEPS = 10000;

function shouldActivate() {
	if (typeof location === 'undefined') return false;
	const params = new URLSearchParams(location.search);
	return params.has('_ttd');
}

function getMaxSteps() {
	if (typeof location === 'undefined') return DEFAULT_MAX_STEPS;
	const params = new URLSearchParams(location.search);
	const max = parseInt(params.get('_ttd_max'));
	return isNaN(max) ? DEFAULT_MAX_STEPS : max;
}

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

/** Summarize a value for console display */
function summarizeValue(value, maxLength) {
	maxLength = maxLength || 60;
	if (value === null) return 'null';
	if (value === undefined) return 'undefined';
	if (typeof value === 'string') {
		const truncated = value.length > maxLength
			? value.substring(0, maxLength - 3) + '...'
			: value;
		return '"' + truncated + '"';
	}
	if (typeof value === 'number' || typeof value === 'boolean') return String(value);
	if (typeof value === 'function') {
		return value.hyperfunc
			? 'def ' + (value.hypername || '(anonymous)')
			: 'function ' + (value.name || '(anonymous)');
	}
	if (typeof Element !== 'undefined' && value instanceof Element) {
		return elementDescription(value);
	}
	if (Array.isArray(value)) {
		return 'Array(' + value.length + ')';
	}
	if (value && value.constructor === Object) {
		const keys = Object.keys(value);
		return '{' + keys.slice(0, 3).join(', ') + (keys.length > 3 ? ', ...' : '') + '}';
	}
	try {
		const s = String(value);
		return s.length > maxLength ? s.substring(0, maxLength - 3) + '...' : s;
	} catch {
		return '[object]';
	}
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
		this._streams = new Map();
		this._stepCounter = 0;
		this._pendingSnapshot = null;
		this._pendingGapMutations = [];

		this.active = true;
		this.timeTraveling = false;
	}

	/** Attach event listeners to capture execution steps */
	install() {
		document.addEventListener("hyperscript:beforeEval", (evt) => {
			const { command, ctx } = evt.detail;

			// Assign stream ID on first encounter
			if (!ctx.meta.ttd_streamId) {
				ctx.meta.ttd_streamId = generateStreamId(ctx);
				this._registerStream(ctx);
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
			streamId: ctx.meta.ttd_streamId,
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

		// Clean up pending state
		this._pendingSnapshot = null;
		this._pendingGapMutations = [];
	}

	_registerStream(ctx) {
		const id = ctx.meta.ttd_streamId;
		this._streams.set(id, {
			id: id,
			featureName: ctx.meta.feature ? (ctx.meta.feature.displayName || null) : null,
			ownerElement: ctx.meta.owner || null,
			eventType: ctx.event ? ctx.event.type : null,
			startStep: this._stepCounter,
		});
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
// TTD — Console API exposed as globalThis.ttd
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

	/** Whether recording is active */
	get recording() {
		return this._recorder.active && !this._recorder.timeTraveling;
	}

	/** Whether currently in time travel mode */
	get traveling() {
		return this._recorder.timeTraveling;
	}

	/** Max steps in ring buffer */
	get maxSteps() {
		return this._timeline.maxSize;
	}

	// ==================================================================
	// Navigation — Time Travel
	// ==================================================================

	/** Step backward n steps with DOM restoration */
	back(n) {
		n = n || 1;
		this._enterTimeTravelIfNeeded();

		const targetPos = this._position - n;
		if (targetPos < this._timeline.firstIndex) {
			console.warn('[ttd] Cannot go back further — at the beginning of the timeline');
			return this;
		}

		// Undo steps from current position down to target + 1
		for (let i = this._position; i > targetPos; i--) {
			const step = this._timeline.getStep(i);
			if (step) this._restorer.undoStep(step);
		}

		this._position = targetPos;
		this._printPosition();
		return this;
	}

	/** Step forward n steps with DOM restoration */
	forward(n) {
		n = n || 1;
		if (!this._recorder.timeTraveling) {
			console.log('[ttd] Not in time travel mode. Nothing to step forward to.');
			return this;
		}

		const targetPos = this._position + n;
		const maxPos = this._timeline.lastIndex;
		if (targetPos > maxPos) {
			console.warn('[ttd] Cannot go forward further — at the end of the timeline');
			return this;
		}

		// Redo steps from current position + 1 up to target
		for (let i = this._position + 1; i <= targetPos; i++) {
			const step = this._timeline.getStep(i);
			if (step) this._restorer.redoStep(step);
		}

		this._position = targetPos;
		this._printPosition();
		return this;
	}

	/** Jump to a specific step index with DOM restoration */
	goto(n) {
		if (n < this._timeline.firstIndex || n > this._timeline.lastIndex) {
			console.error(
				'[ttd] Step ' + n + ' is out of range. ' +
				'Valid range: ' + this._timeline.firstIndex + ' - ' + this._timeline.lastIndex
			);
			return this;
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
		this._printPosition();
		return this;
	}

	/** Exit time travel mode and return to live state */
	resume() {
		if (!this._recorder.timeTraveling) {
			console.log('[ttd] Not in time travel mode.');
			return this;
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
		console.log('[ttd] Resumed live execution. Recording active.');
		return this;
	}

	_enterTimeTravelIfNeeded() {
		if (!this._recorder.timeTraveling) {
			this._recorder.timeTraveling = true;
			this._recorder.active = false;
			this._position = this._timeline.lastIndex;
			console.log('[ttd] Entered time travel mode. Execution paused.');
		}
	}

	_printPosition() {
		const step = this._timeline.getStep(this._position);
		if (!step) {
			console.log('[ttd] Position: ' + this._position + ' (no step data)');
			return;
		}
		const total = this._timeline.length;
		const offset = this._position - this._timeline.firstIndex;
		console.log(
			'[ttd] Step ' + step.index + ' (' + (offset + 1) + '/' + total + ') ' +
			'[' + step.streamId + '] ' +
			step.commandSource.trim()
		);
	}

	// ==================================================================
	// Inspection
	// ==================================================================

	/** Show detailed info about a step */
	inspect(n) {
		const step = this._resolveStep(n);
		if (!step) return undefined;

		console.group(
			'Step ' + step.index +
			' [' + step.streamId + '] ' +
			(step.error ? '[ERROR] ' : '') +
			(step.isAsync ? '[async] ' : '')
		);

		console.log('Command:  ' + step.commandSource.trim());
		console.log('Type:     ' + step.commandType);
		if (step.featureName) console.log('Feature:  ' + step.featureName);
		if (step.ownerElement) console.log('Owner:    ' + elementDescription(step.ownerElement));
		if (step.line) console.log('Line:     ' + step.line);
		console.log('Time:     ' + step.timestamp.toFixed(2) + 'ms');

		if (step.error) {
			console.error('Error:', step.error);
		}

		// Locals diff
		const beforeLocals = step.snapshotBefore.locals;
		const afterLocals = step.snapshotAfter.locals;
		const allKeys = new Set([...Object.keys(beforeLocals), ...Object.keys(afterLocals)]);
		if (allKeys.size > 0) {
			const rows = [];
			for (const key of allKeys) {
				const before = beforeLocals[key];
				const after = afterLocals[key];
				rows.push({
					Variable: key,
					Before: summarizeValue(before),
					After: summarizeValue(after),
					Changed: before !== after ? 'YES' : '',
				});
			}
			console.log('--- Locals ---');
			console.table(rows);
			// Log non-primitive values so they're expandable in the console
			for (const key of allKeys) {
				const after = afterLocals[key];
				if (after !== null && after !== undefined && typeof after === 'object') {
					console.log('  ' + key + ':', after);
				}
			}
		}

		// Result
		if (step.snapshotBefore.result !== step.snapshotAfter.result) {
			console.log(
				'Result:   ' + summarizeValue(step.snapshotBefore.result) +
				'  ->  ' + summarizeValue(step.snapshotAfter.result)
			);
			const afterResult = step.snapshotAfter.result;
			if (afterResult !== null && afterResult !== undefined && typeof afterResult === 'object') {
				console.log('  result:', afterResult);
			}
		}

		// DOM mutations
		if (step.mutations.length > 0) {
			console.log('--- DOM Mutations (' + step.mutations.length + ') ---');
			for (const m of step.mutations) {
				this._logMutation(m);
			}
		}

		console.groupEnd();
		return step;
	}

	/** Show local variables at a step */
	locals(n) {
		const step = this._resolveStep(n);
		if (!step) return undefined;

		const after = step.snapshotAfter.locals;
		const keys = Object.keys(after);
		if (keys.length === 0) {
			console.log('[ttd] No locals at step ' + step.index);
		} else {
			console.group('[ttd] Locals at step ' + step.index + ':');
			for (const key of keys) {
				console.log('  ' + key + ':', after[key]);
			}
			console.groupEnd();
		}
		return after;
	}

	/** Show what changed at a step compared to the previous step */
	diff(n) {
		const step = this._resolveStep(n);
		if (!step) return undefined;

		const changes = [];

		// Locals diff
		const before = step.snapshotBefore.locals;
		const after = step.snapshotAfter.locals;
		const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);
		for (const key of allKeys) {
			if (before[key] !== after[key]) {
				changes.push({
					What: 'local:' + key,
					Before: summarizeValue(before[key]),
					After: summarizeValue(after[key]),
				});
			}
		}

		// Result diff
		if (step.snapshotBefore.result !== step.snapshotAfter.result) {
			changes.push({
				What: 'result',
				Before: summarizeValue(step.snapshotBefore.result),
				After: summarizeValue(step.snapshotAfter.result),
			});
		}

		// Me/you diff
		if (step.snapshotBefore.me !== step.snapshotAfter.me) {
			changes.push({
				What: 'me',
				Before: elementDescription(step.snapshotBefore.me),
				After: elementDescription(step.snapshotAfter.me),
			});
		}
		if (step.snapshotBefore.you !== step.snapshotAfter.you) {
			changes.push({
				What: 'you',
				Before: elementDescription(step.snapshotBefore.you),
				After: elementDescription(step.snapshotAfter.you),
			});
		}

		// DOM mutations summary
		for (const m of step.mutations) {
			changes.push({
				What: 'DOM:' + m.type,
				Before: this._mutationBefore(m),
				After: this._mutationAfter(m),
			});
		}

		if (changes.length === 0) {
			console.log('[ttd] No changes at step ' + step.index);
		} else {
			console.log('[ttd] Changes at step ' + step.index + ' (' + step.commandSource.trim() + '):');
			console.table(changes);
		}
		return changes;
	}

	/** Show DOM mutations at a step */
	dom(n) {
		const step = this._resolveStep(n);
		if (!step) return undefined;

		if (step.mutations.length === 0) {
			console.log('[ttd] No DOM mutations at step ' + step.index);
		} else {
			console.log('[ttd] DOM mutations at step ' + step.index + ' (' + step.mutations.length + '):');
			for (const m of step.mutations) {
				this._logMutation(m);
			}
		}
		return step.mutations;
	}

	// ==================================================================
	// Overview
	// ==================================================================

	/** Print a summary table of all (or filtered) steps */
	steps(opts) {
		opts = opts || {};
		let items = this._timeline.toArray();

		if (opts.stream) {
			items = items.filter(s => s.streamId === opts.stream);
		}
		if (opts.last) {
			items = items.slice(-opts.last);
		}

		const rows = items.map(s => ({
			'#': s.index,
			Stream: s.streamId,
			Command: s.commandSource.trim().substring(0, 50),
			Feature: s.featureName || '-',
			Mutations: s.mutations.length,
			Async: s.isAsync ? 'Y' : '',
			Error: s.error ? 'Y' : '',
		}));

		console.table(rows);
		return items;
	}

	/** List all execution streams */
	get streams() {
		const rows = [];
		for (const [id, info] of this._recorder._streams) {
			rows.push({
				Stream: id,
				Feature: info.featureName || '-',
				Event: info.eventType || '-',
				Owner: elementDescription(info.ownerElement),
				Start: info.startStep,
			});
		}
		console.table(rows);
		return Array.from(this._recorder._streams.values());
	}

	// ==================================================================
	// Search
	// ==================================================================

	/** Find steps where command source matches a pattern (string or regex) */
	find(pattern) {
		const regex = pattern instanceof RegExp ? pattern : new RegExp(pattern, 'i');
		const results = [];
		for (const step of this._timeline) {
			if (regex.test(step.commandSource)) {
				results.push(step);
			}
		}

		if (results.length === 0) {
			console.log('[ttd] No steps matching: ' + pattern);
		} else {
			const rows = results.map(s => ({
				'#': s.index,
				Stream: s.streamId,
				Command: s.commandSource.trim().substring(0, 50),
				Feature: s.featureName || '-',
			}));
			console.log('[ttd] Found ' + results.length + ' steps matching: ' + pattern);
			console.table(rows);
		}
		return results;
	}

	/** Find steps where a specific variable changed */
	findVar(name) {
		const results = [];
		for (const step of this._timeline) {
			const before = step.snapshotBefore.locals[name];
			const after = step.snapshotAfter.locals[name];
			if (before !== after) {
				results.push({
					step: step,
					before: before,
					after: after,
				});
			}
		}

		if (results.length === 0) {
			console.log('[ttd] Variable "' + name + '" never changed (or does not exist)');
		} else {
			const rows = results.map(r => ({
				'#': r.step.index,
				Stream: r.step.streamId,
				Command: r.step.commandSource.trim().substring(0, 40),
				Before: summarizeValue(r.before),
				After: summarizeValue(r.after),
			}));
			console.log('[ttd] Variable "' + name + '" changed in ' + results.length + ' steps:');
			console.table(rows);
		}
		return results;
	}

	/** Filter steps to a specific execution stream */
	stream(id) {
		const results = [];
		for (const step of this._timeline) {
			if (step.streamId === id) {
				results.push(step);
			}
		}

		if (results.length === 0) {
			console.log('[ttd] No steps for stream: ' + id);
		} else {
			const rows = results.map(s => ({
				'#': s.index,
				Command: s.commandSource.trim().substring(0, 50),
				Mutations: s.mutations.length,
				Async: s.isAsync ? 'Y' : '',
			}));
			console.log('[ttd] Stream "' + id + '" (' + results.length + ' steps):');
			console.table(rows);
		}
		return results;
	}

	// ==================================================================
	// Recording control
	// ==================================================================

	/** Pause recording (does not enter time travel mode) */
	pause() {
		this._recorder.active = false;
		console.log('[ttd] Recording paused.');
		return this;
	}

	/** Clear all recorded history */
	clear() {
		if (this._recorder.timeTraveling) {
			console.warn('[ttd] Cannot clear while time traveling. Call ttd.resume() first.');
			return this;
		}
		this._timeline.clear();
		this._recorder._streams.clear();
		this._recorder._stepCounter = 0;
		this._position = -1;
		console.log('[ttd] Timeline cleared.');
		return this;
	}

	/** Start recording (if paused, but not time traveling) */
	record() {
		if (this._recorder.timeTraveling) {
			console.warn('[ttd] Cannot start recording while time traveling. Call ttd.resume() first.');
			return this;
		}
		this._recorder.active = true;
		console.log('[ttd] Recording started.');
		return this;
	}

	// ==================================================================
	// Help
	// ==================================================================

	help() {
		console.log([
			'',
			'=== _hyperscript Time Travel Debugger (TTD) ===',
			'',
			'Navigation:',
			'  ttd.back(n)       Step backward n steps (default 1), restoring DOM',
			'  ttd.forward(n)    Step forward n steps (default 1), re-applying DOM',
			'  ttd.goto(n)       Jump to step n with DOM restoration',
			'  ttd.resume()      Exit time travel, return to live execution',
			'',
			'Inspection:',
			'  ttd.inspect(n)    Detailed view of step n (default: current)',
			'  ttd.locals(n)     Local variables at step n',
			'  ttd.diff(n)       What changed at step n',
			'  ttd.dom(n)        DOM mutations at step n',
			'',
			'Overview:',
			'  ttd.steps()       Table of all steps. Options: {stream, last}',
			'  ttd.streams       List all execution streams',
			'  ttd.length        Total recorded steps',
			'  ttd.current       Current step index',
			'',
			'Search:',
			'  ttd.find(pat)     Find steps by command source (string or regex)',
			'  ttd.findVar(name) Find steps where variable changed',
			'  ttd.stream(id)    Filter steps to one stream',
			'',
			'Control:',
			'  ttd.pause()       Pause recording',
			'  ttd.record()      Resume recording',
			'  ttd.clear()       Clear timeline',
			'  ttd.help()        Show this help',
			'',
			'State:',
			'  ttd.recording     Is recording active?',
			'  ttd.traveling     Is in time travel mode?',
			'  ttd.maxSteps      Ring buffer capacity',
			'',
		].join('\n'));
		return this;
	}

	// ==================================================================
	// Internal helpers
	// ==================================================================

	_resolveStep(n) {
		if (n === undefined || n === null) {
			n = this.current;
		}
		const step = this._timeline.getStep(n);
		if (!step) {
			console.error('[ttd] Step ' + n + ' not found.');
			return null;
		}
		return step;
	}

	_logMutation(m) {
		const target = elementDescription(m.target);
		switch (m.type) {
			case 'attributes':
				console.log(
					'  ATTR ' + target + ' @' + m.attributeName +
					': ' + summarizeValue(m.oldValue, 30) +
					' -> ' + summarizeValue(m.newValue, 30)
				);
				break;
			case 'characterData':
				console.log(
					'  TEXT ' + target +
					': ' + summarizeValue(m.oldValue, 30) +
					' -> ' + summarizeValue(m.newValue, 30)
				);
				break;
			case 'childList': {
				const parts = [];
				if (m.addedNodes.length > 0) {
					parts.push('+' + m.addedNodes.length + ' added');
				}
				if (m.removedNodes.length > 0) {
					parts.push('-' + m.removedNodes.length + ' removed');
				}
				console.log('  NODES ' + target + ': ' + parts.join(', '));
				break;
			}
		}
	}

	_mutationBefore(m) {
		switch (m.type) {
			case 'attributes':
				return '@' + m.attributeName + '=' + summarizeValue(m.oldValue, 20);
			case 'characterData':
				return summarizeValue(m.oldValue, 30);
			case 'childList':
				return m.removedNodes.length + ' nodes';
			default:
				return '';
		}
	}

	_mutationAfter(m) {
		switch (m.type) {
			case 'attributes':
				return '@' + m.attributeName + '=' + summarizeValue(m.newValue, 20);
			case 'characterData':
				return summarizeValue(m.newValue, 30);
			case 'childList':
				return m.addedNodes.length + ' nodes';
			default:
				return '';
		}
	}
}

// ==========================================================================
// Plugin registration
// ==========================================================================

export default function ttdPlugin(_hyperscript) {
	if (!shouldActivate()) return;

	const runtime = _hyperscript.internals.runtime;
	const maxSteps = getMaxSteps();

	// Create components
	const timeline = new RingBuffer(maxSteps);
	const mutationBatcher = new MutationBatcher();
	const recorder = new Recorder(timeline, mutationBatcher);
	const domRestorer = new DomRestorer(mutationBatcher, runtime);
	const ttd = new TTD(recorder, timeline, domRestorer);

	// Attach event listeners for recording
	recorder.install();

	// Initialize MutationObserver (after DOM is available)
	if (typeof document !== 'undefined') {
		if (document.readyState === 'loading') {
			document.addEventListener('DOMContentLoaded', () => mutationBatcher.init());
		} else {
			mutationBatcher.init();
		}
	}

	// Expose console API
	globalThis.ttd = ttd;

	console.log(
		'[ttd] Time Travel Debugger active. ' +
		'Buffer: ' + maxSteps + ' steps. ' +
		'Type ttd.help() for usage.'
	);
}

// Auto-register when imported
if (typeof self !== 'undefined' && self._hyperscript) {
	self._hyperscript.use(ttdPlugin);
}
