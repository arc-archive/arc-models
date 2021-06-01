import { ImportCcTable } from './src/inspector/ImportCcTable';

declare global {
  interface HTMLElementTagNameMap {
    "import-cc-table": ImportCcTable;
  }
}
