// src/components/ArrayVisualizer.js
import React from 'react';
import ArrayBar2 from './ArrayBar2';

const ArrayVisualizer2 = ({ array, activeIndices }) => {
  const maxValue = Math.max(...array);

  return (
    <div className="flex items-end justify-center h-full w-full gap-[2px]">
      {array.map((value, idx) => (
        <ArrayBar2
          key={idx}
          value={value}
          maxValue={maxValue}
          isActive={activeIndices.includes(idx)}
        />
      ))}
    </div>
  );
};


export default ArrayVisualizer2;
