const pluginSass = require("eleventy-plugin-sass");

module.exports = function(config) {
    config.addPassthroughCopy("css");
    config.addPassthroughCopy("img");
    config.addPassthroughCopy("js");
    config.addPlugin(pluginSass, {});
}
