// Each run(t) drives an array tracer (see core/arrayTracer.js). Line numbers index into `code`.

const bubble = {
  code: [
    'for i in 0 .. n-1:',
    '  swapped = false',
    '  for j in 0 .. n-i-2:',
    '    if a[j] > a[j+1]:',
    '      swap(a[j], a[j+1])',
    '      swapped = true',
    '  if not swapped: break',
    '  a[n-i-1] is now in place',
  ],
  run(t) {
    const n = t.n;
    for (let i = 0; i < n - 1; i++) {
      let swapped = false;
      for (let j = 0; j < n - i - 1; j++) {
        if (t.cmp(j, j + 1, 3) > 0) {
          t.swap(j, j + 1, 4);
          swapped = true;
        }
      }
      t.done(n - i - 1);
      t.step(7, `${t.a[n - i - 1]} has bubbled up to its final spot.`);
      if (!swapped) {
        t.step(6, 'No swaps in this pass, so the array is already sorted.');
        break;
      }
    }
  },
};

const cocktail = {
  code: [
    'lo = 0; hi = n-1; swapped = true',
    'while swapped:',
    '  swapped = false',
    '  for i in lo .. hi-1:          # forward pass',
    '    if a[i] > a[i+1]: swap; swapped = true',
    '  hi -= 1',
    '  for i in hi-1 down to lo:     # backward pass',
    '    if a[i] > a[i+1]: swap; swapped = true',
    '  lo += 1',
  ],
  run(t) {
    let lo = 0;
    let hi = t.n - 1;
    let swapped = true;
    while (swapped) {
      swapped = false;
      t.mark({ range: [lo, hi] });
      for (let i = lo; i < hi; i++) {
        if (t.cmp(i, i + 1, 4) > 0) {
          t.swap(i, i + 1, 4);
          swapped = true;
        }
      }
      t.done(hi);
      hi--;
      t.step(5, 'Forward pass done: the largest remaining value is parked on the right.');
      if (!swapped) break;
      swapped = false;
      for (let i = hi - 1; i >= lo; i--) {
        if (t.cmp(i, i + 1, 7) > 0) {
          t.swap(i, i + 1, 7);
          swapped = true;
        }
      }
      t.done(lo);
      lo++;
      t.step(8, 'Backward pass done: the smallest remaining value is parked on the left.');
    }
  },
};

const selection = {
  code: [
    'for i in 0 .. n-1:',
    '  min = i',
    '  for j in i+1 .. n-1:',
    '    if a[j] < a[min]:',
    '      min = j',
    '  swap(a[i], a[min])',
    '  a[i] is now in place',
  ],
  run(t) {
    const n = t.n;
    for (let i = 0; i < n - 1; i++) {
      let min = i;
      t.mark({ pivot: min });
      t.step(1, `Assume ${t.a[i]} at index ${i} is the smallest in the unsorted part.`);
      for (let j = i + 1; j < n; j++) {
        if (t.cmp(j, min, 3) < 0) {
          min = j;
          t.mark({ pivot: min });
          t.step(4, `${t.a[min]} is the new minimum.`);
        }
      }
      t.swap(i, min, 5, `Move the minimum ${t.a[min]} to index ${i}.`);
      t.done(i);
      t.mark({ pivot: undefined });
    }
  },
};

const insertion = {
  code: [
    'for i in 1 .. n-1:',
    '  key = a[i]; j = i - 1',
    '  while j >= 0 and a[j] > key:',
    '    a[j+1] = a[j]; j -= 1',
    '  a[j+1] = key',
  ],
  run(t) {
    const a = t.a;
    for (let i = 1; i < t.n; i++) {
      const key = a[i];
      t.mark({ pivot: i, range: [0, i] });
      t.step(1, `Take ${key} and slide it left into the sorted prefix.`);
      let j = i - 1;
      while (j >= 0 && t.cmpVal(j, key, 2, `Is ${a[j]} bigger than ${key}?`) > 0) {
        t.mark({ pivot: j });
        t.set(j + 1, a[j], 3, `Shift ${a[j]} one place right.`);
        j--;
      }
      t.set(j + 1, key, 4, `Drop ${key} into index ${j + 1}.`);
    }
  },
};

const gnome = {
  code: [
    'i = 0',
    'while i < n:',
    '  if i == 0 or a[i-1] <= a[i]:',
    '    i += 1               # step forward',
    '  else:',
    '    swap(a[i], a[i-1]); i -= 1   # step back',
  ],
  run(t) {
    let i = 0;
    while (i < t.n) {
      t.mark({ pivot: i });
      if (i === 0 || t.cmp(i - 1, i, 2) <= 0) {
        i++;
      } else {
        t.swap(i, i - 1, 5);
        i--;
      }
    }
  },
};

const shell = {
  code: [
    'gap = n / 2',
    'while gap > 0:',
    '  for i in gap .. n-1:',
    '    tmp = a[i]; j = i',
    '    while j >= gap and a[j-gap] > tmp:',
    '      a[j] = a[j-gap]; j -= gap',
    '    a[j] = tmp',
    '  gap = gap / 2',
  ],
  run(t) {
    const a = t.a;
    for (let gap = Math.floor(t.n / 2); gap > 0; gap = Math.floor(gap / 2)) {
      t.step(7, `Gap is now ${gap}: insertion sort on elements ${gap} apart.`);
      for (let i = gap; i < t.n; i++) {
        const tmp = a[i];
        t.mark({ pivot: i });
        let j = i;
        while (j >= gap && t.cmpVal(j - gap, tmp, 4) > 0) {
          t.set(j, a[j - gap], 5);
          j -= gap;
        }
        if (j !== i) t.set(j, tmp, 6);
      }
    }
  },
};

const comb = {
  code: [
    'gap = n; done = false',
    'while not done:',
    '  gap = floor(gap / 1.3)',
    '  if gap <= 1: gap = 1; done = true',
    '  for i in 0 .. n-gap-1:',
    '    if a[i] > a[i+gap]:',
    '      swap(a[i], a[i+gap]); done = false',
  ],
  run(t) {
    let gap = t.n;
    let done = false;
    while (!done) {
      gap = Math.floor(gap / 1.3);
      if (gap <= 1) {
        gap = 1;
        done = true;
      }
      t.step(2, `Comb with gap ${gap}.`);
      for (let i = 0; i + gap < t.n; i++) {
        if (t.cmp(i, i + gap, 5) > 0) {
          t.swap(i, i + gap, 6);
          done = false;
        }
      }
    }
  },
};

const oddEven = {
  code: [
    'sorted = false',
    'while not sorted:',
    '  sorted = true',
    '  for i = 1; i < n-1; i += 2:   # odd pairs',
    '    if a[i] > a[i+1]: swap; sorted = false',
    '  for i = 0; i < n-1; i += 2:   # even pairs',
    '    if a[i] > a[i+1]: swap; sorted = false',
  ],
  run(t) {
    let sorted = false;
    while (!sorted) {
      sorted = true;
      for (let i = 1; i < t.n - 1; i += 2) {
        if (t.cmp(i, i + 1, 4) > 0) {
          t.swap(i, i + 1, 4);
          sorted = false;
        }
      }
      for (let i = 0; i < t.n - 1; i += 2) {
        if (t.cmp(i, i + 1, 6) > 0) {
          t.swap(i, i + 1, 6);
          sorted = false;
        }
      }
    }
  },
};

const cycle = {
  code: [
    'for start in 0 .. n-2:',
    '  item = a[start]; pos = start',
    '  for i in start+1 .. n-1:',
    '    if a[i] < item: pos += 1',
    '  if pos == start: continue',
    '  while item == a[pos]: pos += 1',
    '  swap(item, a[pos])',
    '  while pos != start:',
    '    pos = start',
    '    for i in start+1 .. n-1: if a[i] < item: pos += 1',
    '    while item == a[pos]: pos += 1',
    '    swap(item, a[pos])',
  ],
  run(t) {
    const a = t.a;
    const n = t.n;
    const place = (item, line) => {
      const old = a[t.pos];
      t.set(t.pos, item, line, `Write ${item} into index ${t.pos}; pick up ${old}.`);
      t.done(t.pos);
      return old;
    };
    for (let start = 0; start < n - 1; start++) {
      let item = a[start];
      t.mark({ pivot: start });
      t.step(1, `Holding ${item}. Count how many values are smaller to find its home.`);
      let pos = start;
      for (let i = start + 1; i < n; i++) if (t.cmpVal(i, item, 3) < 0) pos++;
      if (pos === start) {
        t.done(start);
        t.step(4, `${item} is already home.`);
        continue;
      }
      while (item === a[pos]) pos++;
      t.pos = pos;
      item = place(item, 6);
      while (pos !== start) {
        pos = start;
        for (let i = start + 1; i < n; i++) if (t.cmpVal(i, item, 9) < 0) pos++;
        while (item === a[pos]) pos++;
        t.pos = pos;
        item = place(item, 11);
      }
    }
  },
};

const pancake = {
  code: [
    'for size in n down to 2:',
    '  m = index of max in a[0 .. size-1]',
    '  if m != size-1:',
    '    flip(a, 0 .. m)        # max to the front',
    '    flip(a, 0 .. size-1)   # max to the back',
  ],
  run(t) {
    const flip = (k, line) => {
      t.mark({ range: [0, k] });
      for (let i = 0, j = k; i < j; i++, j--) t.swap(i, j, line, `Flip the stack 0..${k}.`);
    };
    for (let size = t.n; size > 1; size--) {
      let m = 0;
      t.mark({ range: [0, size - 1], pivot: 0 });
      for (let i = 1; i < size; i++) {
        if (t.cmp(i, m, 1) > 0) {
          m = i;
          t.mark({ pivot: m });
        }
      }
      if (m !== size - 1) {
        if (m > 0) flip(m, 3);
        flip(size - 1, 4);
      }
      t.done(size - 1);
      t.mark({ pivot: undefined });
    }
  },
};

const mergeCode = [
  'mergeSort(lo, hi):',
  '  if hi <= lo: return',
  '  mid = (lo + hi) / 2',
  '  mergeSort(lo, mid); mergeSort(mid+1, hi)',
  '  buf = copy of a[lo .. hi]',
  '  i = lo; j = mid + 1',
  '  for k in lo .. hi:',
  '    if j > hi or (i <= mid and buf[i] <= buf[j]): a[k] = buf[i++]',
  '    else: a[k] = buf[j++]',
];

function mergeRange(t, lo, mid, hi, lineTake = 7, lineElse = 8) {
  const a = t.a;
  const buf = a.slice(lo, hi + 1);
  let i = lo;
  let j = mid + 1;
  t.mark({ range: [lo, hi], aux: { label: 'buffer', values: buf, hi: 0, offset: lo } });
  t.step(4, `Merge the sorted halves ${lo}..${mid} and ${mid + 1}..${hi}.`);
  for (let k = lo; k <= hi; k++) {
    const bi = buf[i - lo];
    const bj = buf[j - lo];
    if (i <= mid && j <= hi) t.countCmp();
    if (j > hi || (i <= mid && bi <= bj)) {
      t.mark({ aux: { label: 'buffer', values: buf, hi: i - lo, offset: lo } });
      t.set(k, bi, lineTake, j > hi ? `Right half is empty, take ${bi}.` : `${bi} ≤ ${bj}, take ${bi} from the left half.`);
      i++;
    } else {
      t.mark({ aux: { label: 'buffer', values: buf, hi: j - lo, offset: lo } });
      t.set(k, bj, lineElse, i > mid ? `Left half is empty, take ${bj}.` : `${bj} < ${bi}, take ${bj} from the right half.`);
      j++;
    }
  }
  t.mark({ aux: undefined });
}

const merge = {
  code: mergeCode,
  run(t) {
    const sort = (lo, hi) => {
      if (hi <= lo) return;
      const mid = Math.floor((lo + hi) / 2);
      t.mark({ range: [lo, hi] });
      t.step(2, `Split ${lo}..${hi} at ${mid}.`);
      sort(lo, mid);
      sort(mid + 1, hi);
      mergeRange(t, lo, mid, hi);
    };
    sort(0, t.n - 1);
  },
};

const quick = {
  code: [
    'quickSort(lo, hi):',
    '  if lo >= hi: return',
    '  pivot = a[hi]; i = lo',
    '  for j in lo .. hi-1:',
    '    if a[j] < pivot:',
    '      swap(a[i], a[j]); i += 1',
    '  swap(a[i], a[hi])      # pivot lands in its final place',
    '  quickSort(lo, i-1); quickSort(i+1, hi)',
  ],
  run(t) {
    const sort = (lo, hi) => {
      if (lo > hi) return;
      if (lo === hi) {
        t.done(lo);
        return;
      }
      const pivot = t.a[hi];
      let i = lo;
      t.mark({ range: [lo, hi], pivot: hi, ptr: { i } });
      t.step(2, `Pivot is ${pivot}. Everything smaller goes to its left.`);
      for (let j = lo; j < hi; j++) {
        t.mark({ ptr: { i, j } });
        if (t.cmp(j, hi, 4, `Is ${t.a[j]} smaller than pivot ${pivot}?`) < 0) {
          t.swap(i, j, 5);
          i++;
        }
      }
      t.swap(i, hi, 6, `Place pivot ${pivot} at index ${i}.`);
      t.done(i);
      t.mark({ pivot: undefined, ptr: undefined });
      t.step(7, `${pivot} is final. Recurse on both sides.`);
      sort(lo, i - 1);
      sort(i + 1, hi);
    };
    sort(0, t.n - 1);
  },
};

const heap = {
  code: [
    'for i in n/2-1 down to 0: siftDown(i, n)   # build max-heap',
    'for end in n-1 down to 1:',
    '  swap(a[0], a[end])      # move max to the back',
    '  siftDown(0, end)',
    'siftDown(i, size):',
    '  largest = i; l = 2i+1; r = 2i+2',
    '  if l < size and a[l] > a[largest]: largest = l',
    '  if r < size and a[r] > a[largest]: largest = r',
    '  if largest != i: swap(a[i], a[largest]); siftDown(largest, size)',
  ],
  run(t) {
    const sift = (i, size) => {
      for (;;) {
        let largest = i;
        const l = 2 * i + 1;
        const r = 2 * i + 2;
        t.mark({ pivot: i, range: [0, size - 1] });
        if (l < size && t.cmp(l, largest, 6) > 0) largest = l;
        if (r < size && t.cmp(r, largest, 7) > 0) largest = r;
        if (largest === i) return;
        t.swap(i, largest, 8);
        i = largest;
      }
    };
    t.step(0, 'Build a max-heap: every parent must be at least as large as its children.');
    for (let i = Math.floor(t.n / 2) - 1; i >= 0; i--) sift(i, t.n);
    for (let end = t.n - 1; end > 0; end--) {
      t.swap(0, end, 2, `The heap root ${t.a[0]} is the maximum. Move it to index ${end}.`);
      t.done(end);
      sift(0, end);
    }
    t.mark({ pivot: undefined });
  },
};

const tim = {
  code: [
    'RUN = 8',
    'for each block of RUN elements: insertionSort(block)',
    'size = RUN',
    'while size < n:',
    '  for lo in 0, 2*size, 4*size, ...:',
    '    merge(a[lo .. lo+size-1], a[lo+size .. lo+2*size-1])',
    '  size *= 2',
  ],
  run(t) {
    const RUN = 8;
    const a = t.a;
    const n = t.n;
    for (let lo = 0; lo < n; lo += RUN) {
      const hi = Math.min(lo + RUN - 1, n - 1);
      t.mark({ range: [lo, hi] });
      for (let i = lo + 1; i <= hi; i++) {
        const key = a[i];
        let j = i - 1;
        while (j >= lo && t.cmpVal(j, key, 1) > 0) {
          t.set(j + 1, a[j], 1);
          j--;
        }
        t.set(j + 1, key, 1);
      }
    }
    for (let size = RUN; size < n; size *= 2) {
      t.step(6, `Merge neighbouring runs of length ${size}.`);
      for (let lo = 0; lo < n - size; lo += 2 * size) {
        const mid = lo + size - 1;
        const hi = Math.min(lo + 2 * size - 1, n - 1);
        mergeRange(t, lo, mid, hi, 5, 5);
      }
    }
  },
};

const counting = {
  code: [
    'count = zeros(max + 1)',
    'for x in a: count[x] += 1',
    'k = 0',
    'for v in 0 .. max:',
    '  repeat count[v] times: a[k++] = v',
  ],
  run(t) {
    const a = t.a;
    const max = Math.max(...a);
    const count = new Array(max + 1).fill(0);
    t.mark({ aux: { label: 'count', values: count, hi: -1 } });
    t.step(0, `Make ${max + 1} tally slots, one per possible value.`);
    for (let i = 0; i < t.n; i++) {
      count[a[i]]++;
      t.mark({ aux: { label: 'count', values: count, hi: a[i] } });
      t.read(i, 1, `Tally ${a[i]}: seen ${count[a[i]]} time${count[a[i]] > 1 ? 's' : ''}.`);
    }
    let k = 0;
    for (let v = 0; v <= max; v++) {
      while (count[v] > 0) {
        count[v]--;
        t.mark({ aux: { label: 'count', values: count, hi: v } });
        t.set(k, v, 4);
        t.done(k);
        k++;
      }
    }
  },
};

const radix = {
  code: [
    'for exp = 1; max / exp > 0; exp *= 10:',
    '  buckets = 10 empty lists',
    '  for x in a: buckets[(x / exp) % 10].push(x)',
    '  k = 0',
    '  for b in buckets: for x in b: a[k++] = x',
  ],
  run(t) {
    const a = t.a;
    const max = Math.max(...a);
    for (let exp = 1; Math.floor(max / exp) > 0; exp *= 10) {
      const buckets = Array.from({ length: 10 }, () => []);
      const sizes = new Array(10).fill(0);
      const place = exp === 1 ? 'ones' : exp === 10 ? 'tens' : 'hundreds';
      t.mark({ aux: { label: `digit buckets (${place})`, values: sizes, hi: -1 } });
      t.step(1, `Sort by the ${place} digit.`);
      for (let i = 0; i < t.n; i++) {
        const d = Math.floor(a[i] / exp) % 10;
        buckets[d].push(a[i]);
        sizes[d]++;
        t.mark({ aux: { label: `digit buckets (${place})`, values: sizes, hi: d } });
        t.read(i, 2, `${a[i]} has ${place} digit ${d}.`);
      }
      let k = 0;
      buckets.forEach((b, d) => {
        b.forEach((x) => {
          sizes[d]--;
          t.mark({ aux: { label: `digit buckets (${place})`, values: sizes, hi: d } });
          t.set(k++, x, 4);
        });
      });
    }
  },
};

const bucket = {
  code: [
    'k = ceil(sqrt(n)); buckets = k empty lists',
    'for x in a: buckets[floor(k * x / (max+1))].push(x)',
    'write buckets back into a, in bucket order',
    'for each bucket range: insertionSort(range)',
  ],
  run(t) {
    const a = t.a;
    const n = t.n;
    const k = Math.ceil(Math.sqrt(n));
    const max = Math.max(...a);
    const buckets = Array.from({ length: k }, () => []);
    const sizes = new Array(k).fill(0);
    t.mark({ aux: { label: 'buckets', values: sizes, hi: -1 } });
    for (let i = 0; i < n; i++) {
      const b = Math.floor((k * a[i]) / (max + 1));
      buckets[b].push(a[i]);
      sizes[b]++;
      t.mark({ aux: { label: 'buckets', values: sizes, hi: b } });
      t.read(i, 1, `${a[i]} goes into bucket ${b}.`);
    }
    let idx = 0;
    const ranges = [];
    buckets.forEach((b) => {
      const start = idx;
      b.forEach((x) => t.set(idx++, x, 2));
      if (b.length) ranges.push([start, idx - 1]);
    });
    t.mark({ aux: undefined });
    ranges.forEach(([lo, hi]) => {
      t.mark({ range: [lo, hi] });
      for (let i = lo + 1; i <= hi; i++) {
        const key = a[i];
        let j = i - 1;
        while (j >= lo && t.cmpVal(j, key, 3) > 0) {
          t.set(j + 1, a[j], 3);
          j--;
        }
        t.set(j + 1, key, 3);
      }
      for (let i = lo; i <= hi; i++) t.done(i);
    });
  },
};

const bitonic = {
  code: [
    'bitonicSort(lo, n, up):',
    '  if n <= 1: return',
    '  m = n / 2',
    '  bitonicSort(lo, m, !up); bitonicSort(lo+m, n-m, up)',
    '  bitonicMerge(lo, n, up)',
    'bitonicMerge(lo, n, up):',
    '  if n <= 1: return',
    '  m = largest power of 2 below n',
    '  for i in lo .. lo+n-m-1:',
    '    if (a[i] > a[i+m]) == up: swap(a[i], a[i+m])',
    '  bitonicMerge(lo, m, up); bitonicMerge(lo+m, n-m, up)',
  ],
  run(t) {
    const pow2Below = (n) => {
      let k = 1;
      while (k < n) k <<= 1;
      return k >> 1;
    };
    const mergeB = (lo, n, up) => {
      if (n <= 1) return;
      const m = pow2Below(n);
      t.mark({ range: [lo, lo + n - 1] });
      for (let i = lo; i < lo + n - m; i++) {
        if (t.cmp(i, i + m, 9) > 0 === up) t.swap(i, i + m, 9);
      }
      mergeB(lo, m, up);
      mergeB(lo + m, n - m, up);
    };
    const sort = (lo, n, up) => {
      if (n <= 1) return;
      const m = Math.floor(n / 2);
      sort(lo, m, !up);
      sort(lo + m, n - m, up);
      t.step(4, `Merge a bitonic run of ${n} ${up ? 'ascending' : 'descending'}.`);
      mergeB(lo, n, up);
    };
    sort(0, t.n, true);
  },
};

export const sortingRunners = {
  bubble,
  cocktail,
  selection,
  insertion,
  gnome,
  shell,
  comb,
  'odd-even': oddEven,
  cycle,
  pancake,
  merge,
  quick,
  heap,
  tim,
  counting,
  radix,
  bucket,
  bitonic,
};
