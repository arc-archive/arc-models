import { fixture, assert } from '@open-wc/testing';
import * as sinon from 'sinon';
import { ArcModelEventTypes } from '../../src/events/ArcModelEventTypes.js';
import { ArcModelEvents } from '../../src/events/ArcModelEvents.js';
import { ArcBaseModel, notifyDestroyed, deletemodelHandler } from '../../src/ArcBaseModel.js';
import { ARCModelDeleteEvent } from '../../src/events/BaseEvents.js';
import { STORE_NAME } from './TestModel.js';

/** @typedef {import('./TestModel').TestModel} TestModel */
/** @typedef {import('../../src/events/BaseEvents').ARCModelStateDeleteEvent} ARCModelStateDeleteEvent */

/* eslint-disable require-atomic-updates */

describe('ArcBaseModel', () => {
  /**
   * @return {Promise<TestModel>}
   */
  async function basicFixture() {
    return fixture('<test-model></test-model>');
  }

  describe('Basics', () => {
    it('Sets store name in constructor', async () => {
      const element = /** @type {TestModel} */ (await fixture(
        '<test-model></test-model>'
      ));
      assert.equal(element.name, STORE_NAME);
    });

    it('Sets reviews limit in constructor', async () => {
      const element = /** @type {TestModel} */ (await fixture(
        '<test-model></test-model>'
      ));
      assert.equal(element.revsLimit, 2);
    });

    it('Uses default event target', async () => {
      const element = /** @type {TestModel} */ (await fixture(
        '<test-model></test-model>'
      ));
      assert.isTrue(element.eventsTarget === window);
    });
  });

  describe('get db()', () => {
    it('Throws error when store name is not set', async () => {
      const element = /** @type {TestModel} */ (await fixture(
        '<test-model></test-model>'
      ));
      element.name = undefined;
      assert.throws(() => {
        return element.db;
      });
    });

    it('Returns PouchDB instance', async () => {
      const element = /** @type {TestModel} */ (await fixture(
        '<test-model></test-model>'
      ));
      const { db } = element;
      assert.equal(db.constructor.name, 'PouchDB');
    });
  });

  describe('read()', () => {
    const insert = {
      _id: 'test-id',
      value: 'test-value',
    };
    const updated = 'test-update';
    let rev1;
    let rev2;
    before(async () => {
      const element = /** @type {TestModel} */ (await fixture(
        '<test-model></test-model>'
      ));
      const { db } = element;
      const result = await db.put(insert);
      rev1 = result.rev;
      insert._rev = rev1;
      insert.updated = updated;
      const result2 = await db.put(insert);
      rev2 = result2.rev;
      insert._rev = rev2;
    });

    after(async () => {
      const element = /** @type {TestModel} */ (await fixture(
        '<test-model></test-model>'
      ));
      const { db } = element;
      await db.destroy();
    });

    it('Reads latest revision', async () => {
      const element = /** @type {TestModel} */ (await fixture(
        '<test-model></test-model>'
      ));
      const doc = await element.read(insert._id);
      // @ts-ignore
      assert.equal(doc._rev, rev2);
    });

    it('Reads specific revision', async () => {
      const element = /** @type {TestModel} */ (await fixture(
        '<test-model></test-model>'
      ));
      const doc = await element.read(insert._id, rev1);
      // @ts-ignore
      assert.equal(doc._rev, rev1);
    });

    it('throws when no id', async () => {
      const element = await basicFixture();
      let thrown = false;
      try {
        await element.read(undefined);
      } catch (_) {
        thrown = true;
      }
      assert.isTrue(thrown);
    });
  });

  describe('_handleException()', () => {
    let element = /** @type TestModel */ (null);
    beforeEach(async () => {
      element = await basicFixture();
    });

    it('Throws the error', () => {
      assert.throws(() => {
        element._handleException(new Error('test'));
      });
    });

    it('Do not throws an error when noThrow is set', () => {
      element._handleException(new Error('test'), true);
    });

    it('Dispatches send-analytics event', () => {
      const spy = sinon.spy();
      element.addEventListener('send-analytics', spy);
      element._handleException(new Error('test'), true);
      assert.isTrue(spy.called);
      const ev = spy.args[0][0];
      assert.isTrue(ev.bubbles, 'Event bubbles');
      assert.isTrue(ev.composed, 'Event is composed');
      assert.isFalse(ev.cancelable, 'Event is not cancelable');
    });

    it('send-analytics event has exception details', () => {
      const spy = sinon.spy();
      element.addEventListener('send-analytics', spy);
      element._handleException(new Error('test'), true);
      assert.isTrue(spy.called);
      const { detail } = spy.args[0][0];
      assert.equal(detail.type, 'exception', 'Type is set');
      assert.equal(detail.description, 'test', 'Message is set');
      assert.isTrue(detail.fatal, 'Is fatal exception');
    });

    it('Serializes non-error object', () => {
      const spy = sinon.spy();
      element.addEventListener('send-analytics', spy);
      element._handleException({ test: true }, true);
      assert.isTrue(spy.called);
      const { detail } = spy.args[0][0];
      assert.equal(detail.description, '{"test":true}', 'Message is set');
    });
  });

  describe('[notifyDestroyed]()', () => {
    let element = /** @type TestModel */ (null);
    const storeName = 'test-store';

    beforeEach(async () => {
      element = /** @type {TestModel} */ (await fixture(
        '<test-model></test-model>'
      ));
    });

    it('dispatches a custom event', () => {
      const spy = sinon.spy();
      element.addEventListener(ArcModelEventTypes.destroyed, spy);
      element[notifyDestroyed](storeName);
      assert.isTrue(spy.called);
    });

    it('contains datastore on the detail object', () => {
      const spy = sinon.spy();
      element.addEventListener(ArcModelEventTypes.destroyed, spy);
      element[notifyDestroyed](storeName);
      const e = /** @type ARCModelStateDeleteEvent */ (spy.args[0][0]);
      assert.equal(e.store, storeName);
    });

    it('is not cancelable', () => {
      const spy = sinon.spy();
      element.addEventListener(ArcModelEventTypes.destroyed, spy);
      element[notifyDestroyed](storeName);
      const e = /** @type ARCModelStateDeleteEvent */ (spy.args[0][0]);
      assert.isFalse(e.cancelable);
    });

    it('bubbles', () => {
      const spy = sinon.spy();
      element.addEventListener(ArcModelEventTypes.destroyed, spy);
      element[notifyDestroyed](storeName);
      const e = /** @type ARCModelStateDeleteEvent */ (spy.args[0][0]);
      assert.isTrue(e.bubbles);
    });

    it('is composed', () => {
      const spy = sinon.spy();
      element.addEventListener(ArcModelEventTypes.destroyed, spy);
      element[notifyDestroyed](storeName);
      const e = /** @type ARCModelStateDeleteEvent */ (spy.args[0][0]);
      assert.isTrue(e.composed);
    });
  });

  describe('deleteModel()', () => {
    let element = /** @type TestModel */ (null);
    beforeEach(async () => {
      element = /** @type {TestModel} */ (await fixture(
        '<test-model></test-model>'
      ));
    });

    it('deletes the model', async () => {
      await element.deleteModel();
    });

    it('dispatches the state event', async () => {
      const spy = sinon.spy();
      element.addEventListener(ArcModelEventTypes.destroyed, spy);
      await element.deleteModel();
      assert.isTrue(spy.called);
      const e = /** @type ARCModelStateDeleteEvent */ (spy.args[0][0]);
      assert.equal(e.store, element.name);
    });

    it('rejects the promise when datastore error', async () => {
      let called = false;
      element.name = undefined;
      try {
        await element.deleteModel();
      } catch (_) {
        called = true;
      }
      if (!called) {
        throw new Error('Not rejected');
      }
    });
  });

  describe('_eventCancelled()', () => {
    let element = /** @type TestModel */ (null);
    beforeEach(async () => {
      element = /** @type {TestModel} */ (await fixture(
        '<test-model></test-model>'
      ));
    });

    it('Returns true when event is canceled', () => {
      const e = new CustomEvent('test', {
        cancelable: true,
      });
      e.preventDefault();
      e.stopPropagation();
      const result = element._eventCancelled(e);
      assert.isTrue(result);
    });

    it('Returns true when event is cancelable', () => {
      const e = new CustomEvent('test');
      const result = element._eventCancelled(e);
      assert.isTrue(result);
    });

    it('Returns true when event is dispatched on current element', () => {
      const e = {
        cancelable: true,
        composedPath() {
          return [element];
        },
      };
      // @ts-ignore
      const result = element._eventCancelled(e);
      assert.isTrue(result);
    });

    it('Returns false otherwise', () => {
      const e = new CustomEvent('test', {
        cancelable: true,
      });
      document.body.dispatchEvent(e);
      const result = element._eventCancelled(e);
      assert.isFalse(result);
    });
  });

  describe('[deletemodelHandler]()', () => {
    let element = /** @type TestModel */ (null);
    beforeEach(async () => {
      element = await basicFixture();
    });

    it('is ignored when cancelled', async () => {
      document.body.addEventListener(ArcModelEventTypes.destroy, function f(e) {
        e.preventDefault();
        document.body.removeEventListener(ArcModelEventTypes.destroy, f);
      });
      const e = new ARCModelDeleteEvent(['test']);
      document.body.dispatchEvent(e);
      element[deletemodelHandler](e);
      assert.isUndefined(e.detail.result);
    });

    it('is ignored for different name', async () => {
      const e = new ARCModelDeleteEvent(['test']);
      document.body.dispatchEvent(e);
      assert.isEmpty(e.detail.result);
    });

    it('is ignored when no store names', () => {
      const e = new ARCModelDeleteEvent([]);
      document.body.dispatchEvent(e);
      assert.isUndefined(e.detail.result);
    });

    it('is processed with current name', async () => {
      const e = new ARCModelDeleteEvent([STORE_NAME]);
      document.body.dispatchEvent(e);
      assert.typeOf(e.detail.result, 'array');
      assert.lengthOf(e.detail.result, 1);
      return e.detail.result[0];
    });

    it('handles the event', async () => {
      const spy = sinon.spy(element, 'deleteModel');
      await ArcModelEvents.destroy(document.body, [STORE_NAME]);
      assert.isTrue(spy.calledOnce);
    });
  });

  class EventableElement extends ArcBaseModel {
    static get is() {
      return 'eventable-element';
    }

    constructor() {
      super('test');
      this._testEventHandler = this._testEventHandler.bind(this);
      this._calledCount = 0;
    }

    get called() {
      return this._calledCount > 0;
    }

    get calledOnce() {
      return this._calledCount === 1;
    }

    _attachListeners(node) {
      node.addEventListener('test-event', this._testEventHandler);
    }

    _detachListeners(node) {
      node.removeEventListener('test-event', this._testEventHandler);
    }

    _testEventHandler() {
      this._calledCount++;
    }
  }
  window.customElements.define(EventableElement.is, EventableElement);

  function fire(type, bubbles, node) {
    const event = new CustomEvent(type, {
      cancelable: true,
      bubbles,
      composed: true,
    });
    (node || document.body).dispatchEvent(event);
    return event;
  }

  describe('Listens on default', () => {
    let element;
    beforeEach(async () => {
      element = /** @type {TestModel} */ (await fixture(
        '<eventable-element></eventable-element>'
      ));
    });

    it('Receives an event from bubbling', () => {
      fire('test-event', true);
      assert.isTrue(element.calledOnce);
    });

    it('Do not receives an event from parent', () => {
      fire('test-event', false, document.body.parentElement);
      assert.isFalse(element.calledOnce);
    });
  });

  describe('Changes event listener', () => {
    let element;
    beforeEach(async () => {
      element = /** @type {TestModel} */ (await fixture(
        '<eventable-element></eventable-element>'
      ));
    });

    it('Receives on body', () => {
      element.eventsTarget = document.body;
      fire('test-event', false, document.body);
      assert.isTrue(element.calledOnce);
    });

    it('Do not receives on parent', () => {
      element.eventsTarget = window;
      fire('test-event', false, document.body);
      assert.isFalse(element.called);
    });

    it('Receives on self', () => {
      element.eventsTarget = element;
      fire('test-event', false, element);
      assert.isTrue(element.calledOnce);
    });
  });

  describe('encodePageToken()', () => {
    let model = /** @type TestModel */ (null);
    beforeEach(async () => {
      model = await basicFixture();
    });

    it('returns a string', () => {
      const result = model.encodePageToken({ test: true });
      assert.typeOf(result, 'string');
    });

    it('encodes parameters', () => {
      const token = model.encodePageToken({ test: true });
      const decoded = atob(token);
      const result = JSON.parse(decoded);
      assert.deepEqual(result, { test: true });
    });
  });

  describe('decodePageToken()', () => {
    let model = /** @type TestModel */ (null);
    beforeEach(async () => {
      model = await basicFixture();
    });

    it('returns null when no argument', () => {
      const result = model.decodePageToken(undefined);
      assert.equal(result, null);
    });

    it('returns null when invalid base64 value', () => {
      const result = model.decodePageToken('invalid base64');
      assert.equal(result, null);
    });

    it('returns null when invalid JSON value', () => {
      const result = model.decodePageToken(btoa('test value'));
      assert.equal(result, null);
    });

    it('returns decoded token', () => {
      const result = model.decodePageToken(btoa('{"test":"value"}'));
      assert.deepEqual(result, { test: 'value' });
    });
  });
});
