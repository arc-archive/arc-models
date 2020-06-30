/**
 * Computes past mindnight for given timestamp.
 *
 * @param time Timestamp
 * @returns Time reduced to midnight.
 */
export function computeMidnight(time: number): number;

/**
 * Computes time for timestamp's day, month and year and time set to 0.
 * @param {object} item Database entry item.
 * @returns The copy of the  database item with the `_time` property.
 */
export function computeTime(item: object): object;

/**
 * Helper method to cancel the event and stop it's propagation.
 * @param e Event to cancel
 */
export function cancelEvent(e: Event|CustomEvent): void;
