import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const VerticalGraph = ({ data }) => (
  <ResponsiveContainer width="100%" height={500}>
    <BarChart data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="name" />
      <YAxis />
      <Tooltip />
      <Bar
        dataKey="price"
        fill="#3498db" // Bar fill color
        stroke="#2c3e50" // Bar border color
        strokeWidth={1} // Bar border width
        radius={[4, 4, 0, 0]} // Optional: rounded top corners
      />
    </BarChart>
  </ResponsiveContainer>
);

export default VerticalGraph;
