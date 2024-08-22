import React from 'react';

const Details = ({ comparisons, timeTaken }) => {
  return (
    <div className="mt-4 p-2 bg-white shadow rounded-md text-black">
      <h2 className="text-xl font-bold mb-2">Sorting Details</h2>
      <p>Comparisons: {comparisons}</p>
      <p>Time Taken: {timeTaken} seconds</p>
    </div>
  );
};

export default Details;
