
## The `worker` feature

### Installing

Note: if you want the worker feature, you must either use the "Whole 9 Yards" release of hyperscript, or include the `/dist/workers.js` file.

### Syntax

`worker <worker-name>[(<external-scripts>)] <worker-body> end`

* `worker-name` is a name for the worker. This is variable to which this worker will be assigned.
* `external-scripts` can be a comma-separated list of string literals, which contain URLs for any extra JavaScript this worker depends on. These URLs will be imported in the worker using [`importScripts`][import].
* `worker-body` is a sequence of [function declarations][functions] and [JavaScript blocks][js-blocks].

### Description

\_hyperscript allows you to create Web Workers whose functions are exposed to the main thread. 

```hyperscript
worker Incrementer
  js
    function _increment(n) { return n + 1 }
  end
  def increment(n) return _increment(n) end
end
```

Any function declarations (declared with `def`) will be exposed on the main thread, so the above worker can be invoked as `Incrementer.increment(4)` in either \_hyperscript or JavaScript. The body of the function will then run in the worker and the result returned asynchronously to the main thread. As a result, the `worker` feature can be used to perform calculations in a non-blocking way, and although these worker functions return promises, \_hyperscript's [async-transparent] nature means we can call it as if it were synchronous. In summary:
* Functions are declared in workers
* They can be called from the main thread just like normal functions
* They return promises
	+ When calling worker functions from \_hyperscript code, you don't need to worry about this fact

Because it runs in a Web Worker, the code inside a `worker` body cannot access the DOM or the `window` global scope. It also can't access scripts included in the main thread, which is what the `external-scripts` feature is for. URLs passed in as external scripts, if relative, need to be relative to the HTML document which spawns the worker. 

### Examples

#### Run CPU-heavy operations in a worker

```html
<script type="text/hyperscript">
worker Miner("/scripts/mine-crypto.js")
	js
		var miner = new CryptoMiner();
		return { miner }
	end

	def startMining() miner.start() end
	def stopMining() miner.stop() end
end
</script>

<label>
    <input type=checkbox _="on change
                            if me.checked Miner.startMining()
                            else Miner.stopMining()">
    Disable ads <small>and enable cryptocurrency mining</small>
</label>
```

[import]: https://developer.mozilla.org/en-US/docs/Web/API/WorkerGlobalScope/importScripts
[functions]: /features/def/
[js-blocks]: /features/js/
