export function DividerDimensions({ width, thickness, onWidthChange, onThicknessChange, labels }: {
  width: number;
  thickness: number;
  onWidthChange: (value: number) => void;
  onThicknessChange: (value: number) => void;
  labels: { width: string; thickness: string };
}) {
  return (
    <div className="space-y-3">
      <label className="flex items-center gap-3 text-sm">
        <span className="shrink-0">{labels.width}</span>
        <input aria-label={labels.width} className="min-w-0 flex-1 accent-foreground" type="range" min="1" max="100" step="1" value={width} onChange={(event) => onWidthChange(Number(event.target.value))} />
        <span className="w-12 text-right tabular-nums text-muted-foreground">{width}%</span>
      </label>
      <label className="flex items-center gap-3 text-sm">
        <span className="shrink-0">{labels.thickness}</span>
        <input aria-label={labels.thickness} className="min-w-0 flex-1 accent-foreground" type="range" min="0.5" max="5" step="0.5" value={thickness} onChange={(event) => onThicknessChange(Number(event.target.value))} />
        <span className="w-12 text-right tabular-nums text-muted-foreground">{thickness}px</span>
      </label>
    </div>
  );
}

export function DividerSpaceHeight({ height, onChange, label }: { height: number; onChange: (value: number) => void; label: string }) {
  return (
    <label className="flex items-center gap-3 text-sm">
      <span className="shrink-0">{label}</span>
      <input aria-label={label} className="min-w-0 flex-1 accent-foreground" type="range" min="1" max="100" step="1" value={height} onChange={(event) => onChange(Number(event.target.value))} />
      <span className="w-12 text-right tabular-nums text-muted-foreground">{height}px</span>
    </label>
  );
}
