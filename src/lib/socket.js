///=========================================================================
/// This module provides the worker feature for hyperscript
///=========================================================================
(function () {

    function genUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    function createSocket(url) {
        return new WebSocket(url.evaluate());
    }

    var BLACKLIST = ['then', 'catch', 'length', 'asyncWrapper'];

    _hyperscript.addFeature("socket", function(parser, runtime, tokens) {

        function getProxy(timeout) {
            return new Proxy({}, {
                get: function (obj, property) {
                    console.log("Proxying " + property);
                    if (BLACKLIST.indexOf(property) >= 0) {
                        return null;
                    } else if (property === "raw") {
                        return socket;
                    } else if (property === "noTimeout") {
                        return getProxy(-1);
                    } else if (property === "timeout") {
                        return function(i){
                            return getProxy(parseInt(i));
                        }
                    } else {
                        return function () {
                            var uuid = genUUID();
                            var args = [];
                            for (var i = 0; i < arguments.length; i++) {
                                args.push(arguments[i]);
                            }
                            var rpcInfo = {
                                iid: uuid,
                                function: property,
                                args: args
                            };
                            socket = socket ? socket : createSocket(url); //recreate socket if needed
                            socket.send(JSON.stringify(rpcInfo));

                            var promise = new Promise(function (resolve, reject) {
                                promises[uuid] = {
                                    resolve: resolve,
                                    reject: reject
                                }
                            })

                            if (timeout >= 0) {
                                setTimeout(function () {
                                    if (promises[uuid]) {
                                        promises[uuid].reject("Timed out");
                                    }
                                    delete promises[uuid];
                                }, timeout); // TODO configurable?
                            }
                            return promise
                        };
                    }
                }
            });
        }

        if (tokens.matchToken('socket')) {

            var name = parser.requireElement("dotOrColonPath", tokens);
            var qualifiedName = name.evaluate();
            var nameSpace = qualifiedName.split(".");
            var socketName = nameSpace.pop();

            var promises = {};
            var url = parser.requireElement("stringLike", tokens);

            var socket = createSocket(url);
            socket.onmessage = function (evt) {
                var data = evt.data;
                var dataAsJson = JSON.parse(data);
                if (dataAsJson.iid) {
                    if (dataAsJson.throw) {
                        promises[dataAsJson.iid].reject(dataAsJson.throw);
                    } else {
                        promises[dataAsJson.iid].resolve(dataAsJson.return);
                    }
                    delete promises[dataAsJson.iid];
                }
            };


            // clear socket on close to be recreated
            socket.addEventListener('close', function(e){
                console.log(e);
                socket = null;
            });

            var proxy = getProxy(10000) // TODO make a default

            return {
                name: socketName,
                worker: socket,
                install: function () {
                    runtime.assignToNamespace(nameSpace, socketName, proxy)
                }
            };
        }
    })
})()