// src/components/ArrayBar.js
import React from 'react';

const ArrayBar2 = ({ value, maxValue, isActive }) => {
  const barHeight = (value / maxValue) * 100;

  return (
    <div
      className={`flex-1 rounded-t-sm transition-all duration-150 ${isActive ? "bg-red-500" : "bg-blue-500"
        }`}
      style={{ height: `${barHeight}%` }}
    />
  );
};


export default ArrayBar2;
