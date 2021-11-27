
module.exports = function(config) {
    config.addPassthroughCopy("css");
    config.addPassthroughCopy("img");
    config.addPassthroughCopy("js");
    config.addPassthroughCopy("test");
}
