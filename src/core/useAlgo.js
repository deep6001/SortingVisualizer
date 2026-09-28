import { useParams } from 'react-router-dom';

/** Resolve the active algorithm from the :algo route param, falling back to the module's first one. */
export default function useAlgo(meta) {
  const { algo } = useParams();
  return meta.algorithms.find((a) => a.id === algo) ?? meta.algorithms[0];
}
