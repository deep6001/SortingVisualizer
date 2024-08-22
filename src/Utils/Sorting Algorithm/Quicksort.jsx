// src/Utils/Quicksort.js
const partition = async (array, low, high, setArray, setActiveIndices) => {
  const pivot = array[high];
  let i = low - 1;

  for (let j = low; j < high; j++) {
    setActiveIndices([i + 1, j]); // Highlight the indices being compared
    if (array[j] <= pivot) {
      i++;
      [array[i], array[j]] = [array[j], array[i]];
      setArray([...array]); // Update the state for visualization
      await new Promise(resolve => setTimeout(resolve, 20)); // Delay for visualization
    }
  }
  [array[i + 1], array[high]] = [array[high], array[i + 1]];
  setArray([...array]); // Final swap in the partition
  setActiveIndices([]); // Clear the active indices after partitioning
  return i + 1;
};

const quicksort = async (array, low, high, setArray, setActiveIndices) => {
  if (low < high) {
    const pi = await partition(array, low, high, setArray, setActiveIndices);

    await quicksort(array, low, pi - 1, setArray, setActiveIndices);
    await quicksort(array, pi + 1, high, setArray, setActiveIndices);
  }
};

export default quicksort;
