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
import radixSort from '../Utils/Sorting Algorithm/RadixSort';
import pigeonholeSort from '../Utils/Sorting Algorithm/PigonHoleSort';
import ArrayVisualizer2 from './ArrayVisulizer2';
import Details from './SortingDetails';

const generateRandomArray = (size, min, max) => {
  return Array.from({ length: size }, () => Math.floor(Math.random() * (max - min + 1)) + min);
};

const AllSorting2 = () => {
  const [array, setArray] = useState([]);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState('quicksort');
  const [activeIndices, setActiveIndices] = useState([]);
  const [comparisons, setComparisons] = useState(0);
  const [timeTaken, setTimeTaken] = useState(0);
  const [arraySize, setArraySize] = useState(window.innerWidth < 640 ? 30 : 100);
  const [isSorting, setIsSorting] = useState(false);
  const [delay, setDelay] = useState(100); // State for delay, default to 100ms

  useEffect(() => {
    setArray(generateRandomArray(arraySize, 10, 100));
  }, [arraySize]);

  useEffect(() => {
    const handleResize = () => {
      const newSize = window.innerWidth < 640 ? 30 : 100;
      setArraySize(newSize);
      setArray(generateRandomArray(newSize, 10, 100));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSort = async () => {
    setComparisons(0);
    setTimeTaken(0);
    setIsSorting(true);

    const startTime = Date.now();

    const timer = setInterval(() => {
      setTimeTaken(((Date.now() - startTime) / 1000).toFixed(2));
    }, 100);

    switch (selectedAlgorithm) {
      case 'quicksort':
        await quicksort(array, 0, array.length - 1, setArray, setActiveIndices, setComparisons, delay);
        break;
      case 'mergesort':
        await mergeSort(array, setArray, setActiveIndices, setComparisons, delay);
        break;
      case 'bubblesort':
        await bubbleSort(array, setArray, setActiveIndices, delay, setComparisons);
        break;
      case 'radixsort':
        await radixSort(array, setArray, setActiveIndices, setComparisons, delay);
        break;
      case 'pigeonholesort':
        await pigeonholeSort(array, setArray, setActiveIndices, setComparisons, delay);
        break;
      case 'pancakesort':
        await pancakeSort(array, setArray, setActiveIndices, setComparisons, delay);
        break;
      case 'insertionsort':
        await insertionSort(array, setArray, setActiveIndices, setComparisons, delay);
        break;
      case 'heapsort':
        await heapSort(array, setArray, setActiveIndices, setComparisons, delay);
        break;
      case 'selectionsort':
        await selectionSort(array, setArray, setActiveIndices, setComparisons, delay);
        break;
      case 'cocktailsort':
        await cocktailSort(array, setArray, setActiveIndices, setComparisons, delay);
        break;
      default:
        break;
    }

    clearInterval(timer);
    setIsSorting(false);
  };

  const handleGenerate = () => {
    setArray(generateRandomArray(arraySize, 10, 100));
  };

  const handleArraySizeChange = (e) => {
    const newSize = parseInt(e.target.value, 10);
    setArraySize(newSize);
    setArray(generateRandomArray(newSize, 10, 100));
  };

  const handleDelayChange = (e) => {
    setDelay(parseInt(e.target.value, 10));
  };

  return (
    <div className="flex flex-col items-center sm:justify-center h-screen bg-gray-100 p-2 sm:p-4">
      <h1 className="text-2xl font-bold mb-4 text-center lg:text-4xl gradient-green bg-clip-text text-transparent p-2 gradint-green">
        Sorting Algorithm Visualizer
      </h1>
      <div className="mb-4 flex gap-4">
        <select
          value={selectedAlgorithm}
          onChange={(e) => setSelectedAlgorithm(e.target.value)}
          className="p-2 border border-gray-400 rounded-lg gradient outline-none gradint"
          disabled={isSorting}
        >
          <option value="quicksort">Quicksort</option>
          <option value="mergesort">Merge Sort</option>
          <option value="bubblesort">Bubble Sort</option>
          <option value="pancakesort">Pancake Sort</option>
          <option value="insertionsort">Insertion Sort</option>
          <option value="radixsort">Radix Sort</option>
          <option value="heapsort">Heap Sort</option>
          <option value="pigeonholesort">Pigeonhole Sort</option>
          <option value="selectionsort">Selection Sort</option>
          <option value="cocktailsort">Cocktail Sort</option>
        </select>
        <div className='flex flex-col items-center justify-center border gradient p-1 gradint rounded-lg'>
          <label htmlFor="arraySize" className='text-white '>Array Size</label>
          <input
            type="range"
            id="arraySize"
            min={5}
            max={300}
            value={arraySize}
            onChange={handleArraySizeChange}
            className='p-2 border border-gray-400 rounded-lg'
            disabled={isSorting}
          />
          <div>{arraySize}</div>
        </div>
        <div className='flex flex-col items-center justify-center border gradient p-1 gradint rounded-lg'>
          <label htmlFor="delay" className='text-white '>Delay (ms)</label>
          <input
            type="range"
            id="delay"
            min={0}
            max={1000}
            step={5}
            value={delay}
            onChange={handleDelayChange}
            className='p-2 border border-gray-400 rounded-lg'
            disabled={isSorting}
          />
          <div>{delay}</div>
        </div>
      </div>
      <ArrayVisualizer2 array={array} activeIndices={activeIndices} />
      <Controls onSort={handleSort} onGenerate={handleGenerate} isSorting={isSorting} />
      <Details selectedAlgorithm={selectedAlgorithm} comparisons={comparisons} time={timeTaken} />
    </div>
  );
};

export default AllSorting2;
