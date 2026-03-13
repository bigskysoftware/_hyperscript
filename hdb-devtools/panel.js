function continueExec() {
  evalInPage(
    "globalThis._hyperscript.hdb && globalThis._hyperscript.hdb.continueExec()",
  );
}

function skipTo(index) {
  evalInPage(
    "globalThis._hyperscript.hdb && globalThis._hyperscript.hdb.skipTo(" +
      index +
      ")",
  );
}

function stepOver() {
  evalInPage(
    "globalThis._hyperscript.hdb && globalThis._hyperscript.hdb.stepOver()",
  );
}

function evaluateExpression(expr) {
  evalInPage(
    `globalThis._hyperscript.hdb && globalThis._hyperscript.hdb.evaluateExpression("${expr}")`,
  );
}

// Reset panel state on page navigation/reload
chrome.devtools.network.onNavigated.addListener(function () {
  lastCounter = 0;
  document.querySelector(".code-container code").innerHTML = "";
  document.querySelector("#console").innerHTML = "";
});

// Poll for breakpoint hits and keep debuggerOpen flag set
var lastCounter = 0;

setInterval(function () {
  evalInPage(
    "typeof _hyperscript !== 'undefined' && (_hyperscript.debuggerOpen = true)",
  );
  evalInPage(
    "globalThis._hyperscript.hdb && globalThis._hyperscript.hdb.getCounter()",
    function (counter) {
      if (counter && counter !== lastCounter) {
        lastCounter = counter;
        onBreakpointHit();
      }
    },
  );
}, 250);

function onBreakpointHit() {
  evalInPage(
    "globalThis._hyperscript.hdb && globalThis._hyperscript.hdb.getRenderedCode()",
    function (html) {
      if (html != null) {
        document.querySelector(".code-container code").innerHTML = html;
        if (html) {
          _hyperscript.processNode(
            document.querySelector(".code-container code"),
          );
        }
      }
    },
  );

  evalInPage(
    "globalThis._hyperscript.hdb && globalThis._hyperscript.hdb.getRenderedConsole()",
    function (html) {
      const consoleEl = document.querySelector("#console");
      consoleEl.innerHTML = html;
      consoleEl.scrollTop = consoleEl.scrollHeight;
    },
  );
}

function escapeHTML(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\\x22/g, "&quot;")
    .replace(/\\x27/g, "&#039;");
}

function evalInPage(expression, callback) {
  chrome.devtools.inspectedWindow.eval(
    expression,
    function (result, exceptionInfo) {
      if (exceptionInfo) {
        console.error("eval error:", exceptionInfo);
      }
      if (callback) callback(result, exceptionInfo);
    },
  );
}
