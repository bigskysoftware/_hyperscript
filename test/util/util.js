/* Test Utilities */

function byId(id) {
	return document.getElementById(id);
}

function make(htmlStr) {
	var makeFn = function () {
		var range = document.createRange();
		var fragment = range.createContextualFragment(htmlStr);
		var wa = getWorkArea();
		for (var i = fragment.childNodes.length - 1; i >= 0; i--) {
			var child = fragment.childNodes[i];
			_hyperscript.processNode(child);
			wa.appendChild(child);
		}
		return wa.lastChild;
	};
	if (getWorkArea()) {
		return makeFn();
	} else {
		ready(makeFn);
	}
}

function promiseAnIntIn(millis) {
	return new Promise(function (resolve, reject) {
		setTimeout(function () {
			console.log("resolving");
			resolve(42);
		}, millis);
	});
}

function promiseValueBackIn(value, millis) {
	return new Promise(function (resolve, reject) {
		setTimeout(function () {
			console.log("resolving");
			resolve(value);
		}, millis);
	});
}

function ready(fn) {
	if (document.readyState !== "loading") {
		fn();
	} else {
		document.addEventListener("DOMContentLoaded", fn);
	}
}

function getWorkArea() {
	return byId("work-area");
}

function clearWorkArea() {
	getWorkArea().innerHTML = "";
}

function evalHyperScript(src, ctx) {
	return _hyperscript(src, ctx);
}

function getParseErrorFor(src) {
	try {
		evalHyperScript(src);
	} catch (e) {
		return e.message;
	}
	return "";
}

function startsWith(str, expected) {
	assert.isNotNull(str);
	assert.equal(
		str.indexOf(expected),
		0,
		"Expected string:\n\n" +
			str +
			"\n\nto start with:\n\n" +
			expected +
			"\n\n"
	);
}

function getHTTPMethod(xhr) {
	return xhr.requestHeaders["X-HTTP-Method-Override"] || xhr.method;
}

function makeServer() {
	var server = sinon.fakeServer.create();
	server.fakeHTTPMethods = true;
	server.getHTTPMethod = function (xhr) {
		return getHTTPMethod(xhr);
	};
	return server;
}

function parseParams(str) {
	var re = /([^&=]+)=?([^&]*)/g;
	var decode = function (str) {
		return decodeURIComponent(str.replace(/\+/g, " "));
	};
	var params = {},
		e;
	if (str) {
		if (str.substr(0, 1) == "?") {
			str = str.substr(1);
		}
		while ((e = re.exec(str))) {
			var k = decode(e[1]);
			var v = decode(e[2]);
			if (params[k] !== undefined) {
				if (!Array.isArray(params[k])) {
					params[k] = [params[k]];
				}
				params[k].push(v);
			} else {
				params[k] = v;
			}
		}
	}
	return params;
}

function getQuery(url) {
	var question = url.indexOf("?");
	var hash = url.indexOf("#");
	if (hash == -1 && question == -1) return "";
	if (hash == -1) hash = url.length;
	return question == -1 || hash == question + 1
		? url.substring(hash)
		: url.substring(question + 1, hash);
}

function getParameters(xhr) {
	if (getHTTPMethod(xhr) == "GET") {
		return parseParams(getQuery(xhr.url));
	} else {
		return parseParams(xhr.requestBody);
	}
}
