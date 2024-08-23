// src/Utils/CocktailSort.js
const cocktailSort = async (array, setArray, setActiveIndices,setComparisons,delay) => {
    let swapped = true;
    let start = 0;
    let comperision=0
    let end = array.length - 1;
  
    while (swapped) {
      swapped = false;
  
      // Traverse the array from left to right
      for (let i = start; i < end; i++) {
        setActiveIndices([i, i + 1]);
        comperision++;
        setComparisons(comperision) // Highlight the indices being compared
        if (array[i] > array[i + 1]) {
          [array[i], array[i + 1]] = [array[i + 1], array[i]];
          swapped = true;
        }
        setArray([...array]); // Update the state for visualization
        await new Promise(resolve => setTimeout(resolve, delay)); // Delay for visualization
      }
  
      if (!swapped) break;
  
      swapped = false;
      end--;
  
      // Traverse the array from right to left
      for (let i = end - 1; i >= start; i--) {
        setActiveIndices([i, i + 1]);
        comperision++;
        setComparisons(comperision) // Highlight the indices being compared
        if (array[i] > array[i + 1]) {
          [array[i], array[i + 1]] = [array[i + 1], array[i]];
          swapped = true;
        }
        setArray([...array]); // Update the state for visualization
        await new Promise(resolve => setTimeout(resolve, delay)); // Delay for visualization
      }
  
      start++;
    }
  
    setActiveIndices([]); // Clear the active indices after sorting
  };
  
  export default cocktailSort;
  