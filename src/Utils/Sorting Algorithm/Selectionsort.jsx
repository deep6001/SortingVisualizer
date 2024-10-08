// src/components/SelectionSort.js
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const selectionSort = async (array, setArray, setActiveIndices,setComparisons,delay) => {
  let sortedArray = [...array];
  let comparisons=0;


  for (let i = 0; i < sortedArray.length - 1; i++) {
    let minIndex = i;


    for (let j = i + 1; j < sortedArray.length; j++) {
      if (sortedArray[j] < sortedArray[minIndex]) {
        setActiveIndices([i, j]);
        comparisons++;
        setComparisons(comparisons); // Update comparisons in real-time
        minIndex = j;
      }
    }

    // Swap the found minimum element with the first element
    if (minIndex !== i) {

      [sortedArray[i], sortedArray[minIndex]] = [sortedArray[minIndex], sortedArray[i]];
    }

    // Update the array state to visualize the sorting
    setArray([...sortedArray]);
    await sleep(delay);
    setActiveIndices([]); // Adjust speed of visualization
  }

  return sortedArray;
};

export default selectionSort;
