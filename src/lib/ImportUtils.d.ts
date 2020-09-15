/**
 * User can export single request in ARC. In this case ARC opens new tab
 * rather actualy imports the data. This function tests if this is the case.
 * @param data Normalized import data
 */
export declare function isSingleRequest(data: object): boolean;

/**
 * First export / import system had single request data only. This function checks if given
 * file is from this ancient system.
 *
 * @param object Decoded JSON data.
 */
export declare function isOldImport(object: object): boolean;

/**
 * Checks if the passed argument is an Object.
 *
 * @param object A value to test.
 */
export declare function isObject(object: object): boolean;

/**
 * Tests if data is a Postman file data
 * @param data Parsed file.
 */
export declare function isPostman(data: object): boolean;

/**
 * Checks if passed `object` is the ARC export data.
 *
 * @param object A parsed JSON data.
 * @returns true if the passed object is an ARC file.
 */
export declare function isArcFile(object: object): boolean;

/**
 * Parses file data with JSON parser and throws an error if not a JSON.
 * If the passed `data` is JS object it does nothing.
 *
 * @param data File content
 * @returns Parsed data.
 */
export declare function prepareImportObject(data: string|object): object;

/**
 * Reads file content as string
 *
 * @param file A file object
 * @returns A promise resolved to file content
 */
export declare function readFile(file: File): Promise<string>;

/**
 * Returns a promise resolved after a timeout.
 * @param timeout A timeout to wait.
 */
export declare function aTimeout(timeout?: number): Promise<void>;
