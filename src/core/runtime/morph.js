// Morph - DOM morphing algorithm for _hyperscript
//
// Based on the htmx4 morph algorithm by Michael West.
// Efficiently updates an existing DOM tree to match new content,
// preserving node identity, focus, scroll position, and event listeners
// where possible.

/**
 * @typedef {Object} MorphCallbacks
 * @property {function(Node): void} [beforeNodeRemoved] - Called before a node is removed
 * @property {function(Node): void} [afterNodeAdded] - Called after a new node is inserted
 * @property {function(Node): void} [afterNodeMorphed] - Called after an existing node is morphed
 */

export class Morph {

    /**
     * Morph oldNode to match content.
     * @param {Element} oldNode - The existing DOM element to morph
     * @param {string|Element|DocumentFragment} content - The new content
     * @param {MorphCallbacks} [callbacks] - Optional lifecycle callbacks
     */
    morph(oldNode, content, callbacks = {}) {
        var fragment;
        if (typeof content === "string") {
            var temp = document.createElement("template");
            temp.innerHTML = content;
            fragment = temp.content;
        } else if (content instanceof DocumentFragment) {
            fragment = content;
        } else if (content instanceof Element) {
            fragment = document.createDocumentFragment();
            fragment.append(content.cloneNode(true));
        } else {
            throw new Error("morph requires an HTML string, element, or document fragment");
        }

        // If the fragment has a single root element matching the target tag,
        // treat as outer morph: sync attributes, then morph children
        var newRoot = fragment.firstElementChild;
        if (newRoot && !newRoot.nextElementSibling && newRoot.tagName === oldNode.tagName) {
            _copyAttributes(oldNode, newRoot);
            fragment = newRoot;
        }

        var { persistentIds, idMap } = _createIdMaps(oldNode, fragment);
        var pantry = document.createElement("div");
        pantry.hidden = true;
        (document.body || oldNode.parentElement).after(pantry);
        var ctx = { target: oldNode, idMap, persistentIds, pantry, futureMatches: new WeakSet(), callbacks };

        _morphChildren(ctx, oldNode, fragment);

        // clean up orphaned nodes in pantry
        callbacks.beforeNodeRemoved?.(pantry);
        pantry.remove();
    }
}

function _morphChildren(ctx, oldParent, newParent, insertionPoint = null, endPoint = null) {
    if (oldParent instanceof HTMLTemplateElement && newParent instanceof HTMLTemplateElement) {
        oldParent = oldParent.content;
        newParent = newParent.content;
    }
    insertionPoint ||= oldParent.firstChild;

    let newChild = newParent.firstChild;
    while (newChild) {
        let matchedNode;
        if (insertionPoint && insertionPoint !== endPoint) {
            matchedNode = _findBestMatch(ctx, newChild, insertionPoint, endPoint);
            if (matchedNode && matchedNode !== insertionPoint) {
                let cursor = insertionPoint;
                while (cursor && cursor !== matchedNode) {
                    let tempNode = cursor;
                    cursor = cursor.nextSibling;
                    if (tempNode instanceof Element && (ctx.idMap.has(tempNode) || _matchesUpcomingSibling(ctx, tempNode, newChild))) {
                        _moveBefore(oldParent, tempNode, endPoint);
                    } else {
                        _removeNode(ctx, tempNode);
                    }
                }
            }
        }

        if (!matchedNode && newChild instanceof Element && ctx.persistentIds.has(newChild.id)) {
            let escapedId = CSS.escape(newChild.id);
            matchedNode = (ctx.target.id === newChild.id && ctx.target) ||
                ctx.target.querySelector('[id="' + escapedId + '"]') ||
                ctx.pantry.querySelector('[id="' + escapedId + '"]');
            let element = matchedNode;
            while ((element = element.parentNode)) {
                let idSet = ctx.idMap.get(element);
                if (idSet) {
                    idSet.delete(matchedNode.id);
                    if (!idSet.size) ctx.idMap.delete(element);
                }
            }
            _moveBefore(oldParent, matchedNode, insertionPoint);
        }

        if (matchedNode) {
            _morphNode(matchedNode, newChild, ctx);
            insertionPoint = matchedNode.nextSibling;
            newChild = newChild.nextSibling;
            continue;
        }

        let nextNewChild = newChild.nextSibling;
        if (ctx.idMap.has(newChild)) {
            let placeholder = document.createElement(newChild.tagName);
            oldParent.insertBefore(placeholder, insertionPoint);
            _morphNode(placeholder, newChild, ctx);
            insertionPoint = placeholder.nextSibling;
        } else {
            oldParent.insertBefore(newChild, insertionPoint);
            ctx.callbacks.afterNodeAdded?.(newChild);
            insertionPoint = newChild.nextSibling;
        }
        newChild = nextNewChild;
    }

    while (insertionPoint && insertionPoint !== endPoint) {
        let tempNode = insertionPoint;
        insertionPoint = insertionPoint.nextSibling;
        _removeNode(ctx, tempNode);
    }
}

function _morphNode(oldNode, newNode, ctx) {
    if (!(oldNode instanceof Element)) return;
    _copyAttributes(oldNode, newNode);
    if (oldNode instanceof HTMLTextAreaElement && oldNode.defaultValue !== newNode.defaultValue) {
        oldNode.value = newNode.value;
    }
    if (!oldNode.isEqualNode(newNode) || newNode.tagName === "TEMPLATE" || newNode.querySelector?.("template")) {
        _morphChildren(ctx, oldNode, newNode);
    }
    ctx.callbacks.afterNodeMorphed?.(oldNode);
}

function _findBestMatch(ctx, node, startPoint, endPoint) {
    if (!(node instanceof Element)) return null;
    var softMatch = null, displaceMatchCount = 0, scanLimit = 10;
    var newSet = ctx.idMap.get(node), nodeMatchCount = newSet?.size || 0;
    if (node.id && !newSet) return null;
    var cursor = startPoint;
    while (cursor && cursor !== endPoint) {
        var oldSet = ctx.idMap.get(cursor);
        if (_isSoftMatch(cursor, node)) {
            if (oldSet && newSet && [...oldSet].some(id => newSet.has(id))) return cursor;
            if (!oldSet) {
                if (scanLimit > 0 && cursor.isEqualNode(node)) return cursor;
                if (!softMatch) softMatch = cursor;
            }
        }
        displaceMatchCount += oldSet?.size || 0;
        if (displaceMatchCount > nodeMatchCount) break;
        if (cursor.contains(document.activeElement)) break;
        if (--scanLimit < 1 && nodeMatchCount === 0) break;
        cursor = cursor.nextSibling;
    }
    if (softMatch && _matchesUpcomingSibling(ctx, softMatch, node)) return null;
    return softMatch;
}

function _matchesUpcomingSibling(ctx, oldElt, startNode) {
    if (ctx.futureMatches.has(oldElt)) return true;
    for (var sibling = startNode.nextSibling, i = 0; sibling && i < 10; sibling = sibling.nextSibling, i++) {
        if (sibling instanceof Element && oldElt.isEqualNode(sibling)) {
            ctx.futureMatches.add(oldElt);
            return true;
        }
    }
    return false;
}

function _removeNode(ctx, node) {
    if (ctx.idMap.has(node)) {
        _moveBefore(ctx.pantry, node, null);
    } else {
        ctx.callbacks.beforeNodeRemoved?.(node);
        node.remove();
    }
}

function _moveBefore(parentNode, element, after) {
    if (parentNode.moveBefore) {
        try { parentNode.moveBefore(element, after); return; } catch (e) {}
    }
    parentNode.insertBefore(element, after);
}

function _copyAttributes(destination, source) {
    for (var attr of source.attributes) {
        if (destination.getAttribute(attr.name) !== attr.value) {
            destination.setAttribute(attr.name, attr.value);
            if (attr.name === "value" && destination instanceof HTMLInputElement && destination.type !== "file") {
                destination.value = attr.value;
            }
        }
    }
    for (var i = destination.attributes.length - 1; i >= 0; i--) {
        var attr = destination.attributes[i];
        if (attr && !source.hasAttribute(attr.name)) {
            destination.removeAttribute(attr.name);
        }
    }
}

function _isSoftMatch(oldNode, newNode) {
    if (!(oldNode instanceof Element) || oldNode.tagName !== newNode.tagName) return false;
    if (oldNode.tagName === "SCRIPT" && !oldNode.isEqualNode(newNode)) return false;
    return !oldNode.id || oldNode.id === newNode.id;
}

function _createIdMaps(oldNode, newContent) {
    var oldIdElements = _queryEltAndDescendants(oldNode, "[id]");
    var newIdElements = newContent.querySelectorAll("[id]");
    var persistentIds = _createPersistentIds(oldIdElements, newIdElements);
    var idMap = new Map();
    _populateIdMapWithTree(idMap, persistentIds, oldNode.parentElement, oldIdElements);
    _populateIdMapWithTree(idMap, persistentIds, newContent, newIdElements);
    return { persistentIds, idMap };
}

function _createPersistentIds(oldIdElements, newIdElements) {
    var duplicateIds = new Set(), oldIdTagNameMap = new Map();
    for (var { id, tagName } of oldIdElements) {
        if (oldIdTagNameMap.has(id)) duplicateIds.add(id);
        else if (id) oldIdTagNameMap.set(id, tagName);
    }
    var persistentIds = new Set();
    for (var { id, tagName } of newIdElements) {
        if (persistentIds.has(id)) duplicateIds.add(id);
        else if (oldIdTagNameMap.get(id) === tagName) persistentIds.add(id);
    }
    for (var id of duplicateIds) persistentIds.delete(id);
    return persistentIds;
}

function _populateIdMapWithTree(idMap, persistentIds, root, elements) {
    for (var elt of elements) {
        if (persistentIds.has(elt.id)) {
            var current = elt;
            while (current && current !== root) {
                var idSet = idMap.get(current);
                if (idSet == null) { idSet = new Set(); idMap.set(current, idSet); }
                idSet.add(elt.id);
                current = current.parentElement;
            }
        }
    }
}

function _queryEltAndDescendants(elt, selector) {
    var results = [...(elt.querySelectorAll?.(selector) ?? [])];
    if (elt.matches?.(selector)) results.unshift(elt);
    return results;
}
