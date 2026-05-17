import { Router, Request, Response } from 'express';
import { pool } from '../db/connection';

const router = Router();

// GET /discs
router.get('/discs', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT * FROM discs ORDER BY
        CASE stability WHEN 'VOS' THEN 1 WHEN 'OS' THEN 2 WHEN 'ST' THEN 3 WHEN 'US' THEN 4 WHEN 'VUS' THEN 5 END,
        CASE disc_type WHEN 'Putter' THEN 1 ELSE 0 END,
        speed DESC NULLS LAST, name
    `);
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve discs' });
  }
});

// POST /discs
router.post('/discs', async (req: Request, res: Response) => {
  const { name, disc_type, stability, brand, speed, glide, turn, fade, in_bag } = req.body;
  if (!name || !disc_type) return res.status(400).json({ error: 'name and disc_type are required' });
  try {
    const result = await pool.query(
      `INSERT INTO discs (name, disc_type, stability, brand, speed, glide, turn, fade, in_bag) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [name, disc_type, stability || 'ST', brand || null, speed || null, glide || null, turn || null, fade || null, in_bag !== undefined ? in_bag : true]
    );
    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create disc' });
  }
});

// PUT /discs/:id
router.put('/discs/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, disc_type, stability, brand, speed, glide, turn, fade, in_bag } = req.body;
  try {
    const result = await pool.query(
      `UPDATE discs SET name=COALESCE($1,name), disc_type=COALESCE($2,disc_type), stability=COALESCE($3,stability), brand=COALESCE($4,brand), speed=COALESCE($5,speed), glide=COALESCE($6,glide), turn=COALESCE($7,turn), fade=COALESCE($8,fade), in_bag=COALESCE($9,in_bag), updated_at=NOW() WHERE id=$10 RETURNING *`,
      [name, disc_type, stability, brand, speed, glide, turn, fade, in_bag, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Disc not found' });
    res.json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update disc' });
  }
});

// DELETE /discs/:id
router.delete('/discs/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM discs WHERE id = $1', [id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Disc not found' });
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete disc' });
  }
});

// GET /sessions
router.get('/sessions', async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM throwing_sessions ORDER BY session_date DESC');
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve sessions' });
  }
});

// POST /sessions
router.post('/sessions', async (req: Request, res: Response) => {
  const { session_date, location, conditions } = req.body;
  if (!location) return res.status(400).json({ error: 'location is required' });
  try {
    const result = await pool.query(
      `INSERT INTO throwing_sessions (session_date, location, conditions) VALUES ($1,$2,$3) RETURNING *`,
      [session_date || new Date().toISOString().split('T')[0], location, conditions || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create session' });
  }
});

// PUT /sessions/:id
router.put('/sessions/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { session_date, location, conditions } = req.body;
  try {
    const result = await pool.query(
      `UPDATE throwing_sessions SET session_date=COALESCE($1,session_date), location=COALESCE($2,location), conditions=COALESCE($3,conditions), updated_at=NOW() WHERE id=$4 RETURNING *`,
      [session_date, location, conditions, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Session not found' });
    res.json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update session' });
  }
});

// DELETE /sessions/:id
router.delete('/sessions/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM throwing_sessions WHERE id = $1', [id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Session not found' });
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete session' });
  }
});

// GET /throws (all - for analytics)
router.get('/throws', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`SELECT t.*, d.name as disc_name, d.disc_type, d.stability FROM throws t JOIN discs d ON t.disc_id = d.id ORDER BY t.session_id, d.name, t.throw_number`);
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve throws' });
  }
});

// GET /sessions/:id/throws
router.get('/sessions/:id/throws', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const result = await pool.query(`SELECT t.*, d.name as disc_name, d.disc_type, d.stability FROM throws t JOIN discs d ON t.disc_id = d.id WHERE t.session_id = $1 ORDER BY d.name, t.throw_number`, [id]);
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve throws' });
  }
});

// POST /sessions/:id/throws
router.post('/sessions/:id/throws', async (req: Request, res: Response) => {
  const { id } = req.params;
  const throws = req.body;
  if (!Array.isArray(throws) || throws.length === 0) return res.status(400).json({ error: 'Array of throws required' });
  try {
    const inserted = [];
    for (const t of throws) {
      const result = await pool.query(
        `INSERT INTO throws (session_id, disc_id, distance_yards, throw_number, flag) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
        [id, t.disc_id, t.distance_yards, t.throw_number, t.flag || null]
      );
      inserted.push(result.rows[0]);
    }
    res.status(201).json(inserted);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create throws' });
  }
});

// PUT /throws/:id
router.put('/throws/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { distance_yards, throw_number, flag } = req.body;
  try {
    const result = await pool.query(
      `UPDATE throws SET distance_yards=COALESCE($1,distance_yards), throw_number=COALESCE($2,throw_number), flag=$3 WHERE id=$4 RETURNING *`,
      [distance_yards, throw_number, flag !== undefined ? flag : null, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Throw not found' });
    res.json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update throw' });
  }
});

// DELETE /throws/:id
router.delete('/throws/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM throws WHERE id = $1', [id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Throw not found' });
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete throw' });
  }
});

// GET /putting-sessions
router.get('/putting-sessions', async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM putting_sessions ORDER BY session_date DESC');
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve putting sessions' });
  }
});

// POST /putting-sessions
router.post('/putting-sessions', async (req: Request, res: Response) => {
  const { session_date, location, conditions } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO putting_sessions (session_date, location, conditions) VALUES ($1,$2,$3) RETURNING *`,
      [session_date || new Date().toISOString().split('T')[0], location || 'Backyard', conditions || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create putting session' });
  }
});

// DELETE /putting-sessions/:id
router.delete('/putting-sessions/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM putting_sessions WHERE id = $1', [id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Putting session not found' });
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete putting session' });
  }
});

// GET /putts (all - for analytics)
router.get('/putts', async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM putts ORDER BY putting_session_id, distance_feet');
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve putts' });
  }
});

// GET /putting-sessions/:id/putts
router.get('/putting-sessions/:id/putts', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM putts WHERE putting_session_id = $1 ORDER BY distance_feet', [id]);
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve putts' });
  }
});

// POST /putting-sessions/:id/putts
router.post('/putting-sessions/:id/putts', async (req: Request, res: Response) => {
  const { id } = req.params;
  const putts = req.body;
  if (!Array.isArray(putts) || putts.length === 0) return res.status(400).json({ error: 'Array of putts required' });
  try {
    const inserted = [];
    for (const p of putts) {
      const result = await pool.query(
        `INSERT INTO putts (putting_session_id, distance_feet, attempts, makes, disc_id) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
        [id, p.distance_feet, p.attempts, p.makes, p.disc_id || null]
      );
      inserted.push(result.rows[0]);
    }
    res.status(201).json(inserted);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create putts' });
  }
});

// DELETE /putts/:id
router.delete('/putts/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM putts WHERE id = $1', [id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Putt not found' });
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete putt' });
  }
});

// GET /export
router.get('/export', async (req: Request, res: Response) => {
  try {
    const discs = await pool.query('SELECT * FROM discs ORDER BY name');
    const sessions = await pool.query('SELECT * FROM throwing_sessions ORDER BY session_date DESC');
    const throws = await pool.query('SELECT * FROM throws ORDER BY session_id');
    const puttingSessions = await pool.query('SELECT * FROM putting_sessions ORDER BY session_date DESC');
    const putts = await pool.query('SELECT * FROM putts ORDER BY putting_session_id');
    res.json({ discs: discs.rows, throwing_sessions: sessions.rows, throws: throws.rows, putting_sessions: puttingSessions.rows, putts: putts.rows });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to export data' });
  }
});

export default router;
