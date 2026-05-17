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
 * Bar chart showing average distance by disc_type and stability.
 * @param {{ typeData: Array, stabilityData: Array }} props
 * typeData: Array of { group, average_feet, count }
 * stabilityData: Array of { group, average_feet, count }
 */
function ChartCategoryBar({ typeData, stabilityData }) {
  if ((!typeData || typeData.length === 0) && (!stabilityData || stabilityData.length === 0)) {
    return <p style={{ color: '#888', textAlign: 'center' }}>No category data available.</p>;
  }

  const typeChartData = (typeData || []).map((d) => ({
    name: d.group,
    'Avg Distance (ft)': Math.round(d.average_feet),
    count: d.count,
  }));

  const stabilityChartData = (stabilityData || []).map((d) => ({
    name: d.group,
    'Avg Distance (ft)': Math.round(d.average_feet),
    count: d.count,
  }));

  return (
    <div>
      {typeChartData.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <h4 style={{ color: '#ccc', marginBottom: '8px' }}>By Disc Type</h4>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={typeChartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="name" stroke="#888" fontSize={12} />
              <YAxis stroke="#888" fontSize={12} />
              <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #333' }} />
              <Bar dataKey="Avg Distance (ft)" fill="#8884d8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      {stabilityChartData.length > 0 && (
        <div>
          <h4 style={{ color: '#ccc', marginBottom: '8px' }}>By Stability</h4>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={stabilityChartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="name" stroke="#888" fontSize={12} />
              <YAxis stroke="#888" fontSize={12} />
              <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #333' }} />
              <Bar dataKey="Avg Distance (ft)" fill="#82ca9d" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export default ChartCategoryBar;
