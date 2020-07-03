import { fixture, assert } from '@open-wc/testing';
import { DataGenerator } from '@advanced-rest-client/arc-data-generator/arc-data-generator.js';
import sinon from 'sinon/pkg/sinon-esm.js';
import '../../variables-model.js';

describe('<variables-model> - Veriable events API', function() {
  async function basicFixture() {
    return /** @type {VariablesModel} */ (await fixture('<variables-model></variables-model>'));
  }

  describe('variable event tests', function() {
    describe('variable-updated', function() {
      after(function() {
        return DataGenerator.destroyVariablesData();
      });

      let element;
      let varData;
      beforeEach(async () => {
        element = await basicFixture();
        varData = {
          name: 'test',
          variable: 'var-value',
          enabled: true
        };
      });

      it('Creates new variable', function() {
        const e = new CustomEvent('variable-updated', {
          bubbles: true,
          cancelable: true,
          detail: {
            value: varData
          }
        });
        document.body.dispatchEvent(e);
        assert.isTrue(e.defaultPrevented);
        return e.detail.result
        .then((result) => {
          assert.equal(result.name, 'test');
          assert.typeOf(result._id, 'string');
          assert.typeOf(result._rev, 'string');
        });
      });

      it('Updates existing variable', () => {
        let id;
        let rev;
        return element.updateVariable(varData)
        .then((result) => {
          id = result._id;
          rev = result._rev;
          result.enabled = false;
          const e = new CustomEvent('variable-updated', {
            bubbles: true,
            cancelable: true,
            detail: {
              value: varData
            }
          });
          document.body.dispatchEvent(e);
          return e.detail.result;
        })
        .then((result) => {
          assert.isFalse(result.enabled);
          assert.equal(result._id, id);
          assert.notEqual(result._rev, rev);
        });
      });
    });

    describe('variable-deleted', function() {
      after(function() {
        return DataGenerator.destroyVariablesData();
      });

      let element;
      let varData;
      beforeEach(async () => {
        element = await basicFixture();
        varData = {
          name: 'test',
          variable: 'var-value',
          enabled: true
        };
      });

      it('Deletes variables', () => {
        return element.updateVariable(varData)
        .then((result) => {
          const e = new CustomEvent('variable-deleted', {
            bubbles: true,
            cancelable: true,
            detail: {
              id: result._id
            }
          });
          document.body.dispatchEvent(e);
          assert.isTrue(e.defaultPrevented);
          return e.detail.result;
        })
        .then(() => DataGenerator.getDatastoreVariablesData())
        .then((result) => {
          assert.lengthOf(result, 0);
        });
      });
    });

    describe('"destroy-model" event', () => {
      function fire(models) {
        const e = new CustomEvent('destroy-model', {
          detail: {
            models
          },
          bubbles: true
        });
        document.body.dispatchEvent(e);
        return e;
      }

      it('Deletes saved model', async () => {
        await basicFixture();
        const e = fire(['variables']);
        assert.typeOf(e.detail.result, 'array');
        assert.lengthOf(e.detail.result, 2);
        return Promise.all(e.detail.result);
      });

      it('Calls delete functions', async () => {
        const element = await basicFixture();
        const spy1 = sinon.spy(element, '_delVariablesModel');
        const spy2 = sinon.spy(element, '_delEnvironmentsModel');
        const e = fire(['variables']);
        assert.isTrue(spy1.called);
        assert.isTrue(spy2.called);
        return Promise.all(e.detail.result);
      });
    });
  });
});
