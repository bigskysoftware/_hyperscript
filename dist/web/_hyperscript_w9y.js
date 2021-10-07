
import _hyperscript from "../lib/core"

import web from "../lib/web"
import worker from "../lib/worker"
import socket from "../lib/socket"
import eventsource from "../lib/eventsource"
import template from "../lib/template"
import hdb from "../lib/hdb"

web(_hyperscript)
worker(_hyperscript)
socket(_hyperscript)
eventsource(_hyperscript)
template(_hyperscript)
hdb(_hyperscript)

export default _hyperscript