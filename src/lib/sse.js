///=========================================================================
/// This module provides the worker feature for hyperscript
///=========================================================================
(function () {

    // Decodes/Unmarshals a string based on the selected encoding.  If the 
    // encoding is not recognized, attempts to auto-detect based on its content
    function decode(data, encoding) {

        // Force string encoding
        if (encoding == "string") {
            return data
        }

        // Force JSON encoding
        if (encoding == "json") {
            return JSON.parse(data)
        }

        // Otherwise, try to autodetect encoding
        try {
            return JSON.parse(data)
        } catch (e) {
            return data
        }
    }

    // Adds a "HALT" command to the commandList.
    // TODO: This seems like something that could be optimized:
    // maybe the parser could do automatically,
    // or could be a public function in the parser available to everyone,
    // or the command-executer-thingy could just handle nulls implicitly.
    function addImplicitReturnToCommandList(commandList) {

        if (commandList.next) {
            return addImplicitReturnToCommandList(commandList.next)
        }

        commandList.next = {
            type: "implicitReturn",
            op: function (context) {
                return runtime.HALT;
            },
            execute: function (context) {
                // do nothing
            }
        }
    }

    _hyperscript.addFeature("eventsource", function(parser, runtime, tokens) {

        if (tokens.matchToken('eventsource')) {

            // Get the name we'll assign to this EventSource in the hyperscript context
            var name = parser.requireElement("dotOrColonPath", tokens);
            var qualifiedName = name.evaluate();
            var nameSpace = qualifiedName.split(".");
            var eventSourceName = nameSpace.pop();

            // Get the URL of the EventSource
            var url = parser.requireElement("stringLike", tokens);

            // Get option to connect with/without credentials
            var withCredentials = false;

            if (tokens.matchToken("with")) {

                if (tokens.matchToken("credentials")) {
                    withCredentials = true;
                }
            }

            // Open the EventSource and get ready to populate event handlers
            var eventSource = new EventSource(url.evaluate(), {withCredentials:withCredentials});

            var eventSourceFeature = {
                name: eventSourceName,
                eventSource: eventSource,
                install: function () {
                    runtime.assignToNamespace(nameSpace, eventSourceName, eventSource)
                }
            };

            // Connect event listeners
            while (tokens.matchToken("on")) {
                
                var eventName = tokens.consumeIdentifier();
                var encoding = "" // default encoding is "autodetect"

                if (tokens.matchToken("as")) {
                    encoding = tokens.consumeIdentifier() // should be "json" or "string"
                }

                var messageHandler = parser.requireElement("commandList", tokens);
                addImplicitReturnToCommandList(messageHandler)

                eventSource.addEventListener(eventName, function(evt) {
                    var data = decode(evt.data, encoding);
                    var context = runtime.makeContext(eventSourceObject, eventSourceFeature, eventSourceObject);

                    context.event = evt;
                    context.it = data;
                    messageHandler.execute(context);    
                })
            }

            parser.requireElement("end")

            // TODO: eventSource.onopen()
            // TODO: eventSource.onerror()
            // TODO: eventSource.close()

            // clear eventSource on close to be recreated
            eventSource.addEventListener('close', function(e){
                console.log(e);
                eventSource = null;
            });

            // TODO: How to remove the EventSource from the context.  Is there a `runtime.removeFromNamespace()` function?

            return eventSourceFeature;
        }
    })
})()