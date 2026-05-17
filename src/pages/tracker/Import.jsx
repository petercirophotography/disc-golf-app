import React, { useState } from 'react';
import { parseFile } from '../../services/importer.js';
import { useImportData } from '../../hooks/useTrackerApi.js';

function Import() {
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [parseError, setParseError] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  const { mutate: importData } = useImportData();

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setParsedData(null);
    setParseError(null);
    setImportResult(null);
  };

  const handleParse = async () => {
    if (!file) return;
    setParseError(null);
    setParsedData(null);

    try {
      const data = await parseFile(file);
      setParsedData(data);
    } catch (err) {
      setParseError(err.message);
    }
  };

  const handleImport = async () => {
    if (!parsedData) return;
    setImporting(true);

    try {
      const result = await importData(parsedData);
      setImportResult({
        success: true,
        message: `Import complete! ${parsedData.discs.length} discs, ${parsedData.sessions.length} sessions imported. ${parsedData.skipped} rows skipped.`,
      });
      setParsedData(null);
      setFile(null);
    } catch (err) {
      setImportResult({
        success: false,
        message: `Import failed: ${err.message}`,
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="tracker-page">
      <h2>Import Data</h2>
      <p style={{ color: '#888', marginBottom: '16px' }}>
        Upload an Excel (.xlsx) or CSV file to import your throw data.
      </p>

      {/* File upload */}
      <div className="import-upload-section">
        <input
          type="file"
          accept=".xlsx,.csv,.xls"
          onChange={handleFileChange}
          className="import-file-input"
        />
        {file && (
          <button
            onClick={handleParse}
            className="tracker-btn tracker-btn-primary"
            style={{ marginTop: '8px' }}
          >
            Preview Import
          </button>
        )}
      </div>

      {/* Parse error */}
      {parseError && (
        <div className="import-error" style={{ color: '#ff6b6b', marginTop: '12px', padding: '12px', background: '#2a1a1a', borderRadius: '8px' }}>
          {parseError}
        </div>
      )}

      {/* Preview */}
      {parsedData && (
        <div className="import-preview" style={{ marginTop: '16px' }}>
          <h3>Preview</h3>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '16px' }}>
            <div className="analytics-stat-card">
              <div className="stat-label">Discs</div>
              <div className="stat-value">{parsedData.discs.length}</div>
            </div>
            <div className="analytics-stat-card">
              <div className="stat-label">Sessions</div>
              <div className="stat-value">{parsedData.sessions.length}</div>
            </div>
            <div className="analytics-stat-card">
              <div className="stat-label">Throws</div>
              <div className="stat-value">
                {parsedData.sessions.reduce((sum, s) => sum + s.throws.length, 0)}
              </div>
            </div>
            <div className="analytics-stat-card">
              <div className="stat-label">Skipped Rows</div>
              <div className="stat-value">{parsedData.skipped}</div>
            </div>
          </div>

          {/* Disc preview */}
          {parsedData.discs.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ color: '#ccc' }}>Discs to Import</h4>
              <div className="analytics-table-wrap">
                <table className="analytics-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Type</th>
                      <th>Stability</th>
                      <th>Brand</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.discs.slice(0, 10).map((d, i) => (
                      <tr key={i}>
                        <td>{d.name}</td>
                        <td>{d.disc_type}</td>
                        <td>{d.stability}</td>
                        <td>{d.brand || '—'}</td>
                      </tr>
                    ))}
                    {parsedData.discs.length > 10 && (
                      <tr>
                        <td colSpan={4} style={{ textAlign: 'center', color: '#888' }}>
                          ...and {parsedData.discs.length - 10} more
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Confirm button */}
          <button
            onClick={handleImport}
            disabled={importing}
            className="tracker-btn tracker-btn-primary"
          >
            {importing ? 'Importing...' : 'Confirm Import'}
          </button>
        </div>
      )}

      {/* Import result */}
      {importResult && (
        <div
          style={{
            marginTop: '16px',
            padding: '12px',
            borderRadius: '8px',
            background: importResult.success ? '#1a2a1a' : '#2a1a1a',
            color: importResult.success ? '#82ca9d' : '#ff6b6b',
          }}
        >
          {importResult.message}
        </div>
      )}
    </div>
  );
}

export default Import;
