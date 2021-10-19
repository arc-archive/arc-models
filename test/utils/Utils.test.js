import {  assert } from '@open-wc/testing';
import { DataGenerator } from '@advanced-rest-client/arc-data-generator';
import {
  normalizeRequest,
  findUndeletedRevision,
  revertDelete,
  computeMidnight,
  computeTime,
  normalizeRequestType,
  normalizeProjects,
} from '../../src/Utils.js';

const generator = new DataGenerator();

/* eslint-disable prefer-destructuring */
/* global PouchDB */

/** @typedef {import('@advanced-rest-client/events').ArcRequest.ARCHistoryRequest} ARCHistoryRequest */
/** @typedef {import('@advanced-rest-client/events').Project.ARCProject} ARCProject */

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

  describe('findUndeletedRevision()', () => {
    it('Finds revision before delete', () => {
      const revs = {
        start: 3,
        ids: ['aaa', 'bbb', 'ccc'],
      };
      const deleted = '3-aaa';
      const result = findUndeletedRevision(revs, deleted);
      assert.equal(result, '2-bbb');
    });

    it('Returns null when not found', () => {
      const revs = {
        start: 3,
        ids: ['aaa', 'bbb', 'ccc'],
      };
      const deleted = '4-000';
      const result = findUndeletedRevision(revs, deleted);
      assert.equal(result, null);
    });
  });

  describe('revertDelete()', () => {
    const db = new PouchDB('revert-test-database');

    after(async () => db.destroy());

    it('throws when no database argument', async () => {
      let thrown = false;
      try {
        await revertDelete(undefined, []);
      } catch (e) {
        thrown = true;
      }
      assert.isTrue(thrown);
    });

    it('throws when no items argument', async () => {
      let thrown = false;
      try {
        await revertDelete(db, undefined);
      } catch (e) {
        thrown = true;
      }
      assert.isTrue(thrown);
    });

    async function getRemovedItem() {
      const doc = /** @type ARCHistoryRequest */ (generator.generateHistoryObject());
      const createResult = await db.post(doc);
      doc._rev = createResult.rev;
      // @ts-ignore
      const removeResult = await db.remove(doc);
      doc._rev = removeResult.rev;
      return doc;
    }

    function deleted(doc) {
      return {
        id: doc._id,
        rev: doc._rev,
      }
    }

    it('returns change record for each removed item', async () => {
      const doc1 = await getRemovedItem();
      const doc2 = await getRemovedItem();
      const result = await revertDelete(db, [deleted(doc1), deleted(doc2)]);
      assert.typeOf(result, 'array');
      assert.lengthOf(result, 2);
      const [item] = result;
      // LOG: Object{item: Object{prop: true, _id: 'test-1', _rev: '3-ae6e4ebde829bf8729f67e0cdf75743c'}, oldRev: '2-39c3e2200b1e12de4edbfb56b2005146'}
      assert.equal(item.id, doc1._id, 'has the id of the restored object');
      assert.notEqual(item.rev, doc1._rev, 'has rev that is different');
      assert.include(item.rev, '3-', 'has updated rev');
      delete item.item.midnight;
      // @ts-ignore
      delete doc1.midnight;
      assert.deepEqual(item.item, { ...doc1, _rev: item.rev }, 'has restored object');
      assert.equal(item.oldRev, doc1._rev, 'has old rev');
    });

    it('ignores unknown items', async () => {
      const doc = await getRemovedItem();
      const result = await revertDelete(db, [deleted(doc), { id: 'unknown', rev: 'other' }]);
      assert.typeOf(result, 'array');
      assert.lengthOf(result, 1);
    });

    it('ignores not deleted items', async () => {
      const doc1 = await getRemovedItem();
      const doc2 = /** @type ARCHistoryRequest */ (generator.generateHistoryObject());
      const createResult = await db.post(doc2);
      doc2._rev = createResult.rev;
      const result = await revertDelete(db, [deleted(doc1), deleted(doc2)]);
      assert.typeOf(result, 'array');
      assert.lengthOf(result, 1);
    });
  });

  describe('computeMidnight()', () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    const todaysMidnight = d.getTime();

    it('returns todays midnight when invalid argument', () => {
      const result = computeMidnight(undefined);
      assert.equal(result, todaysMidnight);
    });

    it('returns todays midnight for today', () => {
      const result = computeMidnight(Date.now());
      assert.equal(result, todaysMidnight);
    });
  });

  describe('computeTime()', () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    const todaysMidnight = d.getTime();

    it('adds _time', () => {
      const result = computeTime({ time: Date.now() });
      // @ts-ignore
      assert.equal(result._time, todaysMidnight);
    });

    it('returns a copy', () => {
      const obj = { time: Date.now() };
      computeTime(obj);
      assert.isUndefined(obj._time);
    });
  });

  describe('normalizeRequestType()', () => {
    it('processes saved-requests', () => {
      const result = normalizeRequestType('saved-requests');
      assert.equal(result, 'saved');
    });

    it('processes history-requests', () => {
      const result = normalizeRequestType('history-requests');
      assert.equal(result, 'history');
    });

    it('processes legacy-projects', () => {
      const result = normalizeRequestType('legacy-projects');
      assert.equal(result, 'projects');
    });
  });

  describe('[normalizeProjects]()', () => {
    it('filters out invalid items', () => {
      // @ts-ignore
      const result = normalizeProjects(['test']);
      assert.deepEqual(result, []);
    });

    it('adds order property', () => {
      const project = /** @type ARCProject */ (generator.createProjectObject());
      delete project.order;
      const result = normalizeProjects([project]);
      assert.equal(result[0].order, 0);
    });

    it('respects existing order property', () => {
      const project = /** @type ARCProject */ (generator.createProjectObject());
      project.order = 1;
      const result = normalizeProjects([project]);
      assert.equal(result[0].order, 1);
    });

    it('adds requests property', () => {
      const project = /** @type ARCProject */ (generator.createProjectObject());
      delete project.requests;
      const result = normalizeProjects([project]);
      assert.deepEqual(result[0].requests, []);
    });

    it('respects existing order property', () => {
      const project = /** @type ARCProject */ (generator.createProjectObject());
      project.requests = ['test'];
      const result = normalizeProjects([project]);
      assert.deepEqual(result[0].requests, ['test']);
    });

    it('adds updated property', () => {
      const project = /** @type ARCProject */ (generator.createProjectObject());
      delete project.updated;
      const result = normalizeProjects([project]);
      assert.typeOf(result[0].updated, 'number');
    });

    it('adds created property', () => {
      const project = /** @type ARCProject */ (generator.createProjectObject());
      delete project.created;
      const result = normalizeProjects([project]);
      assert.typeOf(result[0].created, 'number');
      assert.equal(result[0].created, result[0].updated);
    });

    it('respects existing created property', () => {
      const project = /** @type ARCProject */ (generator.createProjectObject());
      project.created = 10;
      const result = normalizeProjects([project]);
      assert.equal(result[0].created, 10);
    });
  });
});
