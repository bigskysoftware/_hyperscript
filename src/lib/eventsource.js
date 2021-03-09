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

    _hyperscript.addFeature("eventsource", function(parser, runtime, tokens) {

        if (tokens.matchToken('eventsource')) {

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

            // Makes an eventListener funtion that can execute the correct hyperscript commands
            // This is outside of the main loop so that closures don't cause us to run the wrong commands.
            function makeListener(eventSource, eventSourceFeature, eventName, encoding, commandList) {
                return function(evt) {
                    var data = decode(evt.data, encoding);
                    var context = runtime.makeContext(eventSource, eventSourceFeature, eventSource);
                    context.event = evt;
                    context.it = data;

                    commandList.execute(context);    
                }
            }

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
                
                // get event name
                var eventName = parser.requireElement("dotOrColonPath", tokens, "Expected event name").evaluate();  // OK to evaluate this in real-time?

                // default encoding is "" (autodetect)
                var encoding = ""

                // get alternate encoding
                if (tokens.matchToken("as")) {
                    encoding = parser.requireElement("stringLike", tokens, "Expected encoding type").evaluate() // Ok to evaluate this in real time?
                }

                // get command list for this event handler
                var commandList = parser.requireElement("commandList", tokens);
                addImplicitReturnToCommandList(commandList)

                tokens.requireToken("end")

                // calling a function to create an event listener so that the closure is not overwritten by the "while" loop above.
                var eventListener = makeListener(eventSource, eventSourceFeature, eventName, encoding, commandList)

                // register the event listener
                eventSource.addEventListener(eventName, eventListener)
            }

            tokens.requireToken("end")

            // TODO: eventSource.onopen()
            // TODO: eventSource.onerror()
            // TODO: eventSource.close()

            /* clear eventSource on close to be recreated
            eventSource.addEventListener('close', function(e){
                console.log(e);
                eventSource = null;
            });
            */

            // This is experimental..  may be needed if browsers don't reconnect automatically...
            eventSource.onerror = function(event) {
                var txt;
                switch( event.target.readyState ){
                    case EventSource.CONNECTING:
                        txt = 'Connecting...';
                        break;
                    case EventSource.CLOSED:
                        txt = 'Closed...';
                        // evtSource = new EventSource("../sse.php");
                        //evtSource.onerror = evtSourceErrorHandler;
                        break;
                }
                console.log(txt);
            }

            // TODO: How to remove the EventSource from the context.  Is there a `runtime.removeFromNamespace()` function?

            return eventSourceFeature;
        }
    })
})()