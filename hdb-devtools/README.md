# hyperscript-debugger

A browser extension for debugging hyperscript


## Why

`hdb.js` is an existing way to debug hyperscripts but it has the following limitations:
* The hdb.js script must be loaded on the page. It would be nice to have an easy way to 
  debug _any_ site that has hyperscript without needing to load a custom script
* currently if you embed any `breakpoint`s in your code and don't load `hdb.js` your script
  will crash. If you have this extension installed it will not crash the page. 
* It behaves somewhat similarly to the builtin javascript debugger; the breakpoint will 
  only break if you have the `_hyperscript` tab open in the dev console


## Setup

The extension isn't in any app stores yet, so you'll need to configure your browser to allow
unpacked extensions to run.

### Firefox

* go to `about:addons` in the url bar
* click the gear icon, then `Debug add-ons`
* click `Load Temporary Add-on`
* browse to this directory (`_hyperscript/hdb-devtools`) and open the `manifest.json` file

### Chrome/Brave

* go to `chrome://extensions`
* toggle the `Developer mode` switch to the on position
* click `Load Unpacked`
* browse to and select this directory (`_hyperscript/hdb-devtools/`)


* you should see `hyperscript-debugger` in your extension list.
* you can further confirm this is installed by opening dev console on a web page and
  verifying there is now a `_hyperscript` tab.


