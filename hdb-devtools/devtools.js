chrome.devtools.panels.create(
  "_hyperscript",
  "",
  "panel.html",
  function (panel) {
    // keep a reference to this panel so we can ensure it's showing
    // when a breakpoint is hit via globalThis.hsPanel.show()
    globalThis.hsPanel = panel;

    // the breakpoint should only pause execution while the
    // hyperscript debugger devtools panel is visible.
    // setting this variable in the content window exposes
    // that visibility state to hyperscript (hdb)
    // When the panel is hidden, set debuggerOpen to false so breakpoints are skipped.
    // Setting it to true is handled by the polling loop in panel.js.
    panel.onHidden.addListener(function () {
      chrome.devtools.inspectedWindow.eval(
        "typeof _hyperscript !== 'undefined' && (_hyperscript.debuggerOpen = false)",
      );
    });
  },
);
