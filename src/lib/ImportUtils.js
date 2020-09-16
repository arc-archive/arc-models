/* eslint-disable no-param-reassign */
/* eslint-disable no-plusplus */
/**
 * User can export single request in ARC. In this case ARC opens new tab
 * rather actually imports the data. This function tests if this is the case.
 * @param {object} data Normalized import data
 * @return {boolean}
 */
export function isSingleRequest(data) {
  if (!data.requests || !data.requests.length) {
    return false;
  }
  if (data.requests.length !== 1) {
    return false;
  }
  if (data.projects && data.projects.length === 0) {
    delete data.projects;
  }
  if (data.history && data.history.length === 0) {
    delete data.history;
  }
  if (Object.keys(data).length === 4) {
    return true;
  }
  return false;
}

/**
 * First export / import system had single request data only. This function checks if given
 * file is from this ancient system.
 *
 * @param {object} object Decoded JSON data.
 * @return {boolean}
 */
export function isOldImport(object) {
  if (!(object.projects || object.requests || object.history)) {
    if ('headers' in object && 'url' in object && 'method' in object) {
      return true;
    }
  }
  return false;
}

/**
 * Checks if the passed argument is an Object.
 *
 * @param {any} object A value to test.
 * @return {boolean}
 */
export function isObject(object) {
  return (
    object !== null &&
    typeof object === 'object' &&
    Object.prototype.toString.call(object) === '[object Object]'
  );
}

/**
 * Tests if data is a Postman file data
 * @param {object} data Parsed file.
 * @return {boolean}
 */
export function isPostman(data) {
  if (data.version && data.collections) {
    return true;
  }
  if (data.info && data.info.schema) {
    return true;
  }
  if (data.folders && data.requests) {
    return true;
  }
  if (data._postman_variable_scope) {
    return true;
  }
  return false;
}

/**
 * Checks if passed `object` is the ARC export data.
 *
 * @param {object} object A parsed JSON data.
 * @return {boolean} true if the passed object is an ARC file.
 */
export function isArcFile(object) {
  if (!object || !isObject(object)) {
    return false;
  }
  if (object.kind) {
    if (object.kind.indexOf('ARC#') === 0) {
      return true;
    }
  }
  // Old export system does not have kind property.
  // Have to check if it has required properties.
  const arcEntries = [
    'projects',
    'requests',
    'history',
    'url-history',
    'websocket-url-history',
    'variables',
    'headers-sets',
    'auth-data',
    'cookies',
  ];
  for (let i = 0, len = arcEntries.length; i < len; i++) {
    if (arcEntries[i] in object) {
      return true;
    }
  }
  if (isOldImport(object)) {
    return true;
  }
  return false;
}

/**
 * Parses file data with JSON parser and throws an error if not a JSON.
 * If the passed `data` is JS object it does nothing.
 *
 * @param {string|object} data File content
 * @return {object} Parsed data.
 */
export function prepareImportObject(data) {
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data);
    } catch (e) {
      throw new Error(`Unable to read the file. Not a JSON: ${e.message}`);
    }
  }
  return data;
}

/**
 * Reads file content as string
 *
 * @param {File} file A file object
 * @return {Promise<String>} A promise resolved to file content
 */
export function readFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      // @ts-ignore
      resolve(e.target.result);
    };
    reader.onerror = () => {
      reject(new Error('File read error'));
    };
    reader.readAsText(file);
  });
}

/**
 * Returns a promise resolved after a timeout.
 * @param {number=} [timeout=0] A timeout to wait.
 * @returns {Promise<void>}
 */
export async function aTimeout(timeout=0) {
  return new Promise((resolve) => {
    setTimeout(resolve, timeout);
  });
}
