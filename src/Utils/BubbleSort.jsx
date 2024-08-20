// src/utils/bubblesort.js
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const bubbleSort = async (array, setArray,setActiveIndices,delay) => {
  const n = array.length;
  let sortedArray = [...array];

  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      if (sortedArray[j] > sortedArray[j + 1]) {
        // Swap elements
        setActiveIndices([j, j + 1]);
        [sortedArray[j], sortedArray[j + 1]] = [sortedArray[j + 1], sortedArray[j]];

        // Update the array state to visualize the swap
        setArray([...sortedArray]);

        await sleep(delay);

        setActiveIndices([]);
         // Adjust speed of visualization
      }
    }
  }

  return sortedArray;
};

export default bubbleSort;
