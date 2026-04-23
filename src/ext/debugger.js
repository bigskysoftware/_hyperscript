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

	/** Enter time-travel mode at the current end of the recorded timeline (public). */
	enter() { this._enterTimeTravelIfNeeded(); return this; }

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
// DevTools Panel — inline div with scoped CSS
// ==========================================================================

var LOGO_DATA = 'data:image/png;base64,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';

function injectFont() {
	if (document.querySelector('style[data-hs-debugger-font]')) return;
	var style = document.createElement('style');
	style.setAttribute('data-hs-debugger-font', '');
	style.textContent = '@font-face { font-family: "ChicagoFLF"; src: url("https://hyperscript.org/fonts/ChicagoFLF.woff") format("woff"); font-display: swap; }' +
		'.hs-dbg-bp-glyph{background:#c03030;border-radius:50%;width:10px!important;height:10px!important;margin-top:4px;margin-left:4px}' +
		'.hs-dbg-bp-line{background:rgba(192,48,48,.1)}' +
		'.hs-dbg-current-line{background:rgba(255,210,60,.6)!important}' +
		'.hs-dbg-current-glyph{background:#ffc850;border-radius:2px;width:10px!important;height:10px!important;margin-top:4px;margin-left:4px}';
	document.head.appendChild(style);
}

function injectStyles() {
	if (document.getElementById('hs-debugger-styles')) return;
	var style = document.createElement('style');
	style.id = 'hs-debugger-styles';
	style.textContent = '#hs-debugger{all:initial;display:block;position:fixed;z-index:2147483647;font-family:"IBM Plex Sans",-apple-system,"Segoe UI",system-ui,sans-serif;font-size:13px;color:#222;line-height:1.4}' +
		'#hs-debugger.hs-bottom{left:0;right:0;bottom:0;height:320px}' +
		'#hs-debugger.hs-right{top:0;right:0;bottom:0;width:420px}' +
		'#hs-debugger.hs-hidden{display:none!important}' +
		'#hs-debugger .d-root{display:flex;flex-direction:column;height:100%;background:#fff;border-top:2px solid #b0b0b0;box-shadow:0 -2px 8px rgba(0,0,0,.12)}' +
		'#hs-debugger.hs-right .d-root{border-top:none;border-left:2px solid #b0b0b0;box-shadow:-2px 0 8px rgba(0,0,0,.12)}' +
		'#hs-debugger .d-resize{position:absolute;z-index:1}' +
		'#hs-debugger.hs-bottom .d-resize{top:-4px;left:0;right:0;height:8px;cursor:ns-resize}' +
		'#hs-debugger.hs-right .d-resize{top:0;left:-4px;bottom:0;width:8px;cursor:ew-resize}' +
		'#hs-debugger .d-resize:hover{background:#4a84c4;opacity:.3}' +
		'#hs-debugger .d-toolbar{display:flex;align-items:center;gap:4px;padding:3px 10px;background:#ebebeb;border-bottom:1px solid #b0b0b0;user-select:none;flex-shrink:0}' +
		'#hs-debugger .d-logo{height:32px;width:auto;margin-right:8px}' +
		'#hs-debugger .d-title{font-family:"ChicagoFLF","Chicago","Geneva",system-ui,sans-serif;font-size:20px;font-weight:bold;margin-right:auto}' +
		'#hs-debugger .d-title em{color:#4a84c4;font-style:normal}' +
		'#hs-debugger .d-btn{background:none;border:1px solid #d4d4d4;color:#666;cursor:pointer;padding:2px 8px;border-radius:3px;font:inherit;font-size:12px}' +
		'#hs-debugger .d-btn:hover{color:#222;background:#e0e8f4;border-color:#b0b0b0}' +
		'#hs-debugger .d-btn.active{color:#4a84c4;background:#e8f0fb;border-color:#4a84c4}' +
		'#hs-debugger .d-btn-close{font-size:16px;padding:0 4px;margin-left:4px;border:none}' +
		'#hs-debugger .d-body{display:grid;grid-template-columns:1fr 6px 40%;flex:1;overflow:hidden;min-height:0}' +
		'#hs-debugger.hs-right .d-body{grid-template-columns:1fr;grid-template-rows:1fr 6px 40%}' +
		'#hs-debugger .d-elements{display:grid;grid-template-columns:auto 4px 1fr;min-width:0;min-height:0;overflow:hidden}' +
		'#hs-debugger.hs-right .d-elements{grid-template-columns:1fr;grid-template-rows:auto 4px 1fr}' +
		'#hs-debugger .d-el-list{width:200px;min-width:100px;border-right:1px solid #d4d4d4;display:flex;flex-direction:column;min-height:0}' +
		'#hs-debugger.hs-right .d-el-list{width:auto;height:150px;border-right:none;border-bottom:1px solid #d4d4d4;max-height:none}' +
		'#hs-debugger .d-el-search{display:block;box-sizing:border-box;padding:4px 8px;margin:6px;width:calc(100% - 12px);border:1px solid #8a8a8a;border-radius:3px;background:#fff;color:#222;font-family:"IBM Plex Mono","SF Mono","Consolas",monospace;font-size:11px;outline:none;flex-shrink:0;box-shadow:inset 0 2px 4px rgba(0,0,0,.28)}' +
		'#hs-debugger .d-el-search::placeholder{color:#999}' +
		'#hs-debugger .d-el-search:focus{border-color:#4a84c4;box-shadow:inset 0 2px 4px rgba(0,0,0,.28),0 0 0 2px rgba(74,132,196,.25)}' +
		'#hs-debugger .d-el-items{flex:1;min-height:0;overflow-y:auto}' +
		'#hs-debugger .d-el-split{cursor:col-resize;background:#d4d4d4}' +
		'#hs-debugger.hs-right .d-el-split{cursor:row-resize}' +
		'#hs-debugger .d-el-split:hover{background:#4a84c4}' +
		'#hs-debugger .d-el-item{padding:4px 10px;cursor:pointer;border-bottom:1px solid #d4d4d4;font-family:"IBM Plex Mono","SF Mono","Consolas",monospace;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
		'#hs-debugger .d-el-item:hover{background:#e0e8f4}' +
		'#hs-debugger .d-el-item.selected{background:#4a84c4;color:#fff}' +
		'#hs-debugger .d-el-item.selected .d-tag,#hs-debugger .d-el-item.selected .d-id,#hs-debugger .d-el-item.selected .d-cls{color:inherit}' +
		'#hs-debugger .d-tag{color:#4a84c4}#hs-debugger .d-id{color:#2b6b1f}#hs-debugger .d-cls{color:#8a6d00}' +
		'#hs-debugger .d-detail{overflow-y:auto;padding:10px;display:flex;flex-direction:column;min-width:0}' +
		'#hs-debugger .d-dbg-toolbar{display:flex;align-items:center;gap:10px;min-height:26px;margin:12px 0 6px}' +
		'#hs-debugger .d-dbg-toolbar .d-label{margin:0}' +
		'#hs-debugger .d-dbg-btns{display:flex;gap:2px;visibility:hidden}' +
		'#hs-debugger.hs-paused .d-dbg-btns{visibility:visible}' +
		'#hs-debugger.hs-right .d-detail{min-width:auto}' +
		'#hs-debugger .d-code{white-space:pre-wrap;word-break:break-word;font-family:"IBM Plex Mono","SF Mono","Consolas",monospace;font-size:12px;line-height:1.5;padding:8px;background:#f6f6f6;border-radius:4px;border:1px solid #d4d4d4}' +
		'#hs-debugger .d-code-area{display:flex;flex:1;min-height:80px;gap:8px}' +
		'#hs-debugger .d-editor{flex:1;border:1px solid #d4d4d4;border-radius:4px;overflow:hidden}' +
		'@keyframes hs-dbg-flash{0%{box-shadow:0 0 0 0 rgba(255,200,80,0)}25%{box-shadow:0 0 0 4px rgba(255,200,80,.85)}100%{box-shadow:0 0 0 0 rgba(255,200,80,0)}}' +
		'#hs-debugger .d-editor.hs-dbg-flash{animation:hs-dbg-flash .5s ease-out}' +
		'#hs-debugger.hs-paused .d-editor{border-color:#4a84c4;box-shadow:0 0 0 2px rgba(74,132,196,.5)}' +
		'#hs-debugger .d-label{font-family:"ChicagoFLF","Chicago","Geneva",system-ui,sans-serif;font-size:11px;color:#666;text-transform:uppercase;letter-spacing:.05em;margin:0 0 4px}' +
		'#hs-debugger .d-label+.d-label,#hs-debugger .d-code+.d-label{margin-top:12px}' +
		'#hs-debugger .d-console{display:flex;flex-direction:column;border-left:2px solid #b0b0b0;background:#1a0e00;min-width:0;min-height:0;overflow:hidden;cursor:text}' +
		'#hs-debugger.hs-right .d-console{border-left:none;border-top:2px solid #b0b0b0}' +
		'#hs-debugger .d-con-hdr{padding:4px 10px;font-family:"ChicagoFLF","Chicago","Geneva",system-ui,sans-serif;font-size:11px;color:#ffdd60;border-bottom:1px solid #3a2800;text-transform:uppercase;letter-spacing:.08em;user-select:none;flex-shrink:0}' +
		'#hs-debugger .d-con-scroll{flex:1;min-height:0;overflow-y:auto}' +
		'#hs-debugger .d-con-out{padding:6px 10px;font-family:"IBM Plex Mono","SF Mono","Consolas",monospace;font-size:13px;font-weight:700;color:#ffe060;background-image:repeating-linear-gradient(0deg,transparent,transparent 10px,rgba(255,160,30,.06) 10px,rgba(255,160,30,.06) 20px);background-attachment:local}' +
		'#hs-debugger .d-con-entry{padding:3px 0}' +
		'#hs-debugger .d-con-in{display:flex;align-items:center;padding:2px 10px 6px}' +
		'#hs-debugger .d-prompt{padding:0 6px 0 0;color:#ffdd60;font-family:"ChicagoFLF","Chicago","Geneva",system-ui,sans-serif;user-select:none;font-size:13px;font-weight:700;line-height:1.5;white-space:nowrap}' +
		'#hs-debugger .d-input{flex:1;background:transparent;border:none;color:#ffdd60;font-family:"IBM Plex Mono","SF Mono","Consolas",monospace;font-size:13px;font-weight:700;padding:0;outline:none;caret-color:#ffdd60}' +
		'#hs-debugger .d-log-input{color:#ffdd60;font-weight:700}' +
		'#hs-debugger .d-log-result{color:#ffdd60;font-weight:700}' +
		'#hs-debugger .d-log-error{color:#ff6040;font-weight:700}' +
		'#hs-debugger .d-log-coll{color:#ffdd60;font-weight:700}' +
		'#hs-debugger .d-log-coll-item{padding:1px 0 1px 12px;cursor:pointer;color:#ffdd60;font-weight:700}' +
		'#hs-debugger .d-log-coll-item:hover{text-decoration:underline}' +
		'#hs-debugger .d-split{cursor:col-resize;background:#b0b0b0;position:relative}' +
		'#hs-debugger .d-split:hover{background:#4a84c4}' +
		'#hs-debugger.hs-right .d-split{cursor:row-resize}' +
		'#hs-debugger .d-con-toggle{position:absolute;top:50%;transform:translateY(-50%);right:-1px;background:#b0b0b0;color:#fff;border:none;cursor:pointer;font-size:10px;padding:8px 2px;border-radius:0 3px 3px 0;line-height:1}' +
		'#hs-debugger.hs-right .d-con-toggle{top:50%;left:50%;right:auto;transform:translate(-50%,-50%);padding:1px 8px;border-radius:3px}' +
		'#hs-debugger .d-con-collapsed .d-con-hdr,#hs-debugger .d-con-collapsed .d-con-scroll{display:none}' +
		'#hs-debugger .d-con-collapsed{min-width:0;min-height:0}' +
		'#hs-debugger.hs-bottom .d-con-collapsed{width:24px}' +
		'#hs-debugger.hs-right .d-con-collapsed{height:24px;width:auto}' +
		'#hs-debugger .d-con-vlabel{display:none;writing-mode:vertical-rl;text-orientation:mixed;font-family:"ChicagoFLF","Chicago","Geneva",system-ui,sans-serif;font-size:11px;color:#ffb030;letter-spacing:.08em;text-transform:uppercase;padding:10px 4px;user-select:none;cursor:pointer}' +
		'#hs-debugger.hs-right .d-con-vlabel{writing-mode:horizontal-tb;padding:4px 10px;text-align:center}' +
		'#hs-debugger .d-con-collapsed .d-con-vlabel{display:block}' +
		'#hs-debugger .d-empty{color:#666;text-align:center;padding:20px;font-family:"ChicagoFLF","Chicago","Geneva",system-ui,sans-serif;font-size:12px}' +
		'#hs-debugger .d-dbg-btn{background:#fff;border:1px solid #c0c0c0;box-shadow:0 1px 2px rgba(0,0,0,.1);cursor:pointer;padding:3px 8px;border-radius:3px;font-size:13px;line-height:1;color:#888}' +
		'#hs-debugger .d-dbg-btn:hover{background:#f4f4f4;box-shadow:0 1px 3px rgba(0,0,0,.15)}' +
		'#hs-debugger .d-dbg-btn:active{box-shadow:inset 0 1px 2px rgba(0,0,0,.12)}' +
		'#hs-debugger .d-step,#hs-debugger .d-continue,#hs-debugger .d-step-back,#hs-debugger .d-step-over{color:#2b8a3e}' +
		'#hs-debugger .d-stop{color:#c03030}' +
		'#hs-debugger .d-vars{display:none;width:180px;flex-shrink:0;overflow-y:auto;border:1px solid #d4d4d4;border-radius:4px;padding:6px 8px;background:#f8f8f8}' +
		'#hs-debugger.hs-paused .d-vars{display:block}' +
		'#hs-debugger .d-vars table{width:100%;border-collapse:collapse}' +
		'#hs-debugger .d-vars td{padding:2px 4px;border-bottom:1px solid #eee;font-family:"IBM Plex Mono","SF Mono","Consolas",monospace;font-size:11px}' +
		'#hs-debugger .d-vars td:first-child{color:#c05020;white-space:nowrap}' +
		'#hs-debugger .d-var-scope{color:#888!important;font-family:"ChicagoFLF","Chicago","Geneva",system-ui,sans-serif;font-size:10px;text-transform:uppercase;letter-spacing:.05em;padding-top:6px!important;border-bottom:none!important}';
	document.head.appendChild(style);
}

function createPanel(_hyperscript, ttd, timeline, domRestorer, recorder) {
	injectFont();
	injectStyles();

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
				'<div class="d-elements">' +
					'<div class="d-el-list">' +
						'<input class="d-el-search" placeholder="Filter elements…" spellcheck="false" autocomplete="off">' +
						'<div class="d-el-items"></div>' +
					'</div>' +
					'<div class="d-el-split"></div>' +
					'<div class="d-detail">' +
						'<div class="d-dbg-btns">' +
							'<button class="d-dbg-btn d-step-back" title="Step Back (F9)">\u25c0</button>' +
							'<button class="d-dbg-btn d-step" title="Step (F10)">\u25b6</button>' +
							'<button class="d-dbg-btn d-step-over" title="Step Over (F11)">\u21bb</button>' +
							'<button class="d-dbg-btn d-continue" title="Continue (F8)">\u25b6\u25b6</button>' +
							'<button class="d-dbg-btn d-stop" title="Stop">\u25a0</button>' +
						'</div>' +
						'<div class="d-empty">Select an element to inspect</div>' +
					'</div>' +
				'</div>' +
				'<div class="d-split"><button class="d-con-toggle" title="Toggle console">\u25b6</button></div>' +
				'<div class="d-console">' +
					'<div class="d-con-vlabel">Console</div>' +
					'<div class="d-con-hdr">Console</div>' +
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

	// Dock
	function setDock(pos) {
		position = pos;
		root.className = 'hs-' + pos;
		root.style.width = ''; root.style.height = '';
		var list = $('.d-el-list');
		if (list) { list.style.width = ''; list.style.height = ''; }
		var bodyEl = $('.d-body');
		if (bodyEl) { bodyEl.style.gridTemplateColumns = ''; bodyEl.style.gridTemplateRows = ''; }
		customConSize = null;
		var con = $('.d-console');
		if (con) con.classList.remove('d-con-collapsed');
		var toggle = $('.d-con-toggle');
		if (toggle) toggle.textContent = pos === 'right' ? '▼' : '▶';
		for (var b of $$('.d-dock')) b.classList.toggle('active', b.dataset.dock === pos);
		saveState();
	}
	for (var b of $$('.d-dock')) b.addEventListener('click', function() { setDock(this.dataset.dock); });
	$('.d-btn-close').addEventListener('click', function() { root.classList.add('hs-hidden'); hideHL(); });

	// Resize
	$('.d-resize').addEventListener('mousedown', function(e) {
		e.preventDefault();
		var sx = e.clientX, sy = e.clientY, sw = root.offsetWidth, sh = root.offsetHeight;
		function mv(e) { if (position === 'bottom') root.style.height = Math.max(100, sh + sy - e.clientY) + 'px'; else root.style.width = Math.max(200, sw + sx - e.clientX) + 'px'; }
		function up() { document.removeEventListener('mousemove', mv); document.removeEventListener('mouseup', up); }
		document.addEventListener('mousemove', mv); document.addEventListener('mouseup', up);
	});

	// Element list / detail splitter — resizes width when docked bottom, height when docked right
	$('.d-el-split').addEventListener('mousedown', function(e) {
		e.preventDefault();
		var list = $('.d-el-list');
		var startX = e.clientX, startW = list.offsetWidth;
		var startY = e.clientY, startH = list.offsetHeight;
		function mv(e) {
			if (position === 'right') {
				list.style.height = Math.max(60, startH + e.clientY - startY) + 'px';
			} else {
				list.style.width = Math.max(80, startW + e.clientX - startX) + 'px';
			}
		}
		function up() { document.removeEventListener('mousemove', mv); document.removeEventListener('mouseup', up); saveState(); }
		document.addEventListener('mousemove', mv); document.addEventListener('mouseup', up);
	});

	// Console / elements splitter — dragging also toggles collapsed state
	var customConSize = null;
	var body = $('.d-body');
	var COLLAPSE_W = 100;
	var COLLAPSE_H = 50;
	$('.d-split').addEventListener('mousedown', function(e) {
		if (e.target.tagName === 'BUTTON') return;
		e.preventDefault();
		var con = $('.d-console');
		var toggle = $('.d-con-toggle');
		// If starting from collapsed, expand to a sensible default so the drag has room.
		if (con.classList.contains('d-con-collapsed')) {
			con.classList.remove('d-con-collapsed');
			if (position === 'bottom') {
				body.style.gridTemplateColumns = '1fr 6px ' + (customConSize || '300px');
				toggle.textContent = '▶';
			} else {
				body.style.gridTemplateRows = '1fr 6px ' + (customConSize || '200px');
				toggle.textContent = '▼';
			}
		}
		var startX = e.clientX, startW = con.offsetWidth;
		var startY = e.clientY, startH = con.offsetHeight;
		function mv(e) {
			if (position === 'bottom') {
				var w = startW + startX - e.clientX;
				if (w < COLLAPSE_W) {
					con.classList.add('d-con-collapsed');
					body.style.gridTemplateColumns = '1fr 6px 24px';
					toggle.textContent = '◀';
				} else {
					con.classList.remove('d-con-collapsed');
					body.style.gridTemplateColumns = '1fr 6px ' + w + 'px';
					customConSize = w + 'px';
					toggle.textContent = '▶';
				}
			} else {
				var h = startH + startY - e.clientY;
				if (h < COLLAPSE_H) {
					con.classList.add('d-con-collapsed');
					body.style.gridTemplateRows = '1fr 6px 24px';
					toggle.textContent = '▲';
				} else {
					con.classList.remove('d-con-collapsed');
					body.style.gridTemplateRows = '1fr 6px ' + h + 'px';
					customConSize = h + 'px';
					toggle.textContent = '▼';
				}
			}
		}
		function up() { document.removeEventListener('mousemove', mv); document.removeEventListener('mouseup', up); saveState(); }
		document.addEventListener('mousemove', mv); document.addEventListener('mouseup', up);
	});

	// Console toggle
	function toggleConsole() {
		var con = $('.d-console');
		con.classList.toggle('d-con-collapsed');
		var collapsed = con.classList.contains('d-con-collapsed');
		if (position === 'bottom') {
			body.style.gridTemplateColumns = collapsed ? '1fr 6px 24px' : (customConSize ? '1fr 6px ' + customConSize : '');
			$('.d-con-toggle').textContent = collapsed ? '\u25c0' : '\u25b6';
		} else {
			body.style.gridTemplateRows = collapsed ? '1fr 6px 24px' : (customConSize ? '1fr 6px ' + customConSize : '');
			$('.d-con-toggle').textContent = collapsed ? '\u25b2' : '\u25bc';
		}
		saveState();
	}
	$('.d-con-toggle').addEventListener('click', function(e) { e.stopPropagation(); toggleConsole(); });
	$('.d-con-vlabel').addEventListener('click', toggleConsole);

	// Click anywhere in the console focuses the input \u2014 unless a text selection is active
	// (using 'click' not 'mousedown' so drag-to-select isn't hijacked).
	$('.d-console').addEventListener('click', function(e) {
		var sel = window.getSelection && window.getSelection();
		if (sel && sel.toString().length > 0) return;
		var t = e.target;
		if (t.tagName === 'INPUT' || t.tagName === 'A' || t.tagName === 'BUTTON') return;
		if (t.classList && (t.classList.contains('d-log-coll-item') || t.classList.contains('d-con-toggle') || t.classList.contains('d-con-vlabel'))) return;
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
		var detail = $('.d-detail');
		var btns = $('.d-dbg-btns');
		detail.innerHTML = '';
		// Keep the buttons node in the DOM so later selectElement calls can find it via $()
		if (btns) detail.appendChild(btns);
		detail.insertAdjacentHTML('beforeend', '<div class="d-empty">Select an element to inspect</div>');
		hideHL();
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

		// Show variables
		showVariables(ctx);

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
		$('.d-vars').innerHTML = '';
		var cmd = pausedCommand;
		var ctx = pausedCtx;
		pausedCommand = null;
		pausedCtx = null;
		pausedElement = null;
		if (cmd && ctx) {
			skipNextBreak = true;
			_hyperscript.internals.runtime.unifiedExec(cmd, ctx);
		}
	}

	function fmtVar(val) {
		return val === undefined ? 'undefined' : val === null ? 'null' :
			typeof val === 'string' ? '"' + val.substring(0, 50) + '"' :
			val instanceof Element ? elementDescription(val) :
			String(val).substring(0, 50);
	}

	function showVariables(ctx) {
		var vars = $('.d-vars');
		var rows = '';
		// Locals
		var hasLocals = false;
		for (var key in ctx.locals) {
			if (key === 'cookies' || key === 'clipboard') continue;
			var val = ctx.locals[key];
			if (key === 'selection' && !val) continue;
			if (!hasLocals) { rows += '<tr><td class="d-var-scope" colspan="2">Locals</td></tr>'; hasLocals = true; }
			rows += '<tr><td>' + esc(key) + '</td><td>' + esc(fmtVar(val)) + '</td></tr>';
		}
		if (ctx.result !== undefined) {
			rows += '<tr><td>result</td><td>' + esc(fmtVar(ctx.result)) + '</td></tr>';
		}
		// Element-scoped variables
		var owner = ctx.meta && ctx.meta.owner;
		if (owner && owner._hyperscript && owner._hyperscript.elementScope) {
			var scope = owner._hyperscript.elementScope;
			var hasScope = false;
			for (var key in scope) {
				if (!hasScope) { rows += '<tr><td class="d-var-scope" colspan="2">Element</td></tr>'; hasScope = true; }
				rows += '<tr><td>' + esc(key) + '</td><td>' + esc(fmtVar(scope[key])) + '</td></tr>';
			}
		}
		vars.innerHTML = rows ? '<table>' + rows + '</table>' : '';
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
		// Position _after_ this step ran is what we're viewing, so show snapshotAfter
		if (step.snapshotAfter) showSnapshotVars(step.snapshotAfter);
		else if (step.snapshotBefore) showSnapshotVars(step.snapshotBefore);
	}

	function applyStepDecoration(step) {
		if (!monacoEditor || !step || !step.line) return;
		debugDecorations = monacoEditor.deltaDecorations(debugDecorations, [{
			range: new window.monaco.Range(step.line, 1, step.line, 1),
			options: { isWholeLine: true, className: 'hs-dbg-current-line', glyphMarginClassName: 'hs-dbg-current-glyph' }
		}]);
		monacoEditor.revealLineInCenter(step.line);
	}

	// Find the currently-relevant stream id for time-travel: the paused ctx's stream
	// takes precedence (we're anchored to that event invocation); otherwise fall back
	// to the step we're currently viewing.
	function currentStreamId() {
		if (pausedCtx && pausedCtx.meta && pausedCtx.meta.ttd_streamId) {
			return pausedCtx.meta.ttd_streamId;
		}
		var step = timeline.getStep(ttd.current);
		return step ? step.streamId : null;
	}

	function findPrevInStream(pos, streamId) {
		for (var i = pos - 1; i >= timeline.firstIndex; i--) {
			var step = timeline.getStep(i);
			if (!step) continue;
			if (!streamId || step.streamId === streamId) return i;
		}
		return null;
	}

	function findNextInStream(pos, streamId) {
		for (var i = pos + 1; i <= timeline.lastIndex; i++) {
			var step = timeline.getStep(i);
			if (!step) continue;
			if (!streamId || step.streamId === streamId) return i;
		}
		return null;
	}

	// Debugger actions — also exposed on public API
	function stepForward() {
		// Time-travel: advance through the recorded timeline, restricted to the
		// current event-handler stream.
		if (recorder.timeTraveling) {
			var streamId = currentStreamId();
			var target = findNextInStream(ttd.current, streamId);
			if (target !== null) {
				ttd.goto(target);
				renderTimelineStep(timeline.getStep(target));
				return;
			}
			// No more steps in this stream — exit time-travel and restore the live pause view
			ttd.resume();
			if (pausedCommand) {
				showLivePause(pausedCommand, pausedCtx);
			} else {
				root.classList.remove('hs-paused');
				if (monacoEditor) debugDecorations = monacoEditor.deltaDecorations(debugDecorations, []);
				$('.d-vars').innerHTML = '';
			}
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
		showVariables(ctx);
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
		$('.d-vars').innerHTML = '';
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
		$('.d-vars').innerHTML = '';
	}
	function stepBack() {
		if (timeline.length === 0) return;
		var streamId = currentStreamId();
		// First click from a live pause: start the scan from just past lastIndex so
		// findPrevInStream considers the latest recorded step as a candidate.
		var scanFrom = recorder.timeTraveling ? ttd.current : timeline.lastIndex + 1;
		var target = findPrevInStream(scanFrom, streamId);
		if (target === null) return; // no earlier step in this stream
		root.classList.add('hs-paused');
		ttd.goto(target);
		renderTimelineStep(timeline.getStep(target));
	}

	function showSnapshotVars(snapshot) {
		var vars = $('.d-vars');
		var rows = '';
		var hasLocals = false;
		for (var key in snapshot.locals) {
			if (key === 'cookies' || key === 'clipboard') continue;
			var val = snapshot.locals[key];
			if (key === 'selection' && !val) continue;
			if (!hasLocals) { rows += '<tr><td class="d-var-scope" colspan="2">Locals</td></tr>'; hasLocals = true; }
			rows += '<tr><td>' + esc(key) + '</td><td>' + esc(fmtVar(val)) + '</td></tr>';
		}
		if (snapshot.result !== undefined) {
			rows += '<tr><td>result</td><td>' + esc(fmtVar(snapshot.result)) + '</td></tr>';
		}
		vars.innerHTML = rows ? '<table>' + rows + '</table>' : '';
	}

	// Toolbar buttons
	$('.d-step-back').addEventListener('click', stepBack);
	$('.d-step').addEventListener('click', stepForward);
	$('.d-step-over').addEventListener('click', stepOver);
	$('.d-continue').addEventListener('click', continueExec);
	$('.d-stop').addEventListener('click', stopExec);

	// Keyboard shortcuts
	document.addEventListener('keydown', function(e) {
		if (!root.classList.contains('hs-paused')) return;
		if (e.key === 'F9') { e.preventDefault(); stepBack(); }
		else if (e.key === 'F10') { e.preventDefault(); stepForward(); }
		else if (e.key === 'F11') { e.preventDefault(); stepOver(); }
		else if (e.key === 'F8') { e.preventDefault(); continueExec(); }
	});

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
		var detail = $('.d-detail');
		var script = el.getAttribute('_') || el.getAttribute('script') || el.getAttribute('data-script') || '';
		var t = el.tagName.toLowerCase();
		var id = el.id ? '#' + el.id : '';
		var c = el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).join('.') : '';
		var btns = $('.d-dbg-btns');
		detail.innerHTML = '';
		detail.insertAdjacentHTML('beforeend',
			'<div class="d-label">Element</div><div class="d-code">&lt;' + t + id + c + '&gt;</div>' +
			'<div class="d-dbg-toolbar"><span class="d-label">Hyperscript</span></div>' +
			'<div class="d-code-area"><div class="d-editor"></div><div class="d-vars"></div></div>');
		$('.d-dbg-toolbar').appendChild(btns);
		var editorReady = showInEditor($('.d-editor'), normalizeScript(script));
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
				result.then(function(v) { showResult(v); refreshPausedVars(); }).catch(function(e) { log(String(e), 'error'); });
			} else {
				showResult(result);
				refreshPausedVars();
			}
		} catch (e) { log(e.message || String(e), 'error'); refreshPausedVars(); }
	}

	function refreshPausedVars() {
		if (pausedCtx) showVariables(pausedCtx);
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
		else if (value !== undefined) { log(fmt(value), 'result'); }
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
	function fmt(v) { if (v === null) return 'null'; if (typeof v === 'string') return '"' + v + '"'; if (typeof v === 'object') { try { return JSON.stringify(v, null, 2); } catch(e) { return String(v); } } return String(v); }
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
			var list = $('.d-el-list');
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
				conCollapsed: $('.d-console').classList.contains('d-con-collapsed'),
				conSize: customConSize,
				listSize: position === 'right' ? (list.style.height || '') : (list.style.width || ''),
				selectedIdentity: elementIdentity(selectedElement),
				breakpoints: bpEntries,
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
		}
	}

	function applyState() {
		var state = loadState();
		if (!state) return false;
		if (state.dock === 'bottom' || state.dock === 'right') setDock(state.dock);
		var list = $('.d-el-list');
		if (state.listSize && list) {
			if (state.dock === 'right') list.style.height = state.listSize;
			else list.style.width = state.listSize;
		}
		if (state.conSize) {
			customConSize = state.conSize;
			if (state.dock === 'right') body.style.gridTemplateRows = '1fr 6px ' + state.conSize;
			else body.style.gridTemplateColumns = '1fr 6px ' + state.conSize;
		}
		if (state.conCollapsed) {
			$('.d-console').classList.add('d-con-collapsed');
			if (state.dock === 'right') {
				body.style.gridTemplateRows = '1fr 6px 24px';
				$('.d-con-toggle').textContent = '▲';
			} else {
				body.style.gridTemplateColumns = '1fr 6px 24px';
				$('.d-con-toggle').textContent = '◀';
			}
		}
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

	return {
		toggle: function() {
			if (root.classList.contains('hs-hidden')) { root.classList.remove('hs-hidden'); refreshElements(); }
			else { root.classList.add('hs-hidden'); hideHL(); }
			saveState();
		},
		show: function() { root.classList.remove('hs-hidden'); refreshElements(); saveState(); },
		hide: function() { root.classList.add('hs-hidden'); hideHL(); saveState(); },
		refresh: refreshElements,
		step: stepForward,
		stepOver: stepOver,
		stepBack: stepBack,
		continue: continueExec,
		stop: stopExec,
		ttd: ttd,
	};
}

export default function debuggerPlugin(_hyperscript) {
	_hyperscript.config.debugMode = true;
	var runtime = _hyperscript.internals.runtime;

	// Always create TTD components for time-travel debugging
	var maxSteps = getMaxSteps();
	var timeline = new RingBuffer(maxSteps);
	var mutationBatcher = new MutationBatcher();
	var recorder = new Recorder(timeline, mutationBatcher);
	var domRestorer = new DomRestorer(mutationBatcher, runtime);
	var ttd = new TTD(recorder, timeline, domRestorer);
	recorder.install();
	if (typeof document !== 'undefined') {
		if (document.readyState === 'loading') {
			document.addEventListener('DOMContentLoaded', function() { mutationBatcher.init(); });
		} else {
			mutationBatcher.init();
		}
	}
	globalThis.ttd = ttd;

	// DevTools panel — hidden by default, restored from localStorage if previously open
	if (typeof document !== 'undefined') {
		var panel = createPanel(_hyperscript, ttd, timeline, domRestorer, recorder);
		_hyperscript.debugger = panel;
	}
}

// Auto-register when loaded via script tag
if (typeof self !== 'undefined' && self._hyperscript) {
	self._hyperscript.use(debuggerPlugin);
}
