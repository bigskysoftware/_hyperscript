
module.exports = function(config) {
    config.addPassthroughCopy("css");
    config.addPassthroughCopy("img");
    config.addPassthroughCopy("js");
    config.addPassthroughCopy("test");

    config.addCollection('cookbook', coll => coll.getFilteredByGlob('cookbook/*'))

    require("./_build/widgets")(config);
}
