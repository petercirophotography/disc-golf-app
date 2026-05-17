/**
 * Pure validation utilities for the Throw Tracker.
 */

/**
 * Validate a throw distance value.
 * Rejects non-numeric, negative, and NaN values.
 * @param {*} value
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateThrowDistance(value) {
  if (value === null || value === undefined || value === '') {
    return { valid: false, error: 'Distance is required' };
  }
  const num = Number(value);
  if (isNaN(num)) {
    return { valid: false, error: 'Distance must be a number' };
  }
  if (num < 0) {
    return { valid: false, error: 'Distance cannot be negative' };
  }
  return { valid: true };
}

/**
 * Validate putt attempts and makes.
 * Rejects makes > attempts, negatives.
 * @param {*} attempts
 * @param {*} makes
 * @returns {{ valid: boolean, error?: string }}
 */
export function validatePutt(attempts, makes) {
  const attNum = Number(attempts);
  const makesNum = Number(makes);

  if (isNaN(attNum) || isNaN(makesNum)) {
    return { valid: false, error: 'Attempts and makes must be numbers' };
  }
  if (attNum < 0 || makesNum < 0) {
    return { valid: false, error: 'Values cannot be negative' };
  }
  if (makesNum > attNum) {
    return { valid: false, error: 'Makes cannot exceed attempts' };
  }
  return { valid: true };
}

/**
 * Validate a session object.
 * Requires location.
 * @param {{ location?: string }} session
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateSession(session) {
  if (!session || !session.location || session.location.trim() === '') {
    return { valid: false, error: 'Location is required' };
  }
  return { valid: true };
}

/**
 * Validate a disc object.
 * Requires name and disc_type.
 * @param {{ name?: string, disc_type?: string }} disc
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateDisc(disc) {
  if (!disc) {
    return { valid: false, error: 'Disc data is required' };
  }
  if (!disc.name || disc.name.trim() === '') {
    return { valid: false, error: 'Disc name is required' };
  }
  if (!disc.disc_type || disc.disc_type.trim() === '') {
    return { valid: false, error: 'Disc type is required' };
  }
  return { valid: true };
}

/**
 * Convert yards to feet.
 * @param {number} yards
 * @returns {number}
 */
export function yardsToFeet(yards) {
  return yards * 3;
}

/**
 * Compute average and max distance in feet from an array of distances in yards.
 * @param {number[]} distances - Array of distances in yards
 * @returns {{ average: number, max: number }}
 */
export function computeThrowSetStats(distances) {
  if (!distances || distances.length === 0) {
    return { average: 0, max: 0 };
  }
  const feetValues = distances.map((d) => yardsToFeet(d));
  const sum = feetValues.reduce((acc, v) => acc + v, 0);
  const average = sum / feetValues.length;
  const max = Math.max(...feetValues);
  return { average, max };
}

/**
 * Classify a putt distance as C1 or C2.
 * @param {number} distanceFeet
 * @returns {'C1'|'C2'}
 */
export function classifyCircle(distanceFeet) {
  return distanceFeet < 33 ? 'C1' : 'C2';
}

/**
 * Group discs by stability in order: VOS, OS, ST, US, VUS, then Putters.
 * @param {Array} discs
 * @returns {Array} Array of { group, discs: [...] }
 */
export function groupDiscsByStability(discs) {
  const stabilityOrder = ['VOS', 'OS', 'ST', 'US', 'VUS'];
  const groups = new Map();

  for (const s of stabilityOrder) {
    groups.set(s, []);
  }
  groups.set('Putters', []);

  for (const disc of discs) {
    if (disc.disc_type === 'Putter') {
      groups.get('Putters').push(disc);
    } else if (stabilityOrder.includes(disc.stability)) {
      groups.get(disc.stability).push(disc);
    } else {
      if (!groups.has('Other')) {
        groups.set('Other', []);
      }
      groups.get('Other').push(disc);
    }
  }

  const results = [];
  for (const [group, groupDiscs] of groups) {
    if (groupDiscs.length > 0) {
      results.push({ group, discs: groupDiscs });
    }
  }

  return results;
}

/**
 * Toggle the in_bag boolean on a disc.
 * @param {{ in_bag: boolean }} disc
 * @returns {{ in_bag: boolean }} New disc object with flipped in_bag
 */
export function toggleInBag(disc) {
  return { ...disc, in_bag: !disc.in_bag };
}
