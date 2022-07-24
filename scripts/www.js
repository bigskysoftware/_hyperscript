var config = require('../package.json');
var fs = require('fs-extra');

var testRoot = "www/test/";
var currentReleaseRoot = testRoot + config.version;
fs.ensureDirSync(currentReleaseRoot);
fs.copySync("node_modules/mocha/mocha.js", currentReleaseRoot + "/node_modules/mocha/mocha.js");
fs.copySync("node_modules/mocha/mocha.css", currentReleaseRoot + "/node_modules/mocha/mocha.css");
fs.copySync("node_modules/chai/chai.js", currentReleaseRoot + "/node_modules/chai/chai.js");
fs.copySync("node_modules/sinon/pkg/sinon.js", currentReleaseRoot + "/node_modules/sinon/pkg/sinon.js");
fs.copySync("test/", currentReleaseRoot + "/test");
fs.copySync("src/", currentReleaseRoot + "/src");
fs.copySync("dist/", currentReleaseRoot + "/dist");
fs.copySync("dist/_hyperscript.min.js", "www/js/_hyperscript.min.js");
fs.copySync("dist/hdb.min.js", "www/js/hdb.min.js");

var testHTML = "<html><body style='font-family: sans-serif'><h1>Hyperscript RELEASE TESTS</h1><ul>\n"
fs.readdirSync(testRoot).reverse().forEach(function(file){
    if (file !== "index.html") {
        testHTML += "<li><a href='/test/" + file + "/test'>" + file + "</a>\n";
    }
});
testHTML += "</ul></body>"
fs.writeFileSync(testRoot + "/index.html", testHTML);
