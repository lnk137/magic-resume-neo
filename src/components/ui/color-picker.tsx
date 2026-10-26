import { forwardRef, useEffect, useRef, useState } from "react";
import { HexColorPicker } from "react-colorful";
import { Check, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { contrastOnWhite, isTextColor } from "@/lib/textColors";
import type { ButtonProps } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

const SWATCHES = ["#18181B", "#52525B", "#A1A1AA", "#FFFFFF", "#7F1D1D", "#C2410C", "#A16207", "#3F6212", "#166534", "#0F766E", "#155E75", "#1E40AF", "#3730A3", "#6B21A8", "#9D174D", "#BE123C"];

export function ColorPalette({ value, onChange, onReset, onCommit }: {
  value: string; onChange: (color: string) => void; onReset?: () => void; onCommit?: () => void;
}) {
  const safeColor = isTextColor(value) ? value : "#18181B";
  const [hex, setHex] = useState(safeColor);
  const [recent, setRecent] = useState<string[]>([]);
  useEffect(() => setHex(safeColor), [safeColor]);
  useEffect(() => {
    try { const stored = JSON.parse(localStorage.getItem("neo-recent-colors") || "[]"); if (Array.isArray(stored)) setRecent(stored.filter(isTextColor).slice(0, 8)); } catch { /* Private storage may be unavailable. */ }
  }, []);
  const remember = (color: string) => {
    const next = [color, ...recent.filter((item) => item !== color)].slice(0, 8);
    setRecent(next);
    try { localStorage.setItem("neo-recent-colors", JSON.stringify(next)); } catch { /* Color selection still works without storage. */ }
  };
  const choose = (color: string) => { onChange(color); remember(color); onCommit?.(); };
  const ratio = contrastOnWhite(safeColor);
  const swatch = (color: string) => <button key={color} type="button" aria-label={`选择颜色 ${color}`} aria-pressed={safeColor.toUpperCase() === color.toUpperCase()} title={color} className="relative h-7 w-full rounded-md border border-black/10 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" style={{ backgroundColor: color }} onClick={() => choose(color)}>{safeColor.toUpperCase() === color.toUpperCase() && <Check className="mx-auto h-3.5 w-3.5" style={{ color: contrastOnWhite(color) > 4.5 ? "white" : "#18181B" }} />}</button>;
  return <div className="space-y-4" onPointerUp={() => { remember(safeColor); onCommit?.(); }}>
    <div className="flex items-center justify-between"><span className="text-sm font-medium">文字颜色</span>{onReset && <Button type="button" size="sm" variant="ghost" className="h-7 gap-1.5 px-2 text-xs" onClick={onReset}><RotateCcw className="h-3 w-3" />恢复默认</Button>}</div>
    <div className="overflow-hidden rounded-xl [&_.react-colorful]:h-40 [&_.react-colorful]:w-full [&_.react-colorful__saturation]:rounded-t-xl [&_.react-colorful__hue]:h-3 [&_.react-colorful__hue]:rounded-b-xl [&_.react-colorful__pointer]:h-4 [&_.react-colorful__pointer]:w-4"><HexColorPicker color={safeColor} onChange={onChange} /></div>
    <div className="flex items-center gap-2"><div className="h-9 w-9 shrink-0 rounded-lg border border-black/10" style={{ backgroundColor: safeColor }} /><Input aria-label="HEX 颜色值" value={hex} maxLength={7} spellCheck={false} className="h-9 font-mono uppercase" onChange={(event) => { const next = event.target.value; setHex(next); const normalized = next.startsWith("#") ? next : `#${next}`; if (isTextColor(normalized)) choose(normalized); }} onBlur={() => setHex(safeColor)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); onCommit?.(); } }} /></div>
    <div className="grid grid-cols-8 gap-1.5">{SWATCHES.map(swatch)}</div>
    {recent.length > 0 && <div><div className="mb-2 text-xs text-muted-foreground">最近使用</div><div className="grid grid-cols-8 gap-1.5">{recent.map(swatch)}</div></div>}
    <div className="flex items-center justify-between border-t pt-3 text-xs text-muted-foreground"><span style={{ color: safeColor, backgroundColor: "white" }} className="rounded px-2 py-1 font-medium">Aa 文字预览</span><span title="相对白色纸张的对比度">{ratio.toFixed(1)}:1 · {ratio >= 4.5 ? "清晰" : ratio >= 3 ? "适合大字" : "浅色"}</span></div>
  </div>;
}

interface ColorPickerProps extends Omit<ButtonProps, "value" | "onChange" | "onBlur"> {
  value: string; onChange: (value: string) => void; onBlur?: () => void; onReset?: () => void;
}

const ColorPicker = forwardRef<HTMLButtonElement, ColorPickerProps>(({ disabled, value, onChange, onBlur, onReset, className, ...props }, ref) => {
  const [open, setOpen] = useState(false);
  const latest = useRef(value);
  const openValue = useRef(value);
  const parsed = isTextColor(value) ? value : "#18181B";
  return <Popover open={open} onOpenChange={(next) => { if (next) { openValue.current = value; latest.current = value; } else if (latest.current !== openValue.current) { onChange(latest.current); onBlur?.(); } setOpen(next); }}>
    <PopoverTrigger asChild><Button {...props} ref={ref} type="button" disabled={disabled} className={cn("h-9 w-9 overflow-hidden rounded-lg border border-black/10 p-0 transition-transform hover:scale-105 focus-visible:ring-2", className)} style={{ backgroundColor: parsed, ...props.style }}>{props.children || <span className="sr-only">选择颜色</span>}</Button></PopoverTrigger>
    <PopoverContent align="end" className="w-[280px] max-w-[calc(100vw-24px)] rounded-2xl p-4 shadow-xl" onOpenAutoFocus={(event) => event.preventDefault()}><ColorPalette value={parsed} onChange={(color) => { latest.current = color; onChange(color); }} onReset={onReset ? () => { onReset(); setOpen(false); } : undefined} onCommit={onBlur} /></PopoverContent>
  </Popover>;
});
ColorPicker.displayName = "ColorPicker";
export { ColorPicker };
