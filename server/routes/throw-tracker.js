import { Router } from 'express';
import pool from '../db.js';

const router = Router();

// GET /discs — list all discs ordered by stability category, then putters, then name
router.get('/discs', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM discs
      ORDER BY
        CASE stability
          WHEN 'VOS' THEN 1
          WHEN 'OS' THEN 2
          WHEN 'ST' THEN 3
          WHEN 'US' THEN 4
          WHEN 'VUS' THEN 5
        END,
        CASE disc_type WHEN 'Putter' THEN 1 ELSE 0 END,
        speed DESC NULLS LAST,
        name
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error listing discs:', error.message);
    res.status(500).json({ error: 'Failed to retrieve discs' });
  }
});

// POST /discs — create a disc (name and disc_type required)
router.post('/discs', async (req, res) => {
  const { name, disc_type, stability, brand, speed, glide, turn, fade, in_bag } = req.body;

  if (!name || !disc_type) {
    return res.status(400).json({ error: 'name and disc_type are required' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO discs (name, disc_type, stability, brand, speed, glide, turn, fade, in_bag)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [name, disc_type, stability || 'ST', brand || null, speed || null, glide || null, turn || null, fade || null, in_bag !== undefined ? in_bag : true]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating disc:', error.message);
    res.status(500).json({ error: 'Failed to create disc' });
  }
});

// PUT /discs/:id — update a disc
router.put('/discs/:id', async (req, res) => {
  const { id } = req.params;
  const { name, disc_type, stability, brand, speed, glide, turn, fade, in_bag } = req.body;

  try {
    const result = await pool.query(
      `UPDATE discs
       SET name = COALESCE($1, name),
           disc_type = COALESCE($2, disc_type),
           stability = COALESCE($3, stability),
           brand = COALESCE($4, brand),
           speed = COALESCE($5, speed),
           glide = COALESCE($6, glide),
           turn = COALESCE($7, turn),
           fade = COALESCE($8, fade),
           in_bag = COALESCE($9, in_bag),
           updated_at = NOW()
       WHERE id = $10
       RETURNING *`,
      [name, disc_type, stability, brand, speed, glide, turn, fade, in_bag, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Disc not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating disc:', error.message);
    res.status(500).json({ error: 'Failed to update disc' });
  }
});

// DELETE /discs/:id — delete a disc
router.delete('/discs/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM discs WHERE id = $1', [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Disc not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting disc:', error.message);
    res.status(500).json({ error: 'Failed to delete disc' });
  }
});

// ============================================================
// Throwing Sessions
// ============================================================

// GET /sessions — list all throwing sessions ordered by date DESC
router.get('/sessions', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM throwing_sessions ORDER BY session_date DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error listing sessions:', error.message);
    res.status(500).json({ error: 'Failed to retrieve sessions' });
  }
});

// POST /sessions — create a throwing session (location required, date defaults to today)
router.post('/sessions', async (req, res) => {
  const { session_date, location, conditions } = req.body;

  if (!location) {
    return res.status(400).json({ error: 'location is required' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO throwing_sessions (session_date, location, conditions)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [session_date || new Date().toISOString().split('T')[0], location, conditions || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating session:', error.message);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

// PUT /sessions/:id — update a throwing session
router.put('/sessions/:id', async (req, res) => {
  const { id } = req.params;
  const { session_date, location, conditions } = req.body;

  try {
    const result = await pool.query(
      `UPDATE throwing_sessions
       SET session_date = COALESCE($1, session_date),
           location = COALESCE($2, location),
           conditions = COALESCE($3, conditions),
           updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [session_date, location, conditions, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating session:', error.message);
    res.status(500).json({ error: 'Failed to update session' });
  }
});

// DELETE /sessions/:id — delete a throwing session (cascades to throws)
router.delete('/sessions/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM throwing_sessions WHERE id = $1', [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting session:', error.message);
    res.status(500).json({ error: 'Failed to delete session' });
  }
});

// ============================================================
// Throws
// ============================================================

// GET /throws — get ALL throws across all sessions (for analytics)
router.get('/throws', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.*, d.name as disc_name, d.disc_type, d.stability
       FROM throws t
       JOIN discs d ON t.disc_id = d.id
       ORDER BY t.session_id, d.name, t.throw_number`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error listing all throws:', error.message);
    res.status(500).json({ error: 'Failed to retrieve throws' });
  }
});

// GET /putts — get ALL putts across all sessions (for analytics)
router.get('/putts', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM putts ORDER BY putting_session_id, distance_feet`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error listing all putts:', error.message);
    res.status(500).json({ error: 'Failed to retrieve putts' });
  }
});

// GET /sessions/:id/throws — get all throws for a session (joined with disc info)
router.get('/sessions/:id/throws', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `SELECT t.*, d.name as disc_name, d.disc_type, d.stability
       FROM throws t
       JOIN discs d ON t.disc_id = d.id
       WHERE t.session_id = $1
       ORDER BY d.name, t.throw_number`,
      [id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error listing throws:', error.message);
    res.status(500).json({ error: 'Failed to retrieve throws' });
  }
});

// POST /sessions/:id/throws — batch create throws (accept array)
router.post('/sessions/:id/throws', async (req, res) => {
  const { id } = req.params;
  const throws = req.body;

  if (!Array.isArray(throws) || throws.length === 0) {
    return res.status(400).json({ error: 'Request body must be a non-empty array of throws' });
  }

  // Validate each throw
  for (const t of throws) {
    if (t.distance_yards === undefined || t.distance_yards === null || t.distance_yards < 0) {
      return res.status(400).json({ error: 'distance_yards must be >= 0 for all throws' });
    }
    if (!t.throw_number || t.throw_number < 1 || t.throw_number > 3) {
      return res.status(400).json({ error: 'throw_number must be between 1 and 3 for all throws' });
    }
    if (!t.disc_id) {
      return res.status(400).json({ error: 'disc_id is required for all throws' });
    }
  }

  try {
    const insertedThrows = [];
    for (const t of throws) {
      const result = await pool.query(
        `INSERT INTO throws (session_id, disc_id, distance_yards, throw_number, flag)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [id, t.disc_id, t.distance_yards, t.throw_number, t.flag || null]
      );
      insertedThrows.push(result.rows[0]);
    }
    res.status(201).json(insertedThrows);
  } catch (error) {
    console.error('Error creating throws:', error.message);
    res.status(500).json({ error: 'Failed to create throws' });
  }
});

// PUT /throws/:id — update a throw (for flagging/unflagging)
router.put('/throws/:id', async (req, res) => {
  const { id } = req.params;
  const { distance_yards, throw_number, flag } = req.body;

  try {
    const result = await pool.query(
      `UPDATE throws
       SET distance_yards = COALESCE($1, distance_yards),
           throw_number = COALESCE($2, throw_number),
           flag = $3
       WHERE id = $4
       RETURNING *`,
      [distance_yards, throw_number, flag !== undefined ? flag : null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Throw not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating throw:', error.message);
    res.status(500).json({ error: 'Failed to update throw' });
  }
});

// DELETE /throws/:id — delete a throw
router.delete('/throws/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM throws WHERE id = $1', [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Throw not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting throw:', error.message);
    res.status(500).json({ error: 'Failed to delete throw' });
  }
});

// ============================================================
// Putting Sessions
// ============================================================

// GET /putting-sessions — list all putting sessions ordered by date DESC
router.get('/putting-sessions', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM putting_sessions ORDER BY session_date DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error listing putting sessions:', error.message);
    res.status(500).json({ error: 'Failed to retrieve putting sessions' });
  }
});

// POST /putting-sessions — create a putting session (location defaults to 'Backyard', date defaults to today)
router.post('/putting-sessions', async (req, res) => {
  const { session_date, location, conditions } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO putting_sessions (session_date, location, conditions)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [session_date || new Date().toISOString().split('T')[0], location || 'Backyard', conditions || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating putting session:', error.message);
    res.status(500).json({ error: 'Failed to create putting session' });
  }
});

// PUT /putting-sessions/:id — update a putting session
router.put('/putting-sessions/:id', async (req, res) => {
  const { id } = req.params;
  const { session_date, location, conditions } = req.body;

  try {
    const result = await pool.query(
      `UPDATE putting_sessions
       SET session_date = COALESCE($1, session_date),
           location = COALESCE($2, location),
           conditions = COALESCE($3, conditions),
           updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [session_date, location, conditions, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Putting session not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating putting session:', error.message);
    res.status(500).json({ error: 'Failed to update putting session' });
  }
});

// DELETE /putting-sessions/:id — delete a putting session (cascades to putts)
router.delete('/putting-sessions/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM putting_sessions WHERE id = $1', [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Putting session not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting putting session:', error.message);
    res.status(500).json({ error: 'Failed to delete putting session' });
  }
});

// ============================================================
// Putts
// ============================================================

// GET /putting-sessions/:id/putts — get all putts for a putting session
router.get('/putting-sessions/:id/putts', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `SELECT * FROM putts
       WHERE putting_session_id = $1
       ORDER BY distance_feet`,
      [id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error listing putts:', error.message);
    res.status(500).json({ error: 'Failed to retrieve putts' });
  }
});

// POST /putting-sessions/:id/putts — batch create putts (accept array of {distance_feet, attempts, makes})
router.post('/putting-sessions/:id/putts', async (req, res) => {
  const { id } = req.params;
  const putts = req.body;

  if (!Array.isArray(putts) || putts.length === 0) {
    return res.status(400).json({ error: 'Request body must be a non-empty array of putts' });
  }

  // Validate each putt
  for (const p of putts) {
    if (p.distance_feet === undefined || p.distance_feet === null || p.distance_feet <= 0 || p.distance_feet > 66) {
      return res.status(400).json({ error: 'distance_feet must be > 0 and <= 66 for all putts' });
    }
    if (p.attempts === undefined || p.attempts === null || p.attempts <= 0) {
      return res.status(400).json({ error: 'attempts must be > 0 for all putts' });
    }
    if (p.makes === undefined || p.makes === null || p.makes < 0) {
      return res.status(400).json({ error: 'makes must be >= 0 for all putts' });
    }
    if (p.makes > p.attempts) {
      return res.status(400).json({ error: 'makes must be <= attempts for all putts' });
    }
  }

  try {
    const insertedPutts = [];
    for (const p of putts) {
      const result = await pool.query(
        `INSERT INTO putts (putting_session_id, distance_feet, attempts, makes, disc_id)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [id, p.distance_feet, p.attempts, p.makes, p.disc_id || null]
      );
      insertedPutts.push(result.rows[0]);
    }
    res.status(201).json(insertedPutts);
  } catch (error) {
    console.error('Error creating putts:', error.message);
    res.status(500).json({ error: 'Failed to create putts' });
  }
});

// PUT /putts/:id — update a putt
router.put('/putts/:id', async (req, res) => {
  const { id } = req.params;
  const { distance_feet, attempts, makes } = req.body;

  // Validate if provided
  if (distance_feet !== undefined && (distance_feet <= 0 || distance_feet > 66)) {
    return res.status(400).json({ error: 'distance_feet must be > 0 and <= 66' });
  }
  if (attempts !== undefined && attempts <= 0) {
    return res.status(400).json({ error: 'attempts must be > 0' });
  }
  if (makes !== undefined && makes < 0) {
    return res.status(400).json({ error: 'makes must be >= 0' });
  }
  if (makes !== undefined && attempts !== undefined && makes > attempts) {
    return res.status(400).json({ error: 'makes must be <= attempts' });
  }

  try {
    const result = await pool.query(
      `UPDATE putts
       SET distance_feet = COALESCE($1, distance_feet),
           attempts = COALESCE($2, attempts),
           makes = COALESCE($3, makes)
       WHERE id = $4
       RETURNING *`,
      [distance_feet, attempts, makes, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Putt not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating putt:', error.message);
    res.status(500).json({ error: 'Failed to update putt' });
  }
});

// DELETE /putts/:id — delete a putt
router.delete('/putts/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM putts WHERE id = $1', [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Putt not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting putt:', error.message);
    res.status(500).json({ error: 'Failed to delete putt' });
  }
});

// ============================================================
// Import, Export, and Restore
// ============================================================

// POST /import — bulk import sessions/discs/throws from parsed spreadsheet data
router.post('/import', async (req, res) => {
  const { discs, sessions } = req.body;

  if (!discs && !sessions) {
    return res.status(400).json({ error: 'Request body must contain discs and/or sessions' });
  }

  const summary = { discs_imported: 0, sessions_imported: 0, throws_imported: 0, skipped: 0 };

  try {
    // Import discs — check if already exists by name, create if not
    const discNameToId = {};
    if (discs && Array.isArray(discs)) {
      for (const disc of discs) {
        if (!disc.name || !disc.disc_type) {
          summary.skipped++;
          continue;
        }
        // Check if disc already exists by name
        const existing = await pool.query('SELECT id FROM discs WHERE name = $1', [disc.name]);
        if (existing.rows.length > 0) {
          discNameToId[disc.name] = existing.rows[0].id;
        } else {
          const result = await pool.query(
            `INSERT INTO discs (name, disc_type, stability, brand, speed, glide, turn, fade, in_bag)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             RETURNING id`,
            [disc.name, disc.disc_type, disc.stability || 'ST', disc.brand || null, disc.speed || null, disc.glide || null, disc.turn || null, disc.fade || null, disc.in_bag !== undefined ? disc.in_bag : true]
          );
          discNameToId[disc.name] = result.rows[0].id;
          summary.discs_imported++;
        }
      }
    }

    // Import sessions and their throws
    if (sessions && Array.isArray(sessions)) {
      for (const session of sessions) {
        if (!session.location) {
          summary.skipped++;
          continue;
        }

        const sessionResult = await pool.query(
          `INSERT INTO throwing_sessions (session_date, location, conditions)
           VALUES ($1, $2, $3)
           RETURNING id`,
          [session.session_date || new Date().toISOString().split('T')[0], session.location, session.conditions || null]
        );
        summary.sessions_imported++;
        const sessionId = sessionResult.rows[0].id;

        // Import throws for this session
        if (session.throws && Array.isArray(session.throws)) {
          for (const t of session.throws) {
            if (!t.disc_name || t.distance_yards === undefined || t.distance_yards === null) {
              summary.skipped++;
              continue;
            }

            // Look up disc by name — create if not already known
            let discId = discNameToId[t.disc_name];
            if (!discId) {
              const existing = await pool.query('SELECT id FROM discs WHERE name = $1', [t.disc_name]);
              if (existing.rows.length > 0) {
                discId = existing.rows[0].id;
                discNameToId[t.disc_name] = discId;
              } else {
                const newDisc = await pool.query(
                  `INSERT INTO discs (name, disc_type, stability) VALUES ($1, $2, $3) RETURNING id`,
                  [t.disc_name, 'Driver', 'ST']
                );
                discId = newDisc.rows[0].id;
                discNameToId[t.disc_name] = discId;
                summary.discs_imported++;
              }
            }

            await pool.query(
              `INSERT INTO throws (session_id, disc_id, distance_yards, throw_number, flag)
               VALUES ($1, $2, $3, $4, $5)`,
              [sessionId, discId, t.distance_yards, t.throw_number || 1, t.flag || null]
            );
            summary.throws_imported++;
          }
        }
      }
    }

    res.status(201).json(summary);
  } catch (error) {
    console.error('Error importing data:', error.message);
    res.status(500).json({ error: 'Failed to import data' });
  }
});

// GET /export — export all data as JSON
router.get('/export', async (req, res) => {
  try {
    // Get all discs
    const discsResult = await pool.query('SELECT * FROM discs ORDER BY name');

    // Get all throwing sessions with their throws
    const sessionsResult = await pool.query('SELECT * FROM throwing_sessions ORDER BY session_date DESC');
    const throwingSessions = [];
    for (const session of sessionsResult.rows) {
      const throwsResult = await pool.query(
        `SELECT t.*, d.name as disc_name FROM throws t JOIN discs d ON t.disc_id = d.id WHERE t.session_id = $1 ORDER BY d.name, t.throw_number`,
        [session.id]
      );
      throwingSessions.push({ ...session, throws: throwsResult.rows });
    }

    // Get all putting sessions with their putts
    const puttingSessionsResult = await pool.query('SELECT * FROM putting_sessions ORDER BY session_date DESC');
    const puttingSessions = [];
    for (const session of puttingSessionsResult.rows) {
      const puttsResult = await pool.query(
        'SELECT * FROM putts WHERE putting_session_id = $1 ORDER BY distance_feet',
        [session.id]
      );
      puttingSessions.push({ ...session, putts: puttsResult.rows });
    }

    res.json({
      discs: discsResult.rows,
      throwing_sessions: throwingSessions,
      putting_sessions: puttingSessions
    });
  } catch (error) {
    console.error('Error exporting data:', error.message);
    res.status(500).json({ error: 'Failed to export data' });
  }
});

// POST /restore — restore from previously exported JSON (clears existing data)
router.post('/restore', async (req, res) => {
  const { discs, throwing_sessions, putting_sessions } = req.body;

  if (!discs && !throwing_sessions && !putting_sessions) {
    return res.status(400).json({ error: 'Request body must contain data to restore' });
  }

  const summary = { discs_restored: 0, sessions_restored: 0, throws_restored: 0, putting_sessions_restored: 0, putts_restored: 0 };

  try {
    await pool.query('BEGIN');

    // Clear all existing data (order matters due to foreign keys)
    await pool.query('DELETE FROM throws');
    await pool.query('DELETE FROM throwing_sessions');
    await pool.query('DELETE FROM putts');
    await pool.query('DELETE FROM putting_sessions');
    await pool.query('DELETE FROM discs');

    // Restore discs
    const discIdMap = {}; // old id -> new id
    if (discs && Array.isArray(discs)) {
      for (const disc of discs) {
        const result = await pool.query(
          `INSERT INTO discs (name, disc_type, stability, brand, speed, glide, turn, fade, in_bag)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           RETURNING id`,
          [disc.name, disc.disc_type, disc.stability || 'ST', disc.brand || null, disc.speed || null, disc.glide || null, disc.turn || null, disc.fade || null, disc.in_bag !== undefined ? disc.in_bag : true]
        );
        discIdMap[disc.id] = result.rows[0].id;
        summary.discs_restored++;
      }
    }

    // Restore throwing sessions and throws
    if (throwing_sessions && Array.isArray(throwing_sessions)) {
      for (const session of throwing_sessions) {
        const sessionResult = await pool.query(
          `INSERT INTO throwing_sessions (session_date, location, conditions)
           VALUES ($1, $2, $3)
           RETURNING id`,
          [session.session_date, session.location, session.conditions || null]
        );
        summary.sessions_restored++;
        const newSessionId = sessionResult.rows[0].id;

        if (session.throws && Array.isArray(session.throws)) {
          for (const t of session.throws) {
            const newDiscId = discIdMap[t.disc_id];
            if (!newDiscId) continue;
            await pool.query(
              `INSERT INTO throws (session_id, disc_id, distance_yards, throw_number, flag)
               VALUES ($1, $2, $3, $4, $5)`,
              [newSessionId, newDiscId, t.distance_yards, t.throw_number, t.flag || null]
            );
            summary.throws_restored++;
          }
        }
      }
    }

    // Restore putting sessions and putts
    if (putting_sessions && Array.isArray(putting_sessions)) {
      for (const session of putting_sessions) {
        const sessionResult = await pool.query(
          `INSERT INTO putting_sessions (session_date, location, conditions)
           VALUES ($1, $2, $3)
           RETURNING id`,
          [session.session_date, session.location || 'Backyard', session.conditions || null]
        );
        summary.putting_sessions_restored++;
        const newSessionId = sessionResult.rows[0].id;

        if (session.putts && Array.isArray(session.putts)) {
          for (const p of session.putts) {
            await pool.query(
              `INSERT INTO putts (putting_session_id, distance_feet, attempts, makes)
               VALUES ($1, $2, $3, $4)`,
              [newSessionId, p.distance_feet, p.attempts, p.makes]
            );
            summary.putts_restored++;
          }
        }
      }
    }

    await pool.query('COMMIT');
    res.json(summary);
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Error restoring data:', error.message);
    res.status(500).json({ error: 'Failed to restore data' });
  }
});

// ============================================================
// Batch Sync
// ============================================================

// POST /sync — process array of queued offline operations
router.post('/sync', async (req, res) => {
  const { operations } = req.body;

  if (!operations || !Array.isArray(operations) || operations.length === 0) {
    return res.status(400).json({ error: 'operations must be a non-empty array' });
  }

  const results = [];

  for (const op of operations) {
    const { entity_type, operation, entity_id, payload } = op;

    try {
      if (operation === 'create') {
        let result;
        switch (entity_type) {
          case 'disc':
            result = await pool.query(
              `INSERT INTO discs (name, disc_type, stability, brand, speed, glide, turn, fade, in_bag)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
               RETURNING id`,
              [payload.name, payload.disc_type, payload.stability || 'ST', payload.brand || null, payload.speed || null, payload.glide || null, payload.turn || null, payload.fade || null, payload.in_bag !== undefined ? payload.in_bag : true]
            );
            results.push({ success: true, entity_id, server_id: result.rows[0].id });
            break;
          case 'session':
            result = await pool.query(
              `INSERT INTO throwing_sessions (session_date, location, conditions)
               VALUES ($1, $2, $3)
               RETURNING id`,
              [payload.session_date || new Date().toISOString().split('T')[0], payload.location, payload.conditions || null]
            );
            results.push({ success: true, entity_id, server_id: result.rows[0].id });
            break;
          case 'throw':
            result = await pool.query(
              `INSERT INTO throws (session_id, disc_id, distance_yards, throw_number, flag)
               VALUES ($1, $2, $3, $4, $5)
               RETURNING id`,
              [payload.session_id, payload.disc_id, payload.distance_yards, payload.throw_number, payload.flag || null]
            );
            results.push({ success: true, entity_id, server_id: result.rows[0].id });
            break;
          case 'putting_session':
            result = await pool.query(
              `INSERT INTO putting_sessions (session_date, location, conditions)
               VALUES ($1, $2, $3)
               RETURNING id`,
              [payload.session_date || new Date().toISOString().split('T')[0], payload.location || 'Backyard', payload.conditions || null]
            );
            results.push({ success: true, entity_id, server_id: result.rows[0].id });
            break;
          case 'putt':
            result = await pool.query(
              `INSERT INTO putts (putting_session_id, distance_feet, attempts, makes)
               VALUES ($1, $2, $3, $4)
               RETURNING id`,
              [payload.putting_session_id, payload.distance_feet, payload.attempts, payload.makes]
            );
            results.push({ success: true, entity_id, server_id: result.rows[0].id });
            break;
          default:
            results.push({ success: false, entity_id, error: `Unknown entity_type: ${entity_type}` });
        }
      } else if (operation === 'update') {
        switch (entity_type) {
          case 'disc':
            await pool.query(
              `UPDATE discs
               SET name = COALESCE($1, name),
                   disc_type = COALESCE($2, disc_type),
                   stability = COALESCE($3, stability),
                   brand = COALESCE($4, brand),
                   speed = COALESCE($5, speed),
                   glide = COALESCE($6, glide),
                   turn = COALESCE($7, turn),
                   fade = COALESCE($8, fade),
                   in_bag = COALESCE($9, in_bag),
                   updated_at = NOW()
               WHERE id = $10`,
              [payload.name, payload.disc_type, payload.stability, payload.brand, payload.speed, payload.glide, payload.turn, payload.fade, payload.in_bag, entity_id]
            );
            results.push({ success: true, entity_id });
            break;
          case 'session':
            await pool.query(
              `UPDATE throwing_sessions
               SET session_date = COALESCE($1, session_date),
                   location = COALESCE($2, location),
                   conditions = COALESCE($3, conditions),
                   updated_at = NOW()
               WHERE id = $4`,
              [payload.session_date, payload.location, payload.conditions, entity_id]
            );
            results.push({ success: true, entity_id });
            break;
          case 'throw':
            await pool.query(
              `UPDATE throws
               SET distance_yards = COALESCE($1, distance_yards),
                   throw_number = COALESCE($2, throw_number),
                   flag = $3
               WHERE id = $4`,
              [payload.distance_yards, payload.throw_number, payload.flag !== undefined ? payload.flag : null, entity_id]
            );
            results.push({ success: true, entity_id });
            break;
          case 'putting_session':
            await pool.query(
              `UPDATE putting_sessions
               SET session_date = COALESCE($1, session_date),
                   location = COALESCE($2, location),
                   conditions = COALESCE($3, conditions),
                   updated_at = NOW()
               WHERE id = $4`,
              [payload.session_date, payload.location, payload.conditions, entity_id]
            );
            results.push({ success: true, entity_id });
            break;
          case 'putt':
            await pool.query(
              `UPDATE putts
               SET distance_feet = COALESCE($1, distance_feet),
                   attempts = COALESCE($2, attempts),
                   makes = COALESCE($3, makes)
               WHERE id = $4`,
              [payload.distance_feet, payload.attempts, payload.makes, entity_id]
            );
            results.push({ success: true, entity_id });
            break;
          default:
            results.push({ success: false, entity_id, error: `Unknown entity_type: ${entity_type}` });
        }
      } else if (operation === 'delete') {
        let tableName;
        switch (entity_type) {
          case 'disc': tableName = 'discs'; break;
          case 'session': tableName = 'throwing_sessions'; break;
          case 'throw': tableName = 'throws'; break;
          case 'putting_session': tableName = 'putting_sessions'; break;
          case 'putt': tableName = 'putts'; break;
          default:
            results.push({ success: false, entity_id, error: `Unknown entity_type: ${entity_type}` });
            continue;
        }
        await pool.query(`DELETE FROM ${tableName} WHERE id = $1`, [entity_id]);
        results.push({ success: true, entity_id });
      } else {
        results.push({ success: false, entity_id, error: `Unknown operation: ${operation}` });
      }
    } catch (error) {
      results.push({ success: false, entity_id, error: error.message });
    }
  }

  res.json(results);
});

export default router;
