// src/Utils/PigeonholeSort.js
const pigeonholeSort = async (array, setArray, setActiveIndices, setComparisons) => {
  const min = Math.min(...array);
  const max = Math.max(...array);
  const range = max - min + 1;
  const holes = new Array(range).fill(0);
  let comparisons = 0;

  // Populate the pigeonholes
  for (let i = 0; i < array.length; i++) {
      holes[array[i] - min]++;
      // Increment comparisons for each insertion into pigeonhole
      comparisons++;
      setComparisons(prev => prev + 1);
  }

  // Reconstruct the array from the pigeonholes
  let index = 0;
  for (let i = 0; i < range; i++) {
      while (holes[i] > 0) {
          array[index] = i + min;
          setArray([...array]); // Update the state for visualization
          setActiveIndices([index]); // Highlight the current index
          await new Promise(resolve => setTimeout(resolve, 20)); // Delay for visualization
          index++;
          holes[i]--;
          // Increment comparisons for each element placed in the array
          comparisons++;
          setComparisons(prev => prev + 1);
      }
  }

  setActiveIndices([]); // Clear active indices after sorting
};

export default pigeonholeSort;
