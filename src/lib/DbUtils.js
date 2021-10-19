/* eslint-disable no-await-in-loop */
/* eslint-disable no-param-reassign */
/* global PouchDB */

import { normalizeAuthorization } from '../Utils.js';

/** @typedef {import('@advanced-rest-client/events').DataExport.ArcExportClientCertificateData} ArcExportClientCertificateData */
/** @typedef {import('./DbUtils').PageResult} PageResult */
/** @typedef {import('@advanced-rest-client/events').ClientCertificate.ARCRequestCertificate} ARCRequestCertificate */
/** @typedef {import('@advanced-rest-client/events').ClientCertificate.ARCCertificateIndex} ARCCertificateIndex */
/** @typedef {import('@advanced-rest-client/events').ArcRequest.ARCHistoryRequest} ARCHistoryRequest */
/** @typedef {import('@advanced-rest-client/events').ArcRequest.RequestAuthorization} RequestAuthorization */
/** @typedef {import('@advanced-rest-client/events').Authorization.CCAuthorization} CCAuthorization */

/**
 * Safely reads a datastore entry. It returns undefined if the entry does not exist.
 *
 * @param {string} dbName Name of the datastore to get the data from.
 * @param {string} id The id of the entry
 * @return {Promise<any|undefined>} Resolved promise to the document or undefined.
 */
export async function getEntry(dbName, id) {
  const db = new PouchDB(dbName);
  try {
    return await db.get(id);
  } catch (e) {
    // ...
  }
  return undefined;
}

/**
 * Fetches a single page of results from the database.
 * @param {PouchDB.Database} db PouchDB instance
 * @param {PouchDB.Core.AllDocsWithinRangeOptions} options Fetch options. This object is altered during the fetch.
 * @return {Promise<PageResult>} Promise resolved to the list of documents.
 */
export async function fetchEntriesPage(db, options) {
  const queryOptions = {
    ...options,
    include_docs: true,
  };
  try {
    const response = await db.allDocs(queryOptions);
    if (response.rows && response.rows.length > 0) {
      const config = /** @type PouchDB.Core.AllDocsWithinRangeOptions */ ({
        ...options,
        startkey: response.rows[response.rows.length - 1].id,
        skip: 1,
      });
      const docs = response.rows.map((item) => item.doc);
      return {
        docs,
        config,
      }
    }
  } catch (e) {
    // ..
  }
  return null;
}

/**
 * Returns all data from a database.
 *
 * @param {string} dbName Name of the datastore to get the data from.
 * @return {Promise<any[]>} Resolved promise to array of objects. It always
 * resolves.
 */
export async function getDatabaseEntries(dbName, limit) {
  let options = /** @type PouchDB.Core.AllDocsWithinRangeOptions */ ({
    limit,
  });
  const db = new PouchDB(dbName);
  let result = [];
  let hasMore = true;
  do {
    const pageResult = await fetchEntriesPage(db, options);
    if (pageResult) {
      options = pageResult.config;
      result = result.concat(pageResult.docs);
      if (pageResult.docs.length < limit) {
        hasMore = false;
      }
    } else {
      hasMore = false;
    }
  } while (hasMore);
  return result;
}

/**
 * Returns a client certificate data for a given ID.
 * @param {string} id The certificate ID
 * @param {ArcExportClientCertificateData[]=} certificates Already read certificate data.
 * @return {Promise<ArcExportClientCertificateData|null>} A certificate data to add to the certificates
 * list or undefined if the certificate is already defined.
 */
export async function readClientCertificateIfNeeded(id, certificates) {
  if (!id) {
    return null;
  }
  if (Array.isArray(certificates)) {
    const cert = certificates.find(({item}) => item._id === id);
    if (cert) {
      return null;
    }
  }
  const index = /** @type ARCCertificateIndex */ (await getEntry('client-certificates', id));
  if (!index) {
    return null;
  }
  const indexId = index.dataKey || index._id;
  if (index.dataKey) {
    delete index.dataKey;
  }
  const data = /** @type ARCRequestCertificate */ (await getEntry('client-certificates-data', indexId));
  if (!data) {
    return null;
  }
  return {
    item: index,
    data,
  }
}

/**
 * Processes request data for required export properties after the data
 * has been received from the data store but before creating export object.
 *
 * @param {ARCHistoryRequest[]} requests A list of requests to process
 * @param {ArcExportClientCertificateData[]} certificates The list of read certificates
 * @return {Promise<ArcExportClientCertificateData[]>} Promise resolved to altered list of requests.
 */
export async function processRequestsArray(requests, certificates) {
  const ps = requests.map(async (item) => {
    if (!item) {
      return undefined;
    }
    const request = normalizeAuthorization(item);
    const { authorization } = request;
    if (!Array.isArray(authorization) || !authorization.length) {
      return undefined;
    }
    const auth = authorization.find((a) => a.type === 'client certificate');
    if (!auth) {
      return undefined;
    }
    const cnf = /** @type CCAuthorization */ (auth.config);
    if (!cnf) {
      return undefined;
    }
    return readClientCertificateIfNeeded(cnf.id, certificates);
  });
  const data = await Promise.all(ps);
  return data.filter((item) => !!item);
}
