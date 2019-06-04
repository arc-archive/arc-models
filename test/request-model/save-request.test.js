import { fixture, assert } from '@open-wc/testing';
import { DataGenerator } from '@advanced-rest-client/arc-data-generator/arc-data-generator.js';
import sinon from 'sinon/pkg/sinon-esm.js';
import '../../request-model.js';

describe('<request-model> - Save request', () => {
  async function basicFixture() {
    return /** @type {RequestModel} */ (await fixture('<request-model></request-model>'));
  }

  function hasFormDataSupport() {
    const fd = new FormData();
    if (!('entries' in fd)) {
      return false;
    }
    return true;
  }

  describe('Save request with form data', function() {
    let element;
    let createdId;
    let createdRev;
    const defaultRequest = {
      url: 'test-url',
      method: 'test-method',
      headers: 'test-headers',
      payload: '',
      name: 'test'
    };

    function db() {
      return new PouchDB('saved-requests');
    }

    function setCreatedData(result) {
      createdId = result._id;
      createdRev = result._rev;
    }
    describe('Simple save', function() {
      beforeEach(async () => {
        createdId = undefined;
        createdRev = undefined;
        element = await basicFixture();
        defaultRequest.payload = new FormData();
        defaultRequest.payload.append('test', 'value');
        defaultRequest.payload.append('file', new Blob(['a'], {
          type: 'application/x-test'
        }), 'test.txt');
      });

      afterEach(function() {
        if (createdId) {
          return db().remove(createdId, createdRev);
        }
      });

      after(function() {
        return db().destroy();
      });

      it('Creates request object', function() {
        return element.saveRequest(Object.assign({}, defaultRequest))
        .then((result) => {
          setCreatedData(result);
        });
      });

      it('Created entry\'s payload is cleared', function() {
        return element.saveRequest(Object.assign({}, defaultRequest))
        .then((result) => {
          setCreatedData(result);
          assert.isUndefined(result.payload);
        });
      });

      it('Created entry contains multipart property', function() {
        if (!hasFormDataSupport()) {
          return;
        }
        return element.saveRequest(Object.assign({}, defaultRequest))
        .then((result) => {
          setCreatedData(result);
          assert.typeOf(result.multipart, 'array');
        });
      });

      it('Contains text entry', function() {
        if (!hasFormDataSupport()) {
          return;
        }
        return element.saveRequest(Object.assign({}, defaultRequest))
        .then((result) => {
          setCreatedData(result);
          assert.isFalse(result.multipart[0].isFile);
          assert.equal(result.multipart[0].name, 'test');
          assert.typeOf(result.multipart[0].value, 'string');
        });
      });

      it('Contains file entry', function() {
        if (!hasFormDataSupport()) {
          return;
        }
        return element.saveRequest(Object.assign({}, defaultRequest))
        .then((result) => {
          setCreatedData(result);
          assert.isTrue(result.multipart[1].isFile);
          assert.equal(result.multipart[1].name, 'file');
          assert.typeOf(result.multipart[1].value, 'string');
        });
      });
    });

    describe('Save request with File data', function() {
      let element;
      let createdId;
      let createdRev;
      const defaultRequest = {
        url: 'test-url',
        method: 'test-method',
        headers: 'test-headers',
        payload: '',
        name: 'test'
      };

      function db() {
        return new PouchDB('saved-requests');
      }

      function setCreatedData(result) {
        createdId = result._id;
        createdRev = result._rev;
      }
      describe('Simple save', function() {
        beforeEach(async () => {
          element = await basicFixture();
          const b = new Blob(['a'], {
            type: 'application/x-test'
          });
          b.name = 'test.txt'; // mimics file object
          defaultRequest.payload = b;
        });
        afterEach(function() {
          if (createdId) {
            return db().remove(createdId, createdRev);
          }
        });

        after(function() {
          return db().destroy();
        });

        it('Creates request object', function() {
          return element.saveRequest(Object.assign({}, defaultRequest))
          .then((result) => {
            setCreatedData(result);
          });
        });

        it('Created entry\'s payload is cleared', function() {
          return element.saveRequest(Object.assign({}, defaultRequest))
          .then((result) => {
            setCreatedData(result);
            assert.isUndefined(result.payload);
          });
        });

        it('Created entry contains blob property', function() {
          return element.saveRequest(Object.assign({}, defaultRequest))
          .then((result) => {
            setCreatedData(result);
            assert.typeOf(result.blob, 'string');
          });
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

        it('Blob entry can be restored', function() {
          return element.saveRequest(Object.assign({}, defaultRequest))
            .then((result) => {
              setCreatedData(result);
              const blob = dataURLtoBlob(result.blob);
              assert.equal(blob.size, defaultRequest.payload.size);
            });
        });
      });
    });
  });

  let clearHistory = false;
  let clearSaved = false;
  // let clearProjects = false;
  function databaseCleanup() {
    const p = [];
    if (clearHistory) {
      p.push(DataGenerator.destroyHistoryData());
    }
    if (clearSaved) {
      p.push(DataGenerator.destroySavedRequestData());
    }
    // if (clearProjects) {
    //   p.push(DataGenerator.clearLegacyProjects());
    // }
    return Promise.all(p);
  }
  describe('saveRequest()', function() {
    describe('Request type setup', function() {
      let element;

      beforeEach(async () => {
        clearHistory = false;
        clearSaved = false;
        // clearProjects = false;
        element = await basicFixture();
      });

      afterEach(() => databaseCleanup());

      it('Sets history if no name', function() {
        clearHistory = true;
        const request = DataGenerator.generateHistoryObject();
        delete request.type;
        return element.saveRequest(request)
        .then((request) => {
          assert.equal(request.type, 'history');
        });
      });

      it('Sets saved if name', function() {
        clearSaved = true;
        const request = DataGenerator.generateSavedItem();
        delete request.type;
        return element.saveRequest(request)
        .then((request) => {
          assert.equal(request.type, 'saved');
        });
      });

      it('Keeps type if defined', function() {
        clearSaved = true;
        const request = DataGenerator.generateHistoryObject();
        request.type = 'saved';
        return element.saveRequest(request)
        .then((request) => {
          assert.equal(request.type, 'saved');
        });
      });

      it('Renames "drive" to "saved"', function() {
        clearSaved = true;
        const request = DataGenerator.generateHistoryObject();
        request.type = 'drive';
        return element.saveRequest(request)
        .then((request) => {
          assert.equal(request.type, 'saved');
        });
      });

      it('Renames "google-drive" to "saved"', function() {
        clearSaved = true;
        const request = DataGenerator.generateHistoryObject();
        request.type = 'google-drive';
        return element.saveRequest(request)
        .then((request) => {
          assert.equal(request.type, 'saved');
        });
      });
    });

    describe('Request id and rev', function() {
      let element;
      beforeEach(async () => {
        clearHistory = false;
        clearSaved = false;
        // clearProjects = false;
        element = await basicFixture();
      });

      afterEach(() => databaseCleanup());

      it('Generates an ID for the request', () => {
        clearHistory = true;
        const request = DataGenerator.generateHistoryObject();
        delete request._id;
        return element.saveRequest(request)
        .then((request) => {
          assert.typeOf(request._id, 'string');
        });
      });

      it('Returns the REV proeprty', () => {
        clearHistory = true;
        const request = DataGenerator.generateHistoryObject();
        return element.saveRequest(request)
        .then((request) => {
          assert.typeOf(request._rev, 'string');
        });
      });
    });

    describe('Google Drive save', function() {
      let element;
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
        window.addEventListener('export-google-drive', driveHandler);
      });

      after(() => {
        window.removeEventListener('export-google-drive', driveHandler);
      });

      beforeEach(async () => {
        handleDriveEvent = false;
        clearHistory = false;
        clearSaved = false;
        // clearProjects = false;
        element = await basicFixture();
      });

      afterEach(() => databaseCleanup());

      it('Event is not dispatched when no drive info', () => {
        clearSaved = true;
        const request = DataGenerator.generateSavedItem();
        const spy = sinon.spy();
        element.addEventListener('export-google-drive', spy);
        return element.saveRequest(request)
        .then(() => {
          assert.isFalse(spy.called);
        });
      });

      it('Rejects the promise when event not handled', (done) => {
        const request = DataGenerator.generateSavedItem();
        element.saveRequest(request, {isDrive: true})
        .then(() => {
          clearSaved = true;
          done(new Error('Save request finished with success'));
        })
        .catch(() => {
          done();
        });
      });

      it('Updates driveId on the model', function() {
        handleDriveEvent = true;
        clearSaved = true;
        const request = DataGenerator.generateSavedItem();
        return element.saveRequest(request, {isDrive: true})
        .then((request) => {
          assert.equal(request.driveId, 'test-drive-id');
        });
      });

      it('Event contains request copy', () => {
        clearSaved = true;
        handleDriveEvent = true;
        const request = DataGenerator.generateSavedItem();
        let eventData;
        element.addEventListener('export-google-drive', function f(e) {
          element.removeEventListener('export-google-drive', f);
          eventData = e.detail;
          eventData.content.url = 'test-url';
        });
        return element.saveRequest(request, {isDrive: true})
        .then(() => {
          assert.typeOf(eventData, 'object');
          assert.notEqual(request.url, 'test-url');
        });
      });

      it('Event contains contentType', () => {
        clearSaved = true;
        handleDriveEvent = true;
        const request = DataGenerator.generateSavedItem();
        let eventData;
        element.addEventListener('export-google-drive', function f(e) {
          element.removeEventListener('export-google-drive', f);
          eventData = e.detail;
        });
        return element.saveRequest(request, {isDrive: true})
        .then(() => {
          assert.equal(eventData.contentType, 'application/json');
        });
      });

      it('Event contains file', () => {
        clearSaved = true;
        handleDriveEvent = true;
        const request = DataGenerator.generateSavedItem();
        request.name = 'test';
        let eventData;
        element.addEventListener('export-google-drive', function f(e) {
          element.removeEventListener('export-google-drive', f);
          eventData = e.detail;
        });
        return element.saveRequest(request, {isDrive: true})
        .then(() => {
          assert.equal(eventData.file, 'test.arc');
        });
      });
    });

    describe('_createProjects()', function() {
      let element;
      const names = ['a', 'b', 'c'];
      const requestId = 'test-id';
      beforeEach(async () => {
        clearHistory = false;
        clearSaved = true;
        // clearProjects = true;
        element = await basicFixture();
      });

      afterEach(() => databaseCleanup());

      it('Creates a list of projects from names', function() {
        return element._createProjects(names)
        .then(() => DataGenerator.getDatastoreProjectsData())
        .then((list) => {
          assert.lengthOf(list, 3, 'Has 3 items');
          for (let i = 0; i < list.length; i++) {
            assert.notEqual(names.indexOf(list[i].name), -1);
          }
        });
      });

      it('Adds a request id to the project', function() {
        return element._createProjects(names, requestId)
        .then(() => DataGenerator.getDatastoreProjectsData())
        .then((list) => {
          assert.lengthOf(list, 3, 'Has 3 items');
          for (let i = 0; i < list.length; i++) {
            assert.equal(list[i].requests[0], 'test-id');
          }
        });
      });
    });

    describe('Synchronizes projects', function() {
      let element;
      let projects;
      let createProjectRequestId;
      beforeEach(async () => {
        clearHistory = false;
        clearSaved = true;
        // clearProjects = true;
        element = await basicFixture();
        return element._createProjects(['a', 'b', 'c'], createProjectRequestId)
        .then((data) => {
          projects = data;
        });
      });

      afterEach(() => databaseCleanup());

      it('Sets request ID on projects', function() {
        const request = DataGenerator.generateSavedItem();
        request._id = 'test-projects';
        request.projects = projects;
        return element.saveRequest(request)
        .then(() => DataGenerator.getDatastoreProjectsData())
        .then((list) => {
          for (let i = 0; i < list.length; i++) {
            assert.equal(list[i].requests[0], 'test-projects');
          }
        });
      });

      it('Sets request ID on single project', function() {
        const request = DataGenerator.generateSavedItem();
        request._id = 'test-projects';
        request.projects = [projects[1]];
        return element.saveRequest(request)
        .then(() => DataGenerator.getDatastoreProjectsData())
        .then((list) => {
          for (let i = 0; i < list.length; i++) {
            if (list[i]._id === projects[1]) {
              assert.equal(list[i].requests[0], 'test-projects');
            } else {
              assert.lengthOf(list[i].requests, 0);
            }
          }
        });
      });

      it('Just setting a flag for the next test', () => {
        createProjectRequestId = 'test-projects';
      });

      it('Removes request ID prom projects', function() {
        createProjectRequestId = undefined;
        const request = DataGenerator.generateSavedItem();
        request._id = 'test-projects';
        request.projects = [projects[1]];
        return element.saveRequest(request)
        .then(() => DataGenerator.getDatastoreProjectsData())
        .then((list) => {
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
  });
});
