import * as XLSX from 'xlsx';

/**
 * Parse an Excel (.xlsx) or CSV (.csv) file and return structured data
 * for the throw tracker import endpoint.
 *
 * Sheet/tab names matching date patterns (MM-DD, M-DD, MM-D, M-D) are mapped to session dates.
 * Columns: A=Disc, B=Disc Type, C=Stability, D=In Bag, E=Brand, F=Speed, G=Glide, H=Turn, I=Fade,
 *          then 3 throw columns (J, K, L) in yards.
 *
 * @param {File} file - File object from input
 * @returns {Promise<{ discs: Array, sessions: Array, skipped: number }>}
 */
export async function parseFile(file) {
  const ext = file.name.split('.').pop().toLowerCase();
  if (ext !== 'xlsx' && ext !== 'csv' && ext !== 'xls') {
    throw new Error(`Unsupported file format: .${ext}. Please use .xlsx or .csv files.`);
  }

  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });

  const discsMap = new Map(); // name -> disc object (deduplication)
  const sessions = [];
  let skipped = 0;

  for (const sheetName of workbook.SheetNames) {
    const sessionDate = parseSheetDate(sheetName);
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    const sessionThrows = [];

    // Skip header row if present (check if first row looks like headers)
    let startRow = 0;
    if (rows.length > 0 && typeof rows[0][0] === 'string' && rows[0][0].toLowerCase().includes('disc')) {
      startRow = 1;
    }

    for (let i = startRow; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;

      const discName = row[0] != null ? String(row[0]).trim() : '';
      const discType = row[1] != null ? String(row[1]).trim() : '';

      // Skip rows with missing required fields or invalid disc_type
      const validDiscTypes = ['Driver', 'Fairway', 'Midrange', 'Putter'];
      if (!discName || !discType || !validDiscTypes.includes(discType)) {
        skipped++;
        continue;
      }

      const stability = row[2] != null ? String(row[2]).trim() : 'ST';
      const inBagRaw = row[3] != null ? String(row[3]).trim() : '';
      const inBag = inBagRaw !== '' && inBagRaw.toLowerCase() !== 'none';
      const brand = row[4] != null ? String(row[4]).trim() : null;
      const speed = parseNum(row[5]);
      const glide = parseNum(row[6]);
      const turn = parseNum(row[7]);
      const fade = parseNum(row[8]);

      // Build disc entry
      if (!discsMap.has(discName)) {
        discsMap.set(discName, {
          name: discName,
          disc_type: discType,
          stability: stability || 'ST',
          brand: brand || null,
          speed,
          glide,
          turn,
          fade,
          in_bag: inBag,
        });
      }

      // Parse throw distances (columns J, K, L = indices 9, 10, 11)
      const throws = [];
      for (let t = 0; t < 3; t++) {
        const val = parseNum(row[9 + t]);
        if (val != null && val >= 0) {
          throws.push({
            disc_name: discName,
            distance_yards: val,
            throw_number: t + 1,
          });
        }
      }

      if (throws.length > 0) {
        sessionThrows.push(...throws);
      }
    }

    if (sessionThrows.length > 0 || sessionDate) {
      sessions.push({
        session_date: sessionDate || new Date().toISOString().split('T')[0],
        location: 'Imported',
        throws: sessionThrows,
      });
    }
  }

  return {
    discs: Array.from(discsMap.values()),
    sessions,
    skipped,
  };
}

/**
 * Parse a sheet name into a date string.
 * Supports patterns: MM-DD, M-DD, MM-D, M-D, MM/DD, M/DD, etc.
 * Assumes current year if no year is provided.
 * @param {string} name
 * @returns {string|null} ISO date string or null
 */
function parseSheetDate(name) {
  if (!name) return null;

  // Try MM-DD, M-DD, MM-D, M-D patterns (with - or / separator)
  const datePattern = /^(\d{1,2})[-/](\d{1,2})(?:[-/](\d{2,4}))?$/;
  const match = name.trim().match(datePattern);

  if (match) {
    const month = parseInt(match[1], 10);
    const day = parseInt(match[2], 10);
    let year = match[3] ? parseInt(match[3], 10) : new Date().getFullYear();

    // Handle 2-digit year
    if (year < 100) {
      year += 2000;
    }

    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      return dateStr;
    }
  }

  return null;
}

/**
 * Parse a value as a number, return null if not valid.
 */
function parseNum(val) {
  if (val == null || val === '') return null;
  const num = Number(val);
  return isNaN(num) ? null : num;
}

/**
 * Parse a value as boolean.
 */
function parseBool(val) {
  if (typeof val === 'boolean') return val;
  if (typeof val === 'number') return val !== 0;
  const str = String(val).toLowerCase().trim();
  return str === 'true' || str === 'yes' || str === '1' || str === 'y';
}
