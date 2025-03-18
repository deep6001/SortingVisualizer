import React from 'react';
import { Play, RefreshCw } from 'lucide-react';

const Controls = ({ onSort, onGenerate }) => {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-6">
      <button
        onClick={onSort}
        className="group relative px-6 py-3 w-48 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg 
                   shadow-lg hover:shadow-emerald-500/25 transition-all duration-200 
                   transform hover:-translate-y-0.5"
      >
        <div className="absolute inset-0 bg-white/20 rounded-lg opacity-0 
                      group-hover:opacity-100 transition-opacity duration-200" />
        <span className="flex items-center justify-center gap-2 text-white font-semibold">
          <Play className="w-5 h-5" />
          Start Sorting
        </span>
      </button>

      <button
        onClick={onGenerate}
        className="group relative px-6 py-3 w-48 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg 
                   shadow-lg hover:shadow-blue-500/25 transition-all duration-200 
                   transform hover:-translate-y-0.5"
      >
        <div className="absolute inset-0 bg-white/20 rounded-lg opacity-0 
                      group-hover:opacity-100 transition-opacity duration-200" />
        <span className="flex items-center justify-center gap-2 text-white font-semibold">
          <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
          Generate Array
        </span>
      </button>
    </div>
  );
};

export default Controls;