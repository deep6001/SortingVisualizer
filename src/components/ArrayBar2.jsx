// src/components/ArrayBar.js
import React from 'react';

const ArrayBar2 = ({ value, maxValue, isActive }) => {
  const barHeight = (value / maxValue) * 100;

  // Calculate font size based on bar width
   // Adjust multiplier (8) to control the font size scaling

  return (
    <div
      className={`w-1 bg-blue-500 border sm:w-[5%] text-white flex justify-center ${isActive ? 'bg-red-500' : 'bg-blue-500'}`}
      style={{
        height: `${barHeight}%`
      }}
    >
      {/* {value} */}
    </div>
  );
};

export default ArrayBar2;
