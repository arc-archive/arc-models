/**
 * Computes past mindnight for given timestamp.
 *
 * @param {number} time Timestamp
 * @return {number} Time reduced to midnight.
 */
export function computeMidnight(time) {
  let typed = Number(time);
  if (!time || Number.isNaN(typed)) {
    typed = Date.now();
  }
  const day = new Date(typed);
  day.setHours(0, 0, 0, 0);
  return day.getTime();
}

/**
 * Computes time for timestamp's day, month and year and time set to 0.
 * @param {object} item Database entry item.
 * @return {object} The same database item with `_time` property.
 */
export function computeTime(item) {
  const copy = { ...item };
  copy._time = computeMidnight(copy.time);
  return copy;
}

/**
 * Helper method to cancel the event and stop it's propagation.
 * @param {Event|CustomEvent} e Event to cancel
 */
export function cancelEvent(e) {
  e.preventDefault();
  e.stopPropagation();
}
