import { assert } from '@open-wc/testing';
import { DataGenerator } from '@advanced-rest-client/arc-data-generator';
import { DataTestHelper } from './DataTestHelper.js';
import { ImportNormalize } from '../../src/lib/ImportNormalize.js';
import { ImportFactory } from '../../src/lib/ImportFactory.js';

describe('Data integrity test', () => {
  const generator = new DataGenerator();

  before(async () => {
    const data = await DataTestHelper.getFile('arc-13-data-export-2-2-2019.json');
    const normalizer = new ImportNormalize();
    const parsed = await normalizer.normalize(data);
    const factory = new ImportFactory();
    const errors = await factory.importData(parsed);
    assert.isUndefined(errors);
  });

  after(() => generator.destroyAll());

  describe('request data integrity', () => {
    let requests;
    before(async () => {
      requests = await generator.getDatastoreRequestData();
      requests.sort((a, b) => {
        if (a.created > b.created) {
          return 1;
        }
        if (a.created < b.created) {
          return -1;
        }
        return 0;
      });
    });

    it('has integrity for the request actions', () => {
      const request = requests[3];
      assert.typeOf(request.requestActions, 'object', 'requestActions is an object');
      assert.typeOf(request.requestActions.variables, 'array', 'Variables is an array');
      assert.lengthOf(request.requestActions.variables, 1, 'Has one variable');
      const variable = request.requestActions.variables[0];
      assert.deepEqual(variable, {
        variable: 'AnypointToken',
        action: 'store-variable',
        value: 'unused',
        enabled: true
      });
    });

    it('has integrity for the response actions', () => {
      const request1 = requests[3];
      assert.typeOf(request1.responseActions, 'array', 'Variables is an array');
      assert.lengthOf(request1.responseActions, 1, 'Has one variable');
      const action1 = request1.responseActions[0];
      assert.deepEqual(action1, {
        'source': 'response.url.hash.access_token',
        'action': 'store-variable',
        'destination': 'AnypointToken',
        'enabled': true,
        'conditions': [{
          'source': 'response.status',
          'operator': 'equal',
          'condition': '200',
          'enabled': true
        }]
      });
      const request2 = requests[2];
      assert.typeOf(request2.responseActions, 'array', 'Variables is an array');
      assert.lengthOf(request2.responseActions, 1, 'Has one variable');
      const action2 = request2.responseActions[0];
      assert.deepEqual(action2, {
        'source': 'response.body.headers.Upgrade-Insecure-Requests',
        'action': 'store-variable',
        'destination': 'testVarStore',
        'enabled': true
      });
    });

    ['Release component', 'Named', 'GET httpbin', 'Getting a token']
    .forEach((name, index) => {
      it(`Request #${index} name is set to ${name}`, () => {
        const request = requests[index];
        assert.equal(request.name, name);
      });
    });

    ['3ac8ca76-9b87-46b3-bc06-4014d85ef8ff', 'c6f8ae77-0cd6-45a3-9b3e-db257a689048',
      'c756e0fc-03fe-49ab-bdaf-6611dd8b1e59', '02ddc292-3987-43ec-b5cb-77fc4c5fbf5e']
    .forEach((key, index) => {
      it(`Request #${index} _id is set to ${key}`, () => {
        const request = requests[index];
        assert.equal(request._id, key);
      });
    });

    [undefined, undefined, undefined, 'Test Description']
    .forEach((key, index) => {
      it(`Request #${index} description is set`, () => {
        const request = requests[index];
        assert.equal(request.description, key);
      });
    });

    ['POST', 'PUT', 'GET', 'GET']
    .forEach((key, index) => {
      it(`Request #${index} method is set`, () => {
        const request = requests[index];
        assert.equal(request.method, key);
      });
    });

    [
      'http://0.0.0.0:5243/build', 'https://www.domain.com/customers', 'http://httpbin.org/get',
      'https://anypoint.mulesoft.com/accounts/oauth2/authorize?client_id=123&redirect_uri=https' +
        '%3A%2F%2Fauth.advancedrestclient.com%2Foauth-popup.html&response_type=token&state=TEST'
    ]
    .forEach((key, index) => {
      it(`Request #${index} url is set`, () => {
        const request = requests[index];
        assert.equal(request.url, key);
      });
    });

    [
      'X-GitHub-Delivery: 700014ee-bac4-11e8-9e51-b9764f61d62b',
      'Content-length: 2',
      'accept: */*',
      ''
    ]
    .forEach((key, index) => {
      it(`Request #${index} headers is set`, () => {
        const request = requests[index];
        assert.equal(request.headers, key);
      });
    });

    [
      '',
      '{}',
      '',
      ''
    ]
    .forEach((key, index) => {
      it(`Request #${index} payload is set`, () => {
        const request = requests[index];
        assert.equal(request.payload, key);
      });
    });

    [
      1537221534269,
      1545363890469,
      1545504554129,
      1549144558828
    ]
    .forEach((key, index) => {
      it(`Request #${index} created is set`, () => {
        const request = requests[index];
        assert.equal(request.created, key);
      });
    });

    [
      1541015654292,
      1545502946850,
      1545678735788,
      1549144558828
    ]
    .forEach((key, index) => {
      it(`Request #${index} updated is set`, () => {
        const request = requests[index];
        assert.equal(request.updated, key);
      });
    });

    [
      ['2a412558-2798-4aea-92ff-74c200a9f250'],
      [],
      [],
      ['274229f0-0098-4366-b841-2ac1f90a152c']
    ]
    .forEach((key, index) => {
      it(`Request #${index} projects is set`, () => {
        const request = requests[index];
        assert.deepEqual(request.projects, key);
      });
    });

    it('All requests are type of "saved"', () => {
      for (let i = 0; i < requests.length; i++) {
        assert.equal(requests[i].type, 'saved');
      }
    });

    it('All requests have _rev', () => {
      for (let i = 0; i < requests.length; i++) {
        assert.typeOf(requests[i]._rev, 'string');
      }
    });
  });

  describe('Projects data integrity', () => {
    let projects;
    before(async () => {
      projects = await generator.getDatastoreProjectsData();
      projects.sort((a, b) => {
        if (a.created > b.created) {
          return 1;
        }
        if (a.created < b.created) {
          return -1;
        }
        return 0;
      });
    });

    [
      ['274229f0-0098-4366-b841-2ac1f90a152c',
        ['02ddc292-3987-43ec-b5cb-77fc4c5fbf5e', '52cd4d6d-6ff4-43d4-b606-db86b566a187']],
      ['2a412558-2798-4aea-92ff-74c200a9f250', ['non-existing']]
    ].forEach((item) => {
      it(`Project ${item[0]} contains requests array`, () => {
        for (let i = 0; i < projects.length; i++) {
          if (projects[i]._id !== item[0]) {
            continue;
          }
          assert.deepEqual(projects[i].requests, item[1]);
          return;
        }
        throw new Error('Project not found');
      });
    });

    [
      ['274229f0-0098-4366-b841-2ac1f90a152c', 'Response actions'],
      ['2a412558-2798-4aea-92ff-74c200a9f250', 'Orphan project']
    ].forEach((item) => {
      it(`Project ${item[0]} has name`, () => {
        for (let i = 0; i < projects.length; i++) {
          if (projects[i]._id !== item[0]) {
            continue;
          }
          assert.equal(projects[i].name, item[1]);
          return;
        }
        throw new Error('Project not found');
      });
    });

    [
      ['274229f0-0098-4366-b841-2ac1f90a152c', undefined],
      ['2a412558-2798-4aea-92ff-74c200a9f250', 'Test description']
    ].forEach((item) => {
      it(`Project ${item[0]} has description`, () => {
        for (let i = 0; i < projects.length; i++) {
          if (projects[i]._id !== item[0]) {
            continue;
          }
          assert.equal(projects[i].description, item[1]);
          return;
        }
        throw new Error('Project not found');
      });
    });

    [
      ['274229f0-0098-4366-b841-2ac1f90a152c', 0],
      ['2a412558-2798-4aea-92ff-74c200a9f250', 1]
    ].forEach((item) => {
      it(`Project ${item[0]} has order`, () => {
        for (let i = 0; i < projects.length; i++) {
          if (projects[i]._id !== item[0]) {
            continue;
          }
          assert.equal(projects[i].order, item[1]);
          return;
        }
        throw new Error('Project not found');
      });
    });

    [
      ['274229f0-0098-4366-b841-2ac1f90a152c', 1549144167206],
      ['2a412558-2798-4aea-92ff-74c200a9f250', 1533404616012]
    ].forEach((item) => {
      it(`Project ${item[0]} has created`, () => {
        for (let i = 0; i < projects.length; i++) {
          if (projects[i]._id !== item[0]) {
            continue;
          }
          assert.equal(projects[i].created, item[1]);
          return;
        }
        throw new Error('Project not found');
      });
    });

    [
      ['274229f0-0098-4366-b841-2ac1f90a152c', 1549144167207],
      ['2a412558-2798-4aea-92ff-74c200a9f250', 1542853491816]
    ].forEach((item) => {
      it(`Project ${item[0]} has updated`, () => {
        for (let i = 0; i < projects.length; i++) {
          if (projects[i]._id !== item[0]) {
            continue;
          }
          assert.equal(projects[i].updated, item[1]);
          return;
        }
        throw new Error('Project not found');
      });
    });
  });

  describe('History data integrity', () => {
    let history;
    before(async () => {
      history = await generator.getDatastoreHistoryData();
      history.sort((a, b) => {
        if (a.created > b.created) {
          return 1;
        }
        if (a.created < b.created) {
          return -1;
        }
        return 0;
      });
    });
    [
      'http://httpbin.org/post',
      'http://httpbin.org/get',
      'http://httpbin.org/bytes/1024',
      'http://httpbin.org/image',
      'http://httpbin.org/image/webp',
      'http://httpbin.org/uuid',
      'http://httpbin.org/get',
      'http://httpbin.org/image'
    ].forEach((item, index) => {
      it(`History ${index} has url property`, () => {
        assert.equal(history[index].url, item);
      });
    });

    [
      '',
      '',
      'accept: */*',
      'Accept: image/png',
      'Accept: image/webp',
      '',
      '',
      ''
    ].forEach((item, index) => {
      it(`History ${index} has headers property`, () => {
        assert.equal(history[index].headers, item);
      });
    });

    [
      'POST',
      'PUT',
      'HEAD',
      'GET',
      'GET',
      'GET',
      'GET',
      'GET'
    ].forEach((item, index) => {
      it(`History ${index} has method property`, () => {
        assert.equal(history[index].method, item);
      });
    });

    [
      1536913980279,
      1537582560847,
      1537676165326,
      1537676188560,
      1537676239262,
      1537676248046,
      1537676271447,
      1538024448264
    ].forEach((item, index) => {
      it(`History ${index} has created property`, () => {
        assert.equal(history[index].created, item);
      });
    });

    [
      1536913980281,
      1537582560850,
      1537676165327,
      1537676188561,
      1537676239263,
      1537676248048,
      1537676271449,
      1538024448265
    ].forEach((item, index) => {
      it(`History ${index} has updated property`, () => {
        assert.equal(history[index].updated, item);
      });
    });

    it('All requests are type of "saved"', () => {
      for (let i = 0; i < history.length; i++) {
        assert.equal(history[i].type, 'history');
      }
    });

    it('All requests have _rev', () => {
      for (let i = 0; i < history.length; i++) {
        assert.typeOf(history[i]._rev, 'string');
      }
    });
  });
});
