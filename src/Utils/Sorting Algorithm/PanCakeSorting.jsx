// src/Utils/PancakeSort.js
let comparisons = 0;
const flip = async (array, i, setArray, setActiveIndices,setComparisons) => {
    let start = 0;
    
    while (start < i) {
      setActiveIndices([start, i]);
      comparisons++;
      setComparisons(comparisons); // Highlight the indices being swapped
      [array[start], array[i]] = [array[i], array[start]];
      setArray([...array]); // Update the state for visualization
      await new Promise(resolve => setTimeout(resolve, 20)); // Delay for visualization
      start++;
      i--;
    }
    setActiveIndices([]); // Clear the active indices after the flip
  };
  
  const findMax = (array, n) => {
    let maxIndex = 0;
    for (let i = 1; i < n; i++) {
      if (array[i] > array[maxIndex]) {
        maxIndex = i;
      }
    }
    return maxIndex;
  };
  
  const pancakeSort = async (array, setArray, setActiveIndices,setComparisons) => {
    for (let currSize = array.length; currSize > 1; currSize--) {
      const maxIndex = findMax(array, currSize);
  
      if (maxIndex !== currSize - 1) {
        await flip(array, maxIndex, setArray, setActiveIndices,setComparisons);
        await flip(array, currSize - 1, setArray, setActiveIndices,setComparisons);
      }
    }
    setArray([...array]);
  };
  
  export default pancakeSort;
  