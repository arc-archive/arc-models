/* eslint-disable class-methods-use-this */
import { HeadersParser } from '@advanced-rest-client/arc-headers';
import { BodyProcessor } from '@advanced-rest-client/body-editor';
import { computePayloadSize, calculateBytes } from '../lib/DataSize.js';

/** @typedef {import('@advanced-rest-client/arc-types').ArcRequest.ArcBaseRequest} ArcBaseRequest */
/** @typedef {import('@advanced-rest-client/arc-types').ArcRequest.TransportRequest} TransportRequest */
/** @typedef {import('@advanced-rest-client/arc-types').ArcResponse.ErrorResponse} ErrorResponse */
/** @typedef {import('@advanced-rest-client/arc-types').ArcResponse.Response} ArcResponse */
/** @typedef {import('@advanced-rest-client/arc-types').ArcResponse.HTTPResponse} HTTPResponse */
/** @typedef {import('@advanced-rest-client/arc-types').ArcResponse.TransformedPayload} TransformedPayload */
/** @typedef {import('har-format').Har} Har */
/** @typedef {import('har-format').Log} Log */
/** @typedef {import('har-format').Creator} Creator */
/** @typedef {import('har-format').Entry} Entry */
/** @typedef {import('har-format').Cache} Cache */
/** @typedef {import('har-format').Request} Request */
/** @typedef {import('har-format').Response} Response */
/** @typedef {import('har-format').Header} Header */
/** @typedef {import('har-format').PostData} PostData */
/** @typedef {import('har-format').Content} Content */
/** @typedef {import('har-format').QueryString} QueryString */

/**
 * A class that transforms ARC request objects into a HAR format.
 */
export class HarTransformer {
  /**
   * @param {string=} version The application version name.
   * @param {string=} name The name of the "creator" field.
   */
  constructor(version, name) {
    this.name = name || 'Advanced REST Client';
    this.version = version || 'Unknown';
  }

  /**
   * Transforms the request objects to a log.
   * @param {ArcBaseRequest[]} requests
   * @returns {Promise<Har>}
   */
  async transform(requests) {
    const log = this.createLog();
    log.entries = await this.createEntries(requests);
    const result = /** @type Har */ ({
      log,
    });
    return result;
  }

  /**
   * @returns {Log}
   */
  createLog() {
    const log = /** @type Log */ ({
      creator: this.createCreator(),
      version: '1.2',
      entries: [],
    });
    return log;
  }

  /**
   * @returns {Creator}
   */
  createCreator() {
    const { name, version } = this;
    const result = /** @type Creator */ ({
      name,
      version
    });
    return result;
  }

  /**
   * @param {ArcBaseRequest[]} requests
   * @returns {Promise<Entry[]>}
   */
  async createEntries(requests) {
    const ps = requests.map((r) => this.createEntry(r));
    const result = await Promise.all(ps);
    let entires = [];
    result.forEach((entry) => {
      if (!entry) {
        return;
      }
      if (Array.isArray(entry)) {
        entires = entires.concat(entry);
      } else {
        entires.push(entry);
      }
    });
    entires = entires.sort((a, b) => new Date(b.startedDateTime).getTime() - new Date(a.startedDateTime).getTime());
    return entires;
  }

  /**
   * @param {ArcBaseRequest} request
   * @returns {Promise<Entry|Entry[]|null>}
   */
  async createEntry(request) {
    const processedRequest = BodyProcessor.restorePayload(request);
    const { response, transportRequest } = processedRequest;
    if (!response || !transportRequest) {
      return null;
    }
    const typedError = /** @type ErrorResponse */ (response);
    if (typedError.error) {
      // In ARC this means a general error, like I can't make a connection error.
      // The HTTP errors are reported via the regular response object.
      return null;
    }
    let typedResponse = /** @type ArcResponse */ (response);
    typedResponse = BodyProcessor.restorePayload(typedResponse);
    
    const item = await this._createEntry(processedRequest, transportRequest, typedResponse);
    if (Array.isArray(typedResponse.redirects) && typedResponse.redirects.length) {
      const result = await this.createRedirectEntries(processedRequest, typedResponse);
      result.push(item);
      return result;
    }
    return item;
  }

  /**
   * @param {ArcBaseRequest} request
   * @param {TransportRequest} transportRequest
   * @param {ArcResponse} response
   * @return {Promise<Entry>} 
   */
  async _createEntry(request, transportRequest, response) {
    const { loadingTime, timings } = response;
    const { startTime = Date.now(), } = transportRequest;
  
    const entry = /** @type Entry */ ({
      startedDateTime: new Date(startTime).toISOString(),
      time: loadingTime,
      cache: this.createCache(),
      timings,
      request: await this.createRequest(request),
      response: await this.createResponse(response),
    });
    return entry;
  }

  /**
   * @param {ArcBaseRequest} request
   * @param {ArcResponse} response
   * @return {Promise<Entry[]>} 
   */
  async createRedirectEntries(request, response) {
    const ps = response.redirects.map(async (redirect) => {
      const { startTime=Date.now(), endTime=Date.now(), timings, response: redirectResponse, url } = redirect;
      const loadingTime = endTime - startTime;
      const entry = /** @type Entry */ ({
        startedDateTime: new Date(startTime).toISOString(),
        time: loadingTime,
        cache: this.createCache(),
        timings,
        request: await this.createRequest(request),
        response: await this.createResponse(redirectResponse, url),
      });
      return entry;
    });
    return Promise.all(ps);
  }

  /**
   * @returns {Cache}
   */
  createCache() {
    const result = /** @type Cache */ ({
      afterRequest: null,
      beforeRequest: null,
      comment: 'This application does not support caching.'
    });
    return result;
  }

  /**
   * @param {ArcBaseRequest} request
   * @returns {Promise<Request>}
   */
  async createRequest(request) {
    const { url, method, headers, payload } = request;
    const result = /** @type Request */ ({
      method,
      url,
      httpVersion: 'HTTP/1.1',
      headers: this.createHeaders(headers),
      bodySize: 0,
      headersSize: 0,
      cookies: [],
      queryString: this.readQueryString(url),
    });
    if (payload) {
      result.bodySize = await computePayloadSize(payload);
      result.postData = await this.createPostData(payload, headers);
    }
    if (headers) {
      // Total number of bytes from the start of the HTTP request message until (and including) 
      // the double CRLF before the body.
      // @todo: compute size of the message header 
      result.headersSize = calculateBytes(headers) + 4;
    }
    return result;
  }

  /**
   * @param {HTTPResponse} response The response data
   * @param {string=} redirectURL Optional redirect URL for the redirected request.
   * @returns {Promise<Response>}
   */
  async createResponse(response, redirectURL) {
    const { status, statusText, payload, headers, } = response;
    const result = /** @type Response */ ({
      status,
      statusText,
      httpVersion: 'HTTP/1.1',
      cookies: [],
      headers: this.createHeaders(headers),
      redirectURL,
      headersSize: 0,
      bodySize: 0,
    });
    if (payload) {
      result.content = await this.createResponseContent(/** @type string | Buffer | ArrayBuffer */ (payload), headers);
      result.bodySize = result.content.size || 0;
    }
    if (headers) {
      // Total number of bytes from the start of the HTTP request message until (and including) 
      // the double CRLF before the body.
      // @todo: compute size of the message header 
      result.headersSize = calculateBytes(headers) + 4;
    }
    return result;
  }

  /**
   * @param {string} headers
   * @returns {Header[]}
   */
  createHeaders(headers) {
    if (!headers || typeof headers !== 'string') {
      return [];
    }
    const list = HeadersParser.toJSON(headers);
    return list.map((item) => {
      const { name, value } = item;
      return {
        name,
        value,
      };
    });
  }

  /**
   * @param {string | File | Blob | Buffer | ArrayBuffer | FormData} payload
   * @param {string} headers
   * @returns {Promise<PostData>}
   */
  async createPostData(payload, headers) {
    const mimeType = HeadersParser.contentType(headers);
    const result = /** @type PostData */ ({
      mimeType,
    });
    const type = typeof payload;
    if (['string', 'boolean', 'undefined'].includes(type)) {
      result.text = /** @type string */ (payload);
    } else if (payload instanceof Blob) {
      result.text = await BodyProcessor.fileToString(/** @type File */ (payload));
    } else if (payload instanceof FormData) {
      const r = new Request('/', {
        body: payload,
        method: 'POST',
      });
      const buff = await r.arrayBuffer();
      result.text = this.readBodyString(buff);
    } else {
      result.text = this.readBodyString(/** string|Buffer|ArrayBuffer */ (payload));
    }
    return result;
  }

  /**
   * @param {string|Buffer|ArrayBuffer} body The body 
   * @param {string=} charset The optional charset to use with the text decoder.
   * @returns {string}
   */
  readBodyString(body, charset) {
    const type = typeof body;
    if (['string', 'boolean', 'undefined'].includes(type)) {
      return /** @type string */ (body);
    }
    let typed = /** @type Buffer|ArrayBuffer */(body);
    // don't remember. I think it's either Node's or ARC's property.
    // @ts-ignore
    if (typed && typed.type === 'Buffer') {
      // @ts-ignore
      typed = new Uint8Array(typed.data);
    }
    const decoder = new TextDecoder(charset);
    try {
      return decoder.decode(typed);
    } catch (e) {
      return '';
    }
  }

  /**
   * @param {string | Buffer | ArrayBuffer} payload
   * @param {string} headers
   * @returns {Promise<Content>}
   */
  async createResponseContent(payload, headers) {
    const headerItem = HeadersParser.toJSON(headers).find((item) => item.name.toLowerCase() === 'content-type');
    let mimeType = /** @type string */ (headerItem && headerItem.value);
    let encoding;
    if (mimeType && mimeType.includes('charset=')) {
      const parts = mimeType.split(';');
      // Content-Type: text/html; charset=UTF-8
      parts.forEach((part) => {
        const item = part.trim();
        const _tmp = item.split('=');
        if (_tmp.length === 1) {
          mimeType = item;
        } else if (_tmp[0].trim() === 'charset') {
          encoding = _tmp[1].trim();
        }
      });
    }
    const result = /** @type Content */ ({
      mimeType,
    });
    if (payload) {
      result.text = this.readBodyString(payload);
      result.size = await computePayloadSize(payload);
    }
    if (encoding) {
      result.encoding = encoding;
    }
    return result;
  }

  /**
   * @param {string} url
   * @returns {QueryString[]}
   */
  readQueryString(url) {
    const result = /** @type QueryString[] */ ([]);
    try {
      const parser = new URL(url);
      parser.searchParams.forEach(([value ,name]) => {
        result.push({
          name,
          value,
        });
      });
    } catch (e) {
      // 
    }
    return result;
  }
}
