// src/Utils/HeapSort.js
const heapify = async (array, n, i, setArray, setActiveIndices) => {
    let largest = i;
    const left = 2 * i + 1;
    const right = 2 * i + 2;
  
    setActiveIndices([i]); // Highlight the current index being heapified
    await new Promise(resolve => setTimeout(resolve, 20)); // Delay for visualization
  
    if (left < n && array[left] > array[largest]) {
      largest = left;
    }
  
    if (right < n && array[right] > array[largest]) {
      largest = right;
    }
  
    if (largest !== i) {
      [array[i], array[largest]] = [array[largest], array[i]];
      setArray([...array]); // Update the state for visualization
      await new Promise(resolve => setTimeout(resolve, 20)); // Delay for visualization
  
      await heapify(array, n, largest, setArray, setActiveIndices); // Recursively heapify the affected sub-tree
    }
  };
  
  const heapSort = async (array, setArray, setActiveIndices) => {
    const n = array.length;
  
    // Build a max heap
    for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
      await heapify(array, n, i, setArray, setActiveIndices);
    }
  
    // One by one extract elements from heap
    for (let i = n - 1; i > 0; i--) {
      // Move current root to end
      [array[0], array[i]] = [array[i], array[0]];
      setArray([...array]); // Update the state for visualization
      setActiveIndices([0, i]); // Highlight the root and the end index
      await new Promise(resolve => setTimeout(resolve, 20)); // Delay for visualization
  
      // Call max heapify on the reduced heap
      await heapify(array, i, 0, setArray, setActiveIndices);
    }
  
    setActiveIndices([]); // Clear active indices after sorting
  };
  
  export default heapSort;
  