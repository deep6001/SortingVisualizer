import { lazy } from 'react';
import { BarChart3, Binary, Blocks, Grid3x3, Network, Repeat, Route, Search, Table2 } from 'lucide-react';
import sorting from '../modules/sorting/meta';
import searching from '../modules/searching/meta';
import pathfinding from '../modules/pathfinding/meta';
import graphs from '../modules/graphs/meta';
import trees from '../modules/trees/meta';
import structures from '../modules/structures/meta';
import dp from '../modules/dp/meta';
import backtracking from '../modules/backtracking/meta';
import recursion from '../modules/recursion/meta';

/** Every module: metadata for navigation plus a lazily loaded page. Order is the sidebar order. */
export const modules = [
  { meta: sorting, icon: BarChart3, Page: lazy(() => import('../modules/sorting/Page.jsx')) },
  { meta: searching, icon: Search, Page: lazy(() => import('../modules/searching/Page.jsx')) },
  { meta: pathfinding, icon: Route, Page: lazy(() => import('../modules/pathfinding/Page.jsx')) },
  { meta: graphs, icon: Network, Page: lazy(() => import('../modules/graphs/Page.jsx')) },
  { meta: trees, icon: Binary, Page: lazy(() => import('../modules/trees/Page.jsx')) },
  { meta: structures, icon: Blocks, Page: lazy(() => import('../modules/structures/Page.jsx')) },
  { meta: dp, icon: Table2, Page: lazy(() => import('../modules/dp/Page.jsx')) },
  { meta: backtracking, icon: Grid3x3, Page: lazy(() => import('../modules/backtracking/Page.jsx')) },
  { meta: recursion, icon: Repeat, Page: lazy(() => import('../modules/recursion/Page.jsx')) },
];

export const algorithmCount = modules.reduce((n, m) => n + m.meta.algorithms.length, 0);
