import { assert } from '@open-wc/testing';
import {
  computePayloadSize,
  calculateBytes,
} from '../../src/lib/DataSize.js';

describe('lib/DataSize', () => {
  describe('computePayloadSize()', () => {
    it('returns 0 for empty argument', async () => {
      const result = await computePayloadSize(undefined);
      assert.equal(result, 0);
    });

    it('returns size of an ArrayBuffer', async () => {
      const buffer = new ArrayBuffer(8);
      const result = await computePayloadSize(buffer);
      assert.equal(result, 8);
    });

    it('returns size of a blob', async () => {
      const blob = new Blob(['test']);
      const result = await computePayloadSize(blob);
      assert.equal(result, 4);
    });

    it('returns size of a string', async () => {
      const blob = 'test';
      const result = await computePayloadSize(blob);
      assert.equal(result, 4);
    });

    it('returns size of a FormData', async () => {
      const form = new FormData();
      const blob = new Blob(['test']);
      form.append('text', 'value');
      form.append('file', blob);
      const result = await computePayloadSize(form);
      // todo (pawel): Gecko and Webkit reports 343 bytes while Chromium says it's 292
      // This needs checking what is actually happens.
      assert.isAbove(result, 200);
      // assert.equal(result, 292);
    });
  });

  describe('calculateBytes()', () => {
    it('returns 0 for empty argument', () => {
      const result = calculateBytes(undefined);
      assert.equal(result, 0);
    });

    it('returns 0 for non string argument', () => {
      const blob = new Blob(['test']);
      // @ts-ignore
      const result = calculateBytes(blob);
      assert.equal(result, 0);
    });

    it('returns size of a string', () => {
      const blob = 'test';
      const result = calculateBytes(blob);
      assert.equal(result, 4);
    });

    it('returns size of a string with non-latin', () => {
      const blob = 'ł';
      const result = calculateBytes(blob);
      assert.equal(result, 2);
    });
  });
});
