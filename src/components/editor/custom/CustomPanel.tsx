import { cloneCustomItems } from "@/lib/customItems";
import { memo } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Reorder } from "framer-motion";
import { PlusCircle, Copy } from "lucide-react";
import CustomItem from "./CustomItem";
import { useResumeStore } from "@/store/useResumeStore";
import { CustomItem as CustomItemType } from "@/types/resume";

const CustomPanel = memo(({ sectionId }: { sectionId: string }) => {
  const { addCustomItem, updateCustomData, activeResume, updateResume } = useResumeStore();
  const { customData } = activeResume || {};
  const items = customData?.[sectionId] || [];
  const handleCreateItem = () => {
    addCustomItem(sectionId);
  };

  return (
    <div
      className={cn(
        "space-y-4 px-4 py-4 rounded-lg",
        "bg-card"
      )}
    >
      <div className="flex justify-end">
        <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground" onClick={() => {
          if (!activeResume) return;
          const section = activeResume.menuSections.find((entry) => entry.id === sectionId);
          if (!section) return;
          let next = 1;
          while (activeResume.menuSections.some((entry) => entry.id === `custom-${next}`) || activeResume.customData[`custom-${next}`]) next++;
          const id = `custom-${next}`;
          const { items: copies, fieldColors } = cloneCustomItems(items, sectionId, id, activeResume.globalSettings?.fieldColors);
          const sectionColor = activeResume.globalSettings?.fieldColors?.[`sections.${sectionId}.title`];
          if (sectionColor) fieldColors[`sections.${id}.title`] = sectionColor;
          updateResume(activeResume.id, {
            menuSections: [...activeResume.menuSections, { ...section, id, title: `${section.title} 副本`, order: activeResume.menuSections.length }],
            customData: { ...activeResume.customData, [id]: copies },
            globalSettings: { ...activeResume.globalSettings, fieldColors },
            activeSection: id,
          });
        }}><Copy className="h-4 w-4" />复制模块</Button>
      </div>
      <Reorder.Group
        axis="y"
        values={items}
        onReorder={(newOrder) => {
          updateCustomData(sectionId, newOrder);
        }}
        className="space-y-3"
      >
        {items.map((item: CustomItemType) => (
          <CustomItem key={item.id} item={item} sectionId={sectionId} />
        ))}

        <Button onClick={handleCreateItem} className={cn("w-full")}>
          <PlusCircle className="w-4 h-4 mr-2" />
          添加
        </Button>
      </Reorder.Group>
    </div>
  );
});

CustomPanel.displayName = "CustomPanel";

export default CustomPanel;
