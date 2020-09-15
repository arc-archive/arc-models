import {BaseTransformer} from './BaseTransformer.js';

export const postamVarRegex: RegExp;

/**
 * Replacer function for regex replace to be used to replace variables
 * notation to ARC's
 *
 * @returns Value to be replaced in the string.
 */
export function variablesReplacerFunction(match: string, value: string): string;

/**
 * Parse input string as a payload param key or value.
 *
 * @param input An input to parse.
 * @returns Trimmed string
 */
export function paramValue(input: string): string;

/**
 * Base class for all Postman transformers
 */
export declare class PostmanTransformer extends BaseTransformer {

  /**
   * Computes body value for Postman's v1 body definition.
   *
   * @param item Postam v1 model.
   * @returns Body value
   */
  computeBodyOld(item: object): string;

  /**
   * Computes body as a FormData data model.
   * This function sets `multipart` property on the item.
   *
   * @param item Postam v1 model.
   * @returns Body value. Always empty string.
   */
  computeFormDataBody(item: any): string;

  /**
   * Computes body as a URL encoded data model.
   *
   * @param item Postam v1 model.
   * @returns Body value.
   */
  computeUrlEncodedBody(item: object): string;

  /**
   * Replaces any occurence of {{STRING}} with ARC's variables syntax.
   *
   * @param str A string value to check for variables.
   * @returns The same string with ARC's variables syntax
   */
  ensureVariablesSyntax(str: string): string;
  ensureVarsRecursevily<T>(obj: T): T;
}
