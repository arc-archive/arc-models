import {  assert } from '@open-wc/testing';
import { normalizeRequest } from '../../src/Utils.js';

/* eslint-disable prefer-destructuring */

describe('Utils', () => {
  describe('normalizeRequest()', () => {

    it('Returns undefined when no request', () => {
      // @ts-ignore
      const result = normalizeRequest();
      assert.isUndefined(result);
    });

    it('Moves legacyProject to projects array', () => {
      const result = normalizeRequest({
        // @ts-ignore
        legacyProject: 'test-project',
      });
      // @ts-ignore
      assert.isUndefined(result.legacyProject);
      // @ts-ignore
      assert.deepEqual(result.projects, ['test-project']);
    });

    it('Appends legacyProject to projects array', () => {
      const result = normalizeRequest({
        // @ts-ignore
        legacyProject: 'test-project',
        projects: ['other-project'],
      });
      // @ts-ignore
      assert.isUndefined(result.legacyProject);
      // @ts-ignore
      assert.deepEqual(result.projects, ['other-project', 'test-project']);
    });

    it('Removes properties with "_"', () => {
      const result = normalizeRequest({
        // @ts-ignore
        _tmp: true,
      });
      // @ts-ignore
      assert.isUndefined(result._tmp);
    });

    it('Keeps _id and _rev', () => {
      // @ts-ignore
      const result = normalizeRequest({
        _id: '1',
        _rev: '2',
      });
      assert.equal(result._id, '1');
      assert.equal(result._rev, '2');
    });

    it('Adds created time', () => {
      // @ts-ignore
      const result = normalizeRequest({});
      assert.typeOf(result.created, 'number');
    });

    it('Adds updated time', () => {
      // @ts-ignore
      const result = normalizeRequest({});
      assert.typeOf(result.updated, 'number');
    });

    it('Keeps created time', () => {
      // @ts-ignore
      const result = normalizeRequest({
        created: 1234,
      });
      assert.equal(result.created, 1234);
    });

    it('Keeps updated time', () => {
      // @ts-ignore
      const result = normalizeRequest({
        updated: 5678,
      });
      assert.equal(result.updated, 5678);
    });
  });
});
