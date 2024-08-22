import React, { useState, useEffect } from 'react';
import Controls from './Controls';
import quicksort from '../Utils/Sorting Algorithm/Quicksort';
import mergeSort from '../Utils/Sorting Algorithm/MeargeSort';
import bubbleSort from '../Utils/Sorting Algorithm/BubbleSort';
import insertionSort from '../Utils/Sorting Algorithm/InsertionSort';
import heapSort from '../Utils/Sorting Algorithm/HeapSort';
import cocktailSort from '../Utils/Sorting Algorithm/CockTailSort';
import selectionSort from '../Utils/Sorting Algorithm/Selectionsort';
import pancakeSort from '../Utils/Sorting Algorithm/PanCakeSorting';
import ArrayVisualizer2 from './ArrayVisulizer2';
import pigeonholeSort from '../Utils/Sorting Algorithm/PigonHoleSort';
import radixSort from '../Utils/Sorting Algorithm/RadixSort';
import Details from './SortingDetails'; // Import the Details component

const generateRandomArray = (size, min, max) => {
  return Array.from({ length: size }, () => Math.floor(Math.random() * (max - min + 1)) + min);
};

const AllSorting2 = () => {
  const [array, setArray] = useState([]);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState('quicksort');
  const [activeIndices, setActiveIndices] = useState([]);
  const [comparisons, setComparisons] = useState(0);
  const [timeTaken, setTimeTaken] = useState(0);
  const [isSorting, setIsSorting] = useState(false);

  const getArraySize = () => {
    return window.innerWidth < 640 ? 70 : 300;  // 30 bars for mobile, 100 for larger screens
  };

  useEffect(() => {
    setArray(generateRandomArray(getArraySize(), 10, 100));
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setArray(generateRandomArray(getArraySize(), 10, 100));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSort = async () => {
    setComparisons(0); // Reset comparisons count before sorting
    setTimeTaken(0); // Reset time before sorting
    setIsSorting(true); // Start sorting

    const startTime = Date.now();

    const timer = setInterval(() => {
      setTimeTaken(((Date.now() - startTime) / 1000).toFixed(2));
    }, 100); // Update every 100ms

    switch (selectedAlgorithm) {
      case 'quicksort':
        await quicksort(array, 0, array.length - 1, setArray, setActiveIndices, setComparisons);
        break;
      case 'mergesort':
        await mergeSort(array, setArray, setActiveIndices, setComparisons);
        break;
      case 'bubblesort':
        await bubbleSort(array, setArray, setActiveIndices, setComparisons, 20);
        break;
      case 'radixsort':
        await radixSort(array, setArray, setActiveIndices, setComparisons);
        break;
      case 'pigeonholesort':
        await pigeonholeSort(array, setArray, setActiveIndices, setComparisons);
        break;
      case 'pancakesort':
        await pancakeSort(array, setArray, setActiveIndices, setComparisons);
        break;
      case 'insertionsort':
        await insertionSort(array, setArray, setActiveIndices, setComparisons);
        break;
      case 'heapsort':
        await heapSort(array, setArray, setActiveIndices, setComparisons);
        break;
      case 'selectionsort':
        await selectionSort(array, setArray, setActiveIndices, setComparisons);
        break;
      case 'cocktailsort':
        await cocktailSort(array, setArray, setActiveIndices, setComparisons);
        break;
      default:
        break;
    }

    clearInterval(timer); // Stop the timer when sorting is done
    setIsSorting(false); // Sorting is done
  };

  const handleGenerate = () => {
    setArray(generateRandomArray(getArraySize(), 10, 100));
  };

  return (
    <div className="flex flex-col items-center sm:justify-center h-screen bg-gray-100 p-2 sm:p-4">
      <h1 className="text-2xl font-bold mb-4 text-center lg:text-4xl gradint-green bg-clip-text text-transparent p-2">
        Sorting Algorithm Visualizer
      </h1>
      <div className="mb-4">
        <select
          value={selectedAlgorithm}
          onChange={(e) => setSelectedAlgorithm(e.target.value)}
          className="p-2 border border-gray-400 rounded-lg gradint outline-none"
        >
          <option value="quicksort">Quicksort</option>
          <option value="mergesort">Merge Sort</option>
          <option value="bubblesort">Bubble Sort</option>
          <option value="pancakesort">Pancake Sort</option>
          <option value="insertionsort">Insertion Sort</option>
          <option value='radixsort'>Radix Sort</option>
          <option value="heapsort">Heap Sort</option>
          <option value="pigeonholesort">Pigeonhole Sort</option>
          <option value="selectionsort">Selection Sort</option>
          <option value="cocktailsort">Cocktail Sort</option>
        </select>
      </div>
      <ArrayVisualizer2 array={array} activeIndices={activeIndices} />
      <Details comparisons={comparisons} timeTaken={timeTaken} /> {/* Display details */}
      <Controls onSort={handleSort} onGenerate={handleGenerate} />
    </div>
  );
};

export default AllSorting2;
