import React, { useState, useEffect } from 'react';
import Controls from './Controls';
import quicksort from '../Utils/Quicksort';
import mergeSort from '../Utils/MeargeSort';
import bubbleSort from '../Utils/BubbleSort';
import insertionSort from '../Utils/InsertionSort';
import heapSort from '../Utils/HeapSort';
import cocktailSort from '../Utils/CockTailSort';
import selectionSort from '../Utils/Selectionsort';
import pancakeSort from '../Utils/PanCakeSorting';
import ArrayVisualizer2 from './ArrayVisulizer2';
import pigeonholeSort from '../Utils/PigonHoleSort';
import radixSort from '../Utils/RadixSort';

const generateRandomArray = (size, min, max) => {
  return Array.from({ length: size }, () => Math.floor(Math.random() * (max - min + 1)) + min);
};

const AllSorting2 = () => {
  const [array, setArray] = useState([]);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState('quicksort');
  const [activeIndices, setActiveIndices] = useState([]);

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
    switch (selectedAlgorithm) {
      case 'quicksort':
        await quicksort(array, 0, array.length - 1, setArray, setActiveIndices);
        break;
      case 'mergesort':
        await mergeSort(array, setArray, setActiveIndices);
        break;
      case 'bubblesort':
        await bubbleSort(array, setArray, setActiveIndices,200);
        break;
      case 'radixsort':
        await radixSort(array,setArray,setActiveIndices);
      case 'pigeonholesort':
        await pigeonholeSort(array, setArray, setActiveIndices);
        break;
      case 'pancakesort':
        await pancakeSort(array, setArray, setActiveIndices);
        break;
      case 'insertionsort':
        await insertionSort(array, setArray, setActiveIndices);
        break;
      case 'heapsort':
        await heapSort(array, setArray, setActiveIndices);
        break;
      case 'selectionsort':
        await selectionSort(array, setArray, setActiveIndices);
        break;
      case 'cocktailsort':
        await cocktailSort(array, setArray, setActiveIndices);
        break;
      default:
        break;
    }
  };

  const handleGenerate = () => {
    setArray(generateRandomArray(getArraySize(), 10, 100));
  };

  return (
    <div className="flex flex-col items-center sm:justify-center h-screen bg-gray-100 p-2 sm:p-4">
      <h1 className="text-2xl font-bold mb-4  text-center lg:text-4xl gradint-green bg-clip-text text-transparent p-2">Sorting Algorithm Visualizer</h1>
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
      <Controls onSort={handleSort} onGenerate={handleGenerate} />
    </div>
  );
};

export default AllSorting2;
