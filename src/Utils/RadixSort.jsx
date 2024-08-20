// src/Utils/RadixSort.js
const getMax = (array) => {
    return Math.max(...array);
  };
  
  const countingSortForRadix = async (array, exp, setArray, setActiveIndices) => {
    let output = new Array(array.length).fill(0);
    let count = new Array(10).fill(0);
  
    // Store count of occurrences in count[]
    for (let i = 0; i < array.length; i++) {
      let index = Math.floor(array[i] / exp) % 10;
      count[index]++;
    }
  
    // Change count[i] so that count[i] now contains the actual
    // position of this digit in output[]
    for (let i = 1; i < 10; i++) {
      count[i] += count[i - 1];
    }
  
    // Build the output array
    for (let i = array.length - 1; i >= 0; i--) {
      let index = Math.floor(array[i] / exp) % 10;
      output[count[index] - 1] = array[i];
      count[index]--;
    }
  
    // Copy the output array to array[], so that array now
    // contains sorted numbers according to current digit
    for (let i = 0; i < array.length; i++) {
      array[i] = output[i];
      setActiveIndices([i]); // Highlight the current index
      setArray([...array]);
      await new Promise((resolve) => setTimeout(resolve, 20)); // Animation delay
      setActiveIndices([]);
    }
  };
  
  const radixSort = async (array, setArray, setActiveIndices) => {
    let max = getMax(array);
  
    for (let exp = 1; Math.floor(max / exp) > 0; exp *= 10) {
      await countingSortForRadix(array, exp, setArray, setActiveIndices);
    }
  };
  
  export default radixSort;
  