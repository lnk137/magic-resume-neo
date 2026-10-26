import { ColorPicker } from "@/components/ui/color-picker";
import { useResumeStore } from "@/store/useResumeStore";
import type { TextColorRole } from "@/types/resume";

const ROLES: { role: TextColorRole; label: string; fallback: string }[] = [
  { role: "body", label: "正文", fallback: "#212529" },
  { role: "name", label: "姓名", fallback: "#18181B" },
  { role: "section", label: "模块标题", fallback: "#18181B" },
  { role: "title", label: "条目标题", fallback: "#18181B" },
  { role: "subtitle", label: "副标题", fallback: "#52525B" },
  { role: "date", label: "日期", fallback: "#52525B" },
];
export function TextColors() {
  const settings = useResumeStore((state) => state.activeResume?.globalSettings);
  const update = useResumeStore((state) => state.updateGlobalSettings);
  return <div className="mt-4 grid grid-cols-2 gap-x-5 gap-y-3 border-t pt-4">{ROLES.map(({ role, label, fallback }) => <div key={role} className="flex items-center justify-between gap-2"><span className="text-xs">{label}</span><ColorPicker value={settings?.textColors?.[role] || (role === "section" ? settings?.themeColor : undefined) || fallback} aria-label={`${label}默认颜色`} className="h-6 w-6 rounded-md" onChange={(color) => update({ textColors: { ...useResumeStore.getState().activeResume?.globalSettings?.textColors, [role]: color } })} onReset={() => { const colors = { ...useResumeStore.getState().activeResume?.globalSettings?.textColors }; delete colors[role]; update({ textColors: colors }); }} /></div>)}</div>;
}
