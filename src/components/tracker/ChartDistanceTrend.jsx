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

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe', '#00c49f', '#ffbb28', '#ff8042'];

function ChartDistanceTrend({ data, discs }) {
  if (!data || data.length === 0) {
    return <p style={{ color: '#888', textAlign: 'center' }}>No throw data available for trends.</p>;
  }

  // Get unique session dates sorted
  const sessionDates = [...new Set(data.map((d) => d.session_date))].sort();

  // Build disc names from filtered discs
  const discNames = discs && discs.length > 0
    ? discs.map((d) => d.name)
    : [...new Set(data.map((d) => d.disc_name))];

  // If too many discs, show a message to filter
  if (discNames.length > 10) {
    return (
      <div style={{ textAlign: 'center', color: '#888', padding: '20px' }}>
        <p>Select a filter above (Driver, Fairway, etc.) to see trends.</p>
        <p style={{ fontSize: '12px' }}>{discNames.length} discs selected — too many to chart clearly.</p>
      </div>
    );
  }

  const chartData = sessionDates.map((date) => {
    const entry = { date: new Date(date).toLocaleDateString() };
    for (const name of discNames) {
      const match = data.find((d) => d.session_date === date && d.disc_name === name);
      entry[name] = match ? Math.round(match.average_feet) : null;
    }
    return entry;
  });

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
        <XAxis dataKey="date" stroke="#888" fontSize={12} />
        <YAxis stroke="#888" fontSize={12} label={{ value: 'Feet', angle: -90, position: 'insideLeft', fill: '#888' }} />
        <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #333' }} />
        {discNames.length <= 8 && <Legend />}
        {discNames.map((name, i) => (
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
