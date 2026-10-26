import { ColorPicker } from "@/components/ui/color-picker";
import { useResumeStore } from "@/store/useResumeStore";
import { Paintbrush } from "lucide-react";

export function FieldColor({ path, label }: { path: string; label?: string }) {
  const settings = useResumeStore((state) => state.activeResume?.globalSettings);
  const update = useResumeStore((state) => state.updateGlobalSettings);
  const current = settings?.fieldColors?.[path];
  return <ColorPicker aria-label={`${label || "此字段"}颜色`} title={`${label || "此字段"}颜色`} variant="ghost" className="ml-auto h-6 w-6 rounded-md border-0" style={{ backgroundColor: "transparent" }} value={current || "#18181B"} onChange={(color) => update({ fieldColors: { ...useResumeStore.getState().activeResume?.globalSettings?.fieldColors, [path]: color } })} onReset={() => { const colors = { ...useResumeStore.getState().activeResume?.globalSettings?.fieldColors }; delete colors[path]; update({ fieldColors: colors }); }}><Paintbrush className="h-3.5 w-3.5" style={{ color: current || "currentColor" }} /></ColorPicker>;
}
