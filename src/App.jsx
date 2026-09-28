import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Shell from './app/Shell';
import Home from './app/Home';
import { modules } from './app/catalog';

const RacePage = lazy(() => import('./modules/sorting/RacePage.jsx'));

export default function App() {
  return (
    <Routes>
      <Route element={<Shell />}>
        <Route index element={<Home />} />
        <Route path="race" element={<Lazy el={<RacePage />} />} />
        {modules.map(({ meta, Page }) => (
          <Route key={meta.id} path={`${meta.id}/:algo?`} element={<Lazy el={<Page />} />} />
        ))}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

function Lazy({ el }) {
  return <Suspense fallback={<div className="p-10 text-sm text-mist">Loading…</div>}>{el}</Suspense>;
}
