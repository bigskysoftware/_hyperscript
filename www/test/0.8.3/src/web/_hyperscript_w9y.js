
import _hyperscript from "../lib/core.js"

import web from "../lib/web.js"
import worker from "../lib/worker.js"
import socket from "../lib/socket.js"
import eventsource from "../lib/eventsource.js"
import template from "../lib/template.js"
import hdb from "../lib/hdb.js"

web(_hyperscript)
worker(_hyperscript)
socket(_hyperscript)
eventsource(_hyperscript)
template(_hyperscript)
hdb(_hyperscript)

export default _hyperscript