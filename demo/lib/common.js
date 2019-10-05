import '@advanced-rest-client/arc-demo-helper/arc-demo-helper.js';
import '@polymer/paper-styles/typography.js';
import '@polymer/paper-styles/shadow.js';
import '@polymer/paper-dropdown-menu/paper-dropdown-menu.js';
import '@polymer/paper-item/paper-item.js';
import '@polymer/paper-listbox/paper-listbox.js';
import '@polymer/paper-toast/paper-toast.js';
import '@polymer/paper-input/paper-input.js';
import '@polymer/paper-button/paper-button.js';
import '@polymer/paper-checkbox/paper-checkbox.js';
import '@polymer/iron-form/iron-form.js';

export class DemoPageBase {
  get hasResults() {
    return this._hasResults;
  }

  set hasResults(value) {
    this._hasResults = value;
    this.render();
  }

  render() {
    if (this.__rendering) {
      return;
    }
    this.__rendering = true;
    setTimeout(() => {
      this.__rendering = false;
      this._render();
    });
  }

  _dumpMeasurements() {
    const ms = performance.getEntriesByType('measure');
    console.table(ms.map((item) => {
      return {
        name: item.name,
        duration: item.duration
      };
    }));
    performance.clearMeasures();
  }
}
