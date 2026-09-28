import meta from './meta';
import useAlgo from '../../core/useAlgo';
import QueensPage from './QueensPage';
import SudokuPage from './SudokuPage';
import MazePage from './MazePage';
import KnightPage from './KnightPage';
import SubsetPage from './SubsetPage';

const pages = {
  'n-queens': QueensPage,
  sudoku: SudokuPage,
  'rat-maze': MazePage,
  'knights-tour': KnightPage,
  'subset-sum': SubsetPage,
};

export default function BacktrackingPage() {
  const algo = useAlgo(meta);
  const View = pages[algo.id] ?? QueensPage;
  return <View key={algo.id} meta={meta} algo={algo} />;
}
