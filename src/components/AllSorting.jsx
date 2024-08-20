import React, { useState, useEffect } from "react";
import ArrayVisualizer from "./ArrayVisualizer";
import Controls from "./Controls";
import quicksort from "../Utils/Quicksort";
import mergeSort from "../Utils/MeargeSort";
import bubbleSort from "../Utils/BubbleSort";
import insertionSort from "../Utils/InsertionSort";
import selectionSort from "../Utils/Selectionsort";
import heapSort from "../Utils/HeapSort";
import cocktailSort from "../Utils/CockTailSort";


function AllSorting() {
  const generateRandomArray = (size, min, max) => {
    return Array.from(
      { length: size },
      () => Math.floor(Math.random() * (max - min + 1)) + min
    );
  };

  const [quickSortArray, setQuickSortArray] = useState([]);
  const [mergeSortArray, setMergeSortArray] = useState([]);
  const [bubbleSortArray, setBubbleSortArray] = useState([]);
  const [insertionSortArray, setInsertionSortArray] = useState([]);
  const [selectionSortArray, setSelectionSortArray] = useState([]);
  const [heapSortArray, setHeapSortArray] = useState([]);

  const [cocktailSortArray, setCocktailSortArray] = useState([]);

  useEffect(() => {
    setQuickSortArray(generateRandomArray(100, 1, 100));
    setMergeSortArray(generateRandomArray(100, 1, 100));
    setBubbleSortArray(generateRandomArray(100, 1, 100));
    setInsertionSortArray(generateRandomArray(100, 1, 100));
    setSelectionSortArray(generateRandomArray(100, 1, 100));
    setHeapSortArray(generateRandomArray(100, 1, 100));

    setCocktailSortArray(generateRandomArray(100, 1, 100));
  }, []);

  const handleQuickSort = async () => {
    await quicksort(
      quickSortArray,
      0,
      quickSortArray.length - 1,
      setQuickSortArray
    );
  };

  const handleMergeSort = async () => {
    await mergeSort(
      mergeSortArray,
      0,
      mergeSortArray.length,
      setMergeSortArray
    );
  };

  const handleBubbleSort = async () => {
    await bubbleSort(bubbleSortArray, setBubbleSortArray);
  };

  const handleCocktailSort = async () => {
    await cocktailSort(cocktailSortArray, setCocktailSortArray);
  };

  const handleInsertionSort = async () => {
    await insertionSort(insertionSortArray, setInsertionSortArray);
  };

  const handleSelectionSort = async () => {
    await selectionSort(selectionSortArray, setSelectionSortArray);
  };


  const handleHeapSort = async () => {
    await heapSort(heapSortArray, setHeapSortArray);
  };

  const handleGenerate = () => {
    setQuickSortArray(generateRandomArray(100, 10, 100));
    setMergeSortArray(generateRandomArray(100, 10, 100));
    setBubbleSortArray(generateRandomArray(100, 10, 100));
    setInsertionSortArray(generateRandomArray(100, 10, 100));
    setSelectionSortArray(generateRandomArray(100, 10, 100)); 
    setHeapSortArray(generateRandomArray(100, 10, 100));

    setCocktailSortArray(generateRandomArray(100, 10, 100));
  };

  return (
    <div className="flex flex-col lg:flex-row lg:justify-center flex-wrap items-center lg:items-start gap-8 justify-center min-h-screen bg-gray-100 p-4">
      <div className='flex flex-col items-center lg:items-start justify-center mb-8 w-full sm:w-auto'>
        <h1 className="text-2xl font-bold mb-4 text-black text-center">Quicksort Visualizer</h1>
        <ArrayVisualizer array={quickSortArray} />
        <Controls onSort={handleQuickSort} onGenerate={handleGenerate} />
      </div>
      <div className='flex flex-col items-center lg:items-start justify-center mb-8 w-full sm:w-auto'>
        <h1 className="text-2xl font-bold mb-4 text-black text-center">Merge Sort Visualizer</h1>
        <ArrayVisualizer array={mergeSortArray}  />
        <Controls onSort={handleMergeSort} onGenerate={handleGenerate} />
      </div>
      <div className='flex flex-col items-center lg:items-start justify-center mb-8 w-full sm:w-auto'>
        <h1 className="text-2xl font-bold mb-4 text-black text-center">Bubble Sort Visualizer</h1>
        <ArrayVisualizer array={bubbleSortArray} />
        <Controls onSort={handleBubbleSort} onGenerate={handleGenerate} />
      </div>
      <div className='flex flex-col items-center lg:items-start justify-center mb-8 w-full sm:w-auto'>
        <h1 className="text-2xl font-bold mb-4 text-black text-center">Insertion Sort Visualizer</h1>
        <ArrayVisualizer array={insertionSortArray}  />
        <Controls onSort={handleInsertionSort} onGenerate={handleGenerate} />
      </div>
      <div className='flex flex-col items-center lg:items-start justify-center mb-8 w-full sm:w-auto'>
        <h1 className="text-2xl font-bold mb-4 text-black text-center">Selection Sort Visualizer</h1>
        <ArrayVisualizer array={selectionSortArray}  />
        <Controls onSort={handleSelectionSort} onGenerate={handleGenerate} />
      </div>
      <div className='flex flex-col items-center lg:items-start justify-center mb-8 w-full sm:w-auto'>
        <h1 className="text-2xl font-bold mb-4 text-black text-center">Heap Sort Visualizer</h1>
        <ArrayVisualizer array={heapSortArray}  />
        <Controls onSort={handleHeapSort} onGenerate={handleGenerate} />
      </div>

      <div className='flex flex-col items-center lg:items-start justify-center mb-8 w-full sm:w-auto'>
        <h1 className="text-2xl font-bold mb-4 text-black text-center">Cocktail Sort Visualizer</h1>
        <ArrayVisualizer array={cocktailSortArray}  />
        <Controls onSort={handleCocktailSort} onGenerate={handleGenerate} />
      </div>
    </div>
  );
}

export default AllSorting;
