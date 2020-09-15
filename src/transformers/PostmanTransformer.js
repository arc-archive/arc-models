/* eslint-disable no-param-reassign */
/* eslint-disable class-methods-use-this */

import { BaseTransformer } from './BaseTransformer.js';

export const postamVarRegex = /\{\{(.*?)\}\}/gim;

/**
 * Replacer function for regex replace to be used to replace variables
 * notation to ARC's
 *
 * @param {string} match
 * @param {string} value
 * @return {string} Value to be replaced in the string.
 */
export function variablesReplacerFunction(match, value) {
  switch (value) {
    case '$randomInt': value = 'random()'; break;
    case '$guid': value = 'uuid()'; break;
    case '$timestamp': value = 'now()'; break;
    default:
  }
  return `\${${value}}`;
}

/**
 * Parse input string as a payload param key or value.
 *
 * @param {String} input An input to parse.
 * @return {String} Trimmed string
 */
export function paramValue(input) {
  if (!input) {
    return String();
  }
  input = String(input);
  input = input.trim();
  return input;
}

/**
 * Base class for all Postman transformers
 */
export class PostmanTransformer extends BaseTransformer {

  /**
   * Computes body value for Postman's v1 body definition.
   *
   * @param {object} item Postam v1 model.
   * @return {string} Body value
   */
  computeBodyOld(item) {
    if (typeof item.data === 'string') {
      return this.ensureVariablesSyntax(item.data);
    }
    if (item.data instanceof Array && !item.data.length) {
      return '';
    }
    switch (item.dataMode) {
      case 'params': return this.computeFormDataBody(item);
      case 'urlencoded': return this.computeUrlEncodedBody(item);
      // case 'binary': return '';
      default: return '';
    }
  }

  /**
   * Computes body as a FormData data model.
   * This function sets `multipart` property on the item.
   *
   * @param {any} item Postam v1 model.
   * @return {string} Body value. Always empty string.
   */
  computeFormDataBody(item) {
    if (!item.data || !item.data.length) {
      return '';
    }
    const multipart = [];
    item.data = this.ensureVarsRecursevily(item.data);
    item.data.forEach((data) => {
      const obj = {
        enabled: data.enabled,
        name: data.key,
        isFile: data.type === 'file',
        value: data.type === 'file' ? '' : data.value,
      };
      multipart.push(obj);
    });
    item.multipart = multipart;
    return '';
  }

  /**
   * Computes body as a URL encoded data model.
   *
   * @param {object} item Postam v1 model.
   * @return {string} Body value.
   */
  computeUrlEncodedBody(item) {
    if (!item.data || !item.data.length) {
      return '';
    }
    item.data = this.ensureVarsRecursevily(item.data);
    return item.data.map((obj) => {
      const name = paramValue(obj.key);
      const value = paramValue(obj.value);
      return `${name}=${value}`;
    }).join('&');
  }

  /**
   * Replaces any occurence of {{STRING}} with ARC's variables syntax.
   *
   * @param {string} str A string value to check for variables.
   * @return {string} The same string with ARC's variables syntax
   */
  ensureVariablesSyntax(str) {
    if (!str || !str.indexOf) {
      return str;
    }
    // https://jsperf.com/regex-replace-with-test-conditions
    if (str.indexOf('{{') !== -1) {
      str = str.replace(postamVarRegex, variablesReplacerFunction);
    }
    return str;
  }

  ensureVarsRecursevily(obj) {
    if (Array.isArray(obj)) {
      return obj.map((item) => this.ensureVarsRecursevily(item));
    }
    if (obj === Object(obj)) {
      Object.keys(obj).forEach((key) => {
        obj[key] = this.ensureVarsRecursevily(obj[key]);
      });
      return obj;
    }
    if (typeof obj === 'string') {
      return this.ensureVariablesSyntax(obj);
    }
    return obj;
  }
}
