# Module guide

How to add a visualizer module to AlgoAnimate. `src/modules/sorting/` is the reference implementation.

## Contract

Each module lives in `src/modules/<id>/` and must export:

- `meta.js` (default export)
  ```js
  export default {
    id: '<id>',                 // matches the folder and the route /<id>/:algo
    title: 'Graphs',
    tagline: 'One plain sentence about what you can do here.',
    algorithms: [
      { id: 'bfs', name: 'Breadth-first search', summary: 'One plain sentence.',
        complexity: { best, avg, worst, space } },   // any subset; strings like 'O(V + E)'
    ],
  };
  ```
- `Page.jsx` (default export): the page. Read the active algorithm with `useAlgo(meta)` (`src/core/useAlgo.js`).

The module is already registered in `src/app/catalog.js`, so nothing outside the folder needs editing.

## The step-trace model

Every algorithm runs **up front** and records an array of immutable step objects. Playback is just an index into that array, so play, pause, step back and scrubbing all work for free.

A step is any plain object your stage understands. By convention it includes:
- `line`: the active pseudocode line (0-based index into your `code` array), or `null`
- `msg`: one plain-English sentence narrating the step
- `stats`: counters to show in the side panel

Keep snapshots cheap: copy only what changes, and cap runs (for example at 20k steps).

## Core APIs

- `usePlayer(steps, { initialSpeed, onStep })` in `src/core/usePlayer.js` returns `{ index, step, total, playing, speed, setSpeed, play, pause, toggle, next, prev, seek, reset, done }`. Re-create `steps` with `useMemo` whenever the input changes; the player resets itself.
- `VisualizerLayout` in `src/core/ui/VisualizerLayout.jsx` is the page frame: header, algorithm chips, stage, transport, controls row, and a side panel with narration, pseudocode, stats and complexity. Props: `module, algo, player, stage, stageBar, controls, code, line, message, stats=[{label,value,tone}], legend=[{color,label}], sound`.
- `ViewToggle` in `src/core/ui/ViewToggle.jsx` switches 2D, 3D and Physics. Pass `modes` to choose which are offered.
- Controls in `src/core/ui/controls.jsx` (built on shadcn/ui components in `src/components/ui`; Aceternity effects live in `src/components/aceternity`): `Button (tone: primary|plain|ghost|danger)`, `IconButton`, `Segmented`, `Slider`, `Select`, `NumberInput`, `cx`.
- `Scene` in `src/core/three/Scene.jsx` is a ready-made R3F Canvas with blueprint grid floor, lights, bloom and orbit controls. Props: `camera, target, grid, effects, controls, autoRotate, floorY, shadows, fitWidth`. Load 3D and physics views with `React.lazy` so 2D pages stay light.
- `palette` in `src/core/theme.js` holds the color tokens for canvas, SVG and three.js.
- `blip(ratio, opts)` in `src/core/audio.js` plays an optional sound tick (0..1 maps to pitch). It only sounds when the user turns sound on.
- Array algorithms can reuse `trace()`, `createArrayTracer()` and `presets` from `src/core/arrayTracer.js`, plus the `ArrayBars2D`, `ArrayBars3D` and `ArrayBarsPhysics` stages in `src/core/viz/`.

## Visual language

"Indigo night": zinc-black surfaces with indigo and fuchsia accents. Every color is a CSS variable in `src/index.css` (mirrored in `src/core/theme.js` for canvas and three.js), so re-theming happens in one place. Colors carry meaning, so use them consistently:

| token  | hex     | meaning |
|--------|---------|---------|
| sky    | #818CF8 | default element / idle (indigo) |
| amber  | #FBBF24 | being examined / compared / current |
| coral  | #FB7185 | being changed: swap, write, removal, conflict |
| violet | #E879F9 | special role: pivot, key, start node, frontier (fuchsia) |
| mint   | #34D399 | settled / final / found / path |
| line   | #272734 | borders, walls, inactive edges |
| mist   | #A1A1B2 | secondary text |
| paper  | #F4F4F7 | primary text |

Tailwind classes exist for all of them (`text-amber`, `bg-panel`, `border-line`…). Fonts: `font-display` for headings, `font-sans` for body, `font-mono` only for code and values.

In 3D, "hot" elements get `emissive` = their color at `emissiveIntensity` about 2 with `toneMapped={false}` so bloom picks them up. Idle elements stay matte.

Copy is plain and specific: sentence case, active voice, no marketing.
