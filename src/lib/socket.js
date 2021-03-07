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

    _hyperscript.addFeature("socket", function(parser, runtime, tokens) {
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
                    promises[dataAsJson.iid].resolve(dataAsJson.response);
                    delete promises[dataAsJson.iid];
                }
            };

            // clear socket on close to be recreated
            socket.addEventListener('close', function(){
                socket = null;
            });

            var proxy = new Proxy({}, {
                get : function(obj, property){
                    if (property === "raw") {
                        return socket;
                    } else if (property.indexOf("call") == 0) {
                        return function () {
                            var uuid = genUUID();
                            var args = [];
                            for (var i = 0; i < arguments.length; i++) {
                                args.push(arguments[i]);
                            }
                            var rpcInfo = {
                                iid: uuid,
                                function: property.substring(4),
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

                            setTimeout(function () {
                                if (promises[uuid]) {
                                    promises[uuid].reject("Timed out");
                                }
                                delete promises[uuid];
                            }, 10000); // TODO configurable?

                            return promise
                        };
                    }
                }
            })

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