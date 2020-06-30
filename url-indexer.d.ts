import {UrlIndexer} from './src/UrlIndexer';

declare global {
  interface HTMLElementTagNameMap {
    "url-indexer": UrlIndexer;
  }
}
