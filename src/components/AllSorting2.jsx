import React, { useState, useEffect, useCallback } from 'react';
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

const debounce = (func, delay) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      func.apply(null, args);
    }, delay);
  };
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

  // UseCallback to memorize the resize handler function
  const handleResize = useCallback(() => {
    const newSize = window.innerWidth < 640 ? 30 : 100;

    if (newSize !== arraySize) {
      setArraySize(newSize);
      setArray(generateRandomArray(newSize, 10, 100));
    }
  }, [arraySize]);

  useEffect(() => {
    const debouncedHandleResize = debounce(handleResize, 200); // 200ms debounce
    window.addEventListener('resize', debouncedHandleResize);
    return () => window.removeEventListener('resize', debouncedHandleResize);
  }, [handleResize]);

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
        await bubbleSort(array, setArray, setActiveIndices, setComparisons, delay);
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
    setTimeTaken(0);
    setComparisons(0);
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
    <div className="flex flex-col sm:flex-col md:flex-row items-start sm:justify-center h-screen bg-white p-2 sm:p-4">
      <ArrayVisualizer2 array={array} activeIndices={activeIndices} />
      <div className='flex flex-col gap-4 justify-center w-full md:w-auto'>
        <Details selectedAlgorithm={selectedAlgorithm} comparisons={comparisons} time={timeTaken} />
        <div className="mb-4 flex gap-4 flex-wrap justify-center w-full">
          <select
            value={selectedAlgorithm}
            onChange={(e) => setSelectedAlgorithm(e.target.value)}
            className="p-2 border border-gray-400 rounded-lg gradient outline-none gradint text-white"
            disabled={isSorting}
          >
            <option value="quicksort" className='bg-black'>Quick sort</option>
            <option value="mergesort" className='bg-black'>Merge Sort</option>
            <option value="bubblesort" className='bg-black'>Bubble Sort</option>
            <option value="pancakesort" className='bg-black'>Pancake Sort</option>
            <option value="insertionsort" className='bg-black'>Insertion Sort</option>
            <option value="radixsort" className='bg-black'>Radix Sort</option>
            <option value="heapsort" className='bg-black'>Heap Sort</option>
            <option value="pigeonholesort" className='bg-black'>Pigeonhole Sort</option>
            <option value="selectionsort" className='bg-black'>Selection Sort</option>
            <option value="cocktailsort" className='bg-black'>Cocktail Sort</option>
          </select>
          <div className='flex flex-col items-center justify-center border gradient p-1 gradint rounded-lg'>
            <label htmlFor="arraySize" className='text-white'>Array Size</label>
            <input
              type="range"
              id="arraySize"
              min={5}
              max={100}
              value={arraySize}
              onChange={handleArraySizeChange}
              className='p-2 border border-gray-400 rounded-lg bg-black'
              disabled={isSorting}
            />
            <div className='text-white'>{arraySize}</div>
          </div>
          <div className='flex flex-col items-center justify-center border gradient p-1 gradint rounded-lg'>
            <label htmlFor="delay" className='text-white'>Speed(ms)</label>
            <input
              type="range"
              id="delay"
              min={0}
              max={2000}
              step={5}
              value={delay}
              onChange={handleDelayChange}
              className='p-2 border border-gray-400 rounded-lg range-input'
              disabled={isSorting}
            />
            <div className='text-white'>{delay}</div>
          </div>
        </div>
        <Controls onSort={handleSort} onGenerate={handleGenerate} isSorting={isSorting} />
      </div>
    </div>
  );
};

export default AllSorting2;
