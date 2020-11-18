/* eslint-disable no-restricted-syntax */
/* eslint-disable no-prototype-builtins */

import { assert } from '@open-wc/testing';
import 'chance/dist/chance.min.js';
import 'pouchdb/dist/pouchdb.js';
/* global Chance */
// @ts-ignore
const chance = new Chance();


export const DataTestHelper = {};
DataTestHelper.getFile = async (file) => {
  const response = await fetch(`/test/data/${file}`);
  if (!response.ok) {
    throw new Error(`File ${file} is unavailable`);
  }
  return response.text();
};

DataTestHelper.assertRequestId = (request) => {
  const id = request.key;
  assert.typeOf(id, 'string', 'key is a string');
};

DataTestHelper.assertHistoryId = (request) => {
  const id = request.key;
  assert.typeOf(id, 'string', 'key is a string');
  // const parts = id.split('/');
  // assert.lengthOf(parts, 3, 'has 3 parts');
  // assert.isNotNaN(parts[0], 'First part is a number');
};

DataTestHelper.assertRequestObject = (request) => {
  DataTestHelper.assertRequestId(request);
  assert.typeOf(request.created, 'number', 'created is a number');
  assert.typeOf(request.updated, 'number', 'updated is a number');
  assert.typeOf(request.headers, 'string', 'headers is a string');
  assert.typeOf(request.method, 'string', 'method is a string');
  assert.typeOf(request.name, 'string', 'name is a string');
  assert.typeOf(request.type, 'string', 'type is a string');
  assert.typeOf(request.url, 'string', 'url is a string');
  assert.typeOf(request.payload, 'string', 'payload is a string');
};

DataTestHelper.assertHistoryObject = (request) => {
  DataTestHelper.assertHistoryId(request);
  assert.typeOf(request.created, 'number', 'created is a number');
  assert.typeOf(request.updated, 'number', 'updated is a number');
  assert.typeOf(request.headers, 'string', 'headers is a string');
  assert.typeOf(request.method, 'string', 'method is a string');
  assert.isUndefined(request.name, 'name is undefined');
  assert.isUndefined(request.type, 'type is undefined');
  assert.typeOf(request.url, 'string', 'url is a string');
  assert.typeOf(request.payload, 'string', 'payload is a string');
};

DataTestHelper.assertProjectObject = (project) => {
  assert.typeOf(project.key, 'string', 'key is a string');
  assert.typeOf(project.created, 'number', 'created is a number');
  assert.typeOf(project.updated, 'number', 'updated is a number');
  assert.typeOf(project.name, 'string', 'name is a string');
  assert.typeOf(project.order, 'number', 'order is a number');
  assert.isUndefined(project._oldId, '_oldId is cleared');
};

DataTestHelper.updateRequestRandom = (obj) => {
  obj.name = chance.word();
  return DataTestHelper.updateObject('saved-requests', obj);
};
