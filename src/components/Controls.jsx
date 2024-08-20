// src/components/Controls.js
import React from 'react';

const Controls = ({ onSort, onGenerate }) => {
  return (
    <div className="flex space-x-4 mt-6">
      <button
        onClick={onSort}
        className="px-4 py-2 gradint-green text-white rounded"
      >
        Sort
      </button>
      <button
        onClick={onGenerate}
        className="px-4 py-2 gradint text-white rounded"
      >
        Generate New Array
      </button>
    </div>
  );
};

export default Controls;
