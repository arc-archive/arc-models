export default {
  files: 'test/**/*.test.js',
  nodeResolve: true,
  concurrency: 1,
  testFramework: {
    config: {
      timeout: 10000,
    },
  },
}
