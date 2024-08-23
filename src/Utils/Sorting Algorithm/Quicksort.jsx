// src/Utils/Quicksort.js
const partition = async (array, low, high, setArray, setActiveIndices, setComparisons,delay) => {
  const pivot = array[high];
  let comparisons = 0;
  let i = low - 1;

  for (let j = low; j < high; j++) {
    setActiveIndices([i + 1, j]); // Highlight the indices being compared
    comparisons++; // Increment comparisons for each comparison operation
    setComparisons(prev => prev + 1); // Update the state with the new comparison count
    if (array[j] <= pivot) {
      i++;
      [array[i], array[j]] = [array[j], array[i]];
      setArray([...array]); // Update the state for visualization
      await new Promise(resolve => setTimeout(resolve, delay)); // Delay for visualization
    }
  }
  [array[i + 1], array[high]] = [array[high], array[i + 1]];
  setArray([...array]); // Final swap in the partition
  setActiveIndices([]); // Clear the active indices after partitioning
  return i + 1;
};

const quicksort = async (array, low, high, setArray, setActiveIndices, setComparisons,delay) => {
  if (low < high) {
    const pi = await partition(array, low, high, setArray, setActiveIndices, setComparisons,delay);
    await quicksort(array, low, pi - 1, setArray, setActiveIndices, setComparisons,delay);
    await quicksort(array, pi + 1, high, setArray, setActiveIndices, setComparisons,delay);
  }
};

export default quicksort;
