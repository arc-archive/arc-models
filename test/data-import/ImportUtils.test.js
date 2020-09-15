import { assert } from '@open-wc/testing';
import { DataHelper } from './DataHelper.js';
import {
  isSingleRequest,
  isOldImport,
  isObject,
  isPostman,
  isArcFile,
  prepareImportObject,
} from '../../index.js';

describe('ImportUtils', () => {
  describe('isSingleRequest()', () => {
    it('Returns false when not request data', () => {
      const result = isSingleRequest({});
      assert.isFalse(result);
    });

    it('Returns false when request size is > 1', () => {
      const result = isSingleRequest({
        requests: [{}, {}]
      });
      assert.isFalse(result);
    });

    it('Returns true when import object has single request', () => {
      const request = DataHelper.generateSingleRequestImport();
      const result = isSingleRequest(request);
      assert.isTrue(result);
    });

    it('Ignores empty projects', () => {
      const request = DataHelper.generateSingleRequestImport();
      request.projects = [];
      const result = isSingleRequest(request);
      assert.isTrue(result);
    });

    it('Ignores empty history', () => {
      const request = DataHelper.generateSingleRequestImport();
      request.history = [];
      const result = isSingleRequest(request);
      assert.isTrue(result);
    });
  });

  describe('isOldImport()', () => {
    it('Returns false when not a request object', () => {
      const result = isOldImport({});
      assert.isFalse(result);
    });

    it('Returns false when arc import', () => {
      const result = isOldImport({
        projects: [],
        requests: []
      });
      assert.isFalse(result);
    });

    it('Returns true when single request object', () => {
      const result = isOldImport({
        headers: 'a',
        url: 'b',
        method: 'c'
      });
      assert.isTrue(result);
    });
  });

  describe('isArcFile()', () => {
    it('Returns false when no argument', () => {
      const result = isArcFile(undefined);
      assert.isFalse(result);
    });

    it('Returns false when not an object', () => {
      const result = isArcFile([]);
      assert.isFalse(result);
    });

    it('Returns false when not ARC kind', () => {
      const result = isArcFile({
        kind: 'test'
      });
      assert.isFalse(result);
    });

    it('Returns true when ARC kind', () => {
      const result = isArcFile({
        kind: 'ARC#AllDataExport'
      });
      assert.isTrue(result);
    });

    [
      'projects', 'requests', 'history', 'url-history',
      'websocket-url-history', 'variables', 'headers-sets', 'auth-data',
      'cookies'
    ].forEach((prop) => {
      it(`Returns true when property ${prop} is set`, () => {
        const data = {};
        data[prop] = true;
        const result = isArcFile(data);
        assert.isTrue(result);
      });
    });

    it('Returns true when very very old arc import', () => {
      const result = isArcFile({
        headers: 'a',
        url: 'b',
        method: 'c'
      });
      assert.isTrue(result);
    });

    it('Returns false otherwise', () => {
      const result = isArcFile({});
      assert.isFalse(result);
    });
  });

  describe('isObject()', () => {
    it('returns true when empty object', () => {
      const result = isObject({});
      assert.isTrue(result);
    });

    it('returns true when not empty object', () => {
      const result = isObject({ prop: 'value' });
      assert.isTrue(result);
    });

    it('returns false when string', () => {
      // @ts-ignore
      const result = isObject(true);
      assert.isFalse(result);
    });

    it('returns false when number', () => {
      // @ts-ignore
      const result = isObject(123);
      assert.isFalse(result);
    });

    it('returns false when null', () => {
      // @ts-ignore
      const result = isObject(null);
      assert.isFalse(result);
    });

    it('returns false when undefined', () => {
      // @ts-ignore
      const result = isObject(undefined);
      assert.isFalse(result);
    });

    it('returns false when Date', () => {
      // @ts-ignore
      const result = isObject(new Date());
      assert.isFalse(result);
    });
  });

  describe('isPostman()', () => {
    it('returns true when has _postman_variable_scope', () => {
      const result = isPostman({
        _postman_variable_scope: [],
      });
      assert.isTrue(result);
    });

    it('returns true when has folders and requests', () => {
      const result = isPostman({
        requests: [],
        folders: [],
      });
      assert.isTrue(result);
    });

    it('returns true when has info and schema', () => {
      const result = isPostman({
        info: {
          schema: [],
        },
      });
      assert.isTrue(result);
    });

    it('returns true when has version and collections', () => {
      const result = isPostman({
        version: 1,
        collections: [],
      });
      assert.isTrue(result);
    });

    it('returns false when has no version and collections', () => {
      const result = isPostman({
        collections: [],
      });
      assert.isFalse(result);
    });

    it('returns false when has info and no schema', () => {
      const result = isPostman({
        info: {},
      });
      assert.isFalse(result);
    });

    it('returns false when has folders and no requests', () => {
      const result = isPostman({
        folders: [],
      });
      assert.isFalse(result);
    });
  });

  describe('prepareImportObject()', () => {
    it('returns the same object when is an object', () => {
      const obj = {};
      const result = prepareImportObject(obj);
      assert.isTrue(result === obj);
    });

    it('returns parsed object from string', () => {
      const result = prepareImportObject('{"test": true}');
      assert.deepEqual(result, {
        test: true,
      });
    });

    it('throws when string is not parsable', () => {
      assert.throws(() => {
        prepareImportObject('{"test":');
      });
    });
  });
});
