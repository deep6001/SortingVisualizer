import meta from './meta';
import useAlgo from '../../core/useAlgo';
import HanoiPage from './HanoiPage';
import CallTreePage from './CallTreePage';
import FactorialPage from './FactorialPage';
import FloodFillPage from './FloodFillPage';

const pages = {
  hanoi: HanoiPage,
  fibonacci: CallTreePage,
  permutations: CallTreePage,
  subsets: CallTreePage,
  'merge-tree': CallTreePage,
  factorial: FactorialPage,
  'flood-fill': FloodFillPage,
};

export default function RecursionPage() {
  const algo = useAlgo(meta);
  const Page = pages[algo.id] ?? HanoiPage;
  // keyed so each entry starts with fresh state and hooks
  return <Page key={algo.id} algo={algo} />;
}
