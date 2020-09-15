import { DataExport } from '@advanced-rest-client/arc-types';
import {PostmanTransformer} from './PostmanTransformer';

export declare interface PostmanEnvironment {
  id: string;
  name: string;
  timestamp: number;
  _postman_variable_scope: string;
  _postman_exported_at: string;
  _postman_exported_using: string;
  values: PostmanEnvironmentValue[];
}

export declare interface PostmanEnvironmentValue {
  enabled: boolean;
  key: string;
  value: string;
  type: string;
}

/**
 * Transforms environment export from postman to ARC variables.
 */
export declare class PostmanEnvTransformer extends PostmanTransformer {

  /**
   * Transforms `_data` into ARC data model.
   *
   * @returns Promise resolved when data are transformed.
   */
  transform(): Promise<DataExport.ArcExportObject>;

  /**
   * Transforms the list of variables in a environment to ARC variables.
   *
   * @param vars List of Postman's variables
   * @param envName Environment name. Default to `default`.
   * @returns List of ARC variables.
   */
  transformVariables(vars: PostmanEnvironmentValue[], envName: string): DataExport.ExportArcVariable[];

  /**
   * Generates an _id to store the same data.
   *
   * @param item ARC variable model
   * @returns Variable ID
   */
  genId(item: DataExport.ExportArcVariable): string;
}
