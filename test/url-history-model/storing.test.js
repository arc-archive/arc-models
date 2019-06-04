import { fixture, assert } from '@open-wc/testing';
import {UrlHistoryHelper} from './common.js';
import '../../url-history-model.js';

describe('<url-history-model> - Storing data', function() {
  async function basicFixture() {
    return /** @type {UrlHistoryModel} */ (await fixture('<url-history-model></url-history-model>'));
  }

  describe('Storing the data', function() {
    let element;
    const baseUrl = 'https://api.mulesoft.com/endpoint/path?query=parameter';
    const otherUrl = 'https://api.domain.com/endpoint/';
    describe('store()', function() {
      let previousInsert;

      before(function(done) {
        this.timeout(10000);
        setTimeout(function() {
          UrlHistoryHelper.deleteDatabase().then(function() {
            done();
          });
        }, 2000);
      });

      after(function(done) {
        this.timeout(10000);
        setTimeout(function() {
          done();
        }, 2000);
      });

      beforeEach(async () => {
        element = await basicFixture();
      });

      it('Stores the URL', function() {
        return element.store(baseUrl)
        .then(function(result) {
          assert.isTrue(result.ok);
          previousInsert = result;
        });
      });

      it('Updates existing URL data', function() {
        return element.store(baseUrl)
        .then(function(result) {
          assert.isTrue(result.ok, 'Operation succeeded');
          assert.equal(result.id, previousInsert.id, 'Ids matches previous');
          assert.notEqual(result.rev, previousInsert.rev, 'Rev is different');
        });
      });

      it('Creates another URL data', function() {
        return element.store(otherUrl)
        .then(function(result) {
          assert.isTrue(result.ok, 'Operation succeeded');
          assert.notEqual(result.id, previousInsert.id, 'IDs are different');
        });
      });
    });
  });
});
