/**
 * Analytics computation functions for the Throw Tracker.
 * All distance computations work in feet unless otherwise noted.
 */

/**
 * Get distance in feet from a throw object.
 * Handles string values from PostgreSQL numeric columns.
 */
function getDistanceFeet(t) {
  if (t.distance_feet != null) return parseFloat(t.distance_feet);
  if (t.distance_yards != null) return parseFloat(t.distance_yards) * 3;
  return 0;
}

/**
 * Convert yards to feet.
 * @param {number} yards
 * @returns {number}
 */
export function yardsToFeet(yards) {
  return parseFloat(yards) * 3;
}

/**
 * Compute average and max distance in feet from an array of throw distances (in yards).
 * @param {number[]} throws - Array of distances in yards
 * @returns {{ average: number, max: number }}
 */
export function computeThrowSetStats(throws) {
  if (!throws || throws.length === 0) {
    return { average: 0, max: 0 };
  }
  const feetValues = throws.map((d) => yardsToFeet(d));
  const sum = feetValues.reduce((acc, v) => acc + v, 0);
  const average = sum / feetValues.length;
  const max = Math.max(...feetValues);
  return { average, max };
}

/**
 * Compute average distance per disc per session, excluding flagged throws.
 * @param {Array} throws - All throws with session_id, disc_id, distance_yards, flag
 * @param {Array} discs - All discs with id, name
 * @returns {Array} Array of { disc_id, disc_name, session_id, average_feet }
 */
export function computeAveragePerDiscPerSession(throws, discs) {
  const discMap = new Map(discs.map((d) => [d.id, d]));
  const unflagged = throws.filter((t) => !t.flag);

  // Group by session_id + disc_id
  const groups = new Map();
  for (const t of unflagged) {
    const key = `${t.session_id}|${t.disc_id}`;
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key).push(t);
  }

  const results = [];
  for (const [key, groupThrows] of groups) {
    const [sessionId, discId] = key.split('|');
    const disc = discMap.get(discId);
    const distances = groupThrows.map((t) => getDistanceFeet(t));
    const avgFeet = distances.reduce((sum, d) => sum + d, 0) / distances.length;
    results.push({
      disc_id: discId,
      disc_name: disc ? disc.name : 'Unknown',
      session_id: sessionId,
      average_feet: avgFeet,
    });
  }

  return results;
}

/**
 * Compute average distance grouped by disc_type or stability.
 * @param {Array} throws
 * @param {Array} discs
 * @param {'disc_type'|'stability'} groupBy
 * @returns {Array} Array of { group, average_feet, count }
 */
export function computeAverageByCategory(throws, discs, groupBy) {
  const discMap = new Map(discs.map((d) => [d.id, d]));
  const unflagged = throws.filter((t) => !t.flag);

  const groups = new Map();
  for (const t of unflagged) {
    const disc = discMap.get(t.disc_id);
    if (!disc) continue;
    const groupKey = disc[groupBy] || 'Unknown';
    if (!groups.has(groupKey)) {
      groups.set(groupKey, []);
    }
    groups.get(groupKey).push(t);
  }

  const results = [];
  for (const [group, groupThrows] of groups) {
    const distances = groupThrows.map((t) => getDistanceFeet(t));
    const avgFeet = distances.reduce((sum, d) => sum + d, 0) / distances.length;
    results.push({
      group,
      average_feet: avgFeet,
      count: groupThrows.length,
    });
  }

  return results;
}

/**
 * Compute consistency (std dev and range) per disc, excluding flagged throws.
 * @param {Array} throws
 * @param {Array} discs
 * @returns {Array} Array of { disc_id, disc_name, stdDev, range, count }
 */
export function computeConsistency(throws, discs) {
  const discMap = new Map(discs.map((d) => [d.id, d]));
  const unflagged = throws.filter((t) => !t.flag);

  // Group by disc_id
  const groups = new Map();
  for (const t of unflagged) {
    if (!groups.has(t.disc_id)) {
      groups.set(t.disc_id, []);
    }
    groups.get(t.disc_id).push(t);
  }

  const results = [];
  for (const [discId, groupThrows] of groups) {
    const disc = discMap.get(discId);
    const distances = groupThrows.map((t) => getDistanceFeet(t));

    if (distances.length < 2) {
      results.push({
        disc_id: discId,
        disc_name: disc ? disc.name : 'Unknown',
        stdDev: 0,
        range: 0,
        count: distances.length,
      });
      continue;
    }

    const mean = distances.reduce((sum, d) => sum + d, 0) / distances.length;
    const variance = distances.reduce((sum, d) => sum + Math.pow(d - mean, 2), 0) / distances.length;
    const stdDev = Math.sqrt(variance);
    const range = Math.max(...distances) - Math.min(...distances);

    results.push({
      disc_id: discId,
      disc_name: disc ? disc.name : 'Unknown',
      stdDev,
      range,
      count: distances.length,
    });
  }

  // Sort by stdDev ascending (most consistent first)
  results.sort((a, b) => a.stdDev - b.stdDev);
  return results;
}

/**
 * Compute session comparison — overall average per session, excluding flagged.
 * @param {Array} sessions - All throwing sessions with id, session_date
 * @param {Array} throws
 * @returns {Array} Array of { session_id, session_date, average_feet, throw_count }
 */
export function computeSessionComparison(sessions, throws) {
  const unflagged = throws.filter((t) => !t.flag);
  const sessionMap = new Map(sessions.map((s) => [s.id, s]));

  // Group by session_id
  const groups = new Map();
  for (const t of unflagged) {
    if (!groups.has(t.session_id)) {
      groups.set(t.session_id, []);
    }
    groups.get(t.session_id).push(t);
  }

  const results = [];
  for (const [sessionId, groupThrows] of groups) {
    const session = sessionMap.get(sessionId);
    const distances = groupThrows.map((t) => getDistanceFeet(t));
    const avgFeet = distances.reduce((sum, d) => sum + d, 0) / distances.length;
    results.push({
      session_id: sessionId,
      session_date: session ? session.session_date : null,
      average_feet: avgFeet,
      throw_count: groupThrows.length,
    });
  }

  // Sort by date
  results.sort((a, b) => {
    if (!a.session_date || !b.session_date) return 0;
    return new Date(a.session_date) - new Date(b.session_date);
  });

  return results;
}

/**
 * Compute disc rankings sorted by average distance descending, excluding flagged.
 * @param {Array} throws
 * @param {Array} discs
 * @returns {Array} Array of { disc_id, disc_name, disc_type, stability, average_feet, throw_count }
 */
export function computeDiscRankings(throws, discs) {
  const discMap = new Map(discs.map((d) => [d.id, d]));
  const unflagged = throws.filter((t) => !t.flag);

  // Group by disc_id
  const groups = new Map();
  for (const t of unflagged) {
    if (!groups.has(t.disc_id)) {
      groups.set(t.disc_id, []);
    }
    groups.get(t.disc_id).push(t);
  }

  const results = [];
  for (const [discId, groupThrows] of groups) {
    const disc = discMap.get(discId);
    const distances = groupThrows.map((t) => getDistanceFeet(t));
    const avgFeet = distances.reduce((sum, d) => sum + d, 0) / distances.length;
    const maxFeet = Math.max(...distances);
    results.push({
      disc_id: discId,
      disc_name: disc ? disc.name : 'Unknown',
      disc_type: disc ? disc.disc_type : 'Unknown',
      stability: disc ? disc.stability : 'Unknown',
      average_feet: avgFeet,
      max_feet: maxFeet,
      throw_count: groupThrows.length,
    });
  }

  // Sort by average descending
  results.sort((a, b) => b.average_feet - a.average_feet);
  return results;
}

/**
 * Compute putting percentages — C1 and C2 per session and overall.
 * @param {Array} putts - All putts with putting_session_id, distance_feet, attempts, makes
 * @returns {{ perSession: Array, overall: { c1: number, c2: number } }}
 */
export function computePuttingPercentages(putts) {
  if (!putts || putts.length === 0) {
    return { perSession: [], overall: { c1: 0, c2: 0 } };
  }

  // Group by session
  const sessionGroups = new Map();
  for (const p of putts) {
    const sid = p.putting_session_id;
    if (!sessionGroups.has(sid)) {
      sessionGroups.set(sid, []);
    }
    sessionGroups.get(sid).push(p);
  }

  let totalC1Attempts = 0;
  let totalC1Makes = 0;
  let totalC2Attempts = 0;
  let totalC2Makes = 0;

  const perSession = [];
  for (const [sessionId, sessionPutts] of sessionGroups) {
    let c1Attempts = 0, c1Makes = 0, c2Attempts = 0, c2Makes = 0;
    for (const p of sessionPutts) {
      const circle = classifyCircle(p.distance_feet);
      if (circle === 'C1') {
        c1Attempts += parseInt(p.attempts) || 0;
        c1Makes += parseInt(p.makes) || 0;
      } else {
        c2Attempts += parseInt(p.attempts) || 0;
        c2Makes += parseInt(p.makes) || 0;
      }
    }
    totalC1Attempts += c1Attempts;
    totalC1Makes += c1Makes;
    totalC2Attempts += c2Attempts;
    totalC2Makes += c2Makes;

    perSession.push({
      session_id: sessionId,
      c1: c1Attempts > 0 ? (c1Makes / c1Attempts) * 100 : 0,
      c2: c2Attempts > 0 ? (c2Makes / c2Attempts) * 100 : 0,
    });
  }

  return {
    perSession,
    overall: {
      c1: totalC1Attempts > 0 ? (totalC1Makes / totalC1Attempts) * 100 : 0,
      c2: totalC2Attempts > 0 ? (totalC2Makes / totalC2Attempts) * 100 : 0,
    },
  };
}

/**
 * Identify longest and shortest unflagged throws per session.
 * @param {Array} throws
 * @returns {Array} Array of { session_id, longest, shortest }
 */
export function identifySessionExtremes(throws) {
  const unflagged = throws.filter((t) => !t.flag);

  // Group by session_id
  const groups = new Map();
  for (const t of unflagged) {
    if (!groups.has(t.session_id)) {
      groups.set(t.session_id, []);
    }
    groups.get(t.session_id).push(t);
  }

  const results = [];
  for (const [sessionId, groupThrows] of groups) {
    const distances = groupThrows.map((t) => ({
      distance_feet: getDistanceFeet(t),
      throw: t,
    }));
    const sorted = distances.sort((a, b) => b.distance_feet - a.distance_feet);
    results.push({
      session_id: sessionId,
      longest: sorted[0],
      shortest: sorted[sorted.length - 1],
    });
  }

  return results;
}

/**
 * Group session averages by conditions text.
 * @param {Array} sessions
 * @param {Array} throws
 * @returns {Array} Array of { conditions, average_feet, session_count }
 */
export function groupByConditions(sessions, throws) {
  const unflagged = throws.filter((t) => !t.flag);
  const sessionMap = new Map(sessions.map((s) => [s.id, s]));

  // Compute average per session
  const sessionAvgs = new Map();
  for (const t of unflagged) {
    if (!sessionAvgs.has(t.session_id)) {
      sessionAvgs.set(t.session_id, []);
    }
    sessionAvgs.get(t.session_id).push(getDistanceFeet(t));
  }

  // Group by conditions
  const conditionGroups = new Map();
  for (const [sessionId, distances] of sessionAvgs) {
    const session = sessionMap.get(sessionId);
    const conditions = session && session.conditions ? session.conditions : 'No conditions';
    const avg = distances.reduce((sum, d) => sum + d, 0) / distances.length;

    if (!conditionGroups.has(conditions)) {
      conditionGroups.set(conditions, []);
    }
    conditionGroups.get(conditions).push(avg);
  }

  const results = [];
  for (const [conditions, avgs] of conditionGroups) {
    const overallAvg = avgs.reduce((sum, a) => sum + a, 0) / avgs.length;
    results.push({
      conditions,
      average_feet: overallAvg,
      session_count: avgs.length,
    });
  }

  return results;
}

/**
 * Classify a putt distance as C1 or C2.
 * @param {number} distanceFeet
 * @returns {'C1'|'C2'}
 */
export function classifyCircle(distanceFeet) {
  return parseFloat(distanceFeet) < 33 ? 'C1' : 'C2';
}

/**
 * Group discs by stability in order: VOS, OS, ST, US, VUS, then Putters.
 * @param {Array} discs
 * @returns {Array} Array of { group, discs: [...] }
 */
export function groupDiscsByStability(discs) {
  const stabilityOrder = ['VOS', 'OS', 'ST', 'US', 'VUS'];
  const groups = new Map();

  // Initialize groups in order
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
      // Unknown stability — put in a catch-all
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
