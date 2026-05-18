import React, { useState, useMemo } from 'react';
import {
  useDiscs,
  useSessions,
  usePuttingSessions,
} from '../../hooks/useTrackerApi.js';
import {
  computeAveragePerDiscPerSession,
  computeAverageByCategory,
  computeConsistency,
  computeSessionComparison,
  computeDiscRankings,
  computePuttingPercentages,
  identifySessionExtremes,
  groupByConditions,
} from '../../services/analytics.js';
import ChartDistanceTrend from '../../components/tracker/ChartDistanceTrend.jsx';
import ChartCategoryBar from '../../components/tracker/ChartCategoryBar.jsx';
import ChartConsistency from '../../components/tracker/ChartConsistency.jsx';
import ChartPuttingTrend from '../../components/tracker/ChartPuttingTrend.jsx';

const TABS = [
  'Distance Trends',
  'Category',
  'Consistency',
  'Sessions',
  'Disc Rankings',
  'Putting',
  'Conditions',
];

function Analytics() {
  const [activeTab, setActiveTab] = useState(0);
  const [allThrows, setAllThrows] = useState([]);
  const [allPutts, setAllPutts] = useState([]);
  const [loadingExtra, setLoadingExtra] = useState(true);
  const [trendFilter, setTrendFilter] = useState('all');
  const [rankingSort, setRankingSort] = useState('avg'); // 'avg' or 'max'

  const { data: discs, loading: discsLoading } = useDiscs();
  const { data: sessions, loading: sessionsLoading } = useSessions();
  const { data: puttingSessions, loading: puttingLoading } = usePuttingSessions();

  // Load all throws and putts from API
  React.useEffect(() => {
    async function loadAll() {
      try {
        const { getAllThrows, getAllPutts } = await import('../../services/trackerApi.js');
        const [throws, putts] = await Promise.all([
          getAllThrows(),
          getAllPutts(),
        ]);
        setAllThrows(throws || []);
        setAllPutts(putts || []);
      } catch (err) {
        console.error('Failed to load analytics data:', err);
      } finally {
        setLoadingExtra(false);
      }
    }
    loadAll();
  }, []);

  const loading = discsLoading || sessionsLoading || puttingLoading || loadingExtra;

  // Computed analytics
  const trendData = useMemo(() => {
    if (!allThrows.length || !discs?.length || !sessions?.length) return [];
    const perDiscSession = computeAveragePerDiscPerSession(allThrows, discs);
    // Attach session_date
    const sessionMap = new Map(sessions.map((s) => [s.id, s]));
    return perDiscSession.map((d) => ({
      ...d,
      session_date: sessionMap.get(d.session_id)?.session_date || null,
    }));
  }, [allThrows, discs, sessions]);

  const typeData = useMemo(() => {
    if (!allThrows.length || !discs?.length) return [];
    return computeAverageByCategory(allThrows, discs, 'disc_type');
  }, [allThrows, discs]);

  const stabilityData = useMemo(() => {
    if (!allThrows.length || !discs?.length) return [];
    return computeAverageByCategory(allThrows, discs, 'stability');
  }, [allThrows, discs]);

  const consistencyData = useMemo(() => {
    if (!allThrows.length || !discs?.length) return [];
    return computeConsistency(allThrows, discs);
  }, [allThrows, discs]);

  const sessionComparison = useMemo(() => {
    if (!allThrows.length || !sessions?.length) return [];
    return computeSessionComparison(sessions, allThrows);
  }, [allThrows, sessions]);

  const discRankings = useMemo(() => {
    if (!allThrows.length || !discs?.length) return [];
    return computeDiscRankings(allThrows, discs);
  }, [allThrows, discs]);

  const puttingStats = useMemo(() => {
    if (!allPutts.length) return { perSession: [], overall: { c1: 0, c2: 0 } };
    return computePuttingPercentages(allPutts);
  }, [allPutts]);

  const sessionExtremes = useMemo(() => {
    if (!allThrows.length) return [];
    return identifySessionExtremes(allThrows);
  }, [allThrows]);

  const conditionsData = useMemo(() => {
    if (!allThrows.length || !sessions?.length) return [];
    return groupByConditions(sessions, allThrows);
  }, [allThrows, sessions]);

  if (loading) {
    return <div className="tracker-loading">Loading analytics...</div>;
  }

  return (
    <div className="tracker-page">
      <h2>Analytics</h2>

      {/* Tab navigation */}
      <div className="analytics-tabs">
        {TABS.map((tab, i) => (
          <button
            key={tab}
            className={`analytics-tab ${activeTab === i ? 'active' : ''}`}
            onClick={() => setActiveTab(i)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="analytics-content">
        {activeTab === 0 && (
          <div>
            <h3>Distance Trends</h3>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
              {['all', 'Driver', 'Fairway', 'Midrange', 'Putter', 'VOS', 'OS', 'ST', 'US', 'VUS'].map((f) => (
                <button
                  key={f}
                  className={`tracker-filter-btn ${trendFilter === f ? 'active' : ''}`}
                  onClick={() => setTrendFilter(f)}
                >
                  {f === 'all' ? 'All' : f}
                </button>
              ))}
            </div>
            <ChartDistanceTrend
              data={trendData}
              discs={(discs || []).filter((d) => {
                if (trendFilter === 'all') return true;
                if (['Driver', 'Fairway', 'Midrange', 'Putter'].includes(trendFilter)) return d.disc_type === trendFilter;
                return d.stability === trendFilter;
              })}
            />
          </div>
        )}

        {activeTab === 1 && (
          <div>
            <h3>Category Averages</h3>
            <ChartCategoryBar typeData={typeData} stabilityData={stabilityData} />
          </div>
        )}

        {activeTab === 2 && (
          <div>
            <h3>Consistency Rankings</h3>
            <p style={{ color: '#888', fontSize: '14px' }}>Lower values = more consistent</p>
            <ChartConsistency data={consistencyData} />
          </div>
        )}

        {activeTab === 3 && (
          <div>
            <h3>Session Comparison</h3>
            {sessionComparison.length === 0 ? (
              <p style={{ color: '#888' }}>No session data available.</p>
            ) : (
              <div className="analytics-table-wrap">
                <table className="analytics-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Avg (ft)</th>
                      <th>Throws</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessionComparison.map((s) => (
                      <tr key={s.session_id}>
                        <td>{s.session_date ? new Date(s.session_date).toLocaleDateString() : '—'}</td>
                        <td>{Math.round(s.average_feet)}</td>
                        <td>{s.throw_count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {sessionExtremes.length > 0 && (
              <div style={{ marginTop: '16px' }}>
                <h4 style={{ color: '#ccc' }}>Session Extremes</h4>
                {sessionExtremes.map((e) => (
                  <div key={e.session_id} style={{ color: '#aaa', fontSize: '14px', marginBottom: '4px' }}>
                    Longest: {Math.round(e.longest?.distance_feet || 0)} ft | Shortest: {Math.round(e.shortest?.distance_feet || 0)} ft
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 4 && (
          <div>
            <h3>Disc Rankings</h3>
            {discRankings.length === 0 ? (
              <p style={{ color: '#888' }}>No ranking data available.</p>
            ) : (
              <div>
                <div style={{ marginBottom: '8px', fontSize: '12px', color: '#888' }}>
                  Sorted by: <strong>{rankingSort === 'avg' ? 'Average' : 'Max'}</strong>
                  {rankingSort !== 'avg' && (
                    <button onClick={() => setRankingSort('avg')} style={{ marginLeft: '8px', fontSize: '12px', color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                      Reset to Avg
                    </button>
                  )}
                </div>
                <div className="analytics-table-wrap">
                  <table className="analytics-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Disc</th>
                        <th>Type</th>
                        <th onClick={() => setRankingSort('avg')} style={{ cursor: 'pointer', color: rankingSort === 'avg' ? '#2563eb' : undefined }}>
                          Avg{rankingSort === 'avg' ? ' ▼' : ''}
                        </th>
                        <th onClick={() => setRankingSort('max')} style={{ cursor: 'pointer', color: rankingSort === 'max' ? '#2563eb' : undefined }}>
                          Max{rankingSort === 'max' ? ' ▼' : ''}
                        </th>
                        <th>N</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...discRankings]
                        .sort((a, b) => rankingSort === 'max' ? b.max_feet - a.max_feet : b.average_feet - a.average_feet)
                        .map((d, i) => (
                          <tr key={d.disc_id}>
                            <td>{i + 1}</td>
                            <td>{d.disc_name}</td>
                            <td>{d.disc_type}</td>
                            <td>{Math.round(d.average_feet)}</td>
                            <td>{Math.round(d.max_feet)}</td>
                            <td>{d.throw_count}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 5 && (
          <div>
            <h3>Putting</h3>
            <div style={{ display: 'flex', gap: '24px', marginBottom: '16px', flexWrap: 'wrap' }}>
              <div className="analytics-stat-card">
                <div className="stat-label">Overall C1%</div>
                <div className="stat-value">{Math.round(puttingStats.overall.c1)}%</div>
              </div>
              <div className="analytics-stat-card">
                <div className="stat-label">Overall C2%</div>
                <div className="stat-value">{Math.round(puttingStats.overall.c2)}%</div>
              </div>
            </div>
            <ChartPuttingTrend data={puttingStats.perSession} sessions={puttingSessions || []} />
          </div>
        )}

        {activeTab === 6 && (
          <div>
            <h3>Conditions</h3>
            {conditionsData.length === 0 ? (
              <p style={{ color: '#888' }}>No conditions data available.</p>
            ) : (
              <div className="analytics-table-wrap">
                <table className="analytics-table">
                  <thead>
                    <tr>
                      <th>Conditions</th>
                      <th>Avg (ft)</th>
                      <th>Sessions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {conditionsData.map((c) => (
                      <tr key={c.conditions}>
                        <td>{c.conditions}</td>
                        <td>{Math.round(c.average_feet)}</td>
                        <td>{c.session_count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Analytics;
