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
    <div className="min-h-screen bg-neutral-950 text-neutral-200 px-4 py-10">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Sorting Visualizer</h1>
            <p className="text-sm text-neutral-400">
              Compare sorting algorithms interactively
            </p>
          </div>
        </div>

        {/* Visualizer */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-sm">
          <div className="h-72 md:h-80">
            <ArrayVisualizer2 array={array} activeIndices={activeIndices} />
          </div>
        </div>

        {/* Controls Grid */}
        <div className="grid md:grid-cols-2 gap-6">

          {/* Algorithm */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
            <label className="text-sm text-neutral-400 mb-2 block">
              Algorithm
            </label>
            <select
              value={selectedAlgorithm}
              onChange={(e) => setSelectedAlgorithm(e.target.value)}
              disabled={isSorting}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Array Size */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
            <label className="text-sm text-neutral-400 mb-2 block">
              Array Size — {arraySize}
            </label>
            <input
              type="range"
              min={5}
              max={100}
              value={arraySize}
              onChange={handleArraySizeChange}
              disabled={isSorting}
              className="w-full accent-blue-500"
            />
          </div>

          {/* Speed */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
            <label className="text-sm text-neutral-400 mb-2 block">
              Speed — {delay} ms
            </label>
            <input
              type="range"
              min={0}
              max={2000}
              step={5}
              value={delay}
              onChange={handleDelayChange}
              disabled={isSorting}
              className="w-full accent-blue-500"
            />
          </div>

          {/* Actions */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 flex items-end gap-3">
            <button
              onClick={handleSort}
              disabled={isSorting}
              className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:bg-neutral-700 
                       rounded-lg px-4 py-2 text-sm font-medium transition"
            >
              {isSorting ? "Sorting..." : "Start"}
            </button>

            <button
              onClick={handleGenerate}
              disabled={isSorting}
              className="flex-1 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700
                       rounded-lg px-4 py-2 text-sm font-medium transition"
            >
              Randomize
            </button>
          </div>

        </div>

        {/* Stats */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 flex gap-10">
          <div>
            <p className="text-xs text-neutral-400">Comparisons</p>
            <p className="text-lg font-semibold">{comparisons}</p>
          </div>

          <div>
            <p className="text-xs text-neutral-400">Time</p>
            <p className="text-lg font-semibold">{timeTaken}s</p>
          </div>

          <div>
            <p className="text-xs text-neutral-400">Algorithm</p>
            <p className="text-lg font-semibold capitalize">
              {selectedAlgorithm}
            </p>
          </div>
        </div>

      </div>
    </div>
  );

};

export default AllSorting2;