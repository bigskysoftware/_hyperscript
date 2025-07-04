import {
  summaryReporter,
  defaultReporter
} from '@web/test-runner'

const config = {
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

		<h2>Scratch Page</h2>
		<ul>
			<li>
				<a href="playground/scratch.html">Scratch Page</a>
			</li>
		</ul>

		<h2>Mocha Test Suite</h2>
		<a href="index.html">[RUN ALL]</a>

		<script src="node_modules/chai/chai.js"></script>
		<script src="node_modules/sinon/pkg/sinon.js"></script>
		<script src="src/_hyperscript.js"></script>
		<script src="src/worker.js"></script>
		<script src="src/socket.js"></script>
		<script src="src/template.js"></script>
		<script src="src/hdb.js"></script>
		<script src="src/ext/tailwind.js"></script>

		<script class="mocha-init">
			should = chai.should();
			assert = chai.assert;
		</script>

		<script src="test/util/util.js"></script>

        <script type="module" src="${testFramework}"></script>

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

  nodeResolve: true,
  coverage: true,
  coverageConfig: {
    include: ['src/_hyperscript.js','src/hdb.js','src/socket.js','src/template.js','src/worker.js']
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