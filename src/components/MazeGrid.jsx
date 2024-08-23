import React, { useState, useEffect } from 'react';

const MazeGrid = ({ rows, cols, onSetPoint, onGenerateMaze }) => {
  const [grid, setGrid] = useState([]);
  const [startPoint, setStartPoint] = useState(null);
  const [endPoint, setEndPoint] = useState(null);

  useEffect(() => {
    const initialGrid = Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => 'empty')
    );
    setGrid(initialGrid);
  }, [rows, cols]);

  const handleCellClick = (row, col) => {
    if (!startPoint) {
      setStartPoint({ row, col });
      onSetPoint('start', { row, col });
    } else if (!endPoint) {
      setEndPoint({ row, col });
      onSetPoint('end', { row, col });
    }
  };

  const generateRandomMaze = (difficulty = 'easy') => {
    let wallProbability;
    switch (difficulty) {
      case 'easy':
        wallProbability = 0.3;
        break;
      case 'medium':
        wallProbability = 0.5;
        break;
      case 'hard':
        wallProbability = 0.7;
        break;
      default:
        wallProbability = 0.3;
    }

    const newGrid = grid.map(row =>
      row.map(() => (Math.random() > wallProbability ? 'empty' : 'wall'))
    );
    setGrid(newGrid);
    onGenerateMaze(newGrid);
  };

  return (
    <div className="flex flex-col items-center mt-4">
      <button
        onClick={() => generateRandomMaze()}
        className="mb-4 px-4 py-2 gradint text-white rounded hover:bg-blue-700 transition"
      >
        Generate Maze
      </button>
      <div className={`grid `} style={{ gridTemplateColumns: `repeat(${cols}, 20px)` }}>
        {grid.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <div
              key={`${rowIndex}-${colIndex}`}
              className={`w-5 h-5 border-red-800 ${cell === 'wall' ? 'bg-gray-800' : 'bg-white'} ${
                startPoint?.row === rowIndex && startPoint?.col === colIndex ? 'bg-green-500' : ''
              } ${endPoint?.row === rowIndex && endPoint?.col === colIndex ? 'bg-red-500' : ''}`}
              onClick={() => handleCellClick(rowIndex, colIndex)}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default MazeGrid;
