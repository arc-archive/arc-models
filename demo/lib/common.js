import '@advanced-rest-client/arc-demo-helper/arc-demo-helper.js';
import '@anypoint-web-components/anypoint-dropdown-menu/anypoint-dropdown-menu.js';
import '@anypoint-web-components/anypoint-listbox/anypoint-listbox.js';
import '@anypoint-web-components/anypoint-item/anypoint-item.js';
import '@anypoint-web-components/anypoint-input/anypoint-input.js';
import '@anypoint-web-components/anypoint-button/anypoint-button.js';
import '@anypoint-web-components/anypoint-checkbox/anypoint-checkbox.js';
import '@polymer/paper-toast/paper-toast.js';
import { DemoPage } from '@advanced-rest-client/arc-demo-helper';

export class DemoPageBase extends DemoPage {
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
