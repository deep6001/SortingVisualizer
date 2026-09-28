import meta from './meta';
import useAlgo from '../../core/useAlgo';
import LinearPage from './LinearPage';
import RingBufferPage from './RingBufferPage';
import LinkedListPage from './LinkedListPage';
import HashTablePage from './HashTablePage';

const pages = {
  stack: LinearPage,
  queue: LinearPage,
  deque: LinearPage,
  'ring-buffer': RingBufferPage,
  'linked-list': LinkedListPage,
  'hash-table': HashTablePage,
};

export default function StructuresPage() {
  const algo = useAlgo(meta);
  const Page = pages[algo.id] ?? LinearPage;
  // keyed so each structure starts with fresh state and hooks
  return <Page key={algo.id} algo={algo} />;
}
