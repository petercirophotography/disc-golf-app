import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

/**
 * Line chart showing C1% and C2% putting percentages over time.
 * @param {{ data: Array, sessions: Array }} props
 * data: Array of { session_id, c1, c2 } (from computePuttingPercentages.perSession)
 * sessions: Array of putting sessions with id and session_date
 */
function ChartPuttingTrend({ data, sessions }) {
  if (!data || data.length === 0) {
    return <p style={{ color: '#888', textAlign: 'center' }}>No putting data available for trends.</p>;
  }

  const sessionMap = new Map((sessions || []).map((s) => [s.id, s]));

  const chartData = data.map((d) => {
    const session = sessionMap.get(d.session_id);
    return {
      date: session ? new Date(session.session_date).toLocaleDateString() : 'Unknown',
      'C1 %': Math.round(d.c1 * 10) / 10,
      'C2 %': Math.round(d.c2 * 10) / 10,
    };
  });

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
        <XAxis dataKey="date" stroke="#888" fontSize={12} />
        <YAxis stroke="#888" fontSize={12} domain={[0, 100]} label={{ value: '%', angle: -90, position: 'insideLeft', fill: '#888' }} />
        <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #333' }} />
        <Legend />
        <Line type="monotone" dataKey="C1 %" stroke="#82ca9d" strokeWidth={2} dot={{ r: 4 }} />
        <Line type="monotone" dataKey="C2 %" stroke="#8884d8" strokeWidth={2} dot={{ r: 4 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export default ChartPuttingTrend;
