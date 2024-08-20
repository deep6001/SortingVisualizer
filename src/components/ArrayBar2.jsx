// src/components/ArrayBar.js
import React from 'react';

const ArrayBar2 = ({ value, maxValue, isActive }) => {
  const barHeight = (value / maxValue) * 100;

  return (
    <div
      className={`w-1 bg-blue-500 border  sm:w-[5px] ${isActive ? 'bg-red-500' : 'bg-blue-500'}`}
      style={{ height: `${barHeight}%` }}
    ></div>
  );
};

export default ArrayBar2;
