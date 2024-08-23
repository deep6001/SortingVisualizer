// src/Utils/MergeSort.js

const merge = async (array, left, mid, right, setArray, setActiveIndices, setComparisons, delay) => {
  const n1 = mid - left + 1;
  const n2 = right - mid;

  let leftArray = new Array(n1);
  let rightArray = new Array(n2);

  for (let i = 0; i < n1; i++) leftArray[i] = array[left + i];
  for (let j = 0; j < n2; j++) rightArray[j] = array[mid + 1 + j];

  let i = 0, j = 0, k = left;

  while (i < n1 && j < n2) {
    setActiveIndices([k]); // Highlight the current index being merged

    setComparisons((prev) => prev + 1); // Update the state with the new comparison count

    if (leftArray[i] <= rightArray[j]) {
      array[k] = leftArray[i];
      i++;
    } else {
      array[k] = rightArray[j];
      j++;
    }
    setArray([...array]); // Update the state for visualization
    await new Promise((resolve) => setTimeout(resolve, delay)); // Dynamic delay for visualization

    k++;
  }

  while (i < n1) {
    setActiveIndices([k]); // Highlight the current index being merged
    array[k] = leftArray[i];
    i++;
    k++;
    setArray([...array]); // Update the state for visualization
    await new Promise((resolve) => setTimeout(resolve, delay)); // Dynamic delay for visualization
  }

  while (j < n2) {
    setActiveIndices([k]); // Highlight the current index being merged
    array[k] = rightArray[j];
    j++;
    k++;
    setArray([...array]); // Update the state for visualization
    await new Promise((resolve) => setTimeout(resolve, delay)); // Dynamic delay for visualization
  }

  setActiveIndices([]); // Clear the active indices after merging
};

const mergeSortHelper = async (array, left, right, setArray, setActiveIndices, setComparisons, delay) => {
  if (left < right) {
    const mid = Math.floor((left + right) / 2);

    await mergeSortHelper(array, left, mid, setArray, setActiveIndices, setComparisons, delay);
    await mergeSortHelper(array, mid + 1, right, setArray, setActiveIndices, setComparisons, delay);
    await merge(array, left, mid, right, setArray, setActiveIndices, setComparisons, delay);
  }
};

const mergeSort = async (array, setArray, setActiveIndices, setComparisons, delay) => {
  await mergeSortHelper(array, 0, array.length - 1, setArray, setActiveIndices, setComparisons, delay);
};

export default mergeSort;
