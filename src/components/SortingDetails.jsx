import React from 'react';
import { Clock, Box, Cpu, HardDrive } from 'lucide-react';

const complexityData = {
  quicksort: {
    time: "O(n log n) on average, O(n^2) in the worst case",
    space: "O(log n)"
  },
  mergesort: {
    time: "O(n log n)",
    space: "O(n)"
  },
  bubblesort: {
    time: "O(n^2)",
    space: "O(1)"
  },
  radixsort: {
    time: "O(nk) where k is the number of digits",
    space: "O(n + k)"
  },
  pigeonholesort: {
    time: "O(n + range)",
    space: "O(range)"
  },
  pancakesort: {
    time: "O(n^2)",
    space: "O(1)"
  },
  insertionsort: {
    time: "O(n^2)",
    space: "O(1)"
  },
  heapsort: {
    time: "O(n log n)",
    space: "O(1)"
  },
  selectionsort: {
    time: "O(n^2)",
    space: "O(1)"
  },
  cocktailsort: {
    time: "O(n^2)",
    space: "O(1)"
  }
};

const Details = ({ selectedAlgorithm, comparisons, time }) => {
  return (
    <div className="mt-6 p-6 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-xl">
      <h2 className="text-2xl font-bold mb-6 text-white flex items-center gap-2">
        <Cpu className="h-6 w-6 text-blue-400" />
        Algorithm Analysis
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Time Complexity Card */}
        <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4 border border-white/20">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-5 w-5 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">Time Complexity</h3>
          </div>
          <p className="text-blue-200 font-mono">{complexityData[selectedAlgorithm].time}</p>
        </div>

        {/* Space Complexity Card */}
        <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4 border border-white/20">
          <div className="flex items-center gap-2 mb-2">
            <HardDrive className="h-5 w-5 text-green-400" />
            <h3 className="text-lg font-semibold text-white">Space Complexity</h3>
          </div>
          <p className="text-green-200 font-mono">{complexityData[selectedAlgorithm].space}</p>
        </div>

        {/* Performance Metrics */}
        <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4 border border-white/20">
          <div className="flex items-center gap-2 mb-2">
            <Box className="h-5 w-5 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">Comparisons Made</h3>
          </div>
          <p className="text-purple-200 font-mono">
            {comparisons.toLocaleString()}
          </p>
        </div>

        {/* Execution Time Card */}
        <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4 border border-white/20">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-5 w-5 text-orange-400" />
            <h3 className="text-lg font-semibold text-white">Execution Time</h3>
          </div>
          <p className="text-orange-200 font-mono">
            {time} seconds
          </p>
        </div>
      </div>

      {/* Algorithm Name */}
      <div className="mt-6 text-center">
        <span className="px-4 py-2 bg-blue-500/20 rounded-full text-blue-300 font-semibold">
          {selectedAlgorithm.charAt(0).toUpperCase() + selectedAlgorithm.slice(1)}
        </span>
      </div>
    </div>
  );
};

export default Details;