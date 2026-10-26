import { useState } from "react";
import { Plus } from "lucide-react";
import { useResumeStore } from "@/store/useResumeStore";
import { useTranslations } from "@/i18n/compat/client";
import { STANDARD_MODULES } from "@/config/modules";
import { DEFAULT_TEMPLATES } from "@/config";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

/** Kept inside the editor so collapsed sidebars never strand a user in a section. */
export function ModuleNavigation() {
  const [open, setOpen] = useState(false);
  const { activeResume, setActiveSection, updateMenuSections, createCustomSection } = useResumeStore();
  const t = useTranslations("workbench.sidePanel");
  if (!activeResume) return null;
  const { menuSections, customData, activeSection } = activeResume;
  const template = DEFAULT_TEMPLATES.find((entry) => entry.id === activeResume.templateId) ?? DEFAULT_TEMPLATES[0];
  const available = (template?.availableSections ?? [])
    .map((id) => STANDARD_MODULES[id])
    .filter((entry) => entry && !menuSections.some((section) => section.id === entry.id));
  const addCustom = () => {
    let next = 1;
    while (menuSections.some((section) => section.id === `custom-${next}`) || customData?.[`custom-${next}`]) next++;
    createCustomSection({ id: `custom-${next}`, title: "自定义模块", icon: "➕", enabled: true, order: menuSections.length });
    setOpen(false);
  };
  return (
    <nav aria-label="模块导航" className="sticky top-0 z-20 flex items-center gap-2 border-b border-border bg-background/95 px-4 py-3 backdrop-blur-sm">
      <Select value={activeSection || menuSections[0]?.id} onValueChange={setActiveSection}>
        <SelectTrigger aria-label="切换模块" className="min-w-0 flex-1 bg-card">
          <SelectValue placeholder="切换模块" />
        </SelectTrigger>
        <SelectContent>
          {menuSections.map((section) => (
            <SelectItem key={section.id} value={section.id}>{section.title}{section.enabled ? "" : " · 已隐藏"}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="shrink-0 gap-1.5"><Plus className="h-4 w-4" />添加模块</Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-56 p-1.5">
          {available.map((module) => (
            <button key={module.id} className="flex w-full rounded-md px-3 py-2 text-left text-sm hover:bg-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring" onClick={() => {
              updateMenuSections([...menuSections, { id: module.id, title: t(`layout.standardSections.${module.titleKey}`), icon: module.icon, enabled: true, order: menuSections.length }]);
              setActiveSection(module.id);
              setOpen(false);
            }}>{t(`layout.standardSections.${module.titleKey}`)}</button>
          ))}
          {available.length > 0 && <div className="my-1 h-px bg-border" />}
          <button onClick={addCustom} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"><Plus className="h-4 w-4" />添加自定义模块</button>
        </PopoverContent>
      </Popover>
    </nav>
  );
}
