const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const bubbleSort = async (array, setArray, setActiveIndices, setComparisons,delay) => {
  const n = array.length;
  let sortedArray = [...array];
  let comparisons = 0;
  const startTime = Date.now();

  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      comparisons++;
      setComparisons(comparisons); // Update comparisons in real-time

      if (sortedArray[j] > sortedArray[j + 1]) {
        setActiveIndices([j, j + 1]);
        [sortedArray[j], sortedArray[j + 1]] = [sortedArray[j + 1], sortedArray[j]];
        setArray([...sortedArray]);

        await sleep(delay);
        setActiveIndices([]);
      }

      // Update the timer in real-time
      const currentTime = (Date.now() - startTime) / 1000;
      
    }
  }

  const endTime = Date.now();
  // setTimeTaken(((endTime - startTime) / 1000).toFixed(2)); // Final time in seconds
  return sortedArray;
};

export default bubbleSort;
