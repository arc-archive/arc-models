import { ArcBaseModel } from '../../src/ArcBaseModel.js';

export const STORE_NAME = 'todo-list';

export class TestModel extends ArcBaseModel {
  constructor() {
    super(STORE_NAME, 2);
  }
}
window.customElements.define('test-model', TestModel);
