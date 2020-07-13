import { fixture, assert } from '@open-wc/testing';
import { DataGenerator } from '@advanced-rest-client/arc-data-generator';
import * as sinon from 'sinon';
import '../../request-model.js';

/* eslint-disable prefer-destructuring */

/** @typedef {import('../../index').RequestModel} RequestModel */
/** @typedef {import('../../src/RequestTypes').ARCHistoryRequest} ARCHistoryRequest */
/** @typedef {import('../../src/RequestTypes').ARCSavedRequest} ARCSavedRequest */
/** @typedef {import('../../src/RequestTypes').ARCProject} ARCProject */
/** @typedef {import('@advanced-rest-client/arc-data-generator').InsertSavedResult} InsertSavedResult */

describe('RequestModel', () => {
  /**
   * @return {Promise<RequestModel>}
   */
  async function basicFixture() {
    return fixture('<request-model></request-model>');
  }

  function hasFormDataSupport() {
    const fd = new FormData();
    if (!('entries' in fd)) {
      return false;
    }
    return true;
  }

  const formDataTestRun = hasFormDataSupport() ? it : it.skip;

  const generator = new DataGenerator();

  describe('Save request with form data', () => {
    let model = /** @type RequestModel */ (null);
    const defaultRequest = {
      url: 'test-url',
      method: 'test-method',
      headers: 'test-headers',
      payload: new FormData(),
      name: 'test',
      type: 'saved',
    };

    beforeEach(async () => {
      model = await basicFixture();
      defaultRequest.payload = new FormData();
      defaultRequest.payload.append('test', 'value');
      defaultRequest.payload.append('file', new Blob(['a'], {
        type: 'application/x-test'
      }), 'test.txt');
    });

    afterEach(async () => {
      await generator.destroySavedRequestData();
    });

    it('creates request object', async () => {
      await model.saveRequest({ ...defaultRequest })
      const items = await generator.getDatastoreRequestData();
      assert.lengthOf(items, 1);
      assert.equal(items[0].url, 'test-url');
    });

    it('clears entity payload', async () => {
      const result = await model.saveRequest({ ...defaultRequest });
      const { item } = result;
      assert.isUndefined(item.payload);
    });

    (formDataTestRun)('Created entry contains multipart property', async () => {
      const result = await model.saveRequest({ ...defaultRequest });
      const { item } = result;
      assert.typeOf(item.multipart, 'array');
    });

    (formDataTestRun)('Contains text entry', async () => {
      const result = await model.saveRequest({ ...defaultRequest });
      const { item } = result;
      assert.isFalse(item.multipart[0].isFile);
      assert.equal(item.multipart[0].name, 'test');
      assert.typeOf(item.multipart[0].value, 'string');
    });

    (formDataTestRun)('Contains file entry', async () => {
      const result = await model.saveRequest({ ...defaultRequest })
      const { item } = result;
      assert.isTrue(item.multipart[1].isFile);
      assert.equal(item.multipart[1].name, 'file');
      assert.typeOf(item.multipart[1].value, 'string');
    });
  });

  describe('Save request with File data', () => {
    let model = /** @type RequestModel */ (null);
    const defaultRequest = {
      url: 'test-url',
      method: 'test-method',
      headers: 'test-headers',
      payload: new Blob(['']),
      name: 'test',
      type: 'saved',
    };

    beforeEach(async () => {
      model = await basicFixture();
      const b = new Blob(['a'], {
        type: 'application/x-test'
      });
      // @ts-ignore
      b.name = 'test.txt'; // mimics file object
      defaultRequest.payload = b;
    });

    afterEach(async () => {
      await generator.destroySavedRequestData();
    });

    it('creates request object', async () => {
      // @ts-ignore
      await model.saveRequest({ ...defaultRequest });
      const items = await generator.getDatastoreRequestData();
      assert.lengthOf(items, 1);
      assert.equal(items[0].url, 'test-url');
    });

    it('Created entry\'s payload is cleared', async () => {
      // @ts-ignore
      const result = await model.saveRequest({ ...defaultRequest });
      const { item } = result;
      assert.isUndefined(item.payload);
    });

    it('Created entry contains blob property', async () => {
      // @ts-ignore
      const result = await model.saveRequest({ ...defaultRequest });
      const { item } = result;
      assert.typeOf(item.blob, 'string');
    });

    function dataURLtoBlob(dataurl) {
      const arr = dataurl.split(',');
      const mime = arr[0].match(/:(.*?);/)[1];
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      return new Blob([u8arr], {
        type: mime
      });
    }

    it('Blob entry can be restored', async () => {
      // @ts-ignore
      const result = await model.saveRequest({ ...defaultRequest });
      const { item } = result;
      const blob = dataURLtoBlob(item.blob);
      assert.equal(blob.size, defaultRequest.payload.size);
    });
  });

  describe('saveRequest()', () => {
    describe('Request type setup', () => {
      let model = /** @type RequestModel */ (null);

      beforeEach(async () => {
        model = await basicFixture();
      });

      afterEach(async () => {
        await generator.destroyHistoryData();
        await generator.destroySavedRequestData();
      });

      it('Sets history if no name', async () => {
        const item = /** @type ARCHistoryRequest */ (generator.generateHistoryObject());
        delete item.type;
        const result = await model.saveRequest(item);
        const { item: request } = result;
        assert.equal(request.type, 'history');
      });

      it('Sets saved if name', async () => {
        const item = /** @type ARCSavedRequest */ (generator.generateSavedItem());
        delete item.type;
        const result = await model.saveRequest(item);
        const { item: request } = result;
        assert.equal(request.type, 'saved');
      });

      it('Keeps type if defined', async () => {
        const item = /** @type ARCHistoryRequest */ (generator.generateHistoryObject());
        item.type = 'saved';
        const result = await model.saveRequest(item);
        const { item: request } = result;
        assert.equal(request.type, 'saved');
      });

      it('Renames "drive" to "saved"', async () => {
        const item = /** @type ARCHistoryRequest */ (generator.generateHistoryObject());
        item.type = 'drive';
        const result = await model.saveRequest(item);
        const { item: request } = result;
        assert.equal(request.type, 'saved');
      });

      it('Renames "google-drive" to "saved"', async () => {
        const item = /** @type ARCHistoryRequest */ (generator.generateHistoryObject());
        item.type = 'google-drive';
        const result = await model.saveRequest(item);
        const { item: request } = result;
        assert.equal(request.type, 'saved');
      });
    });

    describe('Request id and rev', () => {
      let model = /** @type RequestModel */ (null);
      beforeEach(async () => {
        // clearProjects = false;
        model = await basicFixture();
      });

      afterEach(async () => {
        await generator.destroyHistoryData();
        await generator.destroySavedRequestData();
      });

      it('Generates an ID for the request', async () => {
        const item = /** @type ARCHistoryRequest */ (generator.generateHistoryObject());
        delete item._id;
        const result = await model.saveRequest(item);
        const { item: request } = result;
        assert.typeOf(request._id, 'string');
      });

      it('Returns the REV proeprty', async () => {
        const item = /** @type ARCHistoryRequest */ (generator.generateHistoryObject());
        const result = await model.saveRequest(item);
        const { item: request } = result;
        assert.typeOf(request._rev, 'string');
      });
    });

    describe('Google Drive save', () => {
      let model = /** @type RequestModel */ (null);
      let handleDriveEvent;

      function driveHandler(e) {
        if (!handleDriveEvent) {
          return;
        }
        e.preventDefault();
        e.detail.result = Promise.resolve({
          id: 'test-drive-id'
        });
      }

      before(() => {
        window.addEventListener('google-drive-data-save', driveHandler);
      });

      after(() => {
        window.removeEventListener('google-drive-data-save', driveHandler);
      });

      beforeEach(async () => {
        handleDriveEvent = false;
        model = await basicFixture();
      });

      afterEach(async () => {
        await generator.destroyHistoryData();
        await generator.destroySavedRequestData();
      });

      it('ignores event dispatching when when no drive info', async () => {
        const item = /** @type ARCSavedRequest */ (generator.generateSavedItem());
        const spy = sinon.spy();
        model.addEventListener('google-drive-data-save', spy);
        await model.saveRequest(item);
        assert.isFalse(spy.called);
      });

      it('rejects the promise when event not handled', async () => {
        const item = /** @type ARCSavedRequest */ (generator.generateSavedItem());
        let thrown = false;
        try {
          await model.saveRequest(item, { isDrive: true });
        } catch (e) {
          thrown = true;
        }
        assert.isTrue(thrown);
      });

      it('updates driveId on the model', async () => {
        handleDriveEvent = true;
        const item = /** @type ARCSavedRequest */ (generator.generateSavedItem());
        const result = await model.saveRequest(item, { isDrive: true })
        const { item: request } = result;
        assert.equal(request.driveId, 'test-drive-id');
      });

      it('Event contains request copy', async () => {
        handleDriveEvent = true;
        const item = /** @type ARCSavedRequest */ (generator.generateSavedItem());
        const spy = sinon.spy();
        model.addEventListener('google-drive-data-save', spy);
        model.addEventListener('google-drive-data-save', function f(e) {
          model.removeEventListener('google-drive-data-save', f);
          // @ts-ignore
          e.detail.content.url = 'test-url';
        });
        await model.saveRequest(item, { isDrive: true });
        assert.isTrue(spy.called, 'event is dispatched');
        const { detail } = spy.args[0][0];
        assert.typeOf(detail, 'object');
        assert.notEqual(detail.url, 'test-url');
      });

      it('Event contains contentType', async () => {
        handleDriveEvent = true;
        const item = /** @type ARCSavedRequest */ (generator.generateSavedItem());
        const spy = sinon.spy();
        model.addEventListener('google-drive-data-save', spy);
        await model.saveRequest(item, { isDrive: true });
        const { detail } = spy.args[0][0];
        assert.equal(detail.options.contentType, 'application/restclient+data');
      });

      it('Event contains file', async () => {
        handleDriveEvent = true;
        const item = /** @type ARCSavedRequest */ (generator.generateSavedItem());
        item.name = 'test';
        const spy = sinon.spy();
        model.addEventListener('google-drive-data-save', spy);
        await model.saveRequest(item, { isDrive: true });
        const { detail } = spy.args[0][0];
        assert.equal(detail.file, 'test.arc');
      });
    });

    describe('createRequestProjects()', () => {
      let model = /** @type RequestModel */ (null);
      const names = ['a', 'b', 'c'];
      const requestId = 'test-id';
      beforeEach(async () => {
        // clearProjects = true;
        model = await basicFixture();
      });

      afterEach(async () => {
        await generator.destroyHistoryData();
        await generator.destroySavedRequestData();
      });

      it('Creates a list of projects from names', async () => {
        await model.createRequestProjects(names)
        const list = await generator.getDatastoreProjectsData();
        assert.lengthOf(list, 3, 'Has 3 items');
        for (let i = 0; i < list.length; i++) {
          assert.notEqual(names.indexOf(list[i].name), -1);
        }
      });

      it('Adds a request id to the project', async () => {
        await model.createRequestProjects(names, requestId)
        const list = await generator.getDatastoreProjectsData();
        assert.lengthOf(list, 3, 'Has 3 items');
        for (let i = 0; i < list.length; i++) {
          assert.equal(list[i].requests[0], 'test-id');
        }
      });
    });

    describe('Synchronizes projects', () => {
      let model = /** @type RequestModel */ (null);
      let projects;
      let createProjectRequestId;
      beforeEach(async () => {
        model = await basicFixture();
        projects = await model.createRequestProjects(['a', 'b', 'c'], createProjectRequestId);
      });

      afterEach(async () => {
        await generator.destroyHistoryData();
        await generator.destroySavedRequestData();
      });

      it('Sets request ID on projects', async () => {
        const item = /** @type ARCSavedRequest */ (generator.generateSavedItem());
        item._id = 'test-projects';
        item.projects = projects;
        await model.saveRequest(item)
        const list = await generator.getDatastoreProjectsData();
        for (let i = 0; i < list.length; i++) {
          assert.equal(list[i].requests[0], 'test-projects');
        }
      });

      it('Sets request ID on single project', async () => {
        const item = /** @type ARCSavedRequest */ (generator.generateSavedItem());
        item._id = 'test-projects';
        item.projects = [projects[1]];
        await model.saveRequest(item)
        const list = await generator.getDatastoreProjectsData();
        for (let i = 0; i < list.length; i++) {
          if (list[i]._id === projects[1]) {
            assert.equal(list[i].requests[0], 'test-projects');
          } else {
            assert.lengthOf(list[i].requests, 0);
          }
        }
      });

      it('Just setting a flag for the next test', async () => {
        createProjectRequestId = 'test-projects';
      });

      it('Removes request ID prom projects', async () => {
        createProjectRequestId = undefined;
        const item = /** @type ARCSavedRequest */ (generator.generateSavedItem());
        item._id = 'test-projects';
        item.projects = [projects[1]];
        await model.saveRequest(item)
        const list = await generator.getDatastoreProjectsData();
        for (let i = 0; i < list.length; i++) {
          if (list[i]._id === projects[1]) {
            assert.equal(list[i].requests[0], 'test-projects');
          } else {
            assert.lengthOf(list[i].requests, 0);
          }
        }
      });
    });
  });

  describe('saveHistory()', () => {
    let model = /** @type RequestModel */ (null);
    let requests = /** @type ARCHistoryRequest[] */ (null);
    before(async () => {
      requests = await generator.insertHistoryRequestData();
    });

    after(async () => {
      await generator.destroyHistoryData();
    });

    beforeEach(async () => {
      model = await basicFixture();
    });

    it('inserts a new item', async () => {
      const item = /** @type ARCHistoryRequest */ (generator.generateHistoryObject());
      const record = await model.saveHistory(item);
      const { item: created } = record;
      const result = await model.get('history', created._id);
      assert.typeOf(result, 'object');
    });

    it('returns inserted item', async () => {
      const item = /** @type ARCHistoryRequest */ (generator.generateHistoryObject());
      const record = await model.saveHistory(item);
      const { item: created } = record;
      assert.typeOf(created, 'object', 'has the result');
      assert.typeOf(created._id, 'string', 'has _id');
      assert.typeOf(created._rev, 'string', 'has _rev');
    });

    it('adds id when missing', async () => {
      const item = /** @type ARCHistoryRequest */ (generator.generateHistoryObject());
      delete item._id;
      const record = await model.saveHistory(item);
      const { item: created } = record;
      assert.typeOf(created._id, 'string', 'has _id');
    });

    it('sets type to history', async () => {
      const item = /** @type ARCHistoryRequest */ (generator.generateHistoryObject());
      item.type = 'saved';
      const record = await model.saveHistory(item);
      const { item: created } = record;
      assert.equal(created.type, 'history');
    });

    it('updated existing item', async () => {
      const item = requests[0];
      item.type = 'saved';
      const record = await model.saveHistory(item);
      const { item: created } = record;
      assert.equal(created.type, 'history');
    });

    it('gets latest rev for existing item', async () => {
      const item = requests[0];
      delete item._rev;
      const record = await model.saveHistory(item);
      const { item: created } = record;
      assert.typeOf(created._rev, 'string');
    });
  });
});