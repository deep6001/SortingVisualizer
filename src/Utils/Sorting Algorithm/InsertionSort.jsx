// src/utils/insertionsort.js
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const insertionSort = async (array, setArray, setActiveIndices,setComparisons,delay) => {
  let sortedArray = [...array];
  let comparisons=0;
  
  for (let i = 1; i < sortedArray.length; i++) {
    let key = sortedArray[i];
    let j = i - 1;


    while (j >= 0 && sortedArray[j] > key) {

      setActiveIndices([j, j + 1]);
      comparisons++;
      setComparisons(comparisons); // Update comparisons in real-time
      sortedArray[j + 1] = sortedArray[j];
      j--;
      
      // Update the array state to visualize the sorting
      setArray([...sortedArray]);
      await sleep(delay);
      setActiveIndices([]);
       // Adjust speed of visualization
    }

    sortedArray[j + 1] = key;
    
    // Update the array state after each iteration
    setArray([...sortedArray]);
    await sleep(20);
    
  }

  return sortedArray;
};

export default insertionSort;
