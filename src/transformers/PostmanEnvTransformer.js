/* eslint-disable class-methods-use-this */
/* eslint-disable no-param-reassign */

import { dataValue } from './BaseTransformer.js';
import { PostmanTransformer } from './PostmanTransformer.js';

/** @typedef {import('@advanced-rest-client/arc-types').DataExport.ArcExportObject} ArcExportObject */
/** @typedef {import('@advanced-rest-client/arc-types').DataExport.ExportArcVariable} ExportArcVariable */
/** @typedef {import('./PostmanEnvTransformer').PostmanEnvironment} PostmanEnvironment */
/** @typedef {import('./PostmanEnvTransformer').PostmanEnvironmentValue} PostmanEnvironmentValue */

/**
 * Transforms environment export from postman to ARC variables.
 */
export class PostmanEnvTransformer extends PostmanTransformer {
  /**
   * Transforms the data into ARC data model.
   * @return {Promise<ArcExportObject>} Promise resolved when data are transformed.
   */
  transform() {
    const raw = /** @type PostmanEnvironment */ (this[dataValue]);

    const result = {
      createdAt: new Date().toISOString(),
      version: 'postman-environment',
      kind: 'ARC#Import',
      variables: this.transformVariables(raw.values, raw.name)
    };
    return Promise.resolve(result);
  }

  /**
   * Transforms the list of variables in a environment to ARC variables.
   *
   * @param {PostmanEnvironmentValue[]} vars List of Postman's variables
   * @param {string} envName Environment name. Default to `default`.
   * @return {ExportArcVariable[]} List of ARC variables.
   */
  transformVariables(vars, envName) {
    if (!vars || !vars.length) {
      return [];
    }
    envName = envName || 'default';
    return vars.map((item) => {
      const result = {
        kind: 'ARC#VariableData',
        environment: envName,
        enabled: !!item.enabled,
        variable: item.key,
        value: this.ensureVariablesSyntax(item.value),
        key: undefined,
      };
      result.key = this.genId(result);
      return result;
    });
  }

  /**
   * Generates an _id to store the same data.
   * @param {ExportArcVariable} item ARC variable model
   * @return {string} Variable ID
   */
  genId(item) {
    const env = encodeURIComponent(item.environment);
    const eVar = encodeURIComponent(item.variable);
    return `postman-var-${env}-${eVar}`;
  }
}
