import React, { useState, useEffect, useCallback } from 'react';
import { Settings, BarChart2, Sliders } from 'lucide-react';
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
  const [delay, setDelay] = useState(100);

  useEffect(() => {
    setArray(generateRandomArray(arraySize, 10, 100));
  }, [arraySize]);

  const handleResize = useCallback(() => {
    const newSize = window.innerWidth < 640 ? 30 : 100;
    if (newSize !== arraySize) {
      setArraySize(newSize);
      setArray(generateRandomArray(newSize, 10, 100));
    }
  }, [arraySize]);

  useEffect(() => {
    const debouncedHandleResize = debounce(handleResize, 200);
    window.addEventListener('resize', debouncedHandleResize);
    return () => window.removeEventListener('resize', debouncedHandleResize);
  }, [handleResize]);

  const handleSort = async () => {
    if (isSorting) return;
    
    setComparisons(0);
    setTimeTaken(0);
    setIsSorting(true);

    const startTime = Date.now();
    const timer = setInterval(() => {
      setTimeTaken(((Date.now() - startTime) / 1000).toFixed(2));
    }, 100);

    const algorithms = {
      quicksort: () => quicksort(array, 0, array.length - 1, setArray, setActiveIndices, setComparisons, delay),
      mergesort: () => mergeSort(array, setArray, setActiveIndices, setComparisons, delay),
      bubblesort: () => bubbleSort(array, setArray, setActiveIndices, setComparisons, delay),
      radixsort: () => radixSort(array, setArray, setActiveIndices, setComparisons, delay),
      pigeonholesort: () => pigeonholeSort(array, setArray, setActiveIndices, setComparisons, delay),
      pancakesort: () => pancakeSort(array, setArray, setActiveIndices, setComparisons, delay),
      insertionsort: () => insertionSort(array, setArray, setActiveIndices, setComparisons, delay),
      heapsort: () => heapSort(array, setArray, setActiveIndices, setComparisons, delay),
      selectionsort: () => selectionSort(array, setArray, setActiveIndices, setComparisons, delay),
      cocktailsort: () => cocktailSort(array, setArray, setActiveIndices, setComparisons, delay),
    };

    await algorithms[selectedAlgorithm]();
    clearInterval(timer);
    setIsSorting(false);
  };

  const handleGenerate = () => {
    if (isSorting) return;
    setArray(generateRandomArray(arraySize, 10, 100));
    setTimeTaken(0);
    setComparisons(0);
  };

  const handleArraySizeChange = (e) => {
    if (isSorting) return;
    const newSize = parseInt(e.target.value, 10);
    setArraySize(newSize);
    setArray(generateRandomArray(newSize, 10, 100));
  };

  const handleDelayChange = (e) => {
    const newDelay = parseInt(e.target.value, 10);
    setDelay(newDelay);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Visualization Area */}
          <div className="flex-grow bg-gray-800/50 rounded-xl p-4 shadow-xl backdrop-blur-sm border border-gray-700">
            <div className="h-[400px]">
              <ArrayVisualizer2 array={array} activeIndices={activeIndices} />
            </div>
          </div>

          {/* Controls Panel */}
          <div className="lg:w-96 space-y-6">
            <Details selectedAlgorithm={selectedAlgorithm} comparisons={comparisons} time={timeTaken} />
            
            {/* Algorithm Settings */}
            <div className="bg-gray-800/50 rounded-xl p-6 shadow-xl backdrop-blur-sm border border-gray-700">
              <h3 className="text-xl font-semibold text-white flex items-center gap-2 mb-4">
                <Settings className="h-5 w-5 text-blue-400" />
                Algorithm Settings
              </h3>

              {/* Algorithm Selector */}
              <div className="mb-6">
                <label className=" text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                  <BarChart2 className="h-4 w-4 text-blue-400" />
                  Select Algorithm
                </label>
                <select
                  value={selectedAlgorithm}
                  onChange={(e) => setSelectedAlgorithm(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white 
                           focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                  disabled={isSorting}
                >
                  {[
                    ['quicksort', 'Quick Sort'],
                    ['mergesort', 'Merge Sort'],
                    ['bubblesort', 'Bubble Sort'],
                    ['pancakesort', 'Pancake Sort'],
                    ['insertionsort', 'Insertion Sort'],
                    ['radixsort', 'Radix Sort'],
                    ['heapsort', 'Heap Sort'],
                    ['pigeonholesort', 'Pigeonhole Sort'],
                    ['selectionsort', 'Selection Sort'],
                    ['cocktailsort', 'Cocktail Sort'],
                  ].map(([value, label]) => (
                    <option key={value} value={value} className="bg-gray-700">
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Array Size Control */}
              <div className="mb-6">
                <label className=" text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                  <Sliders className="h-4 w-4 text-green-400" />
                  Array Size: {arraySize}
                </label>
                <input
                  type="range"
                  min={5}
                  max={100}
                  value={arraySize}
                  onChange={handleArraySizeChange}
                  disabled={isSorting}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer
                           [&::-webkit-slider-thumb]:appearance-none
                           [&::-webkit-slider-thumb]:h-4
                           [&::-webkit-slider-thumb]:w-4
                           [&::-webkit-slider-thumb]:rounded-full
                           [&::-webkit-slider-thumb]:bg-green-500
                           [&::-webkit-slider-thumb]:cursor-pointer"
                />
              </div>

              {/* Speed Control */}
              <div className="mb-6">
                <label className=" text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                  <Settings className="h-4 w-4 text-purple-400" />
                  Animation Speed: {delay}ms
                </label>
                <input
                  type="range"
                  min={0}
                  max={2000}
                  step={5}
                  value={delay}
                  onChange={handleDelayChange}
                  disabled={isSorting}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer
                           [&::-webkit-slider-thumb]:appearance-none
                           [&::-webkit-slider-thumb]:h-4
                           [&::-webkit-slider-thumb]:w-4
                           [&::-webkit-slider-thumb]:rounded-full
                           [&::-webkit-slider-thumb]:bg-purple-500
                           [&::-webkit-slider-thumb]:cursor-pointer"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <Controls onSort={handleSort} onGenerate={handleGenerate} isSorting={isSorting} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AllSorting2;