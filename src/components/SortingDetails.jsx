// src/Details.js
import React from 'react';

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
    <div className="mt-4  border border-gray-300 rounded-lg  gradint text-black  shadow-md p-4">
      <h2 className="text-xl font-bold mb-2 text-white ">Sorting Algorithm Details</h2>
      <div className="mb-4">
        {/* <label htmlFor="algorithm" className="block text-white mb-2">Select Algorithm:</label>
        <select
          id="algorithm"
          value={selectedAlgorithm}
          readOnly
          className="p-2 border border-gray-400 bg-white rounded-lg"
        >
          {Object.keys(complexityData).map(algorithm => (
            <option key={algorithm} value={algorithm}>{algorithm.charAt(0).toUpperCase() + algorithm.slice(1)}</option>
          ))}
        </select> */}
      </div>
      <table className="min-w-full border border-gray-300 rounded-lg  bg-[#e0e0e0] shadow-custom p-4">
        <thead>
          <tr>
            <th className="border border-gray-300 px-4 py-2">Metric</th>
            <th className="border border-gray-300 px-4 py-2">Value</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-gray-300 px-4 py-2">Time Complexity</td>
            <td className="border border-gray-300 px-4 py-2">{complexityData[selectedAlgorithm].time}</td>
          </tr>
          <tr>
            <td className="border border-gray-300 px-4 py-2">Space Complexity</td>
            <td className="border border-gray-300 px-4 py-2">{complexityData[selectedAlgorithm].space}</td>
          </tr>
          <tr>
            <td className="border border-gray-300 px-4 py-2">Number of Comparisons</td>
            <td className="border border-gray-300 px-4 py-2">{comparisons}</td>
          </tr>
          <tr>
            <td className="border border-gray-300 px-4 py-2">Time Taken (seconds)</td>
            <td className="border border-gray-300 px-4 py-2">{time}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default Details;
