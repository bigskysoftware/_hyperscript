import {
  summaryReporter,
  defaultReporter
} from '@web/test-runner'
import { playwrightLauncher } from '@web/test-runner-playwright'

const config = {
  browsers: [
    playwrightLauncher({ product: 'chromium' }),
  ],
  concurrency: 10,
  testRunnerHtml: (testFramework) => `
<!doctype html>
<html lang="en">
	<head>
		<meta charset="utf-8" />
		<title>Mocha Tests</title>
		<meta name="viewport" content="width=device-width, initial-scale=1.0" />
		<link rel="stylesheet" href="../node_modules/mocha/mocha.css" />
		<meta
			http-equiv="cache-control"
			content="no-cache, must-revalidate, post-check=0, pre-check=0"
		/>
		<meta http-equiv="cache-control" content="max-age=0" />
		<meta http-equiv="expires" content="0" />
		<meta http-equiv="expires" content="Tue, 01 Jan 1980 1:00:00 GMT" />
		<meta http-equiv="pragma" content="no-cache" />
		<meta
			name="htmx-config"
			content='{"historyEnabled":false,"defaultSettleDelay":0}'
		/>
	</head>
	<body style="padding: 20px; font-family: sans-serif">
		<h1 style="margin-top: 40px">core.js test suite</h1>

		<h2>Mocha Test Suite</h2>

		<script src="node_modules/chai/chai.js"></script>
		<script src="node_modules/sinon/pkg/sinon.js"></script>
		<script type="module">
			import _hyperscript from '../src/_hyperscript.js';

			// Set on global for tests
			self._hyperscript = _hyperscript;
			console.log('✓ _hyperscript loaded as ES module');

			// Load extensions as modules
			await import('../src/ext/worker.js');
			await import('../src/ext/socket.js');
			await import('../src/ext/template.js');
			await import('../src/ext/hdb.js');
			await import('../src/ext/tailwind.js');
		</script>

		<script type="module" src="${testFramework}"></script>

		<script class="mocha-init">
			should = chai.should();
			assert = chai.assert;
		</script>

		<script src="test/util/util.js"></script>

		<!-- extensions -->
		<script src="test/ext/tailwind.js"></script>

		<div id="mocha"></div>

		<script class="mocha-exec">
			mocha.run();
		</script>
		<em>Work Area</em>
		<hr />
		<div id="work-area" hx-history-elt></div>
	</body>
</html>
`,

  nodeResolve: false,
  coverage: true,
  coverageConfig: {
    include: ['src/**/*.js']
  },
  files: [
    'test/commands/**/*.js',
    'test/core/**/*.js',
    'test/expressions/**/*.js',
    'test/features/**/*.js',
    'test/templates/**/*.js'
  ],
  reporters: [summaryReporter({ flatten: false, reportTestLogs: false, reportTestErrors: true }), defaultReporter({ reportTestProgress: true, reportTestResults: true })]
}

export default config