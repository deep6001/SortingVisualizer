// src/components/ArrayVisualizer.js
import React from 'react';
import ArrayBar2 from './ArrayBar2';

const ArrayVisualizer2 = ({ array, activeIndices }) => {
  const maxValue = Math.max(...array);

  return (
    <div className="flex justify-center items-end h-64 w-full ">
      {array.map((value, idx) => ( 
        <ArrayBar2
          key={idx}
          value={value}
          maxValue={maxValue}
          isActive={activeIndices.includes(idx)} // Check if the current index is active
        />
      ))}
    </div>
  );
};

export default ArrayVisualizer2;
