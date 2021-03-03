import { ArcRequest, ArcResponse } from '@advanced-rest-client/arc-types';
import { Content, Creator, Entry, Har, Header, Log, PostData, QueryString } from 'har-format';

/**
 * A class that transforms ARC request objects into a HAR format.
 */
export declare class HarTransformer {
  name: string;
  version: string;
  /**
   * @param version The application version name.
   * @param name The name of the "creator" field.
   */
  constructor(version?: string, name?: string);

  /**
   * Transforms the request objects to a log.
   */
  transform(requests: ArcRequest.ArcBaseRequest[]): Promise<Har>;

  createLog(): Log;

  createCreator(): Creator;

  createEntries(requests: ArcRequest.ArcBaseRequest[]): Promise<Entry[]>;

  createEntry(request: ArcRequest.ArcBaseRequest): Promise<Entry|Entry[]|null>;

  _createEntry(request: ArcRequest.ArcBaseRequest, transportRequest: ArcRequest.TransportRequest, response: ArcResponse.Response): Promise<Entry>;

  createRedirectEntries(request: ArcRequest.ArcBaseRequest, response: ArcResponse.Response): Promise<Entry>;

  createCache(): Cache;

  createRequest(request: ArcRequest.ArcBaseRequest): Promise<Request>;

  /**
   * @param response The response data
   * @param redirectURL Optional redirect URL for the redirected request.
   */
  createResponse(response: ArcResponse.HTTPResponse, redirectURL?: string): Promise<Response>;

  createHeaders(headers: string): Header[];

  createPostData(payload: string | File | Blob | Buffer | ArrayBuffer | FormData, headers: string): Promise<PostData>;

  /**
   * @param body The body 
   * @param charset The optional charset to use with the text decoder.
   */
  readBodyString(body: string|Buffer|ArrayBuffer, charset?: string): string;

  createResponseContent(payload: string | Buffer | ArrayBuffer, headers: string): Promise<Content>;

  readQueryString(url: string): QueryString[];
}
