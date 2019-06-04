/* eslint-disable import/no-extraneous-dependencies */
const merge = require('webpack-merge');
// const slSettings = require('@advanced-rest-client/testing-karma-sl/sl-settings.js');
const createBaseConfig = require('./karma.conf.js');

module.exports = (config) => {
  const customLaunchers = {
    'SL_Chrome': {
      base: 'SauceLabs',
      browserName: 'chrome',
      version: 'latest',
      platform: 'Windows 10'
    },
    'SL_Chrome-1': {
      base: 'SauceLabs',
      browserName: 'chrome',
      version: 'latest-1',
      platform: 'Windows 10'
    },
    'SL_Firefox': {
      base: 'SauceLabs',
      browserName: 'firefox',
      version: 'latest',
      platform: 'Windows 10'
    },
    'SL_Firefox-1': {
      base: 'SauceLabs',
      browserName: 'firefox',
      version: 'latest-1',
      platform: 'Windows 10'
    }
  };
  const cnf = {
    sauceLabs: {
      testName: 'arc-models'
    },
    customLaunchers,
    browsers: Object.keys(customLaunchers),
    reporters: ['dots', 'saucelabs'],
    transports: ['websocket', 'polling']
  };
  if (process.env.TRAVIS) {
    const buildLabel = 'TRAVIS #' + process.env.TRAVIS_BUILD_NUMBER + ' (' + process.env.TRAVIS_BUILD_ID + ')';

    cnf.browserStack = {
      build: buildLabel,
      tunnelIdentifier: process.env.TRAVIS_JOB_NUMBER
    };

    cnf.sauceLabs.build = buildLabel;
    cnf.sauceLabs.tunnelIdentifier = process.env.TRAVIS_JOB_NUMBER;
  }

  config.set(
    merge(createBaseConfig(config), cnf)
  );

  return config;
};
