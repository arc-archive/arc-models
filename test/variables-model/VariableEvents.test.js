import { assert } from '@open-wc/testing';
import { DataGenerator } from '@advanced-rest-client/arc-data-generator';
import {
  ARCEnvironmentReadEvent,
  ARCEnvironmentUpdateEvent,
  ARCEnvironmentUpdatedEvent,
  ARCEnvironmentDeleteEvent,
  ARCEnvironmentDeletedEvent,
  ARCEnvironmentListEvent,
  ARCVariableUpdateEvent,
  ARCVariableUpdatedEvent,
  ARCEVariableDeleteEvent,
  ARCVariableDeletedEvent,
  ARCVariableListEvent,
} from '../../src/events/VariableEvents.js';
import { ArcModelEventTypes } from '../../src/events/ArcModelEventTypes.js';

/** @typedef {import('../../src/VariablesModel').ARCVariable} ARCVariable */

describe('VariableEvents', () => {
  const generator = new DataGenerator();

  describe('ARCEnvironmentReadEvent', () => {
    const name = 'test name';

    it('has readonly name property', () => {
      const e = new ARCEnvironmentReadEvent(name);
      assert.equal(e.name, name, 'has the name');
      assert.throws(() => {
        // @ts-ignore
        e.name = 'test';
      });
    });

    it('has the correct type', () => {
      const e = new ARCEnvironmentReadEvent(name);
      assert.equal(e.type, ArcModelEventTypes.Environment.read);
    });
  });

  describe('ARCEnvironmentUpdateEvent', () => {
    const env = { name: 'test name' };

    it('has readonly environment property', () => {
      const e = new ARCEnvironmentUpdateEvent(env);
      assert.deepEqual(e.environment, env, 'has the environment');
      assert.throws(() => {
        // @ts-ignore
        e.environment = 'test';
      });
    });

    it('has the correct type', () => {
      const e = new ARCEnvironmentUpdateEvent(env);
      assert.equal(e.type, ArcModelEventTypes.Environment.update);
    });
  });

  describe('ARCEnvironmentUpdatedEvent', () => {
    const record = {
      id: 'cc-id',
      rev: 'cc-rev',
      item: { name: 'test name' },
    };

    it('has readonly changeRecord property', () => {
      const e = new ARCEnvironmentUpdatedEvent(record);
      assert.deepEqual(e.changeRecord, record, 'has the environment');
      assert.throws(() => {
        // @ts-ignore
        e.changeRecord = 'test';
      });
    });

    it('has the correct type', () => {
      const e = new ARCEnvironmentUpdatedEvent(record);
      assert.equal(e.type, ArcModelEventTypes.Environment.State.update);
    });
  });

  describe('ARCEnvironmentDeleteEvent', () => {
    const id = 'db-id';

    it('has readonly id property', () => {
      const e = new ARCEnvironmentDeleteEvent(id);
      assert.equal(e.id, id);
      assert.throws(() => {
        // @ts-ignore
        e.id = 'test';
      });
    });

    it('has the correct type', () => {
      const e = new ARCEnvironmentDeleteEvent(id);
      assert.equal(e.type, ArcModelEventTypes.Environment.delete);
    });
  });

  describe('ARCEnvironmentDeletedEvent', () => {
    const id = 'db-id';
    const rev = 'db-rev';

    it('has readonly id property', () => {
      const e = new ARCEnvironmentDeletedEvent(id, rev);
      assert.equal(e.id, id);
      assert.throws(() => {
        // @ts-ignore
        e.id = 'test';
      });
    });

    it('has readonly rev property', () => {
      const e = new ARCEnvironmentDeletedEvent(id, rev);
      assert.equal(e.rev, rev);
      assert.throws(() => {
        // @ts-ignore
        e.rev = 'test';
      });
    });

    it('has the correct type', () => {
      const e = new ARCEnvironmentDeletedEvent(id, rev);
      assert.equal(e.type, ArcModelEventTypes.Environment.State.delete);
    });
  });

  describe('ARCEnvironmentListEvent', () => {
    const opts = { limit: 5, nextPageToken: 'test-page-token', readall: false };

    it('has readonly limit property', () => {
      const e = new ARCEnvironmentListEvent(opts);
      assert.equal(e.limit, opts.limit);
      assert.throws(() => {
        // @ts-ignore
        e.limit = 'test';
      });
    });

    it('has readonly nextPageToken property', () => {
      const e = new ARCEnvironmentListEvent(opts);
      assert.equal(e.nextPageToken, opts.nextPageToken);
      assert.throws(() => {
        // @ts-ignore
        e.nextPageToken = 'test';
      });
    });

    it('has readonly readall property', () => {
      const e = new ARCEnvironmentListEvent(opts);
      assert.equal(e.readall, false);
      assert.throws(() => {
        // @ts-ignore
        e.readall = 'test';
      });
    });

    it('has the correct type', () => {
      const e = new ARCEnvironmentListEvent(opts);
      assert.equal(e.type, ArcModelEventTypes.Environment.list);
    });
  });

  describe('ARCVariableUpdateEvent', () => {
    const entity = /** @type ARCVariable */ (generator.generateVariableObject());

    it('has readonly environment property', () => {
      const e = new ARCVariableUpdateEvent(entity);
      assert.deepEqual(e.variable, entity);
      assert.throws(() => {
        // @ts-ignore
        e.variable = 'test';
      });
    });

    it('has the correct type', () => {
      const e = new ARCVariableUpdateEvent(entity);
      assert.equal(e.type, ArcModelEventTypes.Variable.update);
    });
  });

  describe('ARCVariableUpdatedEvent', () => {
    const record = {
      id: 'cc-id',
      rev: 'cc-rev',
      item: /** @type ARCVariable */ (generator.generateVariableObject()),
    };

    it('has readonly changeRecord property', () => {
      const e = new ARCVariableUpdatedEvent(record);
      assert.deepEqual(e.changeRecord, record, 'has the environment');
      assert.throws(() => {
        // @ts-ignore
        e.changeRecord = 'test';
      });
    });

    it('has the correct type', () => {
      const e = new ARCVariableUpdatedEvent(record);
      assert.equal(e.type, ArcModelEventTypes.Variable.State.update);
    });
  });

  describe('ARCEVariableDeleteEvent', () => {
    const id = 'db-id';

    it('has readonly id property', () => {
      const e = new ARCEVariableDeleteEvent(id);
      assert.equal(e.id, id);
      assert.throws(() => {
        // @ts-ignore
        e.id = 'test';
      });
    });

    it('has the correct type', () => {
      const e = new ARCEVariableDeleteEvent(id);
      assert.equal(e.type, ArcModelEventTypes.Variable.delete);
    });
  });

  describe('ARCVariableDeletedEvent', () => {
    const id = 'db-id';
    const rev = 'db-rev';

    it('has readonly id property', () => {
      const e = new ARCVariableDeletedEvent(id, rev);
      assert.equal(e.id, id);
      assert.throws(() => {
        // @ts-ignore
        e.id = 'test';
      });
    });

    it('has readonly rev property', () => {
      const e = new ARCVariableDeletedEvent(id, rev);
      assert.equal(e.rev, rev);
      assert.throws(() => {
        // @ts-ignore
        e.rev = 'test';
      });
    });

    it('has the correct type', () => {
      const e = new ARCVariableDeletedEvent(id, rev);
      assert.equal(e.type, ArcModelEventTypes.Variable.State.delete);
    });
  });

  describe('ARCVariableListEvent', () => {
    const opts = { limit: 5, nextPageToken: 'test-page-token', readall: false };
    const name = 'test-name';

    it('has readonly limit property', () => {
      const e = new ARCVariableListEvent(name, opts);
      assert.equal(e.limit, opts.limit);
      assert.throws(() => {
        // @ts-ignore
        e.limit = 'test';
      });
    });

    it('has readonly nextPageToken property', () => {
      const e = new ARCVariableListEvent(name, opts);
      assert.equal(e.nextPageToken, opts.nextPageToken);
      assert.throws(() => {
        // @ts-ignore
        e.nextPageToken = 'test';
      });
    });

    it('has readonly readall property', () => {
      const e = new ARCVariableListEvent(name, opts);
      assert.equal(e.readall, false);
      assert.throws(() => {
        // @ts-ignore
        e.readall = 'test';
      });
    });

    it('has readonly name property', () => {
      const e = new ARCEnvironmentReadEvent(name);
      assert.equal(e.name, name, 'has the name');
      assert.throws(() => {
        // @ts-ignore
        e.name = 'test';
      });
    });

    it('has the correct type', () => {
      const e = new ARCVariableListEvent(name, opts);
      assert.equal(e.type, ArcModelEventTypes.Variable.list);
    });
  });
});
