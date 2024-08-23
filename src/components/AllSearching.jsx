import React, { useState } from 'react';
import MazeGrid from './MazeGrid'; // Ensure the path to MazeGrid is correct

function AllSearching() {
  const [startPoint, setStartPoint] = useState(null);
  const [endPoint, setEndPoint] = useState(null);
  const [maze, setMaze] = useState([]);

  const handleSetPoint = (type, point) => {
    if (type === 'start') {
      setStartPoint(point);
    } else if (type === 'end') {
      setEndPoint(point);
    }
  };

  const handleGenerateMaze = (newMaze) => {
    setMaze(newMaze);
  };

  return (
    <div className='h-screen bg-gray-200 flex flex-col items-center'>
      <h1 className='text-3xl font-bold my-4 gradint-green bg-clip-text text-transparent'>Maze Searching Algorithm Visualizer</h1>
      <MazeGrid
        rows={20}
        cols={20}
        onSetPoint={handleSetPoint}
        onGenerateMaze={handleGenerateMaze}
      />
      {/* <div className='mt-4'>
        <button 
          onClick={() => handleGenerateMaze()} 
          className='px-4 py-2 gradint text-white rounded hover:bg-blue-700 transition'>
          Generate New Maze
        </button>
      </div> */}
    </div>
  );
}

export default AllSearching;
