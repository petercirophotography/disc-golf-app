import React, { useState } from 'react';
import { useExportData, useRestoreData } from '../../hooks/useTrackerApi.js';

function Export() {
  const [exportLoading, setExportLoading] = useState(false);
  const [restoreFile, setRestoreFile] = useState(null);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const { mutate: exportData } = useExportData();
  const { mutate: restoreData } = useRestoreData();

  const handleExport = async () => {
    setExportLoading(true);
    setMessage(null);

    try {
      const data = await exportData();
      // Trigger download
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `throw-tracker-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setMessage({ success: true, text: 'Export downloaded successfully.' });
    } catch (err) {
      setMessage({ success: false, text: `Export failed: ${err.message}` });
    } finally {
      setExportLoading(false);
    }
  };

  const handleRestoreFileChange = (e) => {
    setRestoreFile(e.target.files[0]);
    setMessage(null);
  };

  const handleRestore = async () => {
    if (!restoreFile) return;
    setRestoreLoading(true);
    setMessage(null);

    try {
      const text = await restoreFile.text();
      const data = JSON.parse(text);
      await restoreData(data);
      setMessage({ success: true, text: 'Data restored successfully.' });
      setRestoreFile(null);
    } catch (err) {
      setMessage({ success: false, text: `Restore failed: ${err.message}` });
    } finally {
      setRestoreLoading(false);
    }
  };

  return (
    <div className="tracker-page">
      <h2>Export & Restore</h2>

      {/* Export section */}
      <div style={{ marginBottom: '32px' }}>
        <h3>Export Data</h3>
        <p style={{ color: '#888', marginBottom: '12px' }}>
          Download all your throw tracker data as a JSON file for backup.
        </p>
        <button
          onClick={handleExport}
          disabled={exportLoading}
          className="tracker-btn tracker-btn-primary"
        >
          {exportLoading ? 'Exporting...' : 'Download Export'}
        </button>
      </div>

      {/* Restore section */}
      <div>
        <h3>Restore Data</h3>
        <p style={{ color: '#888', marginBottom: '12px' }}>
          Upload a previously exported JSON file to restore your data.
        </p>
        <input
          type="file"
          accept=".json"
          onChange={handleRestoreFileChange}
          className="import-file-input"
        />
        {restoreFile && (
          <button
            onClick={handleRestore}
            disabled={restoreLoading}
            className="tracker-btn tracker-btn-primary"
            style={{ marginTop: '8px' }}
          >
            {restoreLoading ? 'Restoring...' : 'Restore Data'}
          </button>
        )}
      </div>

      {/* Message */}
      {message && (
        <div
          style={{
            marginTop: '16px',
            padding: '12px',
            borderRadius: '8px',
            background: message.success ? '#1a2a1a' : '#2a1a1a',
            color: message.success ? '#82ca9d' : '#ff6b6b',
          }}
        >
          {message.text}
        </div>
      )}
    </div>
  );
}

export default Export;
