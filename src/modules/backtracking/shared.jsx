export function StageLoading() {
  return <div className="absolute inset-0 grid place-items-center text-sm text-mist">Loading 3D scene…</div>;
}

/** Labelled wrapper so segmented controls line up with sliders in the controls row. */
export function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs text-mist">{label}</span>
      {children}
    </div>
  );
}
