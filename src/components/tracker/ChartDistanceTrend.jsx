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

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe', '#00c49f', '#ffbb28', '#ff8042', '#e91e63', '#9c27b0', '#009688', '#795548', '#607d8b', '#ff5722', '#4caf50'];

function ChartDistanceTrend({ data, discs }) {
  if (!data || data.length === 0) {
    return <p style={{ color: '#888', textAlign: 'center' }}>No throw data available for trends.</p>;
  }

  // Get unique session dates sorted
  const sessionDates = [...new Set(data.map((d) => d.session_date))].sort();

  // Only include discs that actually have throw data
  const discNames = discs && discs.length > 0
    ? discs.map((d) => d.name).filter((name) => data.some((d) => d.disc_name === name))
    : [...new Set(data.map((d) => d.disc_name))];

  if (discNames.length === 0) {
    return <p style={{ color: '#888', textAlign: 'center' }}>No throw data for this filter.</p>;
  }

  // If still too many, take top 10 by average distance
  let finalDiscNames = discNames;
  if (discNames.length > 10) {
    const avgByDisc = discNames.map((name) => {
      const discData = data.filter((d) => d.disc_name === name);
      const avg = discData.reduce((sum, d) => sum + d.average_feet, 0) / discData.length;
      return { name, avg };
    });
    avgByDisc.sort((a, b) => b.avg - a.avg);
    finalDiscNames = avgByDisc.slice(0, 10).map((d) => d.name);
  }

  const chartData = sessionDates.map((date) => {
    const entry = { date: new Date(date).toLocaleDateString() };
    for (const name of finalDiscNames) {
      const match = data.find((d) => d.session_date === date && d.disc_name === name);
      entry[name] = match ? Math.round(match.average_feet) : null;
    }
    return entry;
  });

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
        <XAxis dataKey="date" stroke="#666" fontSize={12} />
        <YAxis stroke="#666" fontSize={12} label={{ value: 'Feet', angle: -90, position: 'insideLeft', fill: '#666' }} />
        <Tooltip />
        {finalDiscNames.length <= 10 && <Legend />}
        {finalDiscNames.map((name, i) => (
          <Line
            key={name}
            type="monotone"
            dataKey={name}
            stroke={COLORS[i % COLORS.length]}
            strokeWidth={2}
            dot={{ r: 4 }}
            connectNulls
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

export default ChartDistanceTrend;
