import { ARCReadEventDetail } from './BaseEvents';
import { ARCProject } from '../RequestTypes';
/**
 * Project read event
 */
export declare class ARCPRojectReadEvent extends CustomEvent<ARCReadEventDetail<ARCProject>> {
  constructor(detail: ARCReadEventDetail<ARCProject>);
}
