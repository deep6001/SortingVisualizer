import { useState } from 'react';
import { Plus, RotateCcw, Search, Trash2 } from 'lucide-react';
import meta from './meta';
import useOps from './useOps';
import { HT_MAX_KEYS, MAX_LOAD, buildTable, htCode, htOps, introStep, parseKey } from './hashTable';
import HashTable2D from './HashTable2D';
import { OpsLog, ValueField } from './ui';
import { roleColor } from './colors';
import VisualizerLayout from '../../core/ui/VisualizerLayout';
import { Button } from '../../core/ui/controls';
import { palette } from '../../core/theme';

const SEED = ['cat', 12, 'dog'];
const INTRO = 'Five buckets, three keys. Try "act" (same letters as "cat", so the same hash) or 17 (17 mod 5 = 2, like 12).';
const SUGGEST = ['act', 17, 'bird', 'owl', 42, 'god', 7, 'emu', 'yak', 99, 'tac', 'fox', 23, 'ant', 'cow'];

const legend = [
  { color: palette.sky, label: 'Stored key' },
  { color: roleColor.look, label: 'Hashing / comparing' },
  { color: roleColor.new, label: 'Placed / found' },
  { color: roleColor.out, label: 'Collision / removed' },
];

export default function HashTablePage({ algo }) {
  const [text, setText] = useState('');
  const [hint, setHint] = useState(0);
  const { state, log, run, reset, player } = useOps(
    () => buildTable(SEED),
    (s, msg) => introStep(s, msg ?? INTRO),
    { speed: 3 },
  );
  const step = player.step;
  const stats = step?.stats ?? { size: 0, m: 5, collisions: 0 };

  const take = () => {
    const k = parseKey(text);
    setText('');
    if (k != null) return k;
    // suggest keys that are likely to collide with what is stored
    for (let n = 0; n < SUGGEST.length; n++) {
      const cand = SUGGEST[(hint + n) % SUGGEST.length];
      const inTable = state.buckets.some((b) => b.some((it) => it.key === cand));
      if (!inTable) {
        setHint((hint + n + 1) % SUGGEST.length);
        return cand;
      }
    }
    return Math.floor(Math.random() * 100);
  };

  return (
    <VisualizerLayout
      module={meta}
      algo={algo}
      player={player}
      stage={<HashTable2D step={step} />}
      code={htCode[step?.op] ?? htCode.insert}
      line={step?.line}
      message={step?.msg}
      legend={legend}
      stats={[
        { label: 'Keys', value: `${stats.size} / ${HT_MAX_KEYS}` },
        { label: 'Buckets (m)', value: stats.m },
        {
          label: 'Load factor',
          value: (stats.size / stats.m).toFixed(2),
          tone: stats.size / stats.m > MAX_LOAD ? 'text-coral' : 'text-mint',
        },
        { label: 'Collisions', value: stats.collisions, tone: 'text-coral' },
        { label: 'Resizes', value: stats.resizes ?? 0, tone: 'text-violet' },
        { label: 'Key comparisons', value: stats.probes ?? 0, tone: 'text-amber' },
      ]}
      controls={
        <>
          <ValueField
            label="Key (text or number)"
            value={text}
            onChange={setText}
            placeholder="suggested"
            width="w-36"
            onEnter={() => run((s) => htOps.insert(s, take()))}
          />
          <div className="flex flex-wrap gap-2">
            <Button tone="primary" onClick={() => run((s) => htOps.insert(s, take()))}>
              <Plus size={14} /> Insert
            </Button>
            <Button
              onClick={() => {
                const k = parseKey(text) ?? state.buckets.flat()[0]?.key ?? 'cat';
                setText('');
                run((s) => htOps.search(s, k));
              }}
            >
              <Search size={14} /> Search
            </Button>
            <Button
              tone="danger"
              onClick={() => {
                const all = state.buckets.flat();
                const k = parseKey(text) ?? all[Math.floor(Math.random() * all.length)]?.key ?? 'cat';
                setText('');
                run((s) => htOps.remove(s, k));
              }}
            >
              <Trash2 size={14} /> Remove
            </Button>
          </div>
          <Button tone="ghost" onClick={() => reset(buildTable(SEED))}>
            <RotateCcw size={14} /> Reset
          </Button>
          <OpsLog log={log} />
          <p className="w-full text-xs text-mist">
            Whole numbers hash to themselves; text hashes to the sum of its character codes. Leave the box empty to insert a
            suggested key chosen to cause collisions. The table doubles when the load factor passes {MAX_LOAD}.
          </p>
        </>
      }
    />
  );
}
