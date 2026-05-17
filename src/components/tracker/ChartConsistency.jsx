import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

/**
 * Bar chart ranking discs by consistency (lowest std dev = most consistent).
 * @param {{ data: Array }} props
 * data: Array of { disc_id, disc_name, stdDev, range, count }
 */
function ChartConsistency({ data }) {
  if (!data || data.length === 0) {
    return <p style={{ color: '#888', textAlign: 'center' }}>No consistency data available.</p>;
  }

  const chartData = data.map((d) => ({
    name: d.disc_name,
    'Std Dev (ft)': Math.round(d.stdDev * 10) / 10,
    'Range (ft)': Math.round(d.range),
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
        <XAxis dataKey="name" stroke="#888" fontSize={11} angle={-20} textAnchor="end" height={60} />
        <YAxis stroke="#888" fontSize={12} />
        <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #333' }} />
        <Legend />
        <Bar dataKey="Std Dev (ft)" fill="#ffc658" radius={[4, 4, 0, 0]} />
        <Bar dataKey="Range (ft)" fill="#ff7300" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export default ChartConsistency;
