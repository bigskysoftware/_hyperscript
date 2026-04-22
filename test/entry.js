import _hyperscript from '../src/_hyperscript.js'

// Extensions auto-register via self._hyperscript.use() when imported
import '../src/ext/tailwind.js'

import '../src/ext/debugger.js'
import '../src/ext/socket.js'
import '../src/ext/component.js'
import '../src/ext/eventsource.js'

export default _hyperscript
