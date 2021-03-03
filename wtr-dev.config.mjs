/** @typedef {import('@web/test-runner').TestRunnerConfig} TestRunnerConfig */

export default /** @type TestRunnerConfig */ ({
  // files: 'test/har-data/HarTransformer.test.js',
  // files: 'test/request-model/RequestModel.events.test.js',
  files: 'test/request-model/RequestModel.test.js',
  nodeResolve: true,
  concurrency: 1,
  watch: true,
  testFramework: {
    config: {
      timeout: 10000,
    },
  },
});
